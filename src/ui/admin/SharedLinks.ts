module ui.admin
{
    import HtmlUtil = util.HtmlUtil;
    import ServerPagedDataSource = controls.ServerPagedDataSource;
    import DataTable = controls.DataTable;
    import Button = controls.Button;
    import RadioButton = controls.RadioButton;
    import RadioButtonSet = controls.RadioButtonSet;
    import TextBox = controls.TextBox;
    import Label = controls.Label;
    import HyperLink = controls.HyperLink;
    import DropDownList = controls.DropDownList;
    import Modal = controls.Modal;
    import Alert = controls.Alert;
    import MessageBox = controls.MessageBox;

    import $catdv = catdv.RestApi;
    import DateUtil = catdv.DateUtil;
    import SharedLink = catdv.SharedLink;
    import PartialResultSet = catdv.PartialResultSet;
    import ServerSettings = logic.ServerSettings;
    import NavbarLoginMenu = ui.panels.NavbarLoginMenu;

    export class SharedLinksForm
    {
        private sharedLinksTable: DataTable;
        private btnDeleteSharedLink = new Button("btnDeleteSharedLink");
        private btnExpireSharedLink = new Button("btnExpireSharedLink");
        private navbarLoginMenu = new NavbarLoginMenu("navbarLoginMenu");

        private editSharedLinkDialog = new EditSharedLinkDialog("editSharedLinkDialog");
        private viewSharedLinkDialog = new ViewSharedLinkDialog("viewSharedLinkDialog");

        constructor()
        {
            this.sharedLinksTable = new DataTable("sharedLinksTable", {
                columns: [
                    {
                        title: "Asset",
                        dataProp: "assetName",
                        isSortable: true,
                        renderer: (obj: any, val: any) =>
                        {
                            return "<a href='javascript:$page.editSharedLink(" + obj.ID + ")'>" + HtmlUtil.escapeHtml(obj.assetName) + "</a>";
                        }
                    },
                    { title: "Shared By", dataProp: "createdBy" },
                    {
                        title: "Shared Date",
                        dataProp: "createdDate",
                        isSortable: true,
                        renderer: (obj: any, val: any) =>
                        {
                            return DateUtil.format(new Date(Number(val)), ServerSettings.dateTimeFormat);
                        }
                    },
                    {
                        title: "Expires",
                        dataProp: "expiryDate",
                        isSortable: true,
                        renderer: (obj: any, val: any) =>
                        {
                            return DateUtil.format(new Date(Number(val)), ServerSettings.dateTimeFormat);
                        }
                    },
                    {
                        title: "Media Type",
                        dataProp: "mediaType",
                        renderer: (obj: any, val: any) =>
                        {
                            return val === "orig" ? "Original" : "Proxy";
                        }
                    },
                    { 
                        title: "Shared With",
                        dataProp: "sharedWith",
                        isSortable: true,
                    },
                    {
                        title: "Links",
                        dataProp: "ID",
                        renderer: (obj: any, val: any) =>
                        {
                            return "<a href='javascript:$page.viewSharedLink(" + obj.ID + ")'>View Links</a>";
                        }
                    },
                ],
                pagedDataSource: new ServerPagedDataSource((params, callback: (resultSet: PartialResultSet<SharedLink>) => void) =>
                {
                    $catdv.getSharedLinks(params, (resultSet: PartialResultSet<SharedLink>) =>
                    {
                        callback(resultSet);
                    });
                })
            });

            this.editSharedLinkDialog.onOK(() =>
            {
                this.sharedLinksTable.reload();
            });

            this.btnDeleteSharedLink.onClick((evt) =>
            {
                this.deleteSharedLink(this.sharedLinksTable.getSelectedItem());
            });
            
            this.btnExpireSharedLink.onClick((evt) =>
            {
                this.expireSharedLink(this.sharedLinksTable.getSelectedItem());
            });
        }

        public editSharedLink(sharedLinkId: number)
        {
            var selectedSharedLink = this.sharedLinksTable.findItem((o) => { return o.ID == sharedLinkId });
            this.editSharedLinkDialog.setSharedLink(selectedSharedLink);
            this.editSharedLinkDialog.onOK(() =>
            {
                this.sharedLinksTable.reload();
            });
            this.editSharedLinkDialog.show();
        }

        public viewSharedLink(sharedLinkId: number)
        {
            $catdv.getSharedLink(sharedLinkId,  (sharedLink: SharedLink) =>
            {
                this.viewSharedLinkDialog.setSharedLink(sharedLink);
                this.viewSharedLinkDialog.show();
            });
        }

        public expireSharedLink(sharedLink: SharedLink)
        {
            var expiredLink =
                {
                    ID: sharedLink.ID,
                    expiryDate: new Date().getTime() - (60 * 1000)
                };

            $catdv.updateSharedLink(expiredLink,() =>
            {
                   this.sharedLinksTable.reload();
            });
        }
        
       public deleteSharedLink(sharedLink: SharedLink)
        {
            MessageBox.confirm("Are you sure you want to delete '" + sharedLink.assetName + "'", () =>
            {
                $catdv.deleteSharedLink(sharedLink.ID,(reply) =>
                {
                    this.sharedLinksTable.reload();
                });
            });
        }
    }

    class EditSharedLinkDialog extends Modal
    {
        private txtAssetName: TextBox = new TextBox("txtAssetName");
        private txtSharedWith: TextBox = new TextBox("txtSharedWith");
        private rdoDownloadOriginalMedia = new RadioButton("rdoDownloadOriginalMedia");
        private rdoDownloadProxyMedia = new RadioButton("rdoDownloadProxyMedia");
        private rdoDownloadMediaType : RadioButtonSet;
        private txtCreatedBy: TextBox = new TextBox("txtCreatedBy");
        private txtSharedDate: TextBox = new TextBox("txtSharedDate");
        private txtNotes: TextBox = new TextBox("txtNotes");
        private txtExpiryDate: TextBox = new TextBox("txtExpiryDate");
        private btnEditSharedLinkOK: Button = new Button("btnEditSharedLinkOK");

        private sharedLink: SharedLink;

        constructor(elementId: string)
        {
            super(elementId);
            
            this.rdoDownloadMediaType = new RadioButtonSet(
                [this.rdoDownloadOriginalMedia, this.rdoDownloadProxyMedia],
                ["orig", "proxy"],
                "downloadMediaType"
            );

            this.btnEditSharedLinkOK.onClick((evt: any) => this.btnOK_onClick(evt));
            
        }

        public setSharedLink(sharedLink: SharedLink)
        {
            this.sharedLink = sharedLink;

            this.txtAssetName.setText(sharedLink.assetName);
            this.txtSharedWith.setText(sharedLink.sharedWith);
            this.rdoDownloadMediaType.setValue(ServerSettings.canDownloadOriginals ? sharedLink.mediaType || "orig" : "proxy");
            this.rdoDownloadMediaType.setEnabled(ServerSettings.canDownloadOriginals);
            this.txtCreatedBy.setText(sharedLink.createdBy);
            this.txtSharedDate.setText(DateUtil.format(new Date(sharedLink.createdDate), ServerSettings.dateTimeFormat));
            this.txtNotes.setText(sharedLink.notes);
            this.txtExpiryDate.setText(DateUtil.format(new Date(sharedLink.expiryDate), DateUtil.ISO_DATE_FORMAT));
        }

        private btnOK_onClick(evt: any)
        {
            var sharedLink =
                {
                    ID: this.sharedLink.ID,
                    assetName: this.txtAssetName.getText(),
                    sharedWith: this.txtSharedWith.getText(),
                    mediaType: this.rdoDownloadMediaType.getValue(),
                    notes: this.txtNotes.getText(),
                    expiryDate: DateUtil.parse(this.txtExpiryDate.getText(), DateUtil.ISO_DATE_FORMAT).getTime()
                };

            $catdv.updateSharedLink(sharedLink,() =>
            {
                this.close(true);
            });
        }
    }

    class ViewSharedLinkDialog extends Modal 
    {
        private txtViewClipUrl = new Label("txtViewClipUrl");
        private txtDownloadUrl = new Label("txtDownloadUrl");
        private lnkEmailLinks = new HyperLink("lnkEmailLinks");

        constructor(element: any)
        {
            super(element);
        }

        public setSharedLink(sharedLink: SharedLink)
        {
            this.txtViewClipUrl.setText(sharedLink.viewUrl);
            this.txtDownloadUrl.setText(sharedLink.downloadUrl);

            var message = sharedLink.notes + "\n\n"
                + "'" + sharedLink.assetName + "'\n"
                + "View Clip: " + sharedLink.viewUrl + "\n"
                + "Download Clip: " + sharedLink.downloadUrl + "\n";

            this.lnkEmailLinks.setHREF("mailto://" + sharedLink.sharedWith
                + "?subject=" + encodeURIComponent(sharedLink.assetName)
                + "&body=" + encodeURIComponent(message));

            this.lnkEmailLinks.setText("mailto://" + sharedLink.sharedWith);
        }
    }

}


