module ui.panels
{
    import Panel = controls.Panel;
    import Control = controls.Control;
    import Label = controls.Label;
    import PagedDataSource = controls.PagedDataSource;
    import DataTable = controls.DataTable;
    import DataTableColumn = controls.DataTableColumn;
    import SelectionMode = controls.SelectionMode;
    import Element = controls.Element;
    import PagingControls = controls.PagingControls;
    import OptionsButton = controls.OptionsButton;
    import SelectionChangedEvent = controls.SelectionChangedEvent;
    import ItemClickedEvent = controls.ItemClickedEvent;
    import EventListeners = controls.EventListeners;
    import Console = controls.Console;

    import $catdv = catdv.RestApi;
    import PartialResultSet = catdv.PartialResultSet;
    import QueryDefinition = catdv.QueryDefinition;
    import QueryDefinitionUtil = catdv.QueryDefinitionUtil;
    import Clip = catdv.Clip;
    import Catalog = catdv.Catalog;
    import SmartFolder = catdv.SmartFolder;
    import ClipQuery = catdv.ClipQuery;
    import QueryTerm = catdv.QueryTerm;
    import Filter = catdv.Filter;
    import HtmlUtil = util.HtmlUtil;

    import FilterItem = logic.FilterItem;
    import FilterUtil = logic.FilterUtil;
    import ViewManager = logic.ViewManager;
    import ViewInfo = logic.ViewInfo;
    import ViewColumn = logic.ViewColumn;
    import ViewColumnFactory = logic.ViewColumnFactory;
    import ClientSettings = logic.ClientSettings;
    import ServerSettings = logic.ServerSettings;

    interface ClipView 
    {
        getSelectedClips(): Clip[];
        getSelectedElementIDs(): String[];
        clearSelection();
        selectAll();
        onSelectionChanged(selectionChangedHandler: (evt: SelectionChangedEvent) => void);
        onItemClicked(itemClickedHandler: (evt: ItemClickedEvent) => void);
        reload(pagingOffset?: number);
        setSelectionMode(selectionMode : SelectionMode);
        setSelectMode(selectMode: boolean);
    }

    class SelectionIndicator
    {
        public static create(options: any, parent: any)
        {
            var $element = $(Element.render("div", options)).appendTo(Element.get$(parent));
            $element.addClass("selection-marker");
            $("<span class='icon catdvicon catdvicon-blank deselected'></span>").appendTo($element);
            $("<span class='icon catdvicon catdvicon-tick_min selected'></span>").appendTo($element);
        }
    }
    
    export interface SelectModeChangedEvent
    {
       selectMode: boolean;
    }


    // Common aspects of GridView and FilmstripView
    class BaseThumbnailView extends Control implements ClipView
    {
        public dataSource: PagedDataSource;
        public resultSet: PartialResultSet<Clip>;
        public pageSize: number;
        public pagingControls: PagingControls;
        public columns: ViewColumn[];
        public options: any;

        private selectionMode: SelectionMode = SelectionMode.None;
        private selectedIndexes: number[] = [];
        private selectionChangedHandler: (evt: SelectionChangedEvent) => void;
        private itemClickedHandler: (evt: ItemClickedEvent) => void;

        public thumbnailSize: string;
        public $scrollview: JQuery;

        constructor(element: any, cssClass: string, columns: ViewColumn[], options: any, dataSource: PagedDataSource)
        {
            super(element);

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
            this.pagingControls.onLoadPage((skip, take) =>
            {
                this.loadData(skip, take);
            });
        }

        public onItemClicked(itemClickedHandler: (evt: ItemClickedEvent) => void)
        {
            this.itemClickedHandler = itemClickedHandler;
        }

        public onSelectionChanged(selectionChangedHandler: (evt: SelectionChangedEvent) => void)
        {
            this.selectionChangedHandler = selectionChangedHandler;
        }

        public getSelectedClips(): Clip[]
        {
            return this.selectedIndexes.map((selectedIndex) => this.resultSet.items[selectedIndex]);
        }

        public getSelectedElementIDs(): String[]
        {
            return this.selectedIndexes.map((selectedIndex) => this._getRowElementID(selectedIndex));
        }

        public clearSelection()
        {
            this.selectedIndexes = [];
            this._deselectAllRows();
        }

        public selectAll()
        {
            this.selectedIndexes = [];
            this.resultSet.items.forEach((item, i) =>
            {
                this.selectedIndexes.push(i);
                this._selectRow(i, true);
            });
            this.updateActionButtons();
        }
                
        private updateActionButtons()
        {
            if (this.selectedIndexes.length > 0)
            {
                $("button.item-action,a.item-action").removeAttr("disabled");
                $("li.item-action").removeClass("disabled");
            }
            else
            {
                $("button.item-action,a.item-action").attr("disabled", "disabled");
                $("li.item-action").addClass("disabled");
            }
        }

        public reload(pagingOffset: number = 0)
        {
            this.loadData(pagingOffset, this.pageSize);
        }

        public loadData(skip: number, take: number)
        {
            this.$scrollview.empty();

            this.dataSource.getData({ skip: skip, take: take },(resultSet: PartialResultSet<Clip>) =>
            {
                this.resultSet = resultSet;
                this.pagingControls.update(resultSet);
                this._renderClips(resultSet.items);
                this.selectedIndexes = [];
                this.updateActionButtons();
            });
        }

        public _item_onClick(evt: JQueryEventObject, clickedRowIndex: number, doubleClick: boolean) 
        {
            if (this.selectionMode == SelectionMode.Toggle)
            {
                var currentlySelected = this.selectedIndexes.indexOf(clickedRowIndex) != -1;
                if (!currentlySelected)
                {
                    this.selectedIndexes.push(clickedRowIndex);
                    this._selectRow(clickedRowIndex, true);
                }
                else
                {
                    this.selectedIndexes = this.selectedIndexes.filter((index) => index != clickedRowIndex);
                    this._selectRow(clickedRowIndex, false);
                }
            }
            else
            {
                if (this.selectionMode == SelectionMode.Single || this.selectionMode == SelectionMode.Multi)
                {
                    if ((this.selectionMode == SelectionMode.Single)
                        || (!(evt.ctrlKey || evt.metaKey) && !evt.shiftKey && (this.selectedIndexes.length > 0)))
                    {
                        // deselect everything
                        this.selectedIndexes = [];
                        this._deselectAllRows();
                    }

                    if ((this.selectionMode == SelectionMode.Multi) && evt.shiftKey && (this.selectedIndexes.length > 0))
                    {
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
                        for (var i = 0; i < numSelectedItems; i++)
                        {
                            this.selectedIndexes.push(index);
                            this._selectRow(index, true);
                            index += step;
                        }
                    }
                    else
                    {
                        // select clicked row
                        this.selectedIndexes.push(clickedRowIndex);
                        this._selectRow(clickedRowIndex, true);
                    }
                }
                if (this.itemClickedHandler)
                {
                    this.itemClickedHandler($.extend({
                        itemIndex: clickedRowIndex,
                        item: this.resultSet.items[clickedRowIndex],
                        doubleClick: doubleClick
                    }, evt));
                }
            }

            this.updateActionButtons();

            if (this.selectionChangedHandler)
            {
                this.selectionChangedHandler({
                    selectedIndexes: this.selectedIndexes,
                    selectedItems: this.getSelectedClips(),
                    doubleClick: doubleClick
                });
            }
        }

        public setSelectionMode(selectionMode : SelectionMode)
        {
            return this.selectionMode = selectionMode;
        }

        public setSelectMode(selectMode: boolean)
        {
            if (selectMode && (this.selectionMode == SelectionMode.None))
            {
                this.selectionMode = SelectionMode.Toggle;
                this.$scrollview.find("div.selection-marker").show(100);
            }
            else if (!selectMode && (this.selectionMode == SelectionMode.Toggle))
            {
                this.selectionMode = SelectionMode.None;
                this.$scrollview.find("div.selection-marker").hide(100);
                this.selectedIndexes = [];
                this._deselectAllRows();
            }
            this.updateActionButtons();
        }

        public _renderClips(clips: Clip[])
        { /* abstract */ }

        public _selectRow(rowIndex: number, select: boolean)
        { /* abstract */ }

        public _deselectAllRows()
        { /* abstract */ }

        public _getRowElementID(rowIndex: number): String
        { /* abstract */ return null; }
    }

    class GridView extends BaseThumbnailView
    {
        constructor(element: any, viewInfo: ViewInfo, dataSource: PagedDataSource)
        {
            super(element, "gridView", viewInfo.columns, viewInfo.options, dataSource);
        }

