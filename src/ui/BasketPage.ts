module ui
{
    import HtmlUtil = util.HtmlUtil;
    import Button = controls.Button;
    import Label = controls.Label;
    import TextBox = controls.TextBox;
    import Modal = controls.Modal;
    import MessageBox = controls.MessageBox;
    import DropDownList = controls.DropDownList;
    import DataTable = controls.DataTable;
    import SelectionMode = controls.SelectionMode;
    import SimpleServerDataSource = controls.SimpleServerDataSource;
    import SequencePlayer = controls.SequencePlayer;
    import SeqItemInfo = controls.SeqItemInfo;
    

    import $catdv = catdv.RestApi;
    import Clip = catdv.Clip;
    import ClipBasketItem = catdv.ClipBasketItem;
    import ClipBasketAction = catdv.ClipBasketAction;
    import ClipList = catdv.ClipList;
    import CommandResults = catdv.CommandResults;
    import PartialResultSet = catdv.PartialResultSet;

    import PlayerControls = panels.PlayerControls;

    import ServerPluginManager = logic.ServerCommandManager;
    import ServerSettings = logic.ServerSettings;

    export class BasketPage
    {
        private basketItemsTable: DataTable;
        private btnDone = new Button("btnDone");
        private btnEmpty = new Button("btnEmpty");
        private btnMoveUp = new Button("btnMoveUp");
        private btnMoveDown = new Button("btnMoveDown");
        private btnSave = new Button("btnSave");
        private btnPlay = new Button("btnPlay");
        private btnDownload = new Button("btnDownload");

        private currentBasketItems: ClipBasketItem[] = [];

        private saveAsClipListDialog: SaveAsClipListDialog;
        private previewBasketClipsDialog: PreviewBasketClipsDialog;

        constructor()
        {
            this.basketItemsTable = new DataTable("basketItemsTable", {

                selectionMode: SelectionMode.Multi,

                columns: [
                    {
                        title: "Clip",
                        dataProp: "posterID",
                        width: 72,
                        renderer: (obj: any, val: any) =>
                        {
                            return val ? "<img src='" + $catdv.getApiUrl("thumbnails/" + val + "?width=64&height=48&fmt=png") + "'>" : "";
                        }
                    },
                    {
                        title: "Title",
                        dataProp: "clipName",
                        renderer: (obj: any, val: any) =>
                        {
                            return "<a href='clip-details.jsp?id=" + obj.clipID + "'>" + HtmlUtil.escapeHtml(obj.clipName) + "</a>";
                        }
                    },
                    {
                        title: "Remove",
                        dataProp: "clipID",
                        renderer: (obj: any, val: any) =>
                        {
                            return "<a href='javascript:$page.remove_item(" + val + ")'>Remove</a>";
                        }
                    }
                ],

                simpleDataSource: new SimpleServerDataSource((params : any, callback: (Array) => void) =>
                {
                    $catdv.getBasketItems((basketItems: ClipBasketItem[]) =>
                    {
                        this.currentBasketItems = basketItems;
                        if (this.currentBasketItems.length > 0)
                        {
                            $("button.basket-action").removeAttr("disabled");
                        }
                        else
                        {
                            $("button.basket-action").attr("disabled", "disabled");
                        }
                        callback(basketItems);
                    });
                })
            });

            this.btnDone.onClick((evt) => 
            {
                if (document.referrer.contains("catdv/clip-details.jsp?id="))
                {
                    document.location.href = document.referrer;
                }
                else
                {
                    document.location.href = "default.jsp";
                }
            });

            this.btnEmpty.onClick((evt) => 
            {
                MessageBox.confirm("Are you sure you want to remove all items?", () =>
                {
                    $catdv.removeFromBasket(this.currentBasketItems.map((item) => item.clipID), (result) =>
                    {
                        this.basketItemsTable.reload();
                    });
                });
            });

            this.btnMoveUp.onClick((evt) =>
            {
                var selectedItem: ClipBasketItem = this.basketItemsTable.getSelectedItem();
                var selectedIndex = this.currentBasketItems.indexOf(selectedItem);
                if (selectedIndex > 0)
                {
                    var itemAbove = this.currentBasketItems[selectedIndex - 1];

                    var tmp = itemAbove.pos;
                    itemAbove.pos = selectedItem.pos;
                    selectedItem.pos = tmp;

                    $catdv.updateBasketItems([itemAbove, selectedItem], () => 
                    {
                        this.basketItemsTable.reload(0, () =>
                        {
                            this.basketItemsTable.setSelection([selectedIndex - 1]);
                        });
                    });
                }
            });

            this.btnMoveDown.onClick((evt) =>
            {
                var selectedItem: ClipBasketItem = this.basketItemsTable.getSelectedItem();
                var selectedIndex = this.currentBasketItems.indexOf(selectedItem);
                if (selectedIndex < (this.currentBasketItems.length - 1))
                {
                    var itemBelow = this.currentBasketItems[selectedIndex + 1];

                    var tmp = itemBelow.pos;
                    itemBelow.pos = selectedItem.pos;
                    selectedItem.pos = tmp;

                    $catdv.updateBasketItems([selectedItem, itemBelow], () => 
                    {
                        this.basketItemsTable.reload(0, () =>
                        {
                            this.basketItemsTable.setSelection([selectedIndex + 1]);
                        });
                    });
                }
            });

            this.saveAsClipListDialog = new SaveAsClipListDialog("saveAsClipListDialog");
            this.saveAsClipListDialog.onOK((clipList: ClipList) =>
            {
                var clipIDs = this.currentBasketItems.map((item) => item.clipID);
                clipList.clipIDs = clipIDs;
                $catdv.saveClipList(clipList, (clipListID) => 
                {
                    $catdv.removeFromBasket(clipIDs, (result) =>
                    {
                        $.cookie("catdv_clipQuery", JSON.stringify({
                            title: catdv.settings.clipListAlias + ": " + clipList.name,
                            clipList: {
                                ID: clipListID,
                                name: clipList.name
                            }
                        }))

                        document.location.href = "default.jsp";
                    });
                });
            });

            this.btnSave.onClick((evt) =>
            {
                this.saveAsClipListDialog.show();
            });

            this.previewBasketClipsDialog = new PreviewBasketClipsDialog("previewBasketClipsDialog");

            this.btnPlay.onClick((evt) =>
            {
                this.previewBasketClipsDialog.show();
                this.previewBasketClipsDialog.setClipIDs(this.currentBasketItems.map((item) => item.clipID));
            });

            this.btnDownload.onClick((evt) =>
            {
                document.location.href = $catdv.getApiUrl("media/basket");
            });

            $catdv.getBasketActions((basketActions) =>
            {
                this.show_basketActions(basketActions);
            });
        }

        private show_basketActions(basketActions)
        {
            if ((basketActions != null) && (basketActions.length > 0))
            {
                basketActions.forEach((action, i) =>
                {
                    $(document.createTextNode("  ")).appendTo("footer");
                    var $button = $("<button id='btnAction" + i + "' class='btn btn-primary basket-action' disabled></button>").appendTo("footer");
                    $button.click((evt) => this.doBasketAction(action));
                    if (action.icon)
                    {
                        $("<span class='glyphicon glyphicon-" + action.icon + "'></span>").appendTo($button);
                    }
                    $(document.createTextNode(" " + action.name)).appendTo($button);
                    if (this.currentBasketItems && this.currentBasketItems.length > 0)
                    {
                        $button.removeAttr("disabled");
                    }
                });
            }
        }

        public doBasketAction(action: ClipBasketAction)
        {
            var clipsIDs = this.currentBasketItems.map((item) => item.clipID);
            ServerPluginManager.performCommand(action.serverCommand, clipsIDs, (result: CommandResults) =>
            {
                $catdv.removeFromBasket(result.clipIDs, () => 
                {
                    document.location.href = "default.jsp";
                });
            });
        }

        public remove_item(clipId)
        {
            $catdv.removeFromBasket([clipId], (result) =>
            {
                this.basketItemsTable.reload();
            });
        }
    }

    class SaveAsClipListDialog extends Modal
    {
        private lblClipListName = new Label("lblClipListName");
        private txtClipListName = new TextBox("txtClipListName");
        private listGroups = new DropDownList("selectClipListGroup");
        private btnClipListDialogOK = new Button("btnClipListDialogOK");

        constructor(element: any)
        {
            super(element);

            this.txtClipListName.onInput((evt) => this.lblClipListName.setText("Clip List: " + this.txtClipListName.getText()));

            this.btnClipListDialogOK.onClick((evt) =>
            {
                var clipList: ClipList = {
                    name: this.txtClipListName.getText(),
                    groupID: Number(this.listGroups.getSelectedValue())
                };
                this.close(true, clipList);
            });
        }
    }

    class PreviewBasketClipsDialog extends Modal
    {
        private sequencePlayer = new SequencePlayer("previewClipsDialog_sequencePlayer");
        private playerControls = new PlayerControls("previewClipsDialog_playerControls", { MarkInOut: false, CreateMarkers: false, CreateSubClip: false, FullScreen: true });
        private btnClose = new Button("previewClipsDialog_btnClose");

        constructor(element: any)
        {
            super(element);

            this.btnClose.onClick((evt) =>
            {
                this.sequencePlayer.stop();
                this.close(false);
            });
        }

        public setClipIDs(clipIDs: number[])
        {
            var params = {
                query: "((clip.id)isoneof(" + clipIDs.join(",") + "))"
            };
            $catdv.getClips(params, (resultSet: PartialResultSet<Clip>) =>
            { 
                // Clips won't necessarily come back from server in same order as they are in the basket, so sort them
                var clips: Clip[] = [];
                resultSet.items.forEach((clip) =>
                {
                    clips[clipIDs.indexOf(clip.ID)] = clip;
                });
                
                // Assume all slip share timecode format
                var tcFmt = clips[0]["in"].fmt;
                
                // Need to create a dummy clip that represents the whole clip list
 
                var duration = 0.0;
                clips.forEach((clip) =>
                {
                    duration += clip.duration.secs;
                });

                var dummyClip: Clip = {
                    "in": { fmt: tcFmt, secs: 0.0 },
                    "out": { fmt: tcFmt, secs: duration },
                    "duration": { fmt: tcFmt, secs: duration }
                };

                this.playerControls.setClipAndPlayer(dummyClip, this.sequencePlayer);

                var seqItems: SeqItemInfo[] = clips.map((clip) =>
                {
                    return {
                        url: $catdv.getApiUrl("media/" + clip.sourceMediaID + "/clip.mov"),
                        clipIn: clip["in"].secs - clip.mediaStart.secs,
                        clipOut: clip["out"].secs - clip.mediaStart.secs,
                        aspectRatio: clip.media.aspectRatio
                    };
                });

                (<SequencePlayer>this.sequencePlayer).openSequence(seqItems, ServerSettings.useQuickTime, () =>
                {
                    this.sequencePlayer.play();
                });
            });
        }
    }

}
