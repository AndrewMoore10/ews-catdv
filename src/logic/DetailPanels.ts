module logic
{
    import Clip = catdv.Clip;
    import FieldDefinition = catdv.FieldDefinition;
    import PanelDefinition = catdv.PanelDefinition;
    import PanelField = catdv.PanelField;
    import DateUtil = catdv.DateUtil;
    import TimecodeUtil = catdv.TimecodeUtil;
    import ClipHistoryEntry = catdv.ClipHistoryEntry;
    import EventMarker = catdv.EventMarker;

    import FormatUtil = util.FormatUtil;
    import HtmlUtil = util.HtmlUtil;
    
    import Element = controls.Element;
    import Panel = controls.Panel;
    import TextBox = controls.TextBox;
    import TextArea = controls.TextArea;
    import CheckBox = controls.CheckBox;
    import RadioButton = controls.RadioButton;
    import ListItem = controls.ListItem;
    import DropDownList = controls.DropDownList;
    import DropDownTree = controls.DropDownTree;
    import ComboBox = controls.ComboBox;
    import Image = controls.Image;
    import HyperLink = controls.HyperLink;
    import MultiSelectDropDownList = controls.MultiSelectDropDownList;
    import SimpleDataSource = controls.SimpleDataSource;
    import SimpleDataSourceParams = controls.SimpleDataSourceParams;
    import SimpleArrayDataSource = controls.SimpleArrayDataSource;
    import ExtensibleListDataSource = controls.ExtensibleListDataSource;
    import Console = controls.Console;

    import PanelSettingsManager = logic.PanelSettingsManager;
    import FieldSettingsManager = logic.FieldSettingsManager;

    export class DetailPanelManager
    {
        private static summaryDetailFields: string[] = [
            "NM1", "IO", "D1" ,"IO2", "D2", "FF", "VF", "AF", "MS","RTGTYP", "OWNER", 
            "CAT","CGRP", "BN", "STS", "TP", "TY1", "MK", "HID",
            "RD1", "MD1", "MD2", "MF", "PF", "ASP", "HIS"
        ];

        public static getPanelDefinitions(clip: Clip, clipUID: string, callback: (panelDefs: PanelDefinition[]) => void)
        {
            PanelSettingsManager.getPanelDefinitions(clip.catalog.groupID, clipUID,(panels) =>
            {
                if ((panels != null) && (panels.length > 0))
                {
                    callback(panels);
                }
                else
                {
                    DetailPanelManager.getDefaultPanelDefs(clip, callback);
                }
            });
        }

        private static getDefaultPanelDefs(clip: Clip, callback: (panelDefs: PanelDefinition[]) => void)
        {
            var summaryPanel: PanelDefinition = { name: "Summary", fields: [] };
            DetailPanelManager.summaryDetailFields.forEach((fieldDefID) =>
            {
                var fieldDef = BuiltInFields[fieldDefID];
                if (fieldDef)
                {
                    summaryPanel.fields.push({
                        fieldDefID: fieldDefID,
                        fieldDefinition: fieldDef,
                        options: {
                            multiline: (fieldDefID == "NT")
                        }
                    });
                }
            });

            var userfieldPanel: PanelDefinition = {
                name: "Log Notes", fields: [
                    {
                        fieldDefID: "NT",
                        fieldDefinition: BuiltInFields["NT"],
                        options: {
                            multiline: true
                        }
                    }
                ]
            };
            
            FieldSettingsManager.getUserFieldDefinitions(clip.catalog.groupID,(fieldDefinitions: FieldDefinition[]) =>
            {
                var fieldDefLookup: { [id: string]: FieldDefinition } = {};
                fieldDefinitions.forEach((fieldDefinition) =>
                {
                    fieldDefLookup[fieldDefinition.identifier] = fieldDefinition;
                });

                if (clip.userFields)
                {
                    for (var propertyName in clip.userFields)
                    {
                        var fieldDef = fieldDefLookup[propertyName];
                        if (fieldDef)
                        {
                            userfieldPanel.fields.push({
                                fieldDefinition: fieldDef
                            });
                        }
                        else
                        {
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

                var metadataPanel: PanelDefinition = { name: "Technical", fields: [] };

                // Build list of metadata attributes based on the metadata for this clip
                if (clip.media && clip.media.metadata)
                {
                    var metadataFieldNames = Object.getOwnPropertyNames(clip.media.metadata);
                    metadataFieldNames.sort().forEach((metadataFieldName) =>
                    {
                        if ((metadataFieldName.length != 4) || metadataFieldName.match(/^[A-Z][A-Za-z0-9:._ ]+$/)) 
                        {
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
                if(userfieldPanel.fields.length > 0) panels.push(userfieldPanel);
                if(metadataPanel.fields.length > 0) panels.push(metadataPanel);
                
                callback(panels);
            });
        }
    }

    export class DetailPanelField
    {
        public fieldID: string;
        public panelField: PanelField;
        public fieldDef: FieldDefinition;
        
        private changeHandler : (evt: any) => void = null;

        constructor(fieldID: string, panelField: PanelField)
        {
            this.fieldID = fieldID;
            this.panelField = panelField;
            this.fieldDef = panelField.fieldDefinition;
        }

        public onChanged(changeHandler : (evt: any) => void)
        {
            this.changeHandler = changeHandler;
        }
        public raiseChangeEvent(evt)
        {
            Console.debug(this.fieldDef.name + " changed");
            if(this.changeHandler) this.changeHandler(evt);
        }
        
        public setEditable(editable: boolean) {/* abstract */ }
        public setError(error: boolean) : void {/* abstract */ }
        public setLinkedToField(linkedToField: DetailPanelField): void {/* abstract */ }

        public getValue(): any {/* abstract */ }
        public setValue(value: any): void {/* abstract */ }
    }

    export class FieldBinding
    {
        public detailField: DetailPanelField;
        public fieldAccessor: FieldAccessor;
        public originalValue: any;

        // When editing multiple clips - keeps track of which fields have actually been edited
        // and will need to be written back to the clips
        public edited: boolean;

        constructor(detailField: DetailPanelField, fieldAccessor: FieldAccessor)
        {
            this.detailField = detailField;
            this.fieldAccessor = fieldAccessor;
            this.edited = false;
        }
    }


    export class TextField extends DetailPanelField
    {
        private textBox: TextBox;

        constructor(fieldID: string, panelField: PanelField, $parent: JQuery)
        {
            super(fieldID, panelField);
            this.textBox = TextBox.create({ "id": this.fieldID, "type": "text", "readonly": true }, $parent);
            this.textBox.onInput((evt) => super.raiseChangeEvent(evt));
        }

        public setEditable(editable: boolean)
        {
            if (!this.fieldDef.isEditable || !editable)
            {
                this.textBox.setReadOnly(true);
                this.textBox.$element.removeClass("editable");
            }
            else
            {
                this.textBox.setReadOnly(false);
                this.textBox.$element.addClass("editable");
            }
        }

        public getValue(): any
        {
            return this.textBox.getText();
        }

        public setValue(value: any)
        {
            this.textBox.setText(value);
        }
    }

    export class FormattedNumericTextField extends DetailPanelField
    {
        private textBox: TextBox;
        private originalValue: string;
        private formatter: (value: number) => string;

        constructor(fieldID: string, panelField: PanelField, formatter: (value: number) => string, $parent: JQuery)
        {
            super(fieldID, panelField);
            this.formatter = formatter;
            this.textBox = TextBox.create({ "id": this.fieldID, "type": "text", "readonly": true }, $parent);
        }

        public setEditable(editable: boolean)
        {
            // never editable
        }

        public getValue(): any
        {
            return this.originalValue;
        }

        public setValue(value: any)
        {
            this.originalValue = value;

            var numValue = value ? parseInt(value) : null;
            if (numValue != null)
            {
                this.textBox.setText(this.formatter(numValue));
            }
            else
            {
                this.textBox.setText("");
            }
        }
    }

    export class DateTimeField extends DetailPanelField
    {
        private textBox: TextBox;

        constructor(fieldID: string, panelField: PanelField, $parent: JQuery)
        {
            super(fieldID, panelField);

            var inputType;
            switch (this.fieldDef.fieldType)
            {
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
            this.textBox.onChanged((evt) => super.raiseChangeEvent(evt));
        }

        public setEditable(editable: boolean)
        {
            if (!this.fieldDef.isEditable || !editable)
            {
                this.textBox.setReadOnly(true);
                this.textBox.$element.removeClass("editable");
            }
            else
            {
                this.textBox.setReadOnly(false);
                this.textBox.$element.addClass("editable");
            }
        }

        public getValue(): any
        {
            var value = this.textBox.getText().trim();
            if (value)
            {
                switch (this.fieldDef.fieldType)
                {
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
            else
            {
                return null;
            }
        }

        public setValue(value: any)
        {
            this.textBox.setText(this.formatValue(value));
        }

        // TODO: We are using HTML input type="date/datetime/time" which use ISO as their wire format
        // but display the date in the local machine's format. However, not all browsers support this
        // so ideally we'd format the dates using the server-side date format preference, if it's a browser
        // that doesn't support type="date". Or we need to write our own date picker control....
        private formatValue(value: any)
        {
            if (!value) return "";

            switch (this.fieldDef.fieldType)
            {
                case "date":
                    return DateUtil.format(<Date>value, DateUtil.ISO_DATE_FORMAT);
                case "datetime":
                    return DateUtil.format(<Date>value, DateUtil.ISO_DATETIME_FORMAT);
                case "time":
                    return DateUtil.format(<Date>value, DateUtil.ISO_TIME_FORMAT);
                default:
                    return value;
            }
        }
    }

    export class MultilineField extends DetailPanelField
    {
        private textarea: TextArea;

        constructor(fieldID: string, panelField: PanelField, $parent: JQuery)
        {
            super(fieldID, panelField);

            this.textarea = TextArea.create({ "id": this.fieldID, "rows": 4, "readonly": true }, $parent);
            this.textarea.onInput((evt) => super.raiseChangeEvent(evt));
       }

        public setEditable(editable: boolean)
        {
            if (!this.fieldDef.isEditable || !editable)
            {
                this.textarea.setReadOnly(true);
                this.textarea.$element.removeClass("editable");
            }
            else
            {
                this.textarea.setReadOnly(false);
                this.textarea.$element.addClass("editable");
            }
        }

        public getValue(): any
        {
            return this.textarea.getText();
        }

        public setValue(value: any)
        {
            this.textarea.setText(value);
        }
    }

    export class CheckBoxField extends DetailPanelField
    {
        private value : boolean;
        private checkbox: CheckBox;

        constructor(fieldID: string, panelField: PanelField, $parent: JQuery)
        {
            super(fieldID, panelField);

            this.checkbox = CheckBox.create({ "id": this.fieldID, "disabled": "true", "class": "readonly" }, $parent);
            if (this.fieldDef.data)
            {
                $(document.createTextNode(this.fieldDef.data)).appendTo($parent);
            }
            this.checkbox.onChanged((evt) => {
                this.value = this.checkbox.isChecked();
                super.raiseChangeEvent(evt);
            });
        }

        public setEditable(editable: boolean)
        {
            this.checkbox.setEnabled(this.fieldDef.isEditable && editable);
        }

        public getValue(): any
        {
            return this.value;
        }

        public setValue(value: any)
        {
            this.value = value;
            this.checkbox.setChecked(value && (String(value).toLowerCase() == "true"));
        }
    }

    export class RadioButtonsField extends DetailPanelField
    {
        private values: string[] = null;

        constructor(fieldID: string, panelField: PanelField, $parent: JQuery)
        {
            super(fieldID, panelField);

            this.values = (this.fieldDef.data) ? this.fieldDef.data.split("\n") : [];

            var html = "";
            this.values.forEach((value) =>
            {
                html += "<input type='radio' name='" + this.fieldID + "' value='" + HtmlUtil.escapeHtml(value) + "' disabled>" + HtmlUtil.escapeHtml(value);
            });

            $parent.html(html);
            $("input[type=radio][name=" + this.fieldID + "]").on("change", (evt) => super.raiseChangeEvent(evt));
        }

        public setEditable(editable: boolean)
        {
            if (this.fieldDef.isEditable)
            {
                $("input[name=" + this.fieldID + "]").prop("disabled", !editable);
            }
        }

        public getValue(): any
        {
            return $("input[name=" + this.fieldID + "]:checked").val();
        }

        public setValue(value: any)
        {
            $("input[name=" + this.fieldID + "][value='" + value + "']").prop("checked", true);
        }
    }

    export class MultiCheckboxField extends DetailPanelField
    {
        private values : string[] = null;
        
        constructor(fieldID: string, panelField: PanelField, $parent: JQuery)
        {
            super(fieldID, panelField);

            this.values = (this.fieldDef.data) ? this.fieldDef.data.split("\n") : [];

            var html = "";
            this.values.forEach((value, p) =>
            {
                html += "<input type='checkbox' id='" + this.fieldID + "_" + p + "' name='" + this.fieldID + "' disabled >" + HtmlUtil.escapeHtml(value);
            });
            $parent.html(html);
            $("input[type=checkbox][name=" + this.fieldID + "]").on("change", (evt) => super.raiseChangeEvent(evt));
       }

        public setEditable(editable: boolean)
        {
            if (this.fieldDef.isEditable)
            {
                $("input[id^=" + this.fieldID + "]").prop("disabled", !editable);
            }
        }

        public getValue(): any
        {
            var selectedCheckboxes = $("input[id^=" + this.fieldID + "]:checked");
            if (selectedCheckboxes.length > 0)
            {
                var values: string[] = [];
                selectedCheckboxes.each((i, selectedCheckbox: HTMLElement) =>
                {
                    var valueIndex = Number(selectedCheckbox.id.substring(selectedCheckbox.id.lastIndexOf("_") + 1));
                    values.push(this.values[valueIndex]);
                });
                return values;
            }
            else
            {
                return null;
            }
        }

        public setValue(value: any)
        {
            $("input[id^=" + this.fieldID + "]").prop("checked", false);
            if (value)
            {
                var values = value instanceof Array ? <string[]>value : value.toString().split(",");

                this.values.forEach((value, p) =>
                {
                    var isSelected = values.contains(value);
                    $("#" + this.fieldID + "_" + p).prop("checked", isSelected ? true : false);
                });
            }
        }
    }

    export class ComboBoxField extends DetailPanelField
    {
        private comboBox: ComboBox;
        private dataSource: ExtensibleListDataSource;
        private fixedValues: boolean;

        constructor(fieldID: string, panelField: PanelField, isExtensible: boolean, $parent: JQuery)
        {
            super(fieldID, panelField);

            var values = (this.fieldDef.picklist && this.fieldDef.picklist.values) ? [""].concat(this.fieldDef.picklist.values) : [""];
            this.fixedValues = !isExtensible;
            this.dataSource = new ExtensibleListDataSource(values);
            this.comboBox = ComboBox.create({ "id": fieldID }, this.dataSource, this.fixedValues, false, $parent);
            this.comboBox.setEnabled(false);
            this.comboBox.onChanged((evt) => super.raiseChangeEvent(evt));
        }

        public setEditable(editable: boolean)
        {
            this.comboBox.setEnabled(this.fieldDef.isEditable && editable);
        }

        public getValue(): any
        {
            return this.comboBox.getText();
        }

        public setValue(value: any)
        {
            if (this.fixedValues)
            {
                if(this.dataSource.maybeAddExtendedValues([value]))
                {
                   this.comboBox.reload();
                }
                this.comboBox.setSelectedValue(value);
            }
            else
            {
                this.comboBox.setSelectedValue(value);
            }
        }
    }

    export class MultiSelectPicklistField extends DetailPanelField
    {
        private dropDownList: MultiSelectDropDownList;
        private dataSource: ExtensibleListDataSource;

        constructor(fieldID: string, panelField: PanelField, $parent: JQuery)
        {
            super(fieldID, panelField);

            var values = (this.fieldDef.picklist && this.fieldDef.picklist.values) ? this.fieldDef.picklist.values : [];
            this.dataSource = new ExtensibleListDataSource(values);
            this.dropDownList = MultiSelectDropDownList.create({ "id": fieldID }, true, this.dataSource, $parent);
            this.dropDownList.setEnabled(false);
            this.dropDownList.onChanged((evt) => super.raiseChangeEvent(evt));
        }

        public setEditable(editable: boolean)
        {
            this.dropDownList.setEnabled(this.fieldDef.isEditable && editable);
        }

        public getValue(): any
        {
            return this.dropDownList.getSelectedValues();
        }

        public setValue(value: any)
        {
            var values = <string[]>value;
            if (this.dataSource.maybeAddExtendedValues(values))
            {
                this.dropDownList.reload();
            }
            this.dropDownList.setSelectedValues(values);
        }
    }

    export class HierarchyField extends DetailPanelField
    {
        private dropDownTree: DropDownTree;
        private originalValues: string[];
        private dataSourceItems: ListItem[];
        private dataSource: SimpleDataSource<ListItem>;
        private linkedToField: DetailPanelField = null;

        constructor(fieldID: string, panelField: PanelField, isExtensible: boolean, $parent: JQuery)
        {
            super(fieldID, panelField);

            this.originalValues = (this.fieldDef.picklist && this.fieldDef.picklist.values) ? [""].concat(this.fieldDef.picklist.values) : [""];
            this.dataSourceItems = this.originalValues.map((s) => { return { value: s, text: s }; });

            this.dataSource = {
                getItems: (params?: SimpleDataSourceParams, callback?: (items: ListItem[]) => void) =>
                {
                    if (this.linkedToField != null)
                    {
                        callback(this.dataSourceItems.filter((item) => item.value.startsWith(this.linkedToField.getValue())));
                    }
                    else
                    {
                        callback(this.dataSourceItems);
                    }
                }
            };

            this.dropDownTree = DropDownTree.create({ "id": fieldID }, this.dataSource, $parent);
            this.dropDownTree.setEnabled(false);
            this.dropDownTree.onChanged((evt) => super.raiseChangeEvent(evt));
       }

        public setEditable(editable: boolean)
        {
            this.dropDownTree.setEnabled(this.fieldDef.isEditable && editable);
        }

        public getValue(): any
        {
            return this.dropDownTree.getSelectedValue();
        }

        public setValue(value: any)
        {
            var unknownValue = (value && !this.originalValues.contains(value));
            if ((this.dataSourceItems.length != this.originalValues.length) || unknownValue)
            {
                var values = this.originalValues;
                if (unknownValue)
                {
                    values = this.originalValues.concat(value);
                }
                this.dataSourceItems = values.map((s) => { return { value: s, text: s }; });
                this.dropDownTree.reload();
            }
            this.dropDownTree.setSelectedValue(value);
        }

        public setLinkedToField(linkedToField: DetailPanelField)
        {
            this.linkedToField = linkedToField;
            this.dropDownTree.setAlwaysReload(this.linkedToField ? true : false);
            this.dropDownTree.setOnlyShowLeafInText(this.linkedToField ? true : false);
        }
    }


    export class HtmlField extends DetailPanelField
    {
        private div: Element;

        constructor(fieldID: string, panelField: PanelField, $parent: JQuery)
        {
            super(fieldID, panelField);

            this.div = new Element($("<div id='" + this.fieldID + "' class='html-field'></div>").appendTo($parent));
        }

        public setEditable(editable: boolean)
        {
            // never editable
        }
        public getValue(): any
        {
            // readonly
        }

        public setValue(value: any)
        {
            var $div = this.div.$element;
            $div.html((value instanceof Array) ? Array(value).join(",") : value);
            $div.find("a").each((i, a) =>
            {
                var href = $(a).attr("href");
                if (href.startsWith("catdv://clip/"))
                {
                    $(a).attr("href", href.replace("catdv://clip/", Config.viewClipUrl + "?id="));
                    $(a).attr("target", "_blank");
                }
            });
        }
    }

    export class MediaPathField extends DetailPanelField
    {
        private div: Element;
 
        constructor(fieldID: string, panelField: PanelField, $parent: JQuery)
        {
            super(fieldID, panelField);

            this.div = new Element($("<div id='" + this.fieldID + "' style='position:relative;' class='mediaPath'></div>").appendTo($parent));
        }

        public setEditable(editable: boolean)
        {
            // never editable
        }
        public getValue(): any
        {
            // readonly
        }

        public setValue(value: any)
        {
            if (value)
            {
                var path: string = value.path;
                var downloadUrl: string = value.downloadUrl;
                var viewUrl: string = value.viewUrl;

                this.div.$element.empty();
                if (path)
                {
                    if (downloadUrl && viewUrl)
                    {
                        $("<a href='" + encodeURI(viewUrl) + "' style='position:absolute;display:block;overflow:hidden;left:0px;right:90px;' target='_blank'></a>").appendTo(this.div.$element).text(path);
                        $("<a href='" + encodeURI(downloadUrl) + "' class='btn btn-default btn-xs pull-right'>Download</a>").appendTo(this.div.$element);
                    }
                    else
                    {
                        this.div.$element.text(path);
                    }
                }
            }
            else
            {
                this.div.$element.text("");
            }
        }
    }

    export class RatingField extends DetailPanelField
    {
        private static OUTLINE_STAR = "&#9734;";
        private static SOLID_STAR = "&#9733;";

        private div: Element;
        private $stars: JQuery[] = [];
        private rating: number; // 0-5  or null
        private editable: boolean = true;
        private trackingMouse: boolean = false;

        constructor(fieldID: string, panelField: PanelField, $parent: JQuery)
        {
            super(fieldID, panelField);
            this.div = new Element($("<div id='" + this.fieldID + "' class='ratings'></div>").appendTo($parent));

            // add extra blank item to left of stars to allow zero stars to be selected
            for (var i = 0; i <= 5; i++)
            {
                if (i == 0)
                {
                    this.$stars[i] = $("<span>&nbsp;</span>").appendTo(this.div.$element);
                }
                else
                {
                    this.$stars[i] = $("<span class='star'>" + RatingField.OUTLINE_STAR + "</span>").appendTo(this.div.$element);
                }
                this.attachClickEvent(this.$stars[i], i);
            }

            this.div.$element.mouseleave(() =>
            {
                this.trackingMouse = false;
            });
            this.div.$element.mouseup(() =>
            {
                this.trackingMouse = false;
            });
        }

        public setEditable(editable: boolean)
        {
            this.editable = editable;
        }

        public getValue(): any
        {
            return this.rating != null ? this.rating : "";
        }

        public setValue(value: any)
        {
            this.rating = value ? Number(value) : null;
            var numStars = (this.rating != null) ? Math.min(Math.max(this.rating || 0, 0), 5) : 0;
            for (var j = 1; j <= 5; j++)
            {
                if (j <= numStars)
                {
                    this.$stars[j].html(RatingField.SOLID_STAR).removeClass("deselected");
                }
                else
                {
                    this.$stars[j].html(RatingField.OUTLINE_STAR).addClass("deselected");
                }
            }
        }

        // This is in its own method so it gets the current value of index
        private attachClickEvent($star: JQuery, index: number)
        {
            $star.mousedown((evt) =>
            {
                if (index !== this.rating)
                {
                    this.setValue(index);
                    super.raiseChangeEvent(evt);
                }
                this.trackingMouse = true;
            });
            $star.mousemove((evt) =>
            {
                if (this.trackingMouse)
                {
                    if (index !== this.rating)
                    {
                        this.setValue(index);
                        super.raiseChangeEvent(evt);
                    }
                }
            });
            $star.mouseup(() =>
            {
                this.trackingMouse = false;
            });
        }
    }

    export class ClipTypeField extends DetailPanelField
    {
        private image: Image;
        private clipType: string;

        constructor(fieldID: string, panelField: PanelField, $parent: JQuery)
        {
            super(fieldID, panelField);
            this.image = Image.create({ "id": this.fieldID, "class": "typeicon", "src": "" }, $parent);
        }

        public setEditable(editable: boolean)
        {
            // Never editable
        }

        public getValue(): any
        {
            return this.clipType;
        }

        public setValue(value: any)
        {
            this.clipType = value;
            this.image.setSourceUrl(TypeIconColumn.CLIP_TYPE_IMAGE_PATH + "/cliptype_" + this.clipType + ".png");
        }
    }

    export class GeotagField extends DetailPanelField
    {
        private link: HyperLink;
        private value: string;

        constructor(fieldID: string, panelField: PanelField, $parent: JQuery)
        {
            super(fieldID, panelField);
            this.link = HyperLink.create({ "id": this.fieldID, "class": "geotag", "target": "_blank" }, $parent);
        }

        public setEditable(editable: boolean)
        {
            // Never editable
        }

        public getValue(): any
        {
            return this.value;
        }

        public setValue(value: any)
        {
            this.value = value;
            this.link.$element.empty();
            if (value)
            {
                this.link.setHREF("http://maps.google.com/maps?q=" + value);
                $("<img src='img/globe.png' class='typeicon'>").appendTo(this.link.$element);
                $("<span style='vertical-align:sub; font-size: smaller;'>" + FormatUtil.formatGPS(value) + "</span>").appendTo(this.link.$element);
            }
        }
    }


    export class HistoryField extends DetailPanelField
    {
        private div: Element;

        constructor(fieldID: string, panelField: PanelField, $parent: JQuery)
        {
            super(fieldID, panelField);

            this.div = new Element($("<div id='" + this.fieldID + "'></div>").appendTo($parent));
        }

        public setEditable(editable: boolean)
        {
            // never editable
        }
        public getValue(): any
        {
            // readonly
        }

        public setValue(value: any)
        {
            var historyItems = <ClipHistoryEntry[]>value;
            var html = "";
            if (historyItems != null)
            {
                html += "<table class='history'>";
                html += "<tr><th>Action</th><th>Date</th><th>User</th></tr>";
                for (var i = 0; i < historyItems.length; i++)
                {
                    var item = historyItems[i];
                    html += "<tr><td>" + HtmlUtil.escapeHtml(item.action) + "</td>" 
                        + "<td>" + new Date(Number(item.date)).toDateString() + "</td>" 
                        + "<td>" + HtmlUtil.escapeHtml(item.user) + "</td></tr>";
                }

                html += "</table>";
            }

            this.div.$element.html(html);
        }
    }

    export class MarkersField extends DetailPanelField
    {
        private div: Element;

        constructor(fieldID: string, panelField: PanelField, $parent: JQuery)
        {
            super(fieldID, panelField);

            this.div = new Element($("<div id='" + this.fieldID + "'></div>").appendTo($parent));
        }

        public setEditable(editable: boolean)
        {
            // never editable
        }
        public getValue(): any
        {
            // readonly
        }

        //   export interface EventMarker
        //    {
        //        in?: Timecode;
        //        out?: Timecode;
        //        name?: string;
        //        category?: string;
        //        description?: string;
        //    }
        public setValue(value: any)
        {
            var markers = <EventMarker[]>value;
            var html = "";
            if (markers != null)
            {
                html += "<table class='details history'>";
                html += "<tr><th>Name</th><th>In</th><th>Out</th><th>Category</th></tr>";
                for (var i = 0; i < markers.length; i++)
                {
                    var item = markers[i];
                    html += "<tr><td>" + HtmlUtil.escapeHtml(item.name) + "</td>" 
                    + "<td>" + HtmlUtil.escapeHtml(item["in"].txt) + "</td>" 
                    + "<td>" + HtmlUtil.escapeHtml(item.out ? item.out.txt : "") + "</td>" 
                    + "<td>" + HtmlUtil.escapeHtml(item.category || "") + "</td></tr>";
                }

                html += "</table>";
            }

            this.div.$element.html(html);
        }
    }

    interface FieldInfo 
    {
        fieldClass: Function;
        fieldDef: FieldDefinition;
        label?: string;
    }

    class CompositeField extends DetailPanelField
    {
        private div: Element;
        private fieldInfos: FieldInfo[];
        private fields: DetailPanelField[] = [];

        constructor(fieldID: string, panelField: PanelField, $parent: JQuery, fieldInfos: FieldInfo[])
        {
            super(fieldID, panelField);
            this.fieldInfos = fieldInfos;

            this.div = new Element($("<div id='" + this.fieldID + "'></div>").appendTo($parent));

            for (var i = 0; i < fieldInfos.length; i++)
            {
                var fieldInfo = fieldInfos[i];
                
                // add component field label for fields after the first
                if (i > 0)
                {
                    $("<span id='" + fieldID + "_l" + i + "' class='compositeFieldLabel'></span>").appendTo(this.div.$element)
                        .text((typeof fieldInfo.label != "undefined") ? fieldInfo.label : fieldInfo.fieldDef.name);
                }

                // Create the DetailPanelField object
                var field = <DetailPanelField>Object.create(fieldInfo.fieldClass.prototype);
                // Explicitly call the constructor to initilise it
                var constructorArgs = [fieldID + "_" + i, { "fieldDefinition": fieldInfo.fieldDef, "options": {} }, this.div.$element];
                fieldInfo.fieldClass.apply(field, constructorArgs);
                if (field == null) throw "Failed to construct '" + fieldInfo.fieldDef.name + "'";
                this.fields.push(field);
                field.onChanged((evt) => super.raiseChangeEvent(evt));
            }
        }

        public setEditable(editable: boolean)
        {
            this.fields.forEach((field) => field.setEditable(editable));
        }

        public getValue(): any
        {
            var values: any[] = [];
            for (var i = 0; i < this.fields.length; i++)
            {
                values.push(this.fields[i].getValue());
            }
            return values;
        }

        public setValue(value: any): void
        {
            var values: any[] = value || [];
            for (var i = 0; i < this.fields.length && i < values.length; i++)
            {
                this.fields[i].setValue(values[i]);
            }
        }

        public setLinkedToField(linkedToField: DetailPanelField): void
        {/* not implemented */ }
    }

    export class DetailFieldFactory
    {
        public static createField(fieldID: string, panelField: PanelField, $parent: JQuery): DetailPanelField
        {
            var fieldDef: FieldDefinition = panelField.fieldDefinition;

            if ((fieldDef.ID == "MF") || (fieldDef.ID == "PF"))
            {
                return new MediaPathField(fieldID, panelField, $parent);
            }
            else if (fieldDef.ID == "RTG")
            {
                return new RatingField(fieldID, panelField, $parent);
            }
            else if (fieldDef.ID == "ASP") 
            {
                return new FormattedNumericTextField(fieldID, panelField, FormatUtil.formatAspectRatio, $parent);
            }
            else if (fieldDef.ID == "RTGTYP")
            {
                return new CompositeField(fieldID, panelField, $parent, [
                    { "fieldClass": RatingField, "fieldDef": BuiltInFields["RTG"] },
                    { "fieldClass": ClipTypeField, "fieldDef": BuiltInFields["TY2"] },
                    { "fieldClass": GeotagField, "fieldDef": BuiltInFields["GPS"], "label": "" }
                ]);
            }
            else if (fieldDef.ID == "TYPGPS")
            {
                return new CompositeField(fieldID, panelField, $parent, [
                    { "fieldClass": ClipTypeField, "fieldDef": BuiltInFields["TY2"] },
                    { "fieldClass": GeotagField, "fieldDef": BuiltInFields["GPS"], "label": "" }
                ]);
            }
            else if (fieldDef.ID == "MKHID") 
            {
                return new CompositeField(fieldID, panelField, $parent, [
                    { "fieldClass": CheckBoxField, "fieldDef": BuiltInFields["MK"] },
                    { "fieldClass": CheckBoxField, "fieldDef": BuiltInFields["HID"] }
                ]);
            }
            else if ((fieldDef.fieldType == "date") || (fieldDef.fieldType == "time") || (fieldDef.fieldType == "datetime"))
            {
                return new DateTimeField(fieldID, panelField, $parent);
            }
            else if ((fieldDef.fieldType == "multiline") || ((fieldDef.fieldType == "text") && (panelField.options && panelField.options.multiline)))
            {
                return new MultilineField(fieldID, panelField, $parent);
            }
            else if (fieldDef.fieldType == "checkbox")
            {
                return new CheckBoxField(fieldID, panelField, $parent);
            }
            else if (fieldDef.fieldType == "radio")
            {
                return new RadioButtonsField(fieldID, panelField, $parent);
            }
            else if (fieldDef.fieldType == "multi-checkbox")
            {
                return new MultiCheckboxField(fieldID, panelField, $parent);
            }
            else if ((fieldDef.fieldType == "multi-picklist"))
            {
                return new MultiSelectPicklistField(fieldID, panelField, $parent);
            }
            else if ((fieldDef.fieldType == "picklist"))
            {
                return new ComboBoxField(fieldID, panelField, fieldDef.picklist && fieldDef.picklist.isExtensible, $parent);
            }
            else if ((fieldDef.fieldType == "hierarchy") || (fieldDef.fieldType == "linked-hierarchy"))
            {
                return new HierarchyField(fieldID, panelField, fieldDef.picklist && fieldDef.picklist.isExtensible, $parent);
            }
            else if ((fieldDef.fieldType == "multi-hierarchy") || (fieldDef.fieldType == "linked-multi-hierarchy"))
            {
                // TODO: implement MultiSelectHierarchyField
                return new MultiSelectPicklistField(fieldID, panelField, $parent);
            }
            else if (fieldDef.fieldType == "auto-suggest")
            {
                return new ComboBoxField(fieldID, panelField, true, $parent);
            }
            else if (fieldDef.fieldType.contains("multi-auto-suggest"))
            {
                // TODO: implement MultiAutoSuggestField
                return new MultiSelectPicklistField(fieldID, panelField, $parent);
            }
            else if (fieldDef.fieldType == "html")
            {
                return new HtmlField(fieldID, panelField, $parent);
            }
            else if (fieldDef.fieldType == "markers")
            {
                return new MarkersField(fieldID, panelField, $parent);
            }
            else if (fieldDef.fieldType == "history")
            {
                return new HistoryField(fieldID, panelField, $parent);
            }
            else if (fieldDef.fieldType == "bytes") 
            {
                return new FormattedNumericTextField(fieldID, panelField, FormatUtil.formatBytes, $parent);
            }
            else if (fieldDef.fieldType == "bps")
            {
                return new FormattedNumericTextField(fieldID, panelField, FormatUtil.formatBytesPerSecond, $parent);
            }
            else
            {
                return new TextField(fieldID, panelField, $parent);
            }
        }
    }
}