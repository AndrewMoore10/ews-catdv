var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var ui;
(function (ui) {
    var monitor;
    (function (monitor) {
        var HtmlUtil = util.HtmlUtil;
        var DataTable = controls.DataTable;
        var Element = controls.Element;
        var Button = controls.Button;
        var TextBox = controls.TextBox;
        var ServerPagedDataSource = controls.ServerPagedDataSource;
        var SimpleServerDataSource = controls.SimpleServerDataSource;
        var $catdv = catdv.RestApi;
        var DateUtil = catdv.DateUtil;
        var NavbarLoginMenu = ui.panels.NavbarLoginMenu;
        var JobsForm = (function () {
            function JobsForm() {
                this.navbarLoginMenu = new NavbarLoginMenu("navbarLoginMenu");
                this.viewJobDialog = new ViewJobDialog("viewJobDialog");
                this.jobsTable = new DataTable("jobsTable", {
                    columns: [
                        {
                            title: "Job",
                            dataProp: "description",
                            renderer: function (obj, val) {
                                return "<a href='javascript:$page.viewJob(" + obj.ID + ")' title='ID:" + obj.ID + "'>" + HtmlUtil.escapeHtml(obj.description || "Job") + "</a>";
                            }
                        },
                        {
                            title: "Job Type",
                            dataProp: "jobType",
                            isSortable: true
                        },
                        {
                            title: "User",
                            dataProp: "userName"
                        },
                        {
                            title: "Priority",
                            dataProp: "priority",
                            isSortable: true
                        },
                        {
                            title: "Created Date",
                            dataProp: "createdDate",
                            isSortable: true,
                            renderer: function (obj, val) {
                                return DateUtil.format(new Date(val), "YYYY-MM-DD HH:mm:ss");
                            }
                        },
                        {
                            title: "Last Modified Date",
                            dataProp: "lastModifiedDate",
                            isSortable: true,
                            renderer: function (obj, val) {
                                return DateUtil.format(new Date(val), "YYYY-MM-DD HH:mm:ss");
                            }
                        },
                        {
                            title: "Status",
                            dataProp: "status",
                            isSortable: true
                        },
                        {
                            title: "Percent Complete",
                            dataProp: "percentComplete"
                        }
                    ],
                    pagedDataSource: new ServerPagedDataSource(function (params, callback) {
                        $catdv.getJobs(params, function (resultSet) {
                            callback(resultSet);
                        });
                    })
                });
            }
            JobsForm.prototype.viewJob = function (jobID) {
                var _this = this;
                this.viewJobDialog.setJob(jobID);
                this.viewJobDialog.onOK(function () {
                    _this.jobsTable.reload();
                });
                this.viewJobDialog.show();
            };
            return JobsForm;
        }());
        monitor.JobsForm = JobsForm;
        var ViewJobDialog = (function (_super) {
            __extends(ViewJobDialog, _super);
            function ViewJobDialog(elementId) {
                var _this = this;
                _super.call(this, elementId);
                this.txtJobDescription = new TextBox("txtJobDescription");
                this.divJobData = new Element("divJobData");
                this.btnNewJobOK = new Button("btnEditJobOK");
                this.tableJobResults = new DataTable("tableJobResults", {
                    topAlignRows: true,
                    columns: [
                        {
                            title: "Date",
                            dataProp: "createdDate",
                            isSortable: true,
                            width: 120,
                            renderer: function (obj, val) {
                                return DateUtil.format(new Date(val), "YYYY-MM-DD HH:mm:ss");
                            }
                        },
                        {
                            title: "Details",
                            dataProp: "output",
                            isSortable: false
                        },
                        {
                            title: "Succeeded",
                            dataProp: "succeeded",
                            width: 90,
                            isSortable: true,
                            renderer: function (obj, val) {
                                return val ? "<span class='glyphicon glyphicon-ok'> </span>" : "<span class='glyphicon glyphicon-remove'> </span>";
                            }
                        }
                    ],
                    simpleDataSource: new SimpleServerDataSource(function (params, callback) {
                        if (_this.job) {
                            $catdv.getJobResults(_this.job.ID, params, function (results) {
                                callback(results);
                            });
                        }
                        else {
                            callback([]);
                        }
                    })
                });
                this.btnNewJobOK.onClick(function (evt) {
                    _this.btnOK_onClick(evt);
                });
            }
            ViewJobDialog.prototype.setJob = function (jobID) {
                var _this = this;
                $catdv.getJob(jobID, function (job) {
                    _this.job = job;
                    _this.txtJobDescription.setText(job.description);
                    _this.divJobData.$element.html(job.formattedData ? job.formattedData : (job.data ? "<pre>" + JSON.stringify(job.data) + "</pre>" : ""));
                    _this.tableJobResults.reload();
                });
            };
            ViewJobDialog.prototype.btnOK_onClick = function (evt) {
                this.close(true);
            };
            return ViewJobDialog;
        }(controls.Modal));
    })(monitor = ui.monitor || (ui.monitor = {}));
})(ui || (ui = {}));
