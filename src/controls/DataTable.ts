module controls
{
    import PartialResultSet = catdv.PartialResultSet;
    import StdParams = catdv.StdParams;
    import HtmlUtil = util.HtmlUtil;
    
    export enum SelectionMode
    {
        None = 0,
        Single = 1,
        Multi = 2,
        Toggle = 3
    }

    export interface DataTableColumn
    {
        title: string;
        dataProp?: string;
        renderer?: (object: any, val: any, row: number) => string;
        isSortable?: boolean;
        sortBy?: string;
        width?: number;
    }

    export interface DataTableSettings
    {
        selectionMode?: SelectionMode;
        pageSize?: number;
        showLoadingMessage?: boolean;
        deferLoading?: boolean;
        topAlignRows?: boolean;

        columns: DataTableColumn[];
        
        sortColumn?: number;
        sortReversed?: boolean;

        hideRow?: (object: any) => boolean;

        simpleDataSource?: SimpleDataSource<any>;
        pagedDataSource?: PagedDataSource;

        onRowClicked? (row: any, data: any, iDataIndex: number);
    }

    export class PagingControls extends Element
    {
        private resultSet: PartialResultSet<any>;
        private $pagingMessage: JQuery;
        private pageSize: number;

        private loadPageHandler: (skip: number, take: number) => void = $.noop;

        constructor(elementId: string, $parent: JQuery, pageSize: number)
        {
            super($("<ul id='" + elementId + "' class='paging'>").appendTo($parent));

            this.pageSize = pageSize;

            $("<li><a href='#'><span class='glyphicon glyphicon-fast-backward'></span> First</a></li>").appendTo(this.$element)
                .on("click",(evt) =>
            {
                this.loadPageHandler(0, this.pageSize);
            });

            $("<li><a href='#'><span class='glyphicon glyphicon-step-backward'></span> Prev</a></li>").appendTo(this.$element)
                .on("click",(evt) =>
            {
                this.loadPageHandler(Math.max(this.resultSet.offset - this.pageSize, 0), this.pageSize);
            });

            this.$pagingMessage = $("<li class='dt-paging-message'></li>").appendTo(this.$element);
            $("<li><a href='#'>Next <span class='glyphicon glyphicon-step-forward'></span></a></li>").appendTo(this.$element)
                .on("click",(evt) =>
            {
                if (this.resultSet.offset + this.pageSize > this.resultSet.totalItems)
                {
                    var lastPageSize = (this.resultSet.totalItems % this.pageSize) || this.pageSize;
                    var lastPageOffset = Math.max(this.resultSet.totalItems - lastPageSize, 0);
                    this.loadPageHandler(Math.min(this.resultSet.offset + this.pageSize, lastPageOffset), lastPageSize);
                }
                else
                {
                    this.loadPageHandler(this.resultSet.offset + this.pageSize, this.pageSize);
                }
            });
            $("<li><a href='#'>Last <span class='glyphicon glyphicon-fast-forward'></span></a></li>").appendTo(this.$element)
                .on("click",(evt) =>
            {
                var lastPageSize = (this.resultSet.totalItems % this.pageSize) || this.pageSize;
                var lastPageOffset = Math.max(this.resultSet.totalItems - lastPageSize, 0);
                this.loadPageHandler(lastPageOffset, lastPageSize);
            });
        }

        public onLoadPage(loadPageHandler: (skip: number, take: number) => void)
        {
            this.loadPageHandler = loadPageHandler || $.noop;
        }

        public update(resultSet: PartialResultSet<any>)
        {
            this.resultSet = resultSet;

            if ((this.resultSet != null) && (this.resultSet.items != null) && (this.resultSet.items.length > 0))
            {
                this.$pagingMessage.text("" + (this.resultSet.offset + 1) + " to " + (this.resultSet.offset + this.resultSet.items.length) + " of " + this.resultSet.totalItems);
            }
            else
            {
                this.$pagingMessage.text("No Data");
            }
        }
    }

    export interface SelectionChangedEvent
    {
        selectedIndexes: number[];
        selectedItems: any[];
        doubleClick: boolean;
    }

    export interface ItemClickedEvent extends JQueryEventObject
    {
        itemIndex: number;
        item: any;
        doubleClick: boolean;
    }

    export class DataTable extends Control
    {
        private settings: DataTableSettings;
        private pagedDataSource: PagedDataSource
        private simpleDataSource: SimpleDataSource<any>
        private columns: DataTableColumn[];
        private sortColumn: number = null;
        private sortReversed: boolean;
        private hideRowFunc: (object: any) => boolean;

        private resultSet: PartialResultSet<any>;
        private $wrapper: JQuery;
        private $headerDiv: JQuery;
        private $headerTable: JQuery;
        private $bodyDiv: JQuery;
        private $bodyTable: JQuery;
        private $footerDiv: JQuery;
        private pagingControls: PagingControls;

        private selectedIndexes: number[] = [];

        private selectionChangedHandler: (evt: SelectionChangedEvent) => void;
        private itemClickedHandler: (evt: ItemClickedEvent) => void;

        constructor(element: any, settings: DataTableSettings)
        {
            super(element);

            this.settings = $.extend(
                {
                    selectionMode: SelectionMode.Single,
                    showLoadingMessage: true,
                    topAlignRows: false,
                    pageSize: 50
                }, settings);

            this.pagedDataSource = settings.pagedDataSource;
            this.simpleDataSource = settings.simpleDataSource;

            this.hideRowFunc = settings.hideRow;
            this.columns = settings.columns;
            this.sortColumn = settings.sortColumn;
            this.sortReversed = this.sortColumn && settings.sortReversed;
          
            // Render the table
            this.renderDataTable();

            // Listen for 'catdv:shown' events (generated by the tab control) and trigger a re-layout
            if (!this.$element.is(':visible'))
            {
                this.$element.addClass("notify_shown");
                this.$element.on("catdv:shown", (evt) => 
                {
                    this.updateColumnWidths();
                });
            }

            // Ditto if the window is resized
            $(window).resize((evt) =>
            {
                this.updateColumnWidths();
            });    
         }
        
        public setColumns(columns: DataTableColumn[], pagingOffset: number = 0)
        {
            this.renderDataTable(pagingOffset);
        }

        public getSelectionMode()
        {
            return this.settings.selectionMode;
        }
        public setSelectionMode(selectionMode: SelectionMode)
        {
            this.settings.selectionMode = selectionMode;
            this.clearSelection();
        }

        public onItemClicked(itemClickedHandler: (evt: ItemClickedEvent) => void)
        {
            this.itemClickedHandler = itemClickedHandler;
        }

        public onSelectionChanged(selectionChangedHandler: (evt: SelectionChangedEvent) => void)
        {
            this.selectionChangedHandler = selectionChangedHandler;
        }

        public clearSelection()
        {
            this.selectedIndexes = [];
            this.$element.find("tr").removeClass("selected");
            this.updateActionButtons();
        }

        public reload(pagingOffset: number = 0, callback : ()=> void = null)
        {
            // Only load data if columns have been specified - otherwise defer loading until setColumns() called
            if (this.columns)
            {
                this.loadData(pagingOffset, () => {
                    this.fireSelectionChangedEvent(false);
                    if(callback)
                    {
                        if(callback) callback();
                    }
                });
            }
        }

        public getSelectedItem(): any
        {
            return (this.selectedIndexes.length > 0) ? this.resultSet.items[this.selectedIndexes[0]] : null;
        }

        public getSelectedItems(): any[]
        {
            return this.selectedIndexes.map((selectedIndex) => this.resultSet.items[selectedIndex]);
        }

        public getSelectedElementIDs(): String[]
        {
            return this.selectedIndexes.map((selectedIndex) => "#" + this.rowID(selectedIndex));
        }
        
        public setSelection(selectedIndexes: number[])
        {
            this.clearSelection();
            this.selectedIndexes = selectedIndexes;
            this.selectedIndexes.forEach((selectedIndex) =>
            {
                this.$element.find("#" + this.rowID(selectedIndex)).addClass("selected");
            });
            this.updateActionButtons();
        }

        public selectAll()
        {
            this.setSelection(this.resultSet.items.map((item, i) => i));
        }
              
        public hideRows(rowIndexes: number[])
        {
            rowIndexes.forEach((rowIndex) => 
            {
                $("#" + this.rowID(rowIndex)).hide();
            });
            this.updateColumnWidths();
        }
        public showRows(rowIndexes: number[])
        {
            rowIndexes.forEach((rowIndex) => 
            {
                $("#" + this.rowID(rowIndex)).show();
            });
            this.updateColumnWidths();
        }
        
        public findItem(matchFunction: (o: any) => boolean)
        {
            var data = this.resultSet.items;
            for (var i = 0; i < data.length; i++)
            {
                if (matchFunction(data[i])) return data[i];
            }
            return null;
        }

        private renderDataTable(pagingOffset: number = 0)
        {
            // Only load data if columns have been specified - otherwise defer loading until setColumns() called           
            if (this.columns)
            {
                this.renderGrid();
                this.updateColumnWidths();
                if (!this.settings.deferLoading)
                {
                    this.loadData(pagingOffset);
                }
            }
        }

        private renderGrid()
        {
            // render table
            // Table rendered as three separate sections, one table for the header columns, one table for the table body (that will scroll)
            // and one div for the footer. The scrolling body table has a copy of the header, that will be hidden under the fixed header.

            // Wrapper
            var html = "<div class='dt-wrapper'>";

            // Header
            html += "<div class='dt-header'>";
            html += "<table class='dt-table'>";
            html += this.renderTHEAD(true);
            html += "</table></div>\n";

            // Body (also has its own copy of the header, which will be rendered 'underneath' the fixed header)
            html += "<div class='dt-body'>";
            html += "<table class='dt-table'>";
            html += this.renderTHEAD(false);
            html += "<tbody>"
            html += "<tr><td colspan=" + this.columns.length + ">";
            if(this.settings.showLoadingMessage) html += "<h3 class='loadingMessage'>Loading...</h3>";
            html += "</td></tr>\n";
            html += "</tbody></table></div>\n"

            // Footer (Paging)
            html += "<div class='dt-footer'><div>";

            //  Close Wrapper
            html += "</div>";

            this.$element.html(html);

            this.$wrapper = this.$element.find(".dt-wrapper");
            this.$headerDiv = this.$wrapper.find(".dt-header");
            this.$headerTable = this.$wrapper.find(".dt-header table.dt-table");
            this.$bodyDiv = this.$wrapper.find(".dt-body");
            this.$bodyTable = this.$wrapper.find(".dt-body table.dt-table");
            if (this.pagedDataSource)
            {
                this.$footerDiv = this.$element.find(".dt-footer");
            }
            this.$headerTable.find(".sortable").on("click",(evt) =>
            {
                var columnIndex = this.$headerTable.find("th").index(evt.delegateTarget);
                if (this.sortColumn == columnIndex)
                {
                    this.sortReversed = !this.sortReversed;
                }
                else
                {
                    this.sortColumn = columnIndex;
                    this.sortReversed = false;
                }
                this.$headerTable.find(".sortable").removeClass("sortAsc").removeClass("sortDesc");
                $(evt.delegateTarget).addClass(this.sortReversed ? "sortDesc" : "sortAsc");
                this.reload();
            });

            if (this.pagedDataSource)
            {
                this.pagingControls = new PagingControls(this.elementId + "_paging", this.$footerDiv, this.settings.pageSize);
                this.pagingControls.onLoadPage((skip, take) =>
                {
                    this.loadData(skip);
                });
            }

            var headerHeight = this.$headerTable.outerHeight(true) || 36;
            this.$wrapper.css({ "padding-top": headerHeight });
            this.$bodyTable.css({ "margin-top": -headerHeight });

            this.$headerTable.find("th:last-child").css({ "padding-right": "15px" });
            
            // Wire up scroll events on body to mirror and scroll column headers to match
            this.$bodyDiv.on("scroll",(evt) =>
            {
                Console.debug("scroll" + this.$bodyDiv.scrollLeft());
                this.$headerDiv.css("left", 0 - this.$bodyDiv.scrollLeft());
            });
        }

        private renderTHEAD(isInteractive: boolean): string
        {
            var columns: DataTableColumn[] = this.columns;

            var sortHeaderClass = this.sortReversed ? " sortDesc" : " sortAsc";
            var html = "<thead><tr>";
            for (var i = 0; i < columns.length; i++)
            {
                var s = columns[i].isSortable ? " class='sortable" + ((i === this.sortColumn) ? sortHeaderClass : "") + "'" : "";
                html += "<th" + s + "><span>" + HtmlUtil.escapeHtml(columns[i].title) + "</span></th>";
            }
            html += "</tr></thead>";
            return html;
        }

        private loadData(skip: number, callback : ()=> void = null)
        {
            this.$element.find("tbody").html("<tr><td colspan=" + this.columns.length + ">" 
                + (this.settings.showLoadingMessage ? "<h3 class='loadingMessage'>Loading...</h3>":"") 
                + "</td></tr>\n");

            if (this.pagedDataSource)
            {
                var params: StdParams = { skip: skip, take: this.settings.pageSize };
                if (this.sortColumn != null)
                {
                    params.sortBy = this.columns[this.sortColumn].sortBy || this.columns[this.sortColumn].dataProp;
                    params.sortDir = this.sortReversed ? "DESC" : "ASC";
                }
                this.pagedDataSource.getData(params,(resultSet: PartialResultSet<any>) =>
                {
                    this.resultSet = resultSet;
                    this.renderData();
                    if(callback) callback();
                });
            }
            else if (this.simpleDataSource)
            {
                var dataSourceParams: SimpleDataSourceParams = {};
                 if (this.sortColumn != null)
                {
                    dataSourceParams.sortBy = this.columns[this.sortColumn].sortBy || this.columns[this.sortColumn].dataProp;
                    dataSourceParams.sortDir = this.sortReversed ? "DESC" : "ASC";
                }
               this.simpleDataSource.getItems(dataSourceParams, (items: any[]) =>
                {
                    this.resultSet = {
                        totalItems: items.length,
                        offset: 0,
                        items: items
                    };
                    this.renderData();
                    if(callback) callback();
               });
            }
        }

        private renderData()
        {
            this.selectedIndexes = [];
            this.updateActionButtons();

            var html = "";
            if ((this.resultSet == null) || (this.resultSet.items == null) || (this.resultSet.items.length == 0))
            {
                html = "<tr><td colspan=" + this.columns.length + ">No data to display.</td></tr>\n"
            }
            else
            {
                var columns: DataTableColumn[] = this.columns;
                for (var row = 0; row < this.resultSet.items.length; row++)
                {
                    var rowData = this.resultSet.items[row];
                    var isHidden = this.hideRowFunc ? this.hideRowFunc(rowData) : false;
                    html += "<tr id='" + this.rowID(row) + "'" + (isHidden ? " style='display:none;'" : "") + (this.settings.topAlignRows ? " class='align-top'" : "") + ">"
                    for (var col = 0; col < columns.length; col++)
                    {
                        html += "<td>" + this.renderCellValue(rowData, columns[col], row) + "</td>";
                    }
                    html += "</tr>"
                }
            }
            this.$element.find("tbody").html(html);
            this.$element.find("tr")
                .on("click",(evt: JQueryEventObject) => { this.row_onClick(evt, false); })
                .on("dblclick",(evt: JQueryEventObject) => { this.row_onClick(evt, true); });

 
            this.updateColumnWidths();
            if (this.pagingControls)
            {
                this.pagingControls.update(this.resultSet);
            }
        }

        private renderCellValue(rowData: any, column: DataTableColumn, rowIndex : number)
        {
            try
            {
                var columnValue = column.dataProp ? rowData[column.dataProp] : null;
                if (column.renderer)
                {
                    // Can't escape this as rendered cells often contain HTML 
                    // It is up to the renderer to ensure that the HTML is safe
                    return column.renderer(rowData, columnValue, rowIndex) || "";
                }
                else
                {
                    if ((typeof columnValue != "undefined") && (columnValue != null)) 
                    {
                        return HtmlUtil.escapeHtml(String(columnValue));
                    }
                    else
                    {
                        return "";
                    }
                }
            }
            catch (e)
            {
                return e;
            }
        }

        private row_onClick(evt: JQueryEventObject, doubleClick: boolean) 
        {
            var rowID = evt.delegateTarget.getAttribute("id");
            if (!rowID) return; // header
            var clickedRowIndex = Number(rowID.split("_")[1]);

            if (this.itemClickedHandler)
            {
                this.itemClickedHandler($.extend({
                    itemIndex: clickedRowIndex,
                    item: this.resultSet.items[clickedRowIndex],
                    doubleClick: doubleClick
                }, evt));
            }

            if (this.settings.selectionMode == SelectionMode.None) return;

            if (this.settings.selectionMode == SelectionMode.Toggle)
            {
                var currentlySelected = this.selectedIndexes.indexOf(clickedRowIndex) != -1;
                if (!currentlySelected)
                {
                    this.selectedIndexes.push(clickedRowIndex);
                    this.$element.find("#" + this.rowID(clickedRowIndex)).addClass("selected");
                }
                else
                {
                    this.selectedIndexes = this.selectedIndexes.filter((index) => index != clickedRowIndex);
                    this.$element.find("#" + this.rowID(clickedRowIndex)).removeClass("selected");
                }
            }
            else
            {
                var multiselect = this.settings.selectionMode == SelectionMode.Multi;

                if (!multiselect || (!(evt.ctrlKey || evt.metaKey) && !evt.shiftKey && this.selectedIndexes.length > 0))
                {
                    // deselect everything
                    this.selectedIndexes = [];
                    this.$element.find("tr").removeClass("selected");
                }

                if (multiselect && evt.shiftKey && this.selectedIndexes.length > 0)
                {
                    // select all rows between existing selection and this row              
                    // capture the first selected row
                    var firstSelectedRow = this.selectedIndexes[0];

                    // then deselect everything - need to deselect anything outside the range
                    this.selectedIndexes = [];
                    this.$element.find("tr").removeClass("selected");

                    // then select all the rows from first to current
                    var numSelectedItems = Math.abs(clickedRowIndex - firstSelectedRow) + 1;
                    var step = (clickedRowIndex > firstSelectedRow) ? 1 : -1;
                    var index = firstSelectedRow;
                    for (var i = 0; i < numSelectedItems; i++)
                    {
                        this.selectedIndexes.push(index);
                        this.$element.find("#" + this.rowID(index)).addClass("selected");
                        index += step;
                    }
                }
                else
                {
                    // select clicked row
                    this.selectedIndexes.push(clickedRowIndex);
                    this.$element.find("#" + this.rowID(clickedRowIndex)).addClass("selected");
                }
            }

            this.fireSelectionChangedEvent(doubleClick);
            this.updateActionButtons();
        }

        private fireSelectionChangedEvent(doubleClick : boolean)
        {
            if (this.selectionChangedHandler)
            {
                this.selectionChangedHandler({
                    selectedIndexes: this.selectedIndexes,
                    selectedItems: this.getSelectedItems(),
                    doubleClick: doubleClick
                });
            }
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

        private rowID(rowIndex: number)
        {
            return "dt-" + this.elementId + "_" + rowIndex;
        }

        private calculateColumnWidths(minWidths: number[]): number[]
        {
            var columns: DataTableColumn[] = this.columns;
            var tableWidth = this.$element.width() - 64; // leave room for vertical scroll bar

            var numFixedColumns = 0;
            var totalFixedColumnWidth = 0;
            for (var i = 0; i < columns.length; i++)
            {
                if ((typeof columns[i].width != "undefined") && (columns[i].width != null))
                {
                    totalFixedColumnWidth += columns[i].width;
                    numFixedColumns++;
                }
            }

            var defautColumnWidth = Math.max((tableWidth - totalFixedColumnWidth) / (columns.length - numFixedColumns), 120);

            var tdWidths: number[] = [];
            for (var i = 0; i < columns.length; i++)
            {
                if ((typeof columns[i].width != "undefined") && (columns[i].width != null))
                {
                    tdWidths.push(columns[i].width);
                }
                else
                {
                    tdWidths.push(Math.max(minWidths[i], defautColumnWidth));
                }
            }
            return tdWidths;
        }

        private updateColumnWidths()
        {
            if (this.columns)
            {
                var minWidths: number[] = [];
                
                // NOTE: use of 'function' rather than '=>' for callback so that 'this' within the function refers to the current element
                this.$headerTable.find("tr th").each(function(index)
                {
                    var width = $(this).find("span").outerWidth();
                    width += parseInt($(this).css("padding-left"), 10) + parseInt($(this).css("padding-right"), 10);
                    width += parseInt($(this).css("margin-left"), 10) + parseInt($(this).css("margin-right"), 10);
                    width += parseInt($(this).css("borderLeftWidth"), 10) + parseInt($(this).css("borderRightWidth"), 10);
                    minWidths.push(width);
                });

                var tdWidths = this.calculateColumnWidths(minWidths);

                // NOTE: use of 'function' rather than '=>' for callback so that 'this' within the function refers to the current element
                this.$headerTable.find("tr th").each(function(index)
                {
                    var width = tdWidths[index];
                    if (width != null)
                    {
                        $(this).css('width', width);
                    }
                });

                // NOTE: use of 'function' rather than '=>' for callback so that 'this' within the function refers to the current element
                this.$bodyTable.find("tr th").each(function(index)
                {
                    var width = tdWidths[index];
                    if (width != null)
                    {
                        $(this).css('width', width);
                    }
                });
                
                // Shrink header table to same width as body table to correct for width taken by vertical scrollbar
                this.$headerTable.width(this.$bodyTable.width());
                
                // Update margins
                var headerHeight = this.$headerTable.outerHeight(true) || 36;
                this.$wrapper.css({ "padding-top": headerHeight });
                this.$bodyTable.css({ "margin-top": -headerHeight });
             }
        }
    }
}