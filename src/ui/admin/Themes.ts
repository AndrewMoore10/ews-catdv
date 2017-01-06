module ui.admin
{
    import HtmlUtil = util.HtmlUtil;
    import Element = controls.Element;
    import DataTable = controls.DataTable;
    import Button = controls.Button;
    import TextBox = controls.TextBox;
    import CheckBox = controls.CheckBox;
    import ColorPicker = controls.ColorPicker;
    import TabPanel = controls.TabPanel;
    import SimpleServerDataSource = controls.SimpleServerDataSource;
    import SimpleDataSourceParams = controls.SimpleDataSourceParams;
    import MessageBox = controls.MessageBox;

    import $catdv = catdv.RestApi;
    import VisibilityRules = catdv.VisibilityRules;
    import VisibilityUtil = catdv.VisibilityUtil;
    import WebWorkspace = catdv.WebWorkspace;
    import WebWorkspaceSchemaItem = catdv.WebWorkspaceSchemaItem;
    import WebTheme = catdv.WebTheme;

    // These lookup tables are created by the server and emitted into 
    // a script in the head of views.jsp
    declare var roleLookup;
    declare var clientLookup;

    export class ThemesPage
    {
        private themesTable: DataTable;
        private btnDelete = new Button("btnDelete");
        private btnAddTheme = new Button("btnAddTheme");

        private editThemeDialog = new EditThemeDialog("editThemeDialog");

        constructor()
        {
            this.themesTable = new DataTable("themesTable", {
                columns: [
                    {
                        title: "Theme",
                        dataProp: "name",
                        renderer: (obj: any, val: any) =>
                        {
                            return "<a href='javascript:$page.editTheme(\"" + val + "\")'>" + HtmlUtil.escapeHtml(val) + "</a>";
                        }
                    }
                ],
                simpleDataSource: new SimpleServerDataSource((params: SimpleDataSourceParams, callback: (results: any[]) => void) =>
                {
                    $catdv.getThemes((themes: WebTheme[]) =>
                    {
                        callback(themes);
                    });
                })
            });

            this.btnAddTheme.onClick((evt) =>
            {
                this.editThemeDialog.setTheme(null);
                this.editThemeDialog.show();
            });
           
            this.editThemeDialog.onOK(() =>
            {
                this.themesTable.reload();
            });

            this.btnDelete.onClick((evt) =>
            {
                var selectedWebWorkspace: WebWorkspace = this.themesTable.getSelectedItem();
                MessageBox.confirm("Are you sure you want to delete '" + selectedWebWorkspace.name + "'", () =>
                {
                    $catdv.deleteTheme(selectedWebWorkspace.name, (reply) =>
                    {
                        this.themesTable.reload();
                    });
                });
            });
         }

        public editTheme(themeName: string)
        {
            $catdv.getTheme(themeName,
                (theme: WebTheme) =>
                {
                    this.editThemeDialog.setTheme(theme);
                    this.editThemeDialog.show();
                },
                () =>
                {
                    MessageBox.alert("Failed to load theme '" + themeName + "'");
                });
        }
    }

    interface ColorEditField
    {
        name: string,
        colorPicker: ColorPicker
    }

    class EditThemeDialog extends controls.Modal
    {
        private tabsEditTheme = new TabPanel("tabsEditTheme");
        private txtThemeName = new TextBox("txtThemeName");
        private txtImageFolder = new TextBox("txtImageFolder");
        private colorSchemeSettingsContainer = new Element("colorSchemeSettingsContainer");
        private advancedSettingsContainer = new Element("advancedSettingsContainer");
        private btnEditThemeApply = new Button("btnEditThemeApply");
        private btnEditThemeOK = new Button("btnEditThemeOK");

        private newTheme: boolean = true;
        private originalName: String = null;
        private colorEditFields: ColorEditField[];

        constructor(elementId: string)
        {
            super(elementId);

            this.btnEditThemeOK.onClick((evt: any) =>
            {
                 this.apply(() => this.close(true));
            });
            
            this.btnEditThemeApply.onClick((evt: any) =>
            {
                this.btnEditThemeApply.$element.css({"cursor": "wait"});
                this.apply(() =>
                {
                    this.btnEditThemeApply.$element.css({"cursor": "initial"});
                });
            });
        }

        // Override
        public show()
        {
            super.show();
            
            this.tabsEditTheme.selectTab("Images");
        }

        public setTheme(theme: WebTheme)
        {
            this.newTheme = (theme == null);
            theme = theme || { name: "" };
            this.originalName = theme.name;

            $catdv.getThemeSchema((schema) =>
            {
                schema = schema.filter((item) => item.name != 'image-dir');

                // Create default set of web settings if none passed in
                if (!theme.settings)
                {
                    theme.settings = {};
                    schema.forEach((item) =>
                    {
                        theme.settings[item.name] = item.defaultValue;
                    });
                }

                this.txtThemeName.setText(theme.name);
                this.txtImageFolder.setText(theme.settings["image-dir"] || "");

                this.colorEditFields = [];
 
                this.buildColorPanel(this.colorSchemeSettingsContainer, theme.settings, schema.filter((item) => !item.name.startsWith("override")), false);
                this.buildColorPanel(this.advancedSettingsContainer, theme.settings, schema.filter((item) => item.name.startsWith("override")), true);
             });
        }
        
        private buildColorPanel(container: Element,  settings : any, schema: WebWorkspaceSchemaItem[], overrides: boolean)
        {
            container.$element.empty();
            
            var lastSection = "";
            schema.forEach((item) =>
            {
                if (item.section != lastSection)
                {
                    $("<h5>" + item.section + "</h5>").appendTo(container.$element);
                }

                var $formGroup = $("<div class='form-group form-group-sm'>").appendTo(container.$element);
                var $label = $("<label class='col-sm-5 control-label'>" + item.description + ":</label>").appendTo($formGroup);
                var $inputContainer = $("<div class='col-sm-7'>").appendTo($formGroup);

                var colorPicker = ColorPicker.create({ "width" : "100%"}, overrides, $inputContainer);
                colorPicker.setColor(settings[item.name] || "");

                this.colorEditFields.push({ "name": item.name, "colorPicker": colorPicker });

                lastSection = item.section;
            });
       }

        private apply(callback : () => void)
        {
            var name = this.txtThemeName.getText() || "New Theme";
            var newTheme = this.newTheme || (name != this.originalName);
            var theme: WebTheme = {
                "name": this.txtThemeName.getText() || "New Theme",
                "settings": {
                    "image-dir": this.txtImageFolder.getText()
                }
            };

            this.colorEditFields.forEach((colorEditField) =>
            {
                theme.settings[colorEditField.name] = colorEditField.colorPicker.getColor();
            });

            if (this.newTheme || (theme.name != this.originalName))
            {
                $catdv.createTheme(theme, () =>
                {
                    this.originalName = theme.name;
                    callback();
                });
            }
            else
            {
                $catdv.updateTheme(theme, () =>
                {
                    callback();
                });
            }
        }
    }
}