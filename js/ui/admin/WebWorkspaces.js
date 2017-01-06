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
        var DataTable = controls.DataTable;
        var Button = controls.Button;
        var TextBox = controls.TextBox;
        var SimpleServerDataSource = controls.SimpleServerDataSource;
        var MessageBox = controls.MessageBox;
        var $catdv = catdv.RestApi;
        var VisibilityUtil = catdv.VisibilityUtil;
        var WebWorkspacesPage = (function () {
            function WebWorkspacesPage() {
                var _this = this;
                this.btnAddSettings = new Button("btnAddSettings");
                this.btnDelete = new Button("btnDelete");
                this.btnMoveUp = new Button("btnMoveUp");
                this.btnMoveDown = new Button("btnMoveDown");
                this.btnThemes = new Button("btnThemes");
                this.editWebWorkspaceDialog = new EditWebWorkspaceDialog("editWebWorkspaceDialog");
                this.editVisibilityDialog = new admin.EditVisibilityDialog("editVisibilityDialog", "webSettings");
                this.webSettingsList = [];
                this.listItemLookup = {};
                this.settingsTable = new DataTable("uiSettingsTable", {
                    columns: [
                        {
                            title: "Workspace",
                            dataProp: "name",
                            renderer: function (obj, val) {
                                return "<a href='javascript:$page.editWebWorkspace(" + obj.ID + ")' title='ID:" + obj.ID + "'>" + HtmlUtil.escapeHtml(obj.name) + "</a>";
                            }
                        },
                        {
                            title: "Applies To",
                            dataProp: "visibility",
                            renderer: function (obj, val) {
                                return "<a href='javascript:$page.editVisibility(" + obj.ID + ")'>" + VisibilityUtil.visibilitySummary(val) + "</a>";
                            }
                        }
                    ],
                    simpleDataSource: new SimpleServerDataSource(function (params, callback) {
                        $catdv.getWebWorkspaces(function (data) {
                            _this.webSettingsList = data;
                            _this.listItemLookup = {};
                            data.forEach(function (webSettings) {
                                _this.listItemLookup[webSettings.ID] = webSettings;
                            });
                            callback(data);
                        });
                    })
                });
                this.editWebWorkspaceDialog.onOK(function () {
                    _this.settingsTable.reload();
                });
                this.btnAddSettings.onClick(function (evt) {
                    _this.editWebWorkspaceDialog.setWebWorkspace(null);
                    _this.editWebWorkspaceDialog.show();
                });
                this.btnMoveUp.onClick(function (evt) {
                    _this.moveSelectedItem("up");
                });
                this.btnMoveDown.onClick(function (evt) {
                    _this.moveSelectedItem("down");
                });
                this.btnDelete.onClick(function (evt) {
                    var selectedWebWorkspace = _this.settingsTable.getSelectedItem();
                    MessageBox.confirm("Are you sure you want to delete '" + selectedWebWorkspace.name + "'", function () {
                        $catdv.deleteWebWorkspace(selectedWebWorkspace.ID, function (reply) {
                            _this.settingsTable.reload();
                        });
                    });
                });
                this.btnThemes.onClick(function (evt) {
                    document.location.href = "themes.jsp";
                });
            }
            WebWorkspacesPage.prototype.editWebWorkspace = function (settingsID) {
                var _this = this;
                this.editWebWorkspaceDialog.setWebWorkspace(this.listItemLookup[settingsID]);
                this.editWebWorkspaceDialog.onOK(function () {
                    _this.settingsTable.reload();
                });
                this.editWebWorkspaceDialog.show();
            };
            WebWorkspacesPage.prototype.editVisibility = function (itemID) {
                var _this = this;
                var selectedItem = this.listItemLookup[itemID];
                this.editVisibilityDialog.setItem(selectedItem);
                this.editVisibilityDialog.onOK(function (updatedItem) {
                    $catdv.saveWebWorkspace(updatedItem, function () {
                        _this.settingsTable.reload();
                    });
                });
                this.editVisibilityDialog.show();
            };
            WebWorkspacesPage.prototype.moveSelectedItem = function (direction) {
                var _this = this;
                var selectedItem = this.settingsTable.getSelectedItem();
                var selectedIndex = -1;
                for (var vsi = 0; vsi < this.webSettingsList.length; vsi++) {
                    if (this.webSettingsList[vsi].ID == selectedItem.ID) {
                        selectedIndex = vsi;
                        break;
                    }
                }
                var toSave = null;
                if ((direction == "up") && (selectedIndex > 0)) {
                    var prevWebWorkspace = this.webSettingsList[selectedIndex - 1];
                    var tmp = prevWebWorkspace.pos;
                    prevWebWorkspace.pos = (tmp != selectedItem.pos) ? selectedItem.pos : selectedItem.pos + 1;
                    selectedItem.pos = tmp;
                    toSave = [prevWebWorkspace, selectedItem];
                }
                else if ((direction == "down") && (selectedIndex < (this.webSettingsList.length - 1))) {
                    var nextWebWorkspace = this.webSettingsList[selectedIndex + 1];
                    var tmp = nextWebWorkspace.pos;
                    nextWebWorkspace.pos = selectedItem.pos;
                    selectedItem.pos = (tmp != selectedItem.pos) ? tmp : tmp + 1;
                    toSave = [nextWebWorkspace, selectedItem];
                }
                if (toSave) {
                    $catdv.saveWebWorkspace({ ID: toSave[0].ID, pos: toSave[0].pos }, function () {
                        $catdv.saveWebWorkspace({ ID: toSave[1].ID, pos: toSave[1].pos }, function () {
                            _this.settingsTable.reload();
                        });
                    });
                }
            };
            return WebWorkspacesPage;
        }());
        admin.WebWorkspacesPage = WebWorkspacesPage;
        var EditWebWorkspaceDialog = (function (_super) {
            __extends(EditWebWorkspaceDialog, _super);
            function EditWebWorkspaceDialog(elementId) {
                var _this = this;
                _super.call(this, elementId);
                this.txtWorkspaceName = new TextBox("txtWorkspaceName");
                this.workspaceSettingsTable = new Element("workspaceSettingsTable");
                this.btnNewWebWorkspaceOK = new Button("btnEditWebWorkspaceOK");
                this.schema = null;
                this.btnNewWebWorkspaceOK.onClick(function (evt) {
                    _this.btnOK_onClick(evt);
                });
            }
            EditWebWorkspaceDialog.prototype.setWebWorkspace = function (webSettings) {
                var _this = this;
                this.settingsID = webSettings ? webSettings.ID : null;
                this.txtWorkspaceName.setText(webSettings ? webSettings.name : "");
                $catdv.getWebWorkspaceSchema(function (schema) {
                    _this.schema = schema;
                    // Create default set of web settings if none passed in
                    if (!webSettings) {
                        webSettings = { ID: null, name: "", settings: {}, visibility: null };
                        schema.forEach(function (item) {
                            webSettings.settings[item.name] = item.defaultValue;
                        });
                    }
                    _this.workspaceSettingsTable.$element.empty();
                    var lastSection = "";
                    schema.forEach(function (item) {
                        var $tr = $("<tr>").appendTo(_this.workspaceSettingsTable.$element);
                        $("<th>" + ((item.section != lastSection) ? item.section : "") + "</th>").appendTo($tr);
                        var $td = $("<td>").appendTo($tr);
                        if (item.inputType == "text") {
                            $("<input type='text' id='setting_" + item.name + "'  class='editable' value='" + HtmlUtil.escapeHtml(webSettings.settings[item.name] || "") + "'>").appendTo($td);
                        }
                        else if (item.inputType == "textarea") {
                            $("<textarea id='setting_" + item.name + "' rows='6'  class='editable'>" + HtmlUtil.escapeHtml(webSettings.settings[item.name] || "") + "</textarea>").appendTo($td);
                        }
                        else if (item.inputType == "checkbox") {
                            var checked = webSettings.settings[item.name] ? " checked " : "";
                            $("<label><input type='checkbox' id='setting_" + item.name + "' " + checked + ">" + HtmlUtil.escapeHtml(item.description) + "</label>").appendTo($td);
                        }
                        else if (item.inputType == "select") {
                            var $select = $("<select id='setting_" + item.name + "' class='editable'>").appendTo($td);
                            var values = item.values;
                            values.forEach(function (value) {
                                $("<option value='" + value[0] + "'>" + value[1] + "</option>").appendTo($select);
                            });
                            $select.val(webSettings.settings[item.name]);
                        }
                        lastSection = item.section;
                    });
                });
            };
            EditWebWorkspaceDialog.prototype.btnOK_onClick = function (evt) {
                var _this = this;
                var settings = {};
                this.schema.forEach(function (item) {
                    if (item.inputType == "checkbox") {
                        settings[item.name] = $("#setting_" + item.name).prop("checked") ? true : false;
                    }
                    else {
                        settings[item.name] = $("#setting_" + item.name).val();
                    }
                });
                var webSettings = {
                    ID: this.settingsID,
                    name: this.txtWorkspaceName.getText() || "Untitled",
                    settings: settings,
                    visibility: null
                };
                $catdv.saveWebWorkspace(webSettings, function () {
                    _this.close(true);
                });
            };
            return EditWebWorkspaceDialog;
        }(controls.Modal));
    })(admin = ui.admin || (ui.admin = {}));
})(ui || (ui = {}));
