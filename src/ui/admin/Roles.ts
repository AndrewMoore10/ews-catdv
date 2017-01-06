module ui.admin
{
    import HtmlUtil = util.HtmlUtil;
    import DataTable = controls.DataTable;
    import Button = controls.Button;
    import TextBox = controls.TextBox;
    import DropDownList = controls.DropDownList;
    import CheckBox = controls.CheckBox;
    import RadioButton = controls.RadioButton;
    import ListBox = controls.ListBox;
    import Label = controls.Label;
    import CheckList = controls.CheckList;
    import ListItem = controls.ListItem;
    import SimpleServerDataSource = controls.SimpleServerDataSource;
    import SimpleDataSourceParams = controls.SimpleDataSourceParams;
    import SimpleArrayDataSource = controls.SimpleArrayDataSource;
    import MessageBox = controls.MessageBox;

    import $catdv = catdv.RestApi;
    import Role = catdv.Role;
    import Group = catdv.Group;
    import NavbarLoginMenu = ui.panels.NavbarLoginMenu;

    export class RolesForm
    {
        private rolesTable: DataTable;
        private navbarLoginMenu = new NavbarLoginMenu("navbarLoginMenu");

        private btnAddRole: Button = new Button("btnAddRole");
        private btnDeleteRole: Button = new Button("btnDeleteRole");
        private editRoleDialog = new EditRoleDialog("editRoleDialog");
        private editRolePermissionsDialog = new EditRolePermissionsDialog("editRolePermissionsDialog");

        constructor()
        {
            var columns = [
                {
                    title: "Name",
                    dataProp: "name",
                    isSortable: true,
                    renderer: (obj: any, val: any) =>
                    {
                        return "<a href='javascript:$page.editRole(" + obj.ID + ")' title='ID:" + obj.ID + "'>" + HtmlUtil.escapeHtml(obj.name) + "</a>";
                    }
                },
                {
                    title: "Notes",
                    dataProp: "notes"
                }
            ];

            if (!catdv.settings.useAccessControlLists)   
            {
                columns.push({
                    title: "Permissions",
                    dataProp: "ID",
                    renderer: (obj: any, val: any) =>
                    {
                        return "<a href='javascript:$page.editRolePermissions(" + val + ")'>Edit Permissions</a>";
                    }
                });
            }

           this.rolesTable = new DataTable("rolesTable", {
                columns: columns,
                simpleDataSource: new SimpleServerDataSource((params: SimpleDataSourceParams, callback: (results: any[]) => void) =>
                {
                    $catdv.getRoles(params, function(data)
                    {
                        callback(data);
                    });
                })
            });

            this.btnAddRole.onClick((evt) =>
            {
                this.editRoleDialog.setRole(null);
                this.editRoleDialog.onOK(() =>
                {
                    this.rolesTable.reload();
                });
                this.editRoleDialog.show();
            });

            this.btnDeleteRole.onClick((evt) =>
            {
                this.deleteRole(this.rolesTable.getSelectedItem());
            });
        }

        editRole(roleId: number)
        {
            var selectedRole = this.rolesTable.findItem((o) => { return o.ID == roleId });
            this.editRoleDialog.setRole(selectedRole);
            this.editRoleDialog.onOK(() =>
            {
                this.rolesTable.reload();
            });
            this.editRoleDialog.show();
        }

        public editRolePermissions(roleId: number)
        {
            var selectedRole = this.rolesTable.findItem((o) => { return o.ID == roleId });
            this.editRolePermissionsDialog.setRole(selectedRole);
            this.editRolePermissionsDialog.onOK(() =>
            {
                this.rolesTable.reload();
            });
            this.editRolePermissionsDialog.show();
        }

        public deleteRole(role: Role)
        {
            MessageBox.confirm("Are you sure you want to delete '" + role.name + "'", () =>
            {
                $catdv.deleteRole(role.ID, (reply) =>
                {
                    this.rolesTable.reload();
                });
            });
        }
    }

    class EditRoleDialog extends controls.Modal
    {
        private txtName: TextBox = new TextBox("txtName");
        private txtNotes: TextBox = new TextBox("txtNotes");
        private chkAdvancedUI: CheckBox = new CheckBox("chkAdvancedUI");
        private btnNewRoleOK: Button = new Button("btnEditRoleOK");

        private roleID: number;

        constructor(elementId: string)
        {
            super(elementId);

            this.btnNewRoleOK = new Button("btnEditRoleOK");
            this.btnNewRoleOK.onClick((evt: any) =>
            {
                this.btnOK_onClick(evt);
            });
        }

        public setRole(role: any)
        {
            // clear the permission checkboxes
            if (role != null)
            {
                this.roleID = role.ID;
                this.txtName.setText(role.name);
                this.txtNotes.setText(role.notes);
                this.chkAdvancedUI.setChecked(role.advancedUI);
            }
            else
            {
                this.roleID = null;
                this.txtName.setText("");
                this.txtNotes.setText("");
            }
        }

        private btnOK_onClick(evt: any)
        {
            var permissions: string[] = [];

            var role =
                {
                    ID: this.roleID,
                    name: this.txtName.getText(),
                    notes: this.txtNotes.getText(),
                    advancedUI: this.chkAdvancedUI.isChecked()
                };

            $catdv.saveRole(role, () =>
            {
                this.close(true);
            });
        }
    }

    class EditRolePermissionsDialog extends EditPermissionsDialog
    {
        private listGroups: CheckList;
        private lblTitle = new Label("lblEditRolePermissionsTitle");
        private btnOK = new Button("btnEditRolePermissionsOK");

        private datasource = new SimpleArrayDataSource<ListItem>();
        private role: Role;
        private groups: Group[] = [];
        private currentGroupIndex: number = null;

        constructor(elementId: string)
        {
            super(elementId, "2");

            this.listGroups = new CheckList("listGroups", false, this.datasource);
            this.listGroups.onCurrentItemChanged((evt) =>
            {
                this.readPermissions();
                this.currentGroupIndex = this.listGroups.getCurrentItemIndex();
                this.updatePermissions();
            });

            this.btnOK.onClick((evt: any) =>
            {
                this.btnOK_onClick(evt);
            });
        }

        public setRole(role: any)
        {
            this.role = role;
            this.lblTitle.setText("Permissions for Role '" + role.name + "'");

            $catdv.getRoleGroupPermissions(this.role.ID, (groups: Group[]) =>
            {
                this.groups = groups;
                this.currentGroupIndex = null;
                this.datasource.setItems(groups.map((group) =>
                {
                    return {
                        value: group,
                        text: group.name,
                        isSelected: group.permissions ? true : false
                    };
                }));
                this.listGroups.reload();
                this.updatePermissions();
            });
        }

        // if there is a group selected read the permissions from the checkboxes
        private readPermissions()
        {
            if (this.currentGroupIndex != null)
            {
                if (this.listGroups.isChecked(this.currentGroupIndex))
                {
                    this.groups[this.currentGroupIndex].permissions = this.readPermissionCheckboxes();
                }
                else
                {
                    this.groups[this.currentGroupIndex].permissions = null;
                }
            }
        }

        private updatePermissions()
        {
            if (this.currentGroupIndex != null)
            {
                var currentGroup = this.groups[this.currentGroupIndex];
                if (this.listGroups.isChecked(this.currentGroupIndex))
                {
                    currentGroup.permissions = currentGroup.permissions || currentGroup.defaultPermissions;
                }
                else
                {
                    currentGroup.permissions = null;
                }
                this.setPermissionCheckboxes(currentGroup.permissions);

            }
            else
            {
                this.setPermissionCheckboxes(null);
            }
        }

        private btnOK_onClick(evt: any)
        {
            this.readPermissions();

            // only interested in permissions so strip everything else out
            var groupPermissions: Group[] = [];
            this.groups.forEach((group) =>
            {
                groupPermissions.push({
                    ID: group.ID,
                    permissions: group.permissions
                });
            });

            $catdv.updateRoleGroupPermissions(this.role.ID, groupPermissions, () =>
            {
                this.close(true);
            });
        }
    }
}

