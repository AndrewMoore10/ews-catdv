var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var ui;
(function (ui) {
    var $catdv = catdv.RestApi;
    var TextBox = controls.TextBox;
    var Button = controls.Button;
    var RadioButton = controls.RadioButton;
    var RadioButtonSet = controls.RadioButtonSet;
    var TreeView = controls.TreeView;
    var Label = controls.Label;
    var Modal = controls.Modal;
    var MessageBox = controls.MessageBox;
    var Platform = util.Platform;
    var HtmlUtil = util.HtmlUtil;
    var ClipManager = logic.ClipManager;
    var ServerPluginManager = logic.ServerCommandManager;
    var ServerCommandMenu = logic.ServerCommandMenu;
    var Config = logic.Config;
    var NavigatorPanel = ui.panels.NavigatorPanel;
    var ClipsPanel = ui.panels.ClipsPanel;
    var ViewControls = ui.panels.ViewControls;
    var NavbarLoginMenu = ui.panels.NavbarLoginMenu;
    var TreeBuilder = ui.panels.TreeBuilder;
    var SearchPage = (function () {
        function SearchPage() {
            var _this = this;
            this.btnFileUpload = new Button("btnFileUpload");
            this.btnSelectMode = new Button("btnSelectMode");
            this.btnSelectAll = new Button("btnSelectAll");
            this.btnCancelSelect = new Button("btnCancelSelect");
            this.btnAddToBasket = new Button("btnAddToBasket");
            this.btnAddToList = new Button("btnAddToList");
            this.btnEditClips = new Button("btnEditClips");
            this.btnCreateSequence = new Button("btnCreateSequence");
            this.btnDeleteClip = new Button("btnDeleteClip");
            this.btnRemoveClip = new Button("btnRemoveClip");
            this.btnFCPExport = new Button("btnFCPExport");
            this.serverCommandMenu = new ServerCommandMenu("menuServerCommands");
            this.navbarLoginMenu = new NavbarLoginMenu("navbarLoginMenu");
            this.lblListTitle = new Label("listTitle");
            this.viewControls = null;
            this.clipsPanel = null;
            this.navigator = null;
            this.currentQuery = null;
            this.createSequenceDialog = new CreateSequenceDialog("createSequenceDialog");
            this.addToClipListDialog = new AddToClipListDialog("addToClipListDialog");
            this.clipsPanel = new ClipsPanel("clipListPanel", Config.viewClipUrl, "ui.SearchPage");
            this.viewControls = new ViewControls("viewControls", this.clipsPanel, Config.viewClipUrl);
            this.navigator = new NavigatorPanel("navigatorPanel", this.clipsPanel);
            this.clipsPanel.onQueryChanged(function (clipQuery) {
                _this.currentQuery = clipQuery;
                var isClipListQuery = (clipQuery.clipList != null);
                _this.btnRemoveClip.show(isClipListQuery);
                _this.btnDeleteClip.show(!isClipListQuery);
                _this.setListTitle(clipQuery.title, clipQuery.cached);
            });
            this.clipsPanel.onSelectModeChanged(function (evt) {
                _this.btnSelectMode.show(!evt.selectMode);
                _this.btnCancelSelect.show(evt.selectMode);
                _this.btnSelectAll.show(evt.selectMode);
            });
            this.navigator.onNavigationChanged(function (evt) {
                _this.clipsPanel.setClipQuery(evt.clipQuery);
            });
            this.btnFileUpload.onClick(function (evt) {
                if (Platform.isOldIE()) {
                    window.open("simpleUpload.jsp", "Upload", "width=400,height=350");
                }
                else {
                    window.open("http://mastercatrss.ad.ewsad.net/rss/newItem");
                    // window.open("uploadFiles.jsp", "Upload", "width=600,height=600");
                }
            });
            this.btnSelectMode.onClick(function (evt) {
                _this.clipsPanel.setSelectMode(true);
            });
            this.btnCancelSelect.onClick(function (evt) {
                _this.clipsPanel.setSelectMode(false);
            });
            this.btnSelectAll.onClick(function (evt) {
                _this.clipsPanel.selectAll();
            });
            this.btnAddToBasket.onClick(function (evt) {
                var selectedClips = _this.clipsPanel.getSelectedClips();
                var selectedElementIDs = _this.clipsPanel.getSelectedElementIDs();
                selectedElementIDs.forEach(function (elementID) {
                    $(elementID).effect("transfer", { to: "#btnClipBasket", className: "ui-effects-transfer" }, 600);
                });
                var clipIds = selectedClips.map(function (clip) { return clip.ID; });
                $catdv.addToBasket(clipIds, function (result) {
                    _this.updateNumBasketItems(result.items.length);
                });
                _this.clipsPanel.toggleSelectMode();
            });
            this.btnAddToList.onClick(function (evt) {
                _this.addToClipListDialog.show();
            });
            this.addToClipListDialog.onOK(function (clipListID) {
                var selectedClipIDs = _this.clipsPanel.getSelectedClips().map(function (clip) { return clip.ID; });
                var selectedElementIDs = _this.clipsPanel.getSelectedElementIDs();
                selectedElementIDs.forEach(function (elementID) {
                    $(elementID).effect("transfer", { to: "#navClipLists", className: "ui-effects-transfer" }, 600);
                });
                $catdv.addToClipList(clipListID, selectedClipIDs, function () {
                });
            });
            this.btnEditClips.onClick(function (evt) {
                var selectedClips = _this.clipsPanel.getSelectedClips();
                if (selectedClips.length > 1) {
                    document.location.href = "clip-details.jsp?ids=[" + selectedClips.map(function (clip) { return clip.ID; }).join(",") + "]";
                }
                else {
                    document.location.href = "clip-details.jsp?id=" + selectedClips[0].ID;
                }
            });
            this.btnCreateSequence.onClick(function (evt) {
                _this.createSequenceDialog.show();
            });
            this.createSequenceDialog.onOK(function (name, useSelection) {
                var selectedClips = _this.clipsPanel.getSelectedClips();
                ClipManager.createSequence(name, useSelection, selectedClips, function (savedSequence) {
                    document.location.href = "seq-edit.jsp?id=" + savedSequence.ID;
                });
            });
            this.btnDeleteClip.onClick(function (evt) {
                _this.deleteSelectedClips();
            });
            this.btnRemoveClip.onClick(function (evt) {
                var clips = _this.clipsPanel.getSelectedClips();
                var msg = "Are you sure you want to remove ";
                msg += (clips.length > 1) ? "these " + clips.length + " clips " : "'" + clips[0].name + "'";
                msg += "from clip list '" + _this.currentQuery.clipList.name + "'?";
                MessageBox.confirm(msg, function () {
                    $catdv.removeFromClipList(_this.currentQuery.clipList.ID, clips.map(function (clip) { return clip.ID; }), function () {
                        _this.clipsPanel.reload(0, false);
                    });
                });
            });
            this.btnFCPExport.onClick(function (evt) {
                ClipManager.exportFCPXML(_this.clipsPanel.getSelectedClips());
            });
            this.serverCommandMenu.onClick(function (serverCommand) {
                var selectedClipIDs = _this.clipsPanel.getSelectedClips().map(function (clip) { return clip.ID; });
                ServerPluginManager.performCommand(serverCommand, selectedClipIDs, function (result) {
                    if ((result.clipIDs != null) && (result.clipIDs.length > 0)) {
                        var clipIDs = result.clipIDs.map(function (a) { return String(a); }).reduce(function (a, b) { return a + "," + b; });
                        _this.clipsPanel.setClipQuery({
                            title: "Results:" + serverCommand.name,
                            queryDef: { terms: [{ field: "clip.id", op: "isOneOf", params: clipIDs }] }
                        });
                    }
                    else {
                        _this.clipsPanel.reload();
                    }
                });
                _this.clipsPanel.setSelectMode(false);
            });
            $catdv.getNumBasketItems(function (numBasketItems) { return _this.updateNumBasketItems(numBasketItems); });
            // Set up showing/hiding hamburger menu on resize
            $(window).resize(function (evt) { return _this.updateActionButtons(); });
            // Do initial layout
            this.updateActionButtons();
            // Collapse hamburger menu if user clicks elsewhere
            $(document).on("click", function () {
                if (!$("#action-buttons").is(".collapse")) {
                    $("#action-buttons").collapse("hide");
                }
            });
        }
        SearchPage.prototype.updateActionButtons = function () {
            var numActionButtons = $("footer ul.action-buttons li").length;
            var buttonWidth = numActionButtons * 120;
            var windowWidth = $(window).width();
            if (buttonWidth > (windowWidth - 550)) {
                $("footer").addClass("compact").removeClass("full");
                $("footer ul.action-buttons").addClass("collapse").removeClass("in");
            }
            else {
                $("footer").removeClass("compact").addClass("full");
                ;
                $("footer ul.action-buttons").removeClass("collapse");
            }
        };
        SearchPage.prototype.deleteSelectedClips = function () {
            var _this = this;
            var selectedClips = this.clipsPanel.getSelectedClips();
            if (selectedClips.length == 1) {
                var clip = selectedClips[0];
                MessageBox.confirm("Are you sure you want to delete '" + clip.name + "'?\nThis action cannot be undone.", function () {
                    $catdv.deleteClip(clip.ID, function () {
                        _this.clipsPanel.reload(0, false);
                    });
                });
            }
            else if (selectedClips.length > 1) {
                MessageBox.confirm("Are you sure you want to delete '" + selectedClips.length + "' clips?\nThis action cannot be undone.", function () {
                    var results = 0;
                    var errors = "";
                    selectedClips.forEach(function (selectedClip) {
                        $catdv.deleteClip(selectedClip.ID, function () {
                            _this.clipsPanel.reload(0, false);
                            if ((++results == selectedClips.length) && errors)
                                alert(errors);
                        }, function (status, error) {
                            errors += error + "\n";
                            if ((++results == selectedClips.length) && errors)
                                alert(errors);
                        });
                    });
                });
            }
        };
        SearchPage.prototype.setListTitle = function (listTitle, cached) {
            if (cached === void 0) { cached = false; }
            var listTitle = listTitle || "Clips";
            var colonIndex = listTitle.indexOf(":");
            if (colonIndex != -1) {
                listTitle = listTitle.substr(0, colonIndex)
                    + "<span>" + HtmlUtil.escapeHtml(listTitle.substr(colonIndex + 1)) + "</span>";
            }
            if (cached) {
                listTitle += ".";
            }
            this.lblListTitle.$element.html(listTitle);
        };
        SearchPage.prototype.updateNumBasketItems = function (numBasketItems) {
            $("#numBasketItemsBadge").text(numBasketItems > 0 ? String(numBasketItems) : "");
        };
        return SearchPage;
    }());
    ui.SearchPage = SearchPage;
    var CreateSequenceDialog = (function (_super) {
        __extends(CreateSequenceDialog, _super);
        function CreateSequenceDialog(element) {
            var _this = this;
            _super.call(this, element);
            this.txtSequenceName = new TextBox("txtSequenceName");
            this.rdoUseWholeClip = new RadioButton("rdoUseWholeClip");
            this.rdoUseSelection = new RadioButton("rdoUseSelection");
            this.btnCreateSequenceDialogOK = new Button("btnCreateSequenceDialogOK");
            this.btnCreateSequenceDialogOK.onClick(function (evt) {
                if (!_this.txtSequenceName.getText()) {
                    alert("Name required");
                }
                else {
                    _this.close(true, _this.txtSequenceName.getText(), _this.rdoUseSelection.isSelected());
                }
            });
        }
        return CreateSequenceDialog;
    }(Modal));
    var AddToClipListDialog = (function (_super) {
        __extends(AddToClipListDialog, _super);
        function AddToClipListDialog(element) {
            var _this = this;
            _super.call(this, element);
            this.rdoCreateClipList = new RadioButton("rdoCreateClipList");
            this.rdoAddToClipList = new RadioButton("rdoAddToClipList");
            this.newOrExistingClipsList = new RadioButtonSet([this.rdoCreateClipList, this.rdoAddToClipList], ["new", "existing"], "newOrExistingClipList");
            this.txtNewClipListName = new TextBox("txtNewClipListName");
            this.clipListTree = new TreeView("treeAddToClipList");
            this.btnAddToClipListDialogOK = new Button("btnAddToClipListDialogOK");
            this.newOrExistingClipsList.onChanged(function (evt) { return _this.updateControls(); });
            this.txtNewClipListName.onInput(function (evt) { return _this.updateControls(); });
            this.clipListTree.onSelectionChanged(function (evt) { return _this.updateControls(); });
            this.btnAddToClipListDialogOK.onClick(function (evt) {
                if (_this.newOrExistingClipsList.getValue() == "new") {
                    var clipList = {
                        name: _this.txtNewClipListName.getText(),
                        groupID: 0
                    };
                    $catdv.saveClipList(clipList, function (clipListID) {
                        _super.prototype.close.call(_this, true, clipListID);
                    });
                }
                else {
                    var selectedNode = _this.clipListTree.getSelectedItem();
                    if (selectedNode != null) {
                        var selectedClipList = selectedNode.value;
                        _super.prototype.close.call(_this, true, selectedClipList.ID);
                    }
                    else {
                        _super.prototype.close.call(_this, false);
                    }
                }
            });
            this.rdoCreateClipList.setSelected(true);
            this.updateControls();
        }
        AddToClipListDialog.prototype.show = function () {
            var _this = this;
            _super.prototype.show.call(this);
            $catdv.getClipLists(function (clipLists) {
                _this.clipListTree.setModel(TreeBuilder.buildTree(clipLists, "Clip Lists", false, false));
            });
        };
        AddToClipListDialog.prototype.updateControls = function () {
            if (this.newOrExistingClipsList.getValue() == "new") {
                this.txtNewClipListName.setEnabled(true);
                this.clipListTree.setEnabled(false);
                this.btnAddToClipListDialogOK.setEnabled(this.txtNewClipListName.getText().length > 0);
            }
            else {
                this.txtNewClipListName.setEnabled(false);
                this.clipListTree.setEnabled(true);
                this.btnAddToClipListDialogOK.setEnabled(this.clipListTree.getSelectedItem() != null);
            }
        };
        return AddToClipListDialog;
    }(Modal));
})(ui || (ui = {}));
