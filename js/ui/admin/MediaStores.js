var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var ui;
(function (ui) {
    var admin;
    (function (admin) {
        var HtmlUtil = util.HtmlUtil;
        var Control = controls.Control;
        var Button = controls.Button;
        var TextBox = controls.TextBox;
        var Label = controls.Label;
        var DropDownList = controls.DropDownList;
        var Modal = controls.Modal;
        var Console = controls.Console;
        var MessageBox = controls.MessageBox;
        var $catdv = catdv.RestApi;
        var NavbarLoginMenu = ui.panels.NavbarLoginMenu;
        var MediaStoresForm = (function () {
            function MediaStoresForm() {
                var _this = this;
                this.btnAddMediaStore = new Button("btnAddMediaStore");
                this.btnAddPath = new Button("btnAddPath");
                this.btnEdit = new Button("btnEdit");
                //        private btnUp: Button = new Button("btnUp");
                //        private btnDown: Button = new Button("btnDown");
                this.btnDelete = new Button("btnDelete");
                this.navbarLoginMenu = new NavbarLoginMenu("navbarLoginMenu");
                this.editMediaStoreDialog = new EditMediaStoreDialog("editMediaStoreDialog");
                this.editPathDialog = new EditPathDialog("editPathDialog");
                this.mediaStoreLookup = {};
                this.mediaStoreList = new MediaStoreList("mediaStoreList");
                this.mediaStoreList.onSelectionChanged(function (evt) {
                    var selectedItem = _this.mediaStoreList.getSelectedItem();
                    var mediaStoreSelected = (selectedItem != null) && (selectedItem.mediaType == null);
                    var mediaTypeSelected = (selectedItem != null) && (selectedItem.mediaType != null) && (selectedItem.mediaPath == null);
                    var mediaPathSelected = (selectedItem != null) && (selectedItem.mediaPath != null);
                    _this.btnAddPath.setEnabled(mediaStoreSelected || mediaTypeSelected || mediaPathSelected);
                    _this.btnEdit.setEnabled(mediaStoreSelected || mediaPathSelected);
                    //                this.btnUp.setEnabled(mediaPathSelected && !selectedItem.pathPosition.contains("F"));
                    //                this.btnDown.setEnabled(mediaPathSelected && !selectedItem.pathPosition.contains("L"));
                    _this.btnDelete.setEnabled(mediaStoreSelected || mediaPathSelected);
                });
                this.btnAddMediaStore.onClick(function (evt) {
                    _this.editMediaStoreDialog.setMediaStore({ ID: null });
                    _this.editMediaStoreDialog.onOK(function (newMediaStore) {
                        _this.mediaStoreList.loadList(function () {
                            _this.mediaStoreList.setSelectedItem({
                                mediaStore: newMediaStore,
                                mediaType: null,
                                mediaPath: null,
                                pathPosition: null
                            });
                        });
                    });
                    _this.editMediaStoreDialog.show();
                });
                this.btnAddPath.onClick(function (evt) {
                    var selectedItem = _this.mediaStoreList.getSelectedItem();
                    _this.editPathDialog.setMediaPath({
                        ID: null,
                        mediaStoreID: selectedItem.mediaStore.ID,
                        mediaType: selectedItem.mediaType ? selectedItem.mediaType.ID : null,
                        target: selectedItem.mediaPath ? selectedItem.mediaPath.target : null,
                        pathOrder: selectedItem.mediaStore.paths ? selectedItem.mediaStore.paths.reduce(function (prev, curr) { return prev.pathOrder > curr.pathOrder ? prev : curr; }).pathOrder + 1 : 1
                    });
                    _this.editPathDialog.onOK(function () {
                        _this.mediaStoreList.loadList();
                    });
                    _this.editPathDialog.show();
                });
                this.btnEdit.onClick(function (evt) {
                    var selectedItem = _this.mediaStoreList.getSelectedItem();
                    if (!selectedItem.mediaPath) {
                        _this.editMediaStore(selectedItem.mediaStore.ID);
                    }
                    else {
                        _this.editMediaPath(selectedItem.mediaPath.ID);
                    }
                });
                this.btnDelete.onClick(function (evt) {
                    var selectedItem = _this.mediaStoreList.getSelectedItem();
                    if (!selectedItem.mediaPath) {
                        _this.deleteMediaStore(selectedItem.mediaStore.ID);
                    }
                    else {
                        _this.deleteMediaPath(selectedItem.mediaPath.ID);
                    }
                });
            }
            MediaStoresForm.prototype.editMediaStore = function (mediaStoreID) {
                var _this = this;
                var mediaStore = this.mediaStoreList.mediaStores.find(function (mediaStore) { return mediaStore.ID == mediaStoreID; });
                this.editMediaStoreDialog.setMediaStore(mediaStore);
                this.editMediaStoreDialog.onOK(function () {
                    _this.mediaStoreList.loadList();
                });
                this.editMediaStoreDialog.show();
            };
            MediaStoresForm.prototype.deleteMediaStore = function (mediaStoreID) {
                var _this = this;
                var mediaStore = this.mediaStoreList.mediaStores.find(function (mediaStore) { return mediaStore.ID == mediaStoreID; });
                MessageBox.confirm("Are you sure you want to delete Media Store '" + mediaStore.name + "'", function () {
                    $catdv.deleteMediaStore(mediaStore.ID, function (reply) {
                        _this.mediaStoreList.loadList();
                    });
                });
            };
            MediaStoresForm.prototype.editMediaPath = function (mediaStorePathID) {
                var _this = this;
                var mediaStorePath = this.mediaStoreList.mediaStorePaths.find(function (mediaStorePath) { return mediaStorePath.ID == mediaStorePathID; });
                this.editPathDialog.setMediaPath(mediaStorePath);
                this.editPathDialog.onOK(function () {
                    _this.mediaStoreList.loadList();
                });
                this.editPathDialog.show();
            };
            MediaStoresForm.prototype.deleteMediaPath = function (mediaStorePathID) {
                var _this = this;
                var mediaStorePath = this.mediaStoreList.mediaStorePaths.find(function (mediaStorePath) { return mediaStorePath.ID == mediaStorePathID; });
                MessageBox.confirm("Are you sure you want to delete '" + mediaStorePath.path + "'", function () {
                    $catdv.deleteMediaPath(mediaStorePath.mediaStoreID, mediaStorePath.ID, function (reply) {
                        _this.mediaStoreList.loadList();
                    });
                });
            };
            return MediaStoresForm;
        }());
        admin.MediaStoresForm = MediaStoresForm;
        var MediaStoreListItem = (function () {
            function MediaStoreListItem() {
            }
            return MediaStoreListItem;
        }());
        var MediaStoreList = (function (_super) {
            __extends(MediaStoreList, _super);
            // elementId of the <div> with overflow:scroll that will contain the tree
            function MediaStoreList(elementId) {
                _super.call(this, elementId);
                this.selectionChangedHandler = null;
                this.selectedItem = null;
                this.pathTargetLookup = {};
                this.isCollapsed = {};
                this.$element.addClass("treeView mediaStores");
                this.loadList();
            }
            MediaStoreList.prototype.loadList = function (callback) {
                var _this = this;
                if (callback === void 0) { callback = null; }
                $catdv.getMediaStore_MediaTypes(function (mediaTypes) {
                    _this.mediaTypes = mediaTypes;
                    $catdv.getMediaStore_PathTargets(function (pathTargets) {
                        _this.pathTargetLookup = {};
                        pathTargets.forEach(function (pathTarget) { return _this.pathTargetLookup[pathTarget.ID] = pathTarget.name; });
                        $catdv.getMediaStores(function (mediaStores) {
                            _this.mediaStores = mediaStores;
                            _this.redraw();
                            if (callback)
                                callback();
                        });
                    });
                });
            };
            MediaStoreList.prototype.redraw = function () {
                var _this = this;
                this.$element.empty();
                this.$element.html(this.buildList());
                this.$element.find("li").on("click", function (evt) {
                    _this.onListItemClick(evt);
                    evt.stopPropagation();
                });
                this.$element.find("span.expand-action").on("click", function (evt) {
                    _this.onExpanderClick(evt);
                    evt.stopPropagation();
                });
            };
            MediaStoreList.prototype.buildList = function () {
                var _this = this;
                var html = "";
                html += "<ul class='mediaStoreList'>";
                this.mediaStorePaths = [];
                this.mediaStores.forEach(function (mediaStore, i) {
                    var id = _this.elementId + "_" + i;
                    html += "<li id='" + id + "' class='mediaStore'>";
                    html += "<span id='arrow-" + id + "' class='glyphicon glyphicon-play expand-action" + (_this.isCollapsed[mediaStore.ID] ? "" : " glyph-rotate-90") + "'> </span> ";
                    html += "<span id='icon-" + id + "' class='glyphicon glyphicon-hdd expand-action'> </span> ";
                    html += "<div class='itemContainer'>";
                    html += "<span class='mediaStore itemLabel'>" + HtmlUtil.escapeHtml(mediaStore.name) + "</span>";
                    html += "<a href='javascript:$page.editMediaStore(" + mediaStore.ID + ")' class='editControl'><span class='glyphicon glyphicon-pencil'> </span></a>";
                    html += "<a href='javascript:$page.deleteMediaStore(" + mediaStore.ID + ")' class='editControl'><span class='glyphicon glyphicon-trash'> </span></a>";
                    html += "</div>";
                    var pathLookup = {};
                    if (mediaStore.paths) {
                        mediaStore.paths.forEach(function (mediaPath, p) {
                            var mediaPath = mediaStore.paths[p];
                            _this.mediaStorePaths.push(mediaPath);
                            if (!pathLookup[mediaPath.mediaType]) {
                                pathLookup[mediaPath.mediaType] = [];
                            }
                            pathLookup[mediaPath.mediaType].push(mediaPath);
                        });
                    }
                    html += "<ul id='paths-" + id + "' class='indented " + (_this.isCollapsed[mediaStore.ID] ? "hidden" : "") + "'>";
                    _this.mediaTypes.forEach(function (mediaType, mt) {
                        var mediaPaths = pathLookup[mediaType.ID];
                        if (mediaPaths) {
                            html += "<li id='" + id + "_" + mt + "'class='mediaType' > <span class='glyphicon glyphicon-film'> </span> <span class='itemLabel'>" + mediaType.name + "</span></li>";
                            html += "<ul>";
                            mediaPaths.forEach(function (mediaPath, p) {
                                var mediaPathIndex = mediaStore.paths.indexOf(mediaPath);
                                var firstInType = (p == 0);
                                var lastInType = (p == (mediaPaths.length - 1));
                                html += "<li id='" + id + "_" + mt + "_" + mediaPathIndex + "_" + (firstInType ? "F" : "") + (lastInType ? "L" : "") + "' class='mediaPath'>";
                                html += "<div class='itemContainer'>";
                                html += "<span class='itemLabel mediaPath'>" + HtmlUtil.escapeHtml(mediaPath.path);
                                if (mediaPath.extensions) {
                                    html += " (" + mediaPath.extensions + ")";
                                }
                                html += " - <span class='info'>" + HtmlUtil.escapeHtml(_this.pathTargetLookup[mediaPath.target]) + "</span></span>";
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
            };
            MediaStoreList.prototype.onSelectionChanged = function (changeHandler) {
                this.selectionChangedHandler = changeHandler;
            };
            MediaStoreList.prototype.getSelectedItem = function () {
                return this.selectedItem;
            };
            MediaStoreList.prototype.setSelectedItem = function (item) {
                this.selectedItem = item;
                this.$element.find("span.itemLabel").removeClass("selected");
                // assume mediastore for now
                var itemIndex = this.mediaStores.findIndex(function (mediaStore) { return mediaStore.ID == item.mediaStore.ID; });
                this.$element.find("#" + this.elementId + "_" + itemIndex + " > span.itemContainer > span.itemLabel").addClass("selected");
                this.fireSelectionChanged();
            };
            MediaStoreList.prototype.clearSelection = function () {
                this.$element.find("li span.nodeLabel").removeClass("selected");
            };
            MediaStoreList.prototype.onExpanderClick = function (evt) {
                var expanderID = $(evt.target).get(0).id.split("-")[1];
                var mediaStoreID = this.mediaStores[Number(expanderID.split("_")[1])].ID;
                if (this.isCollapsed[mediaStoreID]) {
                    $("#paths-" + expanderID).removeClass("hidden");
                    $("#arrow-" + expanderID).addClass("glyph-rotate-90");
                    this.isCollapsed[mediaStoreID] = false;
                }
                else {
                    $("#paths-" + expanderID).addClass("hidden");
                    $("#arrow-" + expanderID).removeClass("glyph-rotate-90");
                    this.isCollapsed[mediaStoreID] = true;
                }
            };
            MediaStoreList.prototype.onListItemClick = function (evt) {
                Console.debug("onListItemClick" + evt.target + "," + evt.delegateTarget);
                this.$element.find("span.itemLabel").removeClass("selected");
                $(evt.delegateTarget).children("div.itemContainer").children("span.itemLabel").addClass("selected");
                this.selectedItem = this.getListItemFromId($(evt.delegateTarget).get(0).id);
                this.fireSelectionChanged();
            };
            MediaStoreList.prototype.getListItemFromId = function (listItemId) {
                var idFields = listItemId.split("_");
                return {
                    mediaStore: this.mediaStores[idFields[1]],
                    mediaType: idFields.length > 2 ? this.mediaTypes[idFields[2]] : null,
                    mediaPath: idFields.length > 3 ? this.mediaStores[idFields[1]].paths[idFields[3]] : null,
                    pathPosition: idFields.length > 4 ? idFields[4] : null
                };
            };
            MediaStoreList.prototype.fireSelectionChanged = function () {
                if (this.selectionChangedHandler != null) {
                    this.selectionChangedHandler(this.selectedItem);
                }
            };
            return MediaStoreList;
        }(Control));
        var EditMediaStoreDialog = (function (_super) {
            __extends(EditMediaStoreDialog, _super);
            function EditMediaStoreDialog(elementId) {
                var _this = this;
                _super.call(this, elementId);
                this.lblMediaStoreName = new Label("lblMediaStoreName");
                this.txtMediaStoreName = new TextBox("txtMediaStoreName");
                this.btnEditMediaStoreOK = new Button("btnEditMediaStoreOK");
                this.btnEditMediaStoreOK.onClick(function (evt) {
                    _this.mediaStore.name = _this.txtMediaStoreName.getText();
                    $catdv.saveMediaStore(_this.mediaStore, function (mediaStore) {
                        _this.close(true, mediaStore);
                    });
                });
            }
            EditMediaStoreDialog.prototype.setMediaStore = function (mediaStore) {
                this.mediaStore = mediaStore;
                // clear the permission checkboxes
                if (mediaStore.ID) {
                    this.lblMediaStoreName.setText(mediaStore.name);
                    this.txtMediaStoreName.setText(mediaStore.name);
                }
                else {
                    this.lblMediaStoreName.setText("New Media Store");
                    this.txtMediaStoreName.setText("");
                }
            };
            return EditMediaStoreDialog;
        }(Modal));
        var EditPathDialog = (function (_super) {
            __extends(EditPathDialog, _super);
            function EditPathDialog(elementId) {
                var _this = this;
                _super.call(this, elementId);
                this.txtMediaPath = new TextBox("txtMediaPath");
                this.txtExtensions = new TextBox("txtExtensions");
                this.btnEditPathOK = new Button("btnEditPathOK");
                this.lstMediaType = new DropDownList("lstMediaType");
                this.lstTarget = new DropDownList("lstTarget");
                this.targets = [
                    { value: "server", text: "Server", applies: ["hires"] },
                    { value: "web", text: "Web", applies: ["proxy"] },
                    { value: "premiere", text: "Adobe Premiere", applies: ["hires", "proxy"] },
                    { value: "anywhere", text: "Adobe Anywhere", applies: ["hires", "proxy"] }
                ];
                this.lstMediaType.onChanged(function (evt) { return _this.updateControls(); });
                this.btnEditPathOK.onClick(function (evt) {
                    _this.mediaPath.path = _this.txtMediaPath.getText();
                    _this.mediaPath.extensions = _this.txtExtensions.getText();
                    _this.mediaPath.mediaType = _this.lstMediaType.getSelectedValue();
                    _this.mediaPath.target = _this.lstTarget.getSelectedValue();
                    $catdv.saveMediaPath(_this.mediaPath, function () {
                        _this.close(true);
                    });
                });
            }
            EditPathDialog.prototype.setMediaPath = function (mediaPath) {
                this.mediaPath = mediaPath;
                // clear the permission checkboxes
                if (mediaPath != null) {
                    this.txtMediaPath.setText(mediaPath.path);
                    this.txtExtensions.setText(this.mediaPath.extensions);
                    this.lstMediaType.setSelectedValue(mediaPath.mediaType);
                    this.lstTarget.setSelectedValue(mediaPath.target);
                }
                else {
                    this.txtMediaPath.setText("");
                }
                this.updateControls();
            };
            EditPathDialog.prototype.updateControls = function () {
                var mediaType = this.lstMediaType.getSelectedValue();
                if (mediaType == "hires") {
                    $("#rowExtension").hide();
                }
                else {
                    $("#rowExtension").show();
                }
                this.lstTarget.setItems(this.targets.filter(function (target) { return target.applies.contains(mediaType); }));
            };
            return EditPathDialog;
        }(Modal));
    })(admin = ui.admin || (ui.admin = {}));
})(ui || (ui = {}));
