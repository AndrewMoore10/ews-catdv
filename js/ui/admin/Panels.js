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
        var CheckBox = controls.CheckBox;
        var ListBox = controls.ListBox;
        var $catdv = catdv.RestApi;
        var VisibilityUtil = catdv.VisibilityUtil;
        var PanelsForm = (function (_super) {
            __extends(PanelsForm, _super);
            function PanelsForm() {
                var _this = this;
                _super.call(this, "panel");
                this.viewsTable = new DataTable("panelsTable", {
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
                            title: "Panel Set",
                            dataProp: "viewsetName",
                            renderer: function (obj, val) {
                                return obj.viewset ? "<a href='javascript:$page.editViewSet(" + obj.ID + ")'>" + HtmlUtil.escapeHtml(val) + "</a>" : "";
                            }
                        },
                        {
                            title: "Panel Name",
                            dataProp: "viewName",
                            renderer: function (obj, val) {
                                return obj.view ? "<a href='javascript:$page.editView(" + obj.ID + ")'>" + HtmlUtil.escapeHtml(val) + "</a>" : "";
                            }
                        },
                        {
                            title: "Description",
                            dataProp: "description"
                        },
                        {
                            title: "Visibility",
                            dataProp: "visibility",
                            renderer: function (obj, val) {
                                return "<a href='javascript:$page.editVisibility(" + obj.ID + ")'>" + VisibilityUtil.visibilitySummary(val) + "</a>";
                            }
                        }
                    ],
                    hideRow: function (obj) {
                        return obj.view && _this.viewSetIsCollapsed[obj.view.panelSetID];
                    },
                    simpleDataSource: new SimpleServerDataSource(function (params, callback) {
                        $catdv.getPanelSetsWithPanels(function (panelsets) {
                            // Need to build combined list that has each PanelSet then its components Panels
                            var listItems = [];
                            panelsets.forEach(function (panelset) {
                                listItems.push(new admin.ViewListItem(panelset, null));
                                if (panelset.panels) {
                                    panelset.panels.forEach(function (panel) {
                                        listItems.push(new admin.ViewListItem(null, panel));
                                    });
                                }
                            });
                            _this.setModel(panelsets, listItems);
                            callback(listItems);
                        });
                    })
                });
                this.viewsTable.onSelectionChanged(function (evt) { return _super.prototype.updateButtons.call(_this); });
                this.editViewSetDialog = new EditPanelSetDialog("editViewSetDialog");
                this.editViewDialog = new EditPanelDialog("editPanelDialog");
            }
            return PanelsForm;
        }(admin.BaseViewsForm));
        admin.PanelsForm = PanelsForm;
        var EditPanelSetDialog = (function (_super) {
            __extends(EditPanelSetDialog, _super);
            function EditPanelSetDialog(elementId) {
                _super.call(this, elementId, "panel");
            }
            return EditPanelSetDialog;
        }(admin.BaseEditViewSetDialog));
        var EditPanelDialog = (function (_super) {
            __extends(EditPanelDialog, _super);
            function EditPanelDialog(elementId) {
                var _this = this;
                _super.call(this, elementId, "panel");
                this.lstViewType = new ListBox("lstViewType");
                this.chkReadOnly = new CheckBox("chkReadOnly");
                this.chkSpanTwoCols = new CheckBox("chkSpanTwoCols");
                this.chkHideIfBlank = new CheckBox("chkHideIfBlank");
                this.chkMultiline = new CheckBox("chkMultiline");
                this.divEditFields = new Element("editFieldsSection");
                this.lstViewType.onChanged(function () { _this.updateOptionControls(); });
                this.chkReadOnly.onChanged(function (evt) { _this.selectedViewField().options.readOnly = _this.chkReadOnly.isChecked(); });
                this.chkSpanTwoCols.onChanged(function (evt) { _this.selectedViewField().options.spanTwoColumns = _this.chkSpanTwoCols.isChecked(); });
                this.chkHideIfBlank.onChanged(function (evt) { _this.selectedViewField().options.hideIfBlank = _this.chkHideIfBlank.isChecked(); });
                this.chkMultiline.onChanged(function (evt) { _this.selectedViewField().options.multiline = _this.chkMultiline.isChecked(); });
            }
            EditPanelDialog.prototype.setView = function (viewSet, viewDef, allViewDefs) {
                _super.prototype.setView.call(this, viewSet, viewDef, allViewDefs);
                this.lstViewType.setSelectedValue(viewDef ? viewDef.type : "normal");
                this.updateOptionControls();
            };
            EditPanelDialog.prototype.updateOptionControls = function () {
                this.divEditFields.show(this.lstViewType.getSelectedValue() != "builtin");
            };
            EditPanelDialog.prototype.updateControls = function () {
                _super.prototype.updateControls.call(this);
                if (this.isViewFieldSelected()) {
                    var panelField = this.selectedViewField();
                    panelField.options = panelField.options || {};
                    this.chkReadOnly.setEnabled(true);
                    this.chkReadOnly.setChecked(panelField.options.readOnly);
                    this.chkSpanTwoCols.setEnabled(true);
                    this.chkSpanTwoCols.setChecked(panelField.options.spanTwoColumns);
                    this.chkHideIfBlank.setEnabled(true);
                    this.chkHideIfBlank.setChecked(panelField.options.hideIfBlank);
                    this.chkMultiline.setEnabled(true);
                    this.chkMultiline.setChecked(panelField.options.multiline);
                }
                else {
                    this.chkReadOnly.setEnabled(false);
                    this.chkReadOnly.setChecked(false);
                    this.chkSpanTwoCols.setEnabled(false);
                    this.chkSpanTwoCols.setChecked(false);
                    this.chkHideIfBlank.setEnabled(false);
                    this.chkHideIfBlank.setChecked(false);
                    this.chkMultiline.setEnabled(false);
                    this.chkMultiline.setChecked(false);
                }
            };
            EditPanelDialog.prototype.saveDefinition = function (definitionID, name, description, order, fields) {
                var _this = this;
                var panelDef = {
                    ID: definitionID,
                    panelSetID: this.viewSet.ID,
                    name: name,
                    description: description,
                    type: this.lstViewType.getSelectedValue(),
                    order: order,
                    fields: fields
                };
                $catdv.savePanel(panelDef, function () {
                    _this.close(true);
                });
            };
            return EditPanelDialog;
        }(admin.BaseEditViewDialog));
    })(admin = ui.admin || (ui.admin = {}));
})(ui || (ui = {}));
