module ui.monitor
{
    import $catdv = catdv.RestApi;

    export class DashboardForm
    {
        private $serverIdent = $("#serverIdent");
        private $statusInfoList = $("#statusInfoList");
        private $databaseInfoList = $("#databaseInfoList");

        constructor()
        {
            $catdv.getInfo(null, (info) =>
            {
                this.$serverIdent.text(info["version"] + " (" + info["status"] + ")");
                this.$statusInfoList.text(info["details"]);
            });

            $catdv.getInfo("database", (info) =>
            {
                this.$databaseInfoList.text(info);
            });
        }
    }
}