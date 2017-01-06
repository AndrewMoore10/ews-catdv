var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var ui;
(function (ui) {
    var panels;
    (function (panels) {
        var HtmlUtil = util.HtmlUtil;
        var TextBox = controls.TextBox;
        var DropDownList = controls.DropDownList;
        var CheckBox = controls.CheckBox;
        var ComboBox = controls.ComboBox;
        var Button = controls.Button;
        var Panel = controls.Panel;
        var SimpleArrayDataSource = controls.SimpleArrayDataSource;
        var CachedServerDataSource = controls.CachedServerDataSource;
        var TimecodeUtil = catdv.TimecodeUtil;
        var FieldDefinitionUtil = catdv.FieldDefinitionUtil;
        var DateUtil = catdv.DateUtil;
        var FieldSettingsManager = logic.FieldSettingsManager;
        var SearchFormManager = logic.SearchFormManager;
        var TextField = logic.TextField;
        var ComboBoxField = logic.ComboBoxField;
        var CheckBoxField = logic.CheckBoxField;
        var MultiCheckboxField = logic.MultiCheckboxField;
        var EPOC = "0";
        var ISO_DATE = "YYYY-MM-DD";
        ;
        var TIME_PERIOD_LIST_ITEMS = [
            { value: 24 * 60 * 60, text: "days" },
            { value: 60 * 60, text: "hours" },
            { value: 60, text: "minutes" },
            { value: 1, text: "seconds" }
        ];
        var operatorLookup = {
            "text": [
                { name: "contains", op: "has", param_type: "text", logicalNOT: false },
                { name: "does not contain", op: "has", param_type: "text", logicalNOT: true },
                { name: "equals", op: "eq", param_type: "text", logicalNOT: false },
                { name: "does not equal", op: "eq", param_type: "text", logicalNOT: true },
                { name: "starts with", op: "startsWith", param_type: "text", logicalNOT: false },
                { name: "does not start with", op: "startsWith", param_type: "text", logicalNOT: true },
                { name: "ends with", op: "endsWith", param_type: "text", logicalNOT: false },
                { name: "does not end with", op: "endsWith", param_type: "text", logicalNOT: true },
                { name: "is blank", op: "isBlank", param_type: "text", logicalNOT: false },
                { name: "is not blank", op: "isBlank", param_type: "text", logicalNOT: true },
                { name: "is one of", op: "isOneOf", param_type: "text", logicalNOT: false },
                { name: "is not one of", op: "isOneOf", param_type: "text", logicalNOT: true },
                { name: "contains one of", op: "hasOneOf", param_type: "text", logicalNOT: false },
                { name: "does not contain any of", op: "hasOneOf", param_type: "text", logicalNOT: true },
                { name: "matches regex", op: "regex", param_type: "text", logicalNOT: false },
                { name: "does not match regex", op: "regex", param_type: "text", logicalNOT: true },
                { name: "contains all", op: "hasAll", param_type: "text", logicalNOT: false },
                { name: "does not contain any", op: "hasAll", param_type: "text", logicalNOT: true },
                { name: "like", op: "like", param_type: "text", logicalNOT: false },
                { name: "is not like", op: "like", param_type: "text", logicalNOT: true },
                { name: "contains word", op: "hasWord", param_type: "text", logicalNOT: false },
                { name: "does not contain word", op: "hasWord", param_type: "text", logicalNOT: true } // // word word "a phrase"
            ],
            "multi": [
                { name: "contains", op: "has", param_type: "text", logicalNOT: false },
                { name: "does not contain", op: "has", param_type: "text", logicalNOT: true },
                { name: "is blank", op: "isBlank", param_type: "text", logicalNOT: false },
                { name: "is not blank", op: "isBlank", param_type: "text", logicalNOT: true },
                { name: "contains one of", op: "hasOneOf", param_type: "text", logicalNOT: false },
                { name: "does not contain any of", op: "hasOneOf", param_type: "text", logicalNOT: true },
                { name: "includes", op: "includes", param_type: "text", logicalNOT: false },
                { name: "does not include", op: "includes", param_type: "text", logicalNOT: true } // word\nword (one or more multigrouping terms)   
            ],
            "number": [
                { name: "equals", op: "eq", param_type: "number", logicalNOT: false },
                { name: "does not equal", op: "eq", param_type: "number", logicalNOT: true },
                { name: "is one of", op: "isOneOf", param_type: "number", logicalNOT: false },
                { name: "is not one of", op: "isOneOf", param_type: "number", logicalNOT: true },
                { name: "is greater than", op: "ge", param_type: "number", logicalNOT: false },
                { name: "is less than", op: "le", param_type: "number", logicalNOT: false },
                { name: "is between", op: "between", param_type: "number-range", logicalNOT: false },
                { name: "is not between", op: "between", param_type: "number-range", logicalNOT: true },
                { name: "is blank", op: "isBlank", param_type: null, logicalNOT: false },
                { name: "is not blank", op: "isBlank", param_type: null, logicalNOT: true }
            ],
            "date": [
                { name: "equals", op: "eq", param_type: "date", logicalNOT: false },
                { name: "does not equal", op: "eq", param_type: "date", logicalNOT: true },
                { name: "is after", op: "ge", param_type: "date", logicalNOT: false },
                { name: "is before", op: "le", param_type: "date", logicalNOT: false },
                { name: "is between", op: "between", param_type: "date-range", logicalNOT: false },
                { name: "is not between", op: "between", param_type: "date-range", logicalNOT: true },
                { name: "is within", op: "near", param_type: "timespan-range", logicalNOT: false },
                { name: "is not within", op: "near", param_type: "timespan-range", logicalNOT: true },
                { name: "is older than", op: "older", param_type: "timespan", logicalNOT: false },
                { name: "is newer than", op: "newer", param_type: "timespan", logicalNOT: false },
                { name: "is blank", op: "isBlank", param_type: null, logicalNOT: false },
                { name: "is not blank", op: "isBlank", param_type: null, logicalNOT: true }
            ],
            "timecode": [
                { name: "equals", op: "eq", param_type: "timecode", logicalNOT: false },
                { name: "does not equal", op: "eq", param_type: "timecode", logicalNOT: true },
                { name: "is greater than", op: "ge", param_type: "timecode", logicalNOT: false },
                { name: "is less than", op: "le", param_type: "timecode", logicalNOT: false },
                { name: "is between", op: "between", param_type: "timecode-range", logicalNOT: false },
                { name: "is not between", op: "between", param_type: "timecode-range", logicalNOT: true },
                { name: "is blank", op: "isBlank", param_type: null, logicalNOT: false },
                { name: "is not blank", op: "isBlank", param_type: null, logicalNOT: true }
            ],
            "boolean": [
                { name: "is set", op: "isTrue", param_type: null, logicalNOT: false },
                { name: "is not set", op: "isFalse", param_type: null, logicalNOT: false }
            ],
            "special": [
                { name: "?", op: "sql", param_type: null, logicalNOT: false },
                { name: "?", op: "sig", param_type: null, logicalNOT: false } // clip signature
            ]
        };
        var QueryTermEditor = (function (_super) {
            __extends(QueryTermEditor, _super);
            function QueryTermEditor(parent, isOrTerm, fields, fieldDefLookupByID, fieldDefLookupByIdentifier, queryBuilder) {
                var _this = this;
                _super.call(this, $("<div class='queryTerm form-inline'>").appendTo(parent.$element));
                this.selectedFieldDef = null;
                this.fieldDataSource = new SimpleArrayDataSource();
                this.isOrTerm = isOrTerm;
                this.fields = fields;
                this.fieldDefLookupByID = fieldDefLookupByID;
                this.fieldDefLookupByIdentifier = fieldDefLookupByIdentifier;
                this.queryBuilder = queryBuilder;
                this.fieldListItems = [];
                logic.SpecialQueryFields.forEach(function (fieldDef) {
                    _this.fieldListItems.push({
                        value: fieldDef,
                        text: fieldDef.name,
                        tooltip: fieldDef.description,
                        cssClass: "special"
                    });
                });
                this.fields.sort(function (a, b) { return a.name > b.name ? 1 : -1; }).forEach(function (fieldDef) {
                    _this.fieldListItems.push({
                        value: fieldDef,
                        text: fieldDef.name,
                        tooltip: FieldDefinitionUtil.getTooltip(fieldDef),
                        cssClass: FieldDefinitionUtil.getCssClass(fieldDef)
                    });
                });
                var $div = $("<div class='form-group'>").appendTo(this.$element);
                this.lstField = ComboBox.create({ "class": "form-control input-sm" }, new SimpleArrayDataSource(this.fieldListItems), true, false, $div);
                $div = $("<div class='form-group'>").appendTo(this.$element);
                this.lstOperator = DropDownList.create({ "class": "form-control input-sm" }, $div);
                $div = $("<div class='form-group'>").appendTo(this.$element);
                this.valuePanel = new Panel($("<span>").appendTo($div));
                $div = $("<div class='form-group'>").appendTo(this.$element);
                this.removeBtn = new Button($("<button class='btn btn-link btn-tight'><span class='catdvicon catdvicon-remove'> </span></button>").appendTo($div));
                this.lstField.onChanged(function (evt) {
                    _this.handleFieldChanged();
                });
                this.lstOperator.onChanged(function (evt) {
                    _this.handleOperatorChanged();
                });
                this.handleFieldChanged();
            }
            QueryTermEditor.prototype.onRemove = function (removeHandler) {
                this.removeBtn.onClick(function (evt) {
                    removeHandler(evt);
                });
            };
            QueryTermEditor.prototype.getQueryTerm = function (ignoreCase) {
                var fieldDef = this.lstField.getSelectedValue();
                var field;
                if (fieldDef.isBuiltin) {
                    field = fieldDef.memberOf + "." + fieldDef.identifier;
                }
                else {
                    field = fieldDef.memberOf + "[" + fieldDef.identifier + "]";
                }
                var operator = this.operators[this.lstOperator.getSelectedIndex()];
                var op = operator.op;
                if (!fieldDef.isBuiltin) {
                    // Add type hint to operator for custom fields as pre-server 7 can't easily determine type
                    switch (operator.param_type) {
                        case "date":
                        case "date-range":
                        case "timespan":
                        case "timespan-range":
                            op += "_date";
                            break;
                        case "number":
                        case "number-range":
                            op += "_number";
                            break;
                        case "timecode":
                        case "timecode-range":
                            op += "_timecode";
                            break;
                    }
                }
                return {
                    field: field,
                    op: op,
                    params: this.getQueryParams(operator),
                    logicalOR: this.isOrTerm,
                    logicalNOT: operator.logicalNOT,
                    ignoreCase: ignoreCase
                };
            };
            QueryTermEditor.prototype.setQueryTerm = function (queryTerm) {
                var fieldDef = this.fieldDefLookupByIdentifier[queryTerm.field.replace(".userFields[", "[").replace(".metadata[", "[")];
                if (!fieldDef) {
                    fieldDef = FieldDefinitionUtil.makeDummyFieldDefinition(queryTerm.field);
                    this.fieldDataSource.setItems(this.fieldListItems.concat([{ text: fieldDef.name, value: fieldDef }]));
                    this.lstField.reload();
                }
                this.lstField.setSelectedValue(fieldDef);
                this.selectedFieldDef = fieldDef;
                this.updateOperatorList(fieldDef);
                var opertorInfo = this.operators.find(function (opertor) { return opertor.op == queryTerm.op && opertor.logicalNOT == queryTerm.logicalNOT; }) || this.operators[0];
                this.lstOperator.setSelectedValue(opertorInfo.logicalNOT ? "!" + opertorInfo.op : opertorInfo.op);
                this.updateValueControls(opertorInfo);
                this.setQueryParams(opertorInfo, queryTerm.params);
            };
            QueryTermEditor.prototype.handleFieldChanged = function () {
                this.selectedFieldDef = this.lstField.getSelectedValue();
                if (this.selectedFieldDef) {
                    this.updateOperatorList(this.selectedFieldDef);
                }
            };
            QueryTermEditor.prototype.handleOperatorChanged = function () {
                var operator = this.operators[this.lstOperator.getSelectedIndex()];
                this.updateValueControls(operator);
            };
            QueryTermEditor.prototype.updateOperatorList = function (fieldDef) {
                var fieldType = fieldDef.fieldType;
                var valueType;
                if (fieldDef.isBuiltin) {
                    switch (fieldType) {
                        case "date":
                        case "datetime":
                            valueType = "date";
                            break;
                        case "timecode":
                            valueType = "timecode";
                            break;
                        case "number":
                            valueType = "number";
                            break;
                        case "checkbox":
                            valueType = "boolean";
                            break;
                        default:
                            valueType = "text";
                            break;
                    }
                }
                else {
                    switch (fieldType) {
                        case "date":
                        case "datetime":
                            valueType = "date";
                            break;
                        default:
                            if (fieldType.startsWith("multi-")) {
                                valueType = "multi";
                            }
                            else {
                                valueType = "text";
                            }
                            break;
                    }
                }
                this.operators = operatorLookup[valueType];
                this.lstOperator.setItems(this.operators.map(function (operator) {
                    return {
                        value: (operator.logicalNOT ? "!" + operator.op : operator.op),
                        text: operator.name
                    };
                }));
                this.handleOperatorChanged();
            };
            QueryTermEditor.prototype.updateValueControls = function (operator) {
                var _this = this;
                this.valuePanel.clear();
                this.value1Field = null;
                this.value1ListField = null;
                this.value1Type = null;
                this.value2Field = null;
                if (operator) {
                    switch (operator.param_type) {
                        case "text":
                            if (FieldDefinitionUtil.hasValues(this.selectedFieldDef)) {
                                var dataSource = new CachedServerDataSource(function (callback) {
                                    FieldSettingsManager.getUniqueFieldValues(_this.selectedFieldDef, function (values) {
                                        callback(values.map(function (value) { return { text: value, value: value }; }));
                                    });
                                });
                                this.value1ListField = ComboBox.create({ "class": "form-control input-sm" }, dataSource, false, false, this.valuePanel);
                            }
                            else {
                                this.value1Field = TextBox.create({ "class": "form-control input-sm" }, this.valuePanel);
                            }
                            break;
                        case "number":
                            this.value1Field = TextBox.create({ "class": "form-control input-sm" }, this.valuePanel);
                            break;
                        case "number-range":
                            this.value1Field = TextBox.create({ "class": "form-control input-sm" }, this.valuePanel);
                            $("<span> and </span>").appendTo(this.valuePanel.$element);
                            this.value2Field = TextBox.create({ "class": "form-control input-sm" }, this.valuePanel);
                            break;
                        case "date":
                            this.value1Field = TextBox.create({ "type": "date", "class": "form-control input-sm" }, this.valuePanel);
                            break;
                        case "date-range":
                            this.value1Field = TextBox.create({ "type": "date", "class": "form-control input-sm" }, this.valuePanel);
                            $("<span> and </span>").appendTo(this.valuePanel.$element);
                            this.value2Field = TextBox.create({ "type": "date", "class": "form-control input-sm" }, this.valuePanel);
                            break;
                        case "timespan":
                            this.value1Field = TextBox.create({ "type": "number", "size": 4, "class": "form-control input-sm" }, this.valuePanel);
                            this.value1Type = DropDownList.create({ items: TIME_PERIOD_LIST_ITEMS }, this.valuePanel);
                            $("<span> ago </span>").appendTo(this.valuePanel.$element);
                            break;
                        case "timespan-range":
                            this.value1Field = TextBox.create({ "type": "number", "size": 4, "class": "form-control input-sm" }, this.valuePanel);
                            this.value1Type = DropDownList.create({ items: TIME_PERIOD_LIST_ITEMS }, this.valuePanel);
                            $("<span> of </span>").appendTo(this.valuePanel.$element);
                            this.value2Field = TextBox.create({ "type": "date", "class": "form-control input-sm" }, this.valuePanel);
                            break;
                        case "timecode":
                            this.value1Field = TextBox.create({ "class": "form-control input-sm" }, this.valuePanel);
                            break;
                        case "timecode-range":
                            this.value1Field = TextBox.create({ "type": "number", "class": "form-control input-sm" }, this.valuePanel);
                            $("<span> and </span>").appendTo(this.valuePanel.$element);
                            this.value2Field = TextBox.create({ "class": "form-control input-sm" }, this.valuePanel);
                            break;
                    }
                }
            };
            QueryTermEditor.prototype.getQueryParams = function (operator) {
                switch (operator.param_type) {
                    case "text":
                        if (FieldDefinitionUtil.hasValues(this.selectedFieldDef)) {
                            return this.value1ListField.getText();
                        }
                        else {
                            return this.value1Field.getText();
                        }
                    case "number":
                        return this.value1Field.getText();
                    case "date":
                        try {
                            return DateUtil.parse(this.value1Field.getText(), ISO_DATE).getTime().toString();
                        }
                        catch (formatException) {
                            return EPOC;
                        }
                    case "date-range":
                        try {
                            var date1 = DateUtil.parse(this.value1Field.getText(), ISO_DATE).getTime();
                            var date2 = DateUtil.parse(this.value2Field.getText(), ISO_DATE).getTime();
                            return "" + date1 + "," + date2;
                        }
                        catch (formatException) {
                            return EPOC + "," + EPOC;
                        }
                    case "number-range":
                        return this.value1Field.getText() + "," + this.value2Field.getText();
                    case "timespan":
                        return (Number(this.value1Field.getText()) * Number(this.value1Type.getSelectedValue())).toString();
                    case "timespan-range":
                        var seconds = Number(this.value1Field.getText()) * Number(this.value1Type.getSelectedValue());
                        return this.value2Field.getText() + "," + seconds;
                    case "timecode":
                        var timecode = TimecodeUtil.parseTimecode(this.value1Field.getText(), 1 /* TimecodeFormat.WHOLE_SECONDS_FORMAT */);
                        return "1," + timecode.frm;
                    case "timecode-range":
                        var timecode1 = TimecodeUtil.parseTimecode(this.value1Field.getText(), 1 /* TimecodeFormat.WHOLE_SECONDS_FORMAT */);
                        var timecode2 = TimecodeUtil.parseTimecode(this.value2Field.getText(), 1 /* TimecodeFormat.WHOLE_SECONDS_FORMAT */);
                        return "1," + timecode1.frm + "," + timecode2.frm;
                }
            };
            QueryTermEditor.prototype.setQueryParams = function (operator, params) {
                switch (operator.param_type) {
                    case "text":
                        if (FieldDefinitionUtil.hasValues(this.selectedFieldDef)) {
                            this.value1ListField.setSelectedValue(params);
                        }
                        else {
                            this.value1Field.setText(params);
                        }
                        break;
                    case "number":
                        this.value1Field.setText(params);
                        break;
                    case "number-range":
                        this.value1Field.setText(params.split(",")[0]);
                        this.value2Field.setText(params.split(",")[1]);
                        break;
                    case "date":
                        this.value1Field.setText(DateUtil.format(new Date(Number(params)), ISO_DATE));
                        break;
                    case "date-range":
                        this.value1Field.setText(DateUtil.format(new Date(Number(params.split(",")[0])), ISO_DATE));
                        this.value2Field.setText(DateUtil.format(new Date(Number(params.split(",")[1])), ISO_DATE));
                        break;
                    case "timespan":
                        this.value1Field.setText(params);
                        this.value1Type.setSelectedValue("1");
                        break;
                    case "timespan-range":
                        this.value1Field.setText(params.split(",")[0]);
                        this.value1Type.setSelectedValue("1");
                        this.value2Field.setText(params.split(",")[1]);
                        break;
                    case "timecode":
                        this.value1Field.setText(TimecodeUtil.formatTimecode({ secs: Number(params), fmt: 1 /* TimecodeFormat.WHOLE_SECONDS_FORMAT */ }));
                        break;
                    case "timecode-range":
                        this.value1Field.setText(TimecodeUtil.formatTimecode({ secs: Number(params.split(",")[1]), fmt: 1 /* TimecodeFormat.WHOLE_SECONDS_FORMAT */ }));
                        this.value2Field.setText(TimecodeUtil.formatTimecode({ secs: Number(params.split(",")[2]), fmt: 1 /* TimecodeFormat.WHOLE_SECONDS_FORMAT */ }));
                        break;
                }
            };
            return QueryTermEditor;
        }(Panel));
        var FetchRelatedPanel = (function (_super) {
            __extends(FetchRelatedPanel, _super);
            function FetchRelatedPanel() {
                _super.apply(this, arguments);
            }
            return FetchRelatedPanel;
        }(Panel));
        var QueryBuilderPanel = (function (_super) {
            __extends(QueryBuilderPanel, _super);
            function QueryBuilderPanel(element) {
                var _this = this;
                _super.call(this, element);
                this.andTermEditors = [];
                this.orTermEditors = [];
                this.$element.addClass("queryBuilder");
                var $topPanel = $("<div class='panel panel-default'>").appendTo(this.$element);
                $("<div class='panel-heading'>Find clips where all these are true</div>").appendTo($topPanel);
                var $panelBody = $("<div class='panel-body'>").appendTo($topPanel);
                this.andTermsPanel = new Panel($("<div class='termsPanel andTermsPanel'></div>").appendTo($panelBody));
                this.btnAddAndTerm = new Button($("<button class='btn btn-link'><span class='catdvicon catdvicon-add'> </span> Add Term</button>").appendTo($panelBody));
                this.btnAddAndTerm.onClick(function (evt) { return _this.addTermEditor(_this.andTermsPanel, _this.andTermEditors, false); });
                var $bottomPanel = $("<div class='panel panel-default'>").appendTo(this.$element);
                $("<div class='panel-heading'>And at least one of these</div>").appendTo($bottomPanel);
                var $panelBody2 = $("<div class='panel-body'>").appendTo($bottomPanel);
                this.orTermsPanel = new Panel($("<div class='termsPanel andTermsPanel'></div>").appendTo($panelBody2));
                this.btnAddOrTerm = new Button($("<button class='btn btn-link'><span class='catdvicon catdvicon-add'> </span> Add Term</button>").appendTo($panelBody2));
                this.btnAddOrTerm.onClick(function (evt) { return _this.addTermEditor(_this.orTermsPanel, _this.orTermEditors, true); });
                var $checkbox = $("<label><input type='checkbox'> Ignore Case</label>").appendTo(this.$element);
                this.chkIgnoreCase = new CheckBox($checkbox.find("input"));
                // Build lookup tables mapping ID to FieldDefinition
                this.fieldDefLookupByID = {};
                this.fieldDefLookupByIdentifier = {};
                // Add magic query fields (Name/Notes, Any Log Field, etc.) first  
                logic.SpecialQueryFields.forEach(function (fieldDef) {
                    _this.fieldDefLookupByID[fieldDef.ID] = fieldDef;
                    _this.fieldDefLookupByIdentifier[FieldDefinitionUtil.getLongIdentifier(fieldDef)] = fieldDef;
                });
                // Then load the rest of the definitions from the server
                FieldSettingsManager.getQueryFieldDefinitions(function (queryFieldDefs) {
                    _this.fields = queryFieldDefs;
                    // Build lookup table
                    queryFieldDefs.forEach(function (fieldDef) {
                        _this.fieldDefLookupByID[fieldDef.ID] = fieldDef;
                        _this.fieldDefLookupByIdentifier[FieldDefinitionUtil.getLongIdentifier(fieldDef)] = fieldDef;
                    });
                    _this.addTermEditor(_this.andTermsPanel, _this.andTermEditors, false);
                });
            }
            QueryBuilderPanel.prototype.getQuery = function () {
                var _this = this;
                var terms = [];
                this.andTermEditors.forEach(function (termEditor) { return terms.push(termEditor.getQueryTerm(_this.chkIgnoreCase.isChecked())); });
                this.orTermEditors.forEach(function (termEditor) { return terms.push(termEditor.getQueryTerm(_this.chkIgnoreCase.isChecked())); });
                return {
                    name: "Query",
                    terms: terms
                };
            };
            QueryBuilderPanel.prototype.setQuery = function (query) {
                var _this = this;
                this.andTermsPanel.clear();
                this.andTermEditors = [];
                this.orTermsPanel.clear();
                this.orTermEditors = [];
                var ignoreCase = false;
                query.terms.forEach(function (queryTerm) {
                    var termEditor;
                    if (queryTerm.logicalOR) {
                        termEditor = _this.addTermEditor(_this.orTermsPanel, _this.orTermEditors, true);
                    }
                    else {
                        termEditor = _this.addTermEditor(_this.andTermsPanel, _this.andTermEditors, false);
                    }
                    termEditor.setQueryTerm(queryTerm);
                    ignoreCase = ignoreCase || queryTerm.ignoreCase;
                });
                this.chkIgnoreCase.setChecked(ignoreCase);
            };
            QueryBuilderPanel.prototype.clearQuery = function () {
                this.setQuery({ terms: [] });
                this.addTermEditor(this.andTermsPanel, this.andTermEditors, false);
            };
            QueryBuilderPanel.prototype.addTermEditor = function (parent, termEditors, isOrTerm) {
                var _this = this;
                var termEditor = new QueryTermEditor(parent, isOrTerm, this.fields, this.fieldDefLookupByID, this.fieldDefLookupByIdentifier, this);
                termEditors.push(termEditor);
                termEditor.onRemove(function (evt) {
                    termEditor.$element.remove();
                    termEditors.splice(termEditors.indexOf(termEditor), 1);
                    _this.updateQueryButton();
                });
                this.updateQueryButton();
                return termEditor;
            };
            QueryBuilderPanel.prototype.updateQueryButton = function () {
                if ((this.andTermEditors.length > 0) || (this.orTermEditors.length > 0)) {
                    $(".run-query-action").removeAttr("disabled");
                }
                else {
                    $(".run-query-action").attr("disabled", "disabled");
                }
            };
            return QueryBuilderPanel;
        }(Panel));
        panels.QueryBuilderPanel = QueryBuilderPanel;
        var SimpleSearchForm = (function (_super) {
            __extends(SimpleSearchForm, _super);
            function SimpleSearchForm(element) {
                _super.call(this, element);
                this.searchFormFields = null;
            }
            SimpleSearchForm.prototype.load = function (callback) {
                var _this = this;
                if (this.searchFormFields == null) {
                    SearchFormManager.getSearchForm(function (searchForm) {
                        _this.searchFormFields = [];
                        if (searchForm && searchForm.fields) {
                            var $searchFormTable = $("<table id='tblSearchForm' class='searchForm'></table>").appendTo(_this.$element);
                            searchForm.fields.forEach(function (field, f) {
                                var fieldDef = field.fieldDefinition;
                                if (fieldDef) {
                                    var fieldID = "uf_" + f;
                                    var $tr = $("<tr><th>" + HtmlUtil.escapeHtml(field.fieldDefinition.name) + "</th></tr>").appendTo($searchFormTable);
                                    var $td = $("<td></td>").appendTo($tr);
                                    fieldDef.isEditable = true;
                                    var searchField;
                                    if (fieldDef.fieldType.contains("picklist") || fieldDef.fieldType.contains("hierarchy")
                                        || fieldDef.fieldType.contains("auto-suggest")) {
                                        searchField = new ComboBoxField(fieldID, field, true, $td);
                                    }
                                    else if ((fieldDef.fieldType == "multi-checkbox") || (fieldDef.fieldType == "radio")) {
                                        searchField = new MultiCheckboxField(fieldID, field, $td);
                                    }
                                    else if (fieldDef.fieldType == "checkbox") {
                                        searchField = new CheckBoxField(fieldID, field, $td);
                                    }
                                    else {
                                        searchField = new TextField(fieldID, field, $td);
                                    }
                                    searchField.setEditable(true);
                                    _this.searchFormFields.push(searchField);
                                }
                            });
                        }
                        callback(_this.searchFormFields.length);
                    });
                }
                else {
                    callback(this.searchFormFields.length);
                }
            };
            SimpleSearchForm.prototype.hasFields = function () {
                return this.searchFormFields.length > 0;
            };
            SimpleSearchForm.prototype.clearQueryTerms = function () {
                this.setQueryTerms([]);
            };
            SimpleSearchForm.prototype.setQueryTerms = function (queryTerms) {
                if (this.searchFormFields) {
                    var t = 0;
                    this.searchFormFields.forEach(function (searchFormField) {
                        if ((t < queryTerms.length) && (queryTerms[t].field == FieldDefinitionUtil.getLongIdentifier(searchFormField.fieldDef))) {
                            searchFormField.setValue(queryTerms[t++].params);
                        }
                        else {
                            searchFormField.setValue(null);
                        }
                    });
                }
            };
            SimpleSearchForm.prototype.getQueryTerms = function () {
                var terms = [];
                if (this.searchFormFields) {
                    this.searchFormFields.forEach(function (searchFormField) {
                        var value = searchFormField.getValue();
                        if (value) {
                            if (searchFormField.fieldDef.fieldType == "checkbox") {
                                if (value === true) {
                                    terms.push({ field: FieldDefinitionUtil.getLongIdentifier(searchFormField.fieldDef), op: "eq", params: "true" });
                                }
                            }
                            else if (value instanceof Array) {
                                var values = value.join(",");
                                terms.push({ field: FieldDefinitionUtil.getLongIdentifier(searchFormField.fieldDef), op: "isOneOf", params: values });
                            }
                            else {
                                terms.push({ field: FieldDefinitionUtil.getLongIdentifier(searchFormField.fieldDef), op: "startsWith", params: value });
                            }
                        }
                    });
                }
                return terms;
            };
            return SimpleSearchForm;
        }(Panel));
        panels.SimpleSearchForm = SimpleSearchForm;
    })(panels = ui.panels || (ui.panels = {}));
})(ui || (ui = {}));
