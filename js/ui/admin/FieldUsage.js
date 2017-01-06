var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var ui;
(function (ui) {
    var admin;
    (function (admin) {
        var SimpleServerDataSource = controls.SimpleServerDataSource;
        var DataTable = controls.DataTable;
        var SelectionMode = controls.SelectionMode;
        var Label = controls.Label;
        var Button = controls.Button;
        var TextBox = controls.TextBox;
        var MessageBox = controls.MessageBox;
        var $catdv = catdv.RestApi;
        var FieldUsageForm = (function () {
            function FieldUsageForm() {
                var _this = this;
                this.lblPageHeader = new Label("lblPageHeader");
                this.btnDeMergeField = new Button("btnDeMergeField");
                this.deMergeFieldDialog = new DeMergeFieldDialog("deMergeFieldDialog");
                this.fieldDefID = Number($.urlParam("id"));
                $catdv.getFieldDefinition(this.fieldDefID, function (fieldDef) {
                    _this.fieldDef = fieldDef;
                    _this.lblPageHeader.setText("Field '" + fieldDef.name + "' Usage");
                    _this.fieldUsageTable = new DataTable("fieldUsageTable", {
                        selectionMode: SelectionMode.Multi,
                        columns: [
                            { title: "Group", dataProp: "groupName" },
                            { title: "Number of Clips with Field Set", dataProp: "numClips" },
                            {
                                title: "Sample Values",
                                dataProp: "values",
                                renderer: function (obj, val) {
                                    return val.join("<br/>");
                                }
                            },
                        ],
                        simpleDataSource: new SimpleServerDataSource(function (params, callback) {
                            $catdv.getFieldUsage(_this.fieldDefID, params, function (data) {
                                callback(data);
                            });
                        })
                    });
                    _this.btnDeMergeField.onClick(function (evt) { return _this.deMergeFieldDialog.show(); });
                    _this.deMergeFieldDialog.onOK(function (name) {
                        var groupIDs = _this.fieldUsageTable.getSelectedItems().map(function (item) { return item.groupID; });
                        var newFieldDef = {
                            fieldGroupID: _this.fieldDef.fieldGroupID,
                            memberOf: "clip",
                            fieldType: _this.fieldDef.fieldType,
                            identifier: name.toLowerCase().replaceAll(" ", "."),
                            name: name,
                            isEditable: _this.fieldDef.isEditable,
                            isMandatory: _this.fieldDef.isMandatory,
                            origin: ("demerged-" + _this.fieldDef.identifier + "-[" + groupIDs.join(",") + "]")
                        };
                        $catdv.saveField(newFieldDef, function (newFieldDefID) {
                            $("body").css({ "cursor": "wait" });
                            $catdv.demergeFields(_this.fieldDefID, newFieldDefID, groupIDs, function () {
                                MessageBox.showMessage("New field '" + newFieldDef.name + "' created");
                            }, function (status, error) {
                                $("body").css({ "cursor": "initial" });
                                MessageBox.alert(error);
                            });
                        }, function (status, error) {
                            MessageBox.alert(error);
                        });
                    });
                });
            }
            return FieldUsageForm;
        }());
        admin.FieldUsageForm = FieldUsageForm;
        var DeMergeFieldDialog = (function (_super) {
            __extends(DeMergeFieldDialog, _super);
            function DeMergeFieldDialog(elementId) {
                var _this = this;
                _super.call(this, elementId);
                this.txtName = new TextBox("txtName");
                this.btnDeMergeDialogOK = new Button("btnDeMergeDialogOK");
                this.btnDeMergeDialogOK.onClick(function (evt) {
                    _this.close(true, _this.txtName.getText());
                });
            }
            DeMergeFieldDialog.prototype.show = function () {
                _super.prototype.show.call(this);
                this.txtName.setText("");
            };
            return DeMergeFieldDialog;
        }(controls.Modal));
    })(admin = ui.admin || (ui.admin = {}));
})(ui || (ui = {}));
