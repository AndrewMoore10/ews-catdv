module ui.desktop
{
    import Panel = controls.Panel;
    import TreeView = controls.TreeView;
    import TreeNode = controls.TreeNode;

    import $catdv = catdv.RestApi;
    import Catalog = catdv.Catalog;
    import SmartFolder = catdv.SmartFolder;
    
    import NavigationEvent = ui.panels.NavigationEvent;

    import ServerSettings = logic.ServerSettings;

    export class TreeNavigatorPanel extends Panel
    {
        private catalogTree: TreeView;
        private smartfolderTree: TreeView = null;
        
        private navigationChangedHandler: (item: NavigationEvent) => void = null;

        private model: TreeNode[];

        constructor(elementId: string) 
        {
            super(elementId);

            this.$element.addClass("tree-navigator");

            $("<h3>Catalogs</h3><div id='catalogTree'></div>").appendTo(this.$element);
            this.catalogTree = new TreeView("catalogTree");
            this.catalogTree.onSelectionChanged((evt) =>
            {
                var selectedNode = this.catalogTree.getSelectedItem();
                if (selectedNode && selectedNode.value && this.navigationChangedHandler)
                {
                    this.navigationChangedHandler({ clipQuery: selectedNode.value, description: "Catalog: " +  selectedNode.value.catalog.name });
                }
                this.smartfolderTree.clearSelection();
            });


            if (ServerSettings.isEnterpriseServer)
            {
                $("<h3>Smart Folders</h3><div id='smartfolderTree'></div>").appendTo(this.$element);
                this.smartfolderTree = new TreeView("smartfolderTree");
                this.smartfolderTree.onSelectionChanged((evt) =>
                {
                    var selectedNode = this.smartfolderTree.getSelectedItem();
                    if (selectedNode && selectedNode.value && this.navigationChangedHandler)
                    {
                        this.navigationChangedHandler({ clipQuery: selectedNode.value, description: "Smart Folder: " +  selectedNode.value.smartFolder.name });
                    }
                    this.catalogTree.clearSelection();
                });
            }

            this.refresh();
        }

        public onNavigationChanged(navigationChangedHandler: (navigationEvent: NavigationEvent) => void)
        {
            this.navigationChangedHandler = navigationChangedHandler;
        }

        public refresh()
        {
            $catdv.getCatalogsBasicInfo((catalogs) =>
            {
                this.catalogTree.setModel(this.buildCatalogTree(catalogs));
            });

            if (this.smartfolderTree)
            {
                $catdv.getSmartFolders((smartFolders) =>
                {
                    this.smartfolderTree.setModel(this.buildFolderTree(smartFolders));
                });
            }
        }

        private buildCatalogTree(catalogs: Catalog[]): TreeNode[]
        {
            var treeItems: TreeNode[] = [];
            var treeNodesByPath: { [path: string]: TreeNode } = {};

            for (var i in catalogs)
            {
                var catalog = catalogs[i];
                if (catalog.ID == 0)
                {
                    continue;
                }
                if (catalog.groupName == null)
                {
                    catalog.groupName = "Anonymous (public)";
                }
                var name = catalog.name;
                var p = name.lastIndexOf('/');
                var path: string;
                if (p >= 0)
                {
                    path = catalog.groupName + "/" + name.substring(0, p);
                    name = name.substring(p + 1);
                }
                else
                {
                    path = catalog.groupName;
                }
                // If catalog.getName() is something like "Folder/Subfolder/Catalog.cdv"
                // then path would be "Group/Folder/Subfolder" and name "Catalog.cdv"
                var node = treeNodesByPath[path];
                if (node == null)
                {
                    var head = "";
                    var parent: TreeNode = null;
                    do
                    {
                        p = path.indexOf('/');
                        if (head.length > 0) head += "/";
                        if (p >= 0)
                        {
                            head = head + path.substring(0, p);
                            path = path.substring(p + 1);
                        }
                        else
                        {
                            head = head + path;
                        }
                        // Go through path from the beginning, looking for (and creating) nodes called
                        // "Group", "Group/Folder" and "Group/Folder/Subfolder" in turn. Add each node
                        // we create to its parent or the top level list.
                        node = treeNodesByPath[head];
                        if (node == null)
                        {
                            var nodeName = head.indexOf('/') < 0 ? head : head.substring(head.lastIndexOf('/') + 1);
                            node = {
                                name: nodeName,
                                children: []
                            };
                            treeNodesByPath[head] = node;
                            if (parent == null)
                            {
                                treeItems.push(node);
                            }
                            else
                            {
                                // add the folder at the end of any existing folders but before the catalogs
                                // TreeNode doesn't (or didn't) have an insert method, so implement sorting on the server
                                parent.children.push(node);
                            }
                        }
                        parent = node;
                    }
                    while (p >= 0);
                }

                var catalogItem = {
                    name: name,
                    value: { catalog: catalog },
                    children: []
                };
                node.children.push(catalogItem);
            }

            return treeItems;
        }

        private buildFolderTree(folders: SmartFolder[]): TreeNode[]
        {
            var treeItems: TreeNode[] = [];
            var treeNodesByPath: { [path: string]: TreeNode } = {};

            for (var i in folders)
            {
                var folder = folders[i];
                //                var groupName = (folder.groupID == null) ? "Anonymous (public)" : folder.groupName;

                var folderName = folder.name;
                var p = folderName.lastIndexOf('/');
                var path: string;
                if (p >= 0)
                {
                    path = /* groupName + "/" + */ folderName.substring(0, p);
                    folderName = folderName.substring(p + 1);
                }
                else
                {
                    path = ""; // groupName;
                }

                var node = treeNodesByPath[path];
                if (node == null)
                {
                    var head = "";
                    var parent: TreeNode = null;
                    do
                    {
                        p = path.indexOf('/');
                        if (head.length > 0) head += "/";
                        if (p >= 0)
                        {
                            head = head + path.substring(0, p);
                            path = path.substring(p + 1);
                        }
                        else
                        {
                            head = head + path;
                        }
                        // Go through path from the beginning, looking for (and creating) nodes called
                        // "Group", "Group/Folder" and "Group/Folder/Subfolder" in turn. Add each node
                        // we create to its parent or the top level list.
                        node = treeNodesByPath[head];
                        if (node == null)
                        {
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
                    }
                    while (p >= 0);
                }

                var item = {
                    name: folderName,
                    value: { smartFolder: folder },
                    children: []
                };
                node.children.push(item);
            }

            if (treeItems.length == 1)
            {
                // flatten first level if there's only one group
                var root = treeItems[0];
                treeItems = [];
                for (var j = 0; j < root.children.length; j++)
                {
                    treeItems.push(root.children[j]);
                }
            }
            return treeItems;
        }

    }
}