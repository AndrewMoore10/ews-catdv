module ui.admin
{
    import HtmlUtil = util.HtmlUtil;
    import DataTable = controls.DataTable;
    import Label = controls.Label;
    import Button = controls.Button;
    import TextBox = controls.TextBox;
    import DropDownList = controls.DropDownList;
    import CheckBox = controls.CheckBox;
    import RadioButton = controls.RadioButton;
    import ListBox = controls.ListBox;
    import ListItem = controls.ListItem;
    import CheckList = controls.CheckList;
    import SimpleArrayDataSource = controls.SimpleArrayDataSource;
    import SimpleServerDataSource = controls.SimpleServerDataSource;
    import SimpleDataSourceParams = controls.SimpleDataSourceParams;
    import MessageBox = controls.MessageBox;

    import $catdv = catdv.RestApi;
    import Role = catdv.Role;
    import Group = catdv.Group;

    import NavbarLoginMenu = ui.panels.NavbarLoginMenu;

    export class GroupsForm
    {
        private groupsTable: DataTable;

        private btnAddGroup: Button = new Button("btnAddGroup");
        private btnDeleteGroup: Button = new Button("btnDeleteGroup");
        private navbarLoginMenu = new NavbarLoginMenu("navbarLoginMenu");

        private editGroupDialog = new EditGroupDialog("editGroupDialog");
        private editGroupPermissionsDialog = new EditGroupPermissionsDialog("editGroupPermissionsDialog");
        private editGroupACLDialog = new EditACLDialog("editACLDialog", "group");

        constructor()
        {
            this.groupsTable = new DataTable("groupsTable", {
                columns: [
                    {
                        title: "Name",
                        dataProp: "name",
                        isSortable: true,
                        renderer: (obj: any, val: any) =>
                        {
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
                        renderer: (obj: any, val: any) =>
                        {
                            if (catdv.settings.useAccessControlLists)
                            {
                                return "<a href='javascript:$page.editGroupACL(" + val + ")'>Edit ACL</a>";
                            }
                            else
                            {
                                return "<a href='javascript:$page.editGroupPermissions(" + val + ")'>Edit Permissions</a>";
                            }
                        }
                    }
                ],
                simpleDataSource: new SimpleServerDataSource<Group>((params : SimpleDataSourceParams, callback: (groups: Group[]) => void) =>
                {
                    $catdv.getGroups(params, (groups) =>
                    {
                        callback(groups);
                    });
                })
            });

            this.btnAddGroup.onClick((evt) =>
            {
                this.editGroupDialog.setGroup(null);
                this.editGroupDialog.onOK(() =>
                {
                    this.groupsTable.reload();
                });
                this.editGroupDialog.show();
            });

            this.btnDeleteGroup.onClick((evt) =>
            {
                this.deleteGroup(this.groupsTable.getSelectedItem());
            });
        }

        public editGroup(groupID: number)
        {
            var selectedGroup = this.groupsTable.findItem((o) => { return o.ID == groupID });
            this.editGroupDialog.setGroup(selectedGroup);
            this.editGroupDialog.onOK(() =>
            {
                this.groupsTable.reload();
            });
            this.editGroupDialog.show();
        }

        public editGroupPermissions(groupID: number)
        {
            var selectedGroup = this.groupsTable.findItem((o) => { return o.ID == groupID });
            this.editGroupPermissionsDialog.setGroup(selectedGroup);
            this.editGroupPermissionsDialog.onOK(() =>
            {
                this.groupsTable.reload();
            });
            this.editGroupPermissionsDialog.show();
        }

        public editGroupACL(groupID: number)
        {
            var selectedGroup: Group = this.groupsTable.findItem((o) => { return o.ID == groupID });
            this.editGroupACLDialog.setGroup(selectedGroup);
            this.editGroupACLDialog.onOK((acl) =>
            {
                var group =
                    {
                        ID: groupID,
                        acl: acl.length > 0 ? acl : null
                    };

                $catdv.saveGroup(group,() =>
                {
                    this.groupsTable.reload();
                });
            });
            this.editGroupACLDialog.show();
        }

        public deleteGroup(group: Group)
        {
            MessageBox.confirm("Are you sure you want to delete '" + group.name + "'", () =>
            {
                $catdv.deleteGroup(group.ID,(reply) =>
                {
                    this.groupsTable.reload();
                });
            });
        }
    }

    export class EditPermissionsDialog extends controls.Modal
    {
        private static permissions: string[] = [
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

        // This is Map<string, CheckBox>
        private chkPermissions: { [permission: string]: CheckBox } = {};

        constructor(elementId: string, checkboxSuffix: string)
        {
            super(elementId);

            EditPermissionsDialog.permissions.forEach((permission) =>
            {
                this.chkPermissions[permission] = new CheckBox(permission + checkboxSuffix + "Chk");
            });
        }

        public setPermissionCheckboxes(permissions: string[])
        {
            // clear the permission checkboxes
            EditPermissionsDialog.permissions.forEach((permission) =>
            {
                this.chkPermissions[permission].setChecked(false).setEnabled(permissions ? true : false);
            });
            if (permissions)
            {
                permissions.forEach((permission) =>
                {
                    this.chkPermissions[permission].setChecked(true).setEnabled(true);
                });
            }
        }

        public readPermissionCheckboxes(): string[]
        {
            var permissions: string[] = [];

            EditPermissionsDialog.permissions.forEach((permission) =>
            {
                if (this.chkPermissions[permission].isChecked())
                {
                    permissions.push(permission);
                }
            });
            return permissions;
        }

        public enablePermissionCheckboxes(enable: boolean)
        {
            EditPermissionsDialog.permissions.forEach((permission) =>
            {
                var checkBox = this.chkPermissions[permission];
                checkBox.setEnabled(enable);
                if (enable)
                {
                    checkBox.$element.parent().removeClass("disabled");
                }
                else
                {
                    checkBox.$element.parent().addClass("disabled");
                }
            });
        }

    }

    class EditGroupDialog extends EditPermissionsDialog
    {
        private txtName: TextBox = new TextBox("txtName");
        private txtNotes: TextBox = new TextBox("txtNotes");
        private btnNewGroupOK: Button = new Button("btnEditGroupOK");

        private groupID: number;

        constructor(elementId: string)
        {
            super(elementId, "1");

            this.btnNewGroupOK.onClick((evt: any) =>
            {
                this.btnOK_onClick(evt);
            });
        }

        public setGroup(group: any)
        {
            if (group != null)
            {
                this.groupID = group.ID;
                this.txtName.setText(group.name);
                this.txtNotes.setText(group.notes);
                this.setPermissionCheckboxes(group.defaultPermissions);
            }
            else
            {
                this.groupID = null;
                this.txtName.setText("");
                this.txtNotes.setText("");
                this.setPermissionCheckboxes([]);
            }
        }

        private btnOK_onClick(evt: any)
        {
            var group =
                {
                    ID: this.groupID,
                    name: this.txtName.getText(),
                    notes: this.txtNotes.getText(),
                    defaultPermissions: this.readPermissionCheckboxes()
                };

            $catdv.saveGroup(group,() =>
            {
                this.close(true);
            });
        }
    }

    class EditGroupPermissionsDialog extends EditPermissionsDialog
    {
        private listRoles : CheckList;
        private lblTitle = new Label("lblEditGroupPermissionsTitle");
        private btnOK: Button = new Button("btnEditGroupPermissionsOK");

        private datasource = new SimpleArrayDataSource<ListItem>();
        private group: Group;
        private roles: Role[] = [];
        private currentRoleIndex: number = null;

        constructor(elementId: string)
        {
            super(elementId, "2");

            this.listRoles = new CheckList("listRoles", false, this.datasource);
            this.listRoles.onCurrentItemChanged((evt) =>
            {
                this.readPermissions();
                this.currentRoleIndex = this.listRoles.getCurrentItemIndex();
                this.updatePermissions();
            });

            this.btnOK.onClick((evt: any) =>
            {
                this.btnOK_onClick(evt);
            });
        }

        public setGroup(group: any)
        {
            this.group = group;
            this.lblTitle.setText("Permissions for Group '" + group.name + "'");

            $catdv.getGroupRolePermissions(this.group.ID,(roles: Role[]) =>
            {
                this.roles = roles;
                this.currentRoleIndex = null;
                this.datasource.setItems(roles.map((role) =>
                {
                    return {
                        value: role,
                        text: role.name,
                        isSelected: role.permissions ? true : false
                    };
                }));
                this.listRoles.reload();
                this.updatePermissions();
            });
        }

        // if there is a role selected read the permissions from the checkboxes
        private readPermissions()
        {
            if (this.currentRoleIndex != null)
            {
                if (this.listRoles.isChecked(this.currentRoleIndex))
                {
                    this.roles[this.currentRoleIndex].permissions = this.readPermissionCheckboxes();
                }
                else
                {
                    this.roles[this.currentRoleIndex].permissions = null;
                }
            }
        }

        private updatePermissions()
        {
            if (this.currentRoleIndex != null)
            {
                var currentRole = this.roles[this.currentRoleIndex];
                if (this.listRoles.isChecked(this.currentRoleIndex))
                {
                    currentRole.permissions = currentRole.permissions || this.group.defaultPermissions;
                }
                else
                {
                    currentRole.permissions = null;
                }
                this.setPermissionCheckboxes(currentRole.permissions);
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
            var rolePermissions: Role[] = [];
            this.roles.forEach((role) =>
            {
                rolePermissions.push({
                    ID: role.ID,
                    permissions: role.permissions
                });
            });

            $catdv.updateGroupRolePermissions(this.group.ID, rolePermissions,() =>
            {
                this.close(true);
            });
        }
    }
}

