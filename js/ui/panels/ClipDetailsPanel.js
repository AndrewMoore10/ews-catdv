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
        var Panel = controls.Panel;
        var TabPanel = controls.TabPanel;
        var CheckBox = controls.CheckBox;
        var Console = controls.Console;
        var FieldDefinitionUtil = catdv.FieldDefinitionUtil;
        var DetailsPanelManager = logic.DetailPanelManager;
        var FieldBinding = logic.FieldBinding;
        var DetailFieldFactory = logic.DetailFieldFactory;
        var AccessorFactory = logic.AccessorFactory;
        var HtmlField = logic.HtmlField;
        var ClipDetailsPanel = (function (_super) {
            __extends(ClipDetailsPanel, _super);
            function ClipDetailsPanel(element) {
                _super.call(this, element);
                this.panels = null;
                this.fieldBindings = null;
                this.changeHandler = null;
            }
            ClipDetailsPanel.prototype.initialisePanels = function (clip, linkUID, initiallyEditable) {
                var _this = this;
                DetailsPanelManager.getPanelDefinitions(clip, linkUID, function (panelDefs) {
                    _this.createPanels(panelDefs, initiallyEditable);
                    _this.updateUI();
                });
            };
            ClipDetailsPanel.prototype.createPanels = function (panelDefs, initiallyEditable) {
                var _this = this;
                if (this.panels == null) {
                    this.panels = TabPanel.create(this);
                }
                this.panels.clear();
                this.fieldBindings = [];
                var tabLookup = {};
                panelDefs.forEach(function (panel, p) {
                    var panelAndSection = panel.name.split(":");
                    var panelName = panelAndSection[0];
                    var sectionName = panelAndSection.length > 1 ? panelAndSection[1] : null;
                    var $detailsTab = tabLookup[panelName] || _this.panels.addTab(panelName, p == 0);
                    tabLookup[panelName] = $detailsTab;
                    var isHtmlPanel = (panelDefs[p].type == "html");
                    if (sectionName) {
                        $("<h4 class='details'>" + sectionName + "</h4>").appendTo($detailsTab);
                    }
                    var fields = panelDefs[p].fields;
                    if (fields) {
                        if ((fields.length == 1) && ((fields[0].fieldDefinition.fieldType == "text" && fields[0].options && fields[0].options.multiline)
                            || (fields[0].fieldDefinition.fieldType == "markers")
                            || (fields[0].fieldDefinition.fieldType == "html"))) {
                            // If we have a panel with a single multiline or markers field then create fill the panel completely with that field
                            var fieldBinding = _this.createFullPanelField(fields[0], "f_" + p + "_0", initiallyEditable, $detailsTab);
                            _this.fieldBindings.push(fieldBinding);
                        }
                        else {
                            var $table = $("<table class='details'></table>").appendTo($detailsTab);
                            var fieldLookup = {};
                            var linkedFields = [];
                            fields.forEach(function (panelField, f) {
                                if (panelField.fieldDefinition) {
                                    var fieldID = "f_" + p + "_" + f;
                                    var fieldBinding = _this.createDetailField(panelField, fieldID, initiallyEditable, isHtmlPanel, $table);
                                    _this.fieldBindings.push(fieldBinding);
                                    fieldLookup[panelField.fieldDefinition.name] = fieldBinding.detailField;
                                    if (FieldDefinitionUtil.isLinkedField(panelField.fieldDefinition)) {
                                        linkedFields.push(fieldBinding.detailField);
                                    }
                                }
                            });
                            // Wire up linked fields
                            if (!isHtmlPanel) {
                                linkedFields.forEach(function (linkedField) {
                                    var linkedToFieldName = linkedField.fieldDef.picklist ? linkedField.fieldDef.picklist.linkedField : "<missing>";
                                    var linkedToField = fieldLookup[linkedToFieldName];
                                    if (linkedToField) {
                                        linkedField.setLinkedToField(linkedToField);
                                    }
                                    else {
                                        Console.debug("Linked Field '" + linkedField.fieldDef.name + "' refers to missing field '" + linkedToFieldName + "'");
                                    }
                                });
                            }
                        }
                    }
                });
                // Wire up change events to mark panel as dirty
                this.fieldBindings
                    .map(function (fieldBinding) { return fieldBinding.detailField; })
                    .filter(function (detailField) { return detailField.fieldDef.isEditable; })
                    .forEach(function (detailField) {
                    detailField.onChanged(function (evt) { if (_this.changeHandler)
                        _this.changeHandler(evt); });
                });
            };
            ClipDetailsPanel.prototype.onChanged = function (changeHandler) {
                this.changeHandler = changeHandler;
            };
            ClipDetailsPanel.prototype.setEditable = function (editable) {
                this.fieldBindings.forEach(function (fieldBinding) {
                    fieldBinding.detailField.setEditable(editable);
                });
            };
            ClipDetailsPanel.prototype.createDetailField = function (panelField, fieldID, initiallyEditable, isHtmlPanel, $table) { return null; };
            ClipDetailsPanel.prototype.createFullPanelField = function (panelField, fieldID, initiallyEditable, $table) { return null; };
            ClipDetailsPanel.prototype.updateUI = function () { };
            ClipDetailsPanel.prototype.updateModel = function () { };
            ClipDetailsPanel.prototype.checkMandatoryFields = function () { return null; };
            return ClipDetailsPanel;
        }(Panel));
        panels.ClipDetailsPanel = ClipDetailsPanel;
        var SingleClipDetailsPanel = (function (_super) {
            __extends(SingleClipDetailsPanel, _super);
            function SingleClipDetailsPanel(element) {
                _super.call(this, element);
                this.clip = null;
                this.linkUID = null;
                this.viewingSharedLink = false;
            }
            SingleClipDetailsPanel.prototype.setClip = function (clip, linkUID, initiallyEditable) {
                if (linkUID === void 0) { linkUID = null; }
                if (initiallyEditable === void 0) { initiallyEditable = true; }
                this.clip = clip;
                this.linkUID = linkUID;
                _super.prototype.initialisePanels.call(this, clip, linkUID, initiallyEditable);
            };
            SingleClipDetailsPanel.prototype.setViewingSharedLink = function (viewingSharedLink) {
                this.viewingSharedLink = viewingSharedLink;
            };
            SingleClipDetailsPanel.prototype.createDetailField = function (panelField, fieldID, initiallyEditable, isHtmlPanel, $table) {
                var fieldName = panelField.fieldDefinition.isBuiltin ? panelField.fieldDefinition.name.split("/")[0] : panelField.fieldDefinition.name;
                var trCSS = panelField.options && panelField.options.hideIfBlank ? " style='display:none;'" : "";
                var thCSS = (panelField.options && panelField.options.mandatory) || panelField.fieldDefinition.isMandatory ? " class='mandatory'" : "";
                var $tr = $("<tr id='" + fieldID + "_row'" + trCSS + "><th" + thCSS + ">" + HtmlUtil.escapeHtml(fieldName) + "</th></tr>").appendTo($table);
                var $td = $("<td></td>").appendTo($tr);
                var detailField = isHtmlPanel ? new HtmlField(fieldID, panelField, $td) : DetailFieldFactory.createField(fieldID, panelField, $td);
                if (initiallyEditable)
                    detailField.setEditable(this.clip.isEditable);
                return new FieldBinding(detailField, AccessorFactory.createAccessor(panelField.fieldDefinition, this.viewingSharedLink));
            };
            SingleClipDetailsPanel.prototype.createFullPanelField = function (panelField, fieldID, initiallyEditable, $tab) {
                var $container = $("<div class='single-field-container'>").appendTo($tab);
                var detailField = DetailFieldFactory.createField(fieldID, panelField, $container);
                if (initiallyEditable)
                    detailField.setEditable(this.clip.isEditable);
                return new FieldBinding(detailField, AccessorFactory.createAccessor(panelField.fieldDefinition, this.viewingSharedLink));
            };
            SingleClipDetailsPanel.prototype.updateUI = function () {
                var _this = this;
                this.fieldBindings.forEach(function (fieldBinding) {
                    fieldBinding.originalValue = fieldBinding.fieldAccessor.getValue(_this.clip);
                    fieldBinding.detailField.setValue(fieldBinding.originalValue);
                    if (fieldBinding.detailField.panelField.options && fieldBinding.detailField.panelField.options.hideIfBlank) {
                        if (fieldBinding.originalValue) {
                            $("#" + fieldBinding.detailField.fieldID + "_row").show();
                        }
                        else {
                            $("#" + fieldBinding.detailField.fieldID + "_row").hide();
                        }
                    }
                });
            };
            SingleClipDetailsPanel.prototype.updateModel = function () {
                var _this = this;
                this.fieldBindings
                    .filter(function (fieldBinding) { return fieldBinding.detailField.fieldDef.isEditable; })
                    .forEach(function (fieldBinding) {
                    // Only set value on model if it's changed to cope with case where field appears twice on different tabs
                    var fieldValue = fieldBinding.detailField.getValue();
                    var newValue = fieldValue ? String(fieldValue) : "";
                    var originalValue = fieldBinding.originalValue ? String(fieldBinding.originalValue) : "";
                    if (newValue != originalValue) {
                        fieldBinding.fieldAccessor.setValue(_this.clip, fieldValue);
                    }
                    fieldBinding.detailField.setEditable(false);
                });
                // Clip has been saved so 
                window.onbeforeunload = null;
            };
            SingleClipDetailsPanel.prototype.checkMandatoryFields = function () {
                var firstNotSet = this.fieldBindings
                    .filter(function (fieldBinding) { return fieldBinding.detailField.fieldDef.isMandatory; })
                    .find(function (fieldBinding) {
                    // Returns true if NOT set
                    return fieldBinding.detailField.getValue() ? false : true;
                });
                return firstNotSet ? firstNotSet.detailField.fieldDef.name : null;
            };
            return SingleClipDetailsPanel;
        }(ClipDetailsPanel));
        panels.SingleClipDetailsPanel = SingleClipDetailsPanel;
        var MultiClipDetailsPanel = (function (_super) {
            __extends(MultiClipDetailsPanel, _super);
            function MultiClipDetailsPanel(element) {
                _super.call(this, element);
                this.clips = null;
            }
            MultiClipDetailsPanel.prototype.setClips = function (clips) {
                this.clips = clips;
                _super.prototype.initialisePanels.call(this, clips[0], null, false);
            };
            MultiClipDetailsPanel.prototype.createDetailField = function (panelField, fieldID, initiallyEditable, isHtmlPanel, $table) {
                var _this = this;
                var fieldName = panelField.fieldDefinition.isBuiltin ? panelField.fieldDefinition.name.split("/")[0] : panelField.fieldDefinition.name;
                var $tr = $("<tr class='readonly'><th>" + HtmlUtil.escapeHtml(fieldName) + "</th></tr>").appendTo($table);
                var $td = $("<td></td>").appendTo($tr);
                var detailField = DetailFieldFactory.createField(fieldID, panelField, $td);
                detailField.setEditable(false);
                var fieldBinding = new FieldBinding(detailField, AccessorFactory.createAccessor(panelField.fieldDefinition, false));
                if (!isHtmlPanel) {
                    $td = $("<td></td>").appendTo($tr);
                    if (panelField.fieldDefinition.isEditable && (!panelField.options || !panelField.options.readOnly)) {
                        var chkEdit = CheckBox.create({}, $td);
                        chkEdit.onChanged(function (evt) {
                            if (chkEdit.isChecked()) {
                                fieldBinding.edited = true;
                                $tr.removeClass("readonly");
                                detailField.setEditable(true);
                            }
                            else {
                                fieldBinding.edited = false;
                                $tr.addClass("readonly");
                                _this.updateDetailField(fieldBinding);
                                detailField.setEditable(false);
                            }
                        });
                    }
                }
                return fieldBinding;
            };
            MultiClipDetailsPanel.prototype.createFullPanelField = function (panelField, fieldID, initiallyEditable, $table) {
                throw "Not Implemented";
            };
            MultiClipDetailsPanel.prototype.updateUI = function () {
                var _this = this;
                this.fieldBindings.forEach(function (fieldBinding) { return _this.updateDetailField(fieldBinding); });
            };
            MultiClipDetailsPanel.prototype.updateModel = function () {
                var _this = this;
                this.fieldBindings.forEach(function (fieldBinding) {
                    if (fieldBinding.edited) {
                        // apply new value to all clips
                        var value = fieldBinding.detailField.getValue();
                        _this.clips.forEach(function (clip) {
                            fieldBinding.fieldAccessor.setValue(clip, value);
                        });
                        fieldBinding.detailField.setEditable(false);
                    }
                });
            };
            MultiClipDetailsPanel.prototype.updateDetailField = function (fieldBinding) {
                var commonValue = null;
                var valuesVary = false;
                for (var i = 0; i < this.clips.length; i++) {
                    var clip = this.clips[i];
                    var clipValue = fieldBinding.fieldAccessor.getValue(clip);
                    if (i == 0) {
                        commonValue = clipValue;
                    }
                    else {
                        if (clipValue !== commonValue) {
                            valuesVary = true;
                            break;
                        }
                    }
                }
                if (valuesVary) {
                    fieldBinding.detailField.setValue(null);
                }
                else {
                    fieldBinding.detailField.setValue(commonValue);
                }
            };
            return MultiClipDetailsPanel;
        }(ClipDetailsPanel));
        panels.MultiClipDetailsPanel = MultiClipDetailsPanel;
    })(panels = ui.panels || (ui.panels = {}));
})(ui || (ui = {}));
