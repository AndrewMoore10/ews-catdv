module ui.admin
{
    import HtmlUtil = util.HtmlUtil;
    import $catdv = catdv.RestApi;
    import Element = controls.Element;
    import Button = controls.Button;
    import ButtonDropDown = controls.ButtonDropDown;
    import TextBox = controls.TextBox;
    import TextArea = controls.TextArea;
    import Label = controls.Label;
    import DropDownList = controls.DropDownList;
    import CheckBox = controls.CheckBox;
    import ListBox = controls.ListBox;
    import Control = controls.Control;

    import BaseViewDefinition = catdv.BaseViewDefinition;
    import BaseViewSet = catdv.BaseViewSet;
    import BaseViewField = catdv.BaseViewField;
    import VisibilityRules = catdv.VisibilityRules;
    import NavbarLoginMenu = ui.panels.NavbarLoginMenu;

    // These lookup tables are created by the server and emitted into 
    // a script in the head of views.jsp
    declare var roleLookup;
    declare var groupLookup;
    declare var clientLookup;

    export interface VisibilityControlledObject
    {
        ID?: number;
        visibility?: VisibilityRules;
    }

    export class EditVisibilityDialog extends controls.Modal
    {
        private viewVisibilityList: VisibilityRuleList;
        private btnAddGroupContainer = new Element("btnAddGroupContainer");
        private btnAddGroup = new ButtonDropDown("btnAddGroup");
        private btnAddRole = new ButtonDropDown("btnAddRole");
        private btnAddClient = new ButtonDropDown("btnAddClient");
        private btnDeleteVisibilityItem = new Button("btnDeleteVisibilityItem");
        private btnEditVisibilityOK = new Button("btnEditVisibilityOK");
        private lblNotDisplayed = new Label("lblNotDisplayed");
        private chkNotDisplayed = new CheckBox("chkNotDisplayed");

        private filterTypes: string[];
        private targetObject: VisibilityControlledObject;
        private visibility: VisibilityRules;

        constructor(elementId: string, objectType: string)
        {
            super(elementId);

            // Probably should have caller pass in filterTypes but calculate it for now
            switch (objectType)
            {
                case "field":
                    this.filterTypes = ["GROUPS", "ROLES"];
                    break;
                case "webSettings":
                    this.filterTypes = ["ROLES"];
                    break;
                case "panel":
                    this.filterTypes = ["CLIENTS", "GROUPS", "ROLES", "DISPLAYED"];
                    break;
                default:
                    this.filterTypes = ["CLIENTS", "GROUPS", "ROLES"];
                    break;
            }

            this.viewVisibilityList = new VisibilityRuleList("listVisibilityRules", this.filterTypes);
            this.viewVisibilityList.onSelectionChanged((evt) => { this.updateControls(); });

            if (this.filterTypes.contains("GROUPS"))
            {
                this.btnAddGroup.onClick((evt, dropDownItemId) =>
                {
                    var groupId = dropDownItemId.split("_")[1];
                    this.viewVisibilityList.addFilterItem(groupId);
                });
            }
            else
            {
                this.btnAddGroupContainer.hide();
            }

            if (this.filterTypes.contains("ROLES"))
            {
                this.btnAddRole.onClick((evt, dropDownItemId) =>
                {
                    var roleId = dropDownItemId.split("_")[1];
                    this.viewVisibilityList.addFilterItem(roleId);
                });
            }
            else
            {
                this.btnAddGroupContainer.hide();
            }

            if (this.filterTypes.contains("CLIENTS"))
            {
                this.btnAddClient.onClick((evt, dropDownItemId) =>
                {
                    var clientId = dropDownItemId.split("_")[1];
                    this.viewVisibilityList.addFilterItem(clientId);
                });
            }
            else
            {
                this.btnAddClient.hide();
            }

            this.btnDeleteVisibilityItem.onClick((evt) =>
            {
                this.viewVisibilityList.deleteSelectedFilterItem();
            });

            this.btnEditVisibilityOK.onClick((evt: any) => { this.btnOK_onClick(evt); });
        }

        public setItem(targetObject: VisibilityControlledObject)
        {
            this.targetObject = targetObject;
            this.visibility = $.extend(true, {}, targetObject.visibility);
            this.viewVisibilityList.setVisibility(this.visibility);
            if (this.filterTypes.contains("DISPLAYED"))
            {
                this.lblNotDisplayed.show();
                this.chkNotDisplayed.setChecked(this.visibility.notDisplayed ? true : false);
            }
            else
            {
                this.lblNotDisplayed.hide();
            }
            this.updateControls();
        }

        private btnOK_onClick(evt: any)
        {
            if (this.filterTypes.contains("DISPLAYED"))
            {
                this.visibility.notDisplayed = this.chkNotDisplayed.isChecked();
            }

            // update visibility in page's model
            this.targetObject.visibility = this.visibility;

            // create change set for caller to save to the server
            var updatedItem = {
                ID: this.targetObject.ID,
                visibility: this.visibility
            };

            this.close(true, updatedItem);
        }

        private updateControls()
        {
            this.btnAddGroup.setEnabled(this.viewVisibilityList.canAddGroupFilter());
            this.btnAddRole.setEnabled(this.viewVisibilityList.canAddRoleFilter());
            this.btnAddClient.setEnabled(this.viewVisibilityList.canAddClientFilter());
            this.btnDeleteVisibilityItem.setEnabled(this.viewVisibilityList.canDeleteFilterItem());
        }
    }

    // Custom control to display a set of visibility rules in a list

    class VisibilityRuleList extends Control
    {
        private kVisibleToGroups = "visibleToGroups";
        private kHiddenFromGroups = "hiddenFromGroups";
        private kVisibleToRoles = "visibleToRoles";
        private kHiddenFromRoles = "hiddenFromRoles";
        private kVisibleToClients = "visibleToClients";
        private kHiddenFromClients = "hiddenFromClients";

        private filterTypes: string[];
        private visibility: VisibilityRules;
        private selectionChangedHandler: (evt: any) => void = null;

        private selectedFilter: string = null;
        private selectedFilterItem: number = -1;

        // elementId of the <ul> used by this control
        // (this <ul> sits inside a <div> with overflow:scroll, but we can ignore that)
        constructor(elementId: string, filterTypes: string[])
        {
            super(elementId);
            this.filterTypes = filterTypes;
        }

        public setVisibility(visibility: VisibilityRules)
        {
            this.visibility = visibility;
            if (!this.filterTypes.contains("CLIENTS"))
            {
                this.visibility.visibleToClients = [];
                this.visibility.hiddenFromClients = [];
            }
            if (!this.filterTypes.contains("GROUPS"))
            {
                this.visibility.visibleToGroups = [];
                this.visibility.hiddenFromGroups = [];
            }
            if (!this.filterTypes.contains("ROLES"))
            {
                this.visibility.visibleToRoles = [];
                this.visibility.hiddenFromRoles = [];
            }

            // Strip out any values that no longer refer to valid groups,roles or clients
            if (this.visibility.visibleToGroups)
            {
                this.visibility.visibleToGroups = this.visibility.visibleToGroups.filter((group) => typeof groupLookup[group] !== "undefined");
            }
            if (this.visibility.hiddenFromGroups)
            {
                this.visibility.hiddenFromGroups = this.visibility.hiddenFromGroups.filter((group) => typeof groupLookup[group] !== "undefined");
            }
            if (this.visibility.visibleToRoles)
            {
                this.visibility.visibleToRoles = this.visibility.visibleToRoles.filter((role) => typeof roleLookup[role] !== "undefined");
            }
            if (this.visibility.hiddenFromRoles)
            {
                this.visibility.hiddenFromRoles = this.visibility.hiddenFromRoles.filter((role) => typeof roleLookup[role] !== "undefined");
            }
            if (this.visibility.visibleToClients)
            {
                this.visibility.visibleToClients = this.visibility.visibleToClients.filter((client) => typeof clientLookup[client] !== "undefined");
            }
            if (this.visibility.hiddenFromClients)
            {
                this.visibility.hiddenFromClients = this.visibility.hiddenFromClients.filter((client) => typeof clientLookup[client] !== "undefined");
            }

            this.redraw();
        }

        public onSelectionChanged(changeHandler: (evt: any) => void)
        {
            this.selectionChangedHandler = changeHandler;
        }

        public canAddGroupFilter(): boolean
        {
            return this.selectedFilter == this.kVisibleToGroups || this.selectedFilter == this.kHiddenFromGroups;
        }

        public canAddRoleFilter(): boolean
        {
            return this.selectedFilter == this.kVisibleToRoles || this.selectedFilter == this.kHiddenFromRoles;
        }

        public canAddClientFilter(): boolean
        {
            return this.selectedFilter == this.kVisibleToClients || this.selectedFilter == this.kHiddenFromClients;
        }

        public addFilterItem(filterItem: string)
        {
            var filter = this.visibility[this.selectedFilter];
            if (!filter)
            {
                filter = this.visibility[this.selectedFilter] = [];
            }
            filter.push(filterItem);
            this.redraw();
        }

        public canDeleteFilterItem(): boolean
        {
            return this.selectedFilterItem != -1;
        }

        public deleteSelectedFilterItem() 
        {
            var selectedFilterItems: string[] = this.visibility[this.selectedFilter];
            if (selectedFilterItems != null)
            {
                if (selectedFilterItems.length > 1)
                {
                    selectedFilterItems.splice(this.selectedFilterItem, 1);
                }
                else
                {
                    this.visibility[this.selectedFilter] = null;
                }
            }
            this.redraw();
        }

        public redraw()
        {
            this.$element.empty();
            var html = "";
            html += "<ul class='filters'>";

            if (this.filterTypes.contains("CLIENTS"))
            {
                html += " <li id='filter_visibleToClients' class='filterHeader'>Only visible to Clients</li>";
                html += this.buildFilterList(this.visibility.visibleToClients, clientLookup, "visibleToClients", "(All)");
                html += " <li id='filter_hiddenFromClients' class='filterHeader'>Not visible to Clients</li>";
                html += this.buildFilterList(this.visibility.hiddenFromClients, clientLookup, "hiddenFromClients", "(None)");
            }
            if (this.filterTypes.contains("GROUPS"))
            {
                html += " <li id='filter_visibleToGroups' class='filterHeader'>Only visible to Groups</li>";
                html += this.buildFilterList(this.visibility.visibleToGroups, groupLookup, "visibleToGroups", "(All)");
                html += " <li id='filter_hiddenFromGroups' class='filterHeader'>Not visible to Groups</li>";
                html += this.buildFilterList(this.visibility.hiddenFromGroups, groupLookup, "hiddenFromGroups", "(None)");
            }
            if (this.filterTypes.contains("ROLES"))
            {
                html += " <li id='filter_visibleToRoles' class='filterHeader'>Only visible to Roles</li>";
                html += this.buildFilterList(this.visibility.visibleToRoles, roleLookup, "visibleToRoles", "(All)");
                html += " <li id='filter_hiddenFromRoles' class='filterHeader'>Not visible to Roles</li>";
                html += this.buildFilterList(this.visibility.hiddenFromRoles, roleLookup, "hiddenFromRoles", "(None)");
            }
            html += "</ul>";
            this.$element.html(html);

            this.$element.find("li").on("click", (evt) =>
            {
                this.onListItemClick(evt);
            });
        }

        private buildFilterList(filterItems: string[], idLookup: any, rule: string, emptyMessage: string)
        {
            if ((filterItems != null) && (filterItems.length > 0))
            {
                var html = "";
                filterItems.forEach((filterItem, i) =>
                {
                    if (idLookup) filterItem = idLookup[filterItem];
                    html += "<li id='filter_" + rule + "_" + i + "'>" + HtmlUtil.escapeHtml(filterItem) + "</li>";
                });
                return html;
            }
            else
            {
                return "<li id='filter_" + rule + "_-1' class='emptyMessage'>" + HtmlUtil.escapeHtml(emptyMessage) + "</li>";
            }
        }

        private onListItemClick(evt: JQueryEventObject)
        {
            this.$element.find("li").removeClass("selected");
            $(evt.target).addClass("selected");
            var idFields: string[] = $(evt.target).get(0).id.split("_");
            this.selectedFilter = idFields[1];
            this.selectedFilterItem = idFields.length > 2 ? Number(idFields[2]) : -1;
            this.fireSelectionChanged();
        }

        private fireSelectionChanged()
        {
            if (this.selectionChangedHandler != null)
            {
                this.selectionChangedHandler({});
            }
        }
    }
}