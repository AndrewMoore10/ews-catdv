var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var ui;
(function (ui) {
    var desktop;
    (function (desktop) {
        var $catdv = catdv.RestApi;
        var Element = controls.Element;
        var Label = controls.Label;
        var Button = controls.Button;
        var TextBox = controls.TextBox;
        var Modal = controls.Modal;
        var HSplitter = controls.HSplitter;
        var VSplitter = controls.VSplitter;
        var SelectionMode = controls.SelectionMode;
        var TypeIconColumn = logic.TypeIconColumn;
        var ClipManager = logic.ClipManager;
        var SaveContext = logic.SaveContext;
        var ClipsPanel = ui.panels.ClipsPanel;
        var TreeNavigatorPanel = ui.desktop.TreeNavigatorPanel;
        var ViewControls = ui.panels.ViewControls;
        var ClipMediaPanel = ui.panels.ClipMediaPanel;
        var PlayerControls = ui.panels.PlayerControls;
        var SingleClipDetailsPanel = ui.panels.SingleClipDetailsPanel;
        var QueryBuilder = ui.panels.QueryBuilderPanel;
        var MainPage = (function () {
            function MainPage() {
                var _this = this;
                this.horizSplitter = new HSplitter("hSplitter", 20);
                this.vertSplitter = new VSplitter("vSplitter", 40);
                this.txtSearch = new TextBox("txtSearch");
                this.btnQuery = new Button("btnQuery");
                this.btnRefresh = new Button("btnRefresh");
                this.loginMenu = new ToolbarLoginMenu("loginMenu");
                this.btnEditClip = new Button("btnEditClip");
                this.btnCancelEdit = new Button("btnCancelEdit");
                this.btnSaveClip = new Button("btnSaveClip");
                this.viewControls = null;
                this.treeNavigator = null;
                this.clipsPanel = null;
                this.clipViewSplitter = new HSplitter("clipViewSplitter", 50);
                this.clipMediaPanel = null;
                this.playerControls = null;
                this.clipDetailsPanel = null;
                this.queryDialog = null;
                this.currentClip = null;
                // Desktop interface runs in a subfolder so patch relative path to iimages
                TypeIconColumn.CLIP_TYPE_IMAGE_PATH = "../img";
                this.clipsPanel = new ClipsPanel("clipListPanel", null, "ui.desktop.MainPage");
                this.clipsPanel.setSelectionMode(SelectionMode.Single);
                this.viewControls = new ViewControls("viewControls", this.clipsPanel, null);
                this.clipsPanel.onSelectionChanged(function (evt) {
                    var selectedClip = evt.selectedItems.length > 0 ? evt.selectedItems[0] : null; // hack
                    if (selectedClip) {
                        $catdv.getClip(selectedClip.ID, function (clip) {
                            _this.currentClip = clip;
                            _this.clipMediaPanel.setClip(clip);
                            _this.clipDetailsPanel.setClip(clip, null, false);
                            _this.playerControls.setOptions(MainPage.PLAYER_CONTROLS_READONLY);
                        });
                    }
                });
                this.treeNavigator = new TreeNavigatorPanel("navigatorPanel");
                this.treeNavigator.onNavigationChanged(function (evt) { return _this.clipsPanel.setClipQuery(evt.clipQuery); });
                this.playerControls = new PlayerControls("playerControls", { MarkInOut: false, CreateMarkers: false, CreateSubClip: false, FullScreen: false });
                this.clipMediaPanel = new ClipMediaPanel("clipMediaPanel", this.playerControls);
                this.clipDetailsPanel = new SingleClipDetailsPanel("clipDetailsPanel");
                this.queryDialog = new QueryDialog("queryDialog");
                this.queryDialog.onOK(function () {
                    _this.clipsPanel.setClipQuery({ title: "Query Results", queryDef: _this.queryDialog.getQuery() });
                });
                this.txtSearch.onInput(function (evt) {
                    var searchText = _this.txtSearch.getText();
                    if ((searchText.length == 0) || (searchText.length > 2)) {
                        var query = { title: "Clips matching '" + searchText + "'", queryDef: { terms: [{ field: "logtext", op: "has", params: searchText }] } };
                        _this.clipsPanel.setClipQuery(query);
                    }
                });
                this.btnQuery.onClick(function (evt) {
                    _this.queryDialog.show();
                });
                this.btnRefresh.onClick(function (evt) {
                    _this.treeNavigator.refresh();
                });
                this.btnEditClip.onClick(function (evt) {
                    _this.clipDetailsPanel.setEditable(true);
                    _this.playerControls.setOptions(MainPage.PLAYER_CONTROLS_EDITABLE);
                    //                    this.eventMarkersPanel.setEditable(true);
                    _this.btnEditClip.hide();
                    _this.btnCancelEdit.show();
                    _this.btnSaveClip.show();
                });
                this.btnCancelEdit.onClick(function (evt) {
                    _this.clipDetailsPanel.setEditable(false);
                    _this.playerControls.setOptions(MainPage.PLAYER_CONTROLS_READONLY);
                    //                    this.eventMarkersPanel.setEditable(false);
                    _this.clipDetailsPanel.updateUI();
                    _this.btnEditClip.show();
                    _this.btnCancelEdit.hide();
                    _this.btnSaveClip.hide();
                });
                this.btnSaveClip.onClick(function (evt) {
                    _this.clipDetailsPanel.updateModel();
                    _this.clipDetailsPanel.setEditable(false);
                    _this.playerControls.setOptions(MainPage.PLAYER_CONTROLS_READONLY);
                    //                    this.eventMarkersPanel.setEditable(false);
                    ClipManager.prepareForSaving(_this.currentClip, SaveContext.SingleClip);
                    $catdv.saveClip(_this.currentClip, function () {
                        _this.btnEditClip.show();
                        _this.btnCancelEdit.hide();
                        _this.btnSaveClip.hide();
                    });
                });
            }
            MainPage.PLAYER_CONTROLS_EDITABLE = { MarkInOut: true, CreateMarkers: false, CreateSubClip: false, FullScreen: false };
            MainPage.PLAYER_CONTROLS_READONLY = { MarkInOut: false, CreateMarkers: false, CreateSubClip: false, FullScreen: false };
            return MainPage;
        }());
        desktop.MainPage = MainPage;
        var QueryDialog = (function (_super) {
            __extends(QueryDialog, _super);
            function QueryDialog(element) {
                var _this = this;
                _super.call(this, element);
                this.lblQueryDialogTitle = new Label("lblQueryDialogTitle");
                this.btnQueryDialogOK = new Button("btnQueryDialogOK");
                this.queryBuilder = new QueryBuilder("queryBuilder");
                this.lblQueryDialogTitle.setText("Advanced Search");
                this.btnQueryDialogOK.onClick(function (evt) {
                    _this.close(true);
                });
            }
            QueryDialog.prototype.getQuery = function () {
                return this.queryBuilder.getQuery();
            };
            return QueryDialog;
        }(Modal));
        var ToolbarLoginMenu = (function (_super) {
            __extends(ToolbarLoginMenu, _super);
            // element is empty <ul> in Bootrap-style NavBar 
            function ToolbarLoginMenu(element) {
                _super.call(this, element);
                this.$element.html("<span id='loggedInUser'></span><b>&nbsp;|&nbsp;</b>"
                    + "<a id='loginLink' href='#'>log in</a>"
                    + "<a id='logoutLink' href='#' style='display: none'>log out</a>");
                $("#loginLink").on("click", function (evt) { window.location.href = 'login.jsp'; });
                $("#logoutLink").on("click", function (evt) {
                    $.cookie("username", null);
                    catdv.loggedInUser = null;
                    $catdv.logout(function (reply) {
                        window.location.reload();
                    });
                });
                if (catdv.loggedInUser) {
                    $("#loggedInUser").text(catdv.loggedInUser);
                    $("#loginLink").hide();
                    $("#logoutLink").show();
                }
                else {
                    $("#loginLink").show();
                    $("#logoutLink").hide();
                }
            }
            return ToolbarLoginMenu;
        }(Element));
        desktop.ToolbarLoginMenu = ToolbarLoginMenu;
    })(desktop = ui.desktop || (ui.desktop = {}));
})(ui || (ui = {}));
