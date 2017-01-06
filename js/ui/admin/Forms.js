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
        var SimpleServerDataSource = controls.SimpleServerDataSource;
        var DataTable = controls.DataTable;
        var SelectionMode = controls.SelectionMode;
        var CheckBox = controls.CheckBox;
        var $catdv = catdv.RestApi;
        var VisibilityUtil = catdv.VisibilityUtil;
        var FormsForm = (function (_super) {
            __extends(FormsForm, _super);
            function FormsForm() {
                var _this = this;
                _super.call(this, "form");
                this.viewsTable = new DataTable("formsTable", {
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
                            title: "Form Set",
                            dataProp: "viewsetName"
                        },
                        {
                            title: "Form Name",
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
                                return obj.view ? "<a href='javascript:$page.editVisibility(" + obj.ID + ")'>" + VisibilityUtil.visibilitySummary(val) + "</a>" : "";
                            }
                        }
                    ],
                    hideRow: function (obj) {
                        return obj.view && _this.viewSetIsCollapsed[obj.view.formSetID];
                    },
                    simpleDataSource: new SimpleServerDataSource(function (params, callback) {
                        $catdv.getFormSetsWithForms(function (formsets) {
                            // Need to build combined list that has each FormSet then its components Forms
                            var listItems = [];
                            formsets.forEach(function (formset) {
                                listItems.push(new admin.ViewListItem(formset, null));
                                if (formset.forms) {
                                    formset.forms.forEach(function (form) {
                                        listItems.push(new admin.ViewListItem(null, form));
                                    });
                                }
                            });
                            _this.setModel(formsets, listItems);
                            callback(listItems);
                        });
                    })
                });
                this.viewsTable.onSelectionChanged(function (evt) { return _super.prototype.updateButtons.call(_this); });
                this.editViewSetDialog = null;
                this.editViewDialog = new EditFormDialog("editFormDialog");
            }
            return FormsForm;
        }(admin.BaseViewsForm));
        admin.FormsForm = FormsForm;
        var EditFormDialog = (function (_super) {
            __extends(EditFormDialog, _super);
            function EditFormDialog(elementId) {
                var _this = this;
                _super.call(this, elementId, "form");
                this.chkMultiline = new CheckBox("chkMultiline");
                this.chkMandatory = new CheckBox("chkMandatory");
                this.chkMultiline.onChanged(function (evt) { _this.selectedViewField().options.multiline = _this.chkMultiline.isChecked(); });
                this.chkMandatory.onChanged(function (evt) { _this.selectedViewField().options.mandatory = _this.chkMandatory.isChecked(); });
            }
            EditFormDialog.prototype.setView = function (viewSet, viewDef, allViewDefs) {
                _super.prototype.setView.call(this, viewSet, viewDef, allViewDefs);
            };
            EditFormDialog.prototype.getDefaultIncludes = function () {
                var formType = this.viewSet.formType;
                if (formType == "search") {
                    return "onlySimpleSearchable";
                }
                else if (formType == "upload") {
                    return "onlyEditable";
                }
                else if (formType == "filter") {
                    return "onlyFilterable";
                }
                else {
                    return "";
                }
            };
            EditFormDialog.prototype.updateControls = function () {
                _super.prototype.updateControls.call(this);
                if (this.viewSet.formType == "search") {
                    $("#chkMultilineContainer").show();
                    $("#chkMandatoryContainer").hide();
                }
                else if (this.viewSet.formType == "filter") {
                    $("#chkMultilineContainer").hide();
                    $("#chkMandatoryContainer").hide();
                }
                else {
                    $("#chkMultilineContainer").show();
                    $("#chkMandatoryContainer").show();
                }
                if (this.isViewFieldSelected()) {
                    var formField = this.selectedViewField();
                    formField.options = formField.options || {};
                    this.chkMultiline.setEnabled(true);
                    this.chkMultiline.setChecked(formField.options.multiline);
                    this.chkMandatory.setEnabled(true);
                    this.chkMandatory.setChecked(formField.options.mandatory);
                }
                else {
                    this.chkMultiline.setEnabled(false);
                    this.chkMultiline.setChecked(false);
                    this.chkMandatory.setEnabled(false);
                    this.chkMandatory.setChecked(false);
                }
            };
            EditFormDialog.prototype.saveDefinition = function (definitionID, name, description, order, fields) {
                var _this = this;
                var formDef = {
                    ID: definitionID,
                    formSetID: this.viewSet.ID,
                    name: name,
                    description: description,
                    type: "normal",
                    order: order,
                    fields: fields
                };
                $catdv.saveForm(formDef, function () {
                    _this.close(true);
                });
            };
            return EditFormDialog;
        }(admin.BaseEditViewDialog));
    })(admin = ui.admin || (ui.admin = {}));
})(ui || (ui = {}));
