module ui.admin
{
    import HtmlUtil = util.HtmlUtil;
    import SimpleServerDataSource = controls.SimpleServerDataSource;
    import SimpleDataSourceParams = controls.SimpleDataSourceParams;
    import DataTable = controls.DataTable;
    import Button = controls.Button;
    import TextBox = controls.TextBox;
    import DropDownList = controls.DropDownList;
    import TabPanel = controls.TabPanel;
    import Alert = controls.Alert;
    import MessageBox = controls.MessageBox;
    
    import $catdv = catdv.RestApi;
    import FieldDefinition = catdv.FieldDefinition;
    import User = catdv.User;

    import FieldBinding = logic.FieldBinding;
    import DetailPanelField = logic.DetailPanelField;
    import DetailFieldFactory = logic.DetailFieldFactory;
    import UserFieldAccessor = logic.UserFieldAccessor;

    import NavbarLoginMenu = ui.panels.NavbarLoginMenu;

    export class UsersForm
    {
        private usersTable: DataTable;
        private btnAddUser: Button = new Button("btnAddUser");
        private btnDeleteUser: Button = new Button("btnDeleteUser");
        private navbarLoginMenu = new NavbarLoginMenu("navbarLoginMenu");

        private addUserDialog = new AddUserDialog("addUserDialog");
        private editUserDialog = new EditUserDialog("editUserDialog");
        private changePasswordDialog = new ChangePasswordDialog("changePasswordDialog");

        constructor()
        {
            this.usersTable = new DataTable("usersTable", {
                columns: [
                    {
                        title: "Name",
                        dataProp: "name",
                        isSortable: true,
                        renderer: (obj: any, val: any) =>
                        {
                            return "<a href='javascript:$page.editUser(" + obj.ID + ")' title='ID:" + obj.ID + "'>" + HtmlUtil.escapeHtml(obj.name) + "</a>";
                        }
                    },
                    { title: "Notes", dataProp: "notes" },
                    { title: "Role", dataProp: "role" },
                    {
                        title: "Password",
                        dataProp: "ID",
                        renderer: (obj: any, val: any) =>
                        {
                            return "<a href='javascript:$page.changePassword(" + obj.ID + ")'>" + (obj.password ? "Change Password" : "Set Password") + "</a>";
                        }
                    }
                ],
                simpleDataSource: new SimpleServerDataSource((params : SimpleDataSourceParams, callback: (users: any[]) => void) =>
                {
                    $catdv.getUsers(params, (data) =>
                    {
                        callback(data);
                    });
                })
            });

            this.btnAddUser.onClick((evt) =>
            {
                this.addUserDialog.onOK(() =>
                {
                    this.usersTable.reload();
                });
                this.addUserDialog.show();
            });

            this.btnDeleteUser.onClick((evt) =>
            {
                this.deleteUser(this.usersTable.getSelectedItem());
            });
        }

        public editUser(userId: number)
        {
            this.editUserDialog.setUserID(userId);
            this.editUserDialog.onOK(() =>
            {
                this.usersTable.reload();
            });
            this.editUserDialog.show();
        }

        public changePassword(userId: number)
        {
            var selectedUser = this.usersTable.findItem((o) => { return o.ID == userId });
            this.changePasswordDialog.setUser(selectedUser);
            this.changePasswordDialog.onOK(() =>
            {
                this.usersTable.reload();
            });
            this.changePasswordDialog.show();
        }

        public deleteUser(user: User)
        {
            MessageBox.confirm("Are you sure you want to delete '" + user.name + "'", () =>
            {
                $catdv.deleteUser(user.ID,(reply) =>
                {
                    this.usersTable.reload();
                });
            });
        }

    }

    class AddUserDialog extends controls.Modal
    {
        private txtName: TextBox = new TextBox("txtName");
        private txtNotes: TextBox = new TextBox("txtNotes");
        private txtPassword1: TextBox = new TextBox("txtPassword1");
        private txtPassword2: TextBox = new TextBox("txtPassword2");
        private lstRole: DropDownList = new DropDownList("lstRole");

        private btnNewUserOK: Button = new Button("btnNewUserOK");
        private alertPasswordMismatch: Alert = new Alert("alertPasswordMismatch");
        private alertMissingData: Alert = new Alert("alertMissingData");

        constructor(elementId: string)
        {
            super(elementId);

            this.btnNewUserOK.onClick((evt: any) =>
            {
                this.btnOK_onClick(evt);
            });
        }

        private btnOK_onClick(evt: any)
        {
            this.alertPasswordMismatch.hide();
            this.alertMissingData.hide();

            if (this.txtName.getText() == "")
            {
                this.alertMissingData.show();
            }
            else if (this.txtPassword1.getText() != this.txtPassword2.getText())
            {
                this.alertPasswordMismatch.show();
            }
            else
            {
                var user : User =
                    {
                        name: this.txtName.getText(),
                        notes: this.txtNotes.getText(),
                        password: this.txtPassword1.getText(),
                        roleID: Number(this.lstRole.getSelectedValue())
                    };

                $catdv.insertUser(user,() =>
                {
                    this.close(true);
                });
            }
        }
    }


