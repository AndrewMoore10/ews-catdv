module ui.admin
{
    import HtmlUtil = util.HtmlUtil;

    import ServerPagedDataSource = controls.ServerPagedDataSource;
    import DataTable = controls.DataTable;
    import Element = controls.Element;
    import Label = controls.Label;
    import Button = controls.Button;
    import TextBox = controls.TextBox;
    import TextArea = controls.TextArea;
    import DropDownList = controls.DropDownList;
    import CheckBox = controls.CheckBox;
    import ListBox = controls.ListBox;
    import MessageBox = controls.MessageBox;
    import DraggableListBox = controls.DraggableListBox;
    
    import $catdv = catdv.RestApi;
    import PartialResultSet = catdv.PartialResultSet;
    import FieldDefinition = catdv.FieldDefinition;
    import FieldGroup = catdv.FieldGroup;
    import Picklist = catdv.Picklist;
    import NavbarLoginMenu = ui.panels.NavbarLoginMenu;

    // This variable is emitted into a script in the head of fields.jsp
    declare var currentFieldGroup: FieldGroup;
    declare var fieldGroupLookup: { [id: number]: FieldGroup };

    export class FieldsForm
    {
        private fieldsTable: DataTable;

        private lblPageHeader = new Label("lblPageHeader");
        private txtSearch = new TextBox("txtSearch");
        private chkAdvanced = new CheckBox("chkAdvanced");
        private btnAddField = new Button("btnAddField");
        private btnMergeFields = new Button("btnMergeFields");
        private btnDeleteField = new Button("btnDeleteField");
        private btnRenumberUserFields = new Button("btnRenumberUserFields");

        private editFieldDialog = new EditFieldDialog("editFieldDialog");
        private editListDialog = new EditListDialog("editListDialog");
        private mergeFieldsDialog = new MergeFieldsDialog("mergeFieldsDialog");
        private navbarLoginMenu = new NavbarLoginMenu("navbarLoginMenu");
        private renumberUserFieldsDialog = new RenumberUserFieldsDialog("renumberUserFieldsDialog");

        private currentFieldGroup: FieldGroup;
        private fieldLookup: { [fieldID: string]: any } = {};
        private isAllFieldsGroup: boolean = false;
        private isClipFieldGroup: boolean = false;

        constructor()
        {
            this.currentFieldGroup = (typeof currentFieldGroup !== "undefined") ? currentFieldGroup : null;
            this.isAllFieldsGroup = (this.currentFieldGroup == null);
            this.isClipFieldGroup = (this.currentFieldGroup == null) || (this.currentFieldGroup.objectClass == "clip");
           
            this.btnRenumberUserFields.show(this.isAllFieldsGroup);

            this.lblPageHeader.$element.html("<a href='fieldgroups.jsp'>Field Groups</a> / " + (this.currentFieldGroup ? this.currentFieldGroup.name : "All User Fields"));

            this.buildFieldsTable();

            this.btnAddField.onClick((evt) =>
            {
                this.editFieldDialog.setField({
                    ID: null,
                    fieldGroupID: this.currentFieldGroup != null ? this.currentFieldGroup.ID : null,
                    memberOf: this.currentFieldGroup != null ? this.currentFieldGroup.objectClass : "clip",
                    isEditable: true
                });
                this.editFieldDialog.onOK(() =>
                {
                    this.fieldsTable.reload();
                });
                this.editFieldDialog.show();
            });

            this.mergeFieldsDialog.onOK(() => this.fieldsTable.reload());

            this.btnMergeFields.onClick((evt) =>
            {
                var selectedItems = this.fieldsTable.getSelectedItems();
                if (selectedItems.length < 2)
                {
                    MessageBox.alert("You must select more than one field definition to merge");
                }
                else
                {
                    if (selectedItems.filter((item) => item.memberOf != "clip").length > 0)
                    {
                        MessageBox.alert("Merging is currently only supported for Clip fields");
                    }
                    else
                    {
                        this.mergeFieldsDialog.setFields(selectedItems);
                        this.mergeFieldsDialog.show();
                    }
                }
            });

            this.btnDeleteField.onClick((evt) =>
            {
                var selectedItems = this.fieldsTable.getSelectedItems();
                if (selectedItems.length == 1)
                {
                    MessageBox.confirm("Are you sure you want to delete '" + selectedItems[0].name + "'?", () =>
                    {
                        $catdv.deleteField(selectedItems[0].ID,
                            () =>
                            {
                                this.fieldsTable.reload();
                            },
                            (status: String, error: String) => 
                            {
                                alert(error); // Hack. Nested MessageBoxes don't work
                            });
                    });
                }
                else if (selectedItems.length > 1)
                {
                    MessageBox.confirm("Are you sure you want to delete '" + selectedItems.length + "' fields?", () =>
                    {
                        var results = 0;
                        var errors: string = "";
                        selectedItems.forEach((selectedItem) =>
                        {
                            $catdv.deleteField(selectedItem.ID,
                                () =>
                                {
                                    if (++results == selectedItems.length)
                                    {
                                        this.fieldsTable.reload();
                                        if (errors) alert(errors);
                                    }
                                },
                                (status: String, error: String) => 
                                {
                                    errors += error + "\n";
                                    if (++results == selectedItems.length) 
                                    {
                                        this.fieldsTable.reload();
                                        alert(errors);
                                    }
                                });
                        });
                    });
                }
            });

            this.btnRenumberUserFields.onClick((evt) =>
            {
                this.renumberUserFieldsDialog.onOK(() =>
                {
                    this.fieldsTable.reload();
                });
                this.renumberUserFieldsDialog.show();
            });

            this.txtSearch.onInput((evt) =>
            {
                var searchText = this.txtSearch.getText();
                if ((searchText.length == 0) || (searchText.length > 2))
                {
                    this.fieldsTable.reload();
                }
            });

            this.chkAdvanced.onChanged((evt) =>
            {
                this.btnMergeFields.show(this.chkAdvanced.isChecked());
                this.buildFieldsTable();
            });

            this.btnMergeFields.show(this.chkAdvanced.isChecked());
        }

        private buildFieldsTable()
        {
            var fieldsTableColumns = [];

            if (this.isAllFieldsGroup)
            {
                fieldsTableColumns.push({
                    title: "User Field",
                    dataProp: "userFieldIndex",
                    width: "120px",
                    isSortable: true,
                    renderer: (obj: any, val: any) =>
                    {
                        if ((val != null) && (typeof val !== "undefined"))
                        {
                            return "<a href='javascript:$page.editField(" + obj.ID + ")'>User " + (val + 1) + "</a>";
                        }
                        else
                        {
                            return "";
                        }
                    }
                });
            }

            fieldsTableColumns.push({
                title: "Field Name",
                dataProp: "name",
                isSortable: true,
                renderer: (obj: any, val: any) =>
                {
                    var tooltip = obj.memberOf + (obj.isBuiltin ? "." + obj.identifier : "[" + obj.identifier + "]");
                    return "<a href='javascript:$page.editField(" + obj.ID + ")' title='" + HtmlUtil.escapeHtml(tooltip) + "'>" + HtmlUtil.escapeHtml(obj.name) + "</a>";
                }
            });

            fieldsTableColumns.push({ title: "Identifier", dataProp: "identifier", isSortable: true });

            if (this.chkAdvanced.isChecked())
            {
                fieldsTableColumns.push({ title: "Origin", dataProp: "origin", isSortable: true });
            }


            if(!this.isAllFieldsGroup && this.isClipFieldGroup)
            {
                fieldsTableColumns.push({
                    title: "User Field",
                    dataProp: "userFieldIndex",
                    width: "120px",
                    isSortable: true,
                    renderer: (obj: any, val: any) =>
                    {
                        return ((val != null) && (typeof val !== "undefined")) ? "User " + (val + 1) : "";
                    }
                });
            }

            fieldsTableColumns.push({
                title: "Type",
                dataProp: "fieldType",
                width: "120px",
                isSortable: true
            });

            if (!this.chkAdvanced.isChecked())
            {
                fieldsTableColumns.push({
                    title: "Editable",
                    dataProp: "isEditable",
                    width: "90px",
                    renderer: (obj: any, val: any) =>
                    {
                        return val ? "<span class='glyphicon glyphicon-ok'> </span>" : "";
                    }
                });
                fieldsTableColumns.push({
                    title: "Mandatory",
                    dataProp: "isMandatory",
                    width: "90px",
                    renderer: (obj: any, val: any) =>
                    {
                        return val ? "<span class='glyphicon glyphicon-ok'> </span>" : "";
                    }
                });
            }

            if (this.currentFieldGroup == null)
            {
                fieldsTableColumns.push({
                    title: "Field Group",
                    dataProp: "fieldGroupID",
                    isSortable: true,
                    renderer: (obj: any, val: any) =>
                    {
                        return "<a href='fields.jsp?fieldGroupID=" + val + "'>" + HtmlUtil.escapeHtml(obj.fieldGroup.name) + "</a>";
                    }
                });
            }

            if (this.chkAdvanced.isChecked())
            {
                fieldsTableColumns.push({
                    title: "Usage",
                    dataProp: "ID",
                    width: "60px",
                    renderer: (obj: any, val: any) =>
                    {
                        return "<a href='field-usage.jsp?id=" + obj.ID + "'>Usage</a>";
                    }
                });
            }

            fieldsTableColumns.push({
                title: "Picklist",
                dataProp: "ID",
                width: "90px",
                renderer: (obj: any, val: any) =>
                {
                    if (obj.isList)
                    {
                        return "<a href='javascript:$page.editList(\"" + obj.ID + "\",\"" + obj.fieldType + "\")'>Edit Picklist</a>";
                    }
                    else
                    {
                        return "";
                    }
                }
            });

            this.fieldsTable = new DataTable("fieldsTable", {
                selectionMode: controls.SelectionMode.Multi,
                columns: fieldsTableColumns,
                pageSize: 500,
                sortColumn: 0,

                pagedDataSource: new ServerPagedDataSource((params, callback: (resultSet: PartialResultSet<FieldDefinition>) => void) =>
                {
                    params.filter = this.txtSearch.getText();
                    params.include = "fieldGroup";
                    if (this.currentFieldGroup != null)
                    {
                        //                        params.include += " " + this.currentFieldGroup.objectClass;
                        params["fieldGroupID"] = this.currentFieldGroup.ID;
                    }

                    $catdv.getFields(params,
                        (resultSet: PartialResultSet<FieldDefinition>) =>
                        {
                            callback(resultSet);

                            var fields = resultSet.items;
                            this.fieldLookup = {};
                            fields.forEach((field) =>
                            {
                                this.fieldLookup[field.ID] = field;
                            });
                        },
                        () =>
                        {
                            callback({ totalItems: 0, offset: 0, items: [] });
                        });
                })
            });
        }
        
        public editField(fieldID: any)
        {
            var selectedField = this.fieldsTable.findItem((o) => { return o.ID == fieldID });
            this.editFieldDialog.setField(selectedField);
            this.editFieldDialog.onOK(() =>
            {
                this.fieldsTable.reload();
            });
            this.editFieldDialog.show();
        }

        public deleteField(fieldID: any)
        {
            var selectedField = this.fieldsTable.findItem((o) => { return o.ID == fieldID });
            MessageBox.confirm("Are you sure you want to delete '" + selectedField.identifier + "'", () =>
            {
                $catdv.deleteField(selectedField.ID, (reply) =>
                {
                    this.fieldsTable.reload();
                });
            });
        }

        public editList(fieldID: string, fieldType: string)
        {
            this.editListDialog.setField(fieldID, fieldType);
            this.editListDialog.onOK(() =>
            {
                this.fieldsTable.reload();
            });
            this.editListDialog.show();
        }
    }


    class MergeFieldsDialog extends controls.Modal
    {
        private lblMergeFields = new Label("lblMergeFields");
        private lstKeepField = new DropDownList("lstKeepField");
        private btnMergeFieldsOK = new Button("btnMergeFieldsOK");

        private allFieldDefinitions: FieldDefinition[];
        private keepFieldDef: FieldDefinition;
        private mergeFieldDefs: FieldDefinition[];

        constructor(elementId: string)
        {
            super(elementId);

            this.lstKeepField.onChanged((evt: any) =>
            {
                this.keepFieldDef = this.allFieldDefinitions[this.lstKeepField.getSelectedIndex()];
                this.updateControls();
            });

            this.btnMergeFieldsOK.onClick((evt: any) =>
            {
                this.btnOK_onClick(evt);
            });
        }

        public setFields(fieldDefinitions: FieldDefinition[])
        {
            this.allFieldDefinitions = fieldDefinitions;
            this.keepFieldDef = fieldDefinitions[0];

            this.lstKeepField.setItems(this.allFieldDefinitions.map((fieldDef) =>
            {
                return { value: fieldDef.ID, text: fieldDef.name + " (" + fieldDef.identifier + " [" + fieldDef.fieldType + "])" };
            }));

            this.updateControls();
        }

        private updateControls()
        {
            this.mergeFieldDefs = this.allFieldDefinitions.filter((fieldDef) => fieldDef !== this.keepFieldDef);
            this.lblMergeFields.$element.html(this.mergeFieldDefs
                .map((fieldDef) => fieldDef.name + " (" + fieldDef.identifier + " [" + fieldDef.fieldType + "])")
                .join("<br/>"));
        }

        private btnOK_onClick(evt: any)
        {
            $("body").css({ "cursor": "wait" });
            this.$element.find("button").css({ "cursor": "wait" }).attr("disabled", "disabled");
            this.btnMergeFieldsOK.setEnabled(false);
            $catdv.mergeFields(Number(this.keepFieldDef.ID), this.mergeFieldDefs.map((fieldDef) => Number(fieldDef.ID)),
                () =>
                {
                    $("body").css({ "cursor": "initial" });
                    this.$element.find("button").css({ "cursor": "initial" }).removeAttr("disabled");
                    this.close(true);
                },
                (status: String, error: string) =>
                {
                    $("body").css({ "cursor": "initial" });
                    this.$element.find("button").css({ "cursor": "initial" }).removeAttr("disabled");
                    this.close(false);
                    MessageBox.alert(error);
                });
        }
    }

    class EditFieldDialog extends controls.Modal
    {
        private lblEditFieldDialogTitle = new Label("lblEditFieldDialogTitle");
        private txtIdentifier = new TextBox("txtIdentifier");
        private txtName = new TextBox("txtName");
        private txtDescription = new TextBox("txtDescription");
        private lstFieldGroup = new DropDownList("lstFieldGroup");
        private lstFieldType = new DropDownList("lstFieldType");
        private divData = new Element("divData");
        private lblData = new Label("lblData");
        private txtData = new TextBox("txtData");
        private lblDataHelpText = new Label("lblDataHelpText");
        private chkEditLocked = new CheckBox("chkEditLocked");
        private chkEditLockedContainer = new Element("chkEditLockedContainer");
        private chkEditable = new CheckBox("chkEditable");
        private chkMandatory = new CheckBox("chkMandatory");
        private txtUserField = new TextBox("txtUserField");
        private btnNewFieldOK = new Button("btnEditFieldOK");
        
        private fieldDef: FieldDefinition;

        constructor(elementId: string)
        {
            super(elementId);

            this.lstFieldGroup.onChanged((evt: any) =>
            {
                var fieldGroupID = this.lstFieldGroup.getSelectedValue();
                var selectedFieldGroup: FieldGroup = fieldGroupLookup[fieldGroupID];
                this.fieldDef.memberOf = selectedFieldGroup.objectClass;
                if ((this.txtName.getText() != "") && (!this.fieldDef.ID))
                {
                    var prefix = selectedFieldGroup.identifierPrefix ? selectedFieldGroup.identifierPrefix + "." : "";
                    this.txtIdentifier.setText(prefix + this.txtName.getText().toLowerCase().replaceAll(" ", "."));
                }
            });
            
            this.lstFieldType.onChanged((evt: any) => {
                this.updateDataField();
             });

            this.txtName.onChanged((evt) =>
            {
                if ((this.txtName.getText() != "") && !this.fieldDef.ID)
                {
                    var fieldGroupID = this.lstFieldGroup.getSelectedValue();
                    var selectedFieldGroup: FieldGroup = fieldGroupLookup[fieldGroupID];
                    var prefix = selectedFieldGroup.identifierPrefix ? selectedFieldGroup.identifierPrefix + "." : "";
                    this.txtIdentifier.setText(prefix + this.txtName.getText().toLowerCase().replaceAll(" ", "."));
                }
            });

            this.chkEditLocked.onChanged((evt) =>
            {
                var editLocked = this.chkEditLocked.isChecked();
                this.lstFieldGroup.setEnabled(editLocked);
                this.txtIdentifier.setReadOnly(!editLocked);
            });

            this.btnNewFieldOK.onClick((evt: any) =>
            {
                this.btnOK_onClick(evt);
            });
        }

        public setField(fieldDef: FieldDefinition)
        {
            this.fieldDef = fieldDef;

            this.txtIdentifier.setText(fieldDef.identifier);
            this.txtName.setText(fieldDef.name);
            this.txtDescription.setText(fieldDef.description);
            this.lstFieldType.setSelectedValue(fieldDef.fieldType);
            this.txtData.setText(fieldDef.data);

            if (this.fieldDef.ID)
            {
                this.lblEditFieldDialogTitle.setText("Edit Field Definition");
                this.lstFieldGroup.setEnabled(false);
                this.txtIdentifier.setReadOnly(true);
                this.chkEditLocked.setChecked(false);
                this.chkEditLockedContainer.show();
            }
            else
            {
                this.lblEditFieldDialogTitle.setText("Add Field Definition");
                this.lstFieldGroup.setEnabled(true);
                this.txtIdentifier.setReadOnly(false);
                this.chkEditLocked.setChecked(true);
               this.chkEditLockedContainer.hide();
            }

            // Populate FieldGroup list with fielGroups of the relevan type
            this.lstFieldGroup.clearItems();
            for (var fieldGroupID in fieldGroupLookup)
            {
                if (fieldGroupLookup.hasOwnProperty(fieldGroupID))
                {
                    var fieldGroup = fieldGroupLookup[fieldGroupID];
                    if ((fieldDef.memberOf == null) || (fieldGroup.objectClass == fieldDef.memberOf))
                    {
                        this.lstFieldGroup.addItem({ text: fieldGroup.name, value: fieldGroup.ID });
                    }
                }
            }

            this.lstFieldGroup.setSelectedValue(fieldDef.fieldGroupID ? fieldDef.fieldGroupID.toString() : "");

            this.chkEditable.setChecked(fieldDef.isEditable);
            this.chkMandatory.setChecked(fieldDef.isMandatory);
            this.txtUserField.setText(((typeof fieldDef.userFieldIndex != "undefined") && (fieldDef.userFieldIndex != null)) ? "User " + (fieldDef.userFieldIndex + 1) : "");
            
            this.updateDataField();
        }

        private updateDataField()
        {
            var fieldType = this.lstFieldType.getSelectedValue();
            switch (fieldType)
            {
                case "radio":
                case "multi-checkbox":
                    this.lblData.setText("Values:");
                    this.lblDataHelpText.setText("List of " + ((fieldType == "radio") ? "radio button" : "checkbox") + " values - one per line");
                     this.divData.show();
                    break;
                case "checkbox":
                    this.lblData.setText("Label:");
                    this.lblDataHelpText.setText("Label for checkbox");
                    this.divData.show();
                    break;
                case "calculated":
                    this.lblData.setText("Expression:");
                    this.lblDataHelpText.setText("Variable expression (e.g. '${NM1}{s/x/y/}' or 'javascript:sqrt($('U1'))')");
                    this.divData.show();
                    break;
                default:
                    this.divData.hide();
                    break;
           }

        }
        
        private btnOK_onClick(evt: any)
        {
            var permissions: string[] = [];

            var fieldGroupID = parseInt(this.lstFieldGroup.getSelectedValue());
            var selectedFieldGroup: FieldGroup = fieldGroupLookup[fieldGroupID];

            var fieldDef: FieldDefinition =
                {
                    ID: this.fieldDef.ID,
                    fieldGroupID: fieldGroupID,
                    memberOf: selectedFieldGroup.objectClass,
                    identifier: this.txtIdentifier.getText(),
                    name: this.txtName.getText(),
                    description: this.txtDescription.getText(),
                    fieldType: this.lstFieldType.getSelectedValue(),
                    data: this.txtData.getText(),
                    isEditable: this.chkEditable.isChecked(),
                    isMandatory: this.chkMandatory.isChecked(),
                };

            $catdv.saveField(fieldDef, () =>
            {
                this.close(true);
            });
        }
    }


    class EditListDialog extends controls.Modal
    {
        private listValues = new TextArea("listValues");
        private chkLocked = new CheckBox("chkLocked");
        private chkExtensible = new CheckBox("chkExtensible");
        private chkSaveValues = new CheckBox("chkSaveValues");
        private chkKeepSorted = new CheckBox("chkKeepSorted");
        private divLinkedField = new Element("divLinkedField");
        private txtLinkedField = new TextBox("txtLinkedField");
        private btnPopulate = new Button("btnPopulate");

        private btnEditListOK = new Button("btnEditListOK");

        // Either FieldDefinition.ID or attributeID
        private fieldID: string;
        private isLinkedField: boolean;

        private picklist: Picklist;

        constructor(elementId: string)
        {
            super(elementId);

            this.btnPopulate.onClick((evt: any) => {
                $catdv.getFieldValues(this.fieldID, (values) => {
                    this.listValues.setText(values ? values.filter((value) => value && value.trim().length > 0).join("\n") : "");  
                });
            });
            
            this.btnEditListOK.onClick((evt: any) =>
            {
                this.picklist.isLocked = this.chkLocked.isChecked();
                this.picklist.isExtensible = this.chkExtensible.isChecked();
                this.picklist.savesValues = this.chkSaveValues.isChecked();
                this.picklist.isKeptSorted = this.chkKeepSorted.isChecked();
                this.picklist.linkedField = this.isLinkedField ? this.txtLinkedField.getText() : null;
                this.picklist.values = this.getValues();

                $catdv.updatePicklist(this.fieldID, this.picklist, () =>
                {
                    this.close(true);
                });
            });

            this.chkLocked.onChanged((evt: any) => { this.updateCheckboxes() });
            this.chkExtensible.onChanged((evt: any) => { this.updateCheckboxes() });
            this.chkSaveValues.onChanged((evt: any) => { this.updateCheckboxes() });
            this.chkKeepSorted.onChanged((evt: any) => { this.updateCheckboxes(); this.maybeSortItems() });
        }

        public setField(fieldID: string, fieldType: string)
        {
            this.fieldID = fieldID;
            this.isLinkedField = fieldType.startsWith("linked-");

            this.divLinkedField.show(this.isLinkedField);

            $catdv.getPicklist(fieldID, (picklist: Picklist) =>
            {
                this.picklist = picklist || {};

                this.chkLocked.setChecked(picklist.isLocked);
                this.chkExtensible.setChecked(picklist.isExtensible);
                this.chkSaveValues.setChecked(picklist.savesValues);
                this.chkKeepSorted.setChecked(picklist.isKeptSorted);
                this.txtLinkedField.setText(picklist.linkedField);
                this.setValues(picklist.values);

                this.updateCheckboxes();
                this.maybeSortItems();
            });
        }

        private getValues()
        {
            var prunedValues: string[] = [];
            this.listValues.getText().split("\n").forEach((item) => { if (item.trim().length > 0) prunedValues.push(item); });
            return prunedValues;
        }

        private setValues(values: string[])
        {
            this.listValues.setText(values ? values.join("\n") : "");
        }

        private maybeSortItems(): void
        {
            if (this.chkKeepSorted.isChecked())
            {
                this.setValues(this.getValues().sort());
            }
        }

        private updateCheckboxes(): void
        {
            if (this.chkLocked.isChecked())
            {
                this.chkExtensible.setChecked(false);
                this.chkExtensible.setEnabled(false);
            }
            else
            {
                this.chkExtensible.setEnabled(true);
            }
            if (!this.chkExtensible.isChecked())
            {
                this.chkSaveValues.setChecked(false);
                this.chkSaveValues.setEnabled(false);
            }
            else
            {
                this.chkSaveValues.setEnabled(true);
            }
            if (this.chkSaveValues.isChecked())
            {
                this.chkKeepSorted.setChecked(true);
                this.chkKeepSorted.setEnabled(false);
            }
            else
            {
                this.chkKeepSorted.setEnabled(true);
            }
        }

    }
    
    class RenumberUserFieldsDialog extends controls.Modal
    {
        private lstUserFields: DraggableListBox = new DraggableListBox("lstUserFields", true, false);

        private btnFieldUp: Button = new Button("btnFieldUp");
        private btnFieldDown: Button = new Button("btnFieldDown");
        private btnFieldInsert: Button = new Button("btnFieldInsert");
        private btnFieldRemove: Button = new Button("btnFieldRemove");

        private btnOK: Button = new Button("btnReorderUserFieldsOK");

        private fieldGroup: FieldGroup;
        private originalMapping: { [id: number]: number };

        private userFields: FieldDefinition[] = [];

        constructor(elementId: string)
        {
            super(elementId);

            this.lstUserFields.$element.addClass("userfield-list");

            this.lstUserFields.onDrop((evt) =>
            {
                var selectedValue = evt.itemValues[0];
                if ((selectedValue != null) && (evt.targetItemValue != null))
                {
                    var srcIndex = Number(selectedValue);
                    var targetIndex = Number(evt.targetItemValue);

                    var dragItem = this.userFields[srcIndex];
                    if (srcIndex < targetIndex)
                    {
                        for (var i = srcIndex; i < targetIndex - 1; i++)
                        {
                            this.userFields[i] = this.userFields[i + 1];
                        }
                        this.userFields[targetIndex - 1] = dragItem;
                    }
                    else
                    {
                        for (var i = srcIndex; i > targetIndex; i--)
                        {
                            this.userFields[i] = this.userFields[i - 1];
                        }
                        this.userFields[targetIndex] = dragItem;
                    }

                    this.reloadList();
                    this.lstUserFields.setSelectedIndex(targetIndex);
                }
            });

            this.lstUserFields.onSelectionChanged((evt) => this.updateControls());
 
            this.btnFieldUp.onClick((evt: any) =>
            {
                var selectedIndex = this.lstUserFields.getSelectedIndex();
                if (selectedIndex > 0)
                {
                    var tmp = this.userFields[selectedIndex - 1];
                    this.userFields[selectedIndex - 1] = this.userFields[selectedIndex];
                    this.userFields[selectedIndex] = tmp;
                    this.reloadList();
                    this.lstUserFields.setSelectedIndex(selectedIndex - 1);
                }
            });
            this.btnFieldDown.onClick((evt: any) =>
            {
                var selectedIndex = this.lstUserFields.getSelectedIndex();
                if ((selectedIndex != -1) && (selectedIndex < this.userFields.length - 1))
                {
                    var tmp = this.userFields[selectedIndex + 1];
                    this.userFields[selectedIndex + 1] = this.userFields[selectedIndex];
                    this.userFields[selectedIndex] = tmp;
                    this.reloadList();
                    this.lstUserFields.setSelectedIndex(selectedIndex + 1);
                }
            });
            this.btnFieldInsert.onClick((evt: any) =>
            {
                var selectedIndex = this.lstUserFields.getSelectedIndex();
                if (selectedIndex != -1)
                {
                    for (var i = this.userFields.length; i > selectedIndex; i--)
                    {
                        this.userFields[i] = this.userFields[i - 1];
                    }
                    this.userFields[selectedIndex] = null;
                    this.reloadList();
                }
            });
            this.btnFieldRemove.onClick((evt: any) =>
            {
                var selectedIndex = this.lstUserFields.getSelectedIndex();
                if (selectedIndex != -1)
                {
                    for (var i = selectedIndex; i < this.userFields.length; i++)
                    {
                        this.userFields[i] = this.userFields[i + 1];
                    }
                    this.userFields.pop();
                    this.reloadList();
                    if (selectedIndex < this.userFields.length - 1)
                    {
                        this.lstUserFields.setSelectedIndex(selectedIndex);
                    }
                    else if (this.userFields.length > 0)
                    {
                        this.lstUserFields.setSelectedIndex(this.userFields.length - 1);
                    }
                    this.updateControls();
                }
            });

            this.btnOK.onClick((evt: any) =>
            {
                var changes: FieldDefinition[] = [];
                this.userFields.forEach((userField, i) =>
                {
                    if(userField)
                    {
                        var originalIndex = this.originalMapping[userField.ID];
                        if (originalIndex != i)
                        {
                            changes.push({ ID: userField.ID, userFieldIndex: i });
                        }
                    }
                });
                if (changes.length > 0)
                {
                    $catdv.reorderUserFields(changes, () =>
                    {
                        this.close(true);
                    });
                }
                else
                {
                    this.close(true);
                }
            });
        }

        public show()
        {
            super.show();

            $catdv.getFields({ "include": "clip" }, (results) =>
            {
                var allFields = results.items.sort((a, b) => a.userFieldIndex - b.userFieldIndex);

                this.originalMapping = {};
                this.userFields = [];
                allFields.forEach((field) =>
                {
                    this.originalMapping[field.ID] = field.userFieldIndex;
                    this.userFields[field.userFieldIndex] = field;
                });

                this.reloadList();
            });
        }

        private reloadList()
        {
            this.lstUserFields.clear();
            // Use for loop here as forEach doesn't iterate over missing members
            for(var i=0; i < this.userFields.length; i++)
            {
                var field = this.userFields[i];
                if (field)
                {
                    this.lstUserFields.add(i.toString(), "U" + (i + 1) + " - " + field.name, field.identifier);
                }
                else
                {
                    this.lstUserFields.add(i.toString(), "U" + (i + 1) + " - Not Used", null, "empty-slot");
                }
            }
        }
        
        private updateControls()
        {
            var selectedIndex = this.lstUserFields.getSelectedIndex();
            var validSelection = (selectedIndex != -1);
            this.btnFieldUp.setEnabled(validSelection && (selectedIndex > 0));
            this.btnFieldDown.setEnabled(validSelection && (selectedIndex < this.userFields.length - 1));
            this.btnFieldInsert.setEnabled(validSelection);
            this.btnFieldRemove.setEnabled(validSelection && (this.userFields[selectedIndex] == null));
        }
    }
}

