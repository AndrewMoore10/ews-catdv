var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var ui;
(function (ui) {
    var HtmlUtil = util.HtmlUtil;
    var Button = controls.Button;
    var Label = controls.Label;
    var TextBox = controls.TextBox;
    var Modal = controls.Modal;
    var MessageBox = controls.MessageBox;
    var DropDownList = controls.DropDownList;
    var DataTable = controls.DataTable;
    var SelectionMode = controls.SelectionMode;
    var SimpleServerDataSource = controls.SimpleServerDataSource;
    var SequencePlayer = controls.SequencePlayer;
    var $catdv = catdv.RestApi;
    var PlayerControls = ui.panels.PlayerControls;
    var ServerPluginManager = logic.ServerCommandManager;
    var ServerSettings = logic.ServerSettings;
    var BasketPage = (function () {
        function BasketPage() {
            var _this = this;
            this.btnDone = new Button("btnDone");
            this.btnEmpty = new Button("btnEmpty");
            this.btnMoveUp = new Button("btnMoveUp");
            this.btnMoveDown = new Button("btnMoveDown");
            this.btnSave = new Button("btnSave");
            this.btnPlay = new Button("btnPlay");
            this.btnDownload = new Button("btnDownload");
            this.currentBasketItems = [];
            this.basketItemsTable = new DataTable("basketItemsTable", {
                selectionMode: SelectionMode.Multi,
                columns: [
                    {
                        title: "Clip",
                        dataProp: "posterID",
                        width: 72,
                        renderer: function (obj, val) {
                            return val ? "<img src='" + $catdv.getApiUrl("thumbnails/" + val + "?width=64&height=48&fmt=png") + "'>" : "";
                        }
                    },
                    {
                        title: "Title",
                        dataProp: "clipName",
                        renderer: function (obj, val) {
                            return "<a href='clip-details.jsp?id=" + obj.clipID + "'>" + HtmlUtil.escapeHtml(obj.clipName) + "</a>";
                        }
                    },
                    {
                        title: "Remove",
                        dataProp: "clipID",
                        renderer: function (obj, val) {
                            return "<a href='javascript:$page.remove_item(" + val + ")'>Remove</a>";
                        }
                    }
                ],
                simpleDataSource: new SimpleServerDataSource(function (params, callback) {
                    $catdv.getBasketItems(function (basketItems) {
                        _this.currentBasketItems = basketItems;
                        if (_this.currentBasketItems.length > 0) {
                            $("button.basket-action").removeAttr("disabled");
                        }
                        else {
                            $("button.basket-action").attr("disabled", "disabled");
                        }
                        callback(basketItems);
                    });
                })
            });
            this.btnDone.onClick(function (evt) {
                if (document.referrer.contains("catdv/clip-details.jsp?id=")) {
                    document.location.href = document.referrer;
                }
                else {
                    document.location.href = "default.jsp";
                }
            });
            this.btnEmpty.onClick(function (evt) {
                MessageBox.confirm("Are you sure you want to remove all items?", function () {
                    $catdv.removeFromBasket(_this.currentBasketItems.map(function (item) { return item.clipID; }), function (result) {
                        _this.basketItemsTable.reload();
                    });
                });
            });
            this.btnMoveUp.onClick(function (evt) {
                var selectedItem = _this.basketItemsTable.getSelectedItem();
                var selectedIndex = _this.currentBasketItems.indexOf(selectedItem);
                if (selectedIndex > 0) {
                    var itemAbove = _this.currentBasketItems[selectedIndex - 1];
                    var tmp = itemAbove.pos;
                    itemAbove.pos = selectedItem.pos;
                    selectedItem.pos = tmp;
                    $catdv.updateBasketItems([itemAbove, selectedItem], function () {
                        _this.basketItemsTable.reload(0, function () {
                            _this.basketItemsTable.setSelection([selectedIndex - 1]);
                        });
                    });
                }
            });
            this.btnMoveDown.onClick(function (evt) {
                var selectedItem = _this.basketItemsTable.getSelectedItem();
                var selectedIndex = _this.currentBasketItems.indexOf(selectedItem);
                if (selectedIndex < (_this.currentBasketItems.length - 1)) {
                    var itemBelow = _this.currentBasketItems[selectedIndex + 1];
                    var tmp = itemBelow.pos;
                    itemBelow.pos = selectedItem.pos;
                    selectedItem.pos = tmp;
                    $catdv.updateBasketItems([selectedItem, itemBelow], function () {
                        _this.basketItemsTable.reload(0, function () {
                            _this.basketItemsTable.setSelection([selectedIndex + 1]);
                        });
                    });
                }
            });
            this.saveAsClipListDialog = new SaveAsClipListDialog("saveAsClipListDialog");
            this.saveAsClipListDialog.onOK(function (clipList) {
                var clipIDs = _this.currentBasketItems.map(function (item) { return item.clipID; });
                clipList.clipIDs = clipIDs;
                $catdv.saveClipList(clipList, function (clipListID) {
                    $catdv.removeFromBasket(clipIDs, function (result) {
                        $.cookie("catdv_clipQuery", JSON.stringify({
                            title: catdv.settings.clipListAlias + ": " + clipList.name,
                            clipList: {
                                ID: clipListID,
                                name: clipList.name
                            }
                        }));
                        document.location.href = "default.jsp";
                    });
                });
            });
            this.btnSave.onClick(function (evt) {
                _this.saveAsClipListDialog.show();
            });
            this.previewBasketClipsDialog = new PreviewBasketClipsDialog("previewBasketClipsDialog");
            this.btnPlay.onClick(function (evt) {
                _this.previewBasketClipsDialog.show();
                _this.previewBasketClipsDialog.setClipIDs(_this.currentBasketItems.map(function (item) { return item.clipID; }));
            });
            this.btnDownload.onClick(function (evt) {
                document.location.href = $catdv.getApiUrl("media/basket");
            });
            $catdv.getBasketActions(function (basketActions) {
                _this.show_basketActions(basketActions);
            });
        }
        BasketPage.prototype.show_basketActions = function (basketActions) {
            var _this = this;
            if ((basketActions != null) && (basketActions.length > 0)) {
                basketActions.forEach(function (action, i) {
                    $(document.createTextNode("  ")).appendTo("footer");
                    var $button = $("<button id='btnAction" + i + "' class='btn btn-primary basket-action' disabled></button>").appendTo("footer");
                    $button.click(function (evt) { return _this.doBasketAction(action); });
                    if (action.icon) {
                        $("<span class='glyphicon glyphicon-" + action.icon + "'></span>").appendTo($button);
                    }
                    $(document.createTextNode(" " + action.name)).appendTo($button);
                    if (_this.currentBasketItems && _this.currentBasketItems.length > 0) {
                        $button.removeAttr("disabled");
                    }
                });
            }
        };
        BasketPage.prototype.doBasketAction = function (action) {
            var clipsIDs = this.currentBasketItems.map(function (item) { return item.clipID; });
            ServerPluginManager.performCommand(action.serverCommand, clipsIDs, function (result) {
                $catdv.removeFromBasket(result.clipIDs, function () {
                    document.location.href = "default.jsp";
                });
            });
        };
        BasketPage.prototype.remove_item = function (clipId) {
            var _this = this;
            $catdv.removeFromBasket([clipId], function (result) {
                _this.basketItemsTable.reload();
            });
        };
        return BasketPage;
    }());
    ui.BasketPage = BasketPage;
    var SaveAsClipListDialog = (function (_super) {
        __extends(SaveAsClipListDialog, _super);
        function SaveAsClipListDialog(element) {
            var _this = this;
            _super.call(this, element);
            this.lblClipListName = new Label("lblClipListName");
            this.txtClipListName = new TextBox("txtClipListName");
            this.listGroups = new DropDownList("selectClipListGroup");
            this.btnClipListDialogOK = new Button("btnClipListDialogOK");
            this.txtClipListName.onInput(function (evt) { return _this.lblClipListName.setText("Clip List: " + _this.txtClipListName.getText()); });
            this.btnClipListDialogOK.onClick(function (evt) {
                var clipList = {
                    name: _this.txtClipListName.getText(),
                    groupID: Number(_this.listGroups.getSelectedValue())
                };
                _this.close(true, clipList);
            });
        }
        return SaveAsClipListDialog;
    }(Modal));
    var PreviewBasketClipsDialog = (function (_super) {
        __extends(PreviewBasketClipsDialog, _super);
        function PreviewBasketClipsDialog(element) {
            var _this = this;
            _super.call(this, element);
            this.sequencePlayer = new SequencePlayer("previewClipsDialog_sequencePlayer");
            this.playerControls = new PlayerControls("previewClipsDialog_playerControls", { MarkInOut: false, CreateMarkers: false, CreateSubClip: false, FullScreen: true });
            this.btnClose = new Button("previewClipsDialog_btnClose");
            this.btnClose.onClick(function (evt) {
                _this.sequencePlayer.stop();
                _this.close(false);
            });
        }
        PreviewBasketClipsDialog.prototype.setClipIDs = function (clipIDs) {
            var _this = this;
            var params = {
                query: "((clip.id)isoneof(" + clipIDs.join(",") + "))"
            };
            $catdv.getClips(params, function (resultSet) {
                // Clips won't necessarily come back from server in same order as they are in the basket, so sort them
                var clips = [];
                resultSet.items.forEach(function (clip) {
                    clips[clipIDs.indexOf(clip.ID)] = clip;
                });
                // Assume all slip share timecode format
                var tcFmt = clips[0]["in"].fmt;
                // Need to create a dummy clip that represents the whole clip list
                var duration = 0.0;
                clips.forEach(function (clip) {
                    duration += clip.duration.secs;
                });
                var dummyClip = {
                    "in": { fmt: tcFmt, secs: 0.0 },
                    "out": { fmt: tcFmt, secs: duration },
                    "duration": { fmt: tcFmt, secs: duration }
                };
                _this.playerControls.setClipAndPlayer(dummyClip, _this.sequencePlayer);
                var seqItems = clips.map(function (clip) {
                    return {
                        url: $catdv.getApiUrl("media/" + clip.sourceMediaID + "/clip.mov"),
                        clipIn: clip["in"].secs - clip.mediaStart.secs,
                        clipOut: clip["out"].secs - clip.mediaStart.secs,
                        aspectRatio: clip.media.aspectRatio
                    };
                });
                _this.sequencePlayer.openSequence(seqItems, ServerSettings.useQuickTime, function () {
                    _this.sequencePlayer.play();
                });
            });
        };
        return PreviewBasketClipsDialog;
    }(Modal));
})(ui || (ui = {}));
