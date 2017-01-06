var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var ui;
(function (ui) {
    var panels;
    (function (panels) {
        var Panel = controls.Panel;
        var Control = controls.Control;
        var DataTable = controls.DataTable;
        var SelectionMode = controls.SelectionMode;
        var Element = controls.Element;
        var PagingControls = controls.PagingControls;
        var OptionsButton = controls.OptionsButton;
        var EventListeners = controls.EventListeners;
        var $catdv = catdv.RestApi;
        var QueryDefinitionUtil = catdv.QueryDefinitionUtil;
        var FilterUtil = logic.FilterUtil;
        var ViewManager = logic.ViewManager;
        var ClientSettings = logic.ClientSettings;
        var ServerSettings = logic.ServerSettings;
        var SelectionIndicator = (function () {
            function SelectionIndicator() {
            }
            SelectionIndicator.create = function (options, parent) {
                var $element = $(Element.render("div", options)).appendTo(Element.get$(parent));
                $element.addClass("selection-marker");
                $("<span class='icon catdvicon catdvicon-blank deselected'></span>").appendTo($element);
                $("<span class='icon catdvicon catdvicon-tick_min selected'></span>").appendTo($element);
            };
            return SelectionIndicator;
        }());
        // Common aspects of GridView and FilmstripView
        var BaseThumbnailView = (function (_super) {
            __extends(BaseThumbnailView, _super);
            function BaseThumbnailView(element, cssClass, columns, options, dataSource) {
                var _this = this;
                _super.call(this, element);
                this.selectionMode = SelectionMode.None;
                this.selectedIndexes = [];
                this.$element.addClass(cssClass);
                this.$element.css({
                    "position": "relative",
                    "height": "100%"
                });
                this.columns = columns;
                this.options = options;
                this.thumbnailSize = options["size"];
                this.pageSize = ServerSettings.clipsPageSize;
                this.dataSource = dataSource;
                this.$scrollview = $("<div class='clip-list'>").css({
                    "position": "absolute",
                    "top": "0px",
                    "left": "0px",
                    "width": "100%",
                    "bottom": "40px",
                    "overflow": "auto"
                }).appendTo(this.$element);
                var $footer = $("<div class='paging-controls'>").css({
                    "position": "absolute",
                    "left": "0px",
                    "width": "100%",
                    "height": "40px",
                    "bottom": "0px"
                }).appendTo(this.$element);
                this.pagingControls = new PagingControls(this.elementId + "_paging", $footer, this.pageSize);
                this.pagingControls.onLoadPage(function (skip, take) {
                    _this.loadData(skip, take);
                });
            }
            BaseThumbnailView.prototype.onItemClicked = function (itemClickedHandler) {
                this.itemClickedHandler = itemClickedHandler;
            };
            BaseThumbnailView.prototype.onSelectionChanged = function (selectionChangedHandler) {
                this.selectionChangedHandler = selectionChangedHandler;
            };
            BaseThumbnailView.prototype.getSelectedClips = function () {
                var _this = this;
                return this.selectedIndexes.map(function (selectedIndex) { return _this.resultSet.items[selectedIndex]; });
            };
            BaseThumbnailView.prototype.getSelectedElementIDs = function () {
                var _this = this;
                return this.selectedIndexes.map(function (selectedIndex) { return _this._getRowElementID(selectedIndex); });
            };
            BaseThumbnailView.prototype.clearSelection = function () {
                this.selectedIndexes = [];
                this._deselectAllRows();
            };
            BaseThumbnailView.prototype.selectAll = function () {
                var _this = this;
                this.selectedIndexes = [];
                this.resultSet.items.forEach(function (item, i) {
                    _this.selectedIndexes.push(i);
                    _this._selectRow(i, true);
                });
                this.updateActionButtons();
            };
            BaseThumbnailView.prototype.updateActionButtons = function () {
                if (this.selectedIndexes.length > 0) {
                    $("button.item-action,a.item-action").removeAttr("disabled");
                    $("li.item-action").removeClass("disabled");
                }
                else {
                    $("button.item-action,a.item-action").attr("disabled", "disabled");
                    $("li.item-action").addClass("disabled");
                }
            };
            BaseThumbnailView.prototype.reload = function (pagingOffset) {
                if (pagingOffset === void 0) { pagingOffset = 0; }
                this.loadData(pagingOffset, this.pageSize);
            };
            BaseThumbnailView.prototype.loadData = function (skip, take) {
                var _this = this;
                this.$scrollview.empty();
                this.dataSource.getData({ skip: skip, take: take }, function (resultSet) {
                    _this.resultSet = resultSet;
                    _this.pagingControls.update(resultSet);
                    _this._renderClips(resultSet.items);
                    _this.selectedIndexes = [];
                    _this.updateActionButtons();
                });
            };
            BaseThumbnailView.prototype._item_onClick = function (evt, clickedRowIndex, doubleClick) {
                if (this.selectionMode == SelectionMode.Toggle) {
                    var currentlySelected = this.selectedIndexes.indexOf(clickedRowIndex) != -1;
                    if (!currentlySelected) {
                        this.selectedIndexes.push(clickedRowIndex);
                        this._selectRow(clickedRowIndex, true);
                    }
                    else {
                        this.selectedIndexes = this.selectedIndexes.filter(function (index) { return index != clickedRowIndex; });
                        this._selectRow(clickedRowIndex, false);
                    }
                }
                else {
                    if (this.selectionMode == SelectionMode.Single || this.selectionMode == SelectionMode.Multi) {
                        if ((this.selectionMode == SelectionMode.Single)
                            || (!(evt.ctrlKey || evt.metaKey) && !evt.shiftKey && (this.selectedIndexes.length > 0))) {
                            // deselect everything
                            this.selectedIndexes = [];
                            this._deselectAllRows();
                        }
                        if ((this.selectionMode == SelectionMode.Multi) && evt.shiftKey && (this.selectedIndexes.length > 0)) {
                            // select all rows between existing selection and this row              
                            // capture the first selected row
                            var firstSelectedRow = this.selectedIndexes[0];
                            // then deselect everything - need to deselect anything outside the range
                            this.selectedIndexes = [];
                            this._deselectAllRows();
                            // then select all the rows from first to current
                            var numSelectedItems = Math.abs(clickedRowIndex - firstSelectedRow) + 1;
                            var step = (clickedRowIndex > firstSelectedRow) ? 1 : -1;
                            var index = firstSelectedRow;
                            for (var i = 0; i < numSelectedItems; i++) {
                                this.selectedIndexes.push(index);
                                this._selectRow(index, true);
                                index += step;
                            }
                        }
                        else {
                            // select clicked row
                            this.selectedIndexes.push(clickedRowIndex);
                            this._selectRow(clickedRowIndex, true);
                        }
                    }
                    if (this.itemClickedHandler) {
                        this.itemClickedHandler($.extend({
                            itemIndex: clickedRowIndex,
                            item: this.resultSet.items[clickedRowIndex],
                            doubleClick: doubleClick
                        }, evt));
                    }
                }
                this.updateActionButtons();
                if (this.selectionChangedHandler) {
                    this.selectionChangedHandler({
                        selectedIndexes: this.selectedIndexes,
                        selectedItems: this.getSelectedClips(),
                        doubleClick: doubleClick
                    });
                }
            };
            BaseThumbnailView.prototype.setSelectionMode = function (selectionMode) {
                return this.selectionMode = selectionMode;
            };
            BaseThumbnailView.prototype.setSelectMode = function (selectMode) {
                if (selectMode && (this.selectionMode == SelectionMode.None)) {
                    this.selectionMode = SelectionMode.Toggle;
                    this.$scrollview.find("div.selection-marker").show(100);
                }
                else if (!selectMode && (this.selectionMode == SelectionMode.Toggle)) {
                    this.selectionMode = SelectionMode.None;
                    this.$scrollview.find("div.selection-marker").hide(100);
                    this.selectedIndexes = [];
                    this._deselectAllRows();
                }
                this.updateActionButtons();
            };
            BaseThumbnailView.prototype._renderClips = function (clips) { };
            BaseThumbnailView.prototype._selectRow = function (rowIndex, select) { };
            BaseThumbnailView.prototype._deselectAllRows = function () { };
            BaseThumbnailView.prototype._getRowElementID = function (rowIndex) { return null; };
            return BaseThumbnailView;
        }(Control));
        var GridView = (function (_super) {
            __extends(GridView, _super);
            function GridView(element, viewInfo, dataSource) {
                _super.call(this, element, "gridView", viewInfo.columns, viewInfo.options, dataSource);
            }
            GridView.prototype._renderClips = function (clips) {
                var _this = this;
                this.$scrollview.empty();
                clips.forEach(function (clip, i) {
                    var textPosition = _this.options["text"];
                    var cssClasses = "cell " + _this.thumbnailSize + (textPosition == "right" ? " right-text" : "");
                    var src = clip.posterID ? "src='" + $catdv.getApiUrl("thumbnails/" + clip.posterID) + "'" : "";
                    var $cell = $("<div id='" + _this.elementId + "_" + i + "' class='" + cssClasses + "' style='display: inline-block'>").appendTo(_this.$scrollview);
                    var $imgDiv = $cell;
                    var $textDiv = $cell;
                    if (textPosition == "right") {
                        $imgDiv = $("<div class='left'></div>").appendTo($cell);
                        $textDiv = $("<div class='right'></div>").appendTo($cell);
                    }
                    var $imgContainer = $("<div class='img-cont'>").appendTo($imgDiv);
                    $("<img " + src + ">").css({
                        "position": "absolute",
                        "margin": "auto",
                        "top": "0px",
                        "left": "0px",
                        "bottom": "0px",
                        "right": "0px",
                        "vertical-align": "bottom"
                    }).appendTo($imgContainer);
                    if (textPosition != "none") {
                        _this.columns.forEach(function (column) {
                            var value = column.render(clip);
                            if (column.fieldDef.ID == "TY2") {
                                $(value).appendTo($cell);
                            }
                            else {
                                $("<span>" + (value || "&nbsp;") + "</span>").css({
                                    "display": "block",
                                    "overflow": "hidden",
                                    "white-space": "nowrap"
                                }).appendTo($textDiv);
                            }
                        });
                    }
                    SelectionIndicator.create({ "style": "display:none;" }, $cell);
                    $cell.on("click", function (evt) { return _super.prototype._item_onClick.call(_this, evt, i, false); });
                    $cell.on("dblclick", function (evt) { return _super.prototype._item_onClick.call(_this, evt, i, true); });
                });
            };
            GridView.prototype._selectRow = function (rowIndex, select) {
                if (select) {
                    this.$element.find("#" + this.elementId + "_" + rowIndex).addClass("selected");
                }
                else {
                    this.$element.find("#" + this.elementId + "_" + rowIndex).removeClass("selected");
                }
            };
            GridView.prototype._getRowElementID = function (rowIndex) {
                return "#" + this.elementId + "_" + rowIndex;
            };
            GridView.prototype._deselectAllRows = function () {
                this.$element.find("div.cell").removeClass("selected");
            };
            return GridView;
        }(BaseThumbnailView));
        var FilmstripView = (function (_super) {
            __extends(FilmstripView, _super);
            function FilmstripView(element, viewInfo, dataSource) {
                _super.call(this, element, "filmstripView", viewInfo.columns, viewInfo.options, dataSource);
            }
            FilmstripView.prototype._renderClips = function (clips) {
                var _this = this;
                this.$scrollview.empty();
                clips.forEach(function (clip, i) {
                    // horizontal strip with info  header at left and then thumbnails 
                    var $row = $("<div id='" + _this.elementId + "_" + i + "' class='filmstripRow " + _this.thumbnailSize + "'>").css({
                        "white-space": "nowrap"
                    }).appendTo(_this.$scrollview);
                    $row.on("click", function (evt) { return _super.prototype._item_onClick.call(_this, evt, i, false); });
                    $row.on("dblclick", function (evt) { return _super.prototype._item_onClick.call(_this, evt, i, true); });
                    var $header = $("<div class='header'>").css({
                        "display": "inline-block"
                    }).appendTo($row);
                    _this.columns.forEach(function (column) {
                        var value = column.render(clip);
                        if (column.fieldDef.ID == "TY2") {
                            $(value).appendTo($header);
                        }
                        else {
                            $("<span>" + (value || "&nbsp;") + "</span>").css({
                                "display": "block",
                                "overflow": "hidden",
                                "white-space": "nowrap"
                            }).appendTo($header);
                        }
                    });
                    SelectionIndicator.create({ "style": "display:none;" }, $header);
                    if (clip.duration.secs > 0) {
                        var $filmstrip = $("<div class='filmstrip'>").css({
                            "display": "inline-block",
                            "vertical-align": "bottom",
                            "position": "relative",
                            "overflow": "hidden",
                            "white-space": "nowrap"
                        }).appendTo($row);
                        var $thumbnails = $("<div class='thumbnails'>").css({
                            "display": "inline-block"
                        }).appendTo($filmstrip);
                        var thumbnailIDs = clip.thumbnailIDs || (clip.posterID ? [clip.posterID] : []);
                        thumbnailIDs.forEach(function (thumbnailID) {
                            var url = $catdv.getApiUrl("thumbnails/" + thumbnailID);
                            var $img = $("<img src='" + url + "'>").appendTo($thumbnails);
                        });
                    }
                    else if (clip.posterID) {
                        // still
                        var url = $catdv.getApiUrl("thumbnails/" + clip.posterID);
                        var $img = $("<img src='" + url + "' class='still'>").appendTo($row);
                    }
                });
            };
            FilmstripView.prototype._selectRow = function (rowIndex, select) {
                if (select) {
                    this.$element.find("#" + this.elementId + "_" + rowIndex).addClass("selected");
                }
                else {
                    this.$element.find("#" + this.elementId + "_" + rowIndex).removeClass("selected");
                }
            };
            FilmstripView.prototype._getRowElement = function (rowIndex) {
                return new Element(this.$element.find("#" + this.elementId + "_" + rowIndex));
            };
            FilmstripView.prototype._deselectAllRows = function () {
                this.$element.find("div.filmstripRow").removeClass("selected");
            };
            return FilmstripView;
        }(BaseThumbnailView));
        var TableView = (function (_super) {
            __extends(TableView, _super);
            function TableView(element, viewInfo, dataSource) {
                var columns = [
                    {
                        title: "",
                        width: 0
                    }
                ];
                viewInfo.columns.forEach(function (col) { return columns.push(col); });
                _super.call(this, element, {
                    selectionMode: SelectionMode.Multi,
                    pagedDataSource: dataSource,
                    showLoadingMessage: false,
                    columns: columns,
                    deferLoading: true,
                    pageSize: ServerSettings.clipsPageSize
                });
                this.css({ "position": "absolute", "top": "0px", "left": "0px", "width": "100%", "height": "100%" });
                _super.prototype.setSelectionMode.call(this, SelectionMode.None);
            }
            TableView.prototype.getSelectedClips = function () {
                return this.getSelectedItems();
            };
            TableView.prototype.setSelectMode = function (selectMode) {
                var _this = this;
                if (selectMode && (_super.prototype.getSelectionMode.call(this) == SelectionMode.None)) {
                    _super.prototype.setSelectionMode.call(this, SelectionMode.Toggle);
                    this.$element.find("tr th:first-child").text("Select").animate({ "width": 56 }, 100);
                    this.$element.find("tr td:first-child").each(function (index, elem) {
                        SelectionIndicator.create({}, $(elem));
                    });
                }
                else if (!selectMode && (_super.prototype.getSelectionMode.call(this) == SelectionMode.Toggle)) {
                    _super.prototype.setSelectionMode.call(this, SelectionMode.None);
                    this.$element.find("tr th:first-child").animate({ "width": 0 }, 100, null, function () {
                        _this.$element.find("tr th:first-child").empty();
                        _this.$element.find("tr td:first-child").empty();
                    });
                }
            };
            return TableView;
        }(DataTable));
        var ViewControls = (function (_super) {
            __extends(ViewControls, _super);
            function ViewControls(element, clipsPanel, viewClipUrl) {
                _super.call(this, element);
                this.clipsPanel = clipsPanel;
                this.viewClipUrl = viewClipUrl;
                this.loadViews();
            }
            ViewControls.prototype.refresh = function () {
                ViewManager.clearCache();
                this.loadViews();
            };
            ViewControls.prototype.loadViews = function () {
                var _this = this;
                this.$element.html("<div id='btnListViews'></div><div id='btnGridViews'></div><div id='btnFilmstripViews'></div>");
                ViewManager.getViewNameInfo(this.viewClipUrl, function (viewNameInfo) {
                    _this.btnListViews = new OptionsButton("btnListViews", {
                        iconClass: "catdvicon small catdvicon-list_view",
                        options: viewNameInfo["list"].names,
                        selectedOption: viewNameInfo["list"].defaultView
                    });
                    _this.btnListViews.onClick(function (evt, viewName) {
                        _this.setView("list", viewName);
                    });
                    _this.btnGridViews = new OptionsButton("btnGridViews", {
                        iconClass: "catdvicon small catdvicon-thumb_view",
                        options: viewNameInfo["grid"].names,
                        selectedOption: viewNameInfo["grid"].defaultView
                    });
                    _this.btnGridViews.onClick(function (evt, viewName) {
                        _this.setView("grid", viewName);
                    });
                    _this.btnFilmstripViews = new OptionsButton("btnFilmstripViews", {
                        iconClass: "catdvicon small catdvicon-filmstrip_view",
                        options: viewNameInfo["filmstrip"].names,
                        selectedOption: viewNameInfo["filmstrip"].defaultView
                    });
                    _this.btnFilmstripViews.onClick(function (evt, viewName) {
                        _this.setView("filmstrip", viewName);
                    });
                    // load saved query/view info          
                    var viewType = ClientSettings.viewType || catdv.settings.defaultClipViewType || "grid";
                    var viewName = ClientSettings.viewName || catdv.settings.defaultClipView || "Normal";
                    // Set selected options to saved values
                    switch (viewType) {
                        case "grid":
                        default:
                            _this.btnGridViews.setSelectedOption(viewName);
                            break;
                        case "filmstrip":
                            _this.btnFilmstripViews.setSelectedOption(viewName);
                            break;
                        case "list":
                            _this.btnListViews.setSelectedOption(viewName);
                            break;
                    }
                    // start the ball rolling with the saved values
                    _this.setView(viewType, viewName);
                });
            };
            ViewControls.prototype.setView = function (viewType, viewName) {
                switch (viewType) {
                    case "grid":
                    default:
                        $("#btnGridViews button").addClass("btn-active");
                        $("#btnListViews button").removeClass("btn-active");
                        $("#btnFilmstripViews button").removeClass("btn-active");
                        break;
                    case "filmstrip":
                        $("#btnFilmstripViews button").addClass("btn-active");
                        $("#btnGridViews button").removeClass("btn-active");
                        $("#btnListViews button").removeClass("btn-active");
                        break;
                    case "list":
                        $("#btnListViews button").addClass("btn-active");
                        $("#btnGridViews button").removeClass("btn-active");
                        $("#btnFilmstripViews button").removeClass("btn-active");
                        break;
                }
                ClientSettings.viewType = viewType;
                ClientSettings.viewName = viewName;
                ClientSettings.save();
                this.clipsPanel.setView(viewType, viewName);
            };
            return ViewControls;
        }(Panel));
        panels.ViewControls = ViewControls;
        var ClipsPanel = (function (_super) {
            __extends(ClipsPanel, _super);
            function ClipsPanel(element, viewClipUrl, thisPageClass) {
                _super.call(this, element);
                this.currentViewType = null;
                this.currentViewName = null;
                this.currentClipQuery = null;
                this.activeFilters = [];
                this.viewClipUrl = null;
                this.selectionMode = SelectionMode.None;
                this.selectMode = false;
                this.selectionChangedListeners = new EventListeners();
                this.queryChangedListeners = new EventListeners();
                this.selectModeChangedListeners = new EventListeners();
                this.viewClipUrl = viewClipUrl;
                this.$element.addClass("clipListPanel");
                this.$overlayPanel = $("<div class='overlayPanel'></div>").appendTo(this.$element);
                this.$messagePanel = $("<div class='messagePanel'></div>").appendTo(this.$overlayPanel);
                this.$clipsPanel = $("<div class='clipsPanel'></div>").appendTo(this.$element);
                // If last page visited is this page then user hit refresh (or went off to some 
                // other site and came back) so don't use cached results
                var lastPage = $.cookie("last_page") || "ui.SearchPage";
                this.useCache = lastPage !== thisPageClass;
                // If the last page was Clip Details then check "catdv_useCache" cookie value
                if (lastPage === "ui.ClipDetailsPage") {
                    // ClipDetails page sets catdv_useCache cookie to indicate if it has updated a clip so we shouldn't use cache
                    this.useCache = $.cookie("catdv_useCache") === "true";
                }
                $.cookie("catdv_useCache", "false");
                var searchParam = $.urlParam("search");
                var tParam = $.urlParam("t");
                if (searchParam && tParam && (tParam !== $.cookie("catdv_tParam"))) {
                    if (searchParam.startsWith("and((") || searchParam.startsWith("or((")) {
                        this.currentClipQuery = {
                            title: "Search Results",
                            queryDef: QueryDefinitionUtil.parse(searchParam)
                        };
                    }
                    else {
                        this.currentClipQuery = {
                            title: "Clips Matching: " + searchParam,
                            queryDef: {
                                terms: [{ field: ServerSettings.simpleSearchField, op: "like", params: searchParam }]
                            }
                        };
                    }
                    // Remember tParam so we can ignore passed in search param if user hit refresh
                    $.cookie("catdv_tParam", tParam);
                }
                else {
                    // If this is new session then clear any saved search
                    if (catdv.session !== $.cookie("last_session")) {
                        this.currentClipQuery = null;
                    }
                    else {
                        try {
                            this.currentClipQuery = ClientSettings.getSavedClipQuery();
                            this.activeFilters = ClientSettings.getSavedActiveFilters() || [];
                        }
                        catch (e) {
                            // stored data corrupted in some way - fall back to open query
                            this.currentClipQuery = null;
                            this.activeFilters = [];
                        }
                    }
                }
                $.cookie("last_session", catdv.session);
            }
            ClipsPanel.prototype.getSelectionMode = function () {
                return this.selectionMode;
            };
            ClipsPanel.prototype.setSelectionMode = function (selectionMode) {
                return this.selectionMode = selectionMode;
            };
            ClipsPanel.prototype.toggleSelectMode = function () {
                return this.setSelectMode(!this.selectMode);
            };
            ClipsPanel.prototype.setSelectMode = function (selectMode) {
                this.selectMode = selectMode;
                // Only process setSelectMode if we're using Toggle selection
                if ((this.selectionMode == SelectionMode.None) || (this.selectionMode == SelectionMode.Toggle)) {
                    this.currentView.setSelectMode(this.selectMode);
                    if (this.selectMode) {
                        this.$element.find("a").on("click", function (evt) {
                            evt.preventDefault();
                        });
                    }
                    else {
                        this.$element.find("a").off("click");
                    }
                    this.selectModeChangedListeners.notifyListeners({ selectMode: selectMode });
                }
                return this.selectMode;
            };
            ClipsPanel.prototype.selectAll = function () {
                this.currentView.selectAll();
            };
            ClipsPanel.prototype.getSelectedClips = function () {
                return this.currentView.getSelectedClips();
            };
            ClipsPanel.prototype.getSelectedElementIDs = function () {
                return this.currentView.getSelectedElementIDs();
            };
            ClipsPanel.prototype.clearSelection = function () {
                this.currentView.clearSelection();
            };
            ClipsPanel.prototype.onSelectionChanged = function (selectionChangedHandler) {
                this.selectionChangedListeners.addListener(selectionChangedHandler);
            };
            ClipsPanel.prototype.onSelectModeChanged = function (selecttModeChangedHandler) {
                this.selectModeChangedListeners.addListener(selecttModeChangedHandler);
            };
            ClipsPanel.prototype.onQueryChanged = function (queryChangedHandler) {
                this.queryChangedListeners.addListener(queryChangedHandler);
                // fire event as soon as handler is registered to update caller with filters read from cookies
                this.fireQueryChanged();
            };
            ClipsPanel.prototype.fireQueryChanged = function () {
                if (this.currentClipQuery) {
                    this.currentClipQuery.cached = this.useCache;
                    this.queryChangedListeners.notifyListeners(this.currentClipQuery);
                }
                else {
                    this.queryChangedListeners.notifyListeners({ title: "Clips", cached: this.useCache });
                }
            };
            ClipsPanel.prototype.setView = function (viewType, viewName) {
                var _this = this;
                this.currentViewType = viewType;
                this.currentViewName = viewName;
                this.$clipsPanel.empty();
                switch (this.currentViewType) {
                    case "grid":
                    default:
                        ViewManager.getView("grid", viewName, this.viewClipUrl, function (viewInfo) {
                            _this.currentView = new GridView($("<div id='gridView'>").appendTo(_this.$clipsPanel), viewInfo, _this);
                        });
                        break;
                    case "filmstrip":
                        ViewManager.getView("filmstrip", viewName, this.viewClipUrl, function (viewInfo) {
                            _this.currentView = new FilmstripView($("<div id='filmstripView'>").appendTo(_this.$clipsPanel), viewInfo, _this);
                        });
                        break;
                    case "list":
                        ViewManager.getView("list", viewName, this.viewClipUrl, function (viewInfo) {
                            _this.currentView = new TableView($("<div id='tableView'>").appendTo(_this.$clipsPanel), viewInfo, _this);
                        });
                        break;
                }
                this.currentView.setSelectionMode(this.selectionMode);
                this.setSelectMode(false);
                this.currentView.onItemClicked(function (evt) {
                    if (!_this.selectMode && _this.viewClipUrl) {
                        window.location.href = _this.viewClipUrl + "?id=" + evt.item.ID;
                    }
                });
                this.currentView.onSelectionChanged(function (evt) {
                    _this.selectionChangedListeners.notifyListeners(evt);
                });
                var pagingOffset = ClientSettings.pagingOffset;
                this.reload(pagingOffset);
            };
            //        public getClipQuery(): ClipQuery
            //        {
            //            return this.currentClipQuery;
            //        }
            ClipsPanel.prototype.setClipQuery = function (query) {
                this.currentClipQuery = query;
                this.clearFilters();
                this.fireQueryChanged();
                this.reload(0, false);
            };
            ClipsPanel.prototype.setMessage = function (message) {
                this.$messagePanel.html(message);
            };
            ClipsPanel.prototype.getActveFilters = function () {
                return this.activeFilters;
            };
            ClipsPanel.prototype.addActiveFilter = function (filter) {
                // Currently only one freetext filter supported
                if (filter.filterOp == "like") {
                    this.activeFilters = this.activeFilters.filter(function (filter) { return filter.filterOp != "like"; });
                }
                this.activeFilters.push(filter);
                this.fireQueryChanged();
                this.reload(0, false);
            };
            ClipsPanel.prototype.removeActiveFilter = function (filter) {
                this.activeFilters.splice(this.activeFilters.indexOf(filter), 1);
                this.fireQueryChanged();
                this.reload(0, false);
            };
            ClipsPanel.prototype.clearFilters = function () {
                this.activeFilters = [];
                this.fireQueryChanged();
            };
            ClipsPanel.prototype.reload = function (pagingOffset, useCache) {
                if (pagingOffset === void 0) { pagingOffset = 0; }
                if (useCache === void 0) { useCache = null; }
                if (useCache != null)
                    this.useCache = useCache;
                this.setSelectMode(false);
                this.currentView.reload(pagingOffset);
            };
            /* Implement PagedDataSource.getData() */
            ClipsPanel.prototype.getData = function (params, callback) {
                var _this = this;
                this.setSelectMode(false);
                if (this.currentClipQuery || ServerSettings.showRecentClips) {
                    // save search options to cookies
                    ClientSettings.pagingOffset = params.skip;
                    ClientSettings.saveClipQuery(this.currentClipQuery);
                    var freeTextFilters = this.activeFilters.filter(function (filter) { return filter.filterOp == "like"; });
                    var freeTextQueryTerms = [];
                    if (this.currentClipQuery) {
                        if (this.currentClipQuery.catalog) {
                            params["query"] = "((catalog.id)eq(" + this.currentClipQuery.catalog.ID + "))";
                        }
                        else if (this.currentClipQuery.smartFolder) {
                            params["smartFolderID"] = this.currentClipQuery.smartFolder.ID;
                        }
                        else if (this.currentClipQuery.clipList) {
                            params["clipListID"] = this.currentClipQuery.clipList.ID;
                        }
                        else if (this.currentClipQuery.queryDef) {
                            if (freeTextFilters.length > 0) {
                                params["query"] = QueryDefinitionUtil.toQueryString({
                                    "name": this.currentClipQuery.queryDef.name,
                                    "terms": this.currentClipQuery.queryDef.terms.filter(function (term) { return term.op != "like"; })
                                });
                                freeTextQueryTerms = this.currentClipQuery.queryDef.terms.filter(function (term) { return term.op == "like"; });
                            }
                            else {
                                params["query"] = QueryDefinitionUtil.toQueryString(this.currentClipQuery.queryDef);
                            }
                        }
                    }
                    else {
                        params["query"] = "";
                    }
                    params["cached"] = this.useCache;
                    if (this.activeFilters.length > 0) {
                        if ((freeTextQueryTerms.length > 0) && (freeTextFilters.length > 0)) {
                            var otherFilters = this.activeFilters.filter(function (filter) { return filter.filterOp != "like"; });
                            var freeTextFilter = "";
                            freeTextQueryTerms.forEach(function (term) { return freeTextFilter += " " + term.params; });
                            freeTextFilters.forEach(function (filter) { return freeTextFilter += " " + filter.value; });
                            var query = "((" + catdv.settings.simpleSearchField + ")like(" + freeTextFilter + "))";
                            if (params["query"]) {
                                query += "and(" + params["query"] + ")";
                            }
                            var filterQuery = FilterUtil.getFilterQuery(otherFilters);
                            if (filterQuery) {
                                query += "and(" + filterQuery + ")";
                            }
                            params["query"] = query;
                        }
                        else {
                            var filterQuery = FilterUtil.getFilterQuery(this.activeFilters);
                            if (params["query"]) {
                                params["query"] = "(" + params["query"] + ")and(" + filterQuery + ")";
                            }
                            else {
                                params["query"] = filterQuery;
                            }
                        }
                    }
                    ClientSettings.saveActiveFilters(this.activeFilters);
                    // TODO: should check which view columns we have to see if we need user fields or metadata
                    params["include"] = "userfields,thumbnails";
                    this.setMessage("Loading...");
                    $catdv.getClips(params, function (resultSet) {
                        _this.setMessage((resultSet.items && resultSet.items.length > 0) ? "" : ServerSettings.noResultsMessage);
                        _this.useCache = true;
                        callback(resultSet);
                    }, function () {
                        _this.setMessage("Server Error");
                        callback({ totalItems: 0, offset: 0, items: [] });
                    });
                }
                else {
                    this.setMessage(ServerSettings.initialMessage);
                    callback({ totalItems: 0, offset: 0, items: [] });
                }
            };
            ClipsPanel.prototype.getFilters = function (callback) {
                var params = { "cached": true, "include": "userfields,thumbnails", "skip": 0, "take": 0 };
                if (this.currentClipQuery) {
                    if (this.currentClipQuery.catalog) {
                        params["query"] = "((catalog.id)eq(" + this.currentClipQuery.catalog.ID + "))";
                    }
                    else if (this.currentClipQuery.smartFolder) {
                        params["smartFolderID"] = this.currentClipQuery.smartFolder.ID;
                    }
                    else if (this.currentClipQuery.clipList) {
                        params["clipListID"] = this.currentClipQuery.clipList.ID;
                    }
                    else if (this.currentClipQuery.queryDef) {
                        params["query"] = QueryDefinitionUtil.toQueryString(this.currentClipQuery.queryDef);
                    }
                    $catdv.getClipFilters(params, function (filters) {
                        callback(filters);
                    }, function () {
                        callback([]);
                    });
                }
                else {
                    callback([]);
                }
            };
            return ClipsPanel;
        }(Panel));
        panels.ClipsPanel = ClipsPanel;
    })(panels = ui.panels || (ui.panels = {}));
})(ui || (ui = {}));
