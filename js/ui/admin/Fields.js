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
        var ServerPagedDataSource = controls.ServerPagedDataSource;
        var DataTable = controls.DataTable;
        var Element = controls.Element;
        var Label = controls.Label;
        var Button = controls.Button;
        var TextBox = controls.TextBox;
        var TextArea = controls.TextArea;
        var DropDownList = controls.DropDownList;
        var CheckBox = controls.CheckBox;
        var MessageBox = controls.MessageBox;
        var DraggableListBox = controls.DraggableListBox;
        var $catdv = catdv.RestApi;
        var NavbarLoginMenu = ui.panels.NavbarLoginMenu;
        var FieldsForm = (function () {
            function FieldsForm() {
                var _this = this;
                this.lblPageHeader = new Label("lblPageHeader");
                this.txtSearch = new TextBox("txtSearch");
                this.chkAdvanced = new CheckBox("chkAdvanced");
                this.btnAddField = new Button("btnAddField");
                this.btnMergeFields = new Button("btnMergeFields");
                this.btnDeleteField = new Button("btnDeleteField");
                this.btnRenumberUserFields = new Button("btnRenumberUserFields");
                this.editFieldDialog = new EditFieldDialog("editFieldDialog");
                this.editListDialog = new EditListDialog("editListDialog");
                this.mergeFieldsDialog = new MergeFieldsDialog("mergeFieldsDialog");
                this.navbarLoginMenu = new NavbarLoginMenu("navbarLoginMenu");
                this.renumberUserFieldsDialog = new RenumberUserFieldsDialog("renumberUserFieldsDialog");
                this.fieldLookup = {};
                this.isAllFieldsGroup = false;
                this.isClipFieldGroup = false;
                this.currentFieldGroup = (typeof currentFieldGroup !== "undefined") ? currentFieldGroup : null;
                this.isAllFieldsGroup = (this.currentFieldGroup == null);
                this.isClipFieldGroup = (this.currentFieldGroup == null) || (this.currentFieldGroup.objectClass == "clip");
                this.btnRenumberUserFields.show(this.isAllFieldsGroup);
                this.lblPageHeader.$element.html("<a href='fieldgroups.jsp'>Field Groups</a> / " + (this.currentFieldGroup ? this.currentFieldGroup.name : "All User Fields"));
                this.buildFieldsTable();
                this.btnAddField.onClick(function (evt) {
                    _this.editFieldDialog.setField({
                        ID: null,
                        fieldGroupID: _this.currentFieldGroup != null ? _this.currentFieldGroup.ID : null,
                        memberOf: _this.currentFieldGroup != null ? _this.currentFieldGroup.objectClass : "clip",
                        isEditable: true
                    });
                    _this.editFieldDialog.onOK(function () {
                        _this.fieldsTable.reload();
                    });
                    _this.editFieldDialog.show();
                });
                this.mergeFieldsDialog.onOK(function () { return _this.fieldsTable.reload(); });
                this.btnMergeFields.onClick(function (evt) {
                    var selectedItems = _this.fieldsTable.getSelectedItems();
                    if (selectedItems.length < 2) {
                        MessageBox.alert("You must select more than one field definition to merge");
                    }
                    else {
                        if (selectedItems.filter(function (item) { return item.memberOf != "clip"; }).length > 0) {
                            MessageBox.alert("Merging is currently only supported for Clip fields");
                        }
                        else {
                            _this.mergeFieldsDialog.setFields(selectedItems);
                            _this.mergeFieldsDialog.show();
                        }
                    }
                });
                this.btnDeleteField.onClick(function (evt) {
                    var selectedItems = _this.fieldsTable.getSelectedItems();
                    if (selectedItems.length == 1) {
                        MessageBox.confirm("Are you sure you want to delete '" + selectedItems[0].name + "'?", function () {
                            $catdv.deleteField(selectedItems[0].ID, function () {
                                _this.fieldsTable.reload();
                            }, function (status, error) {
                                alert(error); // Hack. Nested MessageBoxes don't work
                            });
                        });
                    }
                    else if (selectedItems.length > 1) {
                        MessageBox.confirm("Are you sure you want to delete '" + selectedItems.length + "' fields?", function () {
                            var results = 0;
                            var errors = "";
                            selectedItems.forEach(function (selectedItem) {
                                $catdv.deleteField(selectedItem.ID, function () {
                                    if (++results == selectedItems.length) {
                                        _this.fieldsTable.reload();
                                        if (errors)
                                            alert(errors);
                                    }
                                }, function (status, error) {
                                    errors += error + "\n";
                                    if (++results == selectedItems.length) {
                                        _this.fieldsTable.reload();
                                        alert(errors);
                                    }
                                });
                            });
                        });
                    }
                });
                this.btnRenumberUserFields.onClick(function (evt) {
                    _this.renumberUserFieldsDialog.onOK(function () {
                        _this.fieldsTable.reload();
                    });
                    _this.renumberUserFieldsDialog.show();
                });
                this.txtSearch.onInput(function (evt) {
                    var searchText = _this.txtSearch.getText();
                    if ((searchText.length == 0) || (searchText.length > 2)) {
                        _this.fieldsTable.reload();
                    }
                });
                this.chkAdvanced.onChanged(function (evt) {
                    _this.btnMergeFields.show(_this.chkAdvanced.isChecked());
                    _this.buildFieldsTable();
                });
                this.btnMergeFields.show(this.chkAdvanced.isChecked());
            }
            FieldsForm.prototype.buildFieldsTable = function () {
                var _this = this;
                var fieldsTableColumns = [];
                if (this.isAllFieldsGroup) {
                    fieldsTableColumns.push({
                        title: "User Field",
                        dataProp: "userFieldIndex",
                        width: "120px",
                        isSortable: true,
                        renderer: function (obj, val) {
                            if ((val != null) && (typeof val !== "undefined")) {
                                return "<a href='javascript:$page.editField(" + obj.ID + ")'>User " + (val + 1) + "</a>";
                            }
                            else {
                                return "";
                            }
                        }
                    });
                }
                fieldsTableColumns.push({
                    title: "Field Name",
                    dataProp: "name",
                    isSortable: true,
                    renderer: function (obj, val) {
                        var tooltip = obj.memberOf + (obj.isBuiltin ? "." + obj.identifier : "[" + obj.identifier + "]");
                        return "<a href='javascript:$page.editField(" + obj.ID + ")' title='" + HtmlUtil.escapeHtml(tooltip) + "'>" + HtmlUtil.escapeHtml(obj.name) + "</a>";
                    }
                });
                fieldsTableColumns.push({ title: "Identifier", dataProp: "identifier", isSortable: true });
                if (this.chkAdvanced.isChecked()) {
                    fieldsTableColumns.push({ title: "Origin", dataProp: "origin", isSortable: true });
                }
                if (!this.isAllFieldsGroup && this.isClipFieldGroup) {
                    fieldsTableColumns.push({
                        title: "User Field",
                        dataProp: "userFieldIndex",
                        width: "120px",
                        isSortable: true,
                        renderer: function (obj, val) {
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
                if (!this.chkAdvanced.isChecked()) {
                    fieldsTableColumns.push({
                        title: "Editable",
                        dataProp: "isEditable",
                        width: "90px",
                        renderer: function (obj, val) {
                            return val ? "<span class='glyphicon glyphicon-ok'> </span>" : "";
                        }
                    });
                    fieldsTableColumns.push({
                        title: "Mandatory",
                        dataProp: "isMandatory",
                        width: "90px",
                        renderer: function (obj, val) {
                            return val ? "<span class='glyphicon glyphicon-ok'> </span>" : "";
                        }
                    });
                }
                if (this.currentFieldGroup == null) {
                    fieldsTableColumns.push({
                        title: "Field Group",
                        dataProp: "fieldGroupID",
                        isSortable: true,
                        renderer: function (obj, val) {
                            return "<a href='fields.jsp?fieldGroupID=" + val + "'>" + HtmlUtil.escapeHtml(obj.fieldGroup.name) + "</a>";
                        }
                    });
                }
                if (this.chkAdvanced.isChecked()) {
                    fieldsTableColumns.push({
                        title: "Usage",
                        dataProp: "ID",
                        width: "60px",
                        renderer: function (obj, val) {
                            return "<a href='field-usage.jsp?id=" + obj.ID + "'>Usage</a>";
                        }
                    });
                }
                fieldsTableColumns.push({
                    title: "Picklist",
                    dataProp: "ID",
                    width: "90px",
                    renderer: function (obj, val) {
                        if (obj.isList) {
                            return "<a href='javascript:$page.editList(\"" + obj.ID + "\",\"" + obj.fieldType + "\")'>Edit Picklist</a>";
                        }
                        else {
                            return "";
                        }
                    }
                });
                this.fieldsTable = new DataTable("fieldsTable", {
                    selectionMode: controls.SelectionMode.Multi,
                    columns: fieldsTableColumns,
                    pageSize: 500,
                    sortColumn: 0,
                    pagedDataSource: new ServerPagedDataSource(function (params, callback) {
                        params.filter = _this.txtSearch.getText();
                        params.include = "fieldGroup";
                        if (_this.currentFieldGroup != null) {
                            //                        params.include += " " + this.currentFieldGroup.objectClass;
                            params["fieldGroupID"] = _this.currentFieldGroup.ID;
                        }
                        $catdv.getFields(params, function (resultSet) {
                            callback(resultSet);
                            var fields = resultSet.items;
                            _this.fieldLookup = {};
                            fields.forEach(function (field) {
                                _this.fieldLookup[field.ID] = field;
                            });
                        }, function () {
                            callback({ totalItems: 0, offset: 0, items: [] });
                        });
                    })
                });
            };
            FieldsForm.prototype.editField = function (fieldID) {
                var _this = this;
                var selectedField = this.fieldsTable.findItem(function (o) { return o.ID == fieldID; });
                this.editFieldDialog.setField(selectedField);
                this.editFieldDialog.onOK(function () {
                    _this.fieldsTable.reload();
                });
                this.editFieldDialog.show();
            };
            FieldsForm.prototype.deleteField = function (fieldID) {
                var _this = this;
                var selectedField = this.fieldsTable.findItem(function (o) { return o.ID == fieldID; });
                MessageBox.confirm("Are you sure you want to delete '" + selectedField.identifier + "'", function () {
                    $catdv.deleteField(selectedField.ID, function (reply) {
                        _this.fieldsTable.reload();
                    });
                });
            };
            FieldsForm.prototype.editList = function (fieldID, fieldType) {
                var _this = this;
                this.editListDialog.setField(fieldID, fieldType);
                this.editListDialog.onOK(function () {
                    _this.fieldsTable.reload();
                });
                this.editListDialog.show();
            };
            return FieldsForm;
        }());
        admin.FieldsForm = FieldsForm;
        var MergeFieldsDialog = (function (_super) {
            __extends(MergeFieldsDialog, _super);
            function MergeFieldsDialog(elementId) {
                var _this = this;
                _super.call(this, elementId);
                this.lblMergeFields = new Label("lblMergeFields");
                this.lstKeepField = new DropDownList("lstKeepField");
                this.btnMergeFieldsOK = new Button("btnMergeFieldsOK");
                this.lstKeepField.onChanged(function (evt) {
                    _this.keepFieldDef = _this.allFieldDefinitions[_this.lstKeepField.getSelectedIndex()];
                    _this.updateControls();
                });
                this.btnMergeFieldsOK.onClick(function (evt) {
                    _this.btnOK_onClick(evt);
                });
            }
            MergeFieldsDialog.prototype.setFields = function (fieldDefinitions) {
                this.allFieldDefinitions = fieldDefinitions;
                this.keepFieldDef = fieldDefinitions[0];
                this.lstKeepField.setItems(this.allFieldDefinitions.map(function (fieldDef) {
                    return { value: fieldDef.ID, text: fieldDef.name + " (" + fieldDef.identifier + " [" + fieldDef.fieldType + "])" };
                }));
                this.updateControls();
            };
            MergeFieldsDialog.prototype.updateControls = function () {
                var _this = this;
                this.mergeFieldDefs = this.allFieldDefinitions.filter(function (fieldDef) { return fieldDef !== _this.keepFieldDef; });
                this.lblMergeFields.$element.html(this.mergeFieldDefs
                    .map(function (fieldDef) { return fieldDef.name + " (" + fieldDef.identifier + " [" + fieldDef.fieldType + "])"; })
                    .join("<br/>"));
            };
            MergeFieldsDialog.prototype.btnOK_onClick = function (evt) {
                var _this = this;
                $("body").css({ "cursor": "wait" });
                this.$element.find("button").css({ "cursor": "wait" }).attr("disabled", "disabled");
                this.btnMergeFieldsOK.setEnabled(false);
                $catdv.mergeFields(Number(this.keepFieldDef.ID), this.mergeFieldDefs.map(function (fieldDef) { return Number(fieldDef.ID); }), function () {
                    $("body").css({ "cursor": "initial" });
                    _this.$element.find("button").css({ "cursor": "initial" }).removeAttr("disabled");
                    _this.close(true);
                }, function (status, error) {
                    $("body").css({ "cursor": "initial" });
                    _this.$element.find("button").css({ "cursor": "initial" }).removeAttr("disabled");
                    _this.close(false);
                    MessageBox.alert(error);
                });
            };
            return MergeFieldsDialog;
        }(controls.Modal));
        var EditFieldDialog = (function (_super) {
            __extends(EditFieldDialog, _super);
            function EditFieldDialog(elementId) {
                var _this = this;
                _super.call(this, elementId);
                this.lblEditFieldDialogTitle = new Label("lblEditFieldDialogTitle");
                this.txtIdentifier = new TextBox("txtIdentifier");
                this.txtName = new TextBox("txtName");
                this.txtDescription = new TextBox("txtDescription");
                this.lstFieldGroup = new DropDownList("lstFieldGroup");
                this.lstFieldType = new DropDownList("lstFieldType");
                this.divData = new Element("divData");
                this.lblData = new Label("lblData");
                this.txtData = new TextBox("txtData");
                this.lblDataHelpText = new Label("lblDataHelpText");
                this.chkEditLocked = new CheckBox("chkEditLocked");
                this.chkEditLockedContainer = new Element("chkEditLockedContainer");
                this.chkEditable = new CheckBox("chkEditable");
                this.chkMandatory = new CheckBox("chkMandatory");
                this.txtUserField = new TextBox("txtUserField");
                this.btnNewFieldOK = new Button("btnEditFieldOK");
                this.lstFieldGroup.onChanged(function (evt) {
                    var fieldGroupID = _this.lstFieldGroup.getSelectedValue();
                    var selectedFieldGroup = fieldGroupLookup[fieldGroupID];
                    _this.fieldDef.memberOf = selectedFieldGroup.objectClass;
                    if ((_this.txtName.getText() != "") && (!_this.fieldDef.ID)) {
                        var prefix = selectedFieldGroup.identifierPrefix ? selectedFieldGroup.identifierPrefix + "." : "";
                        _this.txtIdentifier.setText(prefix + _this.txtName.getText().toLowerCase().replaceAll(" ", "."));
                    }
                });
                this.lstFieldType.onChanged(function (evt) {
                    _this.updateDataField();
                });
                this.txtName.onChanged(function (evt) {
                    if ((_this.txtName.getText() != "") && !_this.fieldDef.ID) {
                        var fieldGroupID = _this.lstFieldGroup.getSelectedValue();
                        var selectedFieldGroup = fieldGroupLookup[fieldGroupID];
                        var prefix = selectedFieldGroup.identifierPrefix ? selectedFieldGroup.identifierPrefix + "." : "";
                        _this.txtIdentifier.setText(prefix + _this.txtName.getText().toLowerCase().replaceAll(" ", "."));
                    }
                });
                this.chkEditLocked.onChanged(function (evt) {
                    var editLocked = _this.chkEditLocked.isChecked();
                    _this.lstFieldGroup.setEnabled(editLocked);
                    _this.txtIdentifier.setReadOnly(!editLocked);
                });
                this.btnNewFieldOK.onClick(function (evt) {
                    _this.btnOK_onClick(evt);
                });
            }
            EditFieldDialog.prototype.setField = function (fieldDef) {
                this.fieldDef = fieldDef;
                this.txtIdentifier.setText(fieldDef.identifier);
                this.txtName.setText(fieldDef.name);
                this.txtDescription.setText(fieldDef.description);
                this.lstFieldType.setSelectedValue(fieldDef.fieldType);
                this.txtData.setText(fieldDef.data);
                if (this.fieldDef.ID) {
                    this.lblEditFieldDialogTitle.setText("Edit Field Definition");
                    this.lstFieldGroup.setEnabled(false);
                    this.txtIdentifier.setReadOnly(true);
                    this.chkEditLocked.setChecked(false);
                    this.chkEditLockedContainer.show();
                }
                else {
                    this.lblEditFieldDialogTitle.setText("Add Field Definition");
                    this.lstFieldGroup.setEnabled(true);
                    this.txtIdentifier.setReadOnly(false);
                    this.chkEditLocked.setChecked(true);
                    this.chkEditLockedContainer.hide();
                }
                // Populate FieldGroup list with fielGroups of the relevan type
                this.lstFieldGroup.clearItems();
                for (var fieldGroupID in fieldGroupLookup) {
                    if (fieldGroupLookup.hasOwnProperty(fieldGroupID)) {
                        var fieldGroup = fieldGroupLookup[fieldGroupID];
                        if ((fieldDef.memberOf == null) || (fieldGroup.objectClass == fieldDef.memberOf)) {
                            this.lstFieldGroup.addItem({ text: fieldGroup.name, value: fieldGroup.ID });
                        }
                    }
                }
                this.lstFieldGroup.setSelectedValue(fieldDef.fieldGroupID ? fieldDef.fieldGroupID.toString() : "");
                this.chkEditable.setChecked(fieldDef.isEditable);
                this.chkMandatory.setChecked(fieldDef.isMandatory);
                this.txtUserField.setText(((typeof fieldDef.userFieldIndex != "undefined") && (fieldDef.userFieldIndex != null)) ? "User " + (fieldDef.userFieldIndex + 1) : "");
                this.updateDataField();
            };
            EditFieldDialog.prototype.updateDataField = function () {
                var fieldType = this.lstFieldType.getSelectedValue();
                switch (fieldType) {
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
            };
            EditFieldDialog.prototype.btnOK_onClick = function (evt) {
                var _this = this;
                var permissions = [];
                var fieldGroupID = parseInt(this.lstFieldGroup.getSelectedValue());
                var selectedFieldGroup = fieldGroupLookup[fieldGroupID];
                var fieldDef = {
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
                $catdv.saveField(fieldDef, function () {
                    _this.close(true);
                });
            };
            return EditFieldDialog;
        }(controls.Modal));
        var EditListDialog = (function (_super) {
            __extends(EditListDialog, _super);
            function EditListDialog(elementId) {
                var _this = this;
                _super.call(this, elementId);
                this.listValues = new TextArea("listValues");
                this.chkLocked = new CheckBox("chkLocked");
                this.chkExtensible = new CheckBox("chkExtensible");
                this.chkSaveValues = new CheckBox("chkSaveValues");
                this.chkKeepSorted = new CheckBox("chkKeepSorted");
                this.divLinkedField = new Element("divLinkedField");
                this.txtLinkedField = new TextBox("txtLinkedField");
                this.btnPopulate = new Button("btnPopulate");
                this.btnEditListOK = new Button("btnEditListOK");
                this.btnPopulate.onClick(function (evt) {
                    $catdv.getFieldValues(_this.fieldID, function (values) {
                        _this.listValues.setText(values ? values.filter(function (value) { return value && value.trim().length > 0; }).join("\n") : "");
                    });
                });
                this.btnEditListOK.onClick(function (evt) {
                    _this.picklist.isLocked = _this.chkLocked.isChecked();
                    _this.picklist.isExtensible = _this.chkExtensible.isChecked();
                    _this.picklist.savesValues = _this.chkSaveValues.isChecked();
                    _this.picklist.isKeptSorted = _this.chkKeepSorted.isChecked();
                    _this.picklist.linkedField = _this.isLinkedField ? _this.txtLinkedField.getText() : null;
                    _this.picklist.values = _this.getValues();
                    $catdv.updatePicklist(_this.fieldID, _this.picklist, function () {
                        _this.close(true);
                    });
                });
                this.chkLocked.onChanged(function (evt) { _this.updateCheckboxes(); });
                this.chkExtensible.onChanged(function (evt) { _this.updateCheckboxes(); });
                this.chkSaveValues.onChanged(function (evt) { _this.updateCheckboxes(); });
                this.chkKeepSorted.onChanged(function (evt) { _this.updateCheckboxes(); _this.maybeSortItems(); });
            }
            EditListDialog.prototype.setField = function (fieldID, fieldType) {
                var _this = this;
                this.fieldID = fieldID;
                this.isLinkedField = fieldType.startsWith("linked-");
                this.divLinkedField.show(this.isLinkedField);
                $catdv.getPicklist(fieldID, function (picklist) {
                    _this.picklist = picklist || {};
                    _this.chkLocked.setChecked(picklist.isLocked);
                    _this.chkExtensible.setChecked(picklist.isExtensible);
                    _this.chkSaveValues.setChecked(picklist.savesValues);
                    _this.chkKeepSorted.setChecked(picklist.isKeptSorted);
                    _this.txtLinkedField.setText(picklist.linkedField);
                    _this.setValues(picklist.values);
                    _this.updateCheckboxes();
                    _this.maybeSortItems();
                });
            };
            EditListDialog.prototype.getValues = function () {
                var prunedValues = [];
                this.listValues.getText().split("\n").forEach(function (item) { if (item.trim().length > 0)
                    prunedValues.push(item); });
                return prunedValues;
            };
            EditListDialog.prototype.setValues = function (values) {
                this.listValues.setText(values ? values.join("\n") : "");
            };
            EditListDialog.prototype.maybeSortItems = function () {
                if (this.chkKeepSorted.isChecked()) {
                    this.setValues(this.getValues().sort());
                }
            };
            EditListDialog.prototype.updateCheckboxes = function () {
                if (this.chkLocked.isChecked()) {
                    this.chkExtensible.setChecked(false);
                    this.chkExtensible.setEnabled(false);
                }
                else {
                    this.chkExtensible.setEnabled(true);
                }
                if (!this.chkExtensible.isChecked()) {
                    this.chkSaveValues.setChecked(false);
                    this.chkSaveValues.setEnabled(false);
                }
                else {
                    this.chkSaveValues.setEnabled(true);
                }
                if (this.chkSaveValues.isChecked()) {
                    this.chkKeepSorted.setChecked(true);
                    this.chkKeepSorted.setEnabled(false);
                }
                else {
                    this.chkKeepSorted.setEnabled(true);
                }
            };
            return EditListDialog;
        }(controls.Modal));
        var RenumberUserFieldsDialog = (function (_super) {
            __extends(RenumberUserFieldsDialog, _super);
            function RenumberUserFieldsDialog(elementId) {
                var _this = this;
                _super.call(this, elementId);
                this.lstUserFields = new DraggableListBox("lstUserFields", true, false);
                this.btnFieldUp = new Button("btnFieldUp");
                this.btnFieldDown = new Button("btnFieldDown");
                this.btnFieldInsert = new Button("btnFieldInsert");
                this.btnFieldRemove = new Button("btnFieldRemove");
                this.btnOK = new Button("btnReorderUserFieldsOK");
                this.userFields = [];
                this.lstUserFields.$element.addClass("userfield-list");
                this.lstUserFields.onDrop(function (evt) {
                    var selectedValue = evt.itemValues[0];
                    if ((selectedValue != null) && (evt.targetItemValue != null)) {
                        var srcIndex = Number(selectedValue);
                        var targetIndex = Number(evt.targetItemValue);
                        var dragItem = _this.userFields[srcIndex];
                        if (srcIndex < targetIndex) {
                            for (var i = srcIndex; i < targetIndex - 1; i++) {
                                _this.userFields[i] = _this.userFields[i + 1];
                            }
                            _this.userFields[targetIndex - 1] = dragItem;
                        }
                        else {
                            for (var i = srcIndex; i > targetIndex; i--) {
                                _this.userFields[i] = _this.userFields[i - 1];
                            }
                            _this.userFields[targetIndex] = dragItem;
                        }
                        _this.reloadList();
                        _this.lstUserFields.setSelectedIndex(targetIndex);
                    }
                });
                this.lstUserFields.onSelectionChanged(function (evt) { return _this.updateControls(); });
                this.btnFieldUp.onClick(function (evt) {
                    var selectedIndex = _this.lstUserFields.getSelectedIndex();
                    if (selectedIndex > 0) {
                        var tmp = _this.userFields[selectedIndex - 1];
                        _this.userFields[selectedIndex - 1] = _this.userFields[selectedIndex];
                        _this.userFields[selectedIndex] = tmp;
                        _this.reloadList();
                        _this.lstUserFields.setSelectedIndex(selectedIndex - 1);
                    }
                });
                this.btnFieldDown.onClick(function (evt) {
                    var selectedIndex = _this.lstUserFields.getSelectedIndex();
                    if ((selectedIndex != -1) && (selectedIndex < _this.userFields.length - 1)) {
                        var tmp = _this.userFields[selectedIndex + 1];
                        _this.userFields[selectedIndex + 1] = _this.userFields[selectedIndex];
                        _this.userFields[selectedIndex] = tmp;
                        _this.reloadList();
                        _this.lstUserFields.setSelectedIndex(selectedIndex + 1);
                    }
                });
                this.btnFieldInsert.onClick(function (evt) {
                    var selectedIndex = _this.lstUserFields.getSelectedIndex();
                    if (selectedIndex != -1) {
                        for (var i = _this.userFields.length; i > selectedIndex; i--) {
                            _this.userFields[i] = _this.userFields[i - 1];
                        }
                        _this.userFields[selectedIndex] = null;
                        _this.reloadList();
                    }
                });
                this.btnFieldRemove.onClick(function (evt) {
                    var selectedIndex = _this.lstUserFields.getSelectedIndex();
                    if (selectedIndex != -1) {
                        for (var i = selectedIndex; i < _this.userFields.length; i++) {
                            _this.userFields[i] = _this.userFields[i + 1];
                        }
                        _this.userFields.pop();
                        _this.reloadList();
                        if (selectedIndex < _this.userFields.length - 1) {
                            _this.lstUserFields.setSelectedIndex(selectedIndex);
                        }
                        else if (_this.userFields.length > 0) {
                            _this.lstUserFields.setSelectedIndex(_this.userFields.length - 1);
                        }
                        _this.updateControls();
                    }
                });
                this.btnOK.onClick(function (evt) {
                    var changes = [];
                    _this.userFields.forEach(function (userField, i) {
                        if (userField) {
                            var originalIndex = _this.originalMapping[userField.ID];
                            if (originalIndex != i) {
                                changes.push({ ID: userField.ID, userFieldIndex: i });
                            }
                        }
                    });
                    if (changes.length > 0) {
                        $catdv.reorderUserFields(changes, function () {
                            _this.close(true);
                        });
                    }
                    else {
                        _this.close(true);
                    }
                });
            }
            RenumberUserFieldsDialog.prototype.show = function () {
                var _this = this;
                _super.prototype.show.call(this);
                $catdv.getFields({ "include": "clip" }, function (results) {
                    var allFields = results.items.sort(function (a, b) { return a.userFieldIndex - b.userFieldIndex; });
                    _this.originalMapping = {};
                    _this.userFields = [];
                    allFields.forEach(function (field) {
                        _this.originalMapping[field.ID] = field.userFieldIndex;
                        _this.userFields[field.userFieldIndex] = field;
                    });
                    _this.reloadList();
                });
            };
            RenumberUserFieldsDialog.prototype.reloadList = function () {
                this.lstUserFields.clear();
                // Use for loop here as forEach doesn't iterate over missing members
                for (var i = 0; i < this.userFields.length; i++) {
                    var field = this.userFields[i];
                    if (field) {
                        this.lstUserFields.add(i.toString(), "U" + (i + 1) + " - " + field.name, field.identifier);
                    }
                    else {
                        this.lstUserFields.add(i.toString(), "U" + (i + 1) + " - Not Used", null, "empty-slot");
                    }
                }
            };
            RenumberUserFieldsDialog.prototype.updateControls = function () {
                var selectedIndex = this.lstUserFields.getSelectedIndex();
                var validSelection = (selectedIndex != -1);
                this.btnFieldUp.setEnabled(validSelection && (selectedIndex > 0));
                this.btnFieldDown.setEnabled(validSelection && (selectedIndex < this.userFields.length - 1));
                this.btnFieldInsert.setEnabled(validSelection);
                this.btnFieldRemove.setEnabled(validSelection && (this.userFields[selectedIndex] == null));
            };
            return RenumberUserFieldsDialog;
        }(controls.Modal));
    })(admin = ui.admin || (ui.admin = {}));
})(ui || (ui = {}));
