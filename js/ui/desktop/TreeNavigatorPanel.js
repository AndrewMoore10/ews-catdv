var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var ui;
(function (ui) {
    var desktop;
    (function (desktop) {
        var Panel = controls.Panel;
        var TreeView = controls.TreeView;
        var $catdv = catdv.RestApi;
        var ServerSettings = logic.ServerSettings;
        var TreeNavigatorPanel = (function (_super) {
            __extends(TreeNavigatorPanel, _super);
            function TreeNavigatorPanel(elementId) {
                var _this = this;
                _super.call(this, elementId);
                this.smartfolderTree = null;
                this.navigationChangedHandler = null;
                this.$element.addClass("tree-navigator");
                $("<h3>Catalogs</h3><div id='catalogTree'></div>").appendTo(this.$element);
                this.catalogTree = new TreeView("catalogTree");
                this.catalogTree.onSelectionChanged(function (evt) {
                    var selectedNode = _this.catalogTree.getSelectedItem();
                    if (selectedNode && selectedNode.value && _this.navigationChangedHandler) {
                        _this.navigationChangedHandler({ clipQuery: selectedNode.value, description: "Catalog: " + selectedNode.value.catalog.name });
                    }
                    _this.smartfolderTree.clearSelection();
                });
                if (ServerSettings.isEnterpriseServer) {
                    $("<h3>Smart Folders</h3><div id='smartfolderTree'></div>").appendTo(this.$element);
                    this.smartfolderTree = new TreeView("smartfolderTree");
                    this.smartfolderTree.onSelectionChanged(function (evt) {
                        var selectedNode = _this.smartfolderTree.getSelectedItem();
                        if (selectedNode && selectedNode.value && _this.navigationChangedHandler) {
                            _this.navigationChangedHandler({ clipQuery: selectedNode.value, description: "Smart Folder: " + selectedNode.value.smartFolder.name });
                        }
                        _this.catalogTree.clearSelection();
                    });
                }
                this.refresh();
            }
            TreeNavigatorPanel.prototype.onNavigationChanged = function (navigationChangedHandler) {
                this.navigationChangedHandler = navigationChangedHandler;
            };
            TreeNavigatorPanel.prototype.refresh = function () {
                var _this = this;
                $catdv.getCatalogsBasicInfo(function (catalogs) {
                    _this.catalogTree.setModel(_this.buildCatalogTree(catalogs));
                });
                if (this.smartfolderTree) {
                    $catdv.getSmartFolders(function (smartFolders) {
                        _this.smartfolderTree.setModel(_this.buildFolderTree(smartFolders));
                    });
                }
            };
            TreeNavigatorPanel.prototype.buildCatalogTree = function (catalogs) {
                var treeItems = [];
                var treeNodesByPath = {};
                for (var i in catalogs) {
                    var catalog = catalogs[i];
                    if (catalog.ID == 0) {
                        continue;
                    }
                    if (catalog.groupName == null) {
                        catalog.groupName = "Anonymous (public)";
                    }
                    var name = catalog.name;
                    var p = name.lastIndexOf('/');
                    var path;
                    if (p >= 0) {
                        path = catalog.groupName + "/" + name.substring(0, p);
                        name = name.substring(p + 1);
                    }
                    else {
                        path = catalog.groupName;
                    }
                    // If catalog.getName() is something like "Folder/Subfolder/Catalog.cdv"
                    // then path would be "Group/Folder/Subfolder" and name "Catalog.cdv"
                    var node = treeNodesByPath[path];
                    if (node == null) {
                        var head = "";
                        var parent = null;
                        do {
                            p = path.indexOf('/');
                            if (head.length > 0)
                                head += "/";
                            if (p >= 0) {
                                head = head + path.substring(0, p);
                                path = path.substring(p + 1);
                            }
                            else {
                                head = head + path;
                            }
                            // Go through path from the beginning, looking for (and creating) nodes called
                            // "Group", "Group/Folder" and "Group/Folder/Subfolder" in turn. Add each node
                            // we create to its parent or the top level list.
                            node = treeNodesByPath[head];
                            if (node == null) {
                                var nodeName = head.indexOf('/') < 0 ? head : head.substring(head.lastIndexOf('/') + 1);
                                node = {
                                    name: nodeName,
                                    children: []
                                };
                                treeNodesByPath[head] = node;
                                if (parent == null) {
                                    treeItems.push(node);
                                }
                                else {
                                    // add the folder at the end of any existing folders but before the catalogs
                                    // TreeNode doesn't (or didn't) have an insert method, so implement sorting on the server
                                    parent.children.push(node);
                                }
                            }
                            parent = node;
                        } while (p >= 0);
                    }
                    var catalogItem = {
                        name: name,
                        value: { catalog: catalog },
                        children: []
                    };
                    node.children.push(catalogItem);
                }
                return treeItems;
            };
            TreeNavigatorPanel.prototype.buildFolderTree = function (folders) {
                var treeItems = [];
                var treeNodesByPath = {};
                for (var i in folders) {
                    var folder = folders[i];
                    //                var groupName = (folder.groupID == null) ? "Anonymous (public)" : folder.groupName;
                    var folderName = folder.name;
                    var p = folderName.lastIndexOf('/');
                    var path;
                    if (p >= 0) {
                        path = folderName.substring(0, p);
                        folderName = folderName.substring(p + 1);
                    }
                    else {
                        path = ""; // groupName;
                    }
                    var node = treeNodesByPath[path];
                    if (node == null) {
                        var head = "";
                        var parent = null;
                        do {
                            p = path.indexOf('/');
                            if (head.length > 0)
                                head += "/";
                            if (p >= 0) {
                                head = head + path.substring(0, p);
                                path = path.substring(p + 1);
                            }
                            else {
                                head = head + path;
                            }
                            // Go through path from the beginning, looking for (and creating) nodes called
                            // "Group", "Group/Folder" and "Group/Folder/Subfolder" in turn. Add each node
                            // we create to its parent or the top level list.
                            node = treeNodesByPath[head];
                            if (node == null) {
                                var nodeName = head.indexOf('/') < 0 ? head : head.substring(head.lastIndexOf('/') + 1);
                                node = {
                                    name: nodeName,
                                    children: []
                                };
                                treeNodesByPath[head] = node;
                                if (parent == null)
                                    treeItems.push(node);
                                else
                                    parent.children.push(node);
                            }
                            parent = node;
                        } while (p >= 0);
                    }
                    var item = {
                        name: folderName,
                        value: { smartFolder: folder },
                        children: []
                    };
                    node.children.push(item);
                }
                if (treeItems.length == 1) {
                    // flatten first level if there's only one group
                    var root = treeItems[0];
                    treeItems = [];
                    for (var j = 0; j < root.children.length; j++) {
                        treeItems.push(root.children[j]);
                    }
                }
                return treeItems;
            };
            return TreeNavigatorPanel;
        }(Panel));
        desktop.TreeNavigatorPanel = TreeNavigatorPanel;
    })(desktop = ui.desktop || (ui.desktop = {}));
})(ui || (ui = {}));
