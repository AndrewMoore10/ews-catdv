module ui.admin
{
    import HtmlUtil = util.HtmlUtil;
    import Control = controls.Control;
    import DataTable = controls.DataTable;
    import Button = controls.Button;
    import TextBox = controls.TextBox;
    import TextArea = controls.TextArea;
    import Label = controls.Label;
    import DropDownList = controls.DropDownList;
    import CheckBox = controls.CheckBox;
    import ListBox = controls.ListBox;
    import Modal = controls.Modal;
    import Console = controls.Console;
    import MessageBox = controls.MessageBox;

    import $catdv = catdv.RestApi;
    import PartialResultSet = catdv.PartialResultSet;
    import MediaStore = catdv.MediaStore;
    import MediaPath = catdv.MediaPath;
    import Picklist = catdv.Picklist;
    import EnumItem = catdv.EnumItem;
    import NavbarLoginMenu = ui.panels.NavbarLoginMenu;

    export class MediaStoresForm
    {
        private mediaStoreList: MediaStoreList;

        private btnAddMediaStore: Button = new Button("btnAddMediaStore");
        private btnAddPath: Button = new Button("btnAddPath");
        private btnEdit: Button = new Button("btnEdit");
        //        private btnUp: Button = new Button("btnUp");
        //        private btnDown: Button = new Button("btnDown");
        private btnDelete: Button = new Button("btnDelete");

        private navbarLoginMenu = new NavbarLoginMenu("navbarLoginMenu");
        private editMediaStoreDialog = new EditMediaStoreDialog("editMediaStoreDialog");
        private editPathDialog = new EditPathDialog("editPathDialog");

        private mediaStoreLookup: { [mediaStoreID: number]: any } = {};

        constructor()
        {
            this.mediaStoreList = new MediaStoreList("mediaStoreList");
            this.mediaStoreList.onSelectionChanged((evt) =>
            {
                var selectedItem = this.mediaStoreList.getSelectedItem();
                var mediaStoreSelected = (selectedItem != null) && (selectedItem.mediaType == null);
                var mediaTypeSelected = (selectedItem != null) && (selectedItem.mediaType != null) && (selectedItem.mediaPath == null);
                var mediaPathSelected = (selectedItem != null) && (selectedItem.mediaPath != null);

                this.btnAddPath.setEnabled(mediaStoreSelected || mediaTypeSelected || mediaPathSelected);
                this.btnEdit.setEnabled(mediaStoreSelected || mediaPathSelected);
                //                this.btnUp.setEnabled(mediaPathSelected && !selectedItem.pathPosition.contains("F"));
                //                this.btnDown.setEnabled(mediaPathSelected && !selectedItem.pathPosition.contains("L"));
                this.btnDelete.setEnabled(mediaStoreSelected || mediaPathSelected);
            });

            this.btnAddMediaStore.onClick((evt) =>
            {
                this.editMediaStoreDialog.setMediaStore({ ID: null });
                this.editMediaStoreDialog.onOK((newMediaStore) =>
                {
                    this.mediaStoreList.loadList(() =>
                    {
                        this.mediaStoreList.setSelectedItem({
                            mediaStore: newMediaStore,
                            mediaType: null,
                            mediaPath: null,
                            pathPosition: null
                        });
                    });
                });
                this.editMediaStoreDialog.show();
            });

            this.btnAddPath.onClick((evt) =>
            {
                var selectedItem = this.mediaStoreList.getSelectedItem();

                this.editPathDialog.setMediaPath({
                    ID: null,
                    mediaStoreID: selectedItem.mediaStore.ID,
                    mediaType: selectedItem.mediaType ? selectedItem.mediaType.ID : null,
                    target: selectedItem.mediaPath ? selectedItem.mediaPath.target : null,
                    pathOrder: selectedItem.mediaStore.paths ? selectedItem.mediaStore.paths.reduce((prev, curr) => prev.pathOrder > curr.pathOrder ? prev : curr).pathOrder + 1 : 1
                });

                this.editPathDialog.onOK(() =>
                {
                    this.mediaStoreList.loadList();
                });
                this.editPathDialog.show();
            });

            this.btnEdit.onClick((evt) =>
            {
                var selectedItem = this.mediaStoreList.getSelectedItem();
                if (!selectedItem.mediaPath)
                {
                    this.editMediaStore(selectedItem.mediaStore.ID);
                }
                else
                {
                    this.editMediaPath(selectedItem.mediaPath.ID);
                }
            });

            this.btnDelete.onClick((evt) =>
            {
                var selectedItem = this.mediaStoreList.getSelectedItem();
                if (!selectedItem.mediaPath)
                {
                    this.deleteMediaStore(selectedItem.mediaStore.ID);
                }
                else
                {
                    this.deleteMediaPath(selectedItem.mediaPath.ID);
                }
            });
        }

        public editMediaStore(mediaStoreID)
        {
            var mediaStore = this.mediaStoreList.mediaStores.find((mediaStore) => mediaStore.ID == mediaStoreID);
            this.editMediaStoreDialog.setMediaStore(mediaStore);
            this.editMediaStoreDialog.onOK(() =>
            {
                this.mediaStoreList.loadList();
            });
            this.editMediaStoreDialog.show();
        }

        public deleteMediaStore(mediaStoreID)
        {
            var mediaStore = this.mediaStoreList.mediaStores.find((mediaStore) => mediaStore.ID == mediaStoreID);
            MessageBox.confirm("Are you sure you want to delete Media Store '" + mediaStore.name + "'", () =>
            {
                $catdv.deleteMediaStore(mediaStore.ID, (reply) =>
                {
                    this.mediaStoreList.loadList();
                });
            });
        }

        public editMediaPath(mediaStorePathID)
        {
            var mediaStorePath = this.mediaStoreList.mediaStorePaths.find((mediaStorePath) => mediaStorePath.ID == mediaStorePathID);
            this.editPathDialog.setMediaPath(mediaStorePath);
            this.editPathDialog.onOK(() =>
            {
                this.mediaStoreList.loadList();
            });
            this.editPathDialog.show();
        }

        public deleteMediaPath(mediaStorePathID)
        {
            var mediaStorePath = this.mediaStoreList.mediaStorePaths.find((mediaStorePath) => mediaStorePath.ID == mediaStorePathID);
            MessageBox.confirm("Are you sure you want to delete '" + mediaStorePath.path + "'", () =>
            {
                $catdv.deleteMediaPath(mediaStorePath.mediaStoreID, mediaStorePath.ID, (reply) =>
                {
                    this.mediaStoreList.loadList();
                });
            });
        }
    }

    class MediaStoreListItem
    {
        public mediaStore: MediaStore;
        public mediaType: EnumItem;
        public mediaPath: MediaPath;
        public pathPosition: string; // F - first path in type, L - last path in type (can be both)
    }

    class MediaStoreList extends Control
    {
        private selectionChangedHandler: (evt: any) => void = null;
        private selectedItem: MediaStoreListItem = null;

        private mediaTypes: EnumItem[];
        private pathTargetLookup: { [targetID: number]: string } = {};

        private isCollapsed: { [mediaStoreID: number]: boolean } = {};

        public mediaStores: MediaStore[];
        public mediaStorePaths: MediaPath[];

        // elementId of the <div> with overflow:scroll that will contain the tree
        constructor(elementId: string)
        {
            super(elementId);

            this.$element.addClass("treeView mediaStores");

            this.loadList();
        }

        public loadList(callback: () => void = null)
        {
            $catdv.getMediaStore_MediaTypes((mediaTypes: EnumItem[]) =>
            {
                this.mediaTypes = mediaTypes;
                $catdv.getMediaStore_PathTargets((pathTargets: EnumItem[]) =>
                {
                    this.pathTargetLookup = {};
                    pathTargets.forEach((pathTarget) => this.pathTargetLookup[pathTarget.ID] = pathTarget.name);

                    $catdv.getMediaStores((mediaStores: MediaStore[]) =>
                    {
                        this.mediaStores = mediaStores;
                        this.redraw();
                        if (callback) callback();
                    });
                });
            });
        }

        public redraw()
        {
            this.$element.empty();

            this.$element.html(this.buildList());

            this.$element.find("li").on("click", (evt) =>
            {
                this.onListItemClick(evt);
                evt.stopPropagation();
            });
            this.$element.find("span.expand-action").on("click", (evt) =>
            {
                this.onExpanderClick(evt);
                evt.stopPropagation();
            });
        }

        private buildList(): string
        {
            var html = "";

            html += "<ul class='mediaStoreList'>";

            this.mediaStorePaths = [];

            this.mediaStores.forEach((mediaStore, i) =>
            {
                var id = this.elementId + "_" + i;
                html += "<li id='" + id + "' class='mediaStore'>";
                html += "<span id='arrow-" + id + "' class='glyphicon glyphicon-play expand-action" + (this.isCollapsed[mediaStore.ID] ? "" : " glyph-rotate-90") + "'> </span> ";
                html += "<span id='icon-" + id + "' class='glyphicon glyphicon-hdd expand-action'> </span> ";
                html += "<div class='itemContainer'>";
                html += "<span class='mediaStore itemLabel'>" + HtmlUtil.escapeHtml(mediaStore.name) + "</span>";
                html += "<a href='javascript:$page.editMediaStore(" + mediaStore.ID + ")' class='editControl'><span class='glyphicon glyphicon-pencil'> </span></a>";
                html += "<a href='javascript:$page.deleteMediaStore(" + mediaStore.ID + ")' class='editControl'><span class='glyphicon glyphicon-trash'> </span></a>";
                html += "</div>";
                
                var pathLookup: { [mediaType: string]: MediaPath[] } = {};

                if (mediaStore.paths)
                {
                    mediaStore.paths.forEach((mediaPath, p) =>
                    {
                        var mediaPath = mediaStore.paths[p];
                        this.mediaStorePaths.push(mediaPath);
                        if (!pathLookup[mediaPath.mediaType])
                        {
                            pathLookup[mediaPath.mediaType] = [];
                        }
                        pathLookup[mediaPath.mediaType].push(mediaPath);
                    });
                }

                html += "<ul id='paths-" + id + "' class='indented " + (this.isCollapsed[mediaStore.ID] ? "hidden" : "") + "'>";
                this.mediaTypes.forEach((mediaType, mt) =>
                {
                    var mediaPaths = pathLookup[mediaType.ID];
                    if (mediaPaths)
                    {
                        html += "<li id='" + id + "_" + mt + "'class='mediaType' > <span class='glyphicon glyphicon-film'> </span> <span class='itemLabel'>" + mediaType.name + "</span></li>";

                        html += "<ul>";
                        mediaPaths.forEach((mediaPath, p) =>
                        {
                            var mediaPathIndex = mediaStore.paths.indexOf(mediaPath);
                            var firstInType = (p == 0);
                            var lastInType = (p == (mediaPaths.length - 1));
                            html += "<li id='" + id + "_" + mt + "_" + mediaPathIndex + "_" + (firstInType ? "F" : "") + (lastInType ? "L" : "") + "' class='mediaPath'>"
                            html += "<div class='itemContainer'>";
                            html += "<span class='itemLabel mediaPath'>" + HtmlUtil.escapeHtml(mediaPath.path);
                            if (mediaPath.extensions)
                            {
                                html += " (" + mediaPath.extensions + ")"
                            }
                            html += " - <span class='info'>" + HtmlUtil.escapeHtml(this.pathTargetLookup[mediaPath.target]) + "</span></span>";
                            html += "<a href='javascript:$page.editMediaPath(" + mediaPath.ID + ")' class='editControl'><span class='glyphicon glyphicon-pencil'> </span></a>";
                            html += "<a href='javascript:$page.deleteMediaPath(" + mediaPath.ID + ")' class='editControl'><span class='glyphicon glyphicon-trash'> </span></a>";
                            html += "</div>";
                            html += "</li>";
                        });
                        html += "</ul>";
                    }
                });
                html += "</ul>";

                html += "</li>";
            });
            return html;
        }

        public onSelectionChanged(changeHandler: (evt: any) => void)
        {
            this.selectionChangedHandler = changeHandler;
        }

        public getSelectedItem(): MediaStoreListItem
        {
            return this.selectedItem;
        }

        public setSelectedItem(item: MediaStoreListItem)
        {
            this.selectedItem = item;
            this.$element.find("span.itemLabel").removeClass("selected");
            // assume mediastore for now
            var itemIndex = this.mediaStores.findIndex((mediaStore) => mediaStore.ID == item.mediaStore.ID);
            this.$element.find("#" + this.elementId + "_" + itemIndex + " > span.itemContainer > span.itemLabel").addClass("selected");
            this.fireSelectionChanged();
        }

        public clearSelection()
        {
            this.$element.find("li span.nodeLabel").removeClass("selected");
        }

        private onExpanderClick(evt: JQueryEventObject)
        {
            var expanderID = $(evt.target).get(0).id.split("-")[1];
            var mediaStoreID = this.mediaStores[Number(expanderID.split("_")[1])].ID;
            if (this.isCollapsed[mediaStoreID])
            {
                $("#paths-" + expanderID).removeClass("hidden");
                $("#arrow-" + expanderID).addClass("glyph-rotate-90");
                this.isCollapsed[mediaStoreID] = false;
            }
            else
            {
                $("#paths-" + expanderID).addClass("hidden");
                $("#arrow-" + expanderID).removeClass("glyph-rotate-90");
                this.isCollapsed[mediaStoreID] = true;
            }
        }

        private onListItemClick(evt: JQueryEventObject)
        {
            Console.debug("onListItemClick" + evt.target + "," + evt.delegateTarget);
            this.$element.find("span.itemLabel").removeClass("selected");
            $(evt.delegateTarget).children("div.itemContainer").children("span.itemLabel").addClass("selected");
            this.selectedItem = this.getListItemFromId($(evt.delegateTarget).get(0).id);
            this.fireSelectionChanged();
        }

        private getListItemFromId(listItemId: string): MediaStoreListItem
        {
            var idFields = listItemId.split("_");
            return {
                mediaStore: this.mediaStores[idFields[1]],
                mediaType: idFields.length > 2 ? this.mediaTypes[idFields[2]] : null,
                mediaPath: idFields.length > 3 ? this.mediaStores[idFields[1]].paths[idFields[3]] : null,
                pathPosition: idFields.length > 4 ? idFields[4] : null
            };
        }

        private fireSelectionChanged()
        {
            if (this.selectionChangedHandler != null)
            {
                this.selectionChangedHandler(this.selectedItem);
            }
        }
    }

    class EditMediaStoreDialog extends Modal
    {
        private lblMediaStoreName = new Label("lblMediaStoreName");
        private txtMediaStoreName = new TextBox("txtMediaStoreName");
        private btnEditMediaStoreOK = new Button("btnEditMediaStoreOK");

        private mediaStore: MediaStore;

        constructor(elementId: string)
        {
            super(elementId);

            this.btnEditMediaStoreOK.onClick((evt: any) =>
            {
                this.mediaStore.name = this.txtMediaStoreName.getText();
                $catdv.saveMediaStore(this.mediaStore, (mediaStore) =>
                {
                    this.close(true, mediaStore);
                });
            });
        }

        public setMediaStore(mediaStore: MediaStore)
        {
            this.mediaStore = mediaStore;

            // clear the permission checkboxes
            if (mediaStore.ID)
            {
                this.lblMediaStoreName.setText(mediaStore.name);
                this.txtMediaStoreName.setText(mediaStore.name);
            }
            else
            {
                this.lblMediaStoreName.setText("New Media Store");
                this.txtMediaStoreName.setText("");
            }
        }
    }


    class EditPathDialog extends Modal
    {
        private txtMediaPath = new TextBox("txtMediaPath");
        private txtExtensions = new TextBox("txtExtensions");
        private btnEditPathOK = new Button("btnEditPathOK");
        private lstMediaType = new DropDownList("lstMediaType");
        private lstTarget = new DropDownList("lstTarget");

        private mediaPath: MediaPath;

        private targets = [
            { value: "server", text: "Server", applies: ["hires"] },
            { value: "web", text: "Web", applies: ["proxy"] },
            { value: "premiere", text: "Adobe Premiere", applies: ["hires", "proxy"] },
            { value: "anywhere", text: "Adobe Anywhere", applies: ["hires", "proxy"] }
        ];

        constructor(elementId: string)
        {
            super(elementId);

            this.lstMediaType.onChanged((evt) => this.updateControls());

            this.btnEditPathOK.onClick((evt: any) =>
            {
                this.mediaPath.path = this.txtMediaPath.getText();
                this.mediaPath.extensions = this.txtExtensions.getText();
                this.mediaPath.mediaType = this.lstMediaType.getSelectedValue();
                this.mediaPath.target = this.lstTarget.getSelectedValue();
                $catdv.saveMediaPath(this.mediaPath, () =>
                {
                    this.close(true);
                });
            });
        }

        public setMediaPath(mediaPath: MediaPath)
        {
            this.mediaPath = mediaPath;

            // clear the permission checkboxes
            if (mediaPath != null)
            {
                this.txtMediaPath.setText(mediaPath.path);
                this.txtExtensions.setText(this.mediaPath.extensions);
                this.lstMediaType.setSelectedValue(mediaPath.mediaType);
                this.lstTarget.setSelectedValue(mediaPath.target);
            }
            else
            {
                this.txtMediaPath.setText("");
            }
            this.updateControls();
        }

        private updateControls()
        {
            var mediaType = this.lstMediaType.getSelectedValue();
            if (mediaType == "hires")
            {
                $("#rowExtension").hide();
            }
            else
            {
                $("#rowExtension").show();
            }

            this.lstTarget.setItems(this.targets.filter((target) => target.applies.contains(mediaType)));
        }
    }
}

