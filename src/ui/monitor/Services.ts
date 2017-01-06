module ui.monitor
{
    import DataTable = controls.DataTable;
    import Button = controls.Button;
    import TextBox = controls.TextBox;
    import DropDownList = controls.DropDownList;
    import CheckBox = controls.CheckBox;
    import RadioButton = controls.RadioButton;
    import ListBox = controls.ListBox;
    import Label = controls.Label;
    import CheckList = controls.CheckList;
    import ListItem = controls.ListItem;
    import SimpleServerDataSource = controls.SimpleServerDataSource;

    import $catdv = catdv.RestApi;
    import Service = catdv.Service;
    import Group = catdv.Group;
    import DateUtil = catdv.DateUtil;

    import NavbarLoginMenu = ui.panels.NavbarLoginMenu;

    export class ServicesForm
    {
        private servicesTable: DataTable;
        private navbarLoginMenu = new NavbarLoginMenu("navbarLoginMenu");

        private btnAddService: Button = new Button("btnAddService");

        constructor()
        {
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
                        renderer: (obj: any, val: any) =>
                        {
                            return DateUtil.format(new Date(val), "YYYY-MM-DD HH:mm:ss");
                        }
                    },
                    {
                        title: "Last Modified Date",
                        dataProp: "lastModifiedDate",
                        renderer: (obj: any, val: any) =>
                        {
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
                simpleDataSource: new SimpleServerDataSource((params : any, callback: (results: any[]) => void) =>
                {
                    $catdv.getServices(function(data)
                    {
                        callback(data);
                    });
                })
            });
        }
    }
}
