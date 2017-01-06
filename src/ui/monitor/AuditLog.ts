module ui.monitor
{
    import DataTable = controls.DataTable;
    import Button = controls.Button;
    import Element = controls.Element;
    import TextBox = controls.TextBox;
    import DropDownList = controls.DropDownList;
    import ServerPagedDataSource = controls.ServerPagedDataSource;
    import PartialResultSet = catdv.PartialResultSet;

    import $catdv = catdv.RestApi;
    import LogEntry = catdv.LogEntry;
    import Group = catdv.Group;
    import DateUtil = catdv.DateUtil;

    import ServerSettings = logic.ServerSettings;

    import NavbarLoginMenu = ui.panels.NavbarLoginMenu;

    export class AuditLogForm
    {
        private logEntryTable: DataTable;
        private navbarLoginMenu = new NavbarLoginMenu("navbarLoginMenu");

        private selectPeriod = new DropDownList("selectPeriod");
        private selectCategory = new DropDownList("selectCategory");
        private txtSearch = new TextBox("txtSearch");

        private viewExtendedDetailsDialog = new ViewExtendedDetailsDialog("viewExtendedDetailsDialog");

        constructor()
        {
            this.selectPeriod.setSelectedValue("hour");
            this.selectCategory.setSelectedValue("-1");

            var columns = [
                {
                    title: "Time",
                    dataProp: "time",
                    isSortable: true,
                    width: 130,
                    renderer: (obj: any, val: any) =>
                    {
                        return DateUtil.format(new Date(val), "YYYY-MM-DD HH:mm:ss");
                    }
                },
                {
                    title: "User",
                    dataProp: "logUser",
                    renderer: (obj: any, val: any) =>
                    {
                        return obj.logUser + " (" + obj.logHost + ")";
                    }
                },
                {
                    title: "Action",
                    dataProp: "action",
                    renderer: (obj: any, val: any) =>
                    {
                        return "[" + obj.type + "] " + obj.action
                    }
                },
                {
                    title: "Summary",
                    dataProp: "details"
                },
                {
                    title: "Num Clips",
                    dataProp: "numClips"
                }
            ];

            if (ServerSettings.isPegasusServer)
            {
                columns.push({
                    title: "Details",
                    dataProp: "ID",
                    renderer: (obj: any, val: any) =>
                    {
                        return obj.data ? "<a href='javascript:$page.viewLogEntryData(" + obj.time + ")'>View</a>" : "";
                    }
                });
            }

            this.logEntryTable = new DataTable("logEntryTable", {
                columns: columns,
                pagedDataSource: new ServerPagedDataSource((params, callback: (resultSet: PartialResultSet<LogEntry>) => void) =>
                {
                    var filter = this.txtSearch.getText();
                    if (filter)
                    {
                        params["filter"] = filter;
                    }
                    var category = Number(this.selectCategory.getSelectedValue());
                    if (category >= 0)
                    {
                        params["type"] = category;
                    }
                    var when = Number(this.selectPeriod.getSelectedValue());
                    if (when > 0)
                    {
                        params["minTime"] = new Date().getTime() - (when * 60 * 60 * 1000);
                    }
                    if (!params["sortBy"])
                    {
                        params["sortBy"] = "time";
                        params["sortDir"] = "DESC";
                    }
                    $catdv.getLogEntries(params, (resultSet: PartialResultSet<LogEntry>) =>
                    {
                        callback(resultSet);
                    });
                })
            });

            this.txtSearch.onChanged((evt) => this.logEntryTable.reload());
            this.selectCategory.onChanged((evt) => this.logEntryTable.reload());
            this.selectPeriod.onChanged((evt) => this.logEntryTable.reload());
        }

        viewLogEntryData(auditLogTime: number)
        {
            var selectedAuditLog = this.logEntryTable.findItem((o) => { return o.time == auditLogTime });
            this.viewExtendedDetailsDialog.setLogEntry(selectedAuditLog);
            this.viewExtendedDetailsDialog.show();
        }
    }

    class ViewExtendedDetailsDialog extends controls.Modal
    {
        private lstDetails: Element = new Element("lstDetails");

        private auditLogID: number;

        constructor(elementId: string)
        {
            super(elementId);
        }

        public setLogEntry(logEntry: any)
        {
            this.lstDetails.$element.empty();

            var data = logEntry.data;
            this.lstDetails.$element.html(this.dumpProperties(data));
        }

        private dumpProperties(obj): string
        {
            var html = "<div><dl class='dl-horizontal'>";
            for (var property in obj)
            {
                if (obj.hasOwnProperty(property))
                {
                    var value = obj[property];
                    if (value instanceof Object)
                    {
                        html += "<dt style='clear: none;'>" + property + ":</dt><dd>" + this.dumpProperties(value) + "</dd>\n";
                    }
                    else
                    {
                        html += "<dt style='clear: none;'>" + property + ":</dt><dd>" + value + "</dd>\n";
                    }
                }
            }
            html += "</dl></div>";
            return html;
        }
    }
}

