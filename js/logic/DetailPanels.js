var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var logic;
(function (logic) {
    var DateUtil = catdv.DateUtil;
    var FormatUtil = util.FormatUtil;
    var HtmlUtil = util.HtmlUtil;
    var Element = controls.Element;
    var TextBox = controls.TextBox;
    var TextArea = controls.TextArea;
    var CheckBox = controls.CheckBox;
    var DropDownTree = controls.DropDownTree;
    var ComboBox = controls.ComboBox;
    var Image = controls.Image;
    var HyperLink = controls.HyperLink;
    var MultiSelectDropDownList = controls.MultiSelectDropDownList;
    var ExtensibleListDataSource = controls.ExtensibleListDataSource;
    var Console = controls.Console;
    var PanelSettingsManager = logic.PanelSettingsManager;
    var FieldSettingsManager = logic.FieldSettingsManager;
    var DetailPanelManager = (function () {
        function DetailPanelManager() {
        }
        DetailPanelManager.getPanelDefinitions = function (clip, clipUID, callback) {
            PanelSettingsManager.getPanelDefinitions(clip.catalog.groupID, clipUID, function (panels) {
                if ((panels != null) && (panels.length > 0)) {
                    callback(panels);
                }
                else {
                    DetailPanelManager.getDefaultPanelDefs(clip, callback);
                }
            });
        };
        DetailPanelManager.getDefaultPanelDefs = function (clip, callback) {
            var summaryPanel = { name: "Summary", fields: [] };
            DetailPanelManager.summaryDetailFields.forEach(function (fieldDefID) {
                var fieldDef = logic.BuiltInFields[fieldDefID];
                if (fieldDef) {
                    summaryPanel.fields.push({
                        fieldDefID: fieldDefID,
                        fieldDefinition: fieldDef,
                        options: {
                            multiline: (fieldDefID == "NT")
                        }
                    });
                }
            });
            var userfieldPanel = {
                name: "Log Notes", fields: [
                    {
                        fieldDefID: "NT",
                        fieldDefinition: logic.BuiltInFields["NT"],
                        options: {
                            multiline: true
                        }
                    }
                ]
            };
            FieldSettingsManager.getUserFieldDefinitions(clip.catalog.groupID, function (fieldDefinitions) {
                var fieldDefLookup = {};
                fieldDefinitions.forEach(function (fieldDefinition) {
                    fieldDefLookup[fieldDefinition.identifier] = fieldDefinition;
                });
                if (clip.userFields) {
                    for (var propertyName in clip.userFields) {
                        var fieldDef = fieldDefLookup[propertyName];
                        if (fieldDef) {
                            userfieldPanel.fields.push({
                                fieldDefinition: fieldDef
                            });
                        }
                        else {
                            userfieldPanel.fields.push({
                                fieldDefinition: {
                                    fieldType: "text",
                                    memberOf: "clip",
                                    fieldGroupID: null,
                                    identifier: propertyName,
                                    name: propertyName.replace(new RegExp('^U'), "User "),
                                    isEditable: false,
                                    isMandatory: false,
                                    isMultiValue: false,
                                    isList: false
                                }
                            });
                        }
                    }
                }
                var metadataPanel = { name: "Technical", fields: [] };
                // Build list of metadata attributes based on the metadata for this clip
                if (clip.media && clip.media.metadata) {
                    var metadataFieldNames = Object.getOwnPropertyNames(clip.media.metadata);
                    metadataFieldNames.sort().forEach(function (metadataFieldName) {
                        if ((metadataFieldName.length != 4) || metadataFieldName.match(/^[A-Z][A-Za-z0-9:._ ]+$/)) {
                            metadataPanel.fields.push({
                                fieldDefinition: {
                                    fieldType: "text",
                                    memberOf: "media",
                                    fieldGroupID: null,
                                    identifier: metadataFieldName,
                                    name: metadataFieldName,
                                    isEditable: false,
                                    isMandatory: false,
                                    isMultiValue: false,
                                    isList: false
                                }
                            });
                        }
                    });
                }
                var panels = [summaryPanel];
                if (userfieldPanel.fields.length > 0)
                    panels.push(userfieldPanel);
                if (metadataPanel.fields.length > 0)
                    panels.push(metadataPanel);
                callback(panels);
            });
        };
        DetailPanelManager.summaryDetailFields = [
            "NM1", "IO", "D1", "IO2", "D2", "FF", "VF", "AF", "MS", "RTGTYP", "OWNER",
            "CAT", "CGRP", "BN", "STS", "TP", "TY1", "MK", "HID",
            "RD1", "MD1", "MD2", "MF", "PF", "ASP", "HIS"
        ];
        return DetailPanelManager;
    }());
    logic.DetailPanelManager = DetailPanelManager;
    var DetailPanelField = (function () {
        function DetailPanelField(fieldID, panelField) {
            this.changeHandler = null;
            this.fieldID = fieldID;
            this.panelField = panelField;
            this.fieldDef = panelField.fieldDefinition;
        }
        DetailPanelField.prototype.onChanged = function (changeHandler) {
            this.changeHandler = changeHandler;
        };
        DetailPanelField.prototype.raiseChangeEvent = function (evt) {
            Console.debug(this.fieldDef.name + " changed");
            if (this.changeHandler)
                this.changeHandler(evt);
        };
        DetailPanelField.prototype.setEditable = function (editable) { };
        DetailPanelField.prototype.setError = function (error) { };
        DetailPanelField.prototype.setLinkedToField = function (linkedToField) { };
        DetailPanelField.prototype.getValue = function () { };
        DetailPanelField.prototype.setValue = function (value) { };
        return DetailPanelField;
    }());
    logic.DetailPanelField = DetailPanelField;
    var FieldBinding = (function () {
        function FieldBinding(detailField, fieldAccessor) {
            this.detailField = detailField;
            this.fieldAccessor = fieldAccessor;
            this.edited = false;
        }
        return FieldBinding;
    }());
    logic.FieldBinding = FieldBinding;
    var TextField = (function (_super) {
        __extends(TextField, _super);
        function TextField(fieldID, panelField, $parent) {
            var _this = this;
            _super.call(this, fieldID, panelField);
            this.textBox = TextBox.create({ "id": this.fieldID, "type": "text", "readonly": true }, $parent);
            this.textBox.onInput(function (evt) { return _super.prototype.raiseChangeEvent.call(_this, evt); });
        }
        TextField.prototype.setEditable = function (editable) {
            if (!this.fieldDef.isEditable || !editable) {
                this.textBox.setReadOnly(true);
                this.textBox.$element.removeClass("editable");
            }
            else {
                this.textBox.setReadOnly(false);
                this.textBox.$element.addClass("editable");
            }
        };
        TextField.prototype.getValue = function () {
            return this.textBox.getText();
        };
        TextField.prototype.setValue = function (value) {
            this.textBox.setText(value);
        };
        return TextField;
    }(DetailPanelField));
    logic.TextField = TextField;
    var FormattedNumericTextField = (function (_super) {
        __extends(FormattedNumericTextField, _super);
        function FormattedNumericTextField(fieldID, panelField, formatter, $parent) {
            _super.call(this, fieldID, panelField);
            this.formatter = formatter;
            this.textBox = TextBox.create({ "id": this.fieldID, "type": "text", "readonly": true }, $parent);
        }
        FormattedNumericTextField.prototype.setEditable = function (editable) {
            // never editable
        };
        FormattedNumericTextField.prototype.getValue = function () {
            return this.originalValue;
        };
        FormattedNumericTextField.prototype.setValue = function (value) {
            this.originalValue = value;
            var numValue = value ? parseInt(value) : null;
            if (numValue != null) {
                this.textBox.setText(this.formatter(numValue));
            }
            else {
                this.textBox.setText("");
            }
        };
        return FormattedNumericTextField;
    }(DetailPanelField));
    logic.FormattedNumericTextField = FormattedNumericTextField;
    var DateTimeField = (function (_super) {
        __extends(DateTimeField, _super);
        function DateTimeField(fieldID, panelField, $parent) {
            var _this = this;
            _super.call(this, fieldID, panelField);
            var inputType;
            switch (this.fieldDef.fieldType) {
                case "date":
                    inputType = "date";
                    break;
                case "datetime":
                    inputType = "datetime";
                    break;
                case "time":
                    inputType = "time";
                    break;
                case "number":
                    inputType = "number";
                    break;
                default:
                    inputType = "text";
                    break;
            }
            this.textBox = TextBox.create({ "id": this.fieldID, "type": inputType, "readonly": true }, $parent);
            this.textBox.onChanged(function (evt) { return _super.prototype.raiseChangeEvent.call(_this, evt); });
        }
        DateTimeField.prototype.setEditable = function (editable) {
            if (!this.fieldDef.isEditable || !editable) {
                this.textBox.setReadOnly(true);
                this.textBox.$element.removeClass("editable");
            }
            else {
                this.textBox.setReadOnly(false);
                this.textBox.$element.addClass("editable");
            }
        };
        DateTimeField.prototype.getValue = function () {
            var value = this.textBox.getText().trim();
            if (value) {
                switch (this.fieldDef.fieldType) {
                    case "date":
                        return DateUtil.parse(value, DateUtil.ISO_DATE_FORMAT);
                    case "datetime":
                        return DateUtil.parse(value, DateUtil.ISO_DATETIME_FORMAT);
                    case "time":
                        return DateUtil.parse(value, DateUtil.ISO_TIME_FORMAT);
                    default:
                        return value;
                }
            }
            else {
                return null;
            }
        };
        DateTimeField.prototype.setValue = function (value) {
            this.textBox.setText(this.formatValue(value));
        };
        // TODO: We are using HTML input type="date/datetime/time" which use ISO as their wire format
        // but display the date in the local machine's format. However, not all browsers support this
        // so ideally we'd format the dates using the server-side date format preference, if it's a browser
        // that doesn't support type="date". Or we need to write our own date picker control....
        DateTimeField.prototype.formatValue = function (value) {
            if (!value)
                return "";
            switch (this.fieldDef.fieldType) {
                case "date":
                    return DateUtil.format(value, DateUtil.ISO_DATE_FORMAT);
                case "datetime":
                    return DateUtil.format(value, DateUtil.ISO_DATETIME_FORMAT);
                case "time":
                    return DateUtil.format(value, DateUtil.ISO_TIME_FORMAT);
                default:
                    return value;
            }
        };
        return DateTimeField;
    }(DetailPanelField));
    logic.DateTimeField = DateTimeField;
    var MultilineField = (function (_super) {
        __extends(MultilineField, _super);
        function MultilineField(fieldID, panelField, $parent) {
            var _this = this;
            _super.call(this, fieldID, panelField);
            this.textarea = TextArea.create({ "id": this.fieldID, "rows": 4, "readonly": true }, $parent);
            this.textarea.onInput(function (evt) { return _super.prototype.raiseChangeEvent.call(_this, evt); });
        }
        MultilineField.prototype.setEditable = function (editable) {
            if (!this.fieldDef.isEditable || !editable) {
                this.textarea.setReadOnly(true);
                this.textarea.$element.removeClass("editable");
            }
            else {
                this.textarea.setReadOnly(false);
                this.textarea.$element.addClass("editable");
            }
        };
        MultilineField.prototype.getValue = function () {
            return this.textarea.getText();
        };
        MultilineField.prototype.setValue = function (value) {
            this.textarea.setText(value);
        };
        return MultilineField;
    }(DetailPanelField));
    logic.MultilineField = MultilineField;
    var CheckBoxField = (function (_super) {
        __extends(CheckBoxField, _super);
        function CheckBoxField(fieldID, panelField, $parent) {
            var _this = this;
            _super.call(this, fieldID, panelField);
            this.checkbox = CheckBox.create({ "id": this.fieldID, "disabled": "true", "class": "readonly" }, $parent);
            if (this.fieldDef.data) {
                $(document.createTextNode(this.fieldDef.data)).appendTo($parent);
            }
            this.checkbox.onChanged(function (evt) {
                _this.value = _this.checkbox.isChecked();
                _super.prototype.raiseChangeEvent.call(_this, evt);
            });
        }
        CheckBoxField.prototype.setEditable = function (editable) {
            this.checkbox.setEnabled(this.fieldDef.isEditable && editable);
        };
        CheckBoxField.prototype.getValue = function () {
            return this.value;
        };
        CheckBoxField.prototype.setValue = function (value) {
            this.value = value;
            this.checkbox.setChecked(value && (String(value).toLowerCase() == "true"));
        };
        return CheckBoxField;
    }(DetailPanelField));
    logic.CheckBoxField = CheckBoxField;
    var RadioButtonsField = (function (_super) {
        __extends(RadioButtonsField, _super);
        function RadioButtonsField(fieldID, panelField, $parent) {
            var _this = this;
            _super.call(this, fieldID, panelField);
            this.values = null;
            this.values = (this.fieldDef.data) ? this.fieldDef.data.split("\n") : [];
            var html = "";
            this.values.forEach(function (value) {
                html += "<input type='radio' name='" + _this.fieldID + "' value='" + HtmlUtil.escapeHtml(value) + "' disabled>" + HtmlUtil.escapeHtml(value);
            });
            $parent.html(html);
            $("input[type=radio][name=" + this.fieldID + "]").on("change", function (evt) { return _super.prototype.raiseChangeEvent.call(_this, evt); });
        }
        RadioButtonsField.prototype.setEditable = function (editable) {
            if (this.fieldDef.isEditable) {
                $("input[name=" + this.fieldID + "]").prop("disabled", !editable);
            }
        };
        RadioButtonsField.prototype.getValue = function () {
            return $("input[name=" + this.fieldID + "]:checked").val();
        };
        RadioButtonsField.prototype.setValue = function (value) {
            $("input[name=" + this.fieldID + "][value='" + value + "']").prop("checked", true);
        };
        return RadioButtonsField;
    }(DetailPanelField));
    logic.RadioButtonsField = RadioButtonsField;
    var MultiCheckboxField = (function (_super) {
        __extends(MultiCheckboxField, _super);
        function MultiCheckboxField(fieldID, panelField, $parent) {
            var _this = this;
            _super.call(this, fieldID, panelField);
            this.values = null;
            this.values = (this.fieldDef.data) ? this.fieldDef.data.split("\n") : [];
            var html = "";
            this.values.forEach(function (value, p) {
                html += "<input type='checkbox' id='" + _this.fieldID + "_" + p + "' name='" + _this.fieldID + "' disabled >" + HtmlUtil.escapeHtml(value);
            });
            $parent.html(html);
            $("input[type=checkbox][name=" + this.fieldID + "]").on("change", function (evt) { return _super.prototype.raiseChangeEvent.call(_this, evt); });
        }
        MultiCheckboxField.prototype.setEditable = function (editable) {
            if (this.fieldDef.isEditable) {
                $("input[id^=" + this.fieldID + "]").prop("disabled", !editable);
            }
        };
        MultiCheckboxField.prototype.getValue = function () {
            var _this = this;
            var selectedCheckboxes = $("input[id^=" + this.fieldID + "]:checked");
            if (selectedCheckboxes.length > 0) {
                var values = [];
                selectedCheckboxes.each(function (i, selectedCheckbox) {
                    var valueIndex = Number(selectedCheckbox.id.substring(selectedCheckbox.id.lastIndexOf("_") + 1));
                    values.push(_this.values[valueIndex]);
                });
                return values;
            }
            else {
                return null;
            }
        };
        MultiCheckboxField.prototype.setValue = function (value) {
            var _this = this;
            $("input[id^=" + this.fieldID + "]").prop("checked", false);
            if (value) {
                var values = value instanceof Array ? value : value.toString().split(",");
                this.values.forEach(function (value, p) {
                    var isSelected = values.contains(value);
                    $("#" + _this.fieldID + "_" + p).prop("checked", isSelected ? true : false);
                });
            }
        };
        return MultiCheckboxField;
    }(DetailPanelField));
    logic.MultiCheckboxField = MultiCheckboxField;
    var ComboBoxField = (function (_super) {
        __extends(ComboBoxField, _super);
        function ComboBoxField(fieldID, panelField, isExtensible, $parent) {
            var _this = this;
            _super.call(this, fieldID, panelField);
            var values = (this.fieldDef.picklist && this.fieldDef.picklist.values) ? [""].concat(this.fieldDef.picklist.values) : [""];
            this.fixedValues = !isExtensible;
            this.dataSource = new ExtensibleListDataSource(values);
            this.comboBox = ComboBox.create({ "id": fieldID }, this.dataSource, this.fixedValues, false, $parent);
            this.comboBox.setEnabled(false);
            this.comboBox.onChanged(function (evt) { return _super.prototype.raiseChangeEvent.call(_this, evt); });
        }
        ComboBoxField.prototype.setEditable = function (editable) {
            this.comboBox.setEnabled(this.fieldDef.isEditable && editable);
        };
        ComboBoxField.prototype.getValue = function () {
            return this.comboBox.getText();
        };
        ComboBoxField.prototype.setValue = function (value) {
            if (this.fixedValues) {
                if (this.dataSource.maybeAddExtendedValues([value])) {
                    this.comboBox.reload();
                }
                this.comboBox.setSelectedValue(value);
            }
            else {
                this.comboBox.setSelectedValue(value);
            }
        };
        return ComboBoxField;
    }(DetailPanelField));
    logic.ComboBoxField = ComboBoxField;
    var MultiSelectPicklistField = (function (_super) {
        __extends(MultiSelectPicklistField, _super);
        function MultiSelectPicklistField(fieldID, panelField, $parent) {
            var _this = this;
            _super.call(this, fieldID, panelField);
            var values = (this.fieldDef.picklist && this.fieldDef.picklist.values) ? this.fieldDef.picklist.values : [];
            this.dataSource = new ExtensibleListDataSource(values);
            this.dropDownList = MultiSelectDropDownList.create({ "id": fieldID }, true, this.dataSource, $parent);
            this.dropDownList.setEnabled(false);
            this.dropDownList.onChanged(function (evt) { return _super.prototype.raiseChangeEvent.call(_this, evt); });
        }
        MultiSelectPicklistField.prototype.setEditable = function (editable) {
            this.dropDownList.setEnabled(this.fieldDef.isEditable && editable);
        };
        MultiSelectPicklistField.prototype.getValue = function () {
            return this.dropDownList.getSelectedValues();
        };
        MultiSelectPicklistField.prototype.setValue = function (value) {
            var values = value;
            if (this.dataSource.maybeAddExtendedValues(values)) {
                this.dropDownList.reload();
            }
            this.dropDownList.setSelectedValues(values);
        };
        return MultiSelectPicklistField;
    }(DetailPanelField));
    logic.MultiSelectPicklistField = MultiSelectPicklistField;
    var HierarchyField = (function (_super) {
        __extends(HierarchyField, _super);
        function HierarchyField(fieldID, panelField, isExtensible, $parent) {
            var _this = this;
            _super.call(this, fieldID, panelField);
            this.linkedToField = null;
            this.originalValues = (this.fieldDef.picklist && this.fieldDef.picklist.values) ? [""].concat(this.fieldDef.picklist.values) : [""];
            this.dataSourceItems = this.originalValues.map(function (s) { return { value: s, text: s }; });
            this.dataSource = {
                getItems: function (params, callback) {
                    if (_this.linkedToField != null) {
                        callback(_this.dataSourceItems.filter(function (item) { return item.value.startsWith(_this.linkedToField.getValue()); }));
                    }
                    else {
                        callback(_this.dataSourceItems);
                    }
                }
            };
            this.dropDownTree = DropDownTree.create({ "id": fieldID }, this.dataSource, $parent);
            this.dropDownTree.setEnabled(false);
            this.dropDownTree.onChanged(function (evt) { return _super.prototype.raiseChangeEvent.call(_this, evt); });
        }
        HierarchyField.prototype.setEditable = function (editable) {
            this.dropDownTree.setEnabled(this.fieldDef.isEditable && editable);
        };
        HierarchyField.prototype.getValue = function () {
            return this.dropDownTree.getSelectedValue();
        };
        HierarchyField.prototype.setValue = function (value) {
            var unknownValue = (value && !this.originalValues.contains(value));
            if ((this.dataSourceItems.length != this.originalValues.length) || unknownValue) {
                var values = this.originalValues;
                if (unknownValue) {
                    values = this.originalValues.concat(value);
                }
                this.dataSourceItems = values.map(function (s) { return { value: s, text: s }; });
                this.dropDownTree.reload();
            }
            this.dropDownTree.setSelectedValue(value);
        };
        HierarchyField.prototype.setLinkedToField = function (linkedToField) {
            this.linkedToField = linkedToField;
            this.dropDownTree.setAlwaysReload(this.linkedToField ? true : false);
            this.dropDownTree.setOnlyShowLeafInText(this.linkedToField ? true : false);
        };
        return HierarchyField;
    }(DetailPanelField));
    logic.HierarchyField = HierarchyField;
    var HtmlField = (function (_super) {
        __extends(HtmlField, _super);
        function HtmlField(fieldID, panelField, $parent) {
            _super.call(this, fieldID, panelField);
            this.div = new Element($("<div id='" + this.fieldID + "' class='html-field'></div>").appendTo($parent));
        }
        HtmlField.prototype.setEditable = function (editable) {
            // never editable
        };
        HtmlField.prototype.getValue = function () {
            // readonly
        };
        HtmlField.prototype.setValue = function (value) {
            var $div = this.div.$element;
            $div.html((value instanceof Array) ? Array(value).join(",") : value);
            $div.find("a").each(function (i, a) {
                var href = $(a).attr("href");
                if (href.startsWith("catdv://clip/")) {
                    $(a).attr("href", href.replace("catdv://clip/", logic.Config.viewClipUrl + "?id="));
                    $(a).attr("target", "_blank");
                }
            });
        };
        return HtmlField;
    }(DetailPanelField));
    logic.HtmlField = HtmlField;
    var MediaPathField = (function (_super) {
        __extends(MediaPathField, _super);
        function MediaPathField(fieldID, panelField, $parent) {
            _super.call(this, fieldID, panelField);
            this.div = new Element($("<div id='" + this.fieldID + "' style='position:relative;' class='mediaPath'></div>").appendTo($parent));
        }
        MediaPathField.prototype.setEditable = function (editable) {
            // never editable
        };
        MediaPathField.prototype.getValue = function () {
            // readonly
        };
        MediaPathField.prototype.setValue = function (value) {
            if (value) {
                var path = value.path;
                var downloadUrl = value.downloadUrl;
                var viewUrl = value.viewUrl;
                this.div.$element.empty();
                if (path) {
                    if (downloadUrl && viewUrl) {
                        $("<a href='" + encodeURI(viewUrl) + "' style='position:absolute;display:block;overflow:hidden;left:0px;right:90px;' target='_blank'></a>").appendTo(this.div.$element).text(path);
                        $("<a href='" + encodeURI(downloadUrl) + "' class='btn btn-default btn-xs pull-right'>Download</a>").appendTo(this.div.$element);
                    }
                    else {
                        this.div.$element.text(path);
                    }
                }
            }
            else {
                this.div.$element.text("");
            }
        };
        return MediaPathField;
    }(DetailPanelField));
    logic.MediaPathField = MediaPathField;
    var RatingField = (function (_super) {
        __extends(RatingField, _super);
        function RatingField(fieldID, panelField, $parent) {
            var _this = this;
            _super.call(this, fieldID, panelField);
            this.$stars = [];
            this.editable = true;
            this.trackingMouse = false;
            this.div = new Element($("<div id='" + this.fieldID + "' class='ratings'></div>").appendTo($parent));
            // add extra blank item to left of stars to allow zero stars to be selected
            for (var i = 0; i <= 5; i++) {
                if (i == 0) {
                    this.$stars[i] = $("<span>&nbsp;</span>").appendTo(this.div.$element);
                }
                else {
                    this.$stars[i] = $("<span class='star'>" + RatingField.OUTLINE_STAR + "</span>").appendTo(this.div.$element);
                }
                this.attachClickEvent(this.$stars[i], i);
            }
            this.div.$element.mouseleave(function () {
                _this.trackingMouse = false;
            });
            this.div.$element.mouseup(function () {
                _this.trackingMouse = false;
            });
        }
        RatingField.prototype.setEditable = function (editable) {
            this.editable = editable;
        };
        RatingField.prototype.getValue = function () {
            return this.rating != null ? this.rating : "";
        };
        RatingField.prototype.setValue = function (value) {
            this.rating = value ? Number(value) : null;
            var numStars = (this.rating != null) ? Math.min(Math.max(this.rating || 0, 0), 5) : 0;
            for (var j = 1; j <= 5; j++) {
                if (j <= numStars) {
                    this.$stars[j].html(RatingField.SOLID_STAR).removeClass("deselected");
                }
                else {
                    this.$stars[j].html(RatingField.OUTLINE_STAR).addClass("deselected");
                }
            }
        };
        // This is in its own method so it gets the current value of index
        RatingField.prototype.attachClickEvent = function ($star, index) {
            var _this = this;
            $star.mousedown(function (evt) {
                if (index !== _this.rating) {
                    _this.setValue(index);
                    _super.prototype.raiseChangeEvent.call(_this, evt);
                }
                _this.trackingMouse = true;
            });
            $star.mousemove(function (evt) {
                if (_this.trackingMouse) {
                    if (index !== _this.rating) {
                        _this.setValue(index);
                        _super.prototype.raiseChangeEvent.call(_this, evt);
                    }
                }
            });
            $star.mouseup(function () {
                _this.trackingMouse = false;
            });
        };
        RatingField.OUTLINE_STAR = "&#9734;";
        RatingField.SOLID_STAR = "&#9733;";
        return RatingField;
    }(DetailPanelField));
    logic.RatingField = RatingField;
    var ClipTypeField = (function (_super) {
        __extends(ClipTypeField, _super);
        function ClipTypeField(fieldID, panelField, $parent) {
            _super.call(this, fieldID, panelField);
            this.image = Image.create({ "id": this.fieldID, "class": "typeicon", "src": "" }, $parent);
        }
        ClipTypeField.prototype.setEditable = function (editable) {
            // Never editable
        };
        ClipTypeField.prototype.getValue = function () {
            return this.clipType;
        };
        ClipTypeField.prototype.setValue = function (value) {
            this.clipType = value;
            this.image.setSourceUrl(logic.TypeIconColumn.CLIP_TYPE_IMAGE_PATH + "/cliptype_" + this.clipType + ".png");
        };
        return ClipTypeField;
    }(DetailPanelField));
    logic.ClipTypeField = ClipTypeField;
    var GeotagField = (function (_super) {
        __extends(GeotagField, _super);
        function GeotagField(fieldID, panelField, $parent) {
            _super.call(this, fieldID, panelField);
            this.link = HyperLink.create({ "id": this.fieldID, "class": "geotag", "target": "_blank" }, $parent);
        }
        GeotagField.prototype.setEditable = function (editable) {
            // Never editable
        };
        GeotagField.prototype.getValue = function () {
            return this.value;
        };
        GeotagField.prototype.setValue = function (value) {
            this.value = value;
            this.link.$element.empty();
            if (value) {
                this.link.setHREF("http://maps.google.com/maps?q=" + value);
                $("<img src='img/globe.png' class='typeicon'>").appendTo(this.link.$element);
                $("<span style='vertical-align:sub; font-size: smaller;'>" + FormatUtil.formatGPS(value) + "</span>").appendTo(this.link.$element);
            }
        };
        return GeotagField;
    }(DetailPanelField));
    logic.GeotagField = GeotagField;
    var HistoryField = (function (_super) {
        __extends(HistoryField, _super);
        function HistoryField(fieldID, panelField, $parent) {
            _super.call(this, fieldID, panelField);
            this.div = new Element($("<div id='" + this.fieldID + "'></div>").appendTo($parent));
        }
        HistoryField.prototype.setEditable = function (editable) {
            // never editable
        };
        HistoryField.prototype.getValue = function () {
            // readonly
        };
        HistoryField.prototype.setValue = function (value) {
            var historyItems = value;
            var html = "";
            if (historyItems != null) {
                html += "<table class='history'>";
                html += "<tr><th>Action</th><th>Date</th><th>User</th></tr>";
                for (var i = 0; i < historyItems.length; i++) {
                    var item = historyItems[i];
                    html += "<tr><td>" + HtmlUtil.escapeHtml(item.action) + "</td>"
                        + "<td>" + new Date(Number(item.date)).toDateString() + "</td>"
                        + "<td>" + HtmlUtil.escapeHtml(item.user) + "</td></tr>";
                }
                html += "</table>";
            }
            this.div.$element.html(html);
        };
        return HistoryField;
    }(DetailPanelField));
    logic.HistoryField = HistoryField;
    var MarkersField = (function (_super) {
        __extends(MarkersField, _super);
        function MarkersField(fieldID, panelField, $parent) {
            _super.call(this, fieldID, panelField);
            this.div = new Element($("<div id='" + this.fieldID + "'></div>").appendTo($parent));
        }
        MarkersField.prototype.setEditable = function (editable) {
            // never editable
        };
        MarkersField.prototype.getValue = function () {
            // readonly
        };
        //   export interface EventMarker
        //    {
        //        in?: Timecode;
        //        out?: Timecode;
        //        name?: string;
        //        category?: string;
        //        description?: string;
        //    }
        MarkersField.prototype.setValue = function (value) {
            var markers = value;
            var html = "";
            if (markers != null) {
                html += "<table class='details history'>";
                html += "<tr><th>Name</th><th>In</th><th>Out</th><th>Category</th></tr>";
                for (var i = 0; i < markers.length; i++) {
                    var item = markers[i];
                    html += "<tr><td>" + HtmlUtil.escapeHtml(item.name) + "</td>"
                        + "<td>" + HtmlUtil.escapeHtml(item["in"].txt) + "</td>"
                        + "<td>" + HtmlUtil.escapeHtml(item.out ? item.out.txt : "") + "</td>"
                        + "<td>" + HtmlUtil.escapeHtml(item.category || "") + "</td></tr>";
                }
                html += "</table>";
            }
            this.div.$element.html(html);
        };
        return MarkersField;
    }(DetailPanelField));
    logic.MarkersField = MarkersField;
    var CompositeField = (function (_super) {
        __extends(CompositeField, _super);
        function CompositeField(fieldID, panelField, $parent, fieldInfos) {
            var _this = this;
            _super.call(this, fieldID, panelField);
            this.fields = [];
            this.fieldInfos = fieldInfos;
            this.div = new Element($("<div id='" + this.fieldID + "'></div>").appendTo($parent));
            for (var i = 0; i < fieldInfos.length; i++) {
                var fieldInfo = fieldInfos[i];
                // add component field label for fields after the first
                if (i > 0) {
                    $("<span id='" + fieldID + "_l" + i + "' class='compositeFieldLabel'></span>").appendTo(this.div.$element)
                        .text((typeof fieldInfo.label != "undefined") ? fieldInfo.label : fieldInfo.fieldDef.name);
                }
                // Create the DetailPanelField object
                var field = Object.create(fieldInfo.fieldClass.prototype);
                // Explicitly call the constructor to initilise it
                var constructorArgs = [fieldID + "_" + i, { "fieldDefinition": fieldInfo.fieldDef, "options": {} }, this.div.$element];
                fieldInfo.fieldClass.apply(field, constructorArgs);
                if (field == null)
                    throw "Failed to construct '" + fieldInfo.fieldDef.name + "'";
                this.fields.push(field);
                field.onChanged(function (evt) { return _super.prototype.raiseChangeEvent.call(_this, evt); });
            }
        }
        CompositeField.prototype.setEditable = function (editable) {
            this.fields.forEach(function (field) { return field.setEditable(editable); });
        };
        CompositeField.prototype.getValue = function () {
            var values = [];
            for (var i = 0; i < this.fields.length; i++) {
                values.push(this.fields[i].getValue());
            }
            return values;
        };
        CompositeField.prototype.setValue = function (value) {
            var values = value || [];
            for (var i = 0; i < this.fields.length && i < values.length; i++) {
                this.fields[i].setValue(values[i]);
            }
        };
        CompositeField.prototype.setLinkedToField = function (linkedToField) { };
        return CompositeField;
    }(DetailPanelField));
    var DetailFieldFactory = (function () {
        function DetailFieldFactory() {
        }
        DetailFieldFactory.createField = function (fieldID, panelField, $parent) {
            var fieldDef = panelField.fieldDefinition;
            if ((fieldDef.ID == "MF") || (fieldDef.ID == "PF")) {
                return new MediaPathField(fieldID, panelField, $parent);
            }
            else if (fieldDef.ID == "RTG") {
                return new RatingField(fieldID, panelField, $parent);
            }
            else if (fieldDef.ID == "ASP") {
                return new FormattedNumericTextField(fieldID, panelField, FormatUtil.formatAspectRatio, $parent);
            }
            else if (fieldDef.ID == "RTGTYP") {
                return new CompositeField(fieldID, panelField, $parent, [
                    { "fieldClass": RatingField, "fieldDef": logic.BuiltInFields["RTG"] },
                    { "fieldClass": ClipTypeField, "fieldDef": logic.BuiltInFields["TY2"] },
                    { "fieldClass": GeotagField, "fieldDef": logic.BuiltInFields["GPS"], "label": "" }
                ]);
            }
            else if (fieldDef.ID == "TYPGPS") {
                return new CompositeField(fieldID, panelField, $parent, [
                    { "fieldClass": ClipTypeField, "fieldDef": logic.BuiltInFields["TY2"] },
                    { "fieldClass": GeotagField, "fieldDef": logic.BuiltInFields["GPS"], "label": "" }
                ]);
            }
            else if (fieldDef.ID == "MKHID") {
                return new CompositeField(fieldID, panelField, $parent, [
                    { "fieldClass": CheckBoxField, "fieldDef": logic.BuiltInFields["MK"] },
                    { "fieldClass": CheckBoxField, "fieldDef": logic.BuiltInFields["HID"] }
                ]);
            }
            else if ((fieldDef.fieldType == "date") || (fieldDef.fieldType == "time") || (fieldDef.fieldType == "datetime")) {
                return new DateTimeField(fieldID, panelField, $parent);
            }
            else if ((fieldDef.fieldType == "multiline") || ((fieldDef.fieldType == "text") && (panelField.options && panelField.options.multiline))) {
                return new MultilineField(fieldID, panelField, $parent);
            }
            else if (fieldDef.fieldType == "checkbox") {
                return new CheckBoxField(fieldID, panelField, $parent);
            }
            else if (fieldDef.fieldType == "radio") {
                return new RadioButtonsField(fieldID, panelField, $parent);
            }
            else if (fieldDef.fieldType == "multi-checkbox") {
                return new MultiCheckboxField(fieldID, panelField, $parent);
            }
            else if ((fieldDef.fieldType == "multi-picklist")) {
                return new MultiSelectPicklistField(fieldID, panelField, $parent);
            }
            else if ((fieldDef.fieldType == "picklist")) {
                return new ComboBoxField(fieldID, panelField, fieldDef.picklist && fieldDef.picklist.isExtensible, $parent);
            }
            else if ((fieldDef.fieldType == "hierarchy") || (fieldDef.fieldType == "linked-hierarchy")) {
                return new HierarchyField(fieldID, panelField, fieldDef.picklist && fieldDef.picklist.isExtensible, $parent);
            }
            else if ((fieldDef.fieldType == "multi-hierarchy") || (fieldDef.fieldType == "linked-multi-hierarchy")) {
                // TODO: implement MultiSelectHierarchyField
                return new MultiSelectPicklistField(fieldID, panelField, $parent);
            }
            else if (fieldDef.fieldType == "auto-suggest") {
                return new ComboBoxField(fieldID, panelField, true, $parent);
            }
            else if (fieldDef.fieldType.contains("multi-auto-suggest")) {
                // TODO: implement MultiAutoSuggestField
                return new MultiSelectPicklistField(fieldID, panelField, $parent);
            }
            else if (fieldDef.fieldType == "html") {
                return new HtmlField(fieldID, panelField, $parent);
            }
            else if (fieldDef.fieldType == "markers") {
                return new MarkersField(fieldID, panelField, $parent);
            }
            else if (fieldDef.fieldType == "history") {
                return new HistoryField(fieldID, panelField, $parent);
            }
            else if (fieldDef.fieldType == "bytes") {
                return new FormattedNumericTextField(fieldID, panelField, FormatUtil.formatBytes, $parent);
            }
            else if (fieldDef.fieldType == "bps") {
                return new FormattedNumericTextField(fieldID, panelField, FormatUtil.formatBytesPerSecond, $parent);
            }
            else {
                return new TextField(fieldID, panelField, $parent);
            }
        };
        return DetailFieldFactory;
    }());
    logic.DetailFieldFactory = DetailFieldFactory;
})(logic || (logic = {}));
