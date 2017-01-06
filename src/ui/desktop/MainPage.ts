module ui.desktop
{
    import $catdv = catdv.RestApi;
    import Clip = catdv.Clip;
    import QueryDefinition = catdv.QueryDefinition;
    import ClipQuery = catdv.ClipQuery;

    import Element = controls.Element;
    import Label = controls.Label;
    import Button = controls.Button;
    import TextBox = controls.TextBox;
    import Modal = controls.Modal;
    import HSplitter = controls.HSplitter;
    import VSplitter = controls.VSplitter;
    import SelectionMode = controls.SelectionMode;

    import ServerSettings = logic.ServerSettings;
    import TypeIconColumn = logic.TypeIconColumn;
    import ClipManager = logic.ClipManager;
    import SaveContext = logic.SaveContext;

    import ClipsPanel = ui.panels.ClipsPanel;
    import TreeNavigatorPanel = ui.desktop.TreeNavigatorPanel;
    import ViewControls = ui.panels.ViewControls;
    import ClipMediaPanel = ui.panels.ClipMediaPanel;
    import ClipDetailsPanel = ui.panels.ClipDetailsPanel;
    import PlayerControls = ui.panels.PlayerControls;
    import SingleClipDetailsPanel = ui.panels.SingleClipDetailsPanel;
    import QueryBuilder = ui.panels.QueryBuilderPanel;

    export class MainPage
    {
        private static PLAYER_CONTROLS_EDITABLE = { MarkInOut: true, CreateMarkers: false, CreateSubClip: false, FullScreen: false };
        private static PLAYER_CONTROLS_READONLY = { MarkInOut: false, CreateMarkers: false, CreateSubClip: false, FullScreen: false };

        private horizSplitter = new HSplitter("hSplitter", 20);
        private vertSplitter = new VSplitter("vSplitter", 40);

        private txtSearch = new TextBox("txtSearch");
        private btnQuery = new Button("btnQuery");
        private btnRefresh = new Button("btnRefresh");
        private loginMenu = new ToolbarLoginMenu("loginMenu");

        private btnEditClip = new Button("btnEditClip");
        private btnCancelEdit = new Button("btnCancelEdit");
        private btnSaveClip = new Button("btnSaveClip");

        private viewControls: ViewControls = null;
        private treeNavigator: TreeNavigatorPanel = null;
        private clipsPanel: ClipsPanel = null;

        private clipViewSplitter = new HSplitter("clipViewSplitter", 50);
        private clipMediaPanel: ClipMediaPanel = null;
        private playerControls: PlayerControls = null;
        private clipDetailsPanel: SingleClipDetailsPanel = null;
        private queryDialog: QueryDialog = null;

        private currentClip: Clip = null;

        constructor()
        {
            // Desktop interface runs in a subfolder so patch relative path to iimages
            TypeIconColumn.CLIP_TYPE_IMAGE_PATH = "../img";

            this.clipsPanel = new ClipsPanel("clipListPanel", null, "ui.desktop.MainPage");
            this.clipsPanel.setSelectionMode(SelectionMode.Single);
            this.viewControls = new ViewControls("viewControls", this.clipsPanel, null);
            this.clipsPanel.onSelectionChanged((evt) =>
            {
                var selectedClip = evt.selectedItems.length > 0 ? evt.selectedItems[0] : null; // hack
                if (selectedClip)
                {
                    $catdv.getClip(selectedClip.ID, (clip) => 
                    {
                        this.currentClip = clip;
                        this.clipMediaPanel.setClip(clip);
                        this.clipDetailsPanel.setClip(clip, null, false);
                        this.playerControls.setOptions(MainPage.PLAYER_CONTROLS_READONLY);
                    });
                }
            });

            this.treeNavigator = new TreeNavigatorPanel("navigatorPanel");
            this.treeNavigator.onNavigationChanged((evt) => this.clipsPanel.setClipQuery(evt.clipQuery));

            this.playerControls = new PlayerControls("playerControls", { MarkInOut: false, CreateMarkers: false, CreateSubClip: false, FullScreen: false });
            this.clipMediaPanel = new ClipMediaPanel("clipMediaPanel", this.playerControls);
            this.clipDetailsPanel = new SingleClipDetailsPanel("clipDetailsPanel");

            this.queryDialog = new QueryDialog("queryDialog");
            this.queryDialog.onOK(() =>
            {
                this.clipsPanel.setClipQuery({ title: "Query Results", queryDef: this.queryDialog.getQuery() });
            });

            this.txtSearch.onInput((evt) =>
            {
                var searchText = this.txtSearch.getText();
                if ((searchText.length == 0) || (searchText.length > 2))
                {
                    var query: ClipQuery = { title: "Clips matching '" + searchText + "'", queryDef: { terms: [{ field: "logtext", op: "has", params: searchText }] } };
                    this.clipsPanel.setClipQuery(query);
                }
            });

            this.btnQuery.onClick((evt) =>
            {
                this.queryDialog.show();
            });

            this.btnRefresh.onClick((evt) => 
            {
                this.treeNavigator.refresh();
            });

            this.btnEditClip.onClick((evt) => 
            {
                this.clipDetailsPanel.setEditable(true);
                this.playerControls.setOptions(MainPage.PLAYER_CONTROLS_EDITABLE);
                //                    this.eventMarkersPanel.setEditable(true);
                this.btnEditClip.hide();
                this.btnCancelEdit.show();
                this.btnSaveClip.show();
            });

            this.btnCancelEdit.onClick((evt) => 
            {
                this.clipDetailsPanel.setEditable(false);
                this.playerControls.setOptions(MainPage.PLAYER_CONTROLS_READONLY);
                //                    this.eventMarkersPanel.setEditable(false);
                this.clipDetailsPanel.updateUI();
                this.btnEditClip.show();
                this.btnCancelEdit.hide();
                this.btnSaveClip.hide();
            });

            this.btnSaveClip.onClick((evt) => 
            {
                this.clipDetailsPanel.updateModel();
                this.clipDetailsPanel.setEditable(false);
                this.playerControls.setOptions(MainPage.PLAYER_CONTROLS_READONLY);
                //                    this.eventMarkersPanel.setEditable(false);
                ClipManager.prepareForSaving(this.currentClip, SaveContext.SingleClip);
                $catdv.saveClip(this.currentClip, () =>
                {
                    this.btnEditClip.show();
                    this.btnCancelEdit.hide();
                    this.btnSaveClip.hide();
                });
            });
        }
    }

    class QueryDialog extends Modal 
    {
        private lblQueryDialogTitle = new Label("lblQueryDialogTitle");
        private btnQueryDialogOK = new Button("btnQueryDialogOK");
        private queryBuilder = new QueryBuilder("queryBuilder");

        constructor(element: any)
        {
            super(element);

            this.lblQueryDialogTitle.setText("Advanced Search");

            this.btnQueryDialogOK.onClick((evt) =>
            {
                this.close(true);
            });
        }

        public getQuery(): QueryDefinition
        {
            return this.queryBuilder.getQuery();
        }
    }

    export class ToolbarLoginMenu extends Element
    {
        // element is empty <ul> in Bootrap-style NavBar 
        constructor(element)
        {
            super(element);

            this.$element.html("<span id='loggedInUser'></span><b>&nbsp;|&nbsp;</b>"
                + "<a id='loginLink' href='#'>log in</a>"
                + "<a id='logoutLink' href='#' style='display: none'>log out</a>");

            $("#loginLink").on("click", (evt) => { window.location.href = 'login.jsp'; });
            $("#logoutLink").on("click", (evt) =>
            {
                $.cookie("username", null);
                catdv.loggedInUser = null;
                $catdv.logout(function(reply)
                {
                    window.location.reload();
                });
            });


            if (catdv.loggedInUser)
            {
                $("#loggedInUser").text(catdv.loggedInUser);
                $("#loginLink").hide();
                $("#logoutLink").show();
            }
            else
            {
                $("#loginLink").show();
                $("#logoutLink").hide();
            }
        }
    }
}