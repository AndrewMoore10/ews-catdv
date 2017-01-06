var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var logic;
(function (logic) {
    var $catdv = catdv.RestApi;
    var DateUtil = catdv.DateUtil;
    var FieldDefinitionUtil = catdv.FieldDefinitionUtil;
    var FormatUtil = util.FormatUtil;
    var HtmlUtil = util.HtmlUtil;
    var ViewInfo = (function () {
        function ViewInfo() {
        }
        return ViewInfo;
    }());
    logic.ViewInfo = ViewInfo;
    ;
    var ViewNames = (function () {
        function ViewNames() {
        }
        return ViewNames;
    }());
    logic.ViewNames = ViewNames;
    var ViewManager = (function () {
        function ViewManager() {
        }
        ViewManager.getViewNameInfo = function (viewClipUrl, callback) {
            ViewManager.getViews(viewClipUrl, function (viewInfo) {
                var viewNames = {};
                for (var viewType in viewInfo) {
                    var views = viewInfo[viewType];
                    var names = views.map(function (view) { return view.name; });
                    var defaultView = views.find(function (view) { return (view.options && view.options.isDefault) ? true : false; });
                    var defaultViewName = defaultView ? defaultView.name : names.contains("Normal") ? "Normal" : names.contains("Medium") ? "Medium" : names[0];
                    viewNames[viewType] = {
                        names: names,
                        defaultView: defaultViewName
                    };
                }
                callback(viewNames);
            });
        };
        ViewManager.getView = function (viewType, viewName, viewClipUrl, callback) {
            ViewManager.getViews(viewClipUrl, function (viewInfo) {
                var views = viewInfo[viewType];
                var view = views.find(function (view) { return view.name == viewName; });
                callback(view || views[0]);
            });
        };
        ViewManager.clearCache = function () {
            ViewManager.viewInfoCache = null;
        };
        ViewManager.getViews = function (viewClipUrl, callback) {
            if (ViewManager.viewInfoCache == null) {
                logic.ViewSettingsManager.getViewDefinitions(function (viewDefinitions) {
                    ViewManager.viewInfoCache = {
                        "list": [],
                        "grid": [],
                        "filmstrip": []
                    };
                    viewDefinitions.forEach(function (viewDefinition) {
                        if (viewDefinition.type == "list") {
                            ViewManager.viewInfoCache["list"].push(ViewManager.convertViewDefinition(viewDefinition, viewClipUrl));
                        }
                        else if (viewDefinition.type == "grid") {
                            ViewManager.viewInfoCache["grid"].push(ViewManager.convertViewDefinition(viewDefinition, viewClipUrl));
                        }
                        else if (viewDefinition.type == "filmstrip") {
                            ViewManager.viewInfoCache["filmstrip"].push(ViewManager.convertViewDefinition(viewDefinition, viewClipUrl));
                        }
                    });
                    if (ViewManager.viewInfoCache["list"].length == 0) {
                        ViewManager.viewInfoCache["list"] = ViewManager.convertDefaultViewDef(ViewManager.DEFAULT_TABLE_VIEWS, viewClipUrl);
                    }
                    if (ViewManager.viewInfoCache["grid"].length == 0) {
                        ViewManager.viewInfoCache["grid"] = ViewManager.convertDefaultViewDef(ViewManager.DEFAULT_GRID_VIEWS, viewClipUrl);
                    }
                    if (ViewManager.viewInfoCache["filmstrip"].length == 0) {
                        ViewManager.viewInfoCache["filmstrip"] = ViewManager.convertDefaultViewDef(ViewManager.DEFAULT_FILMSTRIP_VIEWS, viewClipUrl);
                    }
                    callback(ViewManager.viewInfoCache);
                });
            }
            else {
                callback(ViewManager.viewInfoCache);
            }
        };
        ViewManager.convertViewDefinition = function (viewDefinition, viewClipUrl) {
            var viewInfo = {
                name: viewDefinition.name,
                options: viewDefinition.options,
                columns: []
            };
            if (viewDefinition.fields != null) {
                viewDefinition.fields.forEach(function (viewField) {
                    if (viewField.fieldDefinition) {
                        var fieldAccesor = logic.AccessorFactory.createAccessor(viewField.fieldDefinition, false);
                        if (viewField.fieldDefinition.isBuiltin) {
                            var builtInFieldDef = logic.BuiltInFields[viewField.fieldDefinition.ID];
                            if (builtInFieldDef) {
                                viewField.options = $.extend({ width: builtInFieldDef.width }, viewField.options);
                            }
                        }
                        viewInfo.columns.push(ViewColumnFactory.createColumn(viewField, fieldAccesor, viewClipUrl));
                    }
                });
            }
            return viewInfo;
        };
        ViewManager.convertDefaultViewDef = function (defaultViewDefinitions, viewClipUrl) {
            var views = [];
            defaultViewDefinitions.forEach(function (defaultViewDefinition) {
                var columns = [];
                defaultViewDefinition.fields.forEach(function (fieldDefinitionID) {
                    var fieldDefinition = logic.BuiltInFields[fieldDefinitionID];
                    var fieldAccesor = logic.AccessorFactory.createAccessor(fieldDefinition, false);
                    var viewField = {
                        fieldDefID: fieldDefinition.ID,
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
        };
        // Default View Definitions
        ViewManager.DEFAULT_TABLE_VIEWS = [
            {
                name: "Concise",
                options: { "spacing": "normal" },
                fields: ["TY2", "NM1", "I1", "O1", "D1", "FF", "NT", "STS"]
            },
            {
                name: "Normal",
                options: { "spacing": "normal", "isDefault": true },
                fields: ["P1", "TY2", "NM1", "BN", "I1", "O1", "D1", "FF", "RD1", "NT", "STS"]
            },
            {
                name: "Full",
                options: { "spacing": "normal" },
                fields: ["P1", "TY2", "NM1", "TY1", "BN", "TP", "I1", "O1", "D1", "FF", "RD1", "NT", "STS"]
            }
        ];
        ViewManager.DEFAULT_GRID_VIEWS = [
            {
                name: "Concise",
                options: { "text": "below", "size": "small" },
                fields: ["TY2", "NM1"]
            },
            {
                name: "Normal",
                options: { "text": "below", "size": "medium" },
                fields: ["TY2", "NM1"]
            },
            {
                name: "Detailed",
                options: { "text": "right", "size": "medium", "isDefault": true },
                fields: ["TY2", "NM1", "D1", "FF", "RD1"]
            },
            {
                name: "Large",
                options: { "text": "below", "size": "large" },
                fields: ["TY2", "NM1", "D1", "FF"]
            }
        ];
        ViewManager.DEFAULT_FILMSTRIP_VIEWS = [
            {
                name: "Small",
                options: { "allThumbnails": "false", "poster": "false", "size": "small" },
                fields: ["TY2", "NM1"]
            },
            {
                name: "Medium",
                options: { "allThumbnails": "false", "poster": "false", "size": "medium", "isDefault": true },
                fields: ["TY2", "NM1", "D1", "FF"]
            },
            {
                name: "Large",
                options: { "allThumbnails": "false", "poster": "false", "size": "large" },
                fields: ["TY2", "NM1", "D1", "FF", "RD1"]
            }
        ];
        ViewManager.viewInfoCache = null;
        return ViewManager;
    }());
    logic.ViewManager = ViewManager;
    var ViewColumn = (function () {
        function ViewColumn(viewField, fieldAccesor) {
            var _this = this;
            this.fieldDef = viewField.fieldDefinition;
            this.fieldAccesor = fieldAccesor;
            this.title = this.fieldDef.name;
            this.width = viewField.options ? viewField.options.width : null;
            this.isSortable = this.fieldDef.isSortable;
            this.sortBy = FieldDefinitionUtil.getSortBy(this.fieldDef);
            this.renderer = function (object, val) { return _this.render(object); };
        }
        ViewColumn.prototype.render = function (clip) { return null; };
        return ViewColumn;
    }());
    logic.ViewColumn = ViewColumn;
    var TextColumn = (function (_super) {
        __extends(TextColumn, _super);
        function TextColumn(viewField, fieldAccesor) {
            _super.call(this, viewField, fieldAccesor);
        }
        TextColumn.prototype.render = function (clip) {
            var value = this.fieldAccesor.getValue(clip);
            if (!value)
                return "";
            switch (this.fieldDef.fieldType) {
                case "date":
                    return DateUtil.format(value, TextColumn.DATE_FORMAT);
                case "datetime":
                    return DateUtil.format(value, TextColumn.DATETIME_FORMAT);
                case "time":
                    return DateUtil.format(value, TextColumn.TIME_FORMAT);
                default:
                    if (value instanceof Array) {
                        return HtmlUtil.escapeHtml(value.join(","));
                    }
                    else if (typeof value == "object") {
                        return HtmlUtil.escapeHtml(value, 64);
                    }
                    else {
                        return HtmlUtil.escapeHtml(value, this.width ? this.width / 3 : 64); // rough calculation to stop excessive wrapping
                    }
            }
        };
        TextColumn.DATE_FORMAT = "YYYY-MM-DD";
        TextColumn.DATETIME_FORMAT = "YYYY-MM-DD HH:mm:ss";
        TextColumn.TIME_FORMAT = "HH:mm:ss";
        return TextColumn;
    }(ViewColumn));
    logic.TextColumn = TextColumn;
    var NameColumn = (function (_super) {
        __extends(NameColumn, _super);
        function NameColumn(viewField, fieldAccesor, viewClipUrl) {
            _super.call(this, viewField, fieldAccesor);
            this.viewClipUrl = viewClipUrl;
        }
        NameColumn.prototype.render = function (clip) {
            return this.viewClipUrl ? "<a href='" + this.viewClipUrl + "?id=" + clip.ID + "' role='button'>" + HtmlUtil.escapeHtml(clip.name) + "</a>" : HtmlUtil.escapeHtml(clip.name);
        };
        return NameColumn;
    }(ViewColumn));
    logic.NameColumn = NameColumn;
    var ThumbnailColumn = (function (_super) {
        __extends(ThumbnailColumn, _super);
        function ThumbnailColumn(viewField, fieldAccesor) {
            _super.call(this, viewField, fieldAccesor);
        }
        ThumbnailColumn.prototype.render = function (clip) {
            var thumbnailID = this.fieldAccesor.getValue(clip);
            return thumbnailID ? "<img src='" + $catdv.getApiUrl("thumbnails/" + thumbnailID + "?width=64&height=48&fmt=png") + "'>" : "";
        };
        return ThumbnailColumn;
    }(ViewColumn));
    logic.ThumbnailColumn = ThumbnailColumn;
    var TypeIconColumn = (function (_super) {
        __extends(TypeIconColumn, _super);
        function TypeIconColumn(viewField, fieldAccesor) {
            _super.call(this, viewField, fieldAccesor);
        }
        TypeIconColumn.prototype.render = function (clip) {
            var clipType = this.fieldAccesor.getValue(clip);
            return "<img class='typeicon' src='" + TypeIconColumn.CLIP_TYPE_IMAGE_PATH + "/cliptype_" + clipType + ".png'>";
        };
        TypeIconColumn.CLIP_TYPE_IMAGE_PATH = "img";
        return TypeIconColumn;
    }(ViewColumn));
    logic.TypeIconColumn = TypeIconColumn;
    var MediaPathColumn = (function (_super) {
        __extends(MediaPathColumn, _super);
        function MediaPathColumn(viewField, fieldAccesor) {
            _super.call(this, viewField, fieldAccesor);
        }
        MediaPathColumn.prototype.render = function (clip) {
            var link = this.fieldAccesor.getValue(clip);
            if (link) {
                return link.downloadUrl ? "<a href='" + link.downloadUrl + "'>" + HtmlUtil.escapeHtml(link.path) + "</a>" : HtmlUtil.escapeHtml(link.path);
            }
            else {
                return "";
            }
        };
        return MediaPathColumn;
    }(ViewColumn));
    logic.MediaPathColumn = MediaPathColumn;
    var FormattedNumericColumn = (function (_super) {
        __extends(FormattedNumericColumn, _super);
        function FormattedNumericColumn(viewField, fieldAccesor, formatter) {
            _super.call(this, viewField, fieldAccesor);
            this.formatter = formatter;
        }
        FormattedNumericColumn.prototype.render = function (clip) {
            var value = this.fieldAccesor.getValue(clip);
            return value ? this.formatter(value) : "";
        };
        return FormattedNumericColumn;
    }(ViewColumn));
    logic.FormattedNumericColumn = FormattedNumericColumn;
    var ViewColumnFactory = (function () {
        function ViewColumnFactory() {
        }
        ViewColumnFactory.createColumn = function (viewField, fieldAccesor, viewClipUrl) {
            if (viewField.fieldDefID == "NM1") {
                return new NameColumn(viewField, fieldAccesor, viewClipUrl);
            }
            else if ((viewField.fieldDefID == "MF") || (viewField.fieldDefID == "PF")) {
                return new MediaPathColumn(viewField, fieldAccesor);
            }
            if (viewField.fieldDefinition.fieldType == "thumbnail") {
                return new ThumbnailColumn(viewField, fieldAccesor);
            }
            else if (viewField.fieldDefinition.fieldType == "typeicon") {
                return new TypeIconColumn(viewField, fieldAccesor);
            }
            else if (viewField.fieldDefinition.fieldType == "bytes") {
                return new FormattedNumericColumn(viewField, fieldAccesor, FormatUtil.formatBytes);
            }
            else if (viewField.fieldDefinition.fieldType == "bps") {
                return new FormattedNumericColumn(viewField, fieldAccesor, FormatUtil.formatBytesPerSecond);
            }
            else {
                return new TextColumn(viewField, fieldAccesor);
            }
        };
        return ViewColumnFactory;
    }());
    logic.ViewColumnFactory = ViewColumnFactory;
})(logic || (logic = {}));
