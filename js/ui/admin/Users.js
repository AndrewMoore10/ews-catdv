var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var ui;
(function (ui) {
    var admin;
    (function (admin) {
        var HtmlUtil = util.HtmlUtil;
        var SimpleServerDataSource = controls.SimpleServerDataSource;
        var DataTable = controls.DataTable;
        var Button = controls.Button;
        var TextBox = controls.TextBox;
        var DropDownList = controls.DropDownList;
        var TabPanel = controls.TabPanel;
        var Alert = controls.Alert;
        var MessageBox = controls.MessageBox;
        var $catdv = catdv.RestApi;
        var FieldBinding = logic.FieldBinding;
        var DetailFieldFactory = logic.DetailFieldFactory;
        var UserFieldAccessor = logic.UserFieldAccessor;
        var NavbarLoginMenu = ui.panels.NavbarLoginMenu;
        var UsersForm = (function () {
            function UsersForm() {
                var _this = this;
                this.btnAddUser = new Button("btnAddUser");
                this.btnDeleteUser = new Button("btnDeleteUser");
                this.navbarLoginMenu = new NavbarLoginMenu("navbarLoginMenu");
                this.addUserDialog = new AddUserDialog("addUserDialog");
                this.editUserDialog = new EditUserDialog("editUserDialog");
                this.changePasswordDialog = new ChangePasswordDialog("changePasswordDialog");
                this.usersTable = new DataTable("usersTable", {
                    columns: [
                        {
                            title: "Name",
                            dataProp: "name",
                            isSortable: true,
                            renderer: function (obj, val) {
                                return "<a href='javascript:$page.editUser(" + obj.ID + ")' title='ID:" + obj.ID + "'>" + HtmlUtil.escapeHtml(obj.name) + "</a>";
                            }
                        },
                        { title: "Notes", dataProp: "notes" },
                        { title: "Role", dataProp: "role" },
                        {
                            title: "Password",
                            dataProp: "ID",
                            renderer: function (obj, val) {
                                return "<a href='javascript:$page.changePassword(" + obj.ID + ")'>" + (obj.password ? "Change Password" : "Set Password") + "</a>";
                            }
                        }
                    ],
                    simpleDataSource: new SimpleServerDataSource(function (params, callback) {
                        $catdv.getUsers(params, function (data) {
                            callback(data);
                        });
                    })
                });
                this.btnAddUser.onClick(function (evt) {
                    _this.addUserDialog.onOK(function () {
                        _this.usersTable.reload();
                    });
                    _this.addUserDialog.show();
                });
                this.btnDeleteUser.onClick(function (evt) {
                    _this.deleteUser(_this.usersTable.getSelectedItem());
                });
            }
            UsersForm.prototype.editUser = function (userId) {
                var _this = this;
                this.editUserDialog.setUserID(userId);
                this.editUserDialog.onOK(function () {
                    _this.usersTable.reload();
                });
                this.editUserDialog.show();
            };
            UsersForm.prototype.changePassword = function (userId) {
                var _this = this;
                var selectedUser = this.usersTable.findItem(function (o) { return o.ID == userId; });
                this.changePasswordDialog.setUser(selectedUser);
                this.changePasswordDialog.onOK(function () {
                    _this.usersTable.reload();
                });
                this.changePasswordDialog.show();
            };
            UsersForm.prototype.deleteUser = function (user) {
                var _this = this;
                MessageBox.confirm("Are you sure you want to delete '" + user.name + "'", function () {
                    $catdv.deleteUser(user.ID, function (reply) {
                        _this.usersTable.reload();
                    });
                });
            };
            return UsersForm;
        }());
        admin.UsersForm = UsersForm;
        var AddUserDialog = (function (_super) {
            __extends(AddUserDialog, _super);
            function AddUserDialog(elementId) {
                var _this = this;
                _super.call(this, elementId);
                this.txtName = new TextBox("txtName");
                this.txtNotes = new TextBox("txtNotes");
                this.txtPassword1 = new TextBox("txtPassword1");
                this.txtPassword2 = new TextBox("txtPassword2");
                this.lstRole = new DropDownList("lstRole");
                this.btnNewUserOK = new Button("btnNewUserOK");
                this.alertPasswordMismatch = new Alert("alertPasswordMismatch");
                this.alertMissingData = new Alert("alertMissingData");
                this.btnNewUserOK.onClick(function (evt) {
                    _this.btnOK_onClick(evt);
                });
            }
            AddUserDialog.prototype.btnOK_onClick = function (evt) {
                var _this = this;
                this.alertPasswordMismatch.hide();
                this.alertMissingData.hide();
                if (this.txtName.getText() == "") {
                    this.alertMissingData.show();
                }
                else if (this.txtPassword1.getText() != this.txtPassword2.getText()) {
                    this.alertPasswordMismatch.show();
                }
                else {
                    var user = {
                        name: this.txtName.getText(),
                        notes: this.txtNotes.getText(),
                        password: this.txtPassword1.getText(),
                        roleID: Number(this.lstRole.getSelectedValue())
                    };
                    $catdv.insertUser(user, function () {
                        _this.close(true);
                    });
                }
            };
            return AddUserDialog;
        }(controls.Modal));
        var EditUserDialog = (function (_super) {
            __extends(EditUserDialog, _super);
            function EditUserDialog(elementId) {
                var _this = this;
                _super.call(this, elementId);
                this.tabsUserDetails = new TabPanel("tabsUserDetails");
                this.txtName = new TextBox("txtNewName");
                this.txtNotes = new TextBox("txtNewNotes");
                this.lstRole = new DropDownList("lstNewRole");
                this.btnNewUserOK = new Button("btnEditUserOK");
                this.fieldBindings = [];
                this.btnNewUserOK.onClick(function (evt) {
                    _this.btnOK_onClick(evt);
                });
                $catdv.getFields({ "include": "user,picklists,values" }, function (rs) {
                    var fields = rs.items;
                    if (fields.length > 0) {
                        _this.tabsUserDetails.showTab("CustomFields");
                        _this.buildCustomFieldPanel(fields);
                    }
                    else {
                        _this.tabsUserDetails.hideTab("CustomFields");
                    }
                });
            }
            // Override
            EditUserDialog.prototype.show = function () {
                _super.prototype.show.call(this);
                this.tabsUserDetails.selectTab("Details");
            };
            EditUserDialog.prototype.setUserID = function (userID) {
                var _this = this;
                this.userID = userID;
                $catdv.getUser(userID, function (user) {
                    _this.txtName.setText(user.name);
                    _this.txtNotes.setText(user.notes);
                    _this.lstRole.setSelectedValue(String(user.roleID));
                    _this.fieldBindings.forEach(function (fieldBinding) {
                        fieldBinding.originalValue = fieldBinding.fieldAccessor.getValue(user);
                        fieldBinding.detailField.setValue(fieldBinding.originalValue);
                    });
                });
            };
            EditUserDialog.prototype.buildCustomFieldPanel = function (fields) {
                var _this = this;
                var $form = $("#tabCustomFields");
                var linkedFields = [];
                fields.forEach(function (fieldDefinition, f) {
                    var fieldID = "userField_F_" + f;
                    var fieldName = fieldDefinition.isBuiltin ? fieldDefinition.name.split("/")[0] : fieldDefinition.name;
                    var $formItem = $("<div class='form-group detail-field'></div>").appendTo($form);
                    var $label = $("<label for='" + fieldID + "'>" + HtmlUtil.escapeHtml(fieldName) + ":</label>").appendTo($formItem);
                    var detailField = DetailFieldFactory.createField(fieldID, { fieldDefinition: fieldDefinition }, $formItem);
                    detailField.setEditable(true);
                    _this.fieldBindings.push(new FieldBinding(detailField, new UserFieldAccessor(fieldDefinition)));
                });
            };
            EditUserDialog.prototype.btnOK_onClick = function (evt) {
                var _this = this;
                var user = {
                    ID: this.userID,
                    name: this.txtName.getText(),
                    notes: this.txtNotes.getText(),
                    roleID: Number(this.lstRole.getSelectedValue()),
                };
                if (this.fieldBindings.length > 0) {
                    this.fieldBindings.forEach(function (fieldBinding) {
                        var fieldValue = fieldBinding.detailField.getValue();
                        var newValue = fieldValue ? String(fieldValue) : "";
                        var originalValue = fieldBinding.originalValue ? String(fieldBinding.originalValue) : "";
                        if (newValue != originalValue) {
                            fieldBinding.fieldAccessor.setValue(user, fieldValue);
                        }
                    });
                }
                $catdv.updateUser(user, function () {
                    _this.close(true);
                });
            };
            return EditUserDialog;
        }(controls.Modal));
        var ChangePasswordDialog = (function (_super) {
            __extends(ChangePasswordDialog, _super);
            function ChangePasswordDialog(elementId) {
                var _this = this;
                _super.call(this, elementId);
                this.lblName = new TextBox("lblName");
                this.txtPassword1 = new TextBox("txtNewPassword1");
                this.txtPassword2 = new TextBox("txtNewPassword2");
                this.btnChangePasswordOK = new Button("btnChangePasswordOK");
                this.alertPasswordMismatch = new Alert("alertNewPasswordMismatch");
                this.btnChangePasswordOK.onClick(function (evt) {
                    _this.btnOK_onClick(evt);
                });
            }
            ChangePasswordDialog.prototype.setUser = function (user) {
                this.userID = user.ID;
                this.lblName.setText(user.name);
            };
            ChangePasswordDialog.prototype.btnOK_onClick = function (evt) {
                var _this = this;
                this.alertPasswordMismatch.hide();
                if (this.txtPassword1.getText() != this.txtPassword2.getText()) {
                    this.alertPasswordMismatch.show();
                }
                else {
                    var user = {
                        ID: this.userID,
                        password: this.txtPassword1.getText(),
                    };
                    $catdv.updateUser(user, function () {
                        _this.close(true);
                    });
                }
            };
            return ChangePasswordDialog;
        }(controls.Modal));
    })(admin = ui.admin || (ui.admin = {}));
})(ui || (ui = {}));
