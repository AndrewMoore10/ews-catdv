module ui
{
    import $catdv = catdv.RestApi;
    import TextBox = controls.TextBox;
    import Button = controls.Button;
    import RadioButton = controls.RadioButton;
    import RadioButtonSet = controls.RadioButtonSet;
    import TreeView = controls.TreeView;
    import Label = controls.Label;
    import Modal = controls.Modal;
    import MessageBox = controls.MessageBox;

    import Clip = catdv.Clip;
    import PartialResultSet = catdv.PartialResultSet;
    import QueryDefinition = catdv.QueryDefinition;
    import ServerCommand = catdv.ServerCommand;
    import CommandResults = catdv.CommandResults;
    import ClipQuery = catdv.ClipQuery;
    import ClipList = catdv.ClipList;
    import Platform = util.Platform;

    import HtmlUtil = util.HtmlUtil;

    import ClipManager = logic.ClipManager;
    import ServerPluginManager = logic.ServerCommandManager;
    import ServerCommandMenu = logic.ServerCommandMenu;
    import Config = logic.Config;
    import ServerSettings = logic.ServerSettings;

    import NavigatorPanel = ui.panels.NavigatorPanel;
    import NavigationEvent = ui.panels.NavigationEvent;
    import SelectModeChangedEvent = ui.panels.SelectModeChangedEvent;
    import ClipsPanel = ui.panels.ClipsPanel;
    import ViewControls = ui.panels.ViewControls;
    import QueryBuilder = ui.panels.QueryBuilderPanel;
    import NavbarLoginMenu = ui.panels.NavbarLoginMenu;
    import TreeBuilder = ui.panels.TreeBuilder;

    export class SearchPage
    {
        private btnFileUpload = new Button("btnFileUpload");
        private btnSelectMode = new Button("btnSelectMode");
        private btnSelectAll = new Button("btnSelectAll");
        private btnCancelSelect = new Button("btnCancelSelect");
        private btnAddToBasket = new Button("btnAddToBasket");
        private btnAddToList = new Button("btnAddToList");
        private btnEditClips = new Button("btnEditClips");
        private btnCreateSequence = new Button("btnCreateSequence");
        private btnDeleteClip = new Button("btnDeleteClip");
        private btnRemoveClip = new Button("btnRemoveClip");
        private btnFCPExport = new Button("btnFCPExport");

        private serverCommandMenu = new ServerCommandMenu("menuServerCommands");
        private navbarLoginMenu = new NavbarLoginMenu("navbarLoginMenu");

        private lblListTitle = new Label("listTitle");

        private viewControls: ViewControls = null;
        private clipsPanel: ClipsPanel = null;
        private navigator: NavigatorPanel = null;

        private currentQuery: ClipQuery = null;

        private createSequenceDialog = new CreateSequenceDialog("createSequenceDialog");
        private addToClipListDialog = new AddToClipListDialog("addToClipListDialog");

        constructor()
        {
            this.clipsPanel = new ClipsPanel("clipListPanel", Config.viewClipUrl, "ui.SearchPage");
            this.viewControls = new ViewControls("viewControls", this.clipsPanel, Config.viewClipUrl);
            this.navigator = new NavigatorPanel("navigatorPanel", this.clipsPanel);

            this.clipsPanel.onQueryChanged((clipQuery: ClipQuery) =>
            {
                this.currentQuery = clipQuery;
                var isClipListQuery = (clipQuery.clipList != null);
                this.btnRemoveClip.show(isClipListQuery);
                this.btnDeleteClip.show(!isClipListQuery);
                this.setListTitle(clipQuery.title, clipQuery.cached);
            });

            this.clipsPanel.onSelectModeChanged((evt: SelectModeChangedEvent) => 
            {
                this.btnSelectMode.show(!evt.selectMode);
                this.btnCancelSelect.show(evt.selectMode);
                this.btnSelectAll.show(evt.selectMode);
            });

            this.navigator.onNavigationChanged((evt: NavigationEvent) =>
            {
                this.clipsPanel.setClipQuery(evt.clipQuery);
            });

            this.btnFileUpload.onClick((evt) =>
            {
                if (Platform.isOldIE())
                {
                    window.open("simpleUpload.jsp", "Upload", "width=400,height=350");
                }
                else
                {
                    window.open("uploadFiles.jsp", "Upload", "width=600,height=600");
                }
            });

            this.btnSelectMode.onClick((evt) => 
            {
                this.clipsPanel.setSelectMode(true);
            });

            this.btnCancelSelect.onClick((evt) => 
            {
                this.clipsPanel.setSelectMode(false);
            });

            this.btnSelectAll.onClick((evt) => 
            {
                this.clipsPanel.selectAll();
            });

            this.btnAddToBasket.onClick((evt) => 
            {
                var selectedClips = this.clipsPanel.getSelectedClips();
                var selectedElementIDs = this.clipsPanel.getSelectedElementIDs();
                selectedElementIDs.forEach((elementID) =>
                {
                    $(elementID).effect("transfer", { to: "#btnClipBasket", className: "ui-effects-transfer" }, 600);
                });
                var clipIds = selectedClips.map((clip) => clip.ID);
                $catdv.addToBasket(clipIds, (result) =>
                {
                    this.updateNumBasketItems(result.items.length);
                });
                this.clipsPanel.toggleSelectMode();
             });

            this.btnAddToList.onClick((evt) => 
            {
                this.addToClipListDialog.show();
            });
            this.addToClipListDialog.onOK((clipListID: number) =>
            {
                var selectedClipIDs = this.clipsPanel.getSelectedClips().map((clip) => clip.ID);
                var selectedElementIDs = this.clipsPanel.getSelectedElementIDs();
                selectedElementIDs.forEach((elementID) =>
                {
                    $(elementID).effect("transfer", { to: "#navClipLists", className: "ui-effects-transfer" }, 600);
                });
                $catdv.addToClipList(clipListID, selectedClipIDs, () =>
                {
                });
            });

            this.btnEditClips.onClick((evt) => 
            {
                var selectedClips = this.clipsPanel.getSelectedClips();
                if (selectedClips.length > 1)
                {
                    document.location.href = "clip-details.jsp?ids=[" + selectedClips.map((clip) => clip.ID).join(",") + "]";
                }
                else
                {
                    document.location.href = "clip-details.jsp?id=" + selectedClips[0].ID;
                }
            });

            this.btnCreateSequence.onClick((evt) =>
            {
                this.createSequenceDialog.show();
            });

            this.createSequenceDialog.onOK((name: string, useSelection: boolean) =>
            {
                var selectedClips = this.clipsPanel.getSelectedClips();
                ClipManager.createSequence(name, useSelection, selectedClips, (savedSequence: Clip) =>
                {
                    document.location.href = "seq-edit.jsp?id=" + savedSequence.ID;
                });
            });

            this.btnDeleteClip.onClick((evt) =>
            {
                this.deleteSelectedClips();
            });

            this.btnRemoveClip.onClick((evt) =>
            {
                var clips = this.clipsPanel.getSelectedClips();
                var msg = "Are you sure you want to remove ";
                msg += (clips.length > 1) ? "these " + clips.length + " clips " : "'" + clips[0].name + "'";
                msg += "from clip list '" + this.currentQuery.clipList.name + "'?";
                MessageBox.confirm(msg, () =>
                {
                    $catdv.removeFromClipList(this.currentQuery.clipList.ID, clips.map((clip) => clip.ID), () =>
                    {
                        this.clipsPanel.reload(0, false);
                    });
                });
            });


            this.btnFCPExport.onClick((evt) =>
            {
                ClipManager.exportFCPXML(this.clipsPanel.getSelectedClips());
            });

            this.serverCommandMenu.onClick((serverCommand: ServerCommand) =>
            {
                var selectedClipIDs = this.clipsPanel.getSelectedClips().map((clip) => clip.ID);
                ServerPluginManager.performCommand(serverCommand, selectedClipIDs, (result: CommandResults) =>
                {
                    if ((result.clipIDs != null) && (result.clipIDs.length > 0))
                    {
                        var clipIDs = result.clipIDs.map((a) => String(a)).reduce((a, b) => a + "," + b);
                        this.clipsPanel.setClipQuery({
                            title: "Results:" + serverCommand.name,
                            queryDef: { terms: [{ field: "clip.id", op: "isOneOf", params: clipIDs }] }
                        });
                    }
                    else
                    {
                        this.clipsPanel.reload();
                    }
                });
                this.clipsPanel.setSelectMode(false);
            });
            
            $catdv.getNumBasketItems((numBasketItems) => this.updateNumBasketItems(numBasketItems));
            
 
            // Set up showing/hiding hamburger menu on resize
            $(window).resize((evt) => this.updateActionButtons());
            
            // Do initial layout
            this.updateActionButtons();
 
            // Collapse hamburger menu if user clicks elsewhere
            $(document).on("click", () =>
            {
                if (!$("#action-buttons").is(".collapse"))
                {
                    $("#action-buttons").collapse("hide");
                }
            });

        }

        private updateActionButtons()
        {
            var numActionButtons = $("footer ul.action-buttons li").length;
            var buttonWidth = numActionButtons * 120;
            var windowWidth = $(window).width();
            if (buttonWidth > (windowWidth - 550))
            {
                $("footer").addClass("compact").removeClass("full");
                $("footer ul.action-buttons").addClass("collapse").removeClass("in");
            }
            else
            {
                $("footer").removeClass("compact").addClass("full");;
                $("footer ul.action-buttons").removeClass("collapse");
            }
        }
            
        private deleteSelectedClips()
        {
            var selectedClips = this.clipsPanel.getSelectedClips();
            if (selectedClips.length == 1)
            {
                var clip = selectedClips[0];
                MessageBox.confirm("Are you sure you want to delete '" + clip.name + "'?\nThis action cannot be undone.", () =>
                {
                    $catdv.deleteClip(clip.ID, () =>
                    {
                        this.clipsPanel.reload(0, false);
                    });
                });
            }
            else if (selectedClips.length > 1)
            {
                MessageBox.confirm("Are you sure you want to delete '" + selectedClips.length + "' clips?\nThis action cannot be undone.", () =>
                {
                    var results = 0;
                    var errors: string = "";
                    selectedClips.forEach((selectedClip) =>
                    {
                        $catdv.deleteClip(selectedClip.ID,
                            () =>
                            {
                                this.clipsPanel.reload(0, false);
                                if ((++results == selectedClips.length) && errors) alert(errors);
                            },
                            (status: String, error: String) => 
                            {
                                errors += error + "\n";
                                if ((++results == selectedClips.length) && errors) alert(errors);
                            });
                    });
                });
            }
        }

        private setListTitle(listTitle: string, cached: boolean = false)
        {
            var listTitle = listTitle || "Clips";
            var colonIndex = listTitle.indexOf(":");
            if (colonIndex != -1)
            {
                listTitle = listTitle.substr(0, colonIndex)
                    + "<span>" + HtmlUtil.escapeHtml(listTitle.substr(colonIndex + 1)) + "</span>";
            }
            if (cached)
            {
                listTitle += ".";
            }
            this.lblListTitle.$element.html(listTitle);
        }

        private updateNumBasketItems(numBasketItems: number)
        {
            $("#numBasketItemsBadge").text(numBasketItems > 0 ? String(numBasketItems) : "");
        }

    }


    class CreateSequenceDialog extends Modal 
    {
        private txtSequenceName = new TextBox("txtSequenceName");
        private rdoUseWholeClip = new RadioButton("rdoUseWholeClip");
        private rdoUseSelection = new RadioButton("rdoUseSelection");

        private btnCreateSequenceDialogOK = new Button("btnCreateSequenceDialogOK");

        constructor(element: any)
        {
            super(element);

            this.btnCreateSequenceDialogOK.onClick((evt) =>
            {
                if (!this.txtSequenceName.getText()) 
                {
                    alert("Name required");
                }
                else
                {
                    this.close(true, this.txtSequenceName.getText(), this.rdoUseSelection.isSelected());
                }
            });
        }
    }

    class AddToClipListDialog extends Modal 
    {
        private rdoCreateClipList = new RadioButton("rdoCreateClipList");
        private rdoAddToClipList = new RadioButton("rdoAddToClipList");
        private newOrExistingClipsList = new RadioButtonSet([this.rdoCreateClipList, this.rdoAddToClipList],["new","existing"], "newOrExistingClipList");
        private txtNewClipListName = new TextBox("txtNewClipListName");
        private clipListTree = new TreeView("treeAddToClipList");

        private btnAddToClipListDialogOK = new Button("btnAddToClipListDialogOK");

        constructor(element: any)
        {
            super(element);

            this.newOrExistingClipsList.onChanged((evt) => this.updateControls());
            this.txtNewClipListName.onInput((evt) => this.updateControls());
            this.clipListTree.onSelectionChanged((evt) => this.updateControls());
            
            this.btnAddToClipListDialogOK.onClick((evt) =>
            {
                if (this.newOrExistingClipsList.getValue() == "new")
                {
                    var clipList = {
                        name: this.txtNewClipListName.getText(),
                        groupID: 0
                    };
                    $catdv.saveClipList(clipList, (clipListID) =>
                    {
                        super.close(true, clipListID);
                    });
                }
                else
                {
                    var selectedNode = this.clipListTree.getSelectedItem();
                    if (selectedNode != null)
                    {
                        var selectedClipList: ClipList = selectedNode.value;
                        super.close(true, selectedClipList.ID);
                    }
                    else
                    {
                        super.close(false);
                    }
                }
            });

            this.rdoCreateClipList.setSelected(true);
            
            this.updateControls();
        }

        public show()
        {
            super.show();

            $catdv.getClipLists((clipLists) =>
            {
                this.clipListTree.setModel(TreeBuilder.buildTree(clipLists, "Clip Lists", false, false));
            });
        }

        private updateControls()
        {
            if (this.newOrExistingClipsList.getValue() == "new")
            {
                this.txtNewClipListName.setEnabled(true);
                this.clipListTree.setEnabled(false);
                this.btnAddToClipListDialogOK.setEnabled(this.txtNewClipListName.getText().length > 0);
            }
            else
            {
                this.txtNewClipListName.setEnabled(false);
                this.clipListTree.setEnabled(true);
                this.btnAddToClipListDialogOK.setEnabled(this.clipListTree.getSelectedItem() != null);
            }
        }
    }
    
}