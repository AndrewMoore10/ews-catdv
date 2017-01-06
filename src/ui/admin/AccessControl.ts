module ui.admin
{
    import HtmlUtil = util.HtmlUtil;

    import Control = controls.Control;
    import Label = controls.Label;
    import Button = controls.Button;
    import TextBox = controls.TextBox;
    import ListBox = controls.ListBox;
    import ListItem = controls.ListItem;
    import ComboBox = controls.ComboBox;
    import DropDownList = controls.DropDownList;
    import CheckList = controls.CheckList;
    import Modal = controls.Modal;
    import SimpleArrayDataSource = controls.SimpleArrayDataSource;

    import $catdv = catdv.RestApi;
    import Group = catdv.Group;
    import Catalog = catdv.Catalog;
    import FieldDefinition = catdv.FieldDefinition;
    import AccessRule = catdv.AccessRule;
    import AccessRuleSelector = catdv.AccessRuleSelector;
    import FieldDefinitionUtil = catdv.FieldDefinitionUtil;


    export class EditACLDialog extends EditPermissionsDialog
    {
        private lblEditACLDialogTitle = new Label("lblEditACLDialogTitle");
        private listUserSelectors: SelectorList = null;
        private btnAddUserSelector = new Button("btnAddUserSelector");
        private btnEditUserSelector = new Button("btnEditUserSelector");
        private btnDeleteUserSelector = new Button("btnDeleteUserSelector");

        private editUserSelectorDialog: EditUserSelectorDialog;

        private listTargetSelectors: SelectorList = null;
        private btnAddTargetCatalogSelector = new Button("btnAddTargetCatalogSelector");
        private btnAddTargetRuleSelector = new Button("btnAddTargetRuleSelector");
        private btnEditTargetSelector = new Button("btnEditTargetSelector");
        private btnDeleteTargetSelector = new Button("btnDeleteTargetSelector");

        private editCatalogSelectorDialog: EditCatalogSelectorDialog;

        private editTargetSelectorDialog: EditTargetSelectorDialog;

        private btnEditACLOK = new Button("btnEditACLOK");

        private group: Group;
        private acl: AccessRule[] = [];
        private selectedAccessRule: AccessRule = null;
        private userFields: FieldDefinition[];
        private catalogFields: FieldDefinition[];
        private fieldLookupByID: { [id: string]: FieldDefinition };

        constructor(elementId: string, objectType: string)
        {
            super(elementId, "Acl");

            this.userFields = [
                { ID: "USER", isBuiltin: true, memberOf: "user", identifier: "name", name: "User" },
                { ID: "ROLE", isBuiltin: true, memberOf: "user", identifier: "role", name: "Role" }
            ];
            $catdv.getFields({ "include": "user,catalog,catalog.builtin" },(fieldResultSet) =>
            {
                this.fieldLookupByID = {};
                fieldResultSet.items.concat(this.userFields).forEach((fieldDef) =>
                {
                    this.fieldLookupByID[FieldDefinitionUtil.getLongIdentifier(fieldDef)] = fieldDef;
                });

                this.userFields = this.userFields.concat(fieldResultSet.items.filter((field) => field.memberOf == "user" && FieldDefinitionUtil.isListField(field)));
                this.catalogFields = fieldResultSet.items.filter((field) => field.memberOf == "catalog");


                this.listUserSelectors = new SelectorList("listUserSelectors", "", this.fieldLookupByID);
                this.listUserSelectors.onSelectionChanged((evt) =>
                {
                    var selectedIndex = this.listUserSelectors.getSelectedIndex();
                    this.selectAccessRule((selectedIndex >= 0) ? this.acl[selectedIndex] : null);
                });

                this.btnAddUserSelector.onClick((evt) =>
                {
                    this.editUserSelectorDialog.setSelector({}, true);
                    this.editUserSelectorDialog.show();
                });

                this.btnEditUserSelector.onClick((evt) => 
                {
                    var selector = this.acl[this.listUserSelectors.getSelectedIndex()].userSelector;
                    this.editUserSelectorDialog.setSelector(selector, false);
                    this.editUserSelectorDialog.show();
                });

                this.btnDeleteUserSelector.onClick((evt) =>
                {
                    this.acl.splice(this.listUserSelectors.getSelectedIndex(), 1);
                    this.listUserSelectors.setModel(this.acl.map((rule) => rule.userSelector));
                    this.listUserSelectors.setSelectedIndex(this.acl.length - 1);
                });

                this.editUserSelectorDialog = new EditUserSelectorDialog("editUserSelectorDialog", this.userFields);
                this.editUserSelectorDialog.onOK((newSelector: boolean, selector: AccessRuleSelector) =>
                {
                    if (newSelector)
                    {
                        // When user adds a user selector they are also, implicitly creating a new AccessRule
                        var rule = {
                            userSelector: selector,
                            permissions: this.group.defaultPermissions,
                            targetSelectors: []
                        };
                        this.acl.push(rule);
                        this.selectAccessRule(rule);
                    }
                    this.listUserSelectors.setModel(this.acl.map((rule) => rule.userSelector));
                    this.listUserSelectors.setSelectedIndex(this.acl.length - 1);
                });

                this.listTargetSelectors = new SelectorList("listTargetSelectors", "Applies to all catalogs in group", this.fieldLookupByID);
                this.listTargetSelectors.onSelectionChanged((evt) =>
                {
                    this.updateControls();
                });

                this.btnAddTargetCatalogSelector.onClick((evt) =>
                {
                    this.editCatalogSelectorDialog.setSelector(this.group.ID, { field: "catalog.name", values: [] }, true);
                    this.editCatalogSelectorDialog.show();
                });

                this.btnAddTargetRuleSelector.onClick((evt) =>
                {
                    this.editTargetSelectorDialog.setSelector({ field: "catalog.name", values: [] }, true);
                    this.editTargetSelectorDialog.show();
                });

                this.btnEditTargetSelector.onClick((evt) => 
                {
                    var selector = this.selectedAccessRule.targetSelectors[this.listTargetSelectors.getSelectedIndex()];
                    if ((selector.field == "catalog.name") && !selector.values.find((value) => value.match("[$%*]") != null))
                    {
                        this.editCatalogSelectorDialog.setSelector(this.group.ID, selector, false);
                        this.editCatalogSelectorDialog.show();
                    }
                    else
                    {
                        this.editTargetSelectorDialog.setSelector(selector, false);
                        this.editTargetSelectorDialog.show();
                    }
                });

                this.btnDeleteTargetSelector.onClick((evt) => 
                {
                    this.selectedAccessRule.targetSelectors.splice(this.listTargetSelectors.getSelectedIndex(), 1);
                    this.listTargetSelectors.setModel(this.selectedAccessRule.targetSelectors);
                    this.updateControls();
                });

                this.editCatalogSelectorDialog = new EditCatalogSelectorDialog("editCatalogSelectorDialog");
                this.editCatalogSelectorDialog.onOK((newSelector: boolean, selector: AccessRuleSelector) =>
                {
                    if (newSelector)
                    {
                        this.selectedAccessRule.targetSelectors.push(selector);
                    }
                    this.listTargetSelectors.setModel(this.selectedAccessRule.targetSelectors);
                });


                this.editTargetSelectorDialog = new EditTargetSelectorDialog("editTargetSelectorDialog", this.catalogFields);
                this.editTargetSelectorDialog.onOK((newSelector: boolean, selector: AccessRuleSelector) =>
                {
                    if (newSelector)
                    {
                        this.selectedAccessRule.targetSelectors.push(selector);
                    }
                    this.listTargetSelectors.setModel(this.selectedAccessRule.targetSelectors);
                });

                this.btnEditACLOK.onClick((evt: any) =>
                {
                    if (this.selectedAccessRule != null)
                    {
                        this.selectedAccessRule.permissions = super.readPermissionCheckboxes();
                    }
                    this.close(true, this.acl);
                });

                this.updateControls();
            });

        }

        public setGroup(group: Group)
        {
            // take a copy
            this.group = group;
            this.acl = [];
            (group.acl || []).forEach((rule) =>
            {
                this.acl.push($.extend(true, {}, rule));
            });

            this.lblEditACLDialogTitle.setText("Edit Access Control List for '" + group.name + "'");
            this.listUserSelectors.setModel(this.acl.map((rule) => rule.userSelector));
            this.listUserSelectors.setSelectedIndex(this.acl.length - 1);
        }

        private selectAccessRule(rule: AccessRule)
        {
            if (this.selectedAccessRule != null)
            {
                this.selectedAccessRule.permissions = super.readPermissionCheckboxes();
            }
            this.selectedAccessRule = rule;
            if (this.selectedAccessRule != null)
            {
                super.setPermissionCheckboxes(this.selectedAccessRule.permissions);
                this.listTargetSelectors.setModel(this.selectedAccessRule.targetSelectors);
            }
            else
            {
                super.setPermissionCheckboxes([]);
                this.listTargetSelectors.setModel([]);
            }
            this.updateControls();
        }

        private updateControls()
        {
            if (this.listUserSelectors == null || (this.listUserSelectors.getSelectedIndex() == -1))
            {
                super.enablePermissionCheckboxes(false);
                this.btnEditUserSelector.setEnabled(false);
                this.btnDeleteUserSelector.setEnabled(false);
                this.btnAddTargetCatalogSelector.setEnabled(false);
                this.btnAddTargetRuleSelector.setEnabled(false);
                this.btnEditTargetSelector.setEnabled(false);
                this.btnDeleteTargetSelector.setEnabled(false);
            }
            else
            {
                super.enablePermissionCheckboxes(true);
                this.btnEditUserSelector.setEnabled(true);
                this.btnDeleteUserSelector.setEnabled(true);
                this.btnAddTargetCatalogSelector.setEnabled(true);
                this.btnAddTargetRuleSelector.setEnabled(true);
            }

            if (this.listTargetSelectors == null || (this.listTargetSelectors.getSelectedIndex() == -1))
            {
                this.btnEditTargetSelector.setEnabled(false);
                this.btnDeleteTargetSelector.setEnabled(false);
            }
            else
            {
                this.btnEditTargetSelector.setEnabled(true);
                this.btnDeleteTargetSelector.setEnabled(true);
            }
        }
    }

    class SelectorList extends Control
    {
        private $UL: JQuery;
        private $msg: JQuery;
        private selectionChangedHandler: (evt: any) => void = null;

        private listModel: AccessRuleSelector[] = [];
        private fieldLookupByID: { [id: string]: FieldDefinition };
        private selectedIndex: number = -1;

        constructor(element: any, emptyMessage: string, fieldLookupByID: { [id: string]: FieldDefinition })
        {
            super(element);

            this.fieldLookupByID = fieldLookupByID;

            this.$element.addClass("listbox");
 
            // Create list inside passed in DIV
            this.$UL = $("<ul>").appendTo(this.$element);
 
            // Create label inside passed in DIV
            this.$msg = $("<div class='message'>" + HtmlUtil.escapeHtml(emptyMessage) + "</div>").appendTo(this.$element);
 
            // click on the background of the list de-selects eveything 
            this.$element.on("click",(evt) =>
            {
                this.setSelectedIndex(-1);
            });
        }

        // Register for selection changed events
        public onSelectionChanged(selectionChangedHandler: (evt: any) => void)
        {
            this.selectionChangedHandler = selectionChangedHandler;
        }

        public setModel(listModel: AccessRuleSelector[])
        {
            this.listModel = listModel;
            this.renderList();
            this.selectedIndex = -1;
        }

        public getSelectedIndex(): number
        {
            return this.selectedIndex;
        }

        public setSelectedIndex(index: number)
        {
            // clear existing selection
            this.selectedIndex = index;
            this.$UL.children().removeClass("selected");
            if (index != -1)
            {
                $("#" + this.elementId + "_" + this.selectedIndex).addClass("selected");
            }
            if (this.selectionChangedHandler)
            {
                this.selectionChangedHandler({ src: this });
            }
        }

        private renderList()
        {
            this.$UL.empty();

            if (this.listModel && this.listModel.length > 0)
            {
                this.$msg.hide();
                this.listModel.forEach((selector, i) => 
                {
                    var fieldDef = this.fieldLookupByID[selector.field];
                    var fieldName = fieldDef ? fieldDef.name : selector.field;
                    var itemText = fieldName + ": " + selector.values.join(", ");
                    var $li = $("<li id='" + this.elementId + "_" + i + "' class='acl-selector'>" + HtmlUtil.escapeHtml(itemText) + "</li>").appendTo(this.$UL);

                    $li.on("click",(evt) =>
                    {
                        evt.stopPropagation();
                        this.setSelectedIndex(i);
                        return false;
                    });
                });
            }
            else
            {
                this.$msg.show();
            }
        }

        private getIndexFromElementId(elementId: string): number
        {
            return Number(elementId.substring(elementId.lastIndexOf("_") + 1));
        }
    }

    class EditUserSelectorDialog extends Modal
    {
        private lstFields = new DropDownList("lstUserFields");
        private lstUserSelection : CheckList; 
        private btnOK = new Button("btnEditUserSelectorOK");

        private fields: FieldDefinition[];
        private fieldListItems: ListItem[];

        private userDataSource = new SimpleArrayDataSource<ListItem>([]);
        private selector: AccessRuleSelector = null;
        private isNew: boolean = true;
        private selectedField: FieldDefinition = null;

        constructor(elementId: string, fields: FieldDefinition[])
        {
            super(elementId);
            
            this.fields = fields;
            this.fieldListItems = [];
            this.lstUserSelection = new CheckList("lstUserSelection", true, this.userDataSource);

            this.fields.forEach((fieldDef) =>
            {
                this.fieldListItems.push({
                    value: fieldDef.ID,
                    text: fieldDef.name
                });
            });
            this.lstFields.setItems(this.fieldListItems);
            this.selectedField = this.fields[0];
            this.populateItemList(this.selectedField);

            this.lstFields.onChanged((evt) =>
            {
                this.selectedField = this.fields[this.lstFields.getSelectedIndex()];
                this.populateItemList(this.selectedField);
            });

            this.btnOK.onClick((evt: any) =>
            {
                this.selector.field = FieldDefinitionUtil.getLongIdentifier(this.selectedField);
                this.selector.values = this.lstUserSelection.getSelectedValues();
                this.close(true, this.isNew, this.selector);
            });
        }

        public setSelector(selector: AccessRuleSelector, isNew: boolean)
        {
            this.selector = selector;
            this.isNew = isNew;

            this.selectedField = this.fields.find((field) => FieldDefinitionUtil.getLongIdentifier(field) == selector.field) || this.fields[0];
            this.lstFields.setSelectedValue(this.selectedField.ID);
            this.populateItemList(this.selectedField);
        }

        private populateItemList(fieldDef: FieldDefinition)
        {
            if (fieldDef.ID == "USER")
            {
                $catdv.getUsers({}, (users) =>
                {
                    this.userDataSource.setItems(users.map((user) =>
                    {
                        return {
                            value: user.name,
                            text: user.name + (user.notes ? " (" + user.notes + ")" : ""),
                            isSelected: this.selector && this.selector.values && this.selector.values.find((userName) => userName == user.name) ? true : false
                        };
                    }));
                    this.lstUserSelection.reload();
                });
            }
            else if (fieldDef.ID == "ROLE")
            {
                $catdv.getRoles({}, (roles) =>
                {
                    this.userDataSource.setItems(roles.map((role) =>
                    {
                        return {
                            value: role.name,
                            text: role.name + (role.notes ? " (" + role.notes + ")" : ""),
                            isSelected: this.selector && this.selector.values && this.selector.values.find((roleName) => roleName == role.name) ? true : false
                        };
                    }));
                    this.lstUserSelection.reload();
                });
            }
            else
            {
                $catdv.getFieldListValues(fieldDef.ID,(values) =>
                {
                    this.userDataSource.setItems(values.map((value) =>
                    {
                        return {
                            value: value,
                            text: value,
                            isSelected: this.selector && this.selector.values && this.selector.values.find((v) => v == value) ? true : false
                        };
                    }));
                    this.lstUserSelection.reload();
                });
            }
        }
    }

    class EditCatalogSelectorDialog extends Modal
    {
        private lstCatalogs: CheckList;
        private btnOK = new Button("btnEditCatalogSelectorOK");

        private catalogDataSource = new SimpleArrayDataSource<ListItem>([]);
        private selector: AccessRuleSelector = null;
        private isNew: boolean = true;
        private catalogs: Catalog[] = null;

        constructor(elementId: string)
        {
            super(elementId);
            
            this.lstCatalogs = new CheckList("lstCatalogs", true, this.catalogDataSource);

            this.btnOK.onClick((evt: any) =>
            {
                this.selector.values = this.lstCatalogs.getSelectedValues();
                this.close(true, this.isNew, this.selector);
            });
        }

        public setSelector(groupID: number, selector: AccessRuleSelector, isNew: boolean)
        {
            this.selector = selector;
            this.isNew = isNew;

            if (this.catalogs == null)
            {
                $catdv.getCatalogs((catalogs) =>
                {
                    this.catalogs = catalogs;
                    this.populateItemList(groupID, this.selector.values);
                });
            }
            else
            {
                this.populateItemList(groupID, this.selector.values);
            }
        }


        private populateItemList(groupID: number, selectedCatalogs: string[])
        {
            this.catalogDataSource.setItems(this.catalogs.filter((catalog) => catalog.groupID == groupID).map((catalog) =>
            {
                return {
                    value: catalog.name,
                    text: catalog.name,
                    isSelected: selectedCatalogs.find((catalogName) => catalogName == catalog.name) ? true : false
                };
            }));
            this.lstCatalogs.reload();
        }
    }


    class EditTargetSelectorDialog extends Modal
    {
        private lstTargetFields = new DropDownList("lstTargetFields");
        private lstTargetFieldValue: ComboBox;
        private btnOK = new Button("btnEditTargetSelectorOK");

        private fields: FieldDefinition[];
        private fieldListItems: ListItem[];

        private targetDataSource: SimpleArrayDataSource<ListItem>;
        private selector: AccessRuleSelector = null;
        private isNew: boolean = true;
        private selectedField: FieldDefinition = null;

        constructor(elementId: string, fields: FieldDefinition[])
        {
            super(elementId);

            this.fields = fields;
            
            this.targetDataSource = new SimpleArrayDataSource<ListItem>([]);
            this.lstTargetFieldValue = new ComboBox("lstTargetFieldValue", this.targetDataSource, false);
            
            this.fieldListItems = [];
            this.fields.forEach((fieldDef) =>
            {
                this.fieldListItems.push({
                    value: fieldDef.ID,
                    text: fieldDef.name
                });
            });
            this.lstTargetFields.setItems(this.fieldListItems);
            this.selectedField = this.fields[0];
            this.populateItemList(this.selectedField, null);

            this.lstTargetFields.onChanged((evt) =>
            {
                this.selectedField = this.fields[this.lstTargetFields.getSelectedIndex()];
                this.populateItemList(this.selectedField, null);
            });

            this.btnOK.onClick((evt: any) =>
            {
                this.selector.field = FieldDefinitionUtil.getLongIdentifier(this.selectedField);
                this.selector.values = [this.lstTargetFieldValue.getSelectedValue()];
                this.close(true, this.isNew, this.selector);
            });
        }

        public setSelector(selector: AccessRuleSelector, isNew: boolean)
        {
            this.selector = selector;
            this.isNew = isNew;

            this.selectedField = this.fields.find((field) => selector && FieldDefinitionUtil.getLongIdentifier(field) == selector.field) || this.fields[0];
            this.lstTargetFields.setSelectedValue(this.selectedField.ID);
            this.populateItemList(this.selectedField, selector && selector.values ? selector.values.join(",") : null);
        }

        private populateItemList(fieldDef: FieldDefinition, selectedValue: string)
        {
            if (fieldDef.fieldType == "select-user")
            {
                $catdv.getUsers({}, (users) =>
                {
                    this.targetDataSource.setItems(users.map((user) =>
                    {
                        return {
                            value: user.name,
                            text: user.name + (user.notes ? " (" + user.notes + ")" : "")
                        };
                    }));
                    this.lstTargetFieldValue.reload();
                    if (selectedValue) this.lstTargetFieldValue.setSelectedValue(selectedValue);
                });
            }
            else if (fieldDef.fieldType == "select-group")
            {
                $catdv.getGroups({}, (groups) =>
                {
                    this.targetDataSource.setItems(groups.map((group) =>
                    {
                        return {
                            value: group.name,
                            text: group.name + (group.notes ? " (" + group.notes + ")" : "")
                        };
                    }));
                    this.lstTargetFieldValue.reload();
                    if (selectedValue) this.lstTargetFieldValue.setSelectedValue(selectedValue);
                });
            }
            else if (FieldDefinitionUtil.isListField(fieldDef))
            {
                $catdv.getFieldListValues(fieldDef.ID,(values) =>
                {
                    this.targetDataSource.setItems(values.map((value) => { return { value: value, text: value }; }));
                    this.lstTargetFieldValue.reload();
                    if (selectedValue) this.lstTargetFieldValue.setSelectedValue(selectedValue);
                });
            }
            else
            {
                $catdv.getFieldValues(fieldDef.ID,(values) =>
                {
                    this.targetDataSource.setItems(values.map((value) => { return { value: value, text: value }; }));
                    this.lstTargetFieldValue.reload();
                    if (selectedValue) this.lstTargetFieldValue.setSelectedValue(selectedValue);
                });
            }

        }
    }
}