var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var ui;
(function (ui) {
    var panels;
    (function (panels) {
        var HtmlUtil = util.HtmlUtil;
        var Element = controls.Element;
        var Panel = controls.Panel;
        var Label = controls.Label;
        var TreeView = controls.TreeView;
        var Button = controls.Button;
        var TextBox = controls.TextBox;
        var ComboBox = controls.ComboBox;
        var Modal = controls.Modal;
        var DropDownList = controls.DropDownList;
        var MessageBox = controls.MessageBox;
        var Console = controls.Console;
        var SimpleServerDataSource = controls.SimpleServerDataSource;
        var $catdv = catdv.RestApi;
        var FilterItem = logic.FilterItem;
        var FieldSettingsManager = logic.FieldSettingsManager;
        var ClientSettings = logic.ClientSettings;
        var ServerSettings = logic.ServerSettings;
        var ServerCommandManager = logic.ServerCommandManager;
        var PopoutPanel = (function (_super) {
            __extends(PopoutPanel, _super);
            function PopoutPanel(element) {
                var _this = this;
                _super.call(this, element);
                this.backgroundClickHandler = null;
                this.popupVisible = false;
                this.closeHandler = null;
                if (PopoutPanel.$backgroundClickElement == null) {
                    PopoutPanel.$backgroundClickElement = $("<div class='nav-popup-backdrop'>").appendTo(document.body);
                }
                this.backgroundClickHandler = function (evt) {
                    if (_this.popupVisible) {
                        Console.debug("backgroundClickHandler()");
                        if (_this.closeHandler)
                            _this.closeHandler(evt);
                    }
                };
            }
            PopoutPanel.prototype.open = function () {
                Console.debug("PopoutPanel.open()");
                PopoutPanel.$backgroundClickElement.on("click", this.backgroundClickHandler);
                PopoutPanel.$backgroundClickElement.addClass("open");
                this.$element.addClass("open");
                this.popupVisible = true;
            };
            PopoutPanel.prototype.close = function () {
                Console.debug("PopoutPanel.close()");
                PopoutPanel.$backgroundClickElement.off("click", this.backgroundClickHandler);
                PopoutPanel.$backgroundClickElement.removeClass("open");
                this.$element.removeClass("open");
                this.popupVisible = false;
            };
            PopoutPanel.prototype.onClose = function (closeHandler) {
                var _this = this;
                this.closeHandler = closeHandler;
                this.closePanelBtn.onClick(function (evt) {
                    if (_this.closeHandler)
                        _this.closeHandler(evt);
                });
            };
            PopoutPanel.$backgroundClickElement = null;
            return PopoutPanel;
        }(Panel));
        var SearchPanel = (function (_super) {
            __extends(SearchPanel, _super);
            function SearchPanel(element, navigator) {
                var _this = this;
                _super.call(this, element);
                this.advancedSearchForm = null;
                this.simpleSearchForm = null;
                this.customSearchForm = null;
                this.searchCommand = null;
                this.searchArgumentForm = null;
                this.searchHandler = null;
                this.advancedSearchMode = false;
                this.navigator = navigator;
                this.simpleSearchField = ServerSettings.simpleSearchField;
                var html = "<div class='popout-container'>" +
                    " <a href='#' id='closeSearchPanelBtn' class='close-button'><span class='catdvicon catdvicon-close_panel'> </span></a>" +
                    " <h2>" + HtmlUtil.escapeHtml(catdv.settings.searchAlias) + "</h2>" +
                    " <div id='simpleSearchContainer'>";
                if (catdv.settings.canSearchAdvanced) {
                    html += "<a href='#' id='btnAdvancedSearch' class='btn btn-link'>Advanced Search <span class='glyphicon glyphicon-search'> </span> </a>";
                }
                html += " <div class='input-group'>";
                if (ServerSettings.isPegasusServer) {
                    html += "   <select id='cboSearch' class='form-control searchField'></select>";
                }
                else {
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
                if (catdv.settings.canSearchAdvanced) {
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
                if (ServerSettings.isPegasusServer) {
                    var suggestDataSource = new SimpleServerDataSource(function (params, callback) {
                        if (params.filter && params.filter.length > 2) {
                            $catdv.getSuggestions(params.filter, function (results) {
                                callback(results.map(function (result) { return { value: result, text: result }; }));
                            });
                        }
                        else {
                            callback([]);
                        }
                    });
                    this.cboSearch = new ComboBox("cboSearch", suggestDataSource, false, true);
                    this.cboSearch.onChanged(function (evt) { return _this.doSimpleSearch(); });
                }
                else {
                    this.txtSearch = new TextBox("txtSearch");
                    this.txtSearch.onChanged(function (evt) { return _this.doSimpleSearch(); });
                }
                this.btnSearch = new Button("btnSearch");
                this.btnSearch.onClick(function (evt) { return _this.doSimpleSearch(); });
                this.btnSimpleSearch = new Button("btnSimpleSearch");
                this.btnSimpleSearch.onClick(function (evt) {
                    _this.showSimpleOrCustomSearch();
                });
                this.btnRunSimpleSearch = new Button("btnRunSimpleSearch");
                this.btnRunSimpleSearch.onClick(function (evt) { return _this.doSimpleSearch(); });
                this.advancedSearchForm = new panels.QueryBuilderPanel("queryBuilder");
                this.btnAdvancedSearch = new Button("btnAdvancedSearch");
                this.btnAdvancedSearch.onClick(function (evt) {
                    _this.showAdvancedSearch();
                });
                this.btnRunAdvancedSearch = new Button("btnRunAdvancedSearch");
                this.btnRunAdvancedSearch.onClick(function (evt) {
                    _this.navigator.closePopouts();
                    if (_this.searchHandler) {
                        _this.searchHandler({ queryDef: _this.advancedSearchForm.getQuery(), advancedQuery: true, title: null });
                    }
                });
            }
            SearchPanel.create = function (parent) {
                return new SearchPanel($("<div id='searchPanel' class='popout-panel'></div>").appendTo(Element.get$(parent)), parent);
            };
            // Override PopoutPanel.open()
            SearchPanel.prototype.open = function () {
                var _this = this;
                _super.prototype.open.call(this);
                if ((this.simpleSearchForm == null) && (this.customSearchForm == null)) {
                    ServerCommandManager.getCustomSearchCommand(function (searchCommand, argumentForm) {
                        if (searchCommand) {
                            _this.searchCommand = searchCommand;
                            _this.searchArgumentForm = argumentForm;
                            _this.customSearchForm = new panels.ArgumentFormPanel("simpleSearch");
                            _this.customSearchForm.setCommand(searchCommand, argumentForm);
                            _this.$element.addClass("wide");
                            _this.btnRunSimpleSearch.show();
                        }
                        else {
                            _this.simpleSearchForm = new panels.SimpleSearchForm("simpleSearch");
                            _this.simpleSearchForm.load(function (numSearchFormFields) {
                                if (numSearchFormFields > 0) {
                                    _this.btnRunSimpleSearch.show();
                                }
                                else {
                                    _this.btnRunSimpleSearch.hide();
                                }
                            });
                        }
                    });
                }
                this.restoreSavedSearch();
            };
            SearchPanel.prototype.onSearch = function (searchHandler) {
                this.searchHandler = searchHandler;
            };
            SearchPanel.prototype.clearSearch = function () {
                this.showSimpleOrCustomSearch();
                $(".searchField").val("");
                this.advancedSearchForm.clearQuery();
                if (this.simpleSearchForm) {
                    this.simpleSearchForm.clearQueryTerms();
                }
                else if (this.customSearchForm) {
                    this.customSearchForm.setCommand(this.searchCommand, this.searchArgumentForm);
                }
            };
            SearchPanel.prototype.restoreSavedSearch = function () {
                var clipQuery = ClientSettings.getSavedClipQuery();
                if (clipQuery && clipQuery.queryDef && clipQuery.queryDef.terms && (clipQuery.queryDef.terms.length > 0)) {
                    var terms = clipQuery.queryDef.terms;
                    if (terms.length == 0)
                        return;
                    if (clipQuery.advancedQuery) {
                        this.showAdvancedSearch();
                        this.advancedSearchForm.setQuery(clipQuery.queryDef);
                    }
                    else {
                        this.showSimpleOrCustomSearch();
                        if (this.simpleSearchForm) {
                            if (terms[0].field == this.simpleSearchField) {
                                (this.txtSearch || this.cboSearch).setText(terms[0].params);
                                terms = terms.slice(1);
                            }
                            if (terms.length > 0) {
                                this.simpleSearchForm.setQueryTerms(terms);
                            }
                        }
                    }
                }
            };
            SearchPanel.prototype.showAdvancedSearch = function () {
                this.$element.addClass("wide");
                this.simpleSearchContainer.hide();
                this.advancedSearchContainer.show();
                this.advancedSearchMode = true;
            };
            SearchPanel.prototype.showSimpleOrCustomSearch = function () {
                if (this.simpleSearchForm)
                    this.$element.removeClass("wide");
                else
                    this.$element.addClass("wide");
                this.simpleSearchContainer.show();
                this.advancedSearchContainer.hide();
                this.advancedSearchMode = false;
            };
            SearchPanel.prototype.doSimpleSearch = function () {
                var _this = this;
                if (this.searchHandler) {
                    if (this.simpleSearchForm) {
                        var terms = [];
                        var searchText = this.txtSearch ? this.txtSearch.getText().trim() : this.cboSearch.getText();
                        if (searchText) {
                            terms.push({ field: this.simpleSearchField, op: "like", params: searchText });
                        }
                        var searchFormTerms = this.simpleSearchForm.getQueryTerms();
                        if (searchFormTerms.length > 0) {
                            terms = terms.concat(searchFormTerms);
                        }
                        this.searchHandler({
                            title: "Search Results",
                            queryDef: { terms: terms },
                            advancedQuery: false
                        });
                        this.navigator.closePopouts();
                    }
                    else if (this.customSearchForm) {
                        var event = "Search";
                        var args = this.customSearchForm.readArgumentValues(event);
                        ServerCommandManager.executeCommand(this.searchCommand, event, [], args, function (result) {
                            if ((result.clipIDs != null) && (result.clipIDs.length > 0)) {
                                var clipIDs = result.clipIDs.map(function (a) { return String(a); }).reduce(function (a, b) { return a + "," + b; });
                                _this.searchHandler({
                                    title: "Search Results",
                                    queryDef: { terms: [{ field: "clip.id", op: "isOneOf", params: clipIDs }] },
                                    advancedQuery: false
                                });
                            }
                            _this.navigator.closePopouts();
                        });
                    }
                }
            };
            return SearchPanel;
        }(PopoutPanel));
        var CatalogsPanel = (function (_super) {
            __extends(CatalogsPanel, _super);
            function CatalogsPanel(element, navigator) {
                var _this = this;
                _super.call(this, element);
                this.catalogSelectedHandler = null;
                this.model = null;
                this.navigator = navigator;
                var catalogsLabel = (catdv.settings.catalogAlias && catdv.settings.catalogAlias.contains("/")) ? catdv.settings.catalogAlias.split("/")[1] : "Catalogs";
                this.$element.html("<div class='popout-container'>" +
                    "<a href='#' id='closeCatalogsPanelBtn' class='close-button'><span class='catdvicon catdvicon-close_panel'> </span></a>" +
                    "<h2>" + HtmlUtil.escapeHtml(catdv.settings.catalogsAlias) + "</h2><div id='catalogTree' class='navtree'></div>" +
                    "</div>");
                this.closePanelBtn = new Button("closeCatalogsPanelBtn");
                this.catalogTree = new TreeView("catalogTree");
                this.catalogTree.onSelectionChanged(function (evt) {
                    var selectedNode = _this.catalogTree.getSelectedItem();
                    if (selectedNode && selectedNode.value && _this.catalogSelectedHandler) {
                        _this.navigator.closePopouts();
                        _this.catalogSelectedHandler(selectedNode.value);
                    }
                });
            }
            CatalogsPanel.create = function (parent) {
                return new CatalogsPanel($("<div id='catalogsPanel' class='popout-panel'></div>").appendTo(Element.get$(parent)), parent);
            };
            CatalogsPanel.prototype.onCatalogSelected = function (catalogSelectedHandler) {
                this.catalogSelectedHandler = catalogSelectedHandler;
            };
            // Override PopoutPanel.open()
            CatalogsPanel.prototype.open = function () {
                _super.prototype.open.call(this);
                if (this.model == null) {
                    this.catalogTree.setModel([{ name: "Loading..." }]);
                    this.loadData();
                }
            };
            CatalogsPanel.prototype.loadData = function () {
                var _this = this;
                $catdv.getCatalogsBasicInfo(function (catalogs) {
                    _this.model = TreeBuilder.buildTree(catalogs.filter(function (catalog) { return catalog.ID != null; }), "Catalogs");
                    _this.catalogTree.setModel(_this.model);
                });
            };
            return CatalogsPanel;
        }(PopoutPanel));
        var MediaPathsPanel = (function (_super) {
            __extends(MediaPathsPanel, _super);
            function MediaPathsPanel(element, navigator) {
                var _this = this;
                _super.call(this, element);
                this.mediaPathQueryHandler = null;
                this.model = null;
                this.navigator = navigator;
                this.$element.html("<div class='popout-container'>" +
                    "<a href='#' id='closeMediaPathPanelBtn' class='close-button'><span class='catdvicon catdvicon-close_panel'> </span></a>" +
                    "<h2>Media Paths</h2>" +
                    "<div id='mediaPathTree' class='navtree with-root-disclosures'></div>" +
                    "</div>");
                this.closePanelBtn = new Button("closeMediaPathPanelBtn");
                this.mediaPathTree = new TreeView("mediaPathTree");
                this.mediaPathTree.onSelectionChanged(function (evt) {
                    var selectedNode = _this.mediaPathTree.getSelectedItem();
                    if (selectedNode && selectedNode.value && _this.mediaPathQueryHandler) {
                        _this.navigator.closePopouts();
                        _this.mediaPathQueryHandler({ terms: [{ field: "media.fileDir", op: "startsWith", params: selectedNode.value }] }, "Path:" + selectedNode.value);
                    }
                });
            }
            MediaPathsPanel.create = function (parent) {
                return new MediaPathsPanel($("<div id='mediaPathsPanel' class='popout-panel'></div>").appendTo(Element.get$(parent)), parent);
            };
            MediaPathsPanel.prototype.onMediaPathQuery = function (mediaPathQueryHandler) {
                this.mediaPathQueryHandler = mediaPathQueryHandler;
            };
            // Override PopoutPanel.open()
            MediaPathsPanel.prototype.open = function () {
                _super.prototype.open.call(this);
                if (this.model == null) {
                    this.mediaPathTree.setModel([{ name: "Loading..." }]);
                    this.loadData();
                }
            };
            MediaPathsPanel.prototype.loadData = function () {
                var _this = this;
                FieldSettingsManager.getUniqueFieldValues({ ID: "FLD" }, function (paths) {
                    _this.model = _this.buildMediaPathTree(paths);
                    _this.mediaPathTree.setModel(_this.model);
                });
            };
            MediaPathsPanel.prototype.buildMediaPathTree = function (mediaPaths) {
                var rootNodes = [];
                var treeNodesByPath = {};
                mediaPaths
                    .filter(function (mediaPath) { return mediaPath != null; })
                    .sort()
                    .forEach(function (mediaPath) {
                    var pathElements = mediaPath.contains("/") ? mediaPath.split("/") : mediaPath.split("\\");
                    // accumulate path from root down to the leaves
                    var path = "";
                    // position in the mediaPath or the end of the current element so we can extract
                    // the 'real' path for each node in the tree including any prefixes and with the original separators
                    // that are not present in the accumulated path.
                    var p = 0;
                    // branch we are currently adding nodes to - initially root then the child collection of each node down the path
                    var currentBranch = rootNodes;
                    pathElements.forEach(function (pathElement, i) {
                        // ignore blank path elements (UNC paths have a blank first element)
                        if (pathElement) {
                            // accumulate path
                            path = path.length > 0 ? path + "/" + pathElement : pathElement;
                            // update position of pathElement in mediaPath
                            p = mediaPath.indexOf(pathElement, p) + pathElement.length;
                            var treeNode = treeNodesByPath[path];
                            if (treeNode == null) {
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
            };
            return MediaPathsPanel;
        }(PopoutPanel));
        var ClipListsPanel = (function (_super) {
            __extends(ClipListsPanel, _super);
            function ClipListsPanel(element, navigator) {
                var _this = this;
                _super.call(this, element);
                this.clipListSelectedHandler = null;
                this.navigator = navigator;
                var html = "<div class='popout-container'>"
                    + "<a href='#' id='closeClipListPanelBtn' class='close-button'><span class='catdvicon catdvicon-close_panel'> </span></a>";
                if (catdv.settings.canEditClipLists) {
                    html += "<a id='btnAddClipList' class='addButton'>Add Clip List</a>";
                }
                html += "<h2>" + catdv.settings.clipListsAlias + "</h2>"
                    + "<div id='clipListTree' class='navtree'></div>"
                    + "</div>";
                this.$element.html(html);
                this.closePanelBtn = new Button("closeClipListPanelBtn");
                this.clipListTree = new TreeView("clipListTree");
                this.clipListTree.onSelectionChanged(function (evt) {
                    var selectedNode = _this.clipListTree.getSelectedItem();
                    if (selectedNode && selectedNode.value && _this.clipListSelectedHandler) {
                        _this.navigator.closePopouts();
                        _this.clipListSelectedHandler(selectedNode.value);
                    }
                });
                this.clipListTree.onNodeEdit(function (evt) {
                    _this.navigator.closePopouts();
                    var clipList = (evt.node.value);
                    _this.clipListDialog.setClipList(clipList);
                    _this.clipListDialog.show();
                });
                this.clipListTree.onNodeDelete(function (evt) {
                    _this.navigator.closePopouts();
                    var clipList = (evt.node.value);
                    MessageBox.confirm("Are you sure you want to delete '" + clipList.name + "'?", function () {
                        $catdv.deleteClipList(clipList.ID, function () { return _this.loadData(); });
                    });
                });
                this.btnAddClipList = new Button("btnAddClipList");
                this.btnAddClipList.onClick(function (evt) {
                    _this.navigator.closePopouts();
                    var clipList = { name: "Untitled", groupID: 0 };
                    _this.clipListDialog.setClipList(clipList);
                    _this.clipListDialog.show();
                });
                this.clipListDialog = new ClipListDialog("clipListDialog");
                this.clipListDialog.onOK(function (clipList) {
                    $catdv.saveClipList(clipList, function () { return _this.loadData(); });
                });
            }
            ClipListsPanel.create = function (parent) {
                return new ClipListsPanel($("<div id='clipListsPanel' class='popout-panel'></div>").appendTo(Element.get$(parent)), parent);
            };
            ClipListsPanel.prototype.onClipListSelected = function (clipListSelectedHandler) {
                this.clipListSelectedHandler = clipListSelectedHandler;
            };
            // Override PopoutPanel.open()
            ClipListsPanel.prototype.open = function () {
                _super.prototype.open.call(this);
                this.clipListTree.setModel([{ name: "Loading.." }]);
                this.loadData();
            };
            ClipListsPanel.prototype.loadData = function () {
                var _this = this;
                $catdv.getClipLists(function (clipLists) {
                    _this.clipListTree.setModel(TreeBuilder.buildTree(clipLists, "Clip Lists", catdv.settings.canEditClipLists));
                });
            };
            return ClipListsPanel;
        }(PopoutPanel));
        var ClipListDialog = (function (_super) {
            __extends(ClipListDialog, _super);
            function ClipListDialog(element) {
                var _this = this;
                _super.call(this, element);
                this.lblClipListName = new Label("lblClipListName");
                this.txtClipListName = new TextBox("txtClipListName");
                this.listGroups = new DropDownList("selectClipListGroup");
                this.btnClipListDialogOK = new Button("btnClipListDialogOK");
                this.txtClipListName.onInput(function (evt) { return _this.lblClipListName.setText("Clip List: " + _this.txtClipListName.getText()); });
                this.btnClipListDialogOK.onClick(function (evt) {
                    _this.clipList.name = _this.txtClipListName.getText();
                    _this.clipList.groupID = Number(_this.listGroups.getSelectedValue());
                    _this.close(true, _this.clipList);
                });
            }
            ClipListDialog.prototype.setClipList = function (clipList) {
                this.clipList = clipList;
                this.lblClipListName.setText("Clip List: " + clipList.name);
                this.txtClipListName.setText(clipList.name);
                this.listGroups.setSelectedValue(String(clipList.groupID));
            };
            // Override - (to avoid auto-focus logic)
            ClipListDialog.prototype.show = function () {
                this.$element.modal("show");
            };
            return ClipListDialog;
        }(Modal));
        var SmartFoldersPanel = (function (_super) {
            __extends(SmartFoldersPanel, _super);
            function SmartFoldersPanel(element, navigator) {
                var _this = this;
                _super.call(this, element);
                this.smartFolderSelectedHandler = null;
                this.navigator = navigator;
                var html = "<div class='popout-container'>"
                    + "<a href='#' id='closeSmartFolderPanelBtn' class='close-button'><span class='catdvicon catdvicon-close_panel'> </span></a>";
                if (catdv.settings.canEditSmartFolders) {
                    html += "<a id='btnAddSmartFolder' class='addButton'>Add Smart Folder</a>";
                }
                html += "<h2>" + HtmlUtil.escapeHtml(catdv.settings.smartFoldersAlias) + "</h2>"
                    + "<div id='smartfolderTree' class='navtree'></div>"
                    + "</div>";
                this.$element.html(html);
                this.closePanelBtn = new Button("closeSmartFolderPanelBtn");
                this.smartfolderTree = new TreeView("smartfolderTree");
                this.smartfolderTree.onSelectionChanged(function (evt) {
                    var selectedNode = _this.smartfolderTree.getSelectedItem();
                    if (selectedNode && selectedNode.value && _this.smartFolderSelectedHandler) {
                        _this.navigator.closePopouts();
                        _this.smartFolderSelectedHandler(selectedNode.value);
                    }
                });
                this.smartfolderTree.onNodeEdit(function (evt) {
                    _this.navigator.closePopouts();
                    var smartfolder = (evt.node.value);
                    _this.smartFolderDialog.setSmartFolder(smartfolder);
                    _this.smartFolderDialog.show();
                });
                this.smartfolderTree.onNodeDelete(function (evt) {
                    _this.navigator.closePopouts();
                    var smartfolder = (evt.node.value);
                    MessageBox.confirm("Are you sure you want to delete '" + smartfolder.name + "'?", function () {
                        $catdv.deleteSmartFolder(smartfolder.ID, function () { return _this.loadData(); });
                    });
                });
                this.btnAddSmartFolder = new Button("btnAddSmartFolder");
                this.btnAddSmartFolder.onClick(function (evt) {
                    _this.navigator.closePopouts();
                    var smartfolder = { name: "Untitled", groupID: 0, query: { terms: [] } };
                    _this.smartFolderDialog.setSmartFolder(smartfolder);
                    _this.smartFolderDialog.show();
                });
                this.smartFolderDialog = new SmartFolderDialog("smartFolderDialog");
                this.smartFolderDialog.onOK(function (smartfolder) {
                    $catdv.saveSmartFolder(smartfolder, function () { return _this.loadData(); });
                });
            }
            SmartFoldersPanel.create = function (parent) {
                return new SmartFoldersPanel($("<div id='smartFoldersPanel' class='popout-panel'></div>").appendTo(Element.get$(parent)), parent);
            };
            SmartFoldersPanel.prototype.onSmartFolderSelected = function (smartFolderSelectedHandler) {
                this.smartFolderSelectedHandler = smartFolderSelectedHandler;
            };
            // Override PopoutPanel.open()
            SmartFoldersPanel.prototype.open = function () {
                _super.prototype.open.call(this);
                this.smartfolderTree.setModel([{ name: "Loading.." }]);
                this.loadData();
            };
            SmartFoldersPanel.prototype.loadData = function () {
                var _this = this;
                $catdv.getSmartFolders(function (smartFolders) {
                    _this.smartfolderTree.setModel(TreeBuilder.buildTree(smartFolders, "Smart Folders", catdv.settings.canEditSmartFolders));
                });
            };
            return SmartFoldersPanel;
        }(PopoutPanel));
        var SmartFolderDialog = (function (_super) {
            __extends(SmartFolderDialog, _super);
            function SmartFolderDialog(element) {
                var _this = this;
                _super.call(this, element);
                this.lblSmartFolderName = new Label("lblSmartFolderName");
                this.txtSmartFolderName = new TextBox("txtSmartFolderName");
                this.listGroups = new DropDownList("selectSmartFolderGroup");
                this.queryBuilder = new panels.QueryBuilderPanel("smartFolderQueryBuilder");
                this.btnSmartFolderDialogOK = new Button("btnSmartFolderDialogOK");
                this.txtSmartFolderName.onInput(function (evt) { return _this.lblSmartFolderName.setText("Smart Folder: " + _this.txtSmartFolderName.getText()); });
                this.btnSmartFolderDialogOK.onClick(function (evt) {
                    _this.smartFolder.name = _this.txtSmartFolderName.getText();
                    _this.smartFolder.groupID = Number(_this.listGroups.getSelectedValue());
                    _this.smartFolder.query = _this.queryBuilder.getQuery();
                    _this.close(true, _this.smartFolder);
                });
            }
            SmartFolderDialog.prototype.setSmartFolder = function (smartFolder) {
                this.smartFolder = smartFolder;
                this.lblSmartFolderName.setText("Smart Folder: " + smartFolder.name);
                this.txtSmartFolderName.setText(smartFolder.name);
                this.listGroups.setSelectedValue(String(smartFolder.groupID));
                this.queryBuilder.setQuery(smartFolder.query);
            };
            // Override - (to avoid auto-focus logic)
            SmartFolderDialog.prototype.show = function () {
                this.$element.modal("show");
            };
            return SmartFolderDialog;
        }(Modal));
        var FiltersPanel = (function (_super) {
            __extends(FiltersPanel, _super);
            function FiltersPanel(element, navigator, filteredClipList) {
                var _this = this;
                _super.call(this, element);
                this.filterSelectedHandler = null;
                this.navigator = navigator;
                this.filteredClipList = filteredClipList;
                this.$element.html("<div class='popout-container'>" +
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
                this.txtQuickFilter.onChanged(function (evt) { return _this.doQuickFilter(); });
                this.btnQuickFilter = new Button("btnQuickFilter");
                this.btnQuickFilter.onClick(function (evt) { return _this.doQuickFilter(); });
                this.closePanelBtn = new Button("closeFiltersPanelBtn");
                this.filterTree = new TreeView("filterTree");
                this.filterTree.onSelectionChanged(function (evt) {
                    var selectedNode = _this.filterTree.getSelectedItem();
                    if (selectedNode && selectedNode.value && _this.filterSelectedHandler) {
                        _this.navigator.closePopouts();
                        _this.filterSelectedHandler(selectedNode.value);
                    }
                });
            }
            FiltersPanel.create = function (parent, filteredClipList) {
                return new FiltersPanel($("<div id='filtersPanel' class='popout-panel'></div>").appendTo(Element.get$(parent)), parent, filteredClipList);
            };
            FiltersPanel.prototype.onFilterSelected = function (filterSelectedHandler) {
                this.filterSelectedHandler = filterSelectedHandler;
            };
            // Override PopoutPanel.open()
            FiltersPanel.prototype.open = function () {
                this.filterTree.setModel([]);
                _super.prototype.open.call(this);
                this.loadData();
            };
            FiltersPanel.prototype.doQuickFilter = function () {
                var filterText = this.txtQuickFilter.getText();
                var filterItem = new FilterItem({
                    field: "logtext",
                    filterOp: "like"
                }, {
                    name: filterText,
                    value: filterText
                });
                this.navigator.closePopouts();
                this.txtQuickFilter.setText("");
                this.filterSelectedHandler(filterItem);
            };
            FiltersPanel.prototype.loadData = function () {
                var _this = this;
                this.filteredClipList.getFilters(function (filters) {
                    _this.filterTree.setModel(_this.buildFilterTree(filters));
                });
            };
            FiltersPanel.prototype.buildFilterTree = function (filters) {
                var _this = this;
                var rootNodes = [];
                filters.forEach(function (filter) {
                    var filterNode = {
                        name: filter.name,
                        isExpanded: true,
                        //                    isSectionHeader: true,
                        isSelectable: false,
                        value: null
                    };
                    rootNodes.push(filterNode);
                    if (filter.values) {
                        filterNode.children = _this.buildFilterValueTree(filter, filter.values);
                    }
                });
                return rootNodes;
            };
            FiltersPanel.prototype.buildFilterValueTree = function (filter, filterValues) {
                var _this = this;
                var treeNodes = [];
                filterValues.forEach(function (filterValue) {
                    var filterItem = new FilterItem(filter, filterValue);
                    var filterNode = {
                        name: filterItem.name,
                        isExpanded: false,
                        //                    isSectionHeader: false,
                        isSelectable: true,
                        value: filterItem
                    };
                    treeNodes.push(filterNode);
                    if (filterValue.childValues) {
                        filterNode.children = _this.buildFilterValueTree(filter, filterValue.childValues);
                    }
                });
                return treeNodes;
            };
            return FiltersPanel;
        }(PopoutPanel));
        var ActiveFiltersPanel = (function (_super) {
            __extends(ActiveFiltersPanel, _super);
            function ActiveFiltersPanel(element, navigator, filteredClipList) {
                _super.call(this, element);
                this.activeFilters = [];
                this.filteredClipList = filteredClipList;
                this.loadFilters();
                //            this.$element.html("");
            }
            ActiveFiltersPanel.create = function (clipList, filteredClipList, parent) {
                return new ActiveFiltersPanel($("<div id='activeFiltersPanel'></div>").appendTo(Element.get$(parent)), clipList, filteredClipList);
            };
            ActiveFiltersPanel.prototype.filtersUpdated = function () {
                this.loadFilters();
            };
            ActiveFiltersPanel.prototype.loadFilters = function () {
                var _this = this;
                var filters = this.filteredClipList.getActveFilters();
                this.$element.empty();
                filters.forEach(function (filter) {
                    var $btn = $("<button type='button' class='btn btn-filter'>"
                        + HtmlUtil.escapeHtml(filter.name)
                        + "<span class='catdvicon catdvicon-close'></span>" +
                        "</button>").appendTo(_this.$element);
                    $btn.on("click", function (e) {
                        _this.filteredClipList.removeActiveFilter(filter);
                        return false;
                    });
                });
            };
            return ActiveFiltersPanel;
        }(Panel));
        var NavigatorPanel = (function (_super) {
            __extends(NavigatorPanel, _super);
            function NavigatorPanel(element, filteredClipList) {
                var _this = this;
                _super.call(this, element);
                this.navigationChangedHandler = null;
                this.filteredClipList = null;
                this.currentClipQuery = null;
                this.openPanel = null;
                this.filteredClipList = filteredClipList;
                this.$element.addClass("navigator");
                this.allPopoutPanels = [];
                var $ul = $("<ul class='nav nav-sidebar'>").appendTo(this.$element);
                if (catdv.settings.canSearch || catdv.settings.canSearchAdvanced) {
                    var $searchMenu = $("<li><a class='menu-item'><span class='catdvicon catdvicon-search'></span> " + catdv.settings.searchAlias + "<span class='catdvicon catdvicon-chevron pull-right'></span></a></li>").appendTo($ul);
                    this.searchPanel = SearchPanel.create(this);
                    this.searchPanel.onSearch(function (clipQuery) {
                        _this.fireNavigationChanged({ clipQuery: clipQuery });
                    });
                    this.searchPanel.onClose(function (evt) {
                        _this.togglePanel($searchMenu, _this.searchPanel);
                    });
                    $searchMenu.on("click", function (evt) { return _this.togglePanel($searchMenu, _this.searchPanel); });
                    this.allPopoutPanels.push(this.searchPanel);
                }
                if (catdv.settings.canBrowseByCatalog) {
                    var $catalogsMenu = $("<li><a class='menu-item'><span class='catdvicon catdvicon-catalogs'></span> " + catdv.settings.catalogsAlias + "<span class='catdvicon catdvicon-chevron pull-right'></span></a></li>").appendTo($ul);
                    this.catalogsPanel = CatalogsPanel.create(this);
                    this.catalogsPanel.onCatalogSelected(function (catalog) {
                        _this.fireNavigationChanged({ clipQuery: { title: catdv.settings.catalogAlias + ": " + catalog.name, catalog: catalog } });
                        if (_this.searchPanel)
                            _this.searchPanel.clearSearch();
                    });
                    this.catalogsPanel.onClose(function (evt) {
                        _this.togglePanel($catalogsMenu, _this.catalogsPanel);
                    });
                    $catalogsMenu.on("click", function (evt) { return _this.togglePanel($catalogsMenu, _this.catalogsPanel); });
                    this.allPopoutPanels.push(this.catalogsPanel);
                }
                if (catdv.settings.canBrowseByMediaPath) {
                    var $mediaPathsMenu = $("<li><a class='menu-item'><span class='catdvicon catdvicon-media_paths'></span> Media Path<span class='catdvicon catdvicon-chevron pull-right'></span></a></li>").appendTo($ul);
                    this.mediaPathsPanel = MediaPathsPanel.create(this);
                    this.mediaPathsPanel.onMediaPathQuery(function (query, queryDescription) {
                        _this.fireNavigationChanged({ clipQuery: { title: queryDescription, queryDef: query } });
                        if (_this.searchPanel)
                            _this.searchPanel.clearSearch();
                    });
                    this.mediaPathsPanel.onClose(function (evt) {
                        _this.togglePanel($mediaPathsMenu, _this.mediaPathsPanel);
                    });
                    $mediaPathsMenu.on("click", function (evt) { return _this.togglePanel($mediaPathsMenu, _this.mediaPathsPanel); });
                    this.allPopoutPanels.push(this.mediaPathsPanel);
                }
                if (ServerSettings.isEnterpriseServer && catdv.settings.canBrowseSmartFolders) {
                    var $smartFoldersMenu = $("<li><a class='menu-item'><span class='catdvicon catdvicon-saved_queries'></span> " + catdv.settings.smartFoldersAlias + "<span class='catdvicon catdvicon-chevron pull-right'></span></a></li>").appendTo($ul);
                    this.smartFoldersPanel = SmartFoldersPanel.create(this);
                    this.smartFoldersPanel.onSmartFolderSelected(function (smartFolder) {
                        _this.fireNavigationChanged({ clipQuery: { title: catdv.settings.smartFolderAlias + ": " + smartFolder.name, smartFolder: smartFolder } });
                        if (_this.searchPanel)
                            _this.searchPanel.clearSearch();
                    });
                    this.smartFoldersPanel.onClose(function (evt) {
                        _this.togglePanel($smartFoldersMenu, _this.smartFoldersPanel);
                    });
                    $smartFoldersMenu.on("click", function (evt) { return _this.togglePanel($smartFoldersMenu, _this.smartFoldersPanel); });
                    this.allPopoutPanels.push(this.smartFoldersPanel);
                }
                if (ServerSettings.isEnterpriseServer && catdv.settings.canBrowseClipLists) {
                    var $clipListsMenu = $("<li id='navClipLists'><a class='menu-item'><span class='catdvicon catdvicon-list_view'></span> " + catdv.settings.clipListsAlias + "<span class='catdvicon catdvicon-chevron pull-right'></span></a></li>").appendTo($ul);
                    this.clipListsPanel = ClipListsPanel.create(this);
                    this.clipListsPanel.onClipListSelected(function (clipList) {
                        _this.fireNavigationChanged({ clipQuery: { title: catdv.settings.clipListAlias + ": " + clipList.name, clipList: clipList } });
                        if (_this.searchPanel)
                            _this.searchPanel.clearSearch();
                    });
                    this.clipListsPanel.onClose(function (evt) {
                        _this.togglePanel($clipListsMenu, _this.clipListsPanel);
                    });
                    $clipListsMenu.on("click", function (evt) { return _this.togglePanel($clipListsMenu, _this.clipListsPanel); });
                    this.allPopoutPanels.push(this.clipListsPanel);
                }
                if (catdv.settings.canFilterResults) {
                    var $filtersMenu = $("<li display='none'><a class='menu-item'><span class='catdvicon catdvicon-filters'></span> Filters <span class='catdvicon catdvicon-chevron pull-right'></span></a></li>").appendTo($ul);
                    this.filtersPanel = FiltersPanel.create(this, filteredClipList);
                    this.filtersPanel.onFilterSelected(function (filter) {
                        _this.filteredClipList.addActiveFilter(filter);
                    });
                    this.filtersPanel.onClose(function (evt) {
                        _this.togglePanel($filtersMenu, _this.filtersPanel);
                    });
                    $filtersMenu.on("click", function (evt) { return _this.togglePanel($filtersMenu, _this.filtersPanel); });
                    this.allPopoutPanels.push(this.filtersPanel);
                    this.activeFiltersPanel = ActiveFiltersPanel.create(this, filteredClipList, $filtersMenu);
                    this.filteredClipList.onQueryChanged(function (clipQuery) {
                        if (clipQuery.queryDef || clipQuery.catalog || clipQuery.smartFolder || clipQuery.clipList) {
                            $filtersMenu.show();
                        }
                        else {
                            $filtersMenu.hide();
                        }
                        _this.activeFiltersPanel.filtersUpdated();
                    });
                }
            }
            NavigatorPanel.prototype.closePopouts = function () {
                this.allPopoutPanels.forEach(function (popoutPanel) { return popoutPanel.close(); });
                this.$element.find("li").removeClass("active");
                this.openPanel = null;
            };
            NavigatorPanel.prototype.onNavigationChanged = function (navigationChangedHandler) {
                this.navigationChangedHandler = navigationChangedHandler;
            };
            NavigatorPanel.prototype.fireNavigationChanged = function (navigationEvent) {
                this.currentClipQuery = navigationEvent.clipQuery;
                if (this.navigationChangedHandler) {
                    this.navigationChangedHandler(navigationEvent);
                }
            };
            NavigatorPanel.prototype.togglePanel = function ($menu, panel) {
                if (panel === this.openPanel) {
                    this.closePopouts();
                }
                else {
                    this.closePopouts();
                    $menu.addClass("active");
                    panel.open();
                    this.openPanel = panel;
                }
            };
            return NavigatorPanel;
        }(Panel));
        panels.NavigatorPanel = NavigatorPanel;
        var TreeBuilder = (function () {
            function TreeBuilder() {
            }
            TreeBuilder.buildTree = function (namedObjects, objectName, showEditControls, showInSections) {
                if (showEditControls === void 0) { showEditControls = false; }
                if (showInSections === void 0) { showInSections = true; }
                var rootNodes = [];
                var treeNodesByPath = {};
                namedObjects.forEach(function (namedObject) {
                    // If name is something like "Folder/Subfolder/Catalog.cdv"
                    // then path would be "Group/Folder/Subfolder" and name "Catalog.cdv"
                    var groupName = namedObject.groupName || (ServerSettings.isEnterpriseServer ? "Public (Anonymous)" : objectName);
                    var objectPath = groupName ? groupName + "/" + namedObject.name : namedObject.name;
                    // Used to accumulate path from root down to the leaves
                    var path = "";
                    // branch we are currently adding nodes to - initially root then the child collection of each node down the path
                    var currentBranch = rootNodes;
                    var pathElements = objectPath.split("/");
                    pathElements.forEach(function (pathElement, i) {
                        var isRootNode = (i == 0);
                        var isLeafNode = (i == pathElements.length - 1);
                        // accumulate path
                        path = path.length > 0 ? path + "/" + pathElement : pathElement;
                        // an object called Foo is distinct from a inner tree-node called Foo of 
                        // an object called Foo/Object - so generate different lookup keys
                        var key = isLeafNode ? path : path + "/";
                        var treeNode = treeNodesByPath[key];
                        if (treeNode == null) {
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
            };
            TreeBuilder.renderSectionHeaderNode = function (treeNode, nodeId) {
                return "<span class='nodeLabel'>" + HtmlUtil.escapeHtml(treeNode.name) + "<span class='catdvicon catdvicon-expand pull-right'></span></span>";
            };
            return TreeBuilder;
        }());
        panels.TreeBuilder = TreeBuilder;
    })(panels = ui.panels || (ui.panels = {}));
})(ui || (ui = {}));
