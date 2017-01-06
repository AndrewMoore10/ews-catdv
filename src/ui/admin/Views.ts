module ui.admin
{
    import HtmlUtil = util.HtmlUtil;
    import Element = controls.Element;
    import SimpleServerDataSource = controls.SimpleServerDataSource;
    import DataTable = controls.DataTable;
    import SelectionMode = controls.SelectionMode;
    import Button = controls.Button;
    import ButtonDropDown = controls.ButtonDropDown;
    import TextBox = controls.TextBox;
    import TextArea = controls.TextArea;
    import Label = controls.Label;
    import DropDownList = controls.DropDownList;
    import CheckBox = controls.CheckBox;
    import ListBox = controls.ListBox;
    import DraggableListBox = controls.DraggableListBox;
    import Console = controls.Console;
    import MessageBox = controls.MessageBox;

    import $catdv = catdv.RestApi;
    import PartialResultSet = catdv.PartialResultSet;
    import BaseViewSet = catdv.BaseViewSet;
    import BaseViewDefinition = catdv.BaseViewDefinition;
    import BaseViewField = catdv.BaseViewField;
    import ViewSet = catdv.ViewSet;
    import PanelSet = catdv.PanelSet;
    import FormSet = catdv.FormSet;
    import ViewDefinition = catdv.ViewDefinition;
    import PanelDefinition = catdv.PanelDefinition;
    import FormDefinition = catdv.FormDefinition;
    import ViewField = catdv.ViewField;
    import VisibilityRules = catdv.VisibilityRules;
    import FieldDefinition = catdv.FieldDefinition;
    import VisibilityUtil = catdv.VisibilityUtil;
    import FieldDefinitionUtil = catdv.FieldDefinitionUtil;

    import NavbarLoginMenu = ui.panels.NavbarLoginMenu;

    // These lookup tables are created by the server and emitted into 
    // a script in the head of views.jsp
    declare var roleLookup;
    declare var groupLookup;
    declare var clientLookup;

    export class ViewListItem
    {
        public ID: number;
        public viewsetName: string;
        public viewName: string;
        public description: string;
        public visibility: VisibilityRules;
        public viewset: BaseViewSet;
        public view: BaseViewDefinition;

        constructor(viewset: BaseViewSet, view: BaseViewDefinition)
        {
            this.viewset = viewset;
            this.view = view;
            if (viewset)
            {
                this.ID = viewset.ID;
                this.viewsetName = viewset.name;
                this.viewName = "";
                this.description = viewset.description;
                this.visibility = viewset.visibility;
            }
            else
            {
                this.ID = view.ID;
                this.viewsetName = "";
                this.viewName = view.name;
                this.description = view.description;
                this.visibility = view.visibility;
            }
        }
    }

    export class BaseViewsForm
    {
        public viewsTable: DataTable;

        private btnAddViewSet = new Button("btnAddViewSet");
        private btnAddView = new Button("btnAddView");
        private btnDelete = new Button("btnDelete");
        private btnMoveUp = new Button("btnMoveUp");
        private btnMoveDown = new Button("btnMoveDown");
        private editVisibilityDialog: EditVisibilityDialog;
        private navbarLoginMenu = new NavbarLoginMenu("navbarLoginMenu");

        // initialsed by derived class
        public editViewDialog: BaseEditViewDialog;
        public editViewSetDialog: BaseEditViewSetDialog;

        private viewType: string;
        private viewSets: BaseViewSet[];
        private listItems: ViewListItem[];
        private listItemLookup: { [viewID: number]: ViewListItem } = {};
        private viewSetLookup: { [viewSetID: number]: BaseViewSet } = {};
        public viewSetIsCollapsed: { [viewSetID: number]: boolean } = {};

        constructor(viewType: string)
        {
            this.viewType = viewType;

            this.editVisibilityDialog = new EditVisibilityDialog("editVisibilityDialog", viewType);

            this.btnAddViewSet.onClick((evt) =>
            {
                this.editViewSetDialog.setViewSet(null, this.viewSets);
                this.editViewSetDialog.onOK(() =>
                {
                    this.viewsTable.reload();
                });
                this.editViewSetDialog.show();
            });

            this.btnAddView.onClick((evt) =>
            {
                var parentViewSet = this.listItemLookup[this.viewsTable.getSelectedItem().ID].viewset;
                var siblingViewDefs: BaseViewDefinition[] = (<ViewSet>parentViewSet).views || (<PanelSet>parentViewSet).panels || (<FormSet>parentViewSet).forms;
                this.editViewDialog.setView(parentViewSet, null, siblingViewDefs);
                this.editViewDialog.onOK(() =>
                {
                    this.viewsTable.reload();
                });
                this.editViewDialog.show();
            });

            this.btnMoveUp.onClick((evt) =>
            {
                this.moveSelectedItem("up");
            });
            this.btnMoveDown.onClick((evt) =>
            {
                this.moveSelectedItem("down");
            });

            this.btnDelete.onClick((evt) =>
            {
                var selectedItems: ViewListItem[] = this.viewsTable.getSelectedItems();
                if (selectedItems.length == 1)
                {
                    var selectedItem = selectedItems[0];
                    MessageBox.confirm("Are you sure you want to delete '" + (selectedItem.viewsetName || selectedItem.viewName) + "'", () =>
                    {
                        if (selectedItem.viewset)
                        {
                            $catdv.deleteViewSet(selectedItem.ID,() =>
                            {
                                this.viewsTable.reload();
                            });
                        }
                        else
                        {
                            $catdv.deleteView(selectedItem.ID,() =>
                            {
                                this.viewsTable.reload();
                            });
                        }
                    });
                }
                else if (selectedItems.length > 1)
                {
                    MessageBox.confirm("Are you sure you want to delete " + selectedItems.length + " " + this.viewType + "s", () =>
                    {
                        selectedItems.forEach((selectedItem) =>
                        {
                            if (selectedItem.viewset)
                            {
                                $catdv.deleteViewSet(selectedItem.ID,() =>
                                {
                                    this.viewsTable.reload();
                                });
                            }
                            else
                            {
                                $catdv.deleteView(selectedItem.ID,() =>
                                {
                                    this.viewsTable.reload();
                                });
                            }
                        });
                    });
                }
            });
        }

        public setModel(viewSets: BaseViewSet[], listItems: ViewListItem[])
        {
            this.viewSets = viewSets;
            this.listItems = listItems;
            
            this.viewSetLookup = {};
            this.viewSets.forEach((viewSet) =>
            {
                this.viewSetLookup[viewSet.ID] = viewSet;
            });

            this.listItemLookup = {};
            listItems.forEach((listItem) =>
            {
                this.listItemLookup[listItem.ID] = listItem;
            });
        }

        public toggleSection(itemID: number)
        {
            var rowIndex = this.listItems.findIndex((listItem) => listItem.ID == itemID);
            var sectionItem = this.listItems[rowIndex];
           
            var childViewRowIndexes: number[] = [];
            for (var i = rowIndex + 1; i < this.listItems.length && this.listItems[i].viewset == null; i++)
            {
                childViewRowIndexes.push(i);
            }

            if (!this.viewSetIsCollapsed[itemID])
            {
                this.viewsTable.hideRows(childViewRowIndexes);
                $("#view_expander_" + itemID).removeClass("glyph-rotate-90");
                this.viewSetIsCollapsed[itemID] = true;
            }
            else
            {
                this.viewsTable.showRows(childViewRowIndexes);
                $("#view_expander_" + itemID).addClass("glyph-rotate-90");
                this.viewSetIsCollapsed[itemID] = false;
            }
        }
                
        public editViewSet(itemID: number)
        {
            this.editViewSetDialog.setViewSet(this.listItemLookup[itemID].viewset, this.viewSets);
            this.editViewSetDialog.onOK(() =>
            {
                this.viewsTable.reload();
            });
            this.editViewSetDialog.show();
        }

        public editView(itemID: number)
        {
            var view = this.listItemLookup[itemID].view;
            var parentViewSetID = (<ViewDefinition>view).viewSetID || (<PanelDefinition>view).panelSetID || (<FormDefinition>view).formSetID;
            var parentViewSet = this.viewSetLookup[parentViewSetID];
            var siblingViewSefs: BaseViewDefinition[] = (<ViewSet>parentViewSet).views || (<PanelSet>parentViewSet).panels || (<FormSet>parentViewSet).forms;
            this.editViewDialog.setView(parentViewSet, view, siblingViewSefs);
            this.editViewDialog.onOK(() =>
            {
                this.viewsTable.reload();
            });
            this.editViewDialog.show();
        }

        public editVisibility(itemID: number)
        {
            var selectedItem = this.listItemLookup[itemID];
            this.editVisibilityDialog.setItem(selectedItem);
            this.editVisibilityDialog.onOK((updatedItem) =>
            {
                if (selectedItem.viewset)
                {
                    $catdv.saveViewSet(this.viewType, updatedItem,() =>
                    {
                        this.viewsTable.reload();
                    });
                }
                else
                {
                    $catdv.saveView(this.viewType, updatedItem,() =>
                    {
                        this.viewsTable.reload();
                    });
                }
            });
            this.editVisibilityDialog.show();
        }

        private moveSelectedItem(direction: string)
        {
            var selectedItem: ViewListItem = this.viewsTable.getSelectedItem();
            if (selectedItem.viewset != null)
            {
                this.moveViewSet(selectedItem.viewset, direction);
            }
            else
            {
                this.moveView(selectedItem.view, direction);
            }
        }

        private moveViewSet(viewSet: BaseViewSet, direction: string)
        {
            var viewSetIndex = -1;
            for (var vsi = 0; vsi < this.viewSets.length; vsi++)
            {
                if (this.viewSets[vsi].ID == viewSet.ID)
                {
                    viewSetIndex = vsi;
                    break;
                }
            }

            var toSave: BaseViewSet[] = null;
            if ((direction == "up") && (viewSetIndex > 0))
            {
                var prevViewSet = this.viewSets[viewSetIndex - 1]
                var tmp = prevViewSet.order;
                prevViewSet.order = (tmp != viewSet.order) ? viewSet.order : viewSet.order + 1;
                viewSet.order = tmp;
                toSave = [prevViewSet, viewSet];
            }
            else if ((direction == "down") && (viewSetIndex < (this.viewSets.length - 1)))
            {
                var nextViewSet = this.viewSets[viewSetIndex + 1]
                var tmp = nextViewSet.order;
                nextViewSet.order = viewSet.order;
                viewSet.order = (tmp != viewSet.order) ? tmp : tmp + 1;
                toSave = [nextViewSet, viewSet];
            }
            if (toSave)
            {
                $catdv.saveViewSet(this.viewType, { ID: toSave[0].ID, order: toSave[0].order },() =>
                {
                    $catdv.saveViewSet(this.viewType, { ID: toSave[1].ID, order: toSave[1].order },() =>
                    {
                        this.viewsTable.reload();
                    });
                });
            }
        }

        private moveView(view: BaseViewDefinition, direction: string)
        {
            var viewSet: BaseViewSet = null;
            for (var vsi = 0; vsi < this.viewSets.length; vsi++)
            {
                if (this.viewSets[vsi].ID == ((<ViewDefinition>view).viewSetID || (<PanelDefinition>view).panelSetID) || (<FormDefinition>view).formSetID)
                {
                    viewSet = this.viewSets[vsi];
                    break;
                }
            }

            var views: BaseViewDefinition[] = (<ViewSet>viewSet).views || (<PanelSet>viewSet).panels || (<FormSet>viewSet).forms;
            var viewIndex = -1;
            for (var vi = 0; vi < views.length; vi++)
            {
                if (views[vi].ID == view.ID)
                {
                    viewIndex = vi;
                    break;
                }
            }
            var view = views[viewIndex];

            var toSave: BaseViewDefinition[] = null;
            if ((direction == "up") && (viewIndex > 0))
            {
                var prevView = views[viewIndex - 1];
                var tmp = prevView.order;
                prevView.order = (tmp != view.order) ? view.order : view.order + 1;
                view.order = tmp;
                toSave = [prevView, view];
            }
            else if ((direction == "down") && (viewIndex < (views.length - 1)))
            {
                var nextView = views[viewIndex + 1];
                var tmp = nextView.order;
                nextView.order = view.order;
                view.order = (tmp != view.order) ? tmp : tmp + 1;
                toSave = [nextView, view];
            }
            if (toSave)
            {
                $catdv.saveView(this.viewType, { ID: toSave[0].ID, order: toSave[0].order },() =>
                {
                    $catdv.saveView(this.viewType, { ID: toSave[1].ID, order: toSave[1].order },() =>
                    {
                        this.viewsTable.reload();
                    });
                });
            }
        }

        public updateButtons()
        {
            var selectedItems: ViewListItem[] = this.viewsTable.getSelectedItems();

            // Can't delete multiple viewsets or a mix of views/view sets in one go
            if (selectedItems.length > 1)
            {
                for (var i = 0; i < selectedItems.length; i++)
                {
                    if (selectedItems[i].viewset) 
                    {
                        this.btnDelete.setEnabled(false);
                        break;
                    }
                }
            }
            this.btnMoveUp.setEnabled(selectedItems.length == 1);
            this.btnMoveDown.setEnabled(selectedItems.length == 1);
            this.btnAddView.setEnabled((selectedItems.length > 0) && (selectedItems[0].viewset != null));
        }
    }

    export class ViewsForm extends BaseViewsForm
    {

        constructor()
        {
            super("view");

            this.viewsTable = new DataTable("viewsTable", {

                selectionMode: SelectionMode.Multi,

                columns: [
                    {
                        title: "",
                        dataProp: "ID",
                        width: 16,
                        renderer: (obj: any, val: any) =>
                        {
                            var isExpanded =  !this.viewSetIsCollapsed[obj.ID];
                            return obj.viewset ? "<a href='javascript:$page.toggleSection(" + obj.ID + ")'>" 
                                + "<span id='view_expander_" + obj.ID + "' class='glyphicon glyphicon-play" + (isExpanded ? " glyph-rotate-90" : "") + "'> </span></a>" : "";
                        }
                    },
                    {
                        title: "View Set",
                        dataProp: "viewsetName",
                        renderer: (obj: any, val: any) =>
                        {
                            return obj.viewset ? "<a href='javascript:$page.editViewSet(" + obj.ID + ")'>" + HtmlUtil.escapeHtml(val) + "</a>" : "";
                        }
                    },
                    {
                        title: "View Name",
                        dataProp: "viewName",
                        renderer: (obj: any, val: any) =>
                        {
                            return obj.view ? "<a href='javascript:$page.editView(" + obj.ID + ")'>" + HtmlUtil.escapeHtml(val) + "</a>" : "";
                        }
                    },
                    { title: "Description", dataProp: "description" },
                    {
                        title: "Visibility",
                        dataProp: "visibility",
                        renderer: (obj: any, val: any) =>
                        {
                            return "<a href='javascript:$page.editVisibility(" + obj.ID + ")'>" + VisibilityUtil.visibilitySummary(val) + "</a>";
                        }
                    }
                ],

                hideRow: (obj: any) => 
                {
                     return obj.view && this.viewSetIsCollapsed[obj.view.viewSetID];
                },
                
                simpleDataSource: new SimpleServerDataSource((params : any, callback: (results: any[]) => void) =>
                {
                    $catdv.getViewSetsWithViews((viewsets: ViewSet[]) =>
                    {
                        // Need to build combined list that has each ViewSet then its components Views
                        var listItems: ViewListItem[] = [];

                        viewsets.forEach((viewset) =>
                        {
                            listItems.push(new ViewListItem(viewset, null));

                            if (viewset.views)
                            {
                                viewset.views.forEach((view) =>
                                {
                                    listItems.push(new ViewListItem(null, view));
                                });
                            }
                        });
                        this.setModel(viewsets, listItems);
                        callback(listItems);
                    });
                })
            });

            this.viewsTable.onSelectionChanged((evt) => super.updateButtons());

            this.editViewSetDialog = new EditViewSetDialog("editViewSetDialog");
            this.editViewDialog = new EditViewDialog("editViewDialog");
        }
    }

    export class BaseEditViewSetDialog extends controls.Modal
    {
        private lblEditViewSetTitle = new Label("lblEditViewSetTitle");
        private txtViewSetName = new TextBox("txtViewSetName");
        private txtViewSetDescription = new TextBox("txtViewSetDescription");
        private btnEditViewSetOK = new Button("btnEditViewSetOK");

        private viewSet: BaseViewSet;
        private viewSetType: string;
        private allViewSets: BaseViewSet[];

        constructor(elementId: string, viewSetType: string)
        {
            super(elementId);

            this.viewSetType = viewSetType;

            this.btnEditViewSetOK.onClick((evt) =>
            {
                this.save(this.viewSet.ID, this.txtViewSetName.getText(), this.txtViewSetDescription.getText());
            });
        }

        public setViewSet(viewSet: BaseViewSet, allViewSets: BaseViewSet[])
        {
            this.viewSet = viewSet || {};
            this.allViewSets = allViewSets;

            this.lblEditViewSetTitle.setText((this.viewSetType == "panel") ? "Edit Panel Set" : "Edit View Set");
            this.txtViewSetName.setText(this.viewSet.name);
            this.txtViewSetDescription.setText(this.viewSet.description);
        }


        public save(viewSetID: number, name: string, description: string)
        {
            var order = this.viewSet.order;
            if((typeof order === "undefined") || (order == null))
            {
                order = 0;
                this.allViewSets.forEach((viewSet) =>
                {
                    if (viewSet.order >= order) order = viewSet.order + 1;
                });
            }

            var viewSet: BaseViewSet = {
                ID: viewSetID,
                name: name,
                description: description,
                order: order
            };

            $catdv.saveViewSet(this.viewSetType, viewSet,() =>
            {
                this.close(true);
            });
        }
    }

    export class EditViewSetDialog extends BaseEditViewSetDialog
    {
        constructor(elementId: string)
        {
            super(elementId, "view");
        }
    }

    export class BaseEditViewDialog extends controls.Modal
    {
        // Left hand list and filters
        private txtFilter = new TextBox("txtFilter");
        private listAllFields = new DraggableListBox("listAllFields");
        private chkBuiltIn = new CheckBox("chkBuiltIn");
        private chkUserFields = new CheckBox("chkUserFields");
        private chkMetadata = new CheckBox("chkMetadata");

        // Add/Remove buttons
        private btnFieldAdd = new Button("btnFieldAdd");
        private btnFieldRemove = new Button("btnFieldRemove");

        // Right hand list and movement buttons and options checkboxes
        private txtName = new TextBox("txtName");
        private txtDescription = new TextBox("txtDescription");
        private listViewFields = new DraggableListBox("listIncludedFields", true);
        private btnFieldTop = new Button("btnFieldTop");
        private btnFieldUp = new Button("btnFieldUp");
        private btnFieldDown = new Button("btnFieldDown");
        private btnFieldBottom = new Button("btnFieldBottom");

        private btnEditViewOK: Button = new Button("btnEditViewOK");

        public viewSet: BaseViewSet;
        public viewType: string;
        public viewDef: BaseViewDefinition;
        // List of the view definition within the parent view set
        private allViewDefs: BaseViewDefinition[];
        private allFields: FieldDefinition[] = [];
        private fieldDefLookup: { [fieldDefID: string]: FieldDefinition };
        private viewFields: BaseViewField[] = [];

        constructor(elementId: string, viewType: string)
        {
            super(elementId);

            this.viewType = viewType;

            this.btnEditViewOK.onClick((evt: any) => { this.btnOK_onClick(evt); });

            this.txtFilter.onInput((evt) => { this.reloadAllFieldList(); });
            this.chkBuiltIn.onChanged((evt) => { this.reloadAllFieldList(); });
            this.chkUserFields.onChanged((evt) => { this.reloadAllFieldList(); });
            this.chkMetadata.onChanged((evt) => { this.reloadAllFieldList(); });

            this.listAllFields.onSelectionChanged((evt) => { this.updateControls(); });
            this.listAllFields.onDrop((evt) =>
            {
                // if this drag came from the listViewFields then remove the dragged items from the view
                if (evt.srcList === this.listViewFields)
                {
                    this.removeFields(evt.itemValues);
                }
            });

            this.listViewFields.onSelectionChanged((evt) => { this.updateControls(); });
            this.listViewFields.onDrop((evt) => 
            {
                if (evt.srcList === this.listViewFields)
                {
                    this.moveFields(evt.itemValues, evt.targetItemValue);
                }
                else
                {
                    this.insertFields(evt.itemValues, evt.targetItemValue);
                }
            });

            // Handlers for Add/Remove buttons
            this.btnFieldAdd.onClick((evt) =>
            {
                var selectedIds = this.listAllFields.getSelectedValues();
                this.insertFields(selectedIds, null);
            });

            this.btnFieldRemove.onClick((evt) =>
            {
                var selectedIds = this.listViewFields.getSelectedValues();
                this.removeFields(selectedIds);
            });

            // Handlers to Up/Down/Top/Bottom buttons
            this.btnFieldTop.onClick((evt) =>
            {
                this.viewFields.unshift(this.viewFields.splice(this.listViewFields.getSelectedIndex(), 1)[0]);
                this.refreshViewFieldList(0);
            });
            this.btnFieldUp.onClick((evt) =>
            {
                var index = this.listViewFields.getSelectedIndex();
                this.viewFields.splice(index - 1, 0, this.viewFields.splice(index, 1)[0]);
                this.refreshViewFieldList(index - 1);
            });
            this.btnFieldDown.onClick((evt) =>
            {
                var index = this.listViewFields.getSelectedIndex();
                this.viewFields.splice(index + 1, 0, this.viewFields.splice(index, 1)[0]);
                this.refreshViewFieldList(index + 1);
            });
            this.btnFieldBottom.onClick((evt) =>
            {
                this.viewFields.push(this.viewFields.splice(this.listViewFields.getSelectedIndex(), 1)[0]);
                this.refreshViewFieldList(this.viewFields.length - 1);
            });
        }

        public setView(viewSet: BaseViewSet, viewDef: BaseViewDefinition, allViewDefs: BaseViewDefinition[])
        {
            this.viewSet = viewSet;
            this.viewDef = viewDef || {};
            this.allViewDefs = allViewDefs || [];

            // Clear the old view fields and reset the controls before loading the new ones
            this.viewFields = [];
            this.refreshViewFieldList(null);
            this.updateControls();
            this.reloadAllFieldList();

            if (viewDef)
            {
                this.txtName.setText(viewDef.name);
                this.txtDescription.setText(viewDef.description);
                $catdv.getViewFields(this.viewType, viewDef.ID,(viewFields: ViewField[]) =>
                {
                    this.viewFields = viewFields;
                    this.refreshViewFieldList(null);
                    this.refreshAllFieldList();
                    this.updateControls();
                });
            }
            else
            {
                this.txtName.setText("");
                this.txtDescription.setText("");
            }
        }

        public selectedViewField(): BaseViewField
        {
            return this.viewFields[this.listViewFields.getSelectedIndex()];
        }

        public isViewFieldSelected()
        {
            return this.listViewFields.getSelectedIndex() != -1;
        }

        public updateControls()
        {
            var validField = this.listAllFields.getSelectedIndex() != -1;
            this.btnFieldAdd.setEnabled(validField);

            var validViewField = this.listViewFields.getSelectedIndex() != -1;
            this.btnFieldRemove.setEnabled(validViewField);
            this.btnFieldTop.setEnabled(validViewField);
            this.btnFieldUp.setEnabled(validViewField);
            this.btnFieldDown.setEnabled(validViewField);
            this.btnFieldBottom.setEnabled(validViewField); 
       }

        private insertFields(insertItemIds: string[], insertBeforeItemId: string)
        {
            var insertIndex = this.viewFields.indexOf(this.viewFields.find((field) => field.fieldDefID == insertBeforeItemId));

            insertItemIds.forEach((selectedId) =>
            {
                var selectedFieldDef = this.fieldDefLookup[selectedId];
                if (selectedFieldDef)
                {
                    var viewField: ViewField = {
                        viewDefID: this.viewDef.ID,
                        fieldDefID: selectedFieldDef.ID,
                        fieldDefinition: selectedFieldDef
                    };
                    if (insertIndex == -1)
                    {
                        this.viewFields.push(viewField);
                    }
                    else
                    {
                        this.viewFields.splice(insertIndex, 0, viewField);
                    }
                }
            });
            this.refreshViewFieldList();
            this.refreshAllFieldList();
        }

        private moveFields(insertItemIds: string[], insertBeforeItemId: string)
        {
            var newList: BaseViewField[] = [];
            var itemsToMove: BaseViewField[] = [];
            this.viewFields.forEach((viewField) =>
            {
                if (insertItemIds.indexOf(viewField.fieldDefID) == -1)
                {
                    newList.push(viewField);
                }
                else
                {
                    itemsToMove.push(viewField);
                }
            });

            var insertIndex = newList.indexOf(newList.find((field) => field.fieldDefID == insertBeforeItemId));
            if (insertIndex == -1)
            {
                itemsToMove.forEach((viewField) => newList.push(viewField));
            }
            else
            {
                newList = newList.slice(0, insertIndex).concat(itemsToMove).concat(newList.slice(insertIndex));
            }
            this.viewFields = newList;
            this.refreshViewFieldList();
            this.refreshAllFieldList();
            this.updateControls();

        }

        private removeFields(selectedIds: string[])
        {
            var remainingFields: BaseViewField[] = [];
            this.viewFields.forEach((viewField) =>
            {
                if (selectedIds.indexOf(viewField.fieldDefID) == -1)
                {
                    remainingFields.push(viewField);
                }
            });
            this.viewFields = remainingFields;
            this.refreshViewFieldList();
            this.refreshAllFieldList();
            this.updateControls();
        }

        private currentCallNumber = 0;
        
        // Load the all field list from the server
        private reloadAllFieldList()
        {
            var include = this.getDefaultIncludes();
            if (this.chkBuiltIn.isChecked()) include += " builtin";
            if (this.chkUserFields.isChecked()) include += " clip";
            if (this.chkMetadata.isChecked()) include += " metadata";

            // When user typing in filter box results may come back out of order - keep track so we can reject non-current ones
            var callNumber = ++this.currentCallNumber;
            $catdv.getFields({ filter: this.txtFilter.getText(), includeOnly: include },(rs: PartialResultSet<FieldDefinition>) =>
            {
                if (callNumber != this.currentCallNumber) return;
                this.allFields = rs.items.sort((a, b) => a.name.toLowerCase().compare(b.name.toLowerCase()));
                this.fieldDefLookup = {};
                this.allFields.forEach((fieldDef) => { this.fieldDefLookup[fieldDef.ID] = fieldDef; });
                this.refreshAllFieldList();
                this.updateControls();
            });
        }

        // Populate the all fields list from the model filtering out any items that are already in the view 
        private refreshAllFieldList()
        {
            this.listAllFields.clear();

            var viewFieldIds = this.listViewFields.getAllValues();
            this.allFields.filter((fieldDef) => !viewFieldIds.contains(fieldDef.ID)).forEach((fieldDef) =>
            {
                this.listAllFields.add(fieldDef.ID, fieldDef.name, FieldDefinitionUtil.getTooltip(fieldDef), FieldDefinitionUtil.getCssClass(fieldDef));
            });
        }

        // Populate the view field list from the model
        private refreshViewFieldList(selectedIndex: number = null)
        {
            this.listViewFields.clear();
            this.viewFields.forEach((viewField) =>
            {
                var fieldDef = viewField.fieldDefinition || { ID: viewField.fieldDefID, fieldGroupID: 1, name: "Not supported", description: "" };
                this.listViewFields.add(fieldDef.ID, fieldDef.name, FieldDefinitionUtil.getTooltip(fieldDef), FieldDefinitionUtil.getCssClass(fieldDef));
            });
            if (selectedIndex !== null)
            {
                this.listViewFields.setSelectedIndex(selectedIndex);
            }
        }


        public btnOK_onClick(evt: any)
        {
            var id = this.viewDef.ID || null;
            var name = this.txtName.getText();
            var description = this.txtDescription.getText();
            var fields = this.viewFields;

            // place new view definitions at the end of the list
            var order = this.viewDef.order;
            if ((typeof (order) == "undefined") || (order == null))
            {
                order = 0;
                this.allViewDefs.forEach((view) =>
                {
                    if (view.order >= order) order = view.order + 1;
                });
            }

            this.saveDefinition(id, name, description, order, fields);
        }

        public saveDefinition(definitionID: number, name: string, description: string, order: number, fields: BaseViewField[])
        {
            throw new Error("Abstract method 'BaseEditViewDialog.saveDefinition()' called");
        }
        
       
        // Intended to be overridden in derived class to supply default set of field includes
        public getDefaultIncludes()
        {
            return "";
        }
    }

    export class EditViewDialog extends BaseEditViewDialog
    {
        private lstViewType = new ListBox("lstViewType");
        private divGridOptions = new Element("gridOptions");
        private lstGridSize = new ListBox("lstGridSize");
        private lstGridText = new ListBox("lstGridText");
        private divFilmstripOptions = new Element("filmstripOptions");
        private lstFilmstripSize = new ListBox("lstFilmstripSize");

        private divAdditionalOptions = new Element("additionalOptions");
        private lblChkPoster = new Label("lblChkPoster");
        private chkWideSpacing = new CheckBox("chkWideSpacing");
        private lblChkAllThumbnails = new Label("lblChkAllThumbnails");
        private chkAllThumbnails = new CheckBox("chkAllThumbnails");
        private lblChkWideSpacing = new Label("lblChkWideSpacing");
        private chkPoster = new CheckBox("chkPoster");

        private divListViewOptions = new Element("listViewOptions");
        private txtFieldWidth = new TextBox("txtFieldWidth");

        private divEditFields = new Element("editFieldsSection");

        constructor(elementId: string)
        {
            super(elementId, "view");

            this.lstViewType.onChanged(() => this.updateOptionControls());
            this.lstFilmstripSize.onChanged(() =>  this.updateOptionControls());
            this.chkPoster.onChanged(() =>  this.updateOptionControls());
            this.txtFieldWidth.onInput(() => { 
                var width = this.txtFieldWidth.getText().trim();
                (<ViewField>this.selectedViewField()).options = (width.length > 0) ? { "width": parseInt(this.txtFieldWidth.getText()) } : null; 
            });
        }
        

        public setView(viewSet: ViewSet, viewDef: ViewDefinition, allViewDefs: ViewDefinition[])
        {
            super.setView(viewSet, viewDef, allViewDefs);

            this.lstViewType.setSelectedValue(viewDef ? viewDef.type : "list");
            if (viewDef == null || viewDef.type == "list")
            {
                this.chkWideSpacing.setChecked(viewDef && (viewDef.options["spacing"] == "wide"));
            }
            else if (viewDef.type == "grid")
            {
                this.lstGridSize.setSelectedValue(viewDef && (viewDef.options["size"]));
                this.lstGridText.setSelectedValue(viewDef && (viewDef.options["text"]));
            }
            else if (viewDef.type == "filmstrip")
            {
                this.lstFilmstripSize.setSelectedValue(viewDef && (viewDef.options["size"]));
                this.chkPoster.setChecked(viewDef && (viewDef.options["poster"] == "true"));
                this.chkAllThumbnails.setChecked(viewDef && (viewDef.options["allThumbnails"] == "true"));
            }

            this.updateOptionControls();
        }

        public updateControls()
        {
            super.updateControls();

            if (super.isViewFieldSelected())
            {
                var viewField = <ViewField>this.selectedViewField();
                this.txtFieldWidth.setText((viewField.options && viewField.options.width) ? viewField.options.width.toString() : "");
                this.txtFieldWidth.setEnabled(true);
            }
            else
            {
                this.txtFieldWidth.setText("");
                this.txtFieldWidth.setEnabled(false);
            }
        }
        
        private updateOptionControls()
        {
            var viewType = this.lstViewType.getSelectedValue();
            if (viewType == "builtin")
            {
                this.divGridOptions.hide();
                this.divFilmstripOptions.hide();
                this.divAdditionalOptions.hide();
                this.lblChkAllThumbnails.hide();
                this.lblChkPoster.hide();
                this.lblChkWideSpacing.hide();
                this.divEditFields.hide();
                this.divListViewOptions.hide();
             }
            else if (viewType == "list")
            {
                 this.divGridOptions.hide();
                this.divFilmstripOptions.hide();
                this.divAdditionalOptions.show();
                this.lblChkAllThumbnails.hide();
                this.lblChkPoster.hide();
                this.lblChkWideSpacing.show();
                this.divEditFields.show();
                this.divListViewOptions.show();
            }
            else if (viewType == "grid")
            {
                this.divGridOptions.show();
                this.divFilmstripOptions.hide();
                this.divAdditionalOptions.hide();
                this.divEditFields.show();
                this.divListViewOptions.hide();
            }
            else if (viewType == "filmstrip")
            {
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
                if (this.chkPoster.isChecked())
                {
                    if (filmstripSize == "large")
                    {
                        this.chkAllThumbnails.setEnabled(true);
                    }
                    else
                    {
                        this.chkAllThumbnails.setChecked(false);
                        this.chkAllThumbnails.setEnabled(false);
                    }
                }
                else
                {
                    if (filmstripSize == "medium")
                    {
                        this.chkAllThumbnails.setEnabled(true);
                    }
                    else
                    {
                        this.chkAllThumbnails.setChecked(false);
                        this.chkAllThumbnails.setEnabled(false);
                    }
                }
            }
        }

        public saveDefinition(definitionID: number, name: string, description: string, order: number, fields: BaseViewField[])
        {
            var viewType = this.lstViewType.getSelectedValue();

            var options = {};
            if (viewType == "list")
            {
                options["spacing"] = this.chkWideSpacing.isChecked() ? "wide" : "normal";
            }
            else if (viewType == "grid")
            {
                options["size"] = this.lstGridSize.getSelectedValue();
                options["text"] = this.lstGridText.getSelectedValue();
            }
            else if (viewType == "filmstrip")
            {
                options["size"] = this.lstFilmstripSize.getSelectedValue();
                options["poster"] = this.chkPoster.isChecked() ? "true" : "false";
                options["allThumbnails"] = this.chkAllThumbnails.isChecked() ? "true" : "false";
            }

            var viewDef: ViewDefinition =
                {
                    ID: definitionID,
                    viewSetID: this.viewSet.ID,
                    name: name,
                    description: description,
                    type: viewType,
                    options: options,
                    fields: fields,
                    order: order
                };

            $catdv.saveView("view", viewDef,() =>
            {
                this.close(true);
            });
        }
    }


}