    class EditUserDialog extends controls.Modal
    {
        private tabsUserDetails = new TabPanel("tabsUserDetails");
        private txtName = new TextBox("txtNewName");
        private txtNotes = new TextBox("txtNewNotes");
        private lstRole = new DropDownList("lstNewRole");
        private btnNewUserOK = new Button("btnEditUserOK");

        private userID: number;
        private fieldBindings: FieldBinding[] = [];

        constructor(elementId: string)
        {
            super(elementId);

            this.btnNewUserOK.onClick((evt: any) =>
            {
                this.btnOK_onClick(evt);
            });

            $catdv.getFields({ "include": "user,picklists,values" },(rs) =>
            {
                var fields = rs.items;
                if (fields.length > 0)
                {
                    this.tabsUserDetails.showTab("CustomFields");
                    this.buildCustomFieldPanel(fields);
                }
                else
                {
                    this.tabsUserDetails.hideTab("CustomFields");
                }
            });
        }

        // Override
        public show()
        {
            super.show();
            this.tabsUserDetails.selectTab("Details");
        }

        public setUserID(userID: number)
        {
            this.userID = userID;
            $catdv.getUser(userID,(user) =>
            {
                this.txtName.setText(user.name);
                this.txtNotes.setText(user.notes);
                this.lstRole.setSelectedValue(String(user.roleID));

                this.fieldBindings.forEach((fieldBinding) =>
                {
                    fieldBinding.originalValue = fieldBinding.fieldAccessor.getValue(user);
                    fieldBinding.detailField.setValue(fieldBinding.originalValue);
                });
            });
        }

        private buildCustomFieldPanel(fields: FieldDefinition[])
        {
            var $form = $("#tabCustomFields");
            var linkedFields: DetailPanelField[] = [];
            fields.forEach((fieldDefinition, f) =>
            {
                var fieldID = "userField_F_" + f;

                var fieldName = fieldDefinition.isBuiltin ? fieldDefinition.name.split("/")[0] : fieldDefinition.name;
                var $formItem = $("<div class='form-group detail-field'></div>").appendTo($form);
                var $label = $("<label for='" + fieldID + "'>" + HtmlUtil.escapeHtml(fieldName) + ":</label>").appendTo($formItem);
                var detailField = DetailFieldFactory.createField(fieldID, { fieldDefinition: fieldDefinition }, $formItem);
                detailField.setEditable(true);
                this.fieldBindings.push(new FieldBinding(detailField, new UserFieldAccessor(fieldDefinition)));
            });
        }

        private btnOK_onClick(evt: any)
        {
            var user =
                {
                    ID: this.userID,
                    name: this.txtName.getText(),
                    notes: this.txtNotes.getText(),
                    roleID: Number(this.lstRole.getSelectedValue()),
                };

            if (this.fieldBindings.length > 0)
            {
                this.fieldBindings.forEach((fieldBinding) =>
                {
                    var fieldValue = fieldBinding.detailField.getValue();
                    var newValue = fieldValue ? String(fieldValue) : "";
                    var originalValue = fieldBinding.originalValue ? String(fieldBinding.originalValue) : "";
                    if (newValue != originalValue)
                    {
                        fieldBinding.fieldAccessor.setValue(user, fieldValue);
                    }
                });
            }
            $catdv.updateUser(user,() =>
            {
                this.close(true);
            });
        }
    }

    class ChangePasswordDialog extends controls.Modal
    {
        private lblName: TextBox = new TextBox("lblName");
        private txtPassword1: TextBox = new TextBox("txtNewPassword1");
        private txtPassword2: TextBox = new TextBox("txtNewPassword2");

        private btnChangePasswordOK: Button = new Button("btnChangePasswordOK");
        private alertPasswordMismatch: Alert = new Alert("alertNewPasswordMismatch");

        private userID: number;

        constructor(elementId: string)
        {
            super(elementId);

            this.btnChangePasswordOK.onClick((evt: any) =>
            {
                this.btnOK_onClick(evt);
            });
        }

        public setUser(user: any)
        {
            this.userID = user.ID;
            this.lblName.setText(user.name);
        }

        private btnOK_onClick(evt: any)
        {
            this.alertPasswordMismatch.hide();

            if (this.txtPassword1.getText() != this.txtPassword2.getText())
            {
                this.alertPasswordMismatch.show();
            }
            else
            {
                var user =
                    {
                        ID: this.userID,
                        password: this.txtPassword1.getText(),
                    };

                $catdv.updateUser(user,() =>
                {
                    this.close(true);
                });
            }
        }
    }


}


