var logic;
(function (logic) {
    var $catdv = catdv.RestApi;
    var Platform = util.Platform;
    // Static config
    var Config = (function () {
        function Config() {
        }
        Object.defineProperty(Config, "viewClipUrl", {
            get: function () {
                return "clip-details.jsp";
            },
            enumerable: true,
            configurable: true
        });
        return Config;
    }());
    logic.Config = Config;
    var ClientSettings = (function () {
        function ClientSettings() {
        }
        Object.defineProperty(ClientSettings, "viewType", {
            get: function () {
                return $.cookie("catdv_viewType");
            },
            set: function (viewType) {
                $.cookie("catdv_viewType", viewType);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ClientSettings, "viewName", {
            get: function () {
                return $.cookie("catdv_viewName");
            },
            set: function (viewType) {
                $.cookie("catdv_viewName", viewType);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ClientSettings, "pagingOffset", {
            get: function () {
                return parseInt($.cookie("catdv_pagingOffset") || "0");
            },
            set: function (pagingOffset) {
                $.cookie("catdv_pagingOffset", String(pagingOffset));
            },
            enumerable: true,
            configurable: true
        });
        ClientSettings.saveClipQuery = function (clipQuery) {
            $.cookie("catdv_clipQuery", clipQuery ? JSON.stringify(clipQuery) : null);
        };
        ClientSettings.getSavedClipQuery = function () {
            var jsonClipQuery = $.cookie("catdv_clipQuery");
            return jsonClipQuery ? JSON.parse(jsonClipQuery) : { title: "Clips", terms: [] };
        };
        ClientSettings.saveActiveFilters = function (activeFilters) {
            $.cookie("catdv_activeFilters", JSON.stringify(activeFilters));
        };
        ClientSettings.getSavedActiveFilters = function () {
            var jsonActiveFilters = $.cookie("catdv_activeFilters");
            return jsonActiveFilters ? JSON.parse(jsonActiveFilters) : [];
        };
        ClientSettings.save = function () {
            // Nothing to do for cookie implementation
        };
        return ClientSettings;
    }());
    logic.ClientSettings = ClientSettings;
    var ServerSettings = (function () {
        function ServerSettings() {
        }
        Object.defineProperty(ServerSettings, "simpleSearchField", {
            // Expose workspace settings through ServerSettings to create common inteface for Premiere Panel
            get: function () {
                return catdv.settings.simpleSearchField;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ServerSettings, "showRecentClips", {
            get: function () {
                return catdv.settings.showRecentClips;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ServerSettings, "initialMessage", {
            get: function () {
                return catdv.settings.initialMessage;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ServerSettings, "noResultsMessage", {
            get: function () {
                return catdv.settings.noResultsMessage;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ServerSettings, "clipsPageSize", {
            get: function () {
                return Number(catdv.settings.clipsPageSize);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ServerSettings, "canDownloadOriginals", {
            get: function () {
                return catdv.settings.canDownloadOriginals;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ServerSettings, "canDownloadsProxies", {
            get: function () {
                return catdv.settings.canDownloadProxies;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ServerSettings, "canUpload", {
            get: function () {
                return catdv.settings.canUploadMedia;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ServerSettings, "sharedLinkDownloadUrl", {
            get: function () {
                return catdv.settings.sharedLinkDownloadUrl;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ServerSettings, "isEnterpriseServer", {
            get: function () {
                return catdv.edition == "enterprise" || catdv.edition == "pegasus";
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ServerSettings, "isPegasusServer", {
            get: function () {
                return catdv.edition == "pegasus";
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ServerSettings, "dateTimeFormat", {
            get: function () {
                return catdv.settings.dateTimeFormat || ServerSettings.defaultDateTimeFormat;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ServerSettings, "dateFormat", {
            get: function () {
                var timeStart = ServerSettings.dateTimeFormat.toLowerCase().indexOf("h");
                return ServerSettings.dateTimeFormat.substring(0, timeStart).trim();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ServerSettings, "timeFormat", {
            get: function () {
                var timeStart = ServerSettings.dateTimeFormat.toLowerCase().indexOf("h");
                return ServerSettings.dateTimeFormat.substring(timeStart).trim();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ServerSettings, "useQuickTime", {
            get: function () {
                return Platform.isOldIE() || (catdv.settings.webPlayer && catdv.settings.webPlayer.toLowerCase() == "quicktime");
            },
            enumerable: true,
            configurable: true
        });
        ServerSettings.getSingularAlias = function (alias, defaultName) {
            return alias ? alias.split("/")[0] : defaultName;
        };
        ServerSettings.getPluralAlias = function (alias, defaultName) {
            if (alias) {
                var parts = alias.split("/");
                return parts.length > 1 ? parts[1] : parts[0];
            }
            else {
                return defaultName;
            }
        };
        ServerSettings.defaultDateTimeFormat = "YYYY-MM-DD HH:mm:ss";
        ServerSettings.defaultDateFormat = "YYYY-MM-DD";
        ServerSettings.defaultTimeFormat = "HH:mm:ss";
        return ServerSettings;
    }());
    logic.ServerSettings = ServerSettings;
    var PanelSettingsManager = (function () {
        function PanelSettingsManager() {
        }
        PanelSettingsManager.getPanelDefinitions = function (groupID, clipUID, callback) {
            if (clipUID != null) {
                $catdv.getSharedLinkPanelDefinitions(clipUID, callback);
            }
            else if (groupID != -1) {
                $catdv.getPanelDefinitions(groupID, callback);
            }
            else {
                callback([]);
            }
        };
        return PanelSettingsManager;
    }());
    logic.PanelSettingsManager = PanelSettingsManager;
    var ViewSettingsManager = (function () {
        function ViewSettingsManager() {
        }
        ViewSettingsManager.getViewDefinitions = function (callback) {
            if (ViewSettingsManager.viewDefinitions == null) {
                $catdv.getViewDefinitions(function (viewDefinitions) {
                    ViewSettingsManager.viewDefinitions = viewDefinitions;
                    callback(viewDefinitions);
                });
            }
            else {
                callback(ViewSettingsManager.viewDefinitions);
            }
        };
        ViewSettingsManager.viewDefinitions = null;
        return ViewSettingsManager;
    }());
    logic.ViewSettingsManager = ViewSettingsManager;
    var FormSettingsManager = (function () {
        function FormSettingsManager() {
        }
        FormSettingsManager.getCurrentUploadForm = function (callback) {
            $catdv.getFormDefinition("current", "upload", function (form) {
                callback(form);
            });
        };
        FormSettingsManager.getCurrentSearchForm = function (callback) {
            $catdv.getFormDefinition("current", "search", function (form) {
                callback(form);
            });
        };
        return FormSettingsManager;
    }());
    logic.FormSettingsManager = FormSettingsManager;
    var FieldSettingsManager = (function () {
        function FieldSettingsManager() {
        }
        FieldSettingsManager.getQueryFieldDefinitions = function (callback) {
            $catdv.getFields({ "include": "builtin,userfields,onlyQueryable,onlyVisible" }, function (resultSet) {
                callback(resultSet.items.filter(function (fieldDef) { return fieldDef.canQuery; }));
            });
        };
        FieldSettingsManager.getUserFieldDefinitions = function (groupID, callback) {
            $catdv.getFields({ "groupID": groupID, "include": "builtin,userfields,picklists,values" }, function (resultSet) {
                callback(resultSet.items);
            });
        };
        FieldSettingsManager.getUniqueFieldValues = function (fieldDef, callback) {
            $catdv.getFieldValues(fieldDef.ID, function (values) {
                callback(values != null ? values.filter(function (value) { return value != null; }) : []);
            });
        };
        return FieldSettingsManager;
    }());
    logic.FieldSettingsManager = FieldSettingsManager;
})(logic || (logic = {}));
