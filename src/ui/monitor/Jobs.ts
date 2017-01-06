module ui.monitor
{
    import HtmlUtil = util.HtmlUtil;
    import DataTable = controls.DataTable;
    import Element = controls.Element;
    import Button = controls.Button;
    import TextBox = controls.TextBox;
    import DropDownList = controls.DropDownList;
    import CheckBox = controls.CheckBox;
    import RadioButton = controls.RadioButton;
    import ListBox = controls.ListBox;
    import Label = controls.Label;
    import CheckList = controls.CheckList;
    import ListItem = controls.ListItem;
    import ServerPagedDataSource = controls.ServerPagedDataSource;
    import SimpleServerDataSource = controls.SimpleServerDataSource;
    import SimpleDataSourceParams = controls.SimpleDataSourceParams;
    import PartialResultSet = catdv.PartialResultSet;

    import $catdv = catdv.RestApi;
    import Job = catdv.Job;
    import JobResult = catdv.JobResult;
    import Group = catdv.Group;
    import DateUtil = catdv.DateUtil;

    import NavbarLoginMenu = ui.panels.NavbarLoginMenu;

    export class JobsForm
    {
        private jobsTable: DataTable;
        private navbarLoginMenu = new NavbarLoginMenu("navbarLoginMenu");

        private viewJobDialog = new ViewJobDialog("viewJobDialog");

        constructor()
        {
            this.jobsTable = new DataTable("jobsTable", {
                columns: [
                    {
                        title: "Job",
                        dataProp: "description",
                        renderer: (obj: any, val: any) =>
                        {
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
                        renderer: (obj: any, val: any) =>
                        {
                            return DateUtil.format(new Date(val), "YYYY-MM-DD HH:mm:ss");
                        }
                    },
                    {
                        title: "Last Modified Date",
                        dataProp: "lastModifiedDate",
                        isSortable: true,
                        renderer: (obj: any, val: any) =>
                        {
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
                pagedDataSource: new ServerPagedDataSource((params, callback: (resultSet: PartialResultSet<Job>) => void) =>
                {
                    $catdv.getJobs(params,(resultSet: PartialResultSet<Job>) =>
                    {
                        callback(resultSet);
                    });
                })
            });
        }

        public viewJob(jobID: number)
        {
            this.viewJobDialog.setJob(jobID);
            this.viewJobDialog.onOK(() =>
            {
                this.jobsTable.reload();
            });
            this.viewJobDialog.show();
        }
    }

    class ViewJobDialog extends controls.Modal
    {
        private txtJobDescription = new TextBox("txtJobDescription");
        private divJobData = new Element("divJobData");
        private tableJobResults: DataTable;
        private btnNewJobOK = new Button("btnEditJobOK");

        private job: Job;

        constructor(elementId: string)
        {
            super(elementId);
            
            this.tableJobResults = new DataTable("tableJobResults", {
                topAlignRows: true,
                columns: [
                      {
                        title: "Date",
                        dataProp: "createdDate",
                        isSortable: true,
                        width: 120,
                        renderer: (obj: any, val: any) =>
                        {
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
                        renderer: (obj: any, val: any) =>
                        {
                            return val ? "<span class='glyphicon glyphicon-ok'> </span>" : "<span class='glyphicon glyphicon-remove'> </span>";
                        }
                    }
                ],
                                
                simpleDataSource: new SimpleServerDataSource<JobResult>((params: SimpleDataSourceParams, callback: (results: JobResult[]) => void) =>
                {
                    if (this.job)
                    {
                        $catdv.getJobResults(this.job.ID, params, (results: JobResult[]) =>
                        {
                            callback(results);
                        });
                    }
                    else
                    {
                        callback([]);
                    }
                })
            });

            this.btnNewJobOK.onClick((evt: any) =>
            {
                this.btnOK_onClick(evt);
            });
        }

        public setJob(jobID: number)
        {
            $catdv.getJob(jobID,(job: Job) =>
            {
                this.job = job;
                this.txtJobDescription.setText(job.description);
                this.divJobData.$element.html(job.formattedData ? job.formattedData : (job.data ? "<pre>" + JSON.stringify(job.data) + "</pre>" : ""));
                this.tableJobResults.reload();
            });
        }

        private btnOK_onClick(evt: any)
        {
            this.close(true);
        }
    }
}

