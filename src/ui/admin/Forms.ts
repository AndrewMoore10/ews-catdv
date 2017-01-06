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
    import FormSet = catdv.FormSet;
    import FormDefinition = catdv.FormDefinition;
    import FormField = catdv.FormField;
    import VisibilityRules = catdv.VisibilityRules;
    import FieldDefinition = catdv.FieldDefinition;
    import BaseViewSet = catdv.BaseViewSet;
    import BaseViewField = catdv.BaseViewField;
    import VisibilityUtil = catdv.VisibilityUtil;
    import NavbarLoginMenu = ui.panels.NavbarLoginMenu;

    // These lookup tables are created by the server and emitted into 
    // a script in the head of forms.jsp
    declare var roleLookup;
    declare var groupLookup;
    declare var clientLookup;

    export class FormsForm extends BaseViewsForm
    {
        constructor()
        {
            super("form");

            this.viewsTable = new DataTable("formsTable", {

                selectionMode: SelectionMode.Multi,

                columns: [
                    {
                        title: "",
                        dataProp: "ID",
                        width: 16,
                        renderer: (obj: any, val: any) =>
                        {
                            var isExpanded = !this.viewSetIsCollapsed[obj.ID];
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
                            return obj.view ? "<a href='javascript:$page.editVisibility(" + obj.ID + ")'>" + VisibilityUtil.visibilitySummary(val) + "</a>" : "";
                        }
                    }
                ],

                hideRow: (obj: any) => 
                {
                    return obj.view && this.viewSetIsCollapsed[obj.view.formSetID];
                },

                simpleDataSource: new SimpleServerDataSource((params : any, callback: (results: any[]) => void) =>
                {
                    $catdv.getFormSetsWithForms((formsets: FormSet[]) =>
                    {
                        // Need to build combined list that has each FormSet then its components Forms
                        var listItems: ViewListItem[] = [];

                        formsets.forEach((formset) =>
                        {
                            listItems.push(new ViewListItem(formset, null));

                            if (formset.forms)
                            {
                                formset.forms.forEach((form) =>
                                {
                                    listItems.push(new ViewListItem(null, form));
                                });
                            }
                        });
                        this.setModel(formsets, listItems);
                        callback(listItems);
                    });
                })
            });

            this.viewsTable.onSelectionChanged((evt) => super.updateButtons());

            this.editViewSetDialog = null;
            this.editViewDialog = new EditFormDialog("editFormDialog");
        }
    }

    class EditFormDialog extends BaseEditViewDialog
    {
        private chkMultiline = new CheckBox("chkMultiline");
        private chkMandatory = new CheckBox("chkMandatory");

        constructor(elementId: string)
        {
            super(elementId, "form");

            this.chkMultiline.onChanged((evt) => { (<FormField>this.selectedViewField()).options.multiline = this.chkMultiline.isChecked(); });
            this.chkMandatory.onChanged((evt) => { (<FormField>this.selectedViewField()).options.mandatory = this.chkMandatory.isChecked(); });
        }

        public setView(viewSet: FormSet, viewDef: FormDefinition, allViewDefs: FormDefinition[])
        {
            super.setView(viewSet, viewDef, allViewDefs);
         }

        public getDefaultIncludes()
        {
            var formType = (<FormSet>this.viewSet).formType;
            if (formType == "search")
            {
                return "onlySimpleSearchable";
            }
            else if (formType == "upload")
            {
                return "onlyEditable";
            }
            else if (formType == "filter")
            {
                return "onlyFilterable";
            }
            else
            {
                return "";
            }
        }

        public updateControls()
        {
            super.updateControls();

            if ((<FormSet>this.viewSet).formType == "search")
            {
                $("#chkMultilineContainer").show();
                $("#chkMandatoryContainer").hide();
            }
            else if ((<FormSet>this.viewSet).formType == "filter")
            {
                $("#chkMultilineContainer").hide();
                $("#chkMandatoryContainer").hide();
            }
            else
            {
                $("#chkMultilineContainer").show();
                $("#chkMandatoryContainer").show();
            }

            if (this.isViewFieldSelected())
            {
                var formField = <FormField>this.selectedViewField();
                formField.options = formField.options || {};
                this.chkMultiline.setEnabled(true);
                this.chkMultiline.setChecked(formField.options.multiline);
                this.chkMandatory.setEnabled(true);
                this.chkMandatory.setChecked(formField.options.mandatory);
            }
            else
            {
                this.chkMultiline.setEnabled(false);
                this.chkMultiline.setChecked(false);
                this.chkMandatory.setEnabled(false);
                this.chkMandatory.setChecked(false);
            }
        }

        public saveDefinition(definitionID: number, name: string, description: string, order: number, fields: BaseViewField[])
        {
            var formDef: FormDefinition =
                {
                    ID: definitionID,
                    formSetID: this.viewSet.ID,
                    name: name,
                    description: description,
                    type: "normal",
                    order: order,
                    fields: fields
                };

            $catdv.saveForm(formDef,() =>
            {
                this.close(true);
            });
        }
    }
}