        public _renderClips(clips: Clip[])
        {
            this.$scrollview.empty();

            clips.forEach((clip, i) =>
            {
                var textPosition: string = this.options["text"];
                var cssClasses = "cell " + this.thumbnailSize + (textPosition == "right" ? " right-text" : "");
                var src = clip.posterID ? "src='" + $catdv.getApiUrl("thumbnails/" + clip.posterID) + "'" : "";
                var $cell = $("<div id='" + this.elementId + "_" + i + "' class='" + cssClasses + "' style='display: inline-block'>").appendTo(this.$scrollview);

                var $imgDiv = $cell;
                var $textDiv = $cell;
                if (textPosition == "right")
                {
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

                if (textPosition != "none")
                {
                    this.columns.forEach((column) =>
                    {
                        var value = column.render(clip);
                        if (column.fieldDef.ID == "TY2") // Type Icon
                        {
                            $(value).appendTo($cell);
                        }
                        else
                        {
                            $("<span>" + (value || "&nbsp;") + "</span>").css({
                                "display": "block",
                                "overflow": "hidden",
                                "white-space": "nowrap"
                            }).appendTo($textDiv);
                        }
                    });
                }

                SelectionIndicator.create({ "style": "display:none;" }, $cell);

                $cell.on("click",(evt) => super._item_onClick(evt, i, false));

                $cell.on("dblclick",(evt) => super._item_onClick(evt, i, true));

            });
        }

        public _selectRow(rowIndex: number, select: boolean)
        {
            if (select)
            {
                this.$element.find("#" + this.elementId + "_" + rowIndex).addClass("selected");
            }
            else
            {
                this.$element.find("#" + this.elementId + "_" + rowIndex).removeClass("selected");
            }
        }

        public _getRowElementID(rowIndex: number): String
        {
            return "#" + this.elementId + "_" + rowIndex;
        }

        public _deselectAllRows()
        {
            this.$element.find("div.cell").removeClass("selected");
        }
    }

    class FilmstripView extends BaseThumbnailView
    {
        constructor(element: any, viewInfo: ViewInfo, dataSource: PagedDataSource)
        {
            super(element, "filmstripView", viewInfo.columns, viewInfo.options, dataSource);
        }

        public _renderClips(clips: Clip[])
        {
            this.$scrollview.empty();

            clips.forEach((clip, i) =>
            {
                // horizontal strip with info  header at left and then thumbnails 
                var $row = $("<div id='" + this.elementId + "_" + i + "' class='filmstripRow " + this.thumbnailSize + "'>").css({
                    "white-space": "nowrap"
                }).appendTo(this.$scrollview);

                $row.on("click",(evt) => super._item_onClick(evt, i, false));

                $row.on("dblclick",(evt) => super._item_onClick(evt, i, true));

                var $header = $("<div class='header'>").css({
                    "display": "inline-block"
                }).appendTo($row);

                this.columns.forEach((column) =>
                {
                    var value = column.render(clip);
                    if (column.fieldDef.ID == "TY2") // Type Icon
                    {
                        $(value).appendTo($header);
                    }
                    else
                    {
                        $("<span>" + (value || "&nbsp;") + "</span>").css({
                            "display": "block",
                            "overflow": "hidden",
                            "white-space": "nowrap"
                        }).appendTo($header);
                    }
                });

                SelectionIndicator.create({ "style": "display:none;" }, $header);

                if (clip.duration.secs > 0) 
                {

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
                    thumbnailIDs.forEach((thumbnailID) =>
                    {
                        var url = $catdv.getApiUrl("thumbnails/" + thumbnailID);
                        var $img = $("<img src='" + url + "'>").appendTo($thumbnails);
                    });
                }
                else if (clip.posterID)
                {
                    // still
                    var url = $catdv.getApiUrl("thumbnails/" + clip.posterID);
                    var $img = $("<img src='" + url + "' class='still'>").appendTo($row);
                }

            });
        }

        public _selectRow(rowIndex: number, select: boolean)
        {
            if (select)
            {
                this.$element.find("#" + this.elementId + "_" + rowIndex).addClass("selected");
            }
            else
            {
                this.$element.find("#" + this.elementId + "_" + rowIndex).removeClass("selected");
            }
        }

        public _getRowElement(rowIndex: number): Element
        {
            return new Element(this.$element.find("#" + this.elementId + "_" + rowIndex));
        }

