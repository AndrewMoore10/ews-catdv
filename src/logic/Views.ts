module logic
{
    import DataTableColumn = controls.DataTableColumn;

    import $catdv = catdv.RestApi;
    import Clip = catdv.Clip;
    import DateUtil = catdv.DateUtil;
    import TimecodeUtil = catdv.TimecodeUtil;
    import FieldDefinition = catdv.FieldDefinition;
    import FieldDefinitionUtil = catdv.FieldDefinitionUtil;
    import ViewField = catdv.ViewField;
    import ViewDefinition = catdv.ViewDefinition;
    
    import FormatUtil = util.FormatUtil;
    import HtmlUtil = util.HtmlUtil;

    export class ViewInfo
    {
        name: string;
        options: any;
        columns: ViewColumn[];
    };

    export class ViewNames
    {
        names: string[];
        defaultView: string;
    }

    export class ViewManager
    {
        // Default View Definitions
        private static DEFAULT_TABLE_VIEWS = [
            {
                name: "Concise",
                options: { "spacing": "normal" },
                fields: ["TY2", "NM1", "I1", "O1", "D1", "FF", "NT", "STS"]
            },
            {
                name: "Normal",
                options: { "spacing": "normal", "isDefault" : true },
                fields: ["P1", "TY2", "NM1", "BN", "I1", "O1", "D1", "FF", "RD1", "NT", "STS"]
            },
            {
                name: "Full",
                options: { "spacing": "normal" },
                fields: ["P1", "TY2", "NM1", "TY1", "BN", "TP", "I1", "O1", "D1", "FF", "RD1", "NT", "STS"]
            }
        ];
        private static DEFAULT_GRID_VIEWS = [
            {
                name: "Concise",
                options: { "text": "below", "size": "small" },
                fields: ["TY2","NM1"]
            },
            {
                name: "Normal",
                options: { "text": "below", "size": "medium" },
                fields: ["TY2","NM1"]
            },
            {
                name: "Detailed",
                options: { "text": "right", "size": "medium", "isDefault" : true },
                fields: ["TY2","NM1","D1","FF", "RD1"]
            },
            {
                name: "Large",
                options: { "text": "below", "size": "large" },
                fields: ["TY2","NM1","D1","FF"]
            }
        ];
        private static DEFAULT_FILMSTRIP_VIEWS = [
            {
                name: "Small",
                options: { "allThumbnails": "false", "poster": "false", "size": "small" },
                fields: ["TY2","NM1"]
            },
            {
                name: "Medium",
                options: { "allThumbnails": "false", "poster": "false", "size": "medium", "isDefault" : true },
                fields: ["TY2","NM1","D1","FF"]
            },
            {
                name: "Large",
                options: { "allThumbnails": "false", "poster": "false", "size": "large" },
                fields: ["TY2","NM1","D1","FF", "RD1"]
            }
        ];


        public static getViewNameInfo(viewClipUrl: string, callback: (viewNames: { [type: string]: ViewNames }) => void)
        {
            ViewManager.getViews(viewClipUrl,(viewInfo: { [type: string]: ViewInfo[] }) =>
            {
                var viewNames: { [type: string]: ViewNames } = {};
                for (var viewType in viewInfo)
                {
                    var views = viewInfo[viewType];
                    var names = views.map((view) => view.name);
                    var defaultView = views.find((view) => (view.options && view.options.isDefault) ? true : false);
                    var defaultViewName = defaultView ?  defaultView.name : names.contains("Normal") ? "Normal" : names.contains("Medium") ? "Medium" : names[0];
                    viewNames[viewType] = {
                        names: names,
                        defaultView: defaultViewName
                    };
                }
                callback(viewNames);
            });
        }

        public static getView(viewType: string, viewName: string, viewClipUrl: string, callback: (view: ViewInfo) => void)
        {
            ViewManager.getViews(viewClipUrl,(viewInfo: { [type: string]: ViewInfo[] }) =>
            {
                var views = viewInfo[viewType];
                var view = views.find((view) => view.name == viewName);
                callback(view || views[0]);
            });
        }

        public static clearCache()
        {
            ViewManager.viewInfoCache = null;
        }

        private static viewInfoCache: { [type: string]: ViewInfo[] } = null;

        private static getViews(viewClipUrl: string, callback: (viewInfo: { [type: string]: ViewInfo[] }) => void)
        {
            if (ViewManager.viewInfoCache == null)
            {
                ViewSettingsManager.getViewDefinitions((viewDefinitions) =>
                {
                    ViewManager.viewInfoCache = {
                        "list": [],
                        "grid": [],
                        "filmstrip": []
                    }

                    viewDefinitions.forEach((viewDefinition) =>
                    {
                        if (viewDefinition.type == "list")
                        {
                            ViewManager.viewInfoCache["list"].push(ViewManager.convertViewDefinition(viewDefinition, viewClipUrl));
                        }
                        else if (viewDefinition.type == "grid")
                        {
                            ViewManager.viewInfoCache["grid"].push(ViewManager.convertViewDefinition(viewDefinition, viewClipUrl));
                        }
                        else if (viewDefinition.type == "filmstrip")
                        {
                            ViewManager.viewInfoCache["filmstrip"].push(ViewManager.convertViewDefinition(viewDefinition, viewClipUrl));
                        }
                    });

                    if (ViewManager.viewInfoCache["list"].length == 0)
                    {
                        ViewManager.viewInfoCache["list"] = ViewManager.convertDefaultViewDef(ViewManager.DEFAULT_TABLE_VIEWS, viewClipUrl);
                    }
                    if (ViewManager.viewInfoCache["grid"].length == 0)
                    {
                        ViewManager.viewInfoCache["grid"] = ViewManager.convertDefaultViewDef(ViewManager.DEFAULT_GRID_VIEWS, viewClipUrl);
                    }
                    if (ViewManager.viewInfoCache["filmstrip"].length == 0)
                    {
                        ViewManager.viewInfoCache["filmstrip"] = ViewManager.convertDefaultViewDef(ViewManager.DEFAULT_FILMSTRIP_VIEWS, viewClipUrl);
                    }

                    callback(ViewManager.viewInfoCache);
                });
            }
            else
            {
                callback(ViewManager.viewInfoCache);
            }
        }

        private static convertViewDefinition(viewDefinition: ViewDefinition, viewClipUrl: string): ViewInfo
        {
            var viewInfo: ViewInfo = {
                name: viewDefinition.name,
                options: viewDefinition.options,
                columns: []
            };

            if (viewDefinition.fields != null)
            {
                viewDefinition.fields.forEach((viewField) => 
                {
                    if (viewField.fieldDefinition)
                    {
                        var fieldAccesor = AccessorFactory.createAccessor(viewField.fieldDefinition, false);
                        if (viewField.fieldDefinition.isBuiltin)
                        {
                            var builtInFieldDef = BuiltInFields[viewField.fieldDefinition.ID];
                            if (builtInFieldDef)
                            {
                                viewField.options = $.extend({ width: builtInFieldDef.width }, viewField.options );
                            }
                        }
                        viewInfo.columns.push(ViewColumnFactory.createColumn(viewField, fieldAccesor, viewClipUrl));
                    }
                });
            }

            return viewInfo
        }


        private static convertDefaultViewDef(defaultViewDefinitions: any[], viewClipUrl: string): ViewInfo[]
        {
            var views: ViewInfo[] = [];

            defaultViewDefinitions.forEach((defaultViewDefinition) =>
            {
                var columns = [];
                defaultViewDefinition.fields.forEach((fieldDefinitionID) =>
                {
                    var fieldDefinition = BuiltInFields[fieldDefinitionID];
                    var fieldAccesor = AccessorFactory.createAccessor(fieldDefinition, false);
                    var viewField = {
                        fieldDefID : fieldDefinition.ID,
                        fieldDefinition: fieldDefinition
                    };
                    columns.push(ViewColumnFactory.createColumn(viewField, fieldAccesor, viewClipUrl));
                });
                views.push({
                    name: defaultViewDefinition.name,
                    options: defaultViewDefinition.options,
                    columns: columns
                });
            });
            return views;
        }

    }

    export class ViewColumn implements DataTableColumn
    {
        public title: string;
        public width: number;
        public isSortable: boolean;
        public sortBy: string;
        public renderer: (object: any, val: any) => string;

        public viewField : ViewField;
        public fieldDef: FieldDefinition;
        public fieldAccesor: FieldAccessor;

        constructor(viewField : ViewField, fieldAccesor: FieldAccessor)
        {
            this.fieldDef = viewField.fieldDefinition;
            this.fieldAccesor = fieldAccesor;
            this.title = this.fieldDef.name;
            this.width = viewField.options ? viewField.options.width : null;
            this.isSortable = this.fieldDef.isSortable;
            this.sortBy = FieldDefinitionUtil.getSortBy(this.fieldDef);
            this.renderer = (object: any, val: any) => this.render(<Clip>object);
        }

        public render(clip: Clip): string
        {  /* abstract */ return null; }
    }

    export class TextColumn extends ViewColumn
    {
        private static DATE_FORMAT = "YYYY-MM-DD";
        private static DATETIME_FORMAT = "YYYY-MM-DD HH:mm:ss";
        private static TIME_FORMAT = "HH:mm:ss";

        constructor(viewField: ViewField, fieldAccesor: FieldAccessor)
        {
            super(viewField, fieldAccesor);
        }

        public render(clip: Clip): string
        {
            var value = this.fieldAccesor.getValue(clip);

            if (!value) return "";

            switch (this.fieldDef.fieldType)
            {
                case "date":
                    return DateUtil.format(<Date>value, TextColumn.DATE_FORMAT);
                case "datetime":
                    return DateUtil.format(<Date>value, TextColumn.DATETIME_FORMAT);
                case "time":
                    return DateUtil.format(<Date>value, TextColumn.TIME_FORMAT);
                default:
                    if (value instanceof Array)
                    {
                        return HtmlUtil.escapeHtml((<Array<string>>value).join(","));
                    }
                    else if(typeof value == "object")
                    {
                        return HtmlUtil.escapeHtml(value, 64);
                    }
                    else
                    {
                        return HtmlUtil.escapeHtml(value, this.width ? this.width / 3 : 64); // rough calculation to stop excessive wrapping
                    }
            }
        }
    }


    export class NameColumn extends ViewColumn
    {
        private viewClipUrl: string;

        constructor(viewField: ViewField, fieldAccesor: FieldAccessor, viewClipUrl: string)
        {
            super(viewField, fieldAccesor);
            this.viewClipUrl = viewClipUrl;
        }

        public render(clip: Clip): string
        {
            return this.viewClipUrl ? "<a href='" + this.viewClipUrl + "?id=" + clip.ID + "' role='button'>" + HtmlUtil.escapeHtml(clip.name) + "</a>" : HtmlUtil.escapeHtml(clip.name);
        }
    }

    export class ThumbnailColumn extends ViewColumn
    {
        constructor(viewField: ViewField, fieldAccesor: FieldAccessor)
        {
            super(viewField, fieldAccesor);
        }

        public render(clip: Clip): string
        {
            var thumbnailID = this.fieldAccesor.getValue(clip);
            return thumbnailID ? "<img src='" + $catdv.getApiUrl("thumbnails/" + thumbnailID + "?width=64&height=48&fmt=png") + "'>" : "";
        }
    }

    export class TypeIconColumn extends ViewColumn
    {
        public static CLIP_TYPE_IMAGE_PATH = "img";

        constructor(viewField: ViewField, fieldAccesor: FieldAccessor)
        {
            super(viewField, fieldAccesor);
        }

        public render(clip: Clip): string
        {
            var clipType = this.fieldAccesor.getValue(clip);
            return "<img class='typeicon' src='" + TypeIconColumn.CLIP_TYPE_IMAGE_PATH + "/cliptype_" + clipType + ".png'>";
        }
    }


    export class MediaPathColumn extends ViewColumn
    {
        private div: Element;

        constructor(viewField: ViewField, fieldAccesor: FieldAccessor)
        {
            super(viewField, fieldAccesor);
        }

        public render(clip: Clip): string
        {
            var link = this.fieldAccesor.getValue(clip);
            if (link)
            {
                return link.downloadUrl ? "<a href='" + link.downloadUrl + "'>" + HtmlUtil.escapeHtml(link.path) + "</a>" : HtmlUtil.escapeHtml(link.path);
            }
            else
            {
                return "";
            }
        }
    }

    export class FormattedNumericColumn extends ViewColumn
    {
        private div: Element;
        private formatter: (value: number) => string;

        constructor(viewField: ViewField, fieldAccesor: FieldAccessor, formatter: (value: number) => string)
        {
            super(viewField, fieldAccesor);
            this.formatter = formatter;
        }

        public render(clip: Clip): string
        {
            var value = this.fieldAccesor.getValue(clip);
            return value ? this.formatter(value) : "";
        }
    }

    export class ViewColumnFactory
    {
        public static createColumn(viewField: ViewField, fieldAccesor: FieldAccessor, viewClipUrl: string): ViewColumn
        {
            if (viewField.fieldDefID == "NM1")
            {
                return new NameColumn(viewField, fieldAccesor, viewClipUrl);
            }
            else if ((viewField.fieldDefID == "MF") || (viewField.fieldDefID == "PF"))
            {
                return new MediaPathColumn(viewField, fieldAccesor);
            }
            if (viewField.fieldDefinition.fieldType == "thumbnail")
            {
                return new ThumbnailColumn(viewField, fieldAccesor);
            }
            else if (viewField.fieldDefinition.fieldType == "typeicon")
            {
                return new TypeIconColumn(viewField, fieldAccesor);
            }
            else if (viewField.fieldDefinition.fieldType == "bytes") 
            {
                return new FormattedNumericColumn(viewField, fieldAccesor, FormatUtil.formatBytes);
            }
            else if (viewField.fieldDefinition.fieldType == "bps")
            {
                return new FormattedNumericColumn(viewField, fieldAccesor, FormatUtil.formatBytesPerSecond);
            }
            else
            {
                return new TextColumn(viewField, fieldAccesor);
            }
        }
    }

}
