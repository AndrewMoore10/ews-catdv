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
        var Button = controls.Button;
        var ButtonDropDown = controls.ButtonDropDown;
        var Label = controls.Label;
        var CheckBox = controls.CheckBox;
        var Control = controls.Control;
        var EditVisibilityDialog = (function (_super) {
            __extends(EditVisibilityDialog, _super);
            function EditVisibilityDialog(elementId, objectType) {
                var _this = this;
                _super.call(this, elementId);
                this.btnAddGroupContainer = new Element("btnAddGroupContainer");
                this.btnAddGroup = new ButtonDropDown("btnAddGroup");
                this.btnAddRole = new ButtonDropDown("btnAddRole");
                this.btnAddClient = new ButtonDropDown("btnAddClient");
                this.btnDeleteVisibilityItem = new Button("btnDeleteVisibilityItem");
                this.btnEditVisibilityOK = new Button("btnEditVisibilityOK");
                this.lblNotDisplayed = new Label("lblNotDisplayed");
                this.chkNotDisplayed = new CheckBox("chkNotDisplayed");
                // Probably should have caller pass in filterTypes but calculate it for now
                switch (objectType) {
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
                this.viewVisibilityList.onSelectionChanged(function (evt) { _this.updateControls(); });
                if (this.filterTypes.contains("GROUPS")) {
                    this.btnAddGroup.onClick(function (evt, dropDownItemId) {
                        var groupId = dropDownItemId.split("_")[1];
                        _this.viewVisibilityList.addFilterItem(groupId);
                    });
                }
                else {
                    this.btnAddGroupContainer.hide();
                }
                if (this.filterTypes.contains("ROLES")) {
                    this.btnAddRole.onClick(function (evt, dropDownItemId) {
                        var roleId = dropDownItemId.split("_")[1];
                        _this.viewVisibilityList.addFilterItem(roleId);
                    });
                }
                else {
                    this.btnAddGroupContainer.hide();
                }
                if (this.filterTypes.contains("CLIENTS")) {
                    this.btnAddClient.onClick(function (evt, dropDownItemId) {
                        var clientId = dropDownItemId.split("_")[1];
                        _this.viewVisibilityList.addFilterItem(clientId);
                    });
                }
                else {
                    this.btnAddClient.hide();
                }
                this.btnDeleteVisibilityItem.onClick(function (evt) {
                    _this.viewVisibilityList.deleteSelectedFilterItem();
                });
                this.btnEditVisibilityOK.onClick(function (evt) { _this.btnOK_onClick(evt); });
            }
            EditVisibilityDialog.prototype.setItem = function (targetObject) {
                this.targetObject = targetObject;
                this.visibility = $.extend(true, {}, targetObject.visibility);
                this.viewVisibilityList.setVisibility(this.visibility);
                if (this.filterTypes.contains("DISPLAYED")) {
                    this.lblNotDisplayed.show();
                    this.chkNotDisplayed.setChecked(this.visibility.notDisplayed ? true : false);
                }
                else {
                    this.lblNotDisplayed.hide();
                }
                this.updateControls();
            };
            EditVisibilityDialog.prototype.btnOK_onClick = function (evt) {
                if (this.filterTypes.contains("DISPLAYED")) {
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
            };
            EditVisibilityDialog.prototype.updateControls = function () {
                this.btnAddGroup.setEnabled(this.viewVisibilityList.canAddGroupFilter());
                this.btnAddRole.setEnabled(this.viewVisibilityList.canAddRoleFilter());
                this.btnAddClient.setEnabled(this.viewVisibilityList.canAddClientFilter());
                this.btnDeleteVisibilityItem.setEnabled(this.viewVisibilityList.canDeleteFilterItem());
            };
            return EditVisibilityDialog;
        }(controls.Modal));
        admin.EditVisibilityDialog = EditVisibilityDialog;
        // Custom control to display a set of visibility rules in a list
        var VisibilityRuleList = (function (_super) {
            __extends(VisibilityRuleList, _super);
            // elementId of the <ul> used by this control
            // (this <ul> sits inside a <div> with overflow:scroll, but we can ignore that)
            function VisibilityRuleList(elementId, filterTypes) {
                _super.call(this, elementId);
                this.kVisibleToGroups = "visibleToGroups";
                this.kHiddenFromGroups = "hiddenFromGroups";
                this.kVisibleToRoles = "visibleToRoles";
                this.kHiddenFromRoles = "hiddenFromRoles";
                this.kVisibleToClients = "visibleToClients";
                this.kHiddenFromClients = "hiddenFromClients";
                this.selectionChangedHandler = null;
                this.selectedFilter = null;
                this.selectedFilterItem = -1;
                this.filterTypes = filterTypes;
            }
            VisibilityRuleList.prototype.setVisibility = function (visibility) {
                this.visibility = visibility;
                if (!this.filterTypes.contains("CLIENTS")) {
                    this.visibility.visibleToClients = [];
                    this.visibility.hiddenFromClients = [];
                }
                if (!this.filterTypes.contains("GROUPS")) {
                    this.visibility.visibleToGroups = [];
                    this.visibility.hiddenFromGroups = [];
                }
                if (!this.filterTypes.contains("ROLES")) {
                    this.visibility.visibleToRoles = [];
                    this.visibility.hiddenFromRoles = [];
                }
                // Strip out any values that no longer refer to valid groups,roles or clients
                if (this.visibility.visibleToGroups) {
                    this.visibility.visibleToGroups = this.visibility.visibleToGroups.filter(function (group) { return typeof groupLookup[group] !== "undefined"; });
                }
                if (this.visibility.hiddenFromGroups) {
                    this.visibility.hiddenFromGroups = this.visibility.hiddenFromGroups.filter(function (group) { return typeof groupLookup[group] !== "undefined"; });
                }
                if (this.visibility.visibleToRoles) {
                    this.visibility.visibleToRoles = this.visibility.visibleToRoles.filter(function (role) { return typeof roleLookup[role] !== "undefined"; });
                }
                if (this.visibility.hiddenFromRoles) {
                    this.visibility.hiddenFromRoles = this.visibility.hiddenFromRoles.filter(function (role) { return typeof roleLookup[role] !== "undefined"; });
                }
                if (this.visibility.visibleToClients) {
                    this.visibility.visibleToClients = this.visibility.visibleToClients.filter(function (client) { return typeof clientLookup[client] !== "undefined"; });
                }
                if (this.visibility.hiddenFromClients) {
                    this.visibility.hiddenFromClients = this.visibility.hiddenFromClients.filter(function (client) { return typeof clientLookup[client] !== "undefined"; });
                }
                this.redraw();
            };
            VisibilityRuleList.prototype.onSelectionChanged = function (changeHandler) {
                this.selectionChangedHandler = changeHandler;
            };
            VisibilityRuleList.prototype.canAddGroupFilter = function () {
                return this.selectedFilter == this.kVisibleToGroups || this.selectedFilter == this.kHiddenFromGroups;
            };
            VisibilityRuleList.prototype.canAddRoleFilter = function () {
                return this.selectedFilter == this.kVisibleToRoles || this.selectedFilter == this.kHiddenFromRoles;
            };
            VisibilityRuleList.prototype.canAddClientFilter = function () {
                return this.selectedFilter == this.kVisibleToClients || this.selectedFilter == this.kHiddenFromClients;
            };
            VisibilityRuleList.prototype.addFilterItem = function (filterItem) {
                var filter = this.visibility[this.selectedFilter];
                if (!filter) {
                    filter = this.visibility[this.selectedFilter] = [];
                }
                filter.push(filterItem);
                this.redraw();
            };
            VisibilityRuleList.prototype.canDeleteFilterItem = function () {
                return this.selectedFilterItem != -1;
            };
            VisibilityRuleList.prototype.deleteSelectedFilterItem = function () {
                var selectedFilterItems = this.visibility[this.selectedFilter];
                if (selectedFilterItems != null) {
                    if (selectedFilterItems.length > 1) {
                        selectedFilterItems.splice(this.selectedFilterItem, 1);
                    }
                    else {
                        this.visibility[this.selectedFilter] = null;
                    }
                }
                this.redraw();
            };
            VisibilityRuleList.prototype.redraw = function () {
                var _this = this;
                this.$element.empty();
                var html = "";
                html += "<ul class='filters'>";
                if (this.filterTypes.contains("CLIENTS")) {
                    html += " <li id='filter_visibleToClients' class='filterHeader'>Only visible to Clients</li>";
                    html += this.buildFilterList(this.visibility.visibleToClients, clientLookup, "visibleToClients", "(All)");
                    html += " <li id='filter_hiddenFromClients' class='filterHeader'>Not visible to Clients</li>";
                    html += this.buildFilterList(this.visibility.hiddenFromClients, clientLookup, "hiddenFromClients", "(None)");
                }
                if (this.filterTypes.contains("GROUPS")) {
                    html += " <li id='filter_visibleToGroups' class='filterHeader'>Only visible to Groups</li>";
                    html += this.buildFilterList(this.visibility.visibleToGroups, groupLookup, "visibleToGroups", "(All)");
                    html += " <li id='filter_hiddenFromGroups' class='filterHeader'>Not visible to Groups</li>";
                    html += this.buildFilterList(this.visibility.hiddenFromGroups, groupLookup, "hiddenFromGroups", "(None)");
                }
                if (this.filterTypes.contains("ROLES")) {
                    html += " <li id='filter_visibleToRoles' class='filterHeader'>Only visible to Roles</li>";
                    html += this.buildFilterList(this.visibility.visibleToRoles, roleLookup, "visibleToRoles", "(All)");
                    html += " <li id='filter_hiddenFromRoles' class='filterHeader'>Not visible to Roles</li>";
                    html += this.buildFilterList(this.visibility.hiddenFromRoles, roleLookup, "hiddenFromRoles", "(None)");
                }
                html += "</ul>";
                this.$element.html(html);
                this.$element.find("li").on("click", function (evt) {
                    _this.onListItemClick(evt);
                });
            };
            VisibilityRuleList.prototype.buildFilterList = function (filterItems, idLookup, rule, emptyMessage) {
                if ((filterItems != null) && (filterItems.length > 0)) {
                    var html = "";
                    filterItems.forEach(function (filterItem, i) {
                        if (idLookup)
                            filterItem = idLookup[filterItem];
                        html += "<li id='filter_" + rule + "_" + i + "'>" + HtmlUtil.escapeHtml(filterItem) + "</li>";
                    });
                    return html;
                }
                else {
                    return "<li id='filter_" + rule + "_-1' class='emptyMessage'>" + HtmlUtil.escapeHtml(emptyMessage) + "</li>";
                }
            };
            VisibilityRuleList.prototype.onListItemClick = function (evt) {
                this.$element.find("li").removeClass("selected");
                $(evt.target).addClass("selected");
                var idFields = $(evt.target).get(0).id.split("_");
                this.selectedFilter = idFields[1];
                this.selectedFilterItem = idFields.length > 2 ? Number(idFields[2]) : -1;
                this.fireSelectionChanged();
            };
            VisibilityRuleList.prototype.fireSelectionChanged = function () {
                if (this.selectionChangedHandler != null) {
                    this.selectionChangedHandler({});
                }
            };
            return VisibilityRuleList;
        }(Control));
    })(admin = ui.admin || (ui.admin = {}));
})(ui || (ui = {}));