        public _deselectAllRows()
        {
            this.$element.find("div.filmstripRow").removeClass("selected");
        }
    }

    class TableView extends DataTable implements ClipView
    {
        constructor(element: any, viewInfo: ViewInfo, dataSource: PagedDataSource)
        {
            var columns: DataTableColumn[] =
                [
                    {
                        title: "",
                        width: 0
                    }
                ];
            viewInfo.columns.forEach((col) => columns.push(col));
 
            super(element, {
                selectionMode: SelectionMode.Multi,
                pagedDataSource: dataSource,
                showLoadingMessage: false,
                columns: columns,
                deferLoading: true,
                pageSize: ServerSettings.clipsPageSize
            });

            this.css({ "position": "absolute", "top": "0px", "left": "0px", "width": "100%", "height": "100%" });
            
            super.setSelectionMode(SelectionMode.None);
        }

        public getSelectedClips(): Clip[]
        {
            return this.getSelectedItems();
        }

        public setSelectMode(selectMode: boolean)
        {
            if (selectMode && (super.getSelectionMode() == SelectionMode.None))
            {
                super.setSelectionMode(SelectionMode.Toggle);
                this.$element.find("tr th:first-child").text("Select").animate({ "width": 56 }, 100);
                this.$element.find("tr td:first-child").each((index, elem) => 
                {
                    SelectionIndicator.create({}, $(elem));
                });
            }
            else if (!selectMode && (super.getSelectionMode() == SelectionMode.Toggle))
            {
                super.setSelectionMode(SelectionMode.None);
                this.$element.find("tr th:first-child").animate({ "width": 0 }, 100, null, () =>
                {
                    this.$element.find("tr th:first-child").empty();
                    this.$element.find("tr td:first-child").empty();
                });
            }
        }
    }

    export class ViewControls extends Panel
    {
        private btnListViews: OptionsButton;
        private btnGridViews: OptionsButton;
        private btnFilmstripViews: OptionsButton;

        private clipsPanel: ClipsPanel;
        private viewClipUrl: string;

        constructor(element, clipsPanel: ClipsPanel, viewClipUrl: string)
        {
            super(element);

            this.clipsPanel = clipsPanel;
            this.viewClipUrl = viewClipUrl;

            this.loadViews();
        }

        public refresh()
        {
            ViewManager.clearCache();
            this.loadViews();
        }

        private loadViews()
        {
            this.$element.html("<div id='btnListViews'></div><div id='btnGridViews'></div><div id='btnFilmstripViews'></div>");

            ViewManager.getViewNameInfo(this.viewClipUrl,(viewNameInfo) => 
            {
               this.btnListViews = new OptionsButton("btnListViews", {
                    iconClass: "catdvicon small catdvicon-list_view",
                    options: viewNameInfo["list"].names,
                    selectedOption: viewNameInfo["list"].defaultView
                });
                this.btnListViews.onClick((evt, viewName) =>
                {
                    this.setView("list", viewName);
                });

                this.btnGridViews = new OptionsButton("btnGridViews", {
                    iconClass: "catdvicon small catdvicon-thumb_view",
                    options: viewNameInfo["grid"].names,
                    selectedOption: viewNameInfo["grid"].defaultView
                });
                this.btnGridViews.onClick((evt, viewName) =>
                {
                    this.setView("grid", viewName);
                });

                this.btnFilmstripViews = new OptionsButton("btnFilmstripViews",{
                    iconClass: "catdvicon small catdvicon-filmstrip_view",
                    options: viewNameInfo["filmstrip"].names,
                    selectedOption: viewNameInfo["filmstrip"].defaultView
                });
                this.btnFilmstripViews.onClick((evt, viewName) =>
                {
                    this.setView("filmstrip", viewName);
                });
                
                // load saved query/view info          
                var viewType = ClientSettings.viewType || catdv.settings.defaultClipViewType || "grid";
                var viewName = ClientSettings.viewName || catdv.settings.defaultClipView || "Normal";

                // Set selected options to saved values
                switch (viewType)
                {
                    case "grid":
                    default:
                        this.btnGridViews.setSelectedOption(viewName);
                        break;
                    case "filmstrip":
                        this.btnFilmstripViews.setSelectedOption(viewName);
                        break;
                    case "list":
                        this.btnListViews.setSelectedOption(viewName);
                        break;
                }
            
                // start the ball rolling with the saved values
                this.setView(viewType, viewName);
            });
        }

