var ui;
(function (ui) {
    var monitor;
    (function (monitor) {
        var $catdv = catdv.RestApi;
        var DashboardForm = (function () {
            function DashboardForm() {
                var _this = this;
                this.$serverIdent = $("#serverIdent");
                this.$statusInfoList = $("#statusInfoList");
                this.$databaseInfoList = $("#databaseInfoList");
                $catdv.getInfo(null, function (info) {
                    _this.$serverIdent.text(info["version"] + " (" + info["status"] + ")");
                    _this.$statusInfoList.text(info["details"]);
                });
                $catdv.getInfo("database", function (info) {
                    _this.$databaseInfoList.text(info);
                });
            }
            return DashboardForm;
        }());
        monitor.DashboardForm = DashboardForm;
    })(monitor = ui.monitor || (ui.monitor = {}));
})(ui || (ui = {}));
