var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var controls;
(function (controls) {
    var HtmlUtil = util.HtmlUtil;
    var Control = controls.Control;
    var Accordian = (function (_super) {
        __extends(Accordian, _super);
        function Accordian(element) {
            _super.call(this, element);
            this.items = [];
            this.$element.addClass("panel-group");
        }
        Accordian.prototype.clear = function () {
            this.$element.empty();
        };
        Accordian.prototype.addItem = function (title, expanded) {
            var itemId = this.elementId + "_" + (this.items.length + 1);
            var html = "";
            html += "<div class='panel panel-default'>";
            html += "  <div class='panel-heading'>";
            html += "    <h4 class='panel-title'>";
            html += "      <a data-toggle='collapse' data-parent='#" + this.elementId + "' href='#" + itemId + "'>";
            html += title;
            html += "      </a>";
            html += "    </h4>";
            html += "  </div>";
            html += "  <div id='" + itemId + "' class='panel-collapse " + (expanded ? "in" : "collapse") + "'>";
            html += "    <div id='" + itemId + "_body' class='panel-body'>";
            html += "    </div>";
            html += "  </div>";
            html += "</div>";
            this.$element.append(html);
            var $body = $("#" + itemId + "_body");
            this.items.push({ id: itemId, title: title, $body: $body });
            return $body;
        };
        return Accordian;
    }(Control));
    controls.Accordian = Accordian;
    // TODO - THIS DOESN'T WORK PROPERLY - NEED TO REFER BACK TO SAMPLE CODE TO FIX IT
    //    export class Popover extends Control
    //    {
    //        // Save reference to handler so we can wire/unwire it as required
    //        private backgroundClickHandler: (evt: any) => void = null;
    //
    //        constructor(element: any)
    //        {
    //            super(element);
    //
    //            this.backgroundClickHandler = (evt) =>
    //            {
    //                this.$element.popover("destroy");
    //                $(document).off("click", this.backgroundClickHandler);
    //            };
    //            $(document).on("click", this.backgroundClickHandler);
    //        }
    //
    //        public static show(title: string, content: string, parent: any)
    //        {
    //            var popover = new Popover(parent);
    //
    //            popover.$element.popover({
    //                title: title,
    //                html: true,
    //                content: content,
    //                placement: "bottom",
    //                container: "body",
    //                trigger: "manual"
    //            });
    //            popover.$element.popover("show");
    //        }
    //    }
    // Shim to support nested modal dialogs
    $(document).on('show.bs.modal', '.modal', function () {
        var $modal = $(this);
        setTimeout(function () {
            var numDialogs = $('.modal-backdrop').length;
            if (numDialogs > 1) {
                var zIndex = ((numDialogs + 1) * 1000) + 50;
                $modal.css('z-index', zIndex);
                $('.modal-backdrop').not('.modal-stack').css('z-index', zIndex - 1);
            }
            $('.modal-backdrop').not('.modal-stack').addClass('modal-stack');
        }, 0);
    });
    // Shim to fix scrolling screen in nested dialogs
    $(document).on('hidden.bs.modal', '.modal', function () {
        $('.modal:visible').length && $(document.body).addClass('modal-open');
    });
    var Modal = (function (_super) {
        __extends(Modal, _super);
        function Modal(element) {
            var _this = this;
            _super.call(this, element);
            // clear all input fields
            this.$element.find("input").val("");
            // Wire up Modal's magic cancel/close buttons dismiss overlay styles
            this.$element.on('click.dismiss.modal', '[data-dismiss="modal"]', function () {
                Modal.setOverlayShowing(false);
                if (_this.cancelHandler)
                    _this.cancelHandler();
                _this.closed();
            });
        }
        Modal.prototype.show = function () {
            var _this = this;
            // Workaround for Bootstrap bug - need to wait for previous instance to close before re-opening
            var modal = this.$element.data("bs.modal");
            if (modal && modal.$backdrop) {
                window.setTimeout(function () { return _this.show(); }, 250);
            }
            else {
                Modal.setOverlayShowing(true);
                this.$element.modal("show");
                window.setTimeout(function () {
                    _this.$element.find("input,textarea,select").filter(":visible:first").focus().select();
                    // Notify interested children that modal has been shown
                    _this.$element.find(".notify_shown").trigger("catdv:shown");
                }, 350);
            }
        };
        Modal.prototype.close = function (ok) {
            var args = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                args[_i - 1] = arguments[_i];
            }
            this.$element.modal("hide");
            Modal.setOverlayShowing(false);
            this.closed();
            if (ok) {
                if (this.okHandler)
                    this.okHandler.apply(this, args);
            }
            else {
                if (this.cancelHandler)
                    this.cancelHandler();
            }
        };
        Modal.prototype.onOK = function (okHandler) {
            this.okHandler = okHandler;
        };
        Modal.prototype.onCancel = function (cancelHandler) {
            this.cancelHandler = cancelHandler;
        };
        // Allows us to have css rules triggered when a dialog is displayed
        // Currently used by QuickTime player which doesn't support things appearing in front of it
        Modal.setOverlayShowing = function (overlayShowing) {
            if (overlayShowing) {
                $("body").addClass("dialogShowing");
            }
            else {
                $("body").removeClass("dialogShowing");
            }
        };
        Modal.prototype.closed = function () {
        };
        return Modal;
    }(Control));
    controls.Modal = Modal;
    var MessageBox = (function (_super) {
        __extends(MessageBox, _super);
        function MessageBox(message, title, buttons) {
            var _this = this;
            if (title === void 0) { title = null; }
            if (buttons === void 0) { buttons = MessageBox.BUTTONS_OK; }
            _super.call(this, MessageBox.createDiv(message, title, buttons));
            $("#messagebox_okButton").on("click", function (evt) { return _this.close(true); });
            $("#messagebox_cancelButton").on("click", function (evt) { return _this.close(false); });
        }
        MessageBox.prototype.updateMessage = function (message) {
            $("#messagebox_content").html(message.replaceAll("\n", "<br/>"));
        };
        MessageBox.showMessage = function (message, title) {
            if (title === void 0) { title = null; }
            new MessageBox(message, title).show();
        };
        MessageBox.confirm = function (message, confirmed) {
            var confirmMessageBox = new MessageBox(message, "Confirm", MessageBox.BUTTONS_OK_CANCEL);
            confirmMessageBox.onOK(confirmed);
            confirmMessageBox.show();
        };
        MessageBox.alert = function (message) {
            new MessageBox(message, "Alert").show();
        };
        MessageBox.createDiv = function (message, title, buttons) {
            $("#messagebox_dialog").remove();
            var html = "<div id='messagebox_dialog' style='display: none;' class='modal fade'>";
            html += "  <div class='modal-dialog'>";
            html += "    <div class='modal-content'>";
            html += "      <div class='modal-header'>";
            html += "        <h4 class='modal-title'>" + HtmlUtil.escapeHtml(title || "Alert") + "</h4>";
            html += "      </div>";
            html += "      <div class='modal-body' id='messagebox_content'>" + HtmlUtil.escapeHtml(message).replaceAll("\n", "<br/>") + "</div>";
            html += "      <div class='modal-footer'>";
            if ((buttons == MessageBox.BUTTONS_CANCEL) || (buttons == MessageBox.BUTTONS_OK_CANCEL)) {
                html += "<button id='messagebox_cancelButton' class='btn btn-sm btn-primary'>Cancel</button>";
            }
            if ((buttons == MessageBox.BUTTONS_OK) || (buttons == MessageBox.BUTTONS_OK_CANCEL)) {
                html += "<button id='messagebox_okButton' class='btn btn-sm btn-primary'>OK</button>";
            }
            html += "      </div>";
            html += "    </div>";
            html += "  </div>";
            html += "</div>";
            return $(html).appendTo($("body"));
        };
        MessageBox.BUTTONS_OK = 1;
        MessageBox.BUTTONS_CANCEL = 2;
        MessageBox.BUTTONS_OK_CANCEL = 3;
        return MessageBox;
    }(Modal));
    controls.MessageBox = MessageBox;
    var Alert = (function (_super) {
        __extends(Alert, _super);
        function Alert(element) {
            _super.call(this, element);
            // hide by default
            this.hide();
        }
        Alert.prototype.show = function () {
            this.$element.removeClass("hide");
        };
        Alert.prototype.hide = function () {
            this.$element.addClass("hide");
        };
        return Alert;
    }(Control));
    controls.Alert = Alert;
    var ProgressDialog = (function () {
        function ProgressDialog(msg, showPercentage) {
            if (showPercentage === void 0) { showPercentage = false; }
            this.$dialogDiv = $('<div id="progressDialog" class="modal fade" data-backdrop="static" data-keyboard="false">'
                + '  <div class="modal-dialog modal-sm">'
                + '    <div class="modal-content">'
                + '      <div class="modal-header">'
                + '        <h4>' + msg + '</h4>'
                + '      </div>'
                + '      <div class="modal-body">'
                + '       <div class="progress active"><div class="progress-bar" role="progressbar" style="width: 0%;"></div></div>'
                + '      </div>'
                + '    </div>'
                + '  </div>'
                + '</div>');
            this.$message = this.$dialogDiv.find("h4");
            this.$progressBar = this.$dialogDiv.find(".progress-bar");
            if (!showPercentage) {
                this.$progressBar.addClass("progress-bar-striped");
                this.$progressBar.css("width", "100%");
            }
        }
        ProgressDialog.prototype.show = function () {
            this.$dialogDiv.modal();
        };
        ProgressDialog.prototype.hide = function () {
            this.$dialogDiv.modal('hide');
        };
        ProgressDialog.prototype.setProgress = function (message, progress) {
            if (progress === void 0) { progress = 100; }
            this.$message.text(message);
            this.$progressBar.css("width", "" + progress + "%");
        };
        return ProgressDialog;
    }());
    controls.ProgressDialog = ProgressDialog;
    var TabPanel = (function (_super) {
        __extends(TabPanel, _super);
        function TabPanel(element) {
            var _this = this;
            _super.call(this, element);
            this.tabSelectedHandler = null;
            this.ignoreEvents = false;
            // Tab control consists of a <ul> for the tabs and then a separate <div> that contains the panels
            // We are passed in the <ul> - need to find the <div>
            this.$tabs = this.$element;
            this.$panels = this.$tabs.next();
            // Select first tab (if present)
            this.$tabs.find('a:first').tab('show');
            this.$tabs.find('a[data-toggle="tab"]').on('shown.bs.tab', function (e) { return _this.tab_onShown(e); });
        }
        TabPanel.create = function (parent) {
            // First create the tabs <ul>
            var $tabs = $("<ul class='nav nav-tabs' role='tablist'></ul>").appendTo(controls.Element.get$(parent));
            // then add the <div> that will contain the panels
            $tabs.after("<div class='tab-content'></div>");
            return new TabPanel($tabs);
        };
        TabPanel.prototype.addTab = function (name, selected) {
            var _this = this;
            var identifier = controls.Element.toID(name);
            var $tab = $("<li><a href='#tab" + identifier + "' role='tab' data-toggle='tab'>" + HtmlUtil.escapeHtml(name) + "</a></li>").appendTo(this.$tabs);
            $tab.on('shown.bs.tab', function (e) { return _this.tab_onShown(e); });
            var $panel = $("<div class='tab-pane' id='tab" + identifier + "'>").appendTo(this.$panels);
            if (selected) {
                $tab.find('a:first').tab('show');
            }
            return $panel;
        };
        TabPanel.prototype.selectTab = function (name) {
            this.ignoreEvents = true;
            this.$element.find("a[href=#tab" + controls.Element.toID(name) + "]").tab('show');
            this.ignoreEvents = false;
        };
        TabPanel.prototype.showTab = function (name) {
            this.$element.find("a[href=#tab" + controls.Element.toID(name) + "]").show();
        };
        TabPanel.prototype.hideTab = function (name) {
            this.$element.find("a[href=#tab" + controls.Element.toID(name) + "]").hide();
        };
        TabPanel.prototype.clear = function () {
            this.$tabs.empty();
            this.$panels.empty();
        };
        TabPanel.prototype.onTabSelected = function (tabSelectedHandler) {
            this.tabSelectedHandler = tabSelectedHandler;
        };
        TabPanel.prototype.tab_onShown = function (e) {
            var selectedTabIdentifer = e.target.attributes["href"].value.substring(1); // activated tab
            if (!this.ignoreEvents) {
                // e.relatedTarget; // previous tab
                if (this.tabSelectedHandler) {
                    this.tabSelectedHandler(selectedTabIdentifer);
                }
            }
            // Notify hidden children that tab has been shown
            $("#" + selectedTabIdentifer + " .notify_shown").trigger("catdv:shown");
        };
        return TabPanel;
    }(Control));
    controls.TabPanel = TabPanel;
    var ButtonDropDown = (function (_super) {
        __extends(ButtonDropDown, _super);
        function ButtonDropDown(element) {
            _super.call(this, element);
        }
        ButtonDropDown.prototype.setEnabled = function (enabled) {
            if (enabled) {
                this.$element.find("button").removeAttr("disabled");
            }
            else {
                this.$element.find("button").attr("disabled", "disabled");
            }
        };
        // Override
        ButtonDropDown.prototype.onClick = function (clickHandler) {
            this.$element.find("li > a").click(function (evt) {
                clickHandler(evt, evt.delegateTarget.getAttribute("id"));
            });
        };
        return ButtonDropDown;
    }(Control));
    controls.ButtonDropDown = ButtonDropDown;
    var LinkButton = (function (_super) {
        __extends(LinkButton, _super);
        function LinkButton(element) {
            _super.call(this, element);
            this.enabled = true;
        }
        LinkButton.create = function (buttonText, options, parent) {
            return new LinkButton($(controls.Element.render("a", options, buttonText)).appendTo(controls.Element.get$(parent)));
        };
        LinkButton.prototype.setEnabled = function (enabled) {
            this.enabled = enabled;
            if (enabled) {
                this.$element.removeClass("disabled");
            }
            else {
                this.$element.addClass("disabled");
            }
        };
        // Override
        LinkButton.prototype.onClick = function (clickHandler) {
            var _this = this;
            this.$element.click(function (evt) {
                if (_this.enabled)
                    clickHandler(evt);
            });
        };
        return LinkButton;
    }(Control));
    controls.LinkButton = LinkButton;
    var OptionsButton = (function (_super) {
        __extends(OptionsButton, _super);
        function OptionsButton(element, settings) {
            var _this = this;
            _super.call(this, element);
            this.settings = settings;
            this.$element.addClass("btn-group options-button");
            this.$button = $("<button type='button' class='btn btn-sm'></button>").appendTo(this.$element);
            if (settings.iconClass) {
                this.$button.html("<span class='" + settings.iconClass + "'></span>");
            }
            else if (settings.label) {
                this.$button.text(settings.label);
            }
            this.$button.on("click", function (evt) {
                if (_this.clickHandler) {
                    _this.clickHandler(evt, _this.selectedOption);
                }
            });
            this.$arrow = $("<button type='button' class='btn btn-sm btn-compact dropdown-toggle' data-toggle='dropdown'>" +
                "<span class='catdvicon catdvicon-pulldown_arrow'></span> <span class='sr-only'>Toggle Dropdown</span></button>").appendTo(this.$element);
            this.$menu = $("<ul class='dropdown-menu" + (settings.rightAlign ? " pull-right" : " dropdown-menu-right") + "' role='menu'>").appendTo(this.$element);
            this.setOptions(settings.options, settings.selectedOption || null);
        }
        OptionsButton.prototype.setOptions = function (options, selectedOption) {
            var _this = this;
            this.options = options;
            this.selectedOption = selectedOption;
            this.$menu.empty();
            if (options) {
                options.forEach(function (option) {
                    var $li = $("<li>").appendTo(_this.$menu);
                    var tickVisibility = (option == _this.selectedOption) ? "visible" : "hidden";
                    var $link = $("<a href='#'><span class='catdvicon catdvicon-tick_min' style='visibility:" + tickVisibility + "'> </span> " + option + "</a>").appendTo($li);
                    $link.on("click", function (evt) {
                        _this.selectedOption = option;
                        if (_this.clickHandler) {
                            _this.clickHandler(evt, option);
                        }
                        _this.$menu.find("li > a > span").css("visibility", "hidden");
                        $link.find("span").css("visibility", "visible");
                    });
                });
            }
        };
        // Override
        OptionsButton.prototype.onClick = function (clickHandler) {
            this.clickHandler = clickHandler;
        };
        OptionsButton.prototype.setSelectedOption = function (option) {
            this.selectedOption = option;
            for (var i = 0; i < this.options.length; i++) {
                if (this.options[i].toLowerCase() == option.toLowerCase()) {
                    this.$menu.find("li > a > span").css("visibility", "hidden").eq(i).css("visibility", "visible");
                    break;
                }
            }
        };
        OptionsButton.prototype.showOptions = function () {
            this.$element.find("button:nth-child(2)").show();
            this.$element.addClass("btn-group").removeClass("single-button");
        };
        OptionsButton.prototype.hideOptions = function () {
            this.$element.find("button:nth-child(2)").hide();
            this.$element.removeClass("btn-group").addClass("single-button");
        };
        OptionsButton.prototype.setEnabled = function (enabled) {
            if (enabled) {
                this.$button.removeAttr("disabled");
                this.$arrow.removeAttr("disabled");
            }
            else {
                this.$button.attr("disabled", "disabled");
                this.$arrow.attr("disabled", "disabled");
            }
        };
        return OptionsButton;
    }(Control));
    controls.OptionsButton = OptionsButton;
    var Tooltip = (function () {
        function Tooltip() {
        }
        Tooltip.addTooltip = function (tooltip, $element) {
            $element.tooltip({
                delay: { "show": 500, "hide": 100 },
                placement: "auto bottom",
                container: 'body',
                html: true,
                template: '<div class="tooltip" role="tooltip"><div class="tooltip-inner"></div></div>',
                title: tooltip
            });
        };
        return Tooltip;
    }());
    controls.Tooltip = Tooltip;
})(controls || (controls = {}));
