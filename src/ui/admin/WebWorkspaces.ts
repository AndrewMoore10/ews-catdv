module ui.admin
{
    import HtmlUtil = util.HtmlUtil;
    import Element = controls.Element;
    import DataTable = controls.DataTable;
    import Button = controls.Button;
    import TextBox = controls.TextBox;
    import CheckBox = controls.CheckBox;
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

    export class WebWorkspacesPage
    {
        private settingsTable: DataTable;
        private btnAddSettings: Button = new Button("btnAddSettings");
        private btnDelete = new Button("btnDelete");
        private btnMoveUp = new Button("btnMoveUp");
        private btnMoveDown = new Button("btnMoveDown");
        private btnThemes = new Button("btnThemes");

        private editWebWorkspaceDialog = new EditWebWorkspaceDialog("editWebWorkspaceDialog");
        private editVisibilityDialog = new EditVisibilityDialog("editVisibilityDialog", "webSettings");

        private webSettingsList: WebWorkspace[] = [];
        private listItemLookup: { [settingsID: number]: WebWorkspace } = {};

        constructor()
        {
            this.settingsTable = new DataTable("uiSettingsTable", {
                columns: [
                    {
                        title: "Workspace",
                        dataProp: "name",
                        renderer: (obj: any, val: any) =>
                        {
                            return "<a href='javascript:$page.editWebWorkspace(" + obj.ID + ")' title='ID:" + obj.ID + "'>" + HtmlUtil.escapeHtml(obj.name) + "</a>";
                        }
                    },
                    {
                        title: "Applies To",
                        dataProp: "visibility",
                        renderer: (obj: any, val: any) =>
                        {
                            return "<a href='javascript:$page.editVisibility(" + obj.ID + ")'>" + VisibilityUtil.visibilitySummary(val) + "</a>";
                        }
                    }
                ],
                simpleDataSource: new SimpleServerDataSource((params: SimpleDataSourceParams, callback: (results: any[]) => void) =>
                {
                    $catdv.getWebWorkspaces((data) =>
                    {
                        this.webSettingsList = data;
                        this.listItemLookup = {};
                        data.forEach((webSettings) => 
                        {
                            this.listItemLookup[webSettings.ID] = webSettings;
                        });
                        callback(data);
                    });
                })
            });

            this.editWebWorkspaceDialog.onOK(() =>
            {
                this.settingsTable.reload();
            });

            this.btnAddSettings.onClick((evt) =>
            {
                this.editWebWorkspaceDialog.setWebWorkspace(null);
                this.editWebWorkspaceDialog.show();
            });

            this.btnMoveUp.onClick((evt) =>
            {
                this.moveSelectedItem("up");
            });
            this.btnMoveDown.onClick((evt) =>
            {
                this.moveSelectedItem("down");
            });

            this.btnDelete.onClick((evt) =>
            {
                var selectedWebWorkspace: WebWorkspace = this.settingsTable.getSelectedItem();
                MessageBox.confirm("Are you sure you want to delete '" + selectedWebWorkspace.name + "'", () =>
                {
                    $catdv.deleteWebWorkspace(selectedWebWorkspace.ID, (reply) =>
                    {
                        this.settingsTable.reload();
                    });
                });
            });
            
            this.btnThemes.onClick((evt) => {
                document.location.href = "themes.jsp";
            });
        }

        public editWebWorkspace(settingsID: number)
        {
            this.editWebWorkspaceDialog.setWebWorkspace(this.listItemLookup[settingsID]);
            this.editWebWorkspaceDialog.onOK(() =>
            {
                this.settingsTable.reload();
            });
            this.editWebWorkspaceDialog.show();
        }

        public editVisibility(itemID: number)
        {
            var selectedItem = this.listItemLookup[itemID];
            this.editVisibilityDialog.setItem(selectedItem);
            this.editVisibilityDialog.onOK((updatedItem) =>
            {
                $catdv.saveWebWorkspace(updatedItem, () =>
                {
                    this.settingsTable.reload();
                });
            });
            this.editVisibilityDialog.show();
        }

        private moveSelectedItem(direction: string)
        {
            var selectedItem: WebWorkspace = this.settingsTable.getSelectedItem();
            var selectedIndex = -1;
            for (var vsi = 0; vsi < this.webSettingsList.length; vsi++)
            {
                if (this.webSettingsList[vsi].ID == selectedItem.ID)
                {
                    selectedIndex = vsi;
                    break;
                }
            }

            var toSave: WebWorkspace[] = null;
            if ((direction == "up") && (selectedIndex > 0)) 
            {
                var prevWebWorkspace = this.webSettingsList[selectedIndex - 1]
                var tmp = prevWebWorkspace.pos;
                prevWebWorkspace.pos = (tmp != selectedItem.pos) ? selectedItem.pos : selectedItem.pos + 1;
                selectedItem.pos = tmp;
                toSave = [prevWebWorkspace, selectedItem];
            }
            else if ((direction == "down") && (selectedIndex < (this.webSettingsList.length - 1)))
            {
                var nextWebWorkspace = this.webSettingsList[selectedIndex + 1]
                var tmp = nextWebWorkspace.pos;
                nextWebWorkspace.pos = selectedItem.pos;
                selectedItem.pos = (tmp != selectedItem.pos) ? tmp : tmp + 1;
                toSave = [nextWebWorkspace, selectedItem];
            }
            if (toSave)
            {
                $catdv.saveWebWorkspace({ ID: toSave[0].ID, pos: toSave[0].pos }, () =>
                {
                    $catdv.saveWebWorkspace({ ID: toSave[1].ID, pos: toSave[1].pos }, () =>
                    {
                        this.settingsTable.reload();
                    });
                });
            }
        }
    }

    class EditWebWorkspaceDialog extends controls.Modal
    {
        private txtWorkspaceName = new TextBox("txtWorkspaceName");
        private workspaceSettingsTable = new Element("workspaceSettingsTable");
        private btnNewWebWorkspaceOK = new Button("btnEditWebWorkspaceOK");

        private settingsID: number;
        private schema: WebWorkspaceSchemaItem[] = null;

        constructor(elementId: string)
        {
            super(elementId);

            this.btnNewWebWorkspaceOK.onClick((evt: any) =>
            {
                this.btnOK_onClick(evt);
            });
        }

        public setWebWorkspace(webSettings: WebWorkspace)
        {
            this.settingsID = webSettings ? webSettings.ID : null;
            this.txtWorkspaceName.setText(webSettings ? webSettings.name : "");
            $catdv.getWebWorkspaceSchema((schema) =>
            {
                this.schema = schema;

                // Create default set of web settings if none passed in
                if (!webSettings)
                {
                    webSettings = { ID: null, name: "", settings: {}, visibility: null };
                    schema.forEach((item) =>
                    {
                        webSettings.settings[item.name] = item.defaultValue;
                    });
                }

                this.workspaceSettingsTable.$element.empty();
                var lastSection = "";
                schema.forEach((item) =>
                {
                    var $tr = $("<tr>").appendTo(this.workspaceSettingsTable.$element);
                    $("<th>" + ((item.section != lastSection) ? item.section : "") + "</th>").appendTo($tr);
                    var $td = $("<td>").appendTo($tr);
                    if (item.inputType == "text")
                    {
                        $("<input type='text' id='setting_" + item.name + "'  class='editable' value='" + HtmlUtil.escapeHtml(webSettings.settings[item.name] || "") + "'>").appendTo($td);
                    }
                    else if (item.inputType == "textarea")
                    {
                        $("<textarea id='setting_" + item.name + "' rows='6'  class='editable'>" + HtmlUtil.escapeHtml(webSettings.settings[item.name] || "") + "</textarea>").appendTo($td);
                    }
                    else if (item.inputType == "checkbox")
                    {
                        var checked = webSettings.settings[item.name] ? " checked " : "";
                        $("<label><input type='checkbox' id='setting_" + item.name + "' " + checked + ">" + HtmlUtil.escapeHtml(item.description) + "</label>").appendTo($td);
                    }
                    else if (item.inputType == "select")
                    {
                        var $select = $("<select id='setting_" + item.name + "' class='editable'>").appendTo($td);
                        var values: string[][] = item.values;
                        values.forEach((value) => 
                        {
                            $("<option value='" + value[0] + "'>" + value[1] + "</option>").appendTo($select);
                        });
                        $select.val(webSettings.settings[item.name]);

                    }
                    lastSection = item.section;
                });
            });
        }

        private btnOK_onClick(evt: any)
        {
            var settings = {};
            this.schema.forEach((item) =>
            {
                if (item.inputType == "checkbox")
                {
                    settings[item.name] = $("#setting_" + item.name).prop("checked") ? true : false;
                }
                else
                {
                    settings[item.name] = $("#setting_" + item.name).val();
                }
            });

            var webSettings =
                {
                    ID: this.settingsID,
                    name: this.txtWorkspaceName.getText() || "Untitled",
                    settings: settings,
                    visibility: null
                };

            $catdv.saveWebWorkspace(webSettings, () =>
            {
                this.close(true);
            });
        }
    }
}