module ui.panels
{
    import HtmlUtil = util.HtmlUtil;
    import Panel = controls.Panel;
    import TabPanel = controls.TabPanel;
    import CheckBox = controls.CheckBox;
    import Console = controls.Console;

    import $catdv = catdv.RestApi;
    import Clip = catdv.Clip;
    import PanelDefinition = catdv.PanelDefinition;
    import PanelField = catdv.PanelField;
    import FieldDefinition = catdv.FieldDefinition;
    import PartialResultSet = catdv.PartialResultSet;
    import FieldDefinitionUtil = catdv.FieldDefinitionUtil;

    import DetailsPanelManager = logic.DetailPanelManager;
    import DetailPanelField = logic.DetailPanelField;
    import FieldBinding = logic.FieldBinding;
    import DetailFieldFactory = logic.DetailFieldFactory;
    import FieldAccessor = logic.FieldAccessor;
    import AccessorFactory = logic.AccessorFactory;
    import ClipManager = logic.ClipManager;
    import HtmlField = logic.HtmlField;

    export class ClipDetailsPanel extends Panel
    {
        public panels: TabPanel = null;
        public fieldBindings: FieldBinding[] = null;
        
        private changeHandler : (evt: any) => void = null;

        constructor(element: any)
        {
            super(element);
        }

        public initialisePanels(clip: Clip, linkUID: string, initiallyEditable: boolean)
        {
            DetailsPanelManager.getPanelDefinitions(clip, linkUID,(panelDefs) =>
            {
                this.createPanels(panelDefs, initiallyEditable);
                this.updateUI();
            });
        }

        public createPanels(panelDefs: PanelDefinition[], initiallyEditable: boolean)
        {
            if (this.panels == null)
            {
                this.panels = TabPanel.create(this);
            }
            this.panels.clear();
            this.fieldBindings = [];
            
            var tabLookup : {[name : string] : JQuery} = {};
            
            panelDefs.forEach((panel, p) =>
            {
                var panelAndSection = panel.name.split(":");
                var panelName = panelAndSection[0];
                var sectionName = panelAndSection.length > 1 ? panelAndSection[1] : null;
                
                var $detailsTab = tabLookup[panelName] || this.panels.addTab(panelName, p == 0);
                tabLookup[panelName] = $detailsTab;
                
                var isHtmlPanel : boolean = (panelDefs[p].type == "html");

                if(sectionName)
                {
                   $("<h4 class='details'>" + sectionName + "</h4>").appendTo($detailsTab); 
                }
                
                var fields = panelDefs[p].fields;
                if (fields)
                {
                    if ((fields.length == 1) && (
                        (fields[0].fieldDefinition.fieldType == "text" && fields[0].options && fields[0].options.multiline)
                        || (fields[0].fieldDefinition.fieldType == "markers")
                        || (fields[0].fieldDefinition.fieldType == "html")))
                    {
                        // If we have a panel with a single multiline or markers field then create fill the panel completely with that field
                        var fieldBinding = this.createFullPanelField(fields[0], "f_" + p + "_0", initiallyEditable, $detailsTab);
                        this.fieldBindings.push(fieldBinding);
                    }
                    else
                    {
                        var $table = $("<table class='details'></table>").appendTo($detailsTab);
                        var fieldLookup: { [name: string]: DetailPanelField } = {};
                        var linkedFields: DetailPanelField[] = [];
                        fields.forEach((panelField, f) =>
                        {
                            if (panelField.fieldDefinition)
                            {
                                var fieldID = "f_" + p + "_" + f;
                                var fieldBinding = this.createDetailField(panelField, fieldID, initiallyEditable, isHtmlPanel, $table);
                                this.fieldBindings.push(fieldBinding);

                                fieldLookup[panelField.fieldDefinition.name] = fieldBinding.detailField;
                                if (FieldDefinitionUtil.isLinkedField(panelField.fieldDefinition))
                                {
                                    linkedFields.push(fieldBinding.detailField);
                                }
                            }
                        });
                    
                        // Wire up linked fields
                        if (!isHtmlPanel)
                        {
                            linkedFields.forEach((linkedField) =>
                            {
                                var linkedToFieldName = linkedField.fieldDef.picklist ? linkedField.fieldDef.picklist.linkedField : "<missing>";
                                var linkedToField = fieldLookup[linkedToFieldName];
                                if (linkedToField)
                                {
                                    linkedField.setLinkedToField(linkedToField);
                                }
                                else
                                {
                                    Console.debug("Linked Field '" + linkedField.fieldDef.name + "' refers to missing field '" + linkedToFieldName + "'");
                                }
                            });
                        }
                    }
                }
            });
            
            // Wire up change events to mark panel as dirty
            this.fieldBindings
                .map((fieldBinding) => fieldBinding.detailField)
                .filter((detailField) => detailField.fieldDef.isEditable)
                .forEach((detailField) => {
                    detailField.onChanged((evt) => { if(this.changeHandler) this.changeHandler(evt); });
                });
        }

