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
        var Label = controls.Label;
        var Button = controls.Button;
        var TextBox = controls.TextBox;
        var CheckBox = controls.CheckBox;
        var CheckList = controls.CheckList;
        var SimpleArrayDataSource = controls.SimpleArrayDataSource;
        var SimpleServerDataSource = controls.SimpleServerDataSource;
        var MessageBox = controls.MessageBox;
        var $catdv = catdv.RestApi;
        var NavbarLoginMenu = ui.panels.NavbarLoginMenu;
        var GroupsForm = (function () {
            function GroupsForm() {
                var _this = this;
                this.btnAddGroup = new Button("btnAddGroup");
                this.btnDeleteGroup = new Button("btnDeleteGroup");
                this.navbarLoginMenu = new NavbarLoginMenu("navbarLoginMenu");
                this.editGroupDialog = new EditGroupDialog("editGroupDialog");
                this.editGroupPermissionsDialog = new EditGroupPermissionsDialog("editGroupPermissionsDialog");
                this.editGroupACLDialog = new admin.EditACLDialog("editACLDialog", "group");
                this.groupsTable = new DataTable("groupsTable", {
                    columns: [
                        {
                            title: "Name",
                            dataProp: "name",
                            isSortable: true,
                            renderer: function (obj, val) {
                                return "<a href='javascript:$page.editGroup(" + obj.ID + ")' title='ID:" + obj.ID + "'>" + HtmlUtil.escapeHtml(obj.name) + "</a>";
                            }
                        },
                        {
                            title: "Notes",
                            dataProp: "notes"
                        },
                        {
                            title: "Permissions",
                            dataProp: "ID",
                            renderer: function (obj, val) {
                                if (catdv.settings.useAccessControlLists) {
                                    return "<a href='javascript:$page.editGroupACL(" + val + ")'>Edit ACL</a>";
                                }
                                else {
                                    return "<a href='javascript:$page.editGroupPermissions(" + val + ")'>Edit Permissions</a>";
                                }
                            }
                        }
                    ],
                    simpleDataSource: new SimpleServerDataSource(function (params, callback) {
                        $catdv.getGroups(params, function (groups) {
                            callback(groups);
                        });
                    })
                });
                this.btnAddGroup.onClick(function (evt) {
                    _this.editGroupDialog.setGroup(null);
                    _this.editGroupDialog.onOK(function () {
                        _this.groupsTable.reload();
                    });
                    _this.editGroupDialog.show();
                });
                this.btnDeleteGroup.onClick(function (evt) {
                    _this.deleteGroup(_this.groupsTable.getSelectedItem());
                });
            }
            GroupsForm.prototype.editGroup = function (groupID) {
                var _this = this;
                var selectedGroup = this.groupsTable.findItem(function (o) { return o.ID == groupID; });
                this.editGroupDialog.setGroup(selectedGroup);
                this.editGroupDialog.onOK(function () {
                    _this.groupsTable.reload();
                });
                this.editGroupDialog.show();
            };
            GroupsForm.prototype.editGroupPermissions = function (groupID) {
                var _this = this;
                var selectedGroup = this.groupsTable.findItem(function (o) { return o.ID == groupID; });
                this.editGroupPermissionsDialog.setGroup(selectedGroup);
                this.editGroupPermissionsDialog.onOK(function () {
                    _this.groupsTable.reload();
                });
                this.editGroupPermissionsDialog.show();
            };
            GroupsForm.prototype.editGroupACL = function (groupID) {
                var _this = this;
                var selectedGroup = this.groupsTable.findItem(function (o) { return o.ID == groupID; });
                this.editGroupACLDialog.setGroup(selectedGroup);
                this.editGroupACLDialog.onOK(function (acl) {
                    var group = {
                        ID: groupID,
                        acl: acl.length > 0 ? acl : null
                    };
                    $catdv.saveGroup(group, function () {
                        _this.groupsTable.reload();
                    });
                });
                this.editGroupACLDialog.show();
            };
            GroupsForm.prototype.deleteGroup = function (group) {
                var _this = this;
                MessageBox.confirm("Are you sure you want to delete '" + group.name + "'", function () {
                    $catdv.deleteGroup(group.ID, function (reply) {
                        _this.groupsTable.reload();
                    });
                });
            };
            return GroupsForm;
        }());
        admin.GroupsForm = GroupsForm;
        var EditPermissionsDialog = (function (_super) {
            __extends(EditPermissionsDialog, _super);
            function EditPermissionsDialog(elementId, checkboxSuffix) {
                var _this = this;
                _super.call(this, elementId);
                // This is Map<string, CheckBox>
                this.chkPermissions = {};
                EditPermissionsDialog.permissions.forEach(function (permission) {
                    _this.chkPermissions[permission] = new CheckBox(permission + checkboxSuffix + "Chk");
                });
            }
            EditPermissionsDialog.prototype.setPermissionCheckboxes = function (permissions) {
                var _this = this;
                // clear the permission checkboxes
                EditPermissionsDialog.permissions.forEach(function (permission) {
                    _this.chkPermissions[permission].setChecked(false).setEnabled(permissions ? true : false);
                });
                if (permissions) {
                    permissions.forEach(function (permission) {
                        _this.chkPermissions[permission].setChecked(true).setEnabled(true);
                    });
                }
            };
            EditPermissionsDialog.prototype.readPermissionCheckboxes = function () {
                var _this = this;
                var permissions = [];
                EditPermissionsDialog.permissions.forEach(function (permission) {
                    if (_this.chkPermissions[permission].isChecked()) {
                        permissions.push(permission);
                    }
                });
                return permissions;
            };
            EditPermissionsDialog.prototype.enablePermissionCheckboxes = function (enable) {
                var _this = this;
                EditPermissionsDialog.permissions.forEach(function (permission) {
                    var checkBox = _this.chkPermissions[permission];
                    checkBox.setEnabled(enable);
                    if (enable) {
                        checkBox.$element.parent().removeClass("disabled");
                    }
                    else {
                        checkBox.$element.parent().addClass("disabled");
                    }
                });
            };
            EditPermissionsDialog.permissions = [
                "readOthersCatalogs",
                "createCatalogs",
                "editCatalogs",
                "editOthersCatalogs",
                "deleteCatalogs",
                "deleteClips",
                "createClips",
                "editTapes",
                "admin",
                "editPicklist",
                "editLockedFields",
                "deleteOthersCatalogs",
            ];
            return EditPermissionsDialog;
        }(controls.Modal));
        admin.EditPermissionsDialog = EditPermissionsDialog;
        var EditGroupDialog = (function (_super) {
            __extends(EditGroupDialog, _super);
            function EditGroupDialog(elementId) {
                var _this = this;
                _super.call(this, elementId, "1");
                this.txtName = new TextBox("txtName");
                this.txtNotes = new TextBox("txtNotes");
                this.btnNewGroupOK = new Button("btnEditGroupOK");
                this.btnNewGroupOK.onClick(function (evt) {
                    _this.btnOK_onClick(evt);
                });
            }
            EditGroupDialog.prototype.setGroup = function (group) {
                if (group != null) {
                    this.groupID = group.ID;
                    this.txtName.setText(group.name);
                    this.txtNotes.setText(group.notes);
                    this.setPermissionCheckboxes(group.defaultPermissions);
                }
                else {
                    this.groupID = null;
                    this.txtName.setText("");
                    this.txtNotes.setText("");
                    this.setPermissionCheckboxes([]);
                }
            };
            EditGroupDialog.prototype.btnOK_onClick = function (evt) {
                var _this = this;
                var group = {
                    ID: this.groupID,
                    name: this.txtName.getText(),
                    notes: this.txtNotes.getText(),
                    defaultPermissions: this.readPermissionCheckboxes()
                };
                $catdv.saveGroup(group, function () {
                    _this.close(true);
                });
            };
            return EditGroupDialog;
        }(EditPermissionsDialog));
        var EditGroupPermissionsDialog = (function (_super) {
            __extends(EditGroupPermissionsDialog, _super);
            function EditGroupPermissionsDialog(elementId) {
                var _this = this;
                _super.call(this, elementId, "2");
                this.lblTitle = new Label("lblEditGroupPermissionsTitle");
                this.btnOK = new Button("btnEditGroupPermissionsOK");
                this.datasource = new SimpleArrayDataSource();
                this.roles = [];
                this.currentRoleIndex = null;
                this.listRoles = new CheckList("listRoles", false, this.datasource);
                this.listRoles.onCurrentItemChanged(function (evt) {
                    _this.readPermissions();
                    _this.currentRoleIndex = _this.listRoles.getCurrentItemIndex();
                    _this.updatePermissions();
                });
                this.btnOK.onClick(function (evt) {
                    _this.btnOK_onClick(evt);
                });
            }
            EditGroupPermissionsDialog.prototype.setGroup = function (group) {
                var _this = this;
                this.group = group;
                this.lblTitle.setText("Permissions for Group '" + group.name + "'");
                $catdv.getGroupRolePermissions(this.group.ID, function (roles) {
                    _this.roles = roles;
                    _this.currentRoleIndex = null;
                    _this.datasource.setItems(roles.map(function (role) {
                        return {
                            value: role,
                            text: role.name,
                            isSelected: role.permissions ? true : false
                        };
                    }));
                    _this.listRoles.reload();
                    _this.updatePermissions();
                });
            };
            // if there is a role selected read the permissions from the checkboxes
            EditGroupPermissionsDialog.prototype.readPermissions = function () {
                if (this.currentRoleIndex != null) {
                    if (this.listRoles.isChecked(this.currentRoleIndex)) {
                        this.roles[this.currentRoleIndex].permissions = this.readPermissionCheckboxes();
                    }
                    else {
                        this.roles[this.currentRoleIndex].permissions = null;
                    }
                }
            };
            EditGroupPermissionsDialog.prototype.updatePermissions = function () {
                if (this.currentRoleIndex != null) {
                    var currentRole = this.roles[this.currentRoleIndex];
                    if (this.listRoles.isChecked(this.currentRoleIndex)) {
                        currentRole.permissions = currentRole.permissions || this.group.defaultPermissions;
                    }
                    else {
                        currentRole.permissions = null;
                    }
                    this.setPermissionCheckboxes(currentRole.permissions);
                }
                else {
                    this.setPermissionCheckboxes(null);
                }
            };
            EditGroupPermissionsDialog.prototype.btnOK_onClick = function (evt) {
                var _this = this;
                this.readPermissions();
                // only interested in permissions so strip everything else out
                var rolePermissions = [];
                this.roles.forEach(function (role) {
                    rolePermissions.push({
                        ID: role.ID,
                        permissions: role.permissions
                    });
                });
                $catdv.updateGroupRolePermissions(this.group.ID, rolePermissions, function () {
                    _this.close(true);
                });
            };
            return EditGroupPermissionsDialog;
        }(EditPermissionsDialog));
    })(admin = ui.admin || (ui.admin = {}));
})(ui || (ui = {}));
