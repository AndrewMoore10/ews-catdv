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
        var ServerPagedDataSource = controls.ServerPagedDataSource;
        var DataTable = controls.DataTable;
        var Button = controls.Button;
        var RadioButton = controls.RadioButton;
        var RadioButtonSet = controls.RadioButtonSet;
        var TextBox = controls.TextBox;
        var Label = controls.Label;
        var HyperLink = controls.HyperLink;
        var Modal = controls.Modal;
        var MessageBox = controls.MessageBox;
        var $catdv = catdv.RestApi;
        var DateUtil = catdv.DateUtil;
        var ServerSettings = logic.ServerSettings;
        var NavbarLoginMenu = ui.panels.NavbarLoginMenu;
        var SharedLinksForm = (function () {
            function SharedLinksForm() {
                var _this = this;
                this.btnDeleteSharedLink = new Button("btnDeleteSharedLink");
                this.btnExpireSharedLink = new Button("btnExpireSharedLink");
                this.navbarLoginMenu = new NavbarLoginMenu("navbarLoginMenu");
                this.editSharedLinkDialog = new EditSharedLinkDialog("editSharedLinkDialog");
                this.viewSharedLinkDialog = new ViewSharedLinkDialog("viewSharedLinkDialog");
                this.sharedLinksTable = new DataTable("sharedLinksTable", {
                    columns: [
                        {
                            title: "Asset",
                            dataProp: "assetName",
                            isSortable: true,
                            renderer: function (obj, val) {
                                return "<a href='javascript:$page.editSharedLink(" + obj.ID + ")'>" + HtmlUtil.escapeHtml(obj.assetName) + "</a>";
                            }
                        },
                        { title: "Shared By", dataProp: "createdBy" },
                        {
                            title: "Shared Date",
                            dataProp: "createdDate",
                            isSortable: true,
                            renderer: function (obj, val) {
                                return DateUtil.format(new Date(Number(val)), ServerSettings.dateTimeFormat);
                            }
                        },
                        {
                            title: "Expires",
                            dataProp: "expiryDate",
                            isSortable: true,
                            renderer: function (obj, val) {
                                return DateUtil.format(new Date(Number(val)), ServerSettings.dateTimeFormat);
                            }
                        },
                        {
                            title: "Media Type",
                            dataProp: "mediaType",
                            renderer: function (obj, val) {
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
                            renderer: function (obj, val) {
                                return "<a href='javascript:$page.viewSharedLink(" + obj.ID + ")'>View Links</a>";
                            }
                        },
                    ],
                    pagedDataSource: new ServerPagedDataSource(function (params, callback) {
                        $catdv.getSharedLinks(params, function (resultSet) {
                            callback(resultSet);
                        });
                    })
                });
                this.editSharedLinkDialog.onOK(function () {
                    _this.sharedLinksTable.reload();
                });
                this.btnDeleteSharedLink.onClick(function (evt) {
                    _this.deleteSharedLink(_this.sharedLinksTable.getSelectedItem());
                });
                this.btnExpireSharedLink.onClick(function (evt) {
                    _this.expireSharedLink(_this.sharedLinksTable.getSelectedItem());
                });
            }
            SharedLinksForm.prototype.editSharedLink = function (sharedLinkId) {
                var _this = this;
                var selectedSharedLink = this.sharedLinksTable.findItem(function (o) { return o.ID == sharedLinkId; });
                this.editSharedLinkDialog.setSharedLink(selectedSharedLink);
                this.editSharedLinkDialog.onOK(function () {
                    _this.sharedLinksTable.reload();
                });
                this.editSharedLinkDialog.show();
            };
            SharedLinksForm.prototype.viewSharedLink = function (sharedLinkId) {
                var _this = this;
                $catdv.getSharedLink(sharedLinkId, function (sharedLink) {
                    _this.viewSharedLinkDialog.setSharedLink(sharedLink);
                    _this.viewSharedLinkDialog.show();
                });
            };
            SharedLinksForm.prototype.expireSharedLink = function (sharedLink) {
                var _this = this;
                var expiredLink = {
                    ID: sharedLink.ID,
                    expiryDate: new Date().getTime() - (60 * 1000)
                };
                $catdv.updateSharedLink(expiredLink, function () {
                    _this.sharedLinksTable.reload();
                });
            };
            SharedLinksForm.prototype.deleteSharedLink = function (sharedLink) {
                var _this = this;
                MessageBox.confirm("Are you sure you want to delete '" + sharedLink.assetName + "'", function () {
                    $catdv.deleteSharedLink(sharedLink.ID, function (reply) {
                        _this.sharedLinksTable.reload();
                    });
                });
            };
            return SharedLinksForm;
        }());
        admin.SharedLinksForm = SharedLinksForm;
        var EditSharedLinkDialog = (function (_super) {
            __extends(EditSharedLinkDialog, _super);
            function EditSharedLinkDialog(elementId) {
                var _this = this;
                _super.call(this, elementId);
                this.txtAssetName = new TextBox("txtAssetName");
                this.txtSharedWith = new TextBox("txtSharedWith");
                this.rdoDownloadOriginalMedia = new RadioButton("rdoDownloadOriginalMedia");
                this.rdoDownloadProxyMedia = new RadioButton("rdoDownloadProxyMedia");
                this.txtCreatedBy = new TextBox("txtCreatedBy");
                this.txtSharedDate = new TextBox("txtSharedDate");
                this.txtNotes = new TextBox("txtNotes");
                this.txtExpiryDate = new TextBox("txtExpiryDate");
                this.btnEditSharedLinkOK = new Button("btnEditSharedLinkOK");
                this.rdoDownloadMediaType = new RadioButtonSet([this.rdoDownloadOriginalMedia, this.rdoDownloadProxyMedia], ["orig", "proxy"], "downloadMediaType");
                this.btnEditSharedLinkOK.onClick(function (evt) { return _this.btnOK_onClick(evt); });
            }
            EditSharedLinkDialog.prototype.setSharedLink = function (sharedLink) {
                this.sharedLink = sharedLink;
                this.txtAssetName.setText(sharedLink.assetName);
                this.txtSharedWith.setText(sharedLink.sharedWith);
                this.rdoDownloadMediaType.setValue(ServerSettings.canDownloadOriginals ? sharedLink.mediaType || "orig" : "proxy");
                this.rdoDownloadMediaType.setEnabled(ServerSettings.canDownloadOriginals);
                this.txtCreatedBy.setText(sharedLink.createdBy);
                this.txtSharedDate.setText(DateUtil.format(new Date(sharedLink.createdDate), ServerSettings.dateTimeFormat));
                this.txtNotes.setText(sharedLink.notes);
                this.txtExpiryDate.setText(DateUtil.format(new Date(sharedLink.expiryDate), DateUtil.ISO_DATE_FORMAT));
            };
            EditSharedLinkDialog.prototype.btnOK_onClick = function (evt) {
                var _this = this;
                var sharedLink = {
                    ID: this.sharedLink.ID,
                    assetName: this.txtAssetName.getText(),
                    sharedWith: this.txtSharedWith.getText(),
                    mediaType: this.rdoDownloadMediaType.getValue(),
                    notes: this.txtNotes.getText(),
                    expiryDate: DateUtil.parse(this.txtExpiryDate.getText(), DateUtil.ISO_DATE_FORMAT).getTime()
                };
                $catdv.updateSharedLink(sharedLink, function () {
                    _this.close(true);
                });
            };
            return EditSharedLinkDialog;
        }(Modal));
        var ViewSharedLinkDialog = (function (_super) {
            __extends(ViewSharedLinkDialog, _super);
            function ViewSharedLinkDialog(element) {
                _super.call(this, element);
                this.txtViewClipUrl = new Label("txtViewClipUrl");
                this.txtDownloadUrl = new Label("txtDownloadUrl");
                this.lnkEmailLinks = new HyperLink("lnkEmailLinks");
            }
            ViewSharedLinkDialog.prototype.setSharedLink = function (sharedLink) {
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
            };
            return ViewSharedLinkDialog;
        }(Modal));
    })(admin = ui.admin || (ui.admin = {}));
})(ui || (ui = {}));