        public onChanged(changeHandler : (evt: any) => void)
        {
            this.changeHandler = changeHandler;
        }

        public setEditable(editable: boolean)
        {
            this.fieldBindings.forEach((fieldBinding) =>
            {
                fieldBinding.detailField.setEditable(editable);
            });
        }
        
        public createDetailField(panelField: PanelField, fieldID: string, initiallyEditable: boolean, isHtmlPanel: boolean, $table: JQuery): FieldBinding
        { /* abstract */ return null; }

        public createFullPanelField(panelField: PanelField, fieldID: string, initiallyEditable: boolean, $table: JQuery): FieldBinding
        { /* abstract */ return null; }

        public updateUI()
        { /* abstract */ }

        public updateModel()
        { /* abstract */ }
        
        public checkMandatoryFields(): string
        { /* abstract */ return null }
    }

    export class SingleClipDetailsPanel extends ClipDetailsPanel
    {
        private clip: Clip = null;
        private linkUID: string = null;
        private viewingSharedLink : boolean = false;
        
        constructor(element: any)
        {
            super(element);
        }

        public setClip(clip: Clip, linkUID: string = null, initiallyEditable: boolean = true)
        {
            this.clip = clip;
            this.linkUID = linkUID;
            super.initialisePanels(clip, linkUID, initiallyEditable);
        }
        
        public setViewingSharedLink(viewingSharedLink : boolean)
        {
            this.viewingSharedLink = viewingSharedLink;
        }

        public createDetailField(panelField: PanelField, fieldID: string, initiallyEditable: boolean, isHtmlPanel: boolean, $table: JQuery): FieldBinding
        {
            var fieldName = panelField.fieldDefinition.isBuiltin ? panelField.fieldDefinition.name.split("/")[0] : panelField.fieldDefinition.name;
            var trCSS = panelField.options && panelField.options.hideIfBlank ? " style='display:none;'" : "";
            var thCSS = (panelField.options && panelField.options.mandatory) || panelField.fieldDefinition.isMandatory ? " class='mandatory'" : "";
            var $tr = $("<tr id='" + fieldID + "_row'" + trCSS + "><th" + thCSS + ">" + HtmlUtil.escapeHtml(fieldName) + "</th></tr>").appendTo($table);
            var $td = $("<td></td>").appendTo($tr);
            var detailField = isHtmlPanel ?  new HtmlField(fieldID, panelField, $td) : DetailFieldFactory.createField(fieldID, panelField, $td);
            if (initiallyEditable) detailField.setEditable(this.clip.isEditable);
            return new FieldBinding(detailField, AccessorFactory.createAccessor(panelField.fieldDefinition, this.viewingSharedLink));
        }

        public createFullPanelField(panelField: PanelField, fieldID: string, initiallyEditable: boolean, $tab: JQuery): FieldBinding
        {
            var $container = $("<div class='single-field-container'>").appendTo($tab);
            var detailField = DetailFieldFactory.createField(fieldID, panelField, $container);
            if (initiallyEditable) detailField.setEditable(this.clip.isEditable);
            return new FieldBinding(detailField, AccessorFactory.createAccessor(panelField.fieldDefinition, this.viewingSharedLink));
        }

        public updateUI()
        {
            this.fieldBindings.forEach((fieldBinding) =>
            {
                fieldBinding.originalValue = fieldBinding.fieldAccessor.getValue(this.clip);
                fieldBinding.detailField.setValue(fieldBinding.originalValue);
                if (fieldBinding.detailField.panelField.options && fieldBinding.detailField.panelField.options.hideIfBlank)
                {
                    if (fieldBinding.originalValue)
                    {
                        $("#" + fieldBinding.detailField.fieldID + "_row").show();
                    }
                    else
                    {
                        $("#" + fieldBinding.detailField.fieldID + "_row").hide();
                    }
                }
            });
        }

