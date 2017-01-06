module ui.admin
{
    import HtmlUtil = util.HtmlUtil;

    import SimpleServerDataSource = controls.SimpleServerDataSource;
    import DataTable = controls.DataTable;
    import Button = controls.Button;
    import TextBox = controls.TextBox;
    import TextArea = controls.TextArea;
    import DropDownList = controls.DropDownList;
    import CheckBox = controls.CheckBox;
    import ListBox = controls.ListBox;
    import MessageBox = controls.MessageBox;

    import $catdv = catdv.RestApi;
    import PartialResultSet = catdv.PartialResultSet;
    import FieldGroup = catdv.FieldGroup;
    import FieldDefinition = catdv.FieldDefinition;
    import Picklist = catdv.Picklist;
    import VisibilityUtil = catdv.VisibilityUtil;
    import NavbarLoginMenu = ui.panels.NavbarLoginMenu;

    export class FieldGroupsForm
    {
        private fieldGroupsTable: DataTable;

        private chkClipsOnly = new CheckBox("chkClipsOnly");
        private txtSearch = new TextBox("txtSearch");

        private btnAddFieldGroup = new Button("btnAddFieldGroup");
        private btnDeleteFieldGroup = new Button("btnDeleteFieldGroup");

        private editFieldGroupDialog = new EditFieldGroupDialog("editFieldGroupDialog");
        private editVisibilityDialog = new EditVisibilityDialog("editVisibilityDialog", "field");

        private navbarLoginMenu = new NavbarLoginMenu("navbarLoginMenu");

        constructor()
        {
            this.fieldGroupsTable = new DataTable("fieldGroupsTable", {
                columns: [
                    {
                        title: "Name",
                        dataProp: "name",
                        renderer: (obj: any, val: any) =>
                        {
                            if (obj.ID)
                            {
                                return "<a href='fields.jsp?fieldGroupID=" + obj.ID + "'>" + HtmlUtil.escapeHtml(obj.name) + "</a>";
                            }
                            else
                            {
                                return "<a href='fields.jsp'><em>" + HtmlUtil.escapeHtml(obj.name) + "</em></a>";
                            }
                        }
                    },
                    { title: "Description", dataProp: "description" },
                    {
                        title: "Type",
                        dataProp: "objectClass",
                        renderer: (obj: any, val: string) =>
                        {
                            switch (val)
                            {
                                case "catalog":
                                    return "Catalog User Fields";
                                case "clip":
                                    return "Clip User Fields";
                                case "media":
                                    return "Media Metadata Fields";
                                case "importSource":
                                    return "Source Metadata Fields";
                                default:
                                    return val ? (val.charAt(0).toUpperCase() + val.substring(1) + " User Fields") : "";
                            }
                        }
                    },
                    {
                        title: "Origin",
                        dataProp: "originType",
                        renderer: (obj: any, val: string) =>
                        {
                            var origin;
                            switch (val)
                            {
                                case "user-defined":
                                    origin = "User Defined";
                                    break;
                                case "file-metadata":
                                    origin = "File Metadata";
                                    break;
                                case "plugin":
                                    origin = "Plugin";
                                    break;
                                case "fieldset":
                                    origin = "Field Set";
                                    break;
                                default:
                                    origin = val || "";
                                    break;
                            }
                            return origin + (obj.originInfo ? " (" + obj.originInfo + ")" : "");
                        }
                    },
                    {
                        title: "Visibility",
                        dataProp: "visibility",
                        renderer: (obj: any, val: any) =>
                        {
                            return "<a href='javascript:$page.editVisibility(" + obj.ID + ")'>" + VisibilityUtil.visibilitySummary(val) + "</a>";
                        }
                    },
                    {
                        title: "Edit",
                        dataProp: "ID",
                        renderer: (obj: any, val: any) =>
                        {
                            return obj.ID ? "<a href='javascript:$page.editFieldGroup(" + obj.ID + ")'>Edit Details</a>" : "";
                        }
                    }
                ],

                simpleDataSource: new SimpleServerDataSource((params : any, callback: (fieldGroups: FieldGroup[]) => void) =>
                {
                    $catdv.getFieldGroups(params, (fieldGroups: FieldGroup[]) =>
                    {
                        var allFieldsGroup: FieldGroup = {
                            ID: null,
                            name: "All User Fields",
                            description: "View all user-defined field definitions"
                        };
                        callback([allFieldsGroup].concat(fieldGroups));
                    });
                })
            });

            this.btnAddFieldGroup.onClick((evt) =>
            {
                this.editFieldGroupDialog.setFieldGroup({ ID: null, objectClass: "clip", isBuiltIn: false });
                this.editFieldGroupDialog.onOK(() =>
                {
                    this.fieldGroupsTable.reload();
                });
                this.editFieldGroupDialog.show();
            });

            this.btnDeleteFieldGroup.onClick((evt) =>
            {
                var selectedItem = this.fieldGroupsTable.getSelectedItem();
                MessageBox.confirm("Are you sure you want to delete '" + selectedItem.name + "'", () =>
                {
                    $catdv.deleteFieldGroup(selectedItem.ID, () =>
                    {
                        this.fieldGroupsTable.reload();
                    });
                });
            });

            this.txtSearch.onInput((evt) =>
            {
                var searchText = this.txtSearch.getText();
                if ((searchText.length == 0) || (searchText.length > 2))
                {
                    this.fieldGroupsTable.reload();
                }
            });

            this.chkClipsOnly.onChanged((evt) => this.fieldGroupsTable.reload());
        }

        public editVisibility(fieldGroupID: number)
        {
            var selectedFieldGroup : FieldGroup = this.fieldGroupsTable.findItem((o) => { return o.ID == fieldGroupID });
            this.editVisibilityDialog.setItem(selectedFieldGroup);
            this.editVisibilityDialog.onOK((updatedFieldGroup) =>
            {
                $catdv.saveFieldGroup(updatedFieldGroup, () =>
                {
                    this.fieldGroupsTable.reload();
                });
            });
            this.editVisibilityDialog.show();
        }

        public editFieldGroup(fieldGroupID: any)
        {
            var selectedField = this.fieldGroupsTable.findItem((o) => { return o.ID == fieldGroupID });
            this.editFieldGroupDialog.setFieldGroup(selectedField);
            this.editFieldGroupDialog.onOK(() =>
            {
                this.fieldGroupsTable.reload();
            });
            this.editFieldGroupDialog.show();
        }
    }

    class EditFieldGroupDialog extends controls.Modal
    {
        private txtName: TextBox = new TextBox("txtName");
        private txtDescription: TextBox = new TextBox("txtDescription");
        private txtIdentiferPrefix: TextBox = new TextBox("txtIdentiferPrefix");
        private lstObjectClass: DropDownList = new DropDownList("lstObjectClass");
        private btnNewFieldOK: Button = new Button("btnEditFieldOK");

        private fieldGroup: FieldGroup;

        constructor(elementId: string)
        {
            super(elementId);

            this.btnNewFieldOK.onClick((evt: any) =>
            {
                this.btnOK_onClick(evt);
            });
        }

        public setFieldGroup(fieldGroup: FieldGroup)
        {
            this.fieldGroup = fieldGroup;

            this.txtName.setText(fieldGroup.name);
            this.txtDescription.setText(fieldGroup.description);
            this.txtIdentiferPrefix.setText(fieldGroup.identifierPrefix);
            this.lstObjectClass.setSelectedValue(fieldGroup.objectClass);
            this.lstObjectClass.setEnabled(!this.fieldGroup.ID);
        }

        private btnOK_onClick(evt: any)
        {
            var permissions: string[] = [];

            var fieldGroup: FieldGroup =
                {
                    ID: this.fieldGroup.ID,
                    name: this.txtName.getText(),
                    description: this.txtDescription.getText(),
                    identifierPrefix: this.txtIdentiferPrefix.getText(),
                    objectClass: this.lstObjectClass.getSelectedValue(),
                };

            $catdv.saveFieldGroup(fieldGroup, () =>
            {
                this.close(true);
            });
        }
    }
}

