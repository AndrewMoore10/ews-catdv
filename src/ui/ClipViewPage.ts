module ui
{
    import Control = controls.Control;
    import Label = controls.Label;
    import Image = controls.Image;
    import Button = controls.Button;
    import Modal = controls.Modal
    import TextBox = controls.TextBox;
    import DropDownList = controls.DropDownList;
    import MessageBox = controls.MessageBox;

    import ClipMediaPanel = ui.panels.ClipMediaPanel;
    import EventMarkersPanel = ui.panels.EventMarkersPanel;
    import ClipDetailsPanel = ui.panels.ClipDetailsPanel;
    import SingleClipDetailsPanel = ui.panels.SingleClipDetailsPanel;
    import MultiClipDetailsPanel = ui.panels.MultiClipDetailsPanel;
    import PlayerControls = ui.panels.PlayerControls;
    import NavbarLoginMenu = ui.panels.NavbarLoginMenu;
    import MultiClipPreviewPanel = ui.panels.MultiClipPreviewPanel;

    import $catdv = catdv.RestApi;
    import Clip = catdv.Clip;
    import Timecode = catdv.Timecode;
    import DateUtil = catdv.DateUtil;
    import SharedLink = catdv.SharedLink;

    import ServerSettings = logic.ServerSettings;
    import ClipManager = logic.ClipManager;
    import SaveContext = logic.SaveContext;

    export class ClipViewPage
    {
        private clipHeading = new Label("clipHeading");
        private navbarLoginMenu = new NavbarLoginMenu("navbarLoginMenu");
        private btnDownload = new Button("btnDownload");

        private clipMediaPanel: ClipMediaPanel = null;
        private playerControls: PlayerControls = null;
        private eventMarkersPanel: EventMarkersPanel = null;
        private clipDetailsPanel: SingleClipDetailsPanel = null;
        
         private clip: Clip = null;

        constructor()
        {
            var clipUID = $.urlParam("uid");

            this.playerControls = new PlayerControls("playerControls", { MarkInOut: false, CreateMarkers: false, CreateSubClip: false, FullScreen: false });
            this.clipMediaPanel = new ClipMediaPanel("clipMediaPanel", this.playerControls);
            this.eventMarkersPanel = new EventMarkersPanel("eventMarkersPanel");
            this.clipDetailsPanel = new SingleClipDetailsPanel("clipDetailsPanel");
            this.clipDetailsPanel.setViewingSharedLink(true);

            $catdv.getClip(clipUID,
                (clip) =>
                {
                    this.clip = clip;
                    this.clipHeading.setText(clip.name);
                    this.clipMediaPanel.setClip(clip, clipUID);
                    this.eventMarkersPanel.setClip(clip);
                    this.eventMarkersPanel.setEditable(false);
                    this.clipDetailsPanel.setClip(clip, clipUID, false);
                },
                (status, error) =>
                {
                    this.clipHeading.setText(error);
                });

            this.playerControls.onAddMarker((evt) =>
            {
                this.eventMarkersPanel.addMarker(this.clipMediaPanel.getCurrentTime(), evt.markerType);
            });

            this.eventMarkersPanel.onMovetimeChanged((movieTime) =>
            {
                this.clipMediaPanel.setCurrentTime(movieTime);
            });
            this.eventMarkersPanel.onTimelineSelectionChanged((markIn: Timecode, markOut: Timecode) =>
            {
                this.clipMediaPanel.setSelection(markIn, markOut);
            });
            
            this.btnDownload.onClick((evt) => 
            {
                document.location.href = ServerSettings.sharedLinkDownloadUrl;
            });

        }
    }
}