        public updateModel()
        {
            this.fieldBindings
                .filter((fieldBinding) => fieldBinding.detailField.fieldDef.isEditable)
                .forEach((fieldBinding) =>
                {
                    // Only set value on model if it's changed to cope with case where field appears twice on different tabs
                    var fieldValue = fieldBinding.detailField.getValue();
                    var newValue = fieldValue ? String(fieldValue) : "";
                    var originalValue = fieldBinding.originalValue ? String(fieldBinding.originalValue) : "";
                    if (newValue != originalValue)
                    {
                        fieldBinding.fieldAccessor.setValue(this.clip, fieldValue);
                    }
                    fieldBinding.detailField.setEditable(false);
                });
            // Clip has been saved so 
            window.onbeforeunload = null;
        }
        
        public checkMandatoryFields() : string
        {           
            var firstNotSet = this.fieldBindings
                .filter((fieldBinding) => fieldBinding.detailField.fieldDef.isMandatory) 
                .find((fieldBinding) =>
                {
                    // Returns true if NOT set
                    return fieldBinding.detailField.getValue() ? false : true;
                });
            return firstNotSet ? firstNotSet.detailField.fieldDef.name : null;
        }

    }

    export class MultiClipDetailsPanel extends ClipDetailsPanel
    {
        private clips: Clip[] = null;

        constructor(element: any)
        {
            super(element);
        }

        public setClips(clips: Clip[])
        {
            this.clips = clips;
            super.initialisePanels(clips[0], null, false);
        }

        public createDetailField(panelField: PanelField, fieldID: string, initiallyEditable: boolean, isHtmlPanel: boolean, $table: JQuery): FieldBinding
        {
            var fieldName = panelField.fieldDefinition.isBuiltin ? panelField.fieldDefinition.name.split("/")[0] : panelField.fieldDefinition.name;
            var $tr = $("<tr class='readonly'><th>" + HtmlUtil.escapeHtml(fieldName) + "</th></tr>").appendTo($table);
            var $td = $("<td></td>").appendTo($tr);

            var detailField = DetailFieldFactory.createField(fieldID, panelField, $td);
            detailField.setEditable(false);

            var fieldBinding = new FieldBinding(detailField, AccessorFactory.createAccessor(panelField.fieldDefinition, false));

            if (!isHtmlPanel)
            {
                $td = $("<td></td>").appendTo($tr);
                if (panelField.fieldDefinition.isEditable && (!panelField.options || !panelField.options.readOnly))
                {
                    var chkEdit = CheckBox.create({}, $td);

                    chkEdit.onChanged((evt) =>
                    {
                        if (chkEdit.isChecked())
                        {
                            fieldBinding.edited = true;
                            $tr.removeClass("readonly");
                            detailField.setEditable(true);
                        }
                        else
                        {
                            fieldBinding.edited = false;
                            $tr.addClass("readonly");
                            this.updateDetailField(fieldBinding);
                            detailField.setEditable(false);
                        }
                    });
                }
            }

            return fieldBinding;
        }

        public createFullPanelField(panelField: PanelField, fieldID: string, initiallyEditable: boolean, $table: JQuery): FieldBinding
        {
            throw "Not Implemented";
        }

        public updateUI()
        {
            this.fieldBindings.forEach((fieldBinding) => this.updateDetailField(fieldBinding));
        }

        public updateModel()
        {
            this.fieldBindings.forEach((fieldBinding) =>
            {
                if (fieldBinding.edited)
                {
                    // apply new value to all clips
                    var value = fieldBinding.detailField.getValue();
                    this.clips.forEach((clip) =>
                    {
                        fieldBinding.fieldAccessor.setValue(clip, value);
                    });
                    fieldBinding.detailField.setEditable(false);
                }
            });
        }
        
        private updateDetailField(fieldBinding: FieldBinding)
        {
            var commonValue = null;
            var valuesVary: boolean = false;

            for (var i = 0; i < this.clips.length; i++)
            {
                var clip = this.clips[i];
                var clipValue = fieldBinding.fieldAccessor.getValue(clip);
                if (i == 0)
                {
                    commonValue = clipValue;
                }
                else
                {
                    if (clipValue !== commonValue)
                    {
                        valuesVary = true;
                        break;
                    }
                }
            }

            if (valuesVary)
            {
                fieldBinding.detailField.setValue(null);
            }
            else
            {
                fieldBinding.detailField.setValue(commonValue);
            }
        }

    }
}