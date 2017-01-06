var ui;
(function (ui) {
    var monitor;
    (function (monitor) {
        var DataTable = controls.DataTable;
        var Button = controls.Button;
        var SimpleServerDataSource = controls.SimpleServerDataSource;
        var $catdv = catdv.RestApi;
        var DateUtil = catdv.DateUtil;
        var NavbarLoginMenu = ui.panels.NavbarLoginMenu;
        var ServicesForm = (function () {
            function ServicesForm() {
                this.navbarLoginMenu = new NavbarLoginMenu("navbarLoginMenu");
                this.btnAddService = new Button("btnAddService");
                this.servicesTable = new DataTable("servicesTable", {
                    columns: [
                        {
                            title: "Service Type",
                            dataProp: "serviceType"
                        },
                        {
                            title: "Name",
                            dataProp: "name"
                        },
                        {
                            title: "Description",
                            dataProp: "description"
                        },
                        {
                            title: "Created Date",
                            dataProp: "createdDate",
                            renderer: function (obj, val) {
                                return DateUtil.format(new Date(val), "YYYY-MM-DD HH:mm:ss");
                            }
                        },
                        {
                            title: "Last Modified Date",
                            dataProp: "lastModifiedDate",
                            renderer: function (obj, val) {
                                return DateUtil.format(new Date(val), "YYYY-MM-DD HH:mm:ss");
                            }
                        },
                        {
                            title: "Status",
                            dataProp: "status"
                        },
                        {
                            title: "Status Details",
                            dataProp: "statusDetails"
                        },
                        {
                            title: "Percent Complete",
                            dataProp: "percentComplete"
                        }
                    ],
                    simpleDataSource: new SimpleServerDataSource(function (params, callback) {
                        $catdv.getServices(function (data) {
                            callback(data);
                        });
                    })
                });
            }
            return ServicesForm;
        }());
        monitor.ServicesForm = ServicesForm;
    })(monitor = ui.monitor || (ui.monitor = {}));
})(ui || (ui = {}));
