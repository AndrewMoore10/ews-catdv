var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var ui;
(function (ui) {
    var monitor;
    (function (monitor) {
        var DataTable = controls.DataTable;
        var Element = controls.Element;
        var TextBox = controls.TextBox;
        var DropDownList = controls.DropDownList;
        var ServerPagedDataSource = controls.ServerPagedDataSource;
        var $catdv = catdv.RestApi;
        var DateUtil = catdv.DateUtil;
        var ServerSettings = logic.ServerSettings;
        var NavbarLoginMenu = ui.panels.NavbarLoginMenu;
        var AuditLogForm = (function () {
            function AuditLogForm() {
                var _this = this;
                this.navbarLoginMenu = new NavbarLoginMenu("navbarLoginMenu");
                this.selectPeriod = new DropDownList("selectPeriod");
                this.selectCategory = new DropDownList("selectCategory");
                this.txtSearch = new TextBox("txtSearch");
                this.viewExtendedDetailsDialog = new ViewExtendedDetailsDialog("viewExtendedDetailsDialog");
                this.selectPeriod.setSelectedValue("hour");
                this.selectCategory.setSelectedValue("-1");
                var columns = [
                    {
                        title: "Time",
                        dataProp: "time",
                        isSortable: true,
                        width: 130,
                        renderer: function (obj, val) {
                            return DateUtil.format(new Date(val), "YYYY-MM-DD HH:mm:ss");
                        }
                    },
                    {
                        title: "User",
                        dataProp: "logUser",
                        renderer: function (obj, val) {
                            return obj.logUser + " (" + obj.logHost + ")";
                        }
                    },
                    {
                        title: "Action",
                        dataProp: "action",
                        renderer: function (obj, val) {
                            return "[" + obj.type + "] " + obj.action;
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
                if (ServerSettings.isPegasusServer) {
                    columns.push({
                        title: "Details",
                        dataProp: "ID",
                        renderer: function (obj, val) {
                            return obj.data ? "<a href='javascript:$page.viewLogEntryData(" + obj.time + ")'>View</a>" : "";
                        }
                    });
                }
                this.logEntryTable = new DataTable("logEntryTable", {
                    columns: columns,
                    pagedDataSource: new ServerPagedDataSource(function (params, callback) {
                        var filter = _this.txtSearch.getText();
                        if (filter) {
                            params["filter"] = filter;
                        }
                        var category = Number(_this.selectCategory.getSelectedValue());
                        if (category >= 0) {
                            params["type"] = category;
                        }
                        var when = Number(_this.selectPeriod.getSelectedValue());
                        if (when > 0) {
                            params["minTime"] = new Date().getTime() - (when * 60 * 60 * 1000);
                        }
                        if (!params["sortBy"]) {
                            params["sortBy"] = "time";
                            params["sortDir"] = "DESC";
                        }
                        $catdv.getLogEntries(params, function (resultSet) {
                            callback(resultSet);
                        });
                    })
                });
                this.txtSearch.onChanged(function (evt) { return _this.logEntryTable.reload(); });
                this.selectCategory.onChanged(function (evt) { return _this.logEntryTable.reload(); });
                this.selectPeriod.onChanged(function (evt) { return _this.logEntryTable.reload(); });
            }
            AuditLogForm.prototype.viewLogEntryData = function (auditLogTime) {
                var selectedAuditLog = this.logEntryTable.findItem(function (o) { return o.time == auditLogTime; });
                this.viewExtendedDetailsDialog.setLogEntry(selectedAuditLog);
                this.viewExtendedDetailsDialog.show();
            };
            return AuditLogForm;
        }());
        monitor.AuditLogForm = AuditLogForm;
        var ViewExtendedDetailsDialog = (function (_super) {
            __extends(ViewExtendedDetailsDialog, _super);
            function ViewExtendedDetailsDialog(elementId) {
                _super.call(this, elementId);
                this.lstDetails = new Element("lstDetails");
            }
            ViewExtendedDetailsDialog.prototype.setLogEntry = function (logEntry) {
                this.lstDetails.$element.empty();
                var data = logEntry.data;
                this.lstDetails.$element.html(this.dumpProperties(data));
            };
            ViewExtendedDetailsDialog.prototype.dumpProperties = function (obj) {
                var html = "<div><dl class='dl-horizontal'>";
                for (var property in obj) {
                    if (obj.hasOwnProperty(property)) {
                        var value = obj[property];
                        if (value instanceof Object) {
                            html += "<dt style='clear: none;'>" + property + ":</dt><dd>" + this.dumpProperties(value) + "</dd>\n";
                        }
                        else {
                            html += "<dt style='clear: none;'>" + property + ":</dt><dd>" + value + "</dd>\n";
                        }
                    }
                }
                html += "</dl></div>";
                return html;
            };
            return ViewExtendedDetailsDialog;
        }(controls.Modal));
    })(monitor = ui.monitor || (ui.monitor = {}));
})(ui || (ui = {}));
