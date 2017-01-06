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
        var ColorPicker = controls.ColorPicker;
        var TabPanel = controls.TabPanel;
        var SimpleServerDataSource = controls.SimpleServerDataSource;
        var MessageBox = controls.MessageBox;
        var $catdv = catdv.RestApi;
        var ThemesPage = (function () {
            function ThemesPage() {
                var _this = this;
                this.btnDelete = new Button("btnDelete");
                this.btnAddTheme = new Button("btnAddTheme");
                this.editThemeDialog = new EditThemeDialog("editThemeDialog");
                this.themesTable = new DataTable("themesTable", {
                    columns: [
                        {
                            title: "Theme",
                            dataProp: "name",
                            renderer: function (obj, val) {
                                return "<a href='javascript:$page.editTheme(\"" + val + "\")'>" + HtmlUtil.escapeHtml(val) + "</a>";
                            }
                        }
                    ],
                    simpleDataSource: new SimpleServerDataSource(function (params, callback) {
                        $catdv.getThemes(function (themes) {
                            callback(themes);
                        });
                    })
                });
                this.btnAddTheme.onClick(function (evt) {
                    _this.editThemeDialog.setTheme(null);
                    _this.editThemeDialog.show();
                });
                this.editThemeDialog.onOK(function () {
                    _this.themesTable.reload();
                });
                this.btnDelete.onClick(function (evt) {
                    var selectedWebWorkspace = _this.themesTable.getSelectedItem();
                    MessageBox.confirm("Are you sure you want to delete '" + selectedWebWorkspace.name + "'", function () {
                        $catdv.deleteTheme(selectedWebWorkspace.name, function (reply) {
                            _this.themesTable.reload();
                        });
                    });
                });
            }
            ThemesPage.prototype.editTheme = function (themeName) {
                var _this = this;
                $catdv.getTheme(themeName, function (theme) {
                    _this.editThemeDialog.setTheme(theme);
                    _this.editThemeDialog.show();
                }, function () {
                    MessageBox.alert("Failed to load theme '" + themeName + "'");
                });
            };
            return ThemesPage;
        }());
        admin.ThemesPage = ThemesPage;
        var EditThemeDialog = (function (_super) {
            __extends(EditThemeDialog, _super);
            function EditThemeDialog(elementId) {
                var _this = this;
                _super.call(this, elementId);
                this.tabsEditTheme = new TabPanel("tabsEditTheme");
                this.txtThemeName = new TextBox("txtThemeName");
                this.txtImageFolder = new TextBox("txtImageFolder");
                this.colorSchemeSettingsContainer = new Element("colorSchemeSettingsContainer");
                this.advancedSettingsContainer = new Element("advancedSettingsContainer");
                this.btnEditThemeApply = new Button("btnEditThemeApply");
                this.btnEditThemeOK = new Button("btnEditThemeOK");
                this.newTheme = true;
                this.originalName = null;
                this.btnEditThemeOK.onClick(function (evt) {
                    _this.apply(function () { return _this.close(true); });
                });
                this.btnEditThemeApply.onClick(function (evt) {
                    _this.btnEditThemeApply.$element.css({ "cursor": "wait" });
                    _this.apply(function () {
                        _this.btnEditThemeApply.$element.css({ "cursor": "initial" });
                    });
                });
            }
            // Override
            EditThemeDialog.prototype.show = function () {
                _super.prototype.show.call(this);
                this.tabsEditTheme.selectTab("Images");
            };
            EditThemeDialog.prototype.setTheme = function (theme) {
                var _this = this;
                this.newTheme = (theme == null);
                theme = theme || { name: "" };
                this.originalName = theme.name;
                $catdv.getThemeSchema(function (schema) {
                    schema = schema.filter(function (item) { return item.name != 'image-dir'; });
                    // Create default set of web settings if none passed in
                    if (!theme.settings) {
                        theme.settings = {};
                        schema.forEach(function (item) {
                            theme.settings[item.name] = item.defaultValue;
                        });
                    }
                    _this.txtThemeName.setText(theme.name);
                    _this.txtImageFolder.setText(theme.settings["image-dir"] || "");
                    _this.colorEditFields = [];
                    _this.buildColorPanel(_this.colorSchemeSettingsContainer, theme.settings, schema.filter(function (item) { return !item.name.startsWith("override"); }), false);
                    _this.buildColorPanel(_this.advancedSettingsContainer, theme.settings, schema.filter(function (item) { return item.name.startsWith("override"); }), true);
                });
            };
            EditThemeDialog.prototype.buildColorPanel = function (container, settings, schema, overrides) {
                var _this = this;
                container.$element.empty();
                var lastSection = "";
                schema.forEach(function (item) {
                    if (item.section != lastSection) {
                        $("<h5>" + item.section + "</h5>").appendTo(container.$element);
                    }
                    var $formGroup = $("<div class='form-group form-group-sm'>").appendTo(container.$element);
                    var $label = $("<label class='col-sm-5 control-label'>" + item.description + ":</label>").appendTo($formGroup);
                    var $inputContainer = $("<div class='col-sm-7'>").appendTo($formGroup);
                    var colorPicker = ColorPicker.create({ "width": "100%" }, overrides, $inputContainer);
                    colorPicker.setColor(settings[item.name] || "");
                    _this.colorEditFields.push({ "name": item.name, "colorPicker": colorPicker });
                    lastSection = item.section;
                });
            };
            EditThemeDialog.prototype.apply = function (callback) {
                var _this = this;
                var name = this.txtThemeName.getText() || "New Theme";
                var newTheme = this.newTheme || (name != this.originalName);
                var theme = {
                    "name": this.txtThemeName.getText() || "New Theme",
                    "settings": {
                        "image-dir": this.txtImageFolder.getText()
                    }
                };
                this.colorEditFields.forEach(function (colorEditField) {
                    theme.settings[colorEditField.name] = colorEditField.colorPicker.getColor();
                });
                if (this.newTheme || (theme.name != this.originalName)) {
                    $catdv.createTheme(theme, function () {
                        _this.originalName = theme.name;
                        callback();
                    });
                }
                else {
                    $catdv.updateTheme(theme, function () {
                        callback();
                    });
                }
            };
            return EditThemeDialog;
        }(controls.Modal));
    })(admin = ui.admin || (ui.admin = {}));
})(ui || (ui = {}));
