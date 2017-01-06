module ui.panels
{
    import HtmlUtil = util.HtmlUtil;
    import Element = controls.Element;
    import Panel = controls.Panel;
    import Label = controls.Label;
    import TreeView = controls.TreeView;
    import TreeNode = controls.TreeNode;
    import Button = controls.Button;
    import TextBox = controls.TextBox;
    import ComboBox = controls.ComboBox;
    import ListItem = controls.ListItem;
    import Modal = controls.Modal;
    import DropDownList = controls.DropDownList;
    import MessageBox = controls.MessageBox;
    import Console = controls.Console;
    import SimpleServerDataSource = controls.SimpleServerDataSource;

    import $catdv = catdv.RestApi;
    import NamedObject = catdv.NamedObject;
    import Catalog = catdv.Catalog;
    import SmartFolder = catdv.SmartFolder;
    import ClipList = catdv.ClipList;
    import Filter = catdv.Filter;
    import FilterValue = catdv.FilterValue;
    import QueryDefinition = catdv.QueryDefinition;
    import QueryTerm = catdv.QueryTerm;
    import ClipQuery = catdv.ClipQuery;
    import FieldDefinition = catdv.FieldDefinition;
    import FieldDefinitionUtil = catdv.FieldDefinitionUtil;
    import ServerCommand = catdv.ServerCommand; 
    import CommandResults = catdv.CommandResults;
    import ArgumentForm = catdv.ArgumentForm;
    
    import FilterItem = logic.FilterItem;

    import FieldSettingsManager = logic.FieldSettingsManager;
    import ClientSettings = logic.ClientSettings;
    import ServerSettings = logic.ServerSettings;
    import DetailFieldFactory = logic.DetailFieldFactory;
    import DetailPanelField = logic.DetailPanelField;
    import ServerCommandManager = logic.ServerCommandManager;


    class PopoutPanel extends Panel
    {
        // initialised in derived classed
        public closePanelBtn: Button;

        private static $backgroundClickElement : JQuery = null;        
        private backgroundClickHandler: (evt: any) => void = null;
        private popupVisible: boolean = false;
        private closeHandler: (evt) => void = null;

        constructor(element: any)
        {
            super(element);
            
            if(PopoutPanel.$backgroundClickElement == null)
            {
                PopoutPanel.$backgroundClickElement = $("<div class='nav-popup-backdrop'>").appendTo(document.body);
            }
          
            this.backgroundClickHandler = (evt) =>
            {
                if (this.popupVisible)
                {
                    Console.debug("backgroundClickHandler()");
                    if (this.closeHandler) this.closeHandler(evt);
                }
            };
        }

        open()
        {
            Console.debug("PopoutPanel.open()");
            PopoutPanel.$backgroundClickElement.on("click", this.backgroundClickHandler);
            PopoutPanel.$backgroundClickElement.addClass("open");
            this.$element.addClass("open");
            this.popupVisible = true;
        }

        close()
        {
            Console.debug("PopoutPanel.close()");
            PopoutPanel.$backgroundClickElement.off("click", this.backgroundClickHandler);
            PopoutPanel.$backgroundClickElement.removeClass("open");
            this.$element.removeClass("open");
            this.popupVisible = false;
        }

        public onClose(closeHandler: (evt) => void)
        {
            this.closeHandler = closeHandler;
            this.closePanelBtn.onClick((evt) =>
            {
                if (this.closeHandler) this.closeHandler(evt);
            });
        }
    }

    class SearchPanel extends PopoutPanel
    {
        private simpleSearchContainer: Element;
        private advancedSearchContainer: Element;
        private txtSearch: TextBox;
        private cboSearch: ComboBox;
        private btnSearch: Button;

        private btnSimpleSearch: Button;
        private btnRunSimpleSearch: Button;
        private btnAdvancedSearch: Button;
        private btnRunAdvancedSearch: Button;

        private advancedSearchForm: QueryBuilderPanel = null;
        private simpleSearchForm: SimpleSearchForm = null;
        private customSearchForm: ArgumentFormPanel = null;
        private searchCommand: ServerCommand = null;
        private searchArgumentForm: ArgumentForm = null;

        private searchHandler: (clipQuery: ClipQuery) => void = null;

        private navigator: NavigatorPanel;
        private advancedSearchMode = false;
        private simpleSearchField: string;

        constructor(element: any, navigator: NavigatorPanel)
        {
            super(element);
            this.navigator = navigator;

            this.simpleSearchField = ServerSettings.simpleSearchField;

            var html =
                "<div class='popout-container'>" +
                " <a href='#' id='closeSearchPanelBtn' class='close-button'><span class='catdvicon catdvicon-close_panel'> </span></a>" +
                " <h2>" + HtmlUtil.escapeHtml(catdv.settings.searchAlias) + "</h2>" +
                " <div id='simpleSearchContainer'>";
            if (catdv.settings.canSearchAdvanced)
            {
                html += "<a href='#' id='btnAdvancedSearch' class='btn btn-link'>Advanced Search <span class='glyphicon glyphicon-search'> </span> </a>";
            }

            html +=  " <div class='input-group'>";
            if (ServerSettings.isPegasusServer)
            {
                html += "   <select id='cboSearch' class='form-control searchField'></select>";
            }
            else
            {
                html += "   <input type='text' id='txtSearch' class='form-control searchField'>";
            }
            html +=
                "   <span class='input-group-btn'>" +
                "     <button id='btnSearch' class='btn btn-primary btn-search' type='button'><span class='catdvicon catdvicon-search'></span> </button>" +
                "   </span>" +
                "  </div>" +
                "  <div id='simpleSearch'></div>" +
                "  <button id='btnRunSimpleSearch' class='btn btn-primary run-query-action pull-right' type='button'>Search</button>" +
                " </div>";

            if (catdv.settings.canSearchAdvanced)
            {
                html +=
                    "<div id='advancedSearchContainer' style='display:none;'>" +
                    "<a href='#' id='btnSimpleSearch' class='btn btn-link'>Simple Search <span class='glyphicon glyphicon-search'> </span> </a>" +
                    " <div id='queryBuilder'></div>" +
                    " <button id='btnRunAdvancedSearch' class='btn btn-primary run-query-action pull-right' type='button'>Search</button>" +
                    "</div>";
            }

            html += "</div>";

            this.$element.html(html);

            this.simpleSearchContainer = new Element("simpleSearchContainer");
            this.advancedSearchContainer = new Element("advancedSearchContainer");

            this.closePanelBtn = new Button("closeSearchPanelBtn");

            if (ServerSettings.isPegasusServer)
            {
                var suggestDataSource = new SimpleServerDataSource<ListItem>((params: any, callback: (results: ListItem[]) => void) =>
                {
                    if (params.filter && params.filter.length > 2)
                    {
                        $catdv.getSuggestions(params.filter, (results: string[]) =>
                        {
                            callback(results.map((result) => { return { value: result, text: result } }));
                        });
                    }
                    else
                    {
                        callback([]);
                    }
                });
                this.cboSearch = new ComboBox("cboSearch", suggestDataSource, false, true);
                this.cboSearch.onChanged((evt) => this.doSimpleSearch());
            }
            else
            {
                this.txtSearch = new TextBox("txtSearch");
                this.txtSearch.onChanged((evt) => this.doSimpleSearch());
            }

            this.btnSearch = new Button("btnSearch");
            this.btnSearch.onClick((evt) => this.doSimpleSearch());

            this.btnSimpleSearch = new Button("btnSimpleSearch");
            this.btnSimpleSearch.onClick((evt) =>
            {
                this.showSimpleOrCustomSearch();
            });

            this.btnRunSimpleSearch = new Button("btnRunSimpleSearch");
            this.btnRunSimpleSearch.onClick((evt) => this.doSimpleSearch());

            this.advancedSearchForm = new QueryBuilderPanel("queryBuilder");

            this.btnAdvancedSearch = new Button("btnAdvancedSearch");
            this.btnAdvancedSearch.onClick((evt) =>
            {
                this.showAdvancedSearch();
            });

            this.btnRunAdvancedSearch = new Button("btnRunAdvancedSearch");
            this.btnRunAdvancedSearch.onClick((evt) =>
            {
                this.navigator.closePopouts();
                if (this.searchHandler)
                {
                    this.searchHandler({ queryDef: this.advancedSearchForm.getQuery(), advancedQuery: true, title: null });
                }
            });
        }

        public static create(parent): SearchPanel
        {
            return new SearchPanel($("<div id='searchPanel' class='popout-panel'></div>").appendTo(Element.get$(parent)), parent);
        }

        // Override PopoutPanel.open()
        public open()
        {
            super.open();

            if ((this.simpleSearchForm == null) && (this.customSearchForm == null))
            {
                ServerCommandManager.getCustomSearchCommand((searchCommand: ServerCommand, argumentForm: ArgumentForm) =>
                {
                    if (searchCommand)
                    {
                        this.searchCommand = searchCommand;
                        this.searchArgumentForm = argumentForm;
                        this.customSearchForm = new ArgumentFormPanel("simpleSearch");
                        this.customSearchForm.setCommand(searchCommand, argumentForm);
                        this.$element.addClass("wide");
                        this.btnRunSimpleSearch.show();
                    }
                    else
                    {
                        this.simpleSearchForm = new SimpleSearchForm("simpleSearch");
                        this.simpleSearchForm.load((numSearchFormFields) =>
                        {
                            if (numSearchFormFields > 0)
                            {
                                this.btnRunSimpleSearch.show();
                            }
                            else
                            {
                                this.btnRunSimpleSearch.hide();
                            }
                        });
                    }
                });
            }
            this.restoreSavedSearch();
        }

        public onSearch(searchHandler: (clipQuery: ClipQuery) => void)
        {
            this.searchHandler = searchHandler;
        }

        public clearSearch()
        {
            this.showSimpleOrCustomSearch();

            $(".searchField").val("");

            this.advancedSearchForm.clearQuery();

            if (this.simpleSearchForm) 
            {
                this.simpleSearchForm.clearQueryTerms();
            } 
            else if (this.customSearchForm)
            {
                this.customSearchForm.setCommand(this.searchCommand, this.searchArgumentForm);
            }
        }

        private restoreSavedSearch()
        {
            var clipQuery = ClientSettings.getSavedClipQuery();
            if (clipQuery && clipQuery.queryDef && clipQuery.queryDef.terms && (clipQuery.queryDef.terms.length > 0))
            {
                var terms: QueryTerm[] = clipQuery.queryDef.terms;
                if (terms.length == 0) return;

                if (clipQuery.advancedQuery)
                {
                    this.showAdvancedSearch();
                    this.advancedSearchForm.setQuery(clipQuery.queryDef);
                }
                else
                {
                    this.showSimpleOrCustomSearch();
                    if (this.simpleSearchForm)
                    {
                        if (terms[0].field == this.simpleSearchField)
                        {
                            (this.txtSearch || this.cboSearch).setText(terms[0].params);
                            terms = terms.slice(1);
                        }
                        if (terms.length > 0)
                        {
                            this.simpleSearchForm.setQueryTerms(terms);
                        }
                    }
                }
            }
        }

        private showAdvancedSearch()
        {
            this.$element.addClass("wide");
            this.simpleSearchContainer.hide();
            this.advancedSearchContainer.show();
            this.advancedSearchMode = true;
        }

        private showSimpleOrCustomSearch()
        {
            if (this.simpleSearchForm)
                this.$element.removeClass("wide");
            else
                this.$element.addClass("wide");
               
            this.simpleSearchContainer.show();
            this.advancedSearchContainer.hide();
            this.advancedSearchMode = false;
        }

        private doSimpleSearch()
        {
            if (this.searchHandler)
            {
                if (this.simpleSearchForm)
                {
                    var terms: QueryTerm[] = [];

                    var searchText = this.txtSearch ? this.txtSearch.getText().trim() : this.cboSearch.getText();
                    if (searchText)
                    {
                        terms.push({ field: this.simpleSearchField, op: "like", params: searchText });
                    }

                    var searchFormTerms = this.simpleSearchForm.getQueryTerms();
                    if (searchFormTerms.length > 0)
                    {
                        terms = terms.concat(searchFormTerms);
                    }

                    this.searchHandler({
                        title: "Search Results",
                        queryDef: { terms: terms },
                        advancedQuery: false
                    });
                    
                    this.navigator.closePopouts();
                }
                else if (this.customSearchForm)
                {
                    var event = "Search";
                    var args = this.customSearchForm.readArgumentValues(event);
                    ServerCommandManager.executeCommand(this.searchCommand, event, [], args, (result: CommandResults) =>
                    {
                        if ((result.clipIDs != null) && (result.clipIDs.length > 0))
                        {
                            var clipIDs = result.clipIDs.map((a) => String(a)).reduce((a, b) => a + "," + b);
                            this.searchHandler({
                                title: "Search Results",
                                queryDef: { terms: [{ field: "clip.id", op: "isOneOf", params: clipIDs }] },
                                advancedQuery: false
                            });
                        }
                        this.navigator.closePopouts();
                    });
                }
            }
        }
    }

    class CatalogsPanel extends PopoutPanel
    {
        private catalogTree: TreeView;
        private catalogSelectedHandler: (catalog: Catalog) => void = null;

        private navigator: NavigatorPanel;
        private model: TreeNode[] = null;

        constructor(element: any, navigator: NavigatorPanel)
        {
            super(element);
            this.navigator = navigator;

            var catalogsLabel = (catdv.settings.catalogAlias && catdv.settings.catalogAlias.contains("/")) ? catdv.settings.catalogAlias.split("/")[1] : "Catalogs";

            this.$element.html(
                "<div class='popout-container'>" +
                "<a href='#' id='closeCatalogsPanelBtn' class='close-button'><span class='catdvicon catdvicon-close_panel'> </span></a>" +
                "<h2>" + HtmlUtil.escapeHtml(catdv.settings.catalogsAlias) + "</h2><div id='catalogTree' class='navtree'></div>" +
                "</div>");

            this.closePanelBtn = new Button("closeCatalogsPanelBtn");

            this.catalogTree = new TreeView("catalogTree");

            this.catalogTree.onSelectionChanged((evt) =>
            {
                var selectedNode = this.catalogTree.getSelectedItem();
                if (selectedNode && selectedNode.value && this.catalogSelectedHandler)
                {
                    this.navigator.closePopouts();
                    this.catalogSelectedHandler(selectedNode.value);
                }
            });
        }

        public static create(parent): CatalogsPanel
        {
            return new CatalogsPanel($("<div id='catalogsPanel' class='popout-panel'></div>").appendTo(Element.get$(parent)), parent);
        }

        public onCatalogSelected(catalogSelectedHandler: (catalog: Catalog) => void)
        {
            this.catalogSelectedHandler = catalogSelectedHandler;
        }

        // Override PopoutPanel.open()
        public open()
        {
            super.open();
            if (this.model == null)
            {
                this.catalogTree.setModel([{ name: "Loading..." }]);
                this.loadData();
            }
        }

        private loadData()
        {
            $catdv.getCatalogsBasicInfo((catalogs) =>
            {
                this.model = TreeBuilder.buildTree(catalogs.filter((catalog) => catalog.ID != null), "Catalogs");
                this.catalogTree.setModel(this.model);
            });
        }
    }

    class MediaPathsPanel extends PopoutPanel
    {
        private mediaPathTree: TreeView;
        private mediaPathQueryHandler: (query: QueryDefinition, queryDescription: string) => void = null;

        private navigator: NavigatorPanel;
        private model: TreeNode[] = null;

        constructor(element: any, navigator: NavigatorPanel)
        {
            super(element);
            this.navigator = navigator;

            this.$element.html(
                "<div class='popout-container'>" +
                "<a href='#' id='closeMediaPathPanelBtn' class='close-button'><span class='catdvicon catdvicon-close_panel'> </span></a>" +
                "<h2>Media Paths</h2>" +
                "<div id='mediaPathTree' class='navtree with-root-disclosures'></div>" +
                "</div>");

            this.closePanelBtn = new Button("closeMediaPathPanelBtn");

            this.mediaPathTree = new TreeView("mediaPathTree");
            this.mediaPathTree.onSelectionChanged((evt) =>
            {
                var selectedNode = this.mediaPathTree.getSelectedItem();
                if (selectedNode && selectedNode.value && this.mediaPathQueryHandler)
                {
                    this.navigator.closePopouts();
                    this.mediaPathQueryHandler({ terms: [{ field: "media.fileDir", op: "startsWith", params: selectedNode.value }] }, "Path:" + selectedNode.value);
                }
            });
        }

        public static create(parent): MediaPathsPanel
        {
            return new MediaPathsPanel($("<div id='mediaPathsPanel' class='popout-panel'></div>").appendTo(Element.get$(parent)), parent);
        }

        public onMediaPathQuery(mediaPathQueryHandler: (query: QueryDefinition, queryDescription: string) => void)
        {
            this.mediaPathQueryHandler = mediaPathQueryHandler;
        }

        // Override PopoutPanel.open()
        public open()
        {
            super.open();
            if (this.model == null)
            {
                this.mediaPathTree.setModel([{ name: "Loading..." }]);
                this.loadData();
            }
        }

        private loadData()
        {
            FieldSettingsManager.getUniqueFieldValues({ ID: "FLD" }, (paths: string[]) =>
            {
                this.model = this.buildMediaPathTree(paths);
                this.mediaPathTree.setModel(this.model);
            });
        }

        private buildMediaPathTree(mediaPaths: string[]): TreeNode[]
        {
            var rootNodes: TreeNode[] = [];
            var treeNodesByPath: { [path: string]: TreeNode } = {};

            mediaPaths
                .filter((mediaPath) => mediaPath != null)
                .sort()
                .forEach((mediaPath) =>
                {
                    var pathElements = mediaPath.contains("/") ? mediaPath.split("/") : mediaPath.split("\\");

                    // accumulate path from root down to the leaves
                    var path = "";
                    // position in the mediaPath or the end of the current element so we can extract
                    // the 'real' path for each node in the tree including any prefixes and with the original separators
                    // that are not present in the accumulated path.
                    var p = 0;
                    // branch we are currently adding nodes to - initially root then the child collection of each node down the path
                    var currentBranch: TreeNode[] = rootNodes;
                    pathElements.forEach((pathElement, i) =>
                    {
                        // ignore blank path elements (UNC paths have a blank first element)
                        if (pathElement)
                        {
                            // accumulate path
                            path = path.length > 0 ? path + "/" + pathElement : pathElement;
                            // update position of pathElement in mediaPath
                            p = mediaPath.indexOf(pathElement, p) + pathElement.length;
                            var treeNode = treeNodesByPath[path];
                            if (treeNode == null)
                            {
                                var rootNode = (i == 0);
                                treeNode = {
                                    name: pathElement,
                                    isExpanded: rootNode,
                                    //                                isSectionHeader: false,
                                    isSelectable: true,
                                    value: mediaPath.substr(0, p),
                                    children: []
                                };

                                currentBranch.push(treeNode);
                                treeNodesByPath[path] = treeNode;
                            }
                            currentBranch = treeNode.children;
                        }
                    });
                });

            return rootNodes;
        }
    }


    class ClipListsPanel extends PopoutPanel
    {
        private clipListTree: TreeView;
        private clipListSelectedHandler: (evt: ClipList) => void = null;
        private btnAddClipList: Button;

        private navigator: NavigatorPanel;
        private clipListDialog: ClipListDialog;

        constructor(element: any, navigator: NavigatorPanel)
        {
            super(element);
            this.navigator = navigator;

            var html = "<div class='popout-container'>"
                + "<a href='#' id='closeClipListPanelBtn' class='close-button'><span class='catdvicon catdvicon-close_panel'> </span></a>";

            if (catdv.settings.canEditClipLists)
            {
                html += "<a id='btnAddClipList' class='addButton'>Add Clip List</a>";
            }

            html += "<h2>" + catdv.settings.clipListsAlias + "</h2>"
                + "<div id='clipListTree' class='navtree'></div>"
                + "</div>";

            this.$element.html(html);

            this.closePanelBtn = new Button("closeClipListPanelBtn");

            this.clipListTree = new TreeView("clipListTree");

            this.clipListTree.onSelectionChanged((evt) =>
            {
                var selectedNode = this.clipListTree.getSelectedItem();
                if (selectedNode && selectedNode.value && this.clipListSelectedHandler)
                {
                    this.navigator.closePopouts();
                    this.clipListSelectedHandler(selectedNode.value);
                }
            });

            this.clipListTree.onNodeEdit((evt) =>
            {
                this.navigator.closePopouts();
                var clipList = <ClipList>(evt.node.value);
                this.clipListDialog.setClipList(clipList);
                this.clipListDialog.show();
            });

            this.clipListTree.onNodeDelete((evt) =>
            {
                this.navigator.closePopouts();
                var clipList = <ClipList>(evt.node.value);
                MessageBox.confirm("Are you sure you want to delete '" + clipList.name + "'?", () =>
                {
                    $catdv.deleteClipList(clipList.ID, () => this.loadData());
                });
            });

            this.btnAddClipList = new Button("btnAddClipList");
            this.btnAddClipList.onClick((evt) =>
            {
                this.navigator.closePopouts();
                var clipList = { name: "Untitled", groupID: 0 };
                this.clipListDialog.setClipList(clipList);
                this.clipListDialog.show();
            });

            this.clipListDialog = new ClipListDialog("clipListDialog");
            this.clipListDialog.onOK((clipList: ClipList) =>
            {
                $catdv.saveClipList(clipList, () => this.loadData());
            });
        }

        public static create(parent): ClipListsPanel
        {
            return new ClipListsPanel($("<div id='clipListsPanel' class='popout-panel'></div>").appendTo(Element.get$(parent)), parent);
        }

        public onClipListSelected(clipListSelectedHandler: (evt: ClipList) => void)
        {
            this.clipListSelectedHandler = clipListSelectedHandler;
        }

        // Override PopoutPanel.open()
        public open()
        {
            super.open();
            this.clipListTree.setModel([{ name: "Loading.." }]);
            this.loadData();
        }

        private loadData()
        {
            $catdv.getClipLists((clipLists) =>
            {
                this.clipListTree.setModel(TreeBuilder.buildTree(clipLists, "Clip Lists", catdv.settings.canEditClipLists));
            });
        }
    }

    class ClipListDialog extends Modal
    {
        private lblClipListName = new Label("lblClipListName");
        private txtClipListName = new TextBox("txtClipListName");
        private listGroups = new DropDownList("selectClipListGroup");
        private btnClipListDialogOK = new Button("btnClipListDialogOK");

        private clipList: ClipList;

        constructor(element: any)
        {
            super(element);

            this.txtClipListName.onInput((evt) => this.lblClipListName.setText("Clip List: " + this.txtClipListName.getText()));

            this.btnClipListDialogOK.onClick((evt) =>
            {
                this.clipList.name = this.txtClipListName.getText();
                this.clipList.groupID = Number(this.listGroups.getSelectedValue());
                this.close(true, this.clipList);
            });
        }

        public setClipList(clipList: ClipList)
        {
            this.clipList = clipList;
            this.lblClipListName.setText("Clip List: " + clipList.name);
            this.txtClipListName.setText(clipList.name);
            this.listGroups.setSelectedValue(String(clipList.groupID));
        }

        // Override - (to avoid auto-focus logic)
        public show()
        {
            this.$element.modal("show");
        }
    }

    class SmartFoldersPanel extends PopoutPanel
    {
        private smartfolderTree: TreeView;
        private smartFolderSelectedHandler: (evt: SmartFolder) => void = null;
        private btnAddSmartFolder: Button;

        private navigator: NavigatorPanel;
        private smartFolderDialog: SmartFolderDialog;

        constructor(element: any, navigator: NavigatorPanel)
        {
            super(element);
            this.navigator = navigator;

            var html = "<div class='popout-container'>"
                + "<a href='#' id='closeSmartFolderPanelBtn' class='close-button'><span class='catdvicon catdvicon-close_panel'> </span></a>";

            if (catdv.settings.canEditSmartFolders)
            {
                html += "<a id='btnAddSmartFolder' class='addButton'>Add Smart Folder</a>";
            }

            html += "<h2>" + HtmlUtil.escapeHtml(catdv.settings.smartFoldersAlias) + "</h2>"
                + "<div id='smartfolderTree' class='navtree'></div>"
                + "</div>";

            this.$element.html(html);

            this.closePanelBtn = new Button("closeSmartFolderPanelBtn");

            this.smartfolderTree = new TreeView("smartfolderTree");

            this.smartfolderTree.onSelectionChanged((evt) =>
            {
                var selectedNode = this.smartfolderTree.getSelectedItem();
                if (selectedNode && selectedNode.value && this.smartFolderSelectedHandler)
                {
                    this.navigator.closePopouts();
                    this.smartFolderSelectedHandler(selectedNode.value);
                }
            });

            this.smartfolderTree.onNodeEdit((evt) =>
            {
                this.navigator.closePopouts();
                var smartfolder = <SmartFolder>(evt.node.value);
                this.smartFolderDialog.setSmartFolder(smartfolder);
                this.smartFolderDialog.show();
            });

            this.smartfolderTree.onNodeDelete((evt) =>
            {
                this.navigator.closePopouts();
                var smartfolder = <SmartFolder>(evt.node.value);
                MessageBox.confirm("Are you sure you want to delete '" + smartfolder.name + "'?", () =>
                {
                    $catdv.deleteSmartFolder(smartfolder.ID, () => this.loadData());
                });
            });

            this.btnAddSmartFolder = new Button("btnAddSmartFolder");
            this.btnAddSmartFolder.onClick((evt) =>
            {
                this.navigator.closePopouts();
                var smartfolder = { name: "Untitled", groupID: 0, query: { terms: [] } };
                this.smartFolderDialog.setSmartFolder(smartfolder);
                this.smartFolderDialog.show();
            });

            this.smartFolderDialog = new SmartFolderDialog("smartFolderDialog");
            this.smartFolderDialog.onOK((smartfolder: SmartFolder) =>
            {
                $catdv.saveSmartFolder(smartfolder, () => this.loadData());
            });
        }

        public static create(parent): SmartFoldersPanel
        {
            return new SmartFoldersPanel($("<div id='smartFoldersPanel' class='popout-panel'></div>").appendTo(Element.get$(parent)), parent);
        }

        public onSmartFolderSelected(smartFolderSelectedHandler: (evt: SmartFolder) => void)
        {
            this.smartFolderSelectedHandler = smartFolderSelectedHandler;
        }

        // Override PopoutPanel.open()
        public open()
        {
            super.open();
            this.smartfolderTree.setModel([{ name: "Loading.." }]);
            this.loadData();
        }

        private loadData()
        {
            $catdv.getSmartFolders((smartFolders) =>
            {
                this.smartfolderTree.setModel(TreeBuilder.buildTree(smartFolders, "Smart Folders", catdv.settings.canEditSmartFolders));
            });
        }
    }

    class SmartFolderDialog extends Modal
    {
        private lblSmartFolderName = new Label("lblSmartFolderName");
        private txtSmartFolderName = new TextBox("txtSmartFolderName");
        private listGroups = new DropDownList("selectSmartFolderGroup");
        private queryBuilder = new QueryBuilderPanel("smartFolderQueryBuilder");
        private btnSmartFolderDialogOK = new Button("btnSmartFolderDialogOK");

        private smartFolder: SmartFolder;

        constructor(element: any)
        {
            super(element);

            this.txtSmartFolderName.onInput((evt) => this.lblSmartFolderName.setText("Smart Folder: " + this.txtSmartFolderName.getText()));

            this.btnSmartFolderDialogOK.onClick((evt) =>
            {
                this.smartFolder.name = this.txtSmartFolderName.getText();
                this.smartFolder.groupID = Number(this.listGroups.getSelectedValue());
                this.smartFolder.query = this.queryBuilder.getQuery();
                this.close(true, this.smartFolder);
            });
        }

        public setSmartFolder(smartFolder: SmartFolder)
        {
            this.smartFolder = smartFolder;
            this.lblSmartFolderName.setText("Smart Folder: " + smartFolder.name);
            this.txtSmartFolderName.setText(smartFolder.name);
            this.listGroups.setSelectedValue(String(smartFolder.groupID));
            this.queryBuilder.setQuery(smartFolder.query);
        }

        // Override - (to avoid auto-focus logic)
        public show()
        {
            this.$element.modal("show");
        }
    }



    class FiltersPanel extends PopoutPanel
    {
        private txtQuickFilter: TextBox;
        private btnQuickFilter: Button;
        private filterTree: TreeView;
        private filterSelectedHandler: (filter: FilterItem) => void = null;

        private navigator: NavigatorPanel;
        private filteredClipList: FilteredList;

        constructor(element: any, navigator: NavigatorPanel, filteredClipList: FilteredList)
        {
            super(element);
            this.navigator = navigator;
            this.filteredClipList = filteredClipList;

            this.$element.html(
                "<div class='popout-container'>" +
                "<a href='#' id='closeFiltersPanelBtn' class='close-button'><span class='catdvicon catdvicon-close_panel'> </span></a>" +
                "<h2>Filters</h2>" +
                "<div class='input-group'>" +
                "  <input type='text' id='txtQuickFilter' class='form-control searchField'>" +
                "  <span class='input-group-btn'>" +
                "     <button id='btnQuickFilter' class='btn btn-primary btn-search' type='button'><span class='catdvicon catdvicon-search'></span> </button>" +
                "  </span>" +
                "</div>" +
                "<div id='filterTree' class='navtree'></div>" +
                "</div>");

            this.txtQuickFilter = new TextBox("txtQuickFilter");
            this.txtQuickFilter.onChanged((evt) => this.doQuickFilter());
            
            this.btnQuickFilter = new Button("btnQuickFilter");
            this.btnQuickFilter.onClick((evt) => this.doQuickFilter());
            
            this.closePanelBtn = new Button("closeFiltersPanelBtn");

            this.filterTree = new TreeView("filterTree");

            this.filterTree.onSelectionChanged((evt) =>
            {
                var selectedNode = this.filterTree.getSelectedItem();
                if (selectedNode && selectedNode.value && this.filterSelectedHandler)
                {
                    this.navigator.closePopouts();
                    this.filterSelectedHandler(selectedNode.value);
                }
            });
        }

        public static create(parent, filteredClipList: FilteredList): FiltersPanel
        {
            return new FiltersPanel($("<div id='filtersPanel' class='popout-panel'></div>").appendTo(Element.get$(parent)), parent, filteredClipList);
        }

        public onFilterSelected(filterSelectedHandler: (filter: FilterItem) => void)
        {
            this.filterSelectedHandler = filterSelectedHandler;
        }

        // Override PopoutPanel.open()
        public open()
        {
            this.filterTree.setModel([]);
            super.open();
            this.loadData();
        }
        
        private doQuickFilter()
        {
            var filterText = this.txtQuickFilter.getText();
            var filterItem = new FilterItem(
                {
                    field: "logtext",
                    filterOp: "like"
                },
                {
                    name: filterText,
                    value: filterText
                });

            this.navigator.closePopouts();
            this.txtQuickFilter.setText("");
            this.filterSelectedHandler(filterItem);
        }
        
        private loadData()
        {
            this.filteredClipList.getFilters((filters) =>
            {
                this.filterTree.setModel(this.buildFilterTree(filters));
            });
        }

        private buildFilterTree(filters: Filter[]): TreeNode[]
        {
            var rootNodes: TreeNode[] = [];

            filters.forEach((filter) => 
            {
                var filterNode: TreeNode = {
                    name: filter.name,
                    isExpanded: true,
                    //                    isSectionHeader: true,
                    isSelectable: false,
                    value: null
                };

                rootNodes.push(filterNode);
                if (filter.values)
                {
                    filterNode.children = this.buildFilterValueTree(filter, filter.values);
                }
            });
            return rootNodes;
        }

        private buildFilterValueTree(filter: Filter, filterValues: FilterValue[])
        {
            var treeNodes: TreeNode[] = [];

            filterValues.forEach((filterValue) => 
            {
                var filterItem = new FilterItem(filter, filterValue);

                var filterNode: TreeNode = {
                    name: filterItem.name,
                    isExpanded: false,
                    //                    isSectionHeader: false,
                    isSelectable: true,
                    value: filterItem
                };

                treeNodes.push(filterNode);
                if (filterValue.childValues)
                {
                    filterNode.children = this.buildFilterValueTree(filter, filterValue.childValues);
                }
            });
            return treeNodes;
        }

    }

    class ActiveFiltersPanel extends Panel
    {
        private activeFilters: FilterValue[] = [];
        private filteredClipList: FilteredList;

        constructor(element: any, navigator: NavigatorPanel, filteredClipList: FilteredList)
        {
            super(element);

            this.filteredClipList = filteredClipList;
            this.loadFilters();
            //            this.$element.html("");
        }

        public static create(clipList: NavigatorPanel, filteredClipList: FilteredList, parent: JQuery): ActiveFiltersPanel
        {
            return new ActiveFiltersPanel($("<div id='activeFiltersPanel'></div>").appendTo(Element.get$(parent)), clipList, filteredClipList);
        }

        public filtersUpdated()
        {
            this.loadFilters();
        }

        private loadFilters()
        {
            var filters = this.filteredClipList.getActveFilters();
            this.$element.empty();
            filters.forEach((filter) =>
            {
                var $btn = $(
                    "<button type='button' class='btn btn-filter'>"
                    + HtmlUtil.escapeHtml(filter.name)
                    + "<span class='catdvicon catdvicon-close'></span>" +
                    "</button>").appendTo(this.$element);
                $btn.on("click", (e) =>
                {
                    this.filteredClipList.removeActiveFilter(filter);
                    return false;
                });
            });
        }
    }

    export interface NavigationEvent
    {
        description?: string;
        clipQuery?: ClipQuery;
    }

    export class NavigatorPanel extends Panel
    {
        private searchPanel: SearchPanel;
        private catalogsPanel: CatalogsPanel;
        private mediaPathsPanel: MediaPathsPanel;
        private smartFoldersPanel: SmartFoldersPanel;
        private clipListsPanel: ClipListsPanel;
        private filtersPanel: FiltersPanel;
        private activeFiltersPanel: ActiveFiltersPanel;

        private navigationChangedHandler: (item: NavigationEvent) => void = null;

        private allPopoutPanels: PopoutPanel[];
        private filteredClipList: FilteredList = null;
        private currentClipQuery: ClipQuery = null;

        private openPanel: Panel = null;

        constructor(element: any, filteredClipList: FilteredList)
        {
            super(element);

            this.filteredClipList = filteredClipList;

            this.$element.addClass("navigator");

            this.allPopoutPanels = [];

            var $ul = $("<ul class='nav nav-sidebar'>").appendTo(this.$element)

            if (catdv.settings.canSearch || catdv.settings.canSearchAdvanced)
            {
                var $searchMenu = $("<li><a class='menu-item'><span class='catdvicon catdvicon-search'></span> " + catdv.settings.searchAlias + "<span class='catdvicon catdvicon-chevron pull-right'></span></a></li>").appendTo($ul);

                this.searchPanel = SearchPanel.create(this);
                this.searchPanel.onSearch((clipQuery: ClipQuery) =>
                {
                    this.fireNavigationChanged({ clipQuery: clipQuery });
                });
                this.searchPanel.onClose((evt) =>
                {
                    this.togglePanel($searchMenu, this.searchPanel);
                });
                $searchMenu.on("click", (evt) => this.togglePanel($searchMenu, this.searchPanel));
                this.allPopoutPanels.push(this.searchPanel);
            }

            if (catdv.settings.canBrowseByCatalog)
            {
                var $catalogsMenu = $("<li><a class='menu-item'><span class='catdvicon catdvicon-catalogs'></span> " + catdv.settings.catalogsAlias + "<span class='catdvicon catdvicon-chevron pull-right'></span></a></li>").appendTo($ul);

                this.catalogsPanel = CatalogsPanel.create(this);
                this.catalogsPanel.onCatalogSelected((catalog: Catalog) =>
                {
                    this.fireNavigationChanged({ clipQuery: { title: catdv.settings.catalogAlias + ": " + catalog.name, catalog: catalog } });
                    if (this.searchPanel) this.searchPanel.clearSearch();
                });
                this.catalogsPanel.onClose((evt) =>
                {
                    this.togglePanel($catalogsMenu, this.catalogsPanel);
                });
                $catalogsMenu.on("click", (evt) => this.togglePanel($catalogsMenu, this.catalogsPanel));
                this.allPopoutPanels.push(this.catalogsPanel);
            }

            if (catdv.settings.canBrowseByMediaPath)
            {
                var $mediaPathsMenu = $("<li><a class='menu-item'><span class='catdvicon catdvicon-media_paths'></span> Media Path<span class='catdvicon catdvicon-chevron pull-right'></span></a></li>").appendTo($ul);

                this.mediaPathsPanel = MediaPathsPanel.create(this);
                this.mediaPathsPanel.onMediaPathQuery((query: QueryDefinition, queryDescription: string) =>
                {
                    this.fireNavigationChanged({ clipQuery: { title: queryDescription, queryDef: query } });
                    if (this.searchPanel) this.searchPanel.clearSearch();
                });
                this.mediaPathsPanel.onClose((evt) =>
                {
                    this.togglePanel($mediaPathsMenu, this.mediaPathsPanel);
                });
                $mediaPathsMenu.on("click", (evt) => this.togglePanel($mediaPathsMenu, this.mediaPathsPanel));
                this.allPopoutPanels.push(this.mediaPathsPanel);
            }

            if (ServerSettings.isEnterpriseServer && catdv.settings.canBrowseSmartFolders)
            {
                var $smartFoldersMenu = $("<li><a class='menu-item'><span class='catdvicon catdvicon-saved_queries'></span> " + catdv.settings.smartFoldersAlias + "<span class='catdvicon catdvicon-chevron pull-right'></span></a></li>").appendTo($ul);

                this.smartFoldersPanel = SmartFoldersPanel.create(this);
                this.smartFoldersPanel.onSmartFolderSelected((smartFolder: SmartFolder) =>
                {
                    this.fireNavigationChanged({ clipQuery: { title: catdv.settings.smartFolderAlias + ": " + smartFolder.name, smartFolder: smartFolder } });
                    if (this.searchPanel) this.searchPanel.clearSearch();
                });
                this.smartFoldersPanel.onClose((evt) =>
                {
                    this.togglePanel($smartFoldersMenu, this.smartFoldersPanel);
                });
                $smartFoldersMenu.on("click", (evt) => this.togglePanel($smartFoldersMenu, this.smartFoldersPanel));

                this.allPopoutPanels.push(this.smartFoldersPanel);
            }

            if (ServerSettings.isEnterpriseServer && catdv.settings.canBrowseClipLists)
            {
                var $clipListsMenu = $("<li id='navClipLists'><a class='menu-item'><span class='catdvicon catdvicon-list_view'></span> " + catdv.settings.clipListsAlias + "<span class='catdvicon catdvicon-chevron pull-right'></span></a></li>").appendTo($ul);

                this.clipListsPanel = ClipListsPanel.create(this);
                this.clipListsPanel.onClipListSelected((clipList: ClipList) =>
                {
                    this.fireNavigationChanged({ clipQuery: { title: catdv.settings.clipListAlias + ": " + clipList.name, clipList: clipList } });
                    if (this.searchPanel) this.searchPanel.clearSearch();
                });
                this.clipListsPanel.onClose((evt) =>
                {
                    this.togglePanel($clipListsMenu, this.clipListsPanel);
                });
                $clipListsMenu.on("click", (evt) => this.togglePanel($clipListsMenu, this.clipListsPanel));

                this.allPopoutPanels.push(this.clipListsPanel);
            }

            if (catdv.settings.canFilterResults)
            {
                var $filtersMenu = $("<li display='none'><a class='menu-item'><span class='catdvicon catdvicon-filters'></span> Filters <span class='catdvicon catdvicon-chevron pull-right'></span></a></li>").appendTo($ul);

                this.filtersPanel = FiltersPanel.create(this, filteredClipList);
                this.filtersPanel.onFilterSelected((filter: FilterItem) => 
                {
                    this.filteredClipList.addActiveFilter(filter);
                });
                this.filtersPanel.onClose((evt) =>
                {
                    this.togglePanel($filtersMenu, this.filtersPanel);
                });
                $filtersMenu.on("click", (evt) => this.togglePanel($filtersMenu, this.filtersPanel));

                this.allPopoutPanels.push(this.filtersPanel);

                this.activeFiltersPanel = ActiveFiltersPanel.create(this, filteredClipList, $filtersMenu);
                this.filteredClipList.onQueryChanged((clipQuery: ClipQuery) =>
                {
                    if (clipQuery.queryDef || clipQuery.catalog || clipQuery.smartFolder || clipQuery.clipList)
                    {
                        $filtersMenu.show();
                    }
                    else
                    {
                        $filtersMenu.hide();
                    }
                    this.activeFiltersPanel.filtersUpdated();
                });
            }
        }

        public closePopouts()
        {
            this.allPopoutPanels.forEach((popoutPanel) => popoutPanel.close());
            this.$element.find("li").removeClass("active");
            this.openPanel = null;
        }

        public onNavigationChanged(navigationChangedHandler: (navigationEvent: NavigationEvent) => void)
        {
            this.navigationChangedHandler = navigationChangedHandler;
        }

        private fireNavigationChanged(navigationEvent: NavigationEvent)
        {
            this.currentClipQuery = navigationEvent.clipQuery;
            if (this.navigationChangedHandler)
            {
                this.navigationChangedHandler(navigationEvent);
            }
        }

        private togglePanel($menu: JQuery, panel: PopoutPanel)
        {
            if (panel === this.openPanel)
            {
                this.closePopouts();
            }
            else
            {
                this.closePopouts();
                $menu.addClass("active");
                panel.open();
                this.openPanel = panel;
            }
        }
    }

    export class TreeBuilder
    {
        public static buildTree(namedObjects: NamedObject[], objectName: string, showEditControls: boolean = false, showInSections: boolean = true): TreeNode[]
        {
            var rootNodes: TreeNode[] = [];
            var treeNodesByPath: { [path: string]: TreeNode } = {};

            namedObjects.forEach((namedObject) => 
            {
                // If name is something like "Folder/Subfolder/Catalog.cdv"
                // then path would be "Group/Folder/Subfolder" and name "Catalog.cdv"
                var groupName = namedObject.groupName || (ServerSettings.isEnterpriseServer ? "Public (Anonymous)" : objectName);
                var objectPath = groupName ? groupName + "/" + namedObject.name : namedObject.name;

                // Used to accumulate path from root down to the leaves
                var path = "";
                // branch we are currently adding nodes to - initially root then the child collection of each node down the path
                var currentBranch: TreeNode[] = rootNodes;

                var pathElements = objectPath.split("/");
                pathElements.forEach((pathElement, i) =>
                {
                    var isRootNode = (i == 0);
                    var isLeafNode = (i == pathElements.length - 1)

                    // accumulate path
                    path = path.length > 0 ? path + "/" + pathElement : pathElement;
                    // an object called Foo is distinct from a inner tree-node called Foo of 
                    // an object called Foo/Object - so generate different lookup keys
                    var key = isLeafNode ? path : path + "/";
                    var treeNode = treeNodesByPath[key];
                    if (treeNode == null)
                    {
                        treeNode = {
                            name: pathElement,
                            isExpanded: isRootNode,
                            isSelectable: isLeafNode,
                            hasEditControls: showEditControls && isLeafNode,
                            value: isLeafNode ? namedObject : null,
                            renderer: (showInSections && isRootNode) ? TreeBuilder.renderSectionHeaderNode : null,
                            children: []
                        };

                        currentBranch.push(treeNode);
                        treeNodesByPath[key] = treeNode;
                    }
                    currentBranch = treeNode.children;
                });
            });

            return rootNodes;
        }

        private static renderSectionHeaderNode(treeNode: TreeNode, nodeId: string): string
        {
            return "<span class='nodeLabel'>" + HtmlUtil.escapeHtml(treeNode.name) + "<span class='catdvicon catdvicon-expand pull-right'></span></span>";
        }
    }
}


