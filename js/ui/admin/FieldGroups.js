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
        var Button = controls.Button;
        var TextBox = controls.TextBox;
        var DropDownList = controls.DropDownList;
        var CheckBox = controls.CheckBox;
        var MessageBox = controls.MessageBox;
        var $catdv = catdv.RestApi;
        var VisibilityUtil = catdv.VisibilityUtil;
        var NavbarLoginMenu = ui.panels.NavbarLoginMenu;
        var FieldGroupsForm = (function () {
            function FieldGroupsForm() {
                var _this = this;
                this.chkClipsOnly = new CheckBox("chkClipsOnly");
                this.txtSearch = new TextBox("txtSearch");
                this.btnAddFieldGroup = new Button("btnAddFieldGroup");
                this.btnDeleteFieldGroup = new Button("btnDeleteFieldGroup");
                this.editFieldGroupDialog = new EditFieldGroupDialog("editFieldGroupDialog");
                this.editVisibilityDialog = new admin.EditVisibilityDialog("editVisibilityDialog", "field");
                this.navbarLoginMenu = new NavbarLoginMenu("navbarLoginMenu");
                this.fieldGroupsTable = new DataTable("fieldGroupsTable", {
                    columns: [
                        {
                            title: "Name",
                            dataProp: "name",
                            renderer: function (obj, val) {
                                if (obj.ID) {
                                    return "<a href='fields.jsp?fieldGroupID=" + obj.ID + "'>" + HtmlUtil.escapeHtml(obj.name) + "</a>";
                                }
                                else {
                                    return "<a href='fields.jsp'><em>" + HtmlUtil.escapeHtml(obj.name) + "</em></a>";
                                }
                            }
                        },
                        { title: "Description", dataProp: "description" },
                        {
                            title: "Type",
                            dataProp: "objectClass",
                            renderer: function (obj, val) {
                                switch (val) {
                                    case "catalog":
                                        return "Catalog User Fields";
                                    case "clip":
                                        return "Clip User Fields";
                                    case "media":
                                        return "Media Metadata Fields";
                                    case "importSource":
                                        return "Source Metadata Fields";
                                    default:
                                        return val ? (val.charAt(0).toUpperCase() + val.substring(1) + " User Fields") : "";
                                }
                            }
                        },
                        {
                            title: "Origin",
                            dataProp: "originType",
                            renderer: function (obj, val) {
                                var origin;
                                switch (val) {
                                    case "user-defined":
                                        origin = "User Defined";
                                        break;
                                    case "file-metadata":
                                        origin = "File Metadata";
                                        break;
                                    case "plugin":
                                        origin = "Plugin";
                                        break;
                                    case "fieldset":
                                        origin = "Field Set";
                                        break;
                                    default:
                                        origin = val || "";
                                        break;
                                }
                                return origin + (obj.originInfo ? " (" + obj.originInfo + ")" : "");
                            }
                        },
                        {
                            title: "Visibility",
                            dataProp: "visibility",
                            renderer: function (obj, val) {
                                return "<a href='javascript:$page.editVisibility(" + obj.ID + ")'>" + VisibilityUtil.visibilitySummary(val) + "</a>";
                            }
                        },
                        {
                            title: "Edit",
                            dataProp: "ID",
                            renderer: function (obj, val) {
                                return obj.ID ? "<a href='javascript:$page.editFieldGroup(" + obj.ID + ")'>Edit Details</a>" : "";
                            }
                        }
                    ],
                    simpleDataSource: new SimpleServerDataSource(function (params, callback) {
                        $catdv.getFieldGroups(params, function (fieldGroups) {
                            var allFieldsGroup = {
                                ID: null,
                                name: "All User Fields",
                                description: "View all user-defined field definitions"
                            };
                            callback([allFieldsGroup].concat(fieldGroups));
                        });
                    })
                });
                this.btnAddFieldGroup.onClick(function (evt) {
                    _this.editFieldGroupDialog.setFieldGroup({ ID: null, objectClass: "clip", isBuiltIn: false });
                    _this.editFieldGroupDialog.onOK(function () {
                        _this.fieldGroupsTable.reload();
                    });
                    _this.editFieldGroupDialog.show();
                });
                this.btnDeleteFieldGroup.onClick(function (evt) {
                    var selectedItem = _this.fieldGroupsTable.getSelectedItem();
                    MessageBox.confirm("Are you sure you want to delete '" + selectedItem.name + "'", function () {
                        $catdv.deleteFieldGroup(selectedItem.ID, function () {
                            _this.fieldGroupsTable.reload();
                        });
                    });
                });
                this.txtSearch.onInput(function (evt) {
                    var searchText = _this.txtSearch.getText();
                    if ((searchText.length == 0) || (searchText.length > 2)) {
                        _this.fieldGroupsTable.reload();
                    }
                });
                this.chkClipsOnly.onChanged(function (evt) { return _this.fieldGroupsTable.reload(); });
            }
            FieldGroupsForm.prototype.editVisibility = function (fieldGroupID) {
                var _this = this;
                var selectedFieldGroup = this.fieldGroupsTable.findItem(function (o) { return o.ID == fieldGroupID; });
                this.editVisibilityDialog.setItem(selectedFieldGroup);
                this.editVisibilityDialog.onOK(function (updatedFieldGroup) {
                    $catdv.saveFieldGroup(updatedFieldGroup, function () {
                        _this.fieldGroupsTable.reload();
                    });
                });
                this.editVisibilityDialog.show();
            };
            FieldGroupsForm.prototype.editFieldGroup = function (fieldGroupID) {
                var _this = this;
                var selectedField = this.fieldGroupsTable.findItem(function (o) { return o.ID == fieldGroupID; });
                this.editFieldGroupDialog.setFieldGroup(selectedField);
                this.editFieldGroupDialog.onOK(function () {
                    _this.fieldGroupsTable.reload();
                });
                this.editFieldGroupDialog.show();
            };
            return FieldGroupsForm;
        }());
        admin.FieldGroupsForm = FieldGroupsForm;
        var EditFieldGroupDialog = (function (_super) {
            __extends(EditFieldGroupDialog, _super);
            function EditFieldGroupDialog(elementId) {
                var _this = this;
                _super.call(this, elementId);
                this.txtName = new TextBox("txtName");
                this.txtDescription = new TextBox("txtDescription");
                this.txtIdentiferPrefix = new TextBox("txtIdentiferPrefix");
                this.lstObjectClass = new DropDownList("lstObjectClass");
                this.btnNewFieldOK = new Button("btnEditFieldOK");
                this.btnNewFieldOK.onClick(function (evt) {
                    _this.btnOK_onClick(evt);
                });
            }
            EditFieldGroupDialog.prototype.setFieldGroup = function (fieldGroup) {
                this.fieldGroup = fieldGroup;
                this.txtName.setText(fieldGroup.name);
                this.txtDescription.setText(fieldGroup.description);
                this.txtIdentiferPrefix.setText(fieldGroup.identifierPrefix);
                this.lstObjectClass.setSelectedValue(fieldGroup.objectClass);
                this.lstObjectClass.setEnabled(!this.fieldGroup.ID);
            };
            EditFieldGroupDialog.prototype.btnOK_onClick = function (evt) {
                var _this = this;
                var permissions = [];
                var fieldGroup = {
                    ID: this.fieldGroup.ID,
                    name: this.txtName.getText(),
                    description: this.txtDescription.getText(),
                    identifierPrefix: this.txtIdentiferPrefix.getText(),
                    objectClass: this.lstObjectClass.getSelectedValue(),
                };
                $catdv.saveFieldGroup(fieldGroup, function () {
                    _this.close(true);
                });
            };
            return EditFieldGroupDialog;
        }(controls.Modal));
    })(admin = ui.admin || (ui.admin = {}));
})(ui || (ui = {}));
