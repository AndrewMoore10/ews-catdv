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
        var DataTable = controls.DataTable;
        var Button = controls.Button;
        var TextBox = controls.TextBox;
        var CheckBox = controls.CheckBox;
        var Label = controls.Label;
        var CheckList = controls.CheckList;
        var SimpleServerDataSource = controls.SimpleServerDataSource;
        var SimpleArrayDataSource = controls.SimpleArrayDataSource;
        var MessageBox = controls.MessageBox;
        var $catdv = catdv.RestApi;
        var NavbarLoginMenu = ui.panels.NavbarLoginMenu;
        var RolesForm = (function () {
            function RolesForm() {
                var _this = this;
                this.navbarLoginMenu = new NavbarLoginMenu("navbarLoginMenu");
                this.btnAddRole = new Button("btnAddRole");
                this.btnDeleteRole = new Button("btnDeleteRole");
                this.editRoleDialog = new EditRoleDialog("editRoleDialog");
                this.editRolePermissionsDialog = new EditRolePermissionsDialog("editRolePermissionsDialog");
                var columns = [
                    {
                        title: "Name",
                        dataProp: "name",
                        isSortable: true,
                        renderer: function (obj, val) {
                            return "<a href='javascript:$page.editRole(" + obj.ID + ")' title='ID:" + obj.ID + "'>" + HtmlUtil.escapeHtml(obj.name) + "</a>";
                        }
                    },
                    {
                        title: "Notes",
                        dataProp: "notes"
                    }
                ];
                if (!catdv.settings.useAccessControlLists) {
                    columns.push({
                        title: "Permissions",
                        dataProp: "ID",
                        renderer: function (obj, val) {
                            return "<a href='javascript:$page.editRolePermissions(" + val + ")'>Edit Permissions</a>";
                        }
                    });
                }
                this.rolesTable = new DataTable("rolesTable", {
                    columns: columns,
                    simpleDataSource: new SimpleServerDataSource(function (params, callback) {
                        $catdv.getRoles(params, function (data) {
                            callback(data);
                        });
                    })
                });
                this.btnAddRole.onClick(function (evt) {
                    _this.editRoleDialog.setRole(null);
                    _this.editRoleDialog.onOK(function () {
                        _this.rolesTable.reload();
                    });
                    _this.editRoleDialog.show();
                });
                this.btnDeleteRole.onClick(function (evt) {
                    _this.deleteRole(_this.rolesTable.getSelectedItem());
                });
            }
            RolesForm.prototype.editRole = function (roleId) {
                var _this = this;
                var selectedRole = this.rolesTable.findItem(function (o) { return o.ID == roleId; });
                this.editRoleDialog.setRole(selectedRole);
                this.editRoleDialog.onOK(function () {
                    _this.rolesTable.reload();
                });
                this.editRoleDialog.show();
            };
            RolesForm.prototype.editRolePermissions = function (roleId) {
                var _this = this;
                var selectedRole = this.rolesTable.findItem(function (o) { return o.ID == roleId; });
                this.editRolePermissionsDialog.setRole(selectedRole);
                this.editRolePermissionsDialog.onOK(function () {
                    _this.rolesTable.reload();
                });
                this.editRolePermissionsDialog.show();
            };
            RolesForm.prototype.deleteRole = function (role) {
                var _this = this;
                MessageBox.confirm("Are you sure you want to delete '" + role.name + "'", function () {
                    $catdv.deleteRole(role.ID, function (reply) {
                        _this.rolesTable.reload();
                    });
                });
            };
            return RolesForm;
        }());
        admin.RolesForm = RolesForm;
        var EditRoleDialog = (function (_super) {
            __extends(EditRoleDialog, _super);
            function EditRoleDialog(elementId) {
                var _this = this;
                _super.call(this, elementId);
                this.txtName = new TextBox("txtName");
                this.txtNotes = new TextBox("txtNotes");
                this.chkAdvancedUI = new CheckBox("chkAdvancedUI");
                this.btnNewRoleOK = new Button("btnEditRoleOK");
                this.btnNewRoleOK = new Button("btnEditRoleOK");
                this.btnNewRoleOK.onClick(function (evt) {
                    _this.btnOK_onClick(evt);
                });
            }
            EditRoleDialog.prototype.setRole = function (role) {
                // clear the permission checkboxes
                if (role != null) {
                    this.roleID = role.ID;
                    this.txtName.setText(role.name);
                    this.txtNotes.setText(role.notes);
                    this.chkAdvancedUI.setChecked(role.advancedUI);
                }
                else {
                    this.roleID = null;
                    this.txtName.setText("");
                    this.txtNotes.setText("");
                }
            };
            EditRoleDialog.prototype.btnOK_onClick = function (evt) {
                var _this = this;
                var permissions = [];
                var role = {
                    ID: this.roleID,
                    name: this.txtName.getText(),
                    notes: this.txtNotes.getText(),
                    advancedUI: this.chkAdvancedUI.isChecked()
                };
                $catdv.saveRole(role, function () {
                    _this.close(true);
                });
            };
            return EditRoleDialog;
        }(controls.Modal));
        var EditRolePermissionsDialog = (function (_super) {
            __extends(EditRolePermissionsDialog, _super);
            function EditRolePermissionsDialog(elementId) {
                var _this = this;
                _super.call(this, elementId, "2");
                this.lblTitle = new Label("lblEditRolePermissionsTitle");
                this.btnOK = new Button("btnEditRolePermissionsOK");
                this.datasource = new SimpleArrayDataSource();
                this.groups = [];
                this.currentGroupIndex = null;
                this.listGroups = new CheckList("listGroups", false, this.datasource);
                this.listGroups.onCurrentItemChanged(function (evt) {
                    _this.readPermissions();
                    _this.currentGroupIndex = _this.listGroups.getCurrentItemIndex();
                    _this.updatePermissions();
                });
                this.btnOK.onClick(function (evt) {
                    _this.btnOK_onClick(evt);
                });
            }
            EditRolePermissionsDialog.prototype.setRole = function (role) {
                var _this = this;
                this.role = role;
                this.lblTitle.setText("Permissions for Role '" + role.name + "'");
                $catdv.getRoleGroupPermissions(this.role.ID, function (groups) {
                    _this.groups = groups;
                    _this.currentGroupIndex = null;
                    _this.datasource.setItems(groups.map(function (group) {
                        return {
                            value: group,
                            text: group.name,
                            isSelected: group.permissions ? true : false
                        };
                    }));
                    _this.listGroups.reload();
                    _this.updatePermissions();
                });
            };
            // if there is a group selected read the permissions from the checkboxes
            EditRolePermissionsDialog.prototype.readPermissions = function () {
                if (this.currentGroupIndex != null) {
                    if (this.listGroups.isChecked(this.currentGroupIndex)) {
                        this.groups[this.currentGroupIndex].permissions = this.readPermissionCheckboxes();
                    }
                    else {
                        this.groups[this.currentGroupIndex].permissions = null;
                    }
                }
            };
            EditRolePermissionsDialog.prototype.updatePermissions = function () {
                if (this.currentGroupIndex != null) {
                    var currentGroup = this.groups[this.currentGroupIndex];
                    if (this.listGroups.isChecked(this.currentGroupIndex)) {
                        currentGroup.permissions = currentGroup.permissions || currentGroup.defaultPermissions;
                    }
                    else {
                        currentGroup.permissions = null;
                    }
                    this.setPermissionCheckboxes(currentGroup.permissions);
                }
                else {
                    this.setPermissionCheckboxes(null);
                }
            };
            EditRolePermissionsDialog.prototype.btnOK_onClick = function (evt) {
                var _this = this;
                this.readPermissions();
                // only interested in permissions so strip everything else out
                var groupPermissions = [];
                this.groups.forEach(function (group) {
                    groupPermissions.push({
                        ID: group.ID,
                        permissions: group.permissions
                    });
                });
                $catdv.updateRoleGroupPermissions(this.role.ID, groupPermissions, function () {
                    _this.close(true);
                });
            };
            return EditRolePermissionsDialog;
        }(admin.EditPermissionsDialog));
    })(admin = ui.admin || (ui.admin = {}));
})(ui || (ui = {}));
