var logic;
(function (logic) {
    var UploadFormManager = (function () {
        function UploadFormManager() {
        }
        UploadFormManager.getUploadForm = function (callback) {
            logic.FormSettingsManager.getCurrentUploadForm(function (uploadForm) {
                if (uploadForm) {
                    callback(uploadForm);
                }
                else {
                    var defaultUploadForm = { name: "Summary", fields: [] };
                    UploadFormManager.DEFAULT_UPLOAD_FORM_FIELDS.forEach(function (fieldDefID) {
                        var fieldDef = logic.BuiltInFields[fieldDefID];
                        if (fieldDef) {
                            defaultUploadForm.fields.push({
                                fieldDefID: fieldDefID,
                                fieldDefinition: fieldDef
                            });
                        }
                    });
                    callback(defaultUploadForm);
                }
            });
        };
        UploadFormManager.DEFAULT_UPLOAD_FORM_FIELDS = ["NT"];
        return UploadFormManager;
    }());
    logic.UploadFormManager = UploadFormManager;
    var SearchFormManager = (function () {
        function SearchFormManager() {
        }
        SearchFormManager.getSearchForm = function (callback) {
            logic.FormSettingsManager.getCurrentSearchForm(function (searchForm) {
                callback(searchForm);
            });
        };
        return SearchFormManager;
    }());
    logic.SearchFormManager = SearchFormManager;
})(logic || (logic = {}));
