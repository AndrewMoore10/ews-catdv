module ui.admin
{
    import HtmlUtil = util.HtmlUtil;

    import SimpleServerDataSource = controls.SimpleServerDataSource;
    import SimpleDataSourceParams = controls.SimpleDataSourceParams;
    import DataTable = controls.DataTable;
    import SelectionMode = controls.SelectionMode;
    import Label = controls.Label;
    import Button = controls.Button;
    import TextBox = controls.TextBox;
    import MessageBox = controls.MessageBox;

    import $catdv = catdv.RestApi;
    import PartialResultSet = catdv.PartialResultSet;
    import FieldDefinition = catdv.FieldDefinition;

    export class FieldUsageForm
    {
        private fieldUsageTable: DataTable;

        private lblPageHeader = new Label("lblPageHeader");
        private btnDeMergeField = new Button("btnDeMergeField");

        private deMergeFieldDialog = new DeMergeFieldDialog("deMergeFieldDialog");

        private fieldDefID: number;
        private fieldDef: FieldDefinition;

        constructor()
        {
            this.fieldDefID = Number($.urlParam("id"));

            $catdv.getFieldDefinition(this.fieldDefID, (fieldDef: FieldDefinition) =>
            {
                this.fieldDef = fieldDef;
                this.lblPageHeader.setText("Field '" + fieldDef.name + "' Usage");

                this.fieldUsageTable = new DataTable("fieldUsageTable", {
                    selectionMode: SelectionMode.Multi,
                    columns: [
                        { title: "Group", dataProp: "groupName" },
                        { title: "Number of Clips with Field Set", dataProp: "numClips" },
                        {
                            title: "Sample Values",
                            dataProp: "values",
                            renderer: (obj: any, val: any) =>
                            {
                                return (<string[]>val).join("<br/>");
                            }
                        },
                    ],
                    simpleDataSource: new SimpleServerDataSource((params: SimpleDataSourceParams, callback: (users: any[]) => void) =>
                    {
                        $catdv.getFieldUsage(this.fieldDefID, params, (data) =>
                        {
                            callback(data);
                        });
                    })
                });


                this.btnDeMergeField.onClick((evt) => this.deMergeFieldDialog.show());

                this.deMergeFieldDialog.onOK((name: string) =>
                {
                    var groupIDs = this.fieldUsageTable.getSelectedItems().map((item) => item.groupID);

                    var newFieldDef: FieldDefinition = {
                        fieldGroupID: this.fieldDef.fieldGroupID,
                        memberOf: "clip",
                        fieldType: this.fieldDef.fieldType,
                        identifier: name.toLowerCase().replaceAll(" ", "."),
                        name: name,
                        isEditable: this.fieldDef.isEditable,
                        isMandatory: this.fieldDef.isMandatory,
                        origin: ("demerged-" + this.fieldDef.identifier + "-[" + groupIDs.join(",") + "]")
                    };

                    $catdv.saveField(newFieldDef,
                        (newFieldDefID) =>
                        {
                            $("body").css({ "cursor": "wait" });
                            $catdv.demergeFields(this.fieldDefID, newFieldDefID, groupIDs,
                                () =>
                                {
                                    MessageBox.showMessage("New field '" + newFieldDef.name + "' created");
                                },
                                (status: String, error: string) =>
                                {
                                    $("body").css({ "cursor": "initial" });
                                    MessageBox.alert(error);
                                });
                        },
                        (status: String, error: string) =>
                        {
                            MessageBox.alert(error);
                        });
                });
            });
        }
    }


    class DeMergeFieldDialog extends controls.Modal
    {
        private txtName: TextBox = new TextBox("txtName");

        private btnDeMergeDialogOK: Button = new Button("btnDeMergeDialogOK");

        private userID: number;

        constructor(elementId: string)
        {
            super(elementId);

            this.btnDeMergeDialogOK.onClick((evt: any) =>
            {
                this.close(true, this.txtName.getText());
            });
        }

        public show()
        {
            super.show();
            this.txtName.setText("");
        }
    }
}

