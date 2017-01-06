var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var ui;
(function (ui) {
    var Label = controls.Label;
    var Button = controls.Button;
    var RadioButton = controls.RadioButton;
    var RadioButtonSet = controls.RadioButtonSet;
    var HyperLink = controls.HyperLink;
    var Modal = controls.Modal;
    var TextBox = controls.TextBox;
    var DropDownList = controls.DropDownList;
    var MessageBox = controls.MessageBox;
    var ClipMediaPanel = ui.panels.ClipMediaPanel;
    var EventMarkersPanel = ui.panels.EventMarkersPanel;
    var SingleClipDetailsPanel = ui.panels.SingleClipDetailsPanel;
    var MultiClipDetailsPanel = ui.panels.MultiClipDetailsPanel;
    var PlayerControls = ui.panels.PlayerControls;
    var NavbarLoginMenu = ui.panels.NavbarLoginMenu;
    var MultiClipPreviewPanel = ui.panels.MultiClipPreviewPanel;
    var $catdv = catdv.RestApi;
    var ServerSettings = logic.ServerSettings;
    var ClipManager = logic.ClipManager;
    var SaveContext = logic.SaveContext;
    var ServerCommandMenu = logic.ServerCommandMenu;
    var ServerPluginManager = logic.ServerCommandManager;
    var ClipDetailsPage = (function () {
        function ClipDetailsPage() {
            var _this = this;
            this.clipHeading = new Label("clipHeading");
            this.navbarLoginMenu = new NavbarLoginMenu("navbarLoginMenu");
            this.serverCommandMenu = new ServerCommandMenu("menuServerCommands");
            this.clipMediaPanel = null;
            this.playerControls = null;
            this.eventMarkersPanel = null;
            this.clipDetailsPanel = null;
            this.previewPanel = null;
            this.btnShareClip = new Button("btnShareClip");
            this.editSeqBtn = new Button("editSeqBtn");
            this.btnDownload = new Button("btnDownload");
            this.btnAddToBasket = new Button("btnAddToBasket");
            this.clipSaveBtn = new Button("clipSaveBtn");
            this.clipCancelBtn = new Button("clipCancelBtn");
            this.clipCloseBtn = new Button("clipCloseBtn");
            this.createSubclipDialog = new CreateSubclipDialog("createSubclipDialog");
            this.createSharedLinkDialog = new CreateSharedLinkDialog("createSharedLinkDialog");
            this.viewSharedLinkDialog = new ViewSharedLinkDialog("viewSharedLinkDialog");
            this.clip = null;
            this.clips = null;
            var clipIdParam = $.urlParam("id");
            var clipIdsParam = $.urlParam("ids");
            // Editing one clip
            if (clipIdParam != null) {
                var clipID = Number(clipIdParam);
                this.playerControls = new PlayerControls("playerControls", { MarkInOut: false, CreateMarkers: false, CreateSubClip: false, FullScreen: true });
                this.clipMediaPanel = new ClipMediaPanel("clipMediaPanel", this.playerControls);
                this.eventMarkersPanel = new EventMarkersPanel("eventMarkersPanel");
                this.clipDetailsPanel = new SingleClipDetailsPanel("clipDetailsPanel");
                this.loadClip(clipID);
                this.editSeqBtn.onClick(function (evt) {
                    _this.setDirty(true);
                    document.location.href = "seq-edit.jsp?id=" + clipID;
                });
                this.btnDownload.onClick(function (evt) {
                    var downloadUrl = ClipManager.getDownloadUrl(_this.clip, ServerSettings.canDownloadOriginals, ServerSettings.canDownloadsProxies);
                    if (downloadUrl) {
                        document.location.href = downloadUrl;
                    }
                });
                this.btnAddToBasket.onClick(function (evt) {
                    $("#clipMediaPanel").effect("transfer", { to: "#btnClipBasket", className: "ui-effects-transfer" }, 600);
                    $catdv.addToBasket([clipID], function (result) {
                        _this.updateNumBasketItems(result.items.length);
                    });
                });
                this.btnShareClip.onClick(function (evt) {
                    _this.createSharedLinkDialog.show();
                });
                this.createSharedLinkDialog.onOK(function (linkInfo) {
                    var sharedLink = {
                        clipID: _this.clip.ID,
                        assetName: _this.clip.name,
                        validityPeriod: linkInfo.validityPeriod,
                        mediaType: linkInfo.mediaType,
                        sharedWith: linkInfo.sharedWith,
                        notes: linkInfo.notes
                    };
                    $catdv.createSharedLink(sharedLink, function (sharedLink) {
                        _this.viewSharedLinkDialog.setSharedLink(sharedLink);
                        _this.viewSharedLinkDialog.show();
                    });
                });
                this.serverCommandMenu.onClick(function (serverCommand) {
                    ServerPluginManager.performCommand(serverCommand, [_this.clip.ID], function (result) {
                        _this.loadClip(_this.clip.ID);
                    });
                });
                this.playerControls.onAddMarker(function (evt) {
                    _this.eventMarkersPanel.addMarker(_this.clipMediaPanel.getCurrentTime(), evt.markerType);
                });
                this.playerControls.onSetMarkIn(function (evt) {
                    _this.clipDetailsPanel.updateUI();
                });
                this.playerControls.onSetMarkOut(function (evt) {
                    _this.clipDetailsPanel.updateUI();
                });
                this.playerControls.onCreateSubclip(function (evt) {
                    _this.createSubclipDialog.onOK(function (name, notes) {
                        _this.setDirty(true);
                        ClipManager.createSubclip(name, notes, _this.clip, function (savedSubclip) {
                            document.location.href = "clip-details.jsp?id=" + savedSubclip.ID;
                        });
                    });
                    _this.createSubclipDialog.show();
                });
                this.eventMarkersPanel.onMovetimeChanged(function (movieTime) {
                    _this.clipMediaPanel.setCurrentTime(movieTime);
                });
                this.eventMarkersPanel.onTimelineSelectionChanged(function (markIn, markOut) {
                    _this.clipMediaPanel.setSelection(markIn, markOut);
                });
            }
            else if (clipIdsParam != null) {
                var clipIds = JSON.parse(clipIdsParam);
                this.clipDetailsPanel = new MultiClipDetailsPanel("clipDetailsPanel");
                this.clipHeading.setText("Editing " + clipIds.length + " clips");
                // Can't download multiple clips - for now
                this.btnDownload.setEnabled(false);
                $catdv.getClips({ filter: "and((clip.id)isOneOf(" + clipIds.join(",") + "))", include: "userFields" }, function (resultSet) {
                    _this.clips = resultSet.items;
                    _this.clipDetailsPanel.setClips(_this.clips);
                    _this.previewPanel = new MultiClipPreviewPanel("clipMediaPanel", _this.clips);
                    _this.clipCancelBtn.show();
                    _this.clipSaveBtn.show();
                    _this.btnShareClip.hide();
                    _this.btnAddToBasket.hide();
                });
            }
            this.clipSaveBtn.onClick(function (evt) { return _this.clipSaveBtn_onclick(evt); });
            this.clipCancelBtn.onClick(function (evt) { return _this.clipCancelBtn_onclick(evt); });
            this.clipCloseBtn.onClick(function (evt) { return _this.clipCancelBtn_onclick(evt); });
            $catdv.getNumBasketItems(function (numBasketItems) { return _this.updateNumBasketItems(numBasketItems); });
        }
        ClipDetailsPage.prototype.loadClip = function (clipID) {
            var _this = this;
            $catdv.getClip(clipID, function (clip) {
                _this.clip = clip;
                _this.clipHeading.setText(clip.name);
                _this.clipMediaPanel.setClip(clip);
                _this.eventMarkersPanel.setClip(clip);
                _this.clipDetailsPanel.setClip(clip);
                _this.editSeqBtn.show(_this.clip.type == "seq");
                _this.setDirty(false);
                if (clip.isEditable) {
                    _this.clipCancelBtn.show();
                    _this.clipSaveBtn.show();
                    _this.clipDetailsPanel.onChanged(function (evt) {
                        window.onbeforeunload = function (evt) {
                            var retVal = "Unsaved changes. Are you sure you want to leave this page?";
                            evt.returnValue = retVal;
                            return retVal;
                        };
                    });
                }
                else {
                    _this.clipCloseBtn.show();
                }
                window.onbeforeunload = null;
                _this.btnDownload.setEnabled(_this.clip.media
                    && ((_this.clip.media.filePath && ServerSettings.canDownloadOriginals)
                        || (_this.clip.media.proxyPath && ServerSettings.canDownloadsProxies)));
                // TODO: probably no need to read-only mode any more - so this could become unnecessary
                _this.eventMarkersPanel.setEditable(true);
            });
        };
        ClipDetailsPage.prototype.clipSaveBtn_onclick = function (evt) {
            var notSet = this.clipDetailsPanel.checkMandatoryFields();
            if (notSet) {
                MessageBox.showMessage("Cannot save clip. Mandatory fields (including '" + notSet + "') are not set", "Mandatory Field Not Set");
                return;
            }
            this.clipDetailsPanel.updateModel();
            this.setDirty(true);
            window.onbeforeunload = null;
            if (this.clip) {
                ClipManager.prepareForSaving(this.clip, SaveContext.SingleClip);
                $catdv.saveClip(this.clip, function (clip) {
                    document.location.href = "default.jsp";
                });
            }
            else if (this.clips) {
                this.clips.forEach(function (clip) { return ClipManager.prepareForSaving(clip, SaveContext.MultiClip); });
                $catdv.saveClips(this.clips, function (n) {
                    document.location.href = "default.jsp";
                });
            }
        };
        ClipDetailsPage.prototype.updateNumBasketItems = function (numBasketItems) {
            $("#numBasketItemsBadge").text(numBasketItems > 0 ? String(numBasketItems) : "");
        };
        ClipDetailsPage.prototype.setDirty = function (dirty) {
            // useCache cookie is used by ClipList page to determine if it is ok to use cached results
            // Initially we assume it is ok, but if anything on this page changes the clip, or calls
            // another pag that might change the clip then assume the clip is dirty and turn off cache cookie
            // forcing the clip list page to reload the data.
            $.cookie("catdv_useCache", String(!dirty));
        };
        ClipDetailsPage.prototype.clipCancelBtn_onclick = function (evt) {
            window.onbeforeunload = null;
            document.location.href = "default.jsp";
        };
        return ClipDetailsPage;
    }());
    ui.ClipDetailsPage = ClipDetailsPage;
    var CreateSubclipDialog = (function (_super) {
        __extends(CreateSubclipDialog, _super);
        function CreateSubclipDialog(element) {
            var _this = this;
            _super.call(this, element);
            this.txtSubclipName = new TextBox("txtSubclipName");
            this.txtSubclipNotes = new TextBox("txtSubclipNotes");
            this.btnCreateSubclipDialogOK = new Button("btnCreateSubclipDialogOK");
            this.btnCreateSubclipDialogOK.onClick(function (evt) {
                if (!_this.txtSubclipName.getText()) {
                    alert("Name required");
                }
                else {
                    _this.close(true, _this.txtSubclipName.getText());
                }
            });
        }
        return CreateSubclipDialog;
    }(Modal));
    var CreateSharedLinkDialog = (function (_super) {
        __extends(CreateSharedLinkDialog, _super);
        function CreateSharedLinkDialog(element) {
            var _this = this;
            _super.call(this, element);
            this.txtShareWith = new TextBox("txtShareWith");
            this.selectExpiryPeriod = new DropDownList("selectExpiryPeriod");
            this.txtNotes = new TextBox("txtSharedLinkNotes");
            this.rdoDownloadOriginalMedia = new RadioButton("rdoDownloadOriginalMedia");
            this.rdoDownloadProxyMedia = new RadioButton("rdoDownloadProxyMedia");
            this.btnCreateSharedLinkDialogOK = new Button("btnCreateSharedLinkDialogOK");
            this.rdoDownloadMediaType = new RadioButtonSet([this.rdoDownloadOriginalMedia, this.rdoDownloadProxyMedia], ["orig", "proxy"], "downloadMediaType");
            if (!ServerSettings.canDownloadOriginals) {
                this.rdoDownloadMediaType.setEnabled(false);
                this.rdoDownloadMediaType.setValue("proxy");
            }
            this.btnCreateSharedLinkDialogOK.onClick(function (evt) {
                if (!_this.txtShareWith.getText()) {
                    alert("Shared with required");
                }
                else {
                    _this.close(true, {
                        mediaType: _this.rdoDownloadOriginalMedia.isSelected() ? "orig" : "proxy",
                        sharedWith: _this.txtShareWith.getText(),
                        validityPeriod: _this.selectExpiryPeriod.getSelectedValue(),
                        notes: _this.txtNotes.getText(),
                    });
                }
            });
        }
        return CreateSharedLinkDialog;
    }(Modal));
    var ViewSharedLinkDialog = (function (_super) {
        __extends(ViewSharedLinkDialog, _super);
        function ViewSharedLinkDialog(element) {
            _super.call(this, element);
            this.txtViewClipUrl = new Label("txtViewClipUrl");
            this.txtDownloadUrl = new Label("txtDownloadUrl");
            this.lnkEmailLinks = new HyperLink("lnkEmailLinks");
        }
        ViewSharedLinkDialog.prototype.setSharedLink = function (sharedLink) {
            this.txtViewClipUrl.setText(sharedLink.viewUrl);
            this.txtDownloadUrl.setText(sharedLink.downloadUrl);
            var message = sharedLink.notes + "\n\n"
                + "'" + sharedLink.assetName + "'\n"
                + "View Clip: " + sharedLink.viewUrl + "\n"
                + "Download Clip: " + sharedLink.downloadUrl + "\n";
            this.lnkEmailLinks.setHREF("mailto:" + sharedLink.sharedWith
                + "?subject=" + encodeURIComponent(sharedLink.assetName)
                + "&body=" + encodeURIComponent(message));
            this.lnkEmailLinks.setText("mailto:" + sharedLink.sharedWith);
        };
        return ViewSharedLinkDialog;
    }(Modal));
})(ui || (ui = {}));
