module ui.admin
{
    import HtmlUtil = util.HtmlUtil;
    import Element = controls.Element;
    import SimpleServerDataSource = controls.SimpleServerDataSource;
    import DataTable = controls.DataTable;
    import SelectionMode = controls.SelectionMode;
    import Button = controls.Button;
    import ButtonDropDown = controls.ButtonDropDown;
    import TextBox = controls.TextBox;
    import TextArea = controls.TextArea;
    import DropDownList = controls.DropDownList;
    import CheckBox = controls.CheckBox;
    import ListBox = controls.ListBox;

    import $catdv = catdv.RestApi;
    import PartialResultSet = catdv.PartialResultSet;
    import BaseViewDefinition = catdv.BaseViewDefinition;
    import PanelSet = catdv.PanelSet;
    import PanelDefinition = catdv.PanelDefinition;
    import PanelField = catdv.PanelField;
    import VisibilityRules = catdv.VisibilityRules;
    import FieldDefinition = catdv.FieldDefinition;
    import BaseViewSet = catdv.BaseViewSet;
    import BaseViewField = catdv.BaseViewField;
    import VisibilityUtil = catdv.VisibilityUtil;
    import NavbarLoginMenu = ui.panels.NavbarLoginMenu;

    // These lookup tables are created by the server and emitted into 
    // a script in the head of panels.jsp
    declare var roleLookup;
    declare var groupLookup;
    declare var clientLookup;

    export class PanelsForm extends BaseViewsForm
    {
        constructor()
        {
            super("panel");

            this.viewsTable = new DataTable("panelsTable", {

                selectionMode: SelectionMode.Multi,

                columns: [
                    {
                        title: "",
                        dataProp: "ID",
                        width: 16,
                        renderer: (obj: any, val: any) =>
                        {
                            var isExpanded =  !this.viewSetIsCollapsed[obj.ID];
                            return obj.viewset ? "<a href='javascript:$page.toggleSection(" + obj.ID + ")'>" 
                                + "<span id='view_expander_" + obj.ID + "' class='glyphicon glyphicon-play" + (isExpanded ? " glyph-rotate-90" : "") + "'> </span></a>" : "";
                        }
                    },
                    {
                        title: "Panel Set",
                        dataProp: "viewsetName",
                        renderer: (obj: any, val: any) =>
                        {
                            return obj.viewset ? "<a href='javascript:$page.editViewSet(" + obj.ID + ")'>" + HtmlUtil.escapeHtml(val) + "</a>" : "";
                        }
                    },
                    {
                        title: "Panel Name",
                        dataProp: "viewName",
                        renderer: (obj: any, val: any) =>
                        {
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
                        renderer: (obj: any, val: any) =>
                        {
                            return "<a href='javascript:$page.editVisibility(" + obj.ID + ")'>" + VisibilityUtil.visibilitySummary(val) + "</a>";
                        }
                    }
                ],

                hideRow: (obj: any) => 
                {
                     return obj.view && this.viewSetIsCollapsed[obj.view.panelSetID];
                },

                simpleDataSource: new SimpleServerDataSource((params : any, callback: (results: any[]) => void) =>
                 {
                    $catdv.getPanelSetsWithPanels((panelsets: PanelSet[]) =>
                    {
                        // Need to build combined list that has each PanelSet then its components Panels
                        var listItems: ViewListItem[] = [];

                        panelsets.forEach((panelset) =>
                        {
                            listItems.push(new ViewListItem(panelset, null));

                            if (panelset.panels)
                            {
                                panelset.panels.forEach((panel) =>
                                {
                                    listItems.push(new ViewListItem(null, panel));
                                });
                            }
                        });
                        this.setModel(panelsets, listItems);
                        callback(listItems);
                    });
                })
            });

            this.viewsTable.onSelectionChanged((evt) => super.updateButtons());

            this.editViewSetDialog = new EditPanelSetDialog("editViewSetDialog");
            this.editViewDialog = new EditPanelDialog("editPanelDialog");
        }
    }

    class EditPanelSetDialog extends BaseEditViewSetDialog
    {
        constructor(elementId: string)
        {
            super(elementId, "panel");
        }
    }

    class EditPanelDialog extends BaseEditViewDialog
    {
        private lstViewType = new ListBox("lstViewType");

        private chkReadOnly = new CheckBox("chkReadOnly");
        private chkSpanTwoCols = new CheckBox("chkSpanTwoCols");
        private chkHideIfBlank = new CheckBox("chkHideIfBlank");
        private chkMultiline = new CheckBox("chkMultiline");

        private divEditFields = new Element("editFieldsSection");

        constructor(elementId: string)
        {
            super(elementId, "panel");

            this.lstViewType.onChanged(() => { this.updateOptionControls(); });
            this.chkReadOnly.onChanged((evt) => { (<PanelField>this.selectedViewField()).options.readOnly = this.chkReadOnly.isChecked(); });
            this.chkSpanTwoCols.onChanged((evt) => { (<PanelField>this.selectedViewField()).options.spanTwoColumns = this.chkSpanTwoCols.isChecked(); });
            this.chkHideIfBlank.onChanged((evt) => { (<PanelField>this.selectedViewField()).options.hideIfBlank = this.chkHideIfBlank.isChecked(); });
            this.chkMultiline.onChanged((evt) => { (<PanelField>this.selectedViewField()).options.multiline = this.chkMultiline.isChecked(); });
        }

        public setView(viewSet: PanelSet, viewDef: PanelDefinition, allViewDefs: PanelDefinition[])
        {
            super.setView(viewSet, viewDef, allViewDefs);
            this.lstViewType.setSelectedValue(viewDef ? viewDef.type : "normal");
            this.updateOptionControls();
        }

        private updateOptionControls()
        {
            this.divEditFields.show(this.lstViewType.getSelectedValue() != "builtin");
        }

        public updateControls()
        {
            super.updateControls();

            if (this.isViewFieldSelected())
            {
                var panelField = <PanelField>this.selectedViewField();
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
            else
            {
                this.chkReadOnly.setEnabled(false);
                this.chkReadOnly.setChecked(false);
                this.chkSpanTwoCols.setEnabled(false);
                this.chkSpanTwoCols.setChecked(false);
                this.chkHideIfBlank.setEnabled(false);
                this.chkHideIfBlank.setChecked(false);
                this.chkMultiline.setEnabled(false);
                this.chkMultiline.setChecked(false);
            }
        }

        public saveDefinition(definitionID: number, name: string, description: string, order: number, fields: BaseViewField[])
        {
            var panelDef: PanelDefinition =
                {
                    ID: definitionID,
                    panelSetID: this.viewSet.ID,
                    name: name,
                    description: description,
                    type: this.lstViewType.getSelectedValue(),
                    order: order,
                    fields: fields
                };

            $catdv.savePanel(panelDef,() =>
            {
                this.close(true);
            });
        }
    }


}

