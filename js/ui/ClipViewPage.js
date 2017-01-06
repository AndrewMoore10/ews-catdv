var ui;
(function (ui) {
    var Label = controls.Label;
    var Button = controls.Button;
    var ClipMediaPanel = ui.panels.ClipMediaPanel;
    var EventMarkersPanel = ui.panels.EventMarkersPanel;
    var SingleClipDetailsPanel = ui.panels.SingleClipDetailsPanel;
    var PlayerControls = ui.panels.PlayerControls;
    var NavbarLoginMenu = ui.panels.NavbarLoginMenu;
    var $catdv = catdv.RestApi;
    var ServerSettings = logic.ServerSettings;
    var ClipViewPage = (function () {
        function ClipViewPage() {
            var _this = this;
            this.clipHeading = new Label("clipHeading");
            this.navbarLoginMenu = new NavbarLoginMenu("navbarLoginMenu");
            this.btnDownload = new Button("btnDownload");
            this.clipMediaPanel = null;
            this.playerControls = null;
            this.eventMarkersPanel = null;
            this.clipDetailsPanel = null;
            this.clip = null;
            var clipUID = $.urlParam("uid");
            this.playerControls = new PlayerControls("playerControls", { MarkInOut: false, CreateMarkers: false, CreateSubClip: false, FullScreen: false });
            this.clipMediaPanel = new ClipMediaPanel("clipMediaPanel", this.playerControls);
            this.eventMarkersPanel = new EventMarkersPanel("eventMarkersPanel");
            this.clipDetailsPanel = new SingleClipDetailsPanel("clipDetailsPanel");
            this.clipDetailsPanel.setViewingSharedLink(true);
            $catdv.getClip(clipUID, function (clip) {
                _this.clip = clip;
                _this.clipHeading.setText(clip.name);
                _this.clipMediaPanel.setClip(clip, clipUID);
                _this.eventMarkersPanel.setClip(clip);
                _this.eventMarkersPanel.setEditable(false);
                _this.clipDetailsPanel.setClip(clip, clipUID, false);
            }, function (status, error) {
                _this.clipHeading.setText(error);
            });
            this.playerControls.onAddMarker(function (evt) {
                _this.eventMarkersPanel.addMarker(_this.clipMediaPanel.getCurrentTime(), evt.markerType);
            });
            this.eventMarkersPanel.onMovetimeChanged(function (movieTime) {
                _this.clipMediaPanel.setCurrentTime(movieTime);
            });
            this.eventMarkersPanel.onTimelineSelectionChanged(function (markIn, markOut) {
                _this.clipMediaPanel.setSelection(markIn, markOut);
            });
            this.btnDownload.onClick(function (evt) {
                document.location.href = ServerSettings.sharedLinkDownloadUrl;
            });
        }
        return ClipViewPage;
    }());
    ui.ClipViewPage = ClipViewPage;
})(ui || (ui = {}));