        private setView(viewType: string, viewName: any)
        {
            switch (viewType)
            {
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
        }
    }

    export interface FilteredList
    {
        getActveFilters: () => FilterItem[];
        addActiveFilter: (filter: FilterItem) => void;
        removeActiveFilter(filter);
        clearFilters: () => void;
        getFilters: (callback: (filters: Filter[]) => void) => void;
        onQueryChanged: (callback: (clipQuery: ClipQuery) => void) => void;
    }

    export class ClipsPanel extends Panel implements FilteredList, PagedDataSource
    {
        private $clipsPanel : JQuery;
        private $overlayPanel : JQuery;
        private $messagePanel : JQuery;
 
        private currentView: ClipView;
        private currentViewType: string = null;
        private currentViewName: string = null;
        private currentClipQuery: ClipQuery = null;
        private activeFilters: FilterItem[] = [];
        private viewClipUrl: string = null;
        private useCache: boolean;
        private selectionMode: SelectionMode = SelectionMode.None;
        private selectMode: boolean = false;

        private selectionChangedListeners: EventListeners<SelectionChangedEvent> = new EventListeners<SelectionChangedEvent>();
        private queryChangedListeners: EventListeners<ClipQuery> = new EventListeners<ClipQuery>();
        private selectModeChangedListeners: EventListeners<SelectModeChangedEvent> = new EventListeners<SelectModeChangedEvent>();

        constructor(element: any, viewClipUrl: string, thisPageClass: string)
        {
            super(element);

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
            if (lastPage === "ui.ClipDetailsPage")
            {
                // ClipDetails page sets catdv_useCache cookie to indicate if it has updated a clip so we shouldn't use cache
                this.useCache = $.cookie("catdv_useCache") === "true";
            }
            $.cookie("catdv_useCache", "false");

            var searchParam = $.urlParam("search");
            var tParam = $.urlParam("t");
            if (searchParam && tParam && (tParam !== $.cookie("catdv_tParam")))
            {
                if (searchParam.startsWith("and((") || searchParam.startsWith("or(("))
                {
                    this.currentClipQuery = {
                        title: "Search Results",
                        queryDef: QueryDefinitionUtil.parse(searchParam)
                    };
                }
                else
                {
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
            else
            {
                // If this is new session then clear any saved search
                if (catdv.session !== $.cookie("last_session"))
                {
                    this.currentClipQuery = null;
                }
                else
                {
                    try
                    {
                        this.currentClipQuery = ClientSettings.getSavedClipQuery();
                        this.activeFilters = ClientSettings.getSavedActiveFilters() || [];
                    }
                    catch (e)
                    {
                        // stored data corrupted in some way - fall back to open query
                        this.currentClipQuery = null;
                        this.activeFilters = [];
                    }
                }
            }
            $.cookie("last_session", catdv.session)
        }

        public getSelectionMode() : SelectionMode
        {
            return this.selectionMode;
        }
        public setSelectionMode(selectionMode : SelectionMode)
        {
            return this.selectionMode = selectionMode;
        }
          
        public toggleSelectMode(): boolean
        {
            return this.setSelectMode(!this.selectMode);
        }

        public setSelectMode(selectMode: boolean): boolean
        {
            this.selectMode = selectMode;
            // Only process setSelectMode if we're using Toggle selection
            if ((this.selectionMode == SelectionMode.None) || (this.selectionMode == SelectionMode.Toggle))
            {
                this.currentView.setSelectMode(this.selectMode);
                if (this.selectMode)
                {
                    this.$element.find("a").on("click", (evt) =>
                    {
                        evt.preventDefault();
                    });
                }
                else
                {
                    this.$element.find("a").off("click");
                }

                this.selectModeChangedListeners.notifyListeners({ selectMode: selectMode });
            }
            return this.selectMode;
        }

        public selectAll()
        {
            this.currentView.selectAll();
        }
              
        public getSelectedClips(): Clip[]
        {
            return this.currentView.getSelectedClips();
        }

        public getSelectedElementIDs(): String[]
        {
            return this.currentView.getSelectedElementIDs();
        }

        public clearSelection()
        {
            this.currentView.clearSelection();
        }

        public onSelectionChanged(selectionChangedHandler: (evt: SelectionChangedEvent) => void)
        {
            this.selectionChangedListeners.addListener(selectionChangedHandler);
        }
        
        public onSelectModeChanged(selecttModeChangedHandler: (evt: SelectModeChangedEvent) => void)
        {
            this.selectModeChangedListeners.addListener(selecttModeChangedHandler);
        }

        public onQueryChanged(queryChangedHandler: (clipQuery: ClipQuery) => void)
        {
            this.queryChangedListeners.addListener(queryChangedHandler);
            // fire event as soon as handler is registered to update caller with filters read from cookies
            this.fireQueryChanged();
        }
        private fireQueryChanged()
        {
            if (this.currentClipQuery)
            {
                this.currentClipQuery.cached = this.useCache;
                this.queryChangedListeners.notifyListeners(this.currentClipQuery);
            }
            else
            {
                this.queryChangedListeners.notifyListeners({ title: "Clips", cached: this.useCache });
            }
        }

        public setView(viewType: string, viewName: string)
        {
            this.currentViewType = viewType;
            this.currentViewName = viewName;
 
            this.$clipsPanel.empty();

            switch (this.currentViewType)
            {
                case "grid":
                default:
                    ViewManager.getView("grid", viewName, this.viewClipUrl,(viewInfo) =>
                    {
                        this.currentView = new GridView($("<div id='gridView'>").appendTo(this.$clipsPanel), viewInfo, this);
                    });
                    break;

                case "filmstrip":
                    ViewManager.getView("filmstrip", viewName, this.viewClipUrl,(viewInfo) =>
                    {
                        this.currentView = new FilmstripView($("<div id='filmstripView'>").appendTo(this.$clipsPanel), viewInfo, this);
                    });
                    break;

                case "list":
                    ViewManager.getView("list", viewName, this.viewClipUrl,(viewInfo) =>
                    {
                        this.currentView = new TableView($("<div id='tableView'>").appendTo(this.$clipsPanel), viewInfo, this);
                    });
                    break;
            }

            this.currentView.setSelectionMode(this.selectionMode);          
            this.setSelectMode(false);
            
            this.currentView.onItemClicked((evt) => 
            {
                if (!this.selectMode && this.viewClipUrl)
                {
                    window.location.href = this.viewClipUrl + "?id=" + (<Clip>evt.item).ID;
                }
            });

            this.currentView.onSelectionChanged((evt) =>
            {
                this.selectionChangedListeners.notifyListeners(evt);
            });

            var pagingOffset = ClientSettings.pagingOffset;
            this.reload(pagingOffset);
        }
 
        //        public getClipQuery(): ClipQuery
        //        {
        //            return this.currentClipQuery;
        //        }
        public setClipQuery(query: ClipQuery)
        {
            this.currentClipQuery = query
            this.clearFilters();
            this.fireQueryChanged();
            this.reload(0, false);
        }

        public setMessage(message : string)
        {
            this.$messagePanel.html(message);
        }
        
        public getActveFilters(): FilterItem[]
        {
            return this.activeFilters;
        }

        public addActiveFilter(filter: FilterItem)
        {
            // Currently only one freetext filter supported
            if(filter.filterOp == "like")
            {
                 this.activeFilters =  this.activeFilters.filter((filter) => filter.filterOp != "like");
            }
            this.activeFilters.push(filter);
            this.fireQueryChanged();
            this.reload(0, false);
        }
        public removeActiveFilter(filter: FilterItem)
        {
            this.activeFilters.splice(this.activeFilters.indexOf(filter), 1);
            this.fireQueryChanged();
            this.reload(0, false);
        }

        public clearFilters()
        {
            this.activeFilters = [];
            this.fireQueryChanged();
        }

        public reload(pagingOffset: number = 0, useCache: boolean = null)
        {
            if (useCache != null) this.useCache = useCache;
            this.setSelectMode(false);
            this.currentView.reload(pagingOffset);
        }

        /* Implement PagedDataSource.getData() */
        public getData(params: catdv.StdParams, callback: (resultSet: PartialResultSet<any>) => void)
        {
            this.setSelectMode(false);

            if (this.currentClipQuery || ServerSettings.showRecentClips)
            {
                // save search options to cookies
                ClientSettings.pagingOffset = params.skip;
                ClientSettings.saveClipQuery(this.currentClipQuery);

                var freeTextFilters = this.activeFilters.filter((filter) => filter.filterOp == "like");
                var freeTextQueryTerms : QueryTerm[] = [];
                
                if (this.currentClipQuery)
                {
                    if (this.currentClipQuery.catalog)
                    {
                        params["query"] = "((catalog.id)eq(" + this.currentClipQuery.catalog.ID + "))";
                    }
                    else if (this.currentClipQuery.smartFolder)
                    {
                        params["smartFolderID"] = this.currentClipQuery.smartFolder.ID;
                    }
                    else if (this.currentClipQuery.clipList)
                    {
                        params["clipListID"] = this.currentClipQuery.clipList.ID;
                    }
                    else if (this.currentClipQuery.queryDef)
                    {
                        if (freeTextFilters.length > 0)
                        {
                            params["query"] = QueryDefinitionUtil.toQueryString({
                                "name": this.currentClipQuery.queryDef.name,
                                "terms": this.currentClipQuery.queryDef.terms.filter((term) => term.op != "like")
                            });
                            freeTextQueryTerms = this.currentClipQuery.queryDef.terms.filter((term) => term.op == "like");
                        }
                        else
                        {
                            params["query"] = QueryDefinitionUtil.toQueryString(this.currentClipQuery.queryDef);
                        }
                    }
                }
                else
                {
                    params["query"] = "";
                }
                params["cached"] = this.useCache;

                if (this.activeFilters.length > 0)
                {
                    if ((freeTextQueryTerms.length > 0) && (freeTextFilters.length > 0))
                    {
                        var otherFilters = this.activeFilters.filter((filter) => filter.filterOp != "like");

                        var freeTextFilter = "";
                        freeTextQueryTerms.forEach((term) => freeTextFilter += " " + term.params);
                        freeTextFilters.forEach((filter) => freeTextFilter += " " + filter.value);
                        
                        var query = "((" + catdv.settings.simpleSearchField + ")like(" + freeTextFilter + "))";
                        
                        if (params["query"])
                        {
                            query += "and(" + params["query"] + ")";
                        }

                        var filterQuery = FilterUtil.getFilterQuery(otherFilters);
                        if (filterQuery)
                        {
                            query += "and(" + filterQuery + ")";
                        } 
                                              
                        params["query"] = query;
                    }
                    else
                    {
                        var filterQuery = FilterUtil.getFilterQuery(this.activeFilters);
                        if (params["query"])
                        {

                            params["query"] = "(" + params["query"] + ")and(" + filterQuery + ")";
                        }
                        else
                        {
                            params["query"] = filterQuery;
                        }
                    }
                }

                ClientSettings.saveActiveFilters(this.activeFilters);

                // TODO: should check which view columns we have to see if we need user fields or metadata
                params["include"] = "userfields,thumbnails";

                this.setMessage("Loading...");
                $catdv.getClips(params,
                    (resultSet: PartialResultSet<any>) =>
                    {
                        this.setMessage((resultSet.items && resultSet.items.length > 0) ? "" : ServerSettings.noResultsMessage);
                        this.useCache = true;
                        callback(resultSet);
                    },
                    () =>
                    {
                        this.setMessage("Server Error");
                        callback({ totalItems: 0, offset: 0, items: [] });
                    });
            }
            else
            {
                this.setMessage(ServerSettings.initialMessage);
                callback({ totalItems: 0, offset: 0, items: [] });
            }
        }

        public getFilters(callback: (filters: Filter[]) => void)
        {
            var params = { "cached": true, "include": "userfields,thumbnails", "skip": 0, "take": 0 };

            if (this.currentClipQuery)
            {
                if (this.currentClipQuery.catalog)
                {
                    params["query"] = "((catalog.id)eq(" + this.currentClipQuery.catalog.ID + "))";
                }
                else if (this.currentClipQuery.smartFolder)
                {
                    params["smartFolderID"] = this.currentClipQuery.smartFolder.ID;
                }
                else if (this.currentClipQuery.clipList)
                {
                    params["clipListID"] = this.currentClipQuery.clipList.ID;
                }
                else if (this.currentClipQuery.queryDef)
                {
                    params["query"] = QueryDefinitionUtil.toQueryString(this.currentClipQuery.queryDef);
                }
     
                $catdv.getClipFilters(params,
                    (filters: Filter[]) =>
                    {
                        callback(filters);
                    },
                    () =>
                    {
                        callback([]);
                    });
            }
            else
            {
                 callback([]);
            }
        }
    }
}