module logic
{
    import $catdv = catdv.RestApi;
    import PartialResultSet = catdv.PartialResultSet;
    import FieldDefinition = catdv.FieldDefinition;
    import PanelDefinition = catdv.PanelDefinition;
    import ViewDefinition = catdv.ViewDefinition;
    import FormDefinition = catdv.FormDefinition;
    import ViewField = catdv.ViewField;
    import ClipQuery = catdv.ClipQuery;

    import Platform = util.Platform;

    // Static config
    export class Config
    {
        public static get viewClipUrl(): string
        {
            return "clip-details.jsp";
        }
    }
    
    export class ClientSettings
    {
        public static get viewType(): string
        {
            return $.cookie("catdv_viewType");
        }
        public static set viewType(viewType: string)
        {
            $.cookie("catdv_viewType", viewType);
        }

        public static get viewName(): string
        {
            return $.cookie("catdv_viewName");
        }
        public static set viewName(viewType: string)
        {
            $.cookie("catdv_viewName", viewType);
        }

        public static get pagingOffset(): number
        {
            return parseInt($.cookie("catdv_pagingOffset") || "0");
        }
        public static set pagingOffset(pagingOffset: number)
        {
            $.cookie("catdv_pagingOffset", String(pagingOffset));
        }

        public static saveClipQuery(clipQuery: ClipQuery): void
        {
            $.cookie("catdv_clipQuery", clipQuery ? JSON.stringify(clipQuery) : null);
        }

        public static getSavedClipQuery(): ClipQuery
        {
            var jsonClipQuery = $.cookie("catdv_clipQuery");
            return jsonClipQuery ? JSON.parse(jsonClipQuery) : { title: "Clips", terms: [] };
        }

        public static saveActiveFilters(activeFilters: FilterItem[]): void
        {
            $.cookie("catdv_activeFilters", JSON.stringify(activeFilters));
        }

        public static getSavedActiveFilters(): FilterItem[]
        {
            var jsonActiveFilters = $.cookie("catdv_activeFilters");
            return jsonActiveFilters ? JSON.parse(jsonActiveFilters) : [];
        }

        public static save(): void
        {
            // Nothing to do for cookie implementation
        }

    }


    export class ServerSettings 
    {
        private static defaultDateTimeFormat: string = "YYYY-MM-DD HH:mm:ss";
        private static defaultDateFormat: string = "YYYY-MM-DD";
        private static defaultTimeFormat: string = "HH:mm:ss";
         // Expose workspace settings through ServerSettings to create common inteface for Premiere Panel
        public static get simpleSearchField(): string
        {
            return catdv.settings.simpleSearchField;
        }
        public static get showRecentClips(): boolean
        {
            return catdv.settings.showRecentClips;
        }
        public static get initialMessage(): string
        {
            return catdv.settings.initialMessage;
        }
        public static get noResultsMessage(): string
        {
            return catdv.settings.noResultsMessage;
        }
        public static get clipsPageSize(): number
        {
            return Number(catdv.settings.clipsPageSize);
        }

        public static get canDownloadOriginals(): boolean 
        {
            return catdv.settings.canDownloadOriginals;
        }
        public static get canDownloadsProxies(): boolean
        {
            return catdv.settings.canDownloadProxies;
        }
        public static get canUpload(): boolean
        {
            return catdv.settings.canUploadMedia;
        }
        public static get sharedLinkDownloadUrl(): string
        {
            return catdv.settings.sharedLinkDownloadUrl;
        }
        
        public static get isEnterpriseServer(): boolean
        {
            return catdv.edition == "enterprise" || catdv.edition == "pegasus";
        }
        public static get isPegasusServer(): boolean
        {
            return catdv.edition == "pegasus";
        }

        public static get dateTimeFormat(): string
        {
            return catdv.settings.dateTimeFormat || ServerSettings.defaultDateTimeFormat;
        }
        public static get dateFormat(): string 
        {
            var timeStart = ServerSettings.dateTimeFormat.toLowerCase().indexOf("h");
            return ServerSettings.dateTimeFormat.substring(0, timeStart).trim();
        }
        public static get timeFormat(): string
        {
            var timeStart = ServerSettings.dateTimeFormat.toLowerCase().indexOf("h");
            return ServerSettings.dateTimeFormat.substring(timeStart).trim();
        }

        public static get useQuickTime(): boolean
        {
            return Platform.isOldIE() || (catdv.settings.webPlayer && catdv.settings.webPlayer.toLowerCase() == "quicktime");
        }

        private static getSingularAlias(alias: string, defaultName: string)
        {
            return alias ? alias.split("/")[0] : defaultName;
        }

        private static getPluralAlias(alias: string, defaultName: string)
        {
            if (alias)
            {
                var parts = alias.split("/");
                return parts.length > 1 ? parts[1] : parts[0];
            }
            else
            {
                return defaultName;
            }
        }
    }

    export class PanelSettingsManager 
    {
        public static getPanelDefinitions(groupID: number, clipUID: string, callback: (panels: PanelDefinition[]) => void)
        {
            if (clipUID != null)
            {
                $catdv.getSharedLinkPanelDefinitions(clipUID, callback);
            }
            else if (groupID != -1)
            {
                $catdv.getPanelDefinitions(groupID, callback);
            }
            else
            {
                callback([]);
            }
        }
    }

    export class ViewSettingsManager
    {
        private static viewDefinitions: ViewDefinition[] = null;

        public static getViewDefinitions(callback: (viewDefs: ViewDefinition[]) => void)
        {
            if (ViewSettingsManager.viewDefinitions == null)
            {
                $catdv.getViewDefinitions((viewDefinitions: ViewDefinition[]) =>
                {
                    ViewSettingsManager.viewDefinitions = viewDefinitions;
                    callback(viewDefinitions);
                });
            }
            else
            {
                callback(ViewSettingsManager.viewDefinitions);
            }
        }
    }

    export class FormSettingsManager
    {
        public static getCurrentUploadForm(callback: (form: FormDefinition) => void)
        {
            $catdv.getFormDefinition("current", "upload", (form: FormDefinition) => 
            {
                callback(form);
            });
        }

        public static getCurrentSearchForm(callback: (form: FormDefinition) => void)
        {
            $catdv.getFormDefinition("current", "search", (form: FormDefinition) => 
            {
                callback(form);
            });

        }
    }

    export class FieldSettingsManager
    {
        public static getQueryFieldDefinitions(callback: (fieldDefs: FieldDefinition[]) => void)
        {
            $catdv.getFields({ "include": "builtin,userfields,onlyQueryable,onlyVisible" }, (resultSet: PartialResultSet<FieldDefinition>) =>
            {
                callback(resultSet.items.filter((fieldDef) => fieldDef.canQuery));
            });
        }

        public static getUserFieldDefinitions(groupID: number, callback: (fieldDefs: FieldDefinition[]) => void)
        {
            $catdv.getFields({ "groupID": groupID, "include": "builtin,userfields,picklists,values" }, (resultSet: PartialResultSet<FieldDefinition>) =>
            {
                callback(resultSet.items);
            });
        }

        public static getUniqueFieldValues(fieldDef: FieldDefinition, callback: (values: string[]) => void)
        {
            $catdv.getFieldValues(fieldDef.ID, (values: string[]) =>
            {
                callback(values != null ? values.filter((value) => value != null) : []);
            });
        }
    }
}