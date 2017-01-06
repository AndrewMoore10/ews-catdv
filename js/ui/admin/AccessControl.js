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
        var Control = controls.Control;
        var Label = controls.Label;
        var Button = controls.Button;
        var ComboBox = controls.ComboBox;
        var DropDownList = controls.DropDownList;
        var CheckList = controls.CheckList;
        var Modal = controls.Modal;
        var SimpleArrayDataSource = controls.SimpleArrayDataSource;
        var $catdv = catdv.RestApi;
        var FieldDefinitionUtil = catdv.FieldDefinitionUtil;
        var EditACLDialog = (function (_super) {
            __extends(EditACLDialog, _super);
            function EditACLDialog(elementId, objectType) {
                var _this = this;
                _super.call(this, elementId, "Acl");
                this.lblEditACLDialogTitle = new Label("lblEditACLDialogTitle");
                this.listUserSelectors = null;
                this.btnAddUserSelector = new Button("btnAddUserSelector");
                this.btnEditUserSelector = new Button("btnEditUserSelector");
                this.btnDeleteUserSelector = new Button("btnDeleteUserSelector");
                this.listTargetSelectors = null;
                this.btnAddTargetCatalogSelector = new Button("btnAddTargetCatalogSelector");
                this.btnAddTargetRuleSelector = new Button("btnAddTargetRuleSelector");
                this.btnEditTargetSelector = new Button("btnEditTargetSelector");
                this.btnDeleteTargetSelector = new Button("btnDeleteTargetSelector");
                this.btnEditACLOK = new Button("btnEditACLOK");
                this.acl = [];
                this.selectedAccessRule = null;
                this.userFields = [
                    { ID: "USER", isBuiltin: true, memberOf: "user", identifier: "name", name: "User" },
                    { ID: "ROLE", isBuiltin: true, memberOf: "user", identifier: "role", name: "Role" }
                ];
                $catdv.getFields({ "include": "user,catalog,catalog.builtin" }, function (fieldResultSet) {
                    _this.fieldLookupByID = {};
                    fieldResultSet.items.concat(_this.userFields).forEach(function (fieldDef) {
                        _this.fieldLookupByID[FieldDefinitionUtil.getLongIdentifier(fieldDef)] = fieldDef;
                    });
                    _this.userFields = _this.userFields.concat(fieldResultSet.items.filter(function (field) { return field.memberOf == "user" && FieldDefinitionUtil.isListField(field); }));
                    _this.catalogFields = fieldResultSet.items.filter(function (field) { return field.memberOf == "catalog"; });
                    _this.listUserSelectors = new SelectorList("listUserSelectors", "", _this.fieldLookupByID);
                    _this.listUserSelectors.onSelectionChanged(function (evt) {
                        var selectedIndex = _this.listUserSelectors.getSelectedIndex();
                        _this.selectAccessRule((selectedIndex >= 0) ? _this.acl[selectedIndex] : null);
                    });
                    _this.btnAddUserSelector.onClick(function (evt) {
                        _this.editUserSelectorDialog.setSelector({}, true);
                        _this.editUserSelectorDialog.show();
                    });
                    _this.btnEditUserSelector.onClick(function (evt) {
                        var selector = _this.acl[_this.listUserSelectors.getSelectedIndex()].userSelector;
                        _this.editUserSelectorDialog.setSelector(selector, false);
                        _this.editUserSelectorDialog.show();
                    });
                    _this.btnDeleteUserSelector.onClick(function (evt) {
                        _this.acl.splice(_this.listUserSelectors.getSelectedIndex(), 1);
                        _this.listUserSelectors.setModel(_this.acl.map(function (rule) { return rule.userSelector; }));
                        _this.listUserSelectors.setSelectedIndex(_this.acl.length - 1);
                    });
                    _this.editUserSelectorDialog = new EditUserSelectorDialog("editUserSelectorDialog", _this.userFields);
                    _this.editUserSelectorDialog.onOK(function (newSelector, selector) {
                        if (newSelector) {
                            // When user adds a user selector they are also, implicitly creating a new AccessRule
                            var rule = {
                                userSelector: selector,
                                permissions: _this.group.defaultPermissions,
                                targetSelectors: []
                            };
                            _this.acl.push(rule);
                            _this.selectAccessRule(rule);
                        }
                        _this.listUserSelectors.setModel(_this.acl.map(function (rule) { return rule.userSelector; }));
                        _this.listUserSelectors.setSelectedIndex(_this.acl.length - 1);
                    });
                    _this.listTargetSelectors = new SelectorList("listTargetSelectors", "Applies to all catalogs in group", _this.fieldLookupByID);
                    _this.listTargetSelectors.onSelectionChanged(function (evt) {
                        _this.updateControls();
                    });
                    _this.btnAddTargetCatalogSelector.onClick(function (evt) {
                        _this.editCatalogSelectorDialog.setSelector(_this.group.ID, { field: "catalog.name", values: [] }, true);
                        _this.editCatalogSelectorDialog.show();
                    });
                    _this.btnAddTargetRuleSelector.onClick(function (evt) {
                        _this.editTargetSelectorDialog.setSelector({ field: "catalog.name", values: [] }, true);
                        _this.editTargetSelectorDialog.show();
                    });
                    _this.btnEditTargetSelector.onClick(function (evt) {
                        var selector = _this.selectedAccessRule.targetSelectors[_this.listTargetSelectors.getSelectedIndex()];
                        if ((selector.field == "catalog.name") && !selector.values.find(function (value) { return value.match("[$%*]") != null; })) {
                            _this.editCatalogSelectorDialog.setSelector(_this.group.ID, selector, false);
                            _this.editCatalogSelectorDialog.show();
                        }
                        else {
                            _this.editTargetSelectorDialog.setSelector(selector, false);
                            _this.editTargetSelectorDialog.show();
                        }
                    });
                    _this.btnDeleteTargetSelector.onClick(function (evt) {
                        _this.selectedAccessRule.targetSelectors.splice(_this.listTargetSelectors.getSelectedIndex(), 1);
                        _this.listTargetSelectors.setModel(_this.selectedAccessRule.targetSelectors);
                        _this.updateControls();
                    });
                    _this.editCatalogSelectorDialog = new EditCatalogSelectorDialog("editCatalogSelectorDialog");
                    _this.editCatalogSelectorDialog.onOK(function (newSelector, selector) {
                        if (newSelector) {
                            _this.selectedAccessRule.targetSelectors.push(selector);
                        }
                        _this.listTargetSelectors.setModel(_this.selectedAccessRule.targetSelectors);
                    });
                    _this.editTargetSelectorDialog = new EditTargetSelectorDialog("editTargetSelectorDialog", _this.catalogFields);
                    _this.editTargetSelectorDialog.onOK(function (newSelector, selector) {
                        if (newSelector) {
                            _this.selectedAccessRule.targetSelectors.push(selector);
                        }
                        _this.listTargetSelectors.setModel(_this.selectedAccessRule.targetSelectors);
                    });
                    _this.btnEditACLOK.onClick(function (evt) {
                        if (_this.selectedAccessRule != null) {
                            _this.selectedAccessRule.permissions = _super.prototype.readPermissionCheckboxes.call(_this);
                        }
                        _this.close(true, _this.acl);
                    });
                    _this.updateControls();
                });
            }
            EditACLDialog.prototype.setGroup = function (group) {
                var _this = this;
                // take a copy
                this.group = group;
                this.acl = [];
                (group.acl || []).forEach(function (rule) {
                    _this.acl.push($.extend(true, {}, rule));
                });
                this.lblEditACLDialogTitle.setText("Edit Access Control List for '" + group.name + "'");
                this.listUserSelectors.setModel(this.acl.map(function (rule) { return rule.userSelector; }));
                this.listUserSelectors.setSelectedIndex(this.acl.length - 1);
            };
            EditACLDialog.prototype.selectAccessRule = function (rule) {
                if (this.selectedAccessRule != null) {
                    this.selectedAccessRule.permissions = _super.prototype.readPermissionCheckboxes.call(this);
                }
                this.selectedAccessRule = rule;
                if (this.selectedAccessRule != null) {
                    _super.prototype.setPermissionCheckboxes.call(this, this.selectedAccessRule.permissions);
                    this.listTargetSelectors.setModel(this.selectedAccessRule.targetSelectors);
                }
                else {
                    _super.prototype.setPermissionCheckboxes.call(this, []);
                    this.listTargetSelectors.setModel([]);
                }
                this.updateControls();
            };
            EditACLDialog.prototype.updateControls = function () {
                if (this.listUserSelectors == null || (this.listUserSelectors.getSelectedIndex() == -1)) {
                    _super.prototype.enablePermissionCheckboxes.call(this, false);
                    this.btnEditUserSelector.setEnabled(false);
                    this.btnDeleteUserSelector.setEnabled(false);
                    this.btnAddTargetCatalogSelector.setEnabled(false);
                    this.btnAddTargetRuleSelector.setEnabled(false);
                    this.btnEditTargetSelector.setEnabled(false);
                    this.btnDeleteTargetSelector.setEnabled(false);
                }
                else {
                    _super.prototype.enablePermissionCheckboxes.call(this, true);
                    this.btnEditUserSelector.setEnabled(true);
                    this.btnDeleteUserSelector.setEnabled(true);
                    this.btnAddTargetCatalogSelector.setEnabled(true);
                    this.btnAddTargetRuleSelector.setEnabled(true);
                }
                if (this.listTargetSelectors == null || (this.listTargetSelectors.getSelectedIndex() == -1)) {
                    this.btnEditTargetSelector.setEnabled(false);
                    this.btnDeleteTargetSelector.setEnabled(false);
                }
                else {
                    this.btnEditTargetSelector.setEnabled(true);
                    this.btnDeleteTargetSelector.setEnabled(true);
                }
            };
            return EditACLDialog;
        }(admin.EditPermissionsDialog));
        admin.EditACLDialog = EditACLDialog;
        var SelectorList = (function (_super) {
            __extends(SelectorList, _super);
            function SelectorList(element, emptyMessage, fieldLookupByID) {
                var _this = this;
                _super.call(this, element);
                this.selectionChangedHandler = null;
                this.listModel = [];
                this.selectedIndex = -1;
                this.fieldLookupByID = fieldLookupByID;
                this.$element.addClass("listbox");
                // Create list inside passed in DIV
                this.$UL = $("<ul>").appendTo(this.$element);
                // Create label inside passed in DIV
                this.$msg = $("<div class='message'>" + HtmlUtil.escapeHtml(emptyMessage) + "</div>").appendTo(this.$element);
                // click on the background of the list de-selects eveything 
                this.$element.on("click", function (evt) {
                    _this.setSelectedIndex(-1);
                });
            }
            // Register for selection changed events
            SelectorList.prototype.onSelectionChanged = function (selectionChangedHandler) {
                this.selectionChangedHandler = selectionChangedHandler;
            };
            SelectorList.prototype.setModel = function (listModel) {
                this.listModel = listModel;
                this.renderList();
                this.selectedIndex = -1;
            };
            SelectorList.prototype.getSelectedIndex = function () {
                return this.selectedIndex;
            };
            SelectorList.prototype.setSelectedIndex = function (index) {
                // clear existing selection
                this.selectedIndex = index;
                this.$UL.children().removeClass("selected");
                if (index != -1) {
                    $("#" + this.elementId + "_" + this.selectedIndex).addClass("selected");
                }
                if (this.selectionChangedHandler) {
                    this.selectionChangedHandler({ src: this });
                }
            };
            SelectorList.prototype.renderList = function () {
                var _this = this;
                this.$UL.empty();
                if (this.listModel && this.listModel.length > 0) {
                    this.$msg.hide();
                    this.listModel.forEach(function (selector, i) {
                        var fieldDef = _this.fieldLookupByID[selector.field];
                        var fieldName = fieldDef ? fieldDef.name : selector.field;
                        var itemText = fieldName + ": " + selector.values.join(", ");
                        var $li = $("<li id='" + _this.elementId + "_" + i + "' class='acl-selector'>" + HtmlUtil.escapeHtml(itemText) + "</li>").appendTo(_this.$UL);
                        $li.on("click", function (evt) {
                            evt.stopPropagation();
                            _this.setSelectedIndex(i);
                            return false;
                        });
                    });
                }
                else {
                    this.$msg.show();
                }
            };
            SelectorList.prototype.getIndexFromElementId = function (elementId) {
                return Number(elementId.substring(elementId.lastIndexOf("_") + 1));
            };
            return SelectorList;
        }(Control));
        var EditUserSelectorDialog = (function (_super) {
            __extends(EditUserSelectorDialog, _super);
            function EditUserSelectorDialog(elementId, fields) {
                var _this = this;
                _super.call(this, elementId);
                this.lstFields = new DropDownList("lstUserFields");
                this.btnOK = new Button("btnEditUserSelectorOK");
                this.userDataSource = new SimpleArrayDataSource([]);
                this.selector = null;
                this.isNew = true;
                this.selectedField = null;
                this.fields = fields;
                this.fieldListItems = [];
                this.lstUserSelection = new CheckList("lstUserSelection", true, this.userDataSource);
                this.fields.forEach(function (fieldDef) {
                    _this.fieldListItems.push({
                        value: fieldDef.ID,
                        text: fieldDef.name
                    });
                });
                this.lstFields.setItems(this.fieldListItems);
                this.selectedField = this.fields[0];
                this.populateItemList(this.selectedField);
                this.lstFields.onChanged(function (evt) {
                    _this.selectedField = _this.fields[_this.lstFields.getSelectedIndex()];
                    _this.populateItemList(_this.selectedField);
                });
                this.btnOK.onClick(function (evt) {
                    _this.selector.field = FieldDefinitionUtil.getLongIdentifier(_this.selectedField);
                    _this.selector.values = _this.lstUserSelection.getSelectedValues();
                    _this.close(true, _this.isNew, _this.selector);
                });
            }
            EditUserSelectorDialog.prototype.setSelector = function (selector, isNew) {
                this.selector = selector;
                this.isNew = isNew;
                this.selectedField = this.fields.find(function (field) { return FieldDefinitionUtil.getLongIdentifier(field) == selector.field; }) || this.fields[0];
                this.lstFields.setSelectedValue(this.selectedField.ID);
                this.populateItemList(this.selectedField);
            };
            EditUserSelectorDialog.prototype.populateItemList = function (fieldDef) {
                var _this = this;
                if (fieldDef.ID == "USER") {
                    $catdv.getUsers({}, function (users) {
                        _this.userDataSource.setItems(users.map(function (user) {
                            return {
                                value: user.name,
                                text: user.name + (user.notes ? " (" + user.notes + ")" : ""),
                                isSelected: _this.selector && _this.selector.values && _this.selector.values.find(function (userName) { return userName == user.name; }) ? true : false
                            };
                        }));
                        _this.lstUserSelection.reload();
                    });
                }
                else if (fieldDef.ID == "ROLE") {
                    $catdv.getRoles({}, function (roles) {
                        _this.userDataSource.setItems(roles.map(function (role) {
                            return {
                                value: role.name,
                                text: role.name + (role.notes ? " (" + role.notes + ")" : ""),
                                isSelected: _this.selector && _this.selector.values && _this.selector.values.find(function (roleName) { return roleName == role.name; }) ? true : false
                            };
                        }));
                        _this.lstUserSelection.reload();
                    });
                }
                else {
                    $catdv.getFieldListValues(fieldDef.ID, function (values) {
                        _this.userDataSource.setItems(values.map(function (value) {
                            return {
                                value: value,
                                text: value,
                                isSelected: _this.selector && _this.selector.values && _this.selector.values.find(function (v) { return v == value; }) ? true : false
                            };
                        }));
                        _this.lstUserSelection.reload();
                    });
                }
            };
            return EditUserSelectorDialog;
        }(Modal));
        var EditCatalogSelectorDialog = (function (_super) {
            __extends(EditCatalogSelectorDialog, _super);
            function EditCatalogSelectorDialog(elementId) {
                var _this = this;
                _super.call(this, elementId);
                this.btnOK = new Button("btnEditCatalogSelectorOK");
                this.catalogDataSource = new SimpleArrayDataSource([]);
                this.selector = null;
                this.isNew = true;
                this.catalogs = null;
                this.lstCatalogs = new CheckList("lstCatalogs", true, this.catalogDataSource);
                this.btnOK.onClick(function (evt) {
                    _this.selector.values = _this.lstCatalogs.getSelectedValues();
                    _this.close(true, _this.isNew, _this.selector);
                });
            }
            EditCatalogSelectorDialog.prototype.setSelector = function (groupID, selector, isNew) {
                var _this = this;
                this.selector = selector;
                this.isNew = isNew;
                if (this.catalogs == null) {
                    $catdv.getCatalogs(function (catalogs) {
                        _this.catalogs = catalogs;
                        _this.populateItemList(groupID, _this.selector.values);
                    });
                }
                else {
                    this.populateItemList(groupID, this.selector.values);
                }
            };
            EditCatalogSelectorDialog.prototype.populateItemList = function (groupID, selectedCatalogs) {
                this.catalogDataSource.setItems(this.catalogs.filter(function (catalog) { return catalog.groupID == groupID; }).map(function (catalog) {
                    return {
                        value: catalog.name,
                        text: catalog.name,
                        isSelected: selectedCatalogs.find(function (catalogName) { return catalogName == catalog.name; }) ? true : false
                    };
                }));
                this.lstCatalogs.reload();
            };
            return EditCatalogSelectorDialog;
        }(Modal));
        var EditTargetSelectorDialog = (function (_super) {
            __extends(EditTargetSelectorDialog, _super);
            function EditTargetSelectorDialog(elementId, fields) {
                var _this = this;
                _super.call(this, elementId);
                this.lstTargetFields = new DropDownList("lstTargetFields");
                this.btnOK = new Button("btnEditTargetSelectorOK");
                this.selector = null;
                this.isNew = true;
                this.selectedField = null;
                this.fields = fields;
                this.targetDataSource = new SimpleArrayDataSource([]);
                this.lstTargetFieldValue = new ComboBox("lstTargetFieldValue", this.targetDataSource, false);
                this.fieldListItems = [];
                this.fields.forEach(function (fieldDef) {
                    _this.fieldListItems.push({
                        value: fieldDef.ID,
                        text: fieldDef.name
                    });
                });
                this.lstTargetFields.setItems(this.fieldListItems);
                this.selectedField = this.fields[0];
                this.populateItemList(this.selectedField, null);
                this.lstTargetFields.onChanged(function (evt) {
                    _this.selectedField = _this.fields[_this.lstTargetFields.getSelectedIndex()];
                    _this.populateItemList(_this.selectedField, null);
                });
                this.btnOK.onClick(function (evt) {
                    _this.selector.field = FieldDefinitionUtil.getLongIdentifier(_this.selectedField);
                    _this.selector.values = [_this.lstTargetFieldValue.getSelectedValue()];
                    _this.close(true, _this.isNew, _this.selector);
                });
            }
            EditTargetSelectorDialog.prototype.setSelector = function (selector, isNew) {
                this.selector = selector;
                this.isNew = isNew;
                this.selectedField = this.fields.find(function (field) { return selector && FieldDefinitionUtil.getLongIdentifier(field) == selector.field; }) || this.fields[0];
                this.lstTargetFields.setSelectedValue(this.selectedField.ID);
                this.populateItemList(this.selectedField, selector && selector.values ? selector.values.join(",") : null);
            };
            EditTargetSelectorDialog.prototype.populateItemList = function (fieldDef, selectedValue) {
                var _this = this;
                if (fieldDef.fieldType == "select-user") {
                    $catdv.getUsers({}, function (users) {
                        _this.targetDataSource.setItems(users.map(function (user) {
                            return {
                                value: user.name,
                                text: user.name + (user.notes ? " (" + user.notes + ")" : "")
                            };
                        }));
                        _this.lstTargetFieldValue.reload();
                        if (selectedValue)
                            _this.lstTargetFieldValue.setSelectedValue(selectedValue);
                    });
                }
                else if (fieldDef.fieldType == "select-group") {
                    $catdv.getGroups({}, function (groups) {
                        _this.targetDataSource.setItems(groups.map(function (group) {
                            return {
                                value: group.name,
                                text: group.name + (group.notes ? " (" + group.notes + ")" : "")
                            };
                        }));
                        _this.lstTargetFieldValue.reload();
                        if (selectedValue)
                            _this.lstTargetFieldValue.setSelectedValue(selectedValue);
                    });
                }
                else if (FieldDefinitionUtil.isListField(fieldDef)) {
                    $catdv.getFieldListValues(fieldDef.ID, function (values) {
                        _this.targetDataSource.setItems(values.map(function (value) { return { value: value, text: value }; }));
                        _this.lstTargetFieldValue.reload();
                        if (selectedValue)
                            _this.lstTargetFieldValue.setSelectedValue(selectedValue);
                    });
                }
                else {
                    $catdv.getFieldValues(fieldDef.ID, function (values) {
                        _this.targetDataSource.setItems(values.map(function (value) { return { value: value, text: value }; }));
                        _this.lstTargetFieldValue.reload();
                        if (selectedValue)
                            _this.lstTargetFieldValue.setSelectedValue(selectedValue);
                    });
                }
            };
            return EditTargetSelectorDialog;
        }(Modal));
    })(admin = ui.admin || (ui.admin = {}));
})(ui || (ui = {}));
