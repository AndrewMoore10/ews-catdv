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
        var Element = controls.Element;
        var SimpleServerDataSource = controls.SimpleServerDataSource;
        var DataTable = controls.DataTable;
        var SelectionMode = controls.SelectionMode;
        var Button = controls.Button;
        var TextBox = controls.TextBox;
        var Label = controls.Label;
        var CheckBox = controls.CheckBox;
        var ListBox = controls.ListBox;
        var DraggableListBox = controls.DraggableListBox;
        var MessageBox = controls.MessageBox;
        var $catdv = catdv.RestApi;
        var VisibilityUtil = catdv.VisibilityUtil;
        var FieldDefinitionUtil = catdv.FieldDefinitionUtil;
        var NavbarLoginMenu = ui.panels.NavbarLoginMenu;
        var ViewListItem = (function () {
            function ViewListItem(viewset, view) {
                this.viewset = viewset;
                this.view = view;
                if (viewset) {
                    this.ID = viewset.ID;
                    this.viewsetName = viewset.name;
                    this.viewName = "";
                    this.description = viewset.description;
                    this.visibility = viewset.visibility;
                }
                else {
                    this.ID = view.ID;
                    this.viewsetName = "";
                    this.viewName = view.name;
                    this.description = view.description;
                    this.visibility = view.visibility;
                }
            }
            return ViewListItem;
        }());
        admin.ViewListItem = ViewListItem;
        var BaseViewsForm = (function () {
            function BaseViewsForm(viewType) {
                var _this = this;
                this.btnAddViewSet = new Button("btnAddViewSet");
                this.btnAddView = new Button("btnAddView");
                this.btnDelete = new Button("btnDelete");
                this.btnMoveUp = new Button("btnMoveUp");
                this.btnMoveDown = new Button("btnMoveDown");
                this.navbarLoginMenu = new NavbarLoginMenu("navbarLoginMenu");
                this.listItemLookup = {};
                this.viewSetLookup = {};
                this.viewSetIsCollapsed = {};
                this.viewType = viewType;
                this.editVisibilityDialog = new admin.EditVisibilityDialog("editVisibilityDialog", viewType);
                this.btnAddViewSet.onClick(function (evt) {
                    _this.editViewSetDialog.setViewSet(null, _this.viewSets);
                    _this.editViewSetDialog.onOK(function () {
                        _this.viewsTable.reload();
                    });
                    _this.editViewSetDialog.show();
                });
                this.btnAddView.onClick(function (evt) {
                    var parentViewSet = _this.listItemLookup[_this.viewsTable.getSelectedItem().ID].viewset;
                    var siblingViewDefs = parentViewSet.views || parentViewSet.panels || parentViewSet.forms;
                    _this.editViewDialog.setView(parentViewSet, null, siblingViewDefs);
                    _this.editViewDialog.onOK(function () {
                        _this.viewsTable.reload();
                    });
                    _this.editViewDialog.show();
                });
                this.btnMoveUp.onClick(function (evt) {
                    _this.moveSelectedItem("up");
                });
                this.btnMoveDown.onClick(function (evt) {
                    _this.moveSelectedItem("down");
                });
                this.btnDelete.onClick(function (evt) {
                    var selectedItems = _this.viewsTable.getSelectedItems();
                    if (selectedItems.length == 1) {
                        var selectedItem = selectedItems[0];
                        MessageBox.confirm("Are you sure you want to delete '" + (selectedItem.viewsetName || selectedItem.viewName) + "'", function () {
                            if (selectedItem.viewset) {
                                $catdv.deleteViewSet(selectedItem.ID, function () {
                                    _this.viewsTable.reload();
                                });
                            }
                            else {
                                $catdv.deleteView(selectedItem.ID, function () {
                                    _this.viewsTable.reload();
                                });
                            }
                        });
                    }
                    else if (selectedItems.length > 1) {
                        MessageBox.confirm("Are you sure you want to delete " + selectedItems.length + " " + _this.viewType + "s", function () {
                            selectedItems.forEach(function (selectedItem) {
                                if (selectedItem.viewset) {
                                    $catdv.deleteViewSet(selectedItem.ID, function () {
                                        _this.viewsTable.reload();
                                    });
                                }
                                else {
                                    $catdv.deleteView(selectedItem.ID, function () {
                                        _this.viewsTable.reload();
                                    });
                                }
                            });
                        });
                    }
                });
            }
            BaseViewsForm.prototype.setModel = function (viewSets, listItems) {
                var _this = this;
                this.viewSets = viewSets;
                this.listItems = listItems;
                this.viewSetLookup = {};
                this.viewSets.forEach(function (viewSet) {
                    _this.viewSetLookup[viewSet.ID] = viewSet;
                });
                this.listItemLookup = {};
                listItems.forEach(function (listItem) {
                    _this.listItemLookup[listItem.ID] = listItem;
                });
            };
            BaseViewsForm.prototype.toggleSection = function (itemID) {
                var rowIndex = this.listItems.findIndex(function (listItem) { return listItem.ID == itemID; });
                var sectionItem = this.listItems[rowIndex];
                var childViewRowIndexes = [];
                for (var i = rowIndex + 1; i < this.listItems.length && this.listItems[i].viewset == null; i++) {
                    childViewRowIndexes.push(i);
                }
                if (!this.viewSetIsCollapsed[itemID]) {
                    this.viewsTable.hideRows(childViewRowIndexes);
                    $("#view_expander_" + itemID).removeClass("glyph-rotate-90");
                    this.viewSetIsCollapsed[itemID] = true;
                }
                else {
                    this.viewsTable.showRows(childViewRowIndexes);
                    $("#view_expander_" + itemID).addClass("glyph-rotate-90");
                    this.viewSetIsCollapsed[itemID] = false;
                }
            };
            BaseViewsForm.prototype.editViewSet = function (itemID) {
                var _this = this;
                this.editViewSetDialog.setViewSet(this.listItemLookup[itemID].viewset, this.viewSets);
                this.editViewSetDialog.onOK(function () {
                    _this.viewsTable.reload();
                });
                this.editViewSetDialog.show();
            };
            BaseViewsForm.prototype.editView = function (itemID) {
                var _this = this;
                var view = this.listItemLookup[itemID].view;
                var parentViewSetID = view.viewSetID || view.panelSetID || view.formSetID;
                var parentViewSet = this.viewSetLookup[parentViewSetID];
                var siblingViewSefs = parentViewSet.views || parentViewSet.panels || parentViewSet.forms;
                this.editViewDialog.setView(parentViewSet, view, siblingViewSefs);
                this.editViewDialog.onOK(function () {
                    _this.viewsTable.reload();
                });
                this.editViewDialog.show();
            };
            BaseViewsForm.prototype.editVisibility = function (itemID) {
                var _this = this;
                var selectedItem = this.listItemLookup[itemID];
                this.editVisibilityDialog.setItem(selectedItem);
                this.editVisibilityDialog.onOK(function (updatedItem) {
                    if (selectedItem.viewset) {
                        $catdv.saveViewSet(_this.viewType, updatedItem, function () {
                            _this.viewsTable.reload();
                        });
                    }
                    else {
                        $catdv.saveView(_this.viewType, updatedItem, function () {
                            _this.viewsTable.reload();
                        });
                    }
                });
                this.editVisibilityDialog.show();
            };
            BaseViewsForm.prototype.moveSelectedItem = function (direction) {
                var selectedItem = this.viewsTable.getSelectedItem();
                if (selectedItem.viewset != null) {
                    this.moveViewSet(selectedItem.viewset, direction);
                }
                else {
                    this.moveView(selectedItem.view, direction);
                }
            };
            BaseViewsForm.prototype.moveViewSet = function (viewSet, direction) {
                var _this = this;
                var viewSetIndex = -1;
                for (var vsi = 0; vsi < this.viewSets.length; vsi++) {
                    if (this.viewSets[vsi].ID == viewSet.ID) {
                        viewSetIndex = vsi;
                        break;
                    }
                }
                var toSave = null;
                if ((direction == "up") && (viewSetIndex > 0)) {
                    var prevViewSet = this.viewSets[viewSetIndex - 1];
                    var tmp = prevViewSet.order;
                    prevViewSet.order = (tmp != viewSet.order) ? viewSet.order : viewSet.order + 1;
                    viewSet.order = tmp;
                    toSave = [prevViewSet, viewSet];
                }
                else if ((direction == "down") && (viewSetIndex < (this.viewSets.length - 1))) {
                    var nextViewSet = this.viewSets[viewSetIndex + 1];
                    var tmp = nextViewSet.order;
                    nextViewSet.order = viewSet.order;
                    viewSet.order = (tmp != viewSet.order) ? tmp : tmp + 1;
                    toSave = [nextViewSet, viewSet];
                }
                if (toSave) {
                    $catdv.saveViewSet(this.viewType, { ID: toSave[0].ID, order: toSave[0].order }, function () {
                        $catdv.saveViewSet(_this.viewType, { ID: toSave[1].ID, order: toSave[1].order }, function () {
                            _this.viewsTable.reload();
                        });
                    });
                }
            };
            BaseViewsForm.prototype.moveView = function (view, direction) {
                var _this = this;
                var viewSet = null;
                for (var vsi = 0; vsi < this.viewSets.length; vsi++) {
                    if (this.viewSets[vsi].ID == (view.viewSetID || view.panelSetID) || view.formSetID) {
                        viewSet = this.viewSets[vsi];
                        break;
                    }
                }
                var views = viewSet.views || viewSet.panels || viewSet.forms;
                var viewIndex = -1;
                for (var vi = 0; vi < views.length; vi++) {
                    if (views[vi].ID == view.ID) {
                        viewIndex = vi;
                        break;
                    }
                }
                var view = views[viewIndex];
                var toSave = null;
                if ((direction == "up") && (viewIndex > 0)) {
                    var prevView = views[viewIndex - 1];
                    var tmp = prevView.order;
                    prevView.order = (tmp != view.order) ? view.order : view.order + 1;
                    view.order = tmp;
                    toSave = [prevView, view];
                }
                else if ((direction == "down") && (viewIndex < (views.length - 1))) {
                    var nextView = views[viewIndex + 1];
                    var tmp = nextView.order;
                    nextView.order = view.order;
                    view.order = (tmp != view.order) ? tmp : tmp + 1;
                    toSave = [nextView, view];
                }
                if (toSave) {
                    $catdv.saveView(this.viewType, { ID: toSave[0].ID, order: toSave[0].order }, function () {
                        $catdv.saveView(_this.viewType, { ID: toSave[1].ID, order: toSave[1].order }, function () {
                            _this.viewsTable.reload();
                        });
                    });
                }
            };
            BaseViewsForm.prototype.updateButtons = function () {
                var selectedItems = this.viewsTable.getSelectedItems();
                // Can't delete multiple viewsets or a mix of views/view sets in one go
                if (selectedItems.length > 1) {
                    for (var i = 0; i < selectedItems.length; i++) {
                        if (selectedItems[i].viewset) {
                            this.btnDelete.setEnabled(false);
                            break;
                        }
                    }
                }
                this.btnMoveUp.setEnabled(selectedItems.length == 1);
                this.btnMoveDown.setEnabled(selectedItems.length == 1);
                this.btnAddView.setEnabled((selectedItems.length > 0) && (selectedItems[0].viewset != null));
            };
            return BaseViewsForm;
        }());
        admin.BaseViewsForm = BaseViewsForm;
        var ViewsForm = (function (_super) {
            __extends(ViewsForm, _super);
            function ViewsForm() {
                var _this = this;
                _super.call(this, "view");
                this.viewsTable = new DataTable("viewsTable", {
                    selectionMode: SelectionMode.Multi,
                    columns: [
                        {
                            title: "",
                            dataProp: "ID",
                            width: 16,
                            renderer: function (obj, val) {
                                var isExpanded = !_this.viewSetIsCollapsed[obj.ID];
                                return obj.viewset ? "<a href='javascript:$page.toggleSection(" + obj.ID + ")'>"
                                    + "<span id='view_expander_" + obj.ID + "' class='glyphicon glyphicon-play" + (isExpanded ? " glyph-rotate-90" : "") + "'> </span></a>" : "";
                            }
                        },
                        {
                            title: "View Set",
                            dataProp: "viewsetName",
                            renderer: function (obj, val) {
                                return obj.viewset ? "<a href='javascript:$page.editViewSet(" + obj.ID + ")'>" + HtmlUtil.escapeHtml(val) + "</a>" : "";
                            }
                        },
                        {
                            title: "View Name",
                            dataProp: "viewName",
                            renderer: function (obj, val) {
                                return obj.view ? "<a href='javascript:$page.editView(" + obj.ID + ")'>" + HtmlUtil.escapeHtml(val) + "</a>" : "";
                            }
                        },
                        { title: "Description", dataProp: "description" },
                        {
                            title: "Visibility",
                            dataProp: "visibility",
                            renderer: function (obj, val) {
                                return "<a href='javascript:$page.editVisibility(" + obj.ID + ")'>" + VisibilityUtil.visibilitySummary(val) + "</a>";
                            }
                        }
                    ],
                    hideRow: function (obj) {
                        return obj.view && _this.viewSetIsCollapsed[obj.view.viewSetID];
                    },
                    simpleDataSource: new SimpleServerDataSource(function (params, callback) {
                        $catdv.getViewSetsWithViews(function (viewsets) {
                            // Need to build combined list that has each ViewSet then its components Views
                            var listItems = [];
                            viewsets.forEach(function (viewset) {
                                listItems.push(new ViewListItem(viewset, null));
                                if (viewset.views) {
                                    viewset.views.forEach(function (view) {
                                        listItems.push(new ViewListItem(null, view));
                                    });
                                }
                            });
                            _this.setModel(viewsets, listItems);
                            callback(listItems);
                        });
                    })
                });
                this.viewsTable.onSelectionChanged(function (evt) { return _super.prototype.updateButtons.call(_this); });
                this.editViewSetDialog = new EditViewSetDialog("editViewSetDialog");
                this.editViewDialog = new EditViewDialog("editViewDialog");
            }
            return ViewsForm;
        }(BaseViewsForm));
        admin.ViewsForm = ViewsForm;
        var BaseEditViewSetDialog = (function (_super) {
            __extends(BaseEditViewSetDialog, _super);
            function BaseEditViewSetDialog(elementId, viewSetType) {
                var _this = this;
                _super.call(this, elementId);
                this.lblEditViewSetTitle = new Label("lblEditViewSetTitle");
                this.txtViewSetName = new TextBox("txtViewSetName");
                this.txtViewSetDescription = new TextBox("txtViewSetDescription");
                this.btnEditViewSetOK = new Button("btnEditViewSetOK");
                this.viewSetType = viewSetType;
                this.btnEditViewSetOK.onClick(function (evt) {
                    _this.save(_this.viewSet.ID, _this.txtViewSetName.getText(), _this.txtViewSetDescription.getText());
                });
            }
            BaseEditViewSetDialog.prototype.setViewSet = function (viewSet, allViewSets) {
                this.viewSet = viewSet || {};
                this.allViewSets = allViewSets;
                this.lblEditViewSetTitle.setText((this.viewSetType == "panel") ? "Edit Panel Set" : "Edit View Set");
                this.txtViewSetName.setText(this.viewSet.name);
                this.txtViewSetDescription.setText(this.viewSet.description);
            };
            BaseEditViewSetDialog.prototype.save = function (viewSetID, name, description) {
                var _this = this;
                var order = this.viewSet.order;
                if ((typeof order === "undefined") || (order == null)) {
                    order = 0;
                    this.allViewSets.forEach(function (viewSet) {
                        if (viewSet.order >= order)
                            order = viewSet.order + 1;
                    });
                }
                var viewSet = {
                    ID: viewSetID,
                    name: name,
                    description: description,
                    order: order
                };
                $catdv.saveViewSet(this.viewSetType, viewSet, function () {
                    _this.close(true);
                });
            };
            return BaseEditViewSetDialog;
        }(controls.Modal));
        admin.BaseEditViewSetDialog = BaseEditViewSetDialog;
        var EditViewSetDialog = (function (_super) {
            __extends(EditViewSetDialog, _super);
            function EditViewSetDialog(elementId) {
                _super.call(this, elementId, "view");
            }
            return EditViewSetDialog;
        }(BaseEditViewSetDialog));
        admin.EditViewSetDialog = EditViewSetDialog;
        var BaseEditViewDialog = (function (_super) {
            __extends(BaseEditViewDialog, _super);
            function BaseEditViewDialog(elementId, viewType) {
                var _this = this;
                _super.call(this, elementId);
                // Left hand list and filters
                this.txtFilter = new TextBox("txtFilter");
                this.listAllFields = new DraggableListBox("listAllFields");
                this.chkBuiltIn = new CheckBox("chkBuiltIn");
                this.chkUserFields = new CheckBox("chkUserFields");
                this.chkMetadata = new CheckBox("chkMetadata");
                // Add/Remove buttons
                this.btnFieldAdd = new Button("btnFieldAdd");
                this.btnFieldRemove = new Button("btnFieldRemove");
                // Right hand list and movement buttons and options checkboxes
                this.txtName = new TextBox("txtName");
                this.txtDescription = new TextBox("txtDescription");
                this.listViewFields = new DraggableListBox("listIncludedFields", true);
                this.btnFieldTop = new Button("btnFieldTop");
                this.btnFieldUp = new Button("btnFieldUp");
                this.btnFieldDown = new Button("btnFieldDown");
                this.btnFieldBottom = new Button("btnFieldBottom");
                this.btnEditViewOK = new Button("btnEditViewOK");
                this.allFields = [];
                this.viewFields = [];
                this.currentCallNumber = 0;
                this.viewType = viewType;
                this.btnEditViewOK.onClick(function (evt) { _this.btnOK_onClick(evt); });
                this.txtFilter.onInput(function (evt) { _this.reloadAllFieldList(); });
                this.chkBuiltIn.onChanged(function (evt) { _this.reloadAllFieldList(); });
                this.chkUserFields.onChanged(function (evt) { _this.reloadAllFieldList(); });
                this.chkMetadata.onChanged(function (evt) { _this.reloadAllFieldList(); });
                this.listAllFields.onSelectionChanged(function (evt) { _this.updateControls(); });
                this.listAllFields.onDrop(function (evt) {
                    // if this drag came from the listViewFields then remove the dragged items from the view
                    if (evt.srcList === _this.listViewFields) {
                        _this.removeFields(evt.itemValues);
                    }
                });
                this.listViewFields.onSelectionChanged(function (evt) { _this.updateControls(); });
                this.listViewFields.onDrop(function (evt) {
                    if (evt.srcList === _this.listViewFields) {
                        _this.moveFields(evt.itemValues, evt.targetItemValue);
                    }
                    else {
                        _this.insertFields(evt.itemValues, evt.targetItemValue);
                    }
                });
                // Handlers for Add/Remove buttons
                this.btnFieldAdd.onClick(function (evt) {
                    var selectedIds = _this.listAllFields.getSelectedValues();
                    _this.insertFields(selectedIds, null);
                });
                this.btnFieldRemove.onClick(function (evt) {
                    var selectedIds = _this.listViewFields.getSelectedValues();
                    _this.removeFields(selectedIds);
                });
                // Handlers to Up/Down/Top/Bottom buttons
                this.btnFieldTop.onClick(function (evt) {
                    _this.viewFields.unshift(_this.viewFields.splice(_this.listViewFields.getSelectedIndex(), 1)[0]);
                    _this.refreshViewFieldList(0);
                });
                this.btnFieldUp.onClick(function (evt) {
                    var index = _this.listViewFields.getSelectedIndex();
                    _this.viewFields.splice(index - 1, 0, _this.viewFields.splice(index, 1)[0]);
                    _this.refreshViewFieldList(index - 1);
                });
                this.btnFieldDown.onClick(function (evt) {
                    var index = _this.listViewFields.getSelectedIndex();
                    _this.viewFields.splice(index + 1, 0, _this.viewFields.splice(index, 1)[0]);
                    _this.refreshViewFieldList(index + 1);
                });
                this.btnFieldBottom.onClick(function (evt) {
                    _this.viewFields.push(_this.viewFields.splice(_this.listViewFields.getSelectedIndex(), 1)[0]);
                    _this.refreshViewFieldList(_this.viewFields.length - 1);
                });
            }
            BaseEditViewDialog.prototype.setView = function (viewSet, viewDef, allViewDefs) {
                var _this = this;
                this.viewSet = viewSet;
                this.viewDef = viewDef || {};
                this.allViewDefs = allViewDefs || [];
                // Clear the old view fields and reset the controls before loading the new ones
                this.viewFields = [];
                this.refreshViewFieldList(null);
                this.updateControls();
                this.reloadAllFieldList();
                if (viewDef) {
                    this.txtName.setText(viewDef.name);
                    this.txtDescription.setText(viewDef.description);
                    $catdv.getViewFields(this.viewType, viewDef.ID, function (viewFields) {
                        _this.viewFields = viewFields;
                        _this.refreshViewFieldList(null);
                        _this.refreshAllFieldList();
                        _this.updateControls();
                    });
                }
                else {
                    this.txtName.setText("");
                    this.txtDescription.setText("");
                }
            };
            BaseEditViewDialog.prototype.selectedViewField = function () {
                return this.viewFields[this.listViewFields.getSelectedIndex()];
            };
            BaseEditViewDialog.prototype.isViewFieldSelected = function () {
                return this.listViewFields.getSelectedIndex() != -1;
            };
            BaseEditViewDialog.prototype.updateControls = function () {
                var validField = this.listAllFields.getSelectedIndex() != -1;
                this.btnFieldAdd.setEnabled(validField);
                var validViewField = this.listViewFields.getSelectedIndex() != -1;
                this.btnFieldRemove.setEnabled(validViewField);
                this.btnFieldTop.setEnabled(validViewField);
                this.btnFieldUp.setEnabled(validViewField);
                this.btnFieldDown.setEnabled(validViewField);
                this.btnFieldBottom.setEnabled(validViewField);
            };
            BaseEditViewDialog.prototype.insertFields = function (insertItemIds, insertBeforeItemId) {
                var _this = this;
                var insertIndex = this.viewFields.indexOf(this.viewFields.find(function (field) { return field.fieldDefID == insertBeforeItemId; }));
                insertItemIds.forEach(function (selectedId) {
                    var selectedFieldDef = _this.fieldDefLookup[selectedId];
                    if (selectedFieldDef) {
                        var viewField = {
                            viewDefID: _this.viewDef.ID,
                            fieldDefID: selectedFieldDef.ID,
                            fieldDefinition: selectedFieldDef
                        };
                        if (insertIndex == -1) {
                            _this.viewFields.push(viewField);
                        }
                        else {
                            _this.viewFields.splice(insertIndex, 0, viewField);
                        }
                    }
                });
                this.refreshViewFieldList();
                this.refreshAllFieldList();
            };
            BaseEditViewDialog.prototype.moveFields = function (insertItemIds, insertBeforeItemId) {
                var newList = [];
                var itemsToMove = [];
                this.viewFields.forEach(function (viewField) {
                    if (insertItemIds.indexOf(viewField.fieldDefID) == -1) {
                        newList.push(viewField);
                    }
                    else {
                        itemsToMove.push(viewField);
                    }
                });
                var insertIndex = newList.indexOf(newList.find(function (field) { return field.fieldDefID == insertBeforeItemId; }));
                if (insertIndex == -1) {
                    itemsToMove.forEach(function (viewField) { return newList.push(viewField); });
                }
                else {
                    newList = newList.slice(0, insertIndex).concat(itemsToMove).concat(newList.slice(insertIndex));
                }
                this.viewFields = newList;
                this.refreshViewFieldList();
                this.refreshAllFieldList();
                this.updateControls();
            };
            BaseEditViewDialog.prototype.removeFields = function (selectedIds) {
                var remainingFields = [];
                this.viewFields.forEach(function (viewField) {
                    if (selectedIds.indexOf(viewField.fieldDefID) == -1) {
                        remainingFields.push(viewField);
                    }
                });
                this.viewFields = remainingFields;
                this.refreshViewFieldList();
                this.refreshAllFieldList();
                this.updateControls();
            };
            // Load the all field list from the server
            BaseEditViewDialog.prototype.reloadAllFieldList = function () {
                var _this = this;
                var include = this.getDefaultIncludes();
                if (this.chkBuiltIn.isChecked())
                    include += " builtin";
                if (this.chkUserFields.isChecked())
                    include += " clip";
                if (this.chkMetadata.isChecked())
                    include += " metadata";
                // When user typing in filter box results may come back out of order - keep track so we can reject non-current ones
                var callNumber = ++this.currentCallNumber;
                $catdv.getFields({ filter: this.txtFilter.getText(), includeOnly: include }, function (rs) {
                    if (callNumber != _this.currentCallNumber)
                        return;
                    _this.allFields = rs.items.sort(function (a, b) { return a.name.toLowerCase().compare(b.name.toLowerCase()); });
                    _this.fieldDefLookup = {};
                    _this.allFields.forEach(function (fieldDef) { _this.fieldDefLookup[fieldDef.ID] = fieldDef; });
                    _this.refreshAllFieldList();
                    _this.updateControls();
                });
            };
            // Populate the all fields list from the model filtering out any items that are already in the view 
            BaseEditViewDialog.prototype.refreshAllFieldList = function () {
                var _this = this;
                this.listAllFields.clear();
                var viewFieldIds = this.listViewFields.getAllValues();
                this.allFields.filter(function (fieldDef) { return !viewFieldIds.contains(fieldDef.ID); }).forEach(function (fieldDef) {
                    _this.listAllFields.add(fieldDef.ID, fieldDef.name, FieldDefinitionUtil.getTooltip(fieldDef), FieldDefinitionUtil.getCssClass(fieldDef));
                });
            };
            // Populate the view field list from the model
            BaseEditViewDialog.prototype.refreshViewFieldList = function (selectedIndex) {
                var _this = this;
                if (selectedIndex === void 0) { selectedIndex = null; }
                this.listViewFields.clear();
                this.viewFields.forEach(function (viewField) {
                    var fieldDef = viewField.fieldDefinition || { ID: viewField.fieldDefID, fieldGroupID: 1, name: "Not supported", description: "" };
                    _this.listViewFields.add(fieldDef.ID, fieldDef.name, FieldDefinitionUtil.getTooltip(fieldDef), FieldDefinitionUtil.getCssClass(fieldDef));
                });
                if (selectedIndex !== null) {
                    this.listViewFields.setSelectedIndex(selectedIndex);
                }
            };
            BaseEditViewDialog.prototype.btnOK_onClick = function (evt) {
                var id = this.viewDef.ID || null;
                var name = this.txtName.getText();
                var description = this.txtDescription.getText();
                var fields = this.viewFields;
                // place new view definitions at the end of the list
                var order = this.viewDef.order;
                if ((typeof (order) == "undefined") || (order == null)) {
                    order = 0;
                    this.allViewDefs.forEach(function (view) {
                        if (view.order >= order)
                            order = view.order + 1;
                    });
                }
                this.saveDefinition(id, name, description, order, fields);
            };
            BaseEditViewDialog.prototype.saveDefinition = function (definitionID, name, description, order, fields) {
                throw new Error("Abstract method 'BaseEditViewDialog.saveDefinition()' called");
            };
            // Intended to be overridden in derived class to supply default set of field includes
            BaseEditViewDialog.prototype.getDefaultIncludes = function () {
                return "";
            };
            return BaseEditViewDialog;
        }(controls.Modal));
        admin.BaseEditViewDialog = BaseEditViewDialog;
        var EditViewDialog = (function (_super) {
            __extends(EditViewDialog, _super);
            function EditViewDialog(elementId) {
                var _this = this;
                _super.call(this, elementId, "view");
                this.lstViewType = new ListBox("lstViewType");
                this.divGridOptions = new Element("gridOptions");
                this.lstGridSize = new ListBox("lstGridSize");
                this.lstGridText = new ListBox("lstGridText");
                this.divFilmstripOptions = new Element("filmstripOptions");
                this.lstFilmstripSize = new ListBox("lstFilmstripSize");
                this.divAdditionalOptions = new Element("additionalOptions");
                this.lblChkPoster = new Label("lblChkPoster");
                this.chkWideSpacing = new CheckBox("chkWideSpacing");
                this.lblChkAllThumbnails = new Label("lblChkAllThumbnails");
                this.chkAllThumbnails = new CheckBox("chkAllThumbnails");
                this.lblChkWideSpacing = new Label("lblChkWideSpacing");
                this.chkPoster = new CheckBox("chkPoster");
                this.divListViewOptions = new Element("listViewOptions");
                this.txtFieldWidth = new TextBox("txtFieldWidth");
                this.divEditFields = new Element("editFieldsSection");
                this.lstViewType.onChanged(function () { return _this.updateOptionControls(); });
                this.lstFilmstripSize.onChanged(function () { return _this.updateOptionControls(); });
                this.chkPoster.onChanged(function () { return _this.updateOptionControls(); });
                this.txtFieldWidth.onInput(function () {
                    var width = _this.txtFieldWidth.getText().trim();
                    _this.selectedViewField().options = (width.length > 0) ? { "width": parseInt(_this.txtFieldWidth.getText()) } : null;
                });
            }
            EditViewDialog.prototype.setView = function (viewSet, viewDef, allViewDefs) {
                _super.prototype.setView.call(this, viewSet, viewDef, allViewDefs);
                this.lstViewType.setSelectedValue(viewDef ? viewDef.type : "list");
                if (viewDef == null || viewDef.type == "list") {
                    this.chkWideSpacing.setChecked(viewDef && (viewDef.options["spacing"] == "wide"));
                }
                else if (viewDef.type == "grid") {
                    this.lstGridSize.setSelectedValue(viewDef && (viewDef.options["size"]));
                    this.lstGridText.setSelectedValue(viewDef && (viewDef.options["text"]));
                }
                else if (viewDef.type == "filmstrip") {
                    this.lstFilmstripSize.setSelectedValue(viewDef && (viewDef.options["size"]));
                    this.chkPoster.setChecked(viewDef && (viewDef.options["poster"] == "true"));
                    this.chkAllThumbnails.setChecked(viewDef && (viewDef.options["allThumbnails"] == "true"));
                }
                this.updateOptionControls();
            };
            EditViewDialog.prototype.updateControls = function () {
                _super.prototype.updateControls.call(this);
                if (_super.prototype.isViewFieldSelected.call(this)) {
                    var viewField = this.selectedViewField();
                    this.txtFieldWidth.setText((viewField.options && viewField.options.width) ? viewField.options.width.toString() : "");
                    this.txtFieldWidth.setEnabled(true);
                }
                else {
                    this.txtFieldWidth.setText("");
                    this.txtFieldWidth.setEnabled(false);
                }
            };
            EditViewDialog.prototype.updateOptionControls = function () {
                var viewType = this.lstViewType.getSelectedValue();
                if (viewType == "builtin") {
                    this.divGridOptions.hide();
                    this.divFilmstripOptions.hide();
                    this.divAdditionalOptions.hide();
                    this.lblChkAllThumbnails.hide();
                    this.lblChkPoster.hide();
                    this.lblChkWideSpacing.hide();
                    this.divEditFields.hide();
                    this.divListViewOptions.hide();
                }
                else if (viewType == "list") {
                    this.divGridOptions.hide();
                    this.divFilmstripOptions.hide();
                    this.divAdditionalOptions.show();
                    this.lblChkAllThumbnails.hide();
                    this.lblChkPoster.hide();
                    this.lblChkWideSpacing.show();
                    this.divEditFields.show();
                    this.divListViewOptions.show();
                }
                else if (viewType == "grid") {
                    this.divGridOptions.show();
                    this.divFilmstripOptions.hide();
                    this.divAdditionalOptions.hide();
                    this.divEditFields.show();
                    this.divListViewOptions.hide();
                }
                else if (viewType == "filmstrip") {
                    this.divGridOptions.hide();
                    this.divFilmstripOptions.show();
                    this.divAdditionalOptions.show();
                    this.lblChkAllThumbnails.show();
                    this.lblChkPoster.show();
                    this.lblChkWideSpacing.hide();
                    this.divEditFields.show();
                    this.divListViewOptions.hide();
                    // You can only select "All thumbnails" for medium or large size depending on whether you want a poster
                    var filmstripSize = this.lstFilmstripSize.getSelectedValue();
                    if (this.chkPoster.isChecked()) {
                        if (filmstripSize == "large") {
                            this.chkAllThumbnails.setEnabled(true);
                        }
                        else {
                            this.chkAllThumbnails.setChecked(false);
                            this.chkAllThumbnails.setEnabled(false);
                        }
                    }
                    else {
                        if (filmstripSize == "medium") {
                            this.chkAllThumbnails.setEnabled(true);
                        }
                        else {
                            this.chkAllThumbnails.setChecked(false);
                            this.chkAllThumbnails.setEnabled(false);
                        }
                    }
                }
            };
            EditViewDialog.prototype.saveDefinition = function (definitionID, name, description, order, fields) {
                var _this = this;
                var viewType = this.lstViewType.getSelectedValue();
                var options = {};
                if (viewType == "list") {
                    options["spacing"] = this.chkWideSpacing.isChecked() ? "wide" : "normal";
                }
                else if (viewType == "grid") {
                    options["size"] = this.lstGridSize.getSelectedValue();
                    options["text"] = this.lstGridText.getSelectedValue();
                }
                else if (viewType == "filmstrip") {
                    options["size"] = this.lstFilmstripSize.getSelectedValue();
                    options["poster"] = this.chkPoster.isChecked() ? "true" : "false";
                    options["allThumbnails"] = this.chkAllThumbnails.isChecked() ? "true" : "false";
                }
                var viewDef = {
                    ID: definitionID,
                    viewSetID: this.viewSet.ID,
                    name: name,
                    description: description,
                    type: viewType,
                    options: options,
                    fields: fields,
                    order: order
                };
                $catdv.saveView("view", viewDef, function () {
                    _this.close(true);
                });
            };
            return EditViewDialog;
        }(BaseEditViewDialog));
        admin.EditViewDialog = EditViewDialog;
    })(admin = ui.admin || (ui.admin = {}));
})(ui || (ui = {}));
