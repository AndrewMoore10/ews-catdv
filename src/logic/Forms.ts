module logic
{
    import $catdv = catdv.RestApi;

    import FormDefinition = catdv.FormDefinition;

    export class UploadFormManager 
    {
        private static DEFAULT_UPLOAD_FORM_FIELDS = ["NT"];

        public static getUploadForm(callback: (UploadFormDefinition) => void)
        {
            FormSettingsManager.getCurrentUploadForm((uploadForm: FormDefinition) => 
            {
                if (uploadForm)
                {
                    callback(uploadForm);
                }
                else
                {
                    var defaultUploadForm: FormDefinition = { name: "Summary", fields: [] };
                    UploadFormManager.DEFAULT_UPLOAD_FORM_FIELDS.forEach((fieldDefID) =>
                    {
                        var fieldDef = BuiltInFields[fieldDefID];
                        if (fieldDef)
                        {
                            defaultUploadForm.fields.push({
                                fieldDefID: fieldDefID,
                                fieldDefinition: fieldDef
                            });
                        }
                    });
                    callback(defaultUploadForm);
                }
            });
        }
    }

    export class SearchFormManager 
    {
        public static getSearchForm(callback: (SearchFormDefinition) => void)
        {
            FormSettingsManager.getCurrentSearchForm((searchForm: FormDefinition) => 
            {
                callback(searchForm);
            });
        }
    }
}