module controls
{
    import HtmlUtil = util.HtmlUtil;
    import Control = controls.Control;

    interface AccordianItem
    {
        id: string;
        title: string;
        $body: JQuery;
    }

    export class Accordian extends Control
    {
        private items: AccordianItem[] = [];

        constructor(element: any)
        {
            super(element);
            this.$element.addClass("panel-group");
        }

        public clear()
        {
            this.$element.empty();
        }

        public addItem(title: string, expanded: boolean): JQuery
        {
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
        }
    }

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
    $(document).on('show.bs.modal', '.modal', function()
    {
        var $modal = $(this);
        setTimeout(function()
        {
            var numDialogs = $('.modal-backdrop').length;
            if(numDialogs > 1)
            {
                 var zIndex = ((numDialogs + 1) * 1000) + 50;
                 $modal.css('z-index', zIndex);
                 $('.modal-backdrop').not('.modal-stack').css('z-index', zIndex - 1);
            }
            $('.modal-backdrop').not('.modal-stack').addClass('modal-stack');
        }, 0);
    });
    
    // Shim to fix scrolling screen in nested dialogs
    $(document).on('hidden.bs.modal', '.modal', function()
    {
        $('.modal:visible').length && $(document.body).addClass('modal-open');
    });
    
    export class Modal extends Control
    {
        private okHandler: (...args: any[]) => void;
        private cancelHandler: () => void;
                
        constructor(element: any)
        {
            super(element);
            // clear all input fields
            this.$element.find("input").val("");

            // Wire up Modal's magic cancel/close buttons dismiss overlay styles
            this.$element.on('click.dismiss.modal', '[data-dismiss="modal"]', () =>
            {
                Modal.setOverlayShowing(false);
                if (this.cancelHandler) this.cancelHandler();
                this.closed();
            });
        }

        public show()
        {
            // Workaround for Bootstrap bug - need to wait for previous instance to close before re-opening
            var modal = this.$element.data("bs.modal");
            if (modal && (<any>modal).$backdrop)
            {
                window.setTimeout(() => this.show(), 250);
            }
            else
            {
                Modal.setOverlayShowing(true);
                this.$element.modal("show");

                window.setTimeout(() =>
                {                   
                    this.$element.find("input,textarea,select").filter(":visible:first").focus().select();
                    // Notify interested children that modal has been shown
                    this.$element.find(".notify_shown").trigger("catdv:shown");
                }, 350);
            }

        }

        public close(ok: boolean, ...args: any[])
        {
            this.$element.modal("hide");
            Modal.setOverlayShowing(false);
            this.closed();

            if (ok)
            {
                if (this.okHandler) this.okHandler.apply(this, args);
            }
            else
            {
                if (this.cancelHandler) this.cancelHandler();
            }
        }

        public onOK(okHandler: (...args: any[]) => void)
        {
            this.okHandler = okHandler;
        }

        public onCancel(cancelHandler: () => void)
        {
            this.cancelHandler = cancelHandler;
        }
        
        // Allows us to have css rules triggered when a dialog is displayed
        // Currently used by QuickTime player which doesn't support things appearing in front of it
        public static setOverlayShowing(overlayShowing: boolean)
        {
            if (overlayShowing)
            {
                $("body").addClass("dialogShowing");
            }
            else
            {
                $("body").removeClass("dialogShowing");
            }
        }

        protected closed()
        {
        }
    }


    export class MessageBox extends Modal
    {
        public static BUTTONS_OK = 1;
        public static BUTTONS_CANCEL = 2;
        public static BUTTONS_OK_CANCEL = 3;

        constructor(message: string, title: string = null, buttons: number = MessageBox.BUTTONS_OK)
        {
            super(MessageBox.createDiv(message, title, buttons));

            $("#messagebox_okButton").on("click",(evt) => this.close(true));
            $("#messagebox_cancelButton").on("click",(evt) => this.close(false));
        }

        public updateMessage(message : string)
        {
            $("#messagebox_content").html(message.replaceAll("\n", "<br/>"));
        }
        
        public static showMessage(message: string, title: string = null)
        {
            new MessageBox(message, title).show();
        }

        public static confirm(message: string, confirmed : () => void)
        {
            var confirmMessageBox = new MessageBox(message, "Confirm", MessageBox.BUTTONS_OK_CANCEL);
            confirmMessageBox.onOK(confirmed);
            confirmMessageBox.show();
        }

        public static alert(message: string)
        {
            new MessageBox(message, "Alert").show();
        }

        private static createDiv(message: string, title: string, buttons: number): JQuery
        {
            $("#messagebox_dialog").remove();

            var html = "<div id='messagebox_dialog' style='display: none;' class='modal fade'>";
            html += "  <div class='modal-dialog'>";
            html += "    <div class='modal-content'>";
            html += "      <div class='modal-header'>";
            html += "        <h4 class='modal-title'>" + HtmlUtil.escapeHtml(title || "Alert") + "</h4>";
            html += "      </div>";
            html += "      <div class='modal-body' id='messagebox_content'>" + HtmlUtil.escapeHtml(message).replaceAll("\n", "<br/>") + "</div>";
            html += "      <div class='modal-footer'>";

            if ((buttons == MessageBox.BUTTONS_CANCEL) || (buttons == MessageBox.BUTTONS_OK_CANCEL))
            {
                html += "<button id='messagebox_cancelButton' class='btn btn-sm btn-primary'>Cancel</button>";
            }
            if ((buttons == MessageBox.BUTTONS_OK) || (buttons == MessageBox.BUTTONS_OK_CANCEL))
            {
                html += "<button id='messagebox_okButton' class='btn btn-sm btn-primary'>OK</button>";
            }

            html += "      </div>";
            html += "    </div>";
            html += "  </div>";
            html += "</div>";

            return $(html).appendTo($("body"));
        }
    }

    export class Alert extends Control
    {
        constructor(element: any)
        {
            super(element);
            // hide by default
            this.hide();
        }

        public show()
        {
            this.$element.removeClass("hide");
        }

        public hide()
        {
            this.$element.addClass("hide");
        }
    }

    export class ProgressDialog 
    {
        private $dialogDiv: JQuery;
        private $message: JQuery;
        private $progressBar: JQuery;

        constructor(msg: string, showPercentage: boolean = false)
        {
            this.$dialogDiv = $(
                '<div id="progressDialog" class="modal fade" data-backdrop="static" data-keyboard="false">'
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
            if (!showPercentage) 
            {
                this.$progressBar.addClass("progress-bar-striped");
                this.$progressBar.css("width", "100%");
            }
        }

        public show()
        {
            this.$dialogDiv.modal();
        }

        public hide()
        {
            this.$dialogDiv.modal('hide');
        }

        public setProgress(message: string, progress: number = 100)
        {
            this.$message.text(message);
            this.$progressBar.css("width", "" + progress + "%");
        }
    }


    export class TabPanel extends Control
    {
        private tabSelectedHandler: (selectedTabName: string) => void = null;
        private ignoreEvents = false;

        private $tabs: JQuery;
        private $panels: JQuery;

        constructor(element: any)
        {
            super(element);

            // Tab control consists of a <ul> for the tabs and then a separate <div> that contains the panels
            // We are passed in the <ul> - need to find the <div>
            this.$tabs = this.$element;
            this.$panels = this.$tabs.next();

            // Select first tab (if present)
            this.$tabs.find('a:first').tab('show');

            this.$tabs.find('a[data-toggle="tab"]').on('shown.bs.tab',(e) => this.tab_onShown(e));
        }

        public static create(parent: any)
        {
            // First create the tabs <ul>
            var $tabs = $("<ul class='nav nav-tabs' role='tablist'></ul>").appendTo(Element.get$(parent));
            // then add the <div> that will contain the panels
            $tabs.after("<div class='tab-content'></div>");
            return new TabPanel($tabs);
        }

        public addTab(name: string, selected: boolean): JQuery
        {
            var identifier = Element.toID(name);
            var $tab = $("<li><a href='#tab" + identifier + "' role='tab' data-toggle='tab'>" + HtmlUtil.escapeHtml(name) + "</a></li>").appendTo(this.$tabs);
            $tab.on('shown.bs.tab',(e) => this.tab_onShown(e));
            var $panel = $("<div class='tab-pane' id='tab" + identifier + "'>").appendTo(this.$panels);
            if (selected)
            {
                $tab.find('a:first').tab('show');
            }
            return $panel;
        }

        public selectTab(name: string)
        {
            this.ignoreEvents = true;
            this.$element.find("a[href=#tab" + Element.toID(name) + "]").tab('show');           
            this.ignoreEvents = false;
         }

        public showTab(name: string)
        {
            this.$element.find("a[href=#tab" + Element.toID(name) + "]").show();
        }

        public hideTab(name: string)
        {
            this.$element.find("a[href=#tab" + Element.toID(name) + "]").hide();
        }

        public clear()
        {
            this.$tabs.empty();
            this.$panels.empty();
        }

        public onTabSelected(tabSelectedHandler: (selectedTabIdentifer: string) => void)
        {
            this.tabSelectedHandler = tabSelectedHandler;
        }

        private tab_onShown(e: JQueryEventObject)
        {
            var selectedTabIdentifer: string = (<string>(<HTMLElement>e.target).attributes["href"].value).substring(1); // activated tab
            if (!this.ignoreEvents)
            {
                // e.relatedTarget; // previous tab
                if (this.tabSelectedHandler)
                {
                    this.tabSelectedHandler(selectedTabIdentifer);
                }
            }
            // Notify hidden children that tab has been shown
            $("#" + selectedTabIdentifer + " .notify_shown").trigger("catdv:shown");
       }
    }

    export class ButtonDropDown extends Control
    {
        constructor(element: any)
        {
            super(element);
        }

        public setEnabled(enabled: boolean)       
        {
            if (enabled)
            {
                this.$element.find("button").removeAttr("disabled");
            }
            else
            {
                this.$element.find("button").attr("disabled", "disabled");
            }
        }

        // Override
        public onClick(clickHandler: (evt: any, dropDownItemId: string) => void)
        {
            this.$element.find("li > a").click(function(evt)
            {
                clickHandler(evt, evt.delegateTarget.getAttribute("id"));
            });
        }
    }

    export class LinkButton extends Control
    {
        private enabled = true;
    
        constructor(element: any)
        {
            super(element);
        }

        public static create(buttonText: string, options: any, parent: any)
        {
            return new LinkButton($(Element.render("a", options, buttonText)).appendTo(Element.get$(parent)));
        }

        public setEnabled(enabled: boolean)       
        {
            this.enabled = enabled;
            if (enabled)
            {
                this.$element.removeClass("disabled");
            }
            else
            {
                this.$element.addClass("disabled");
            }
        }
        
        // Override
        public onClick(clickHandler: (evt: any) => void)
        {
            this.$element.click((evt) =>
            {
                if(this.enabled) clickHandler(evt);
            });
        }
    }

    
    export interface OptionsButtonSettings
    {
        label?: string;
        iconClass?: string;
        rightAlign? : boolean;
        options: string[];
        selectedOption?: string;
    }
    
    export class OptionsButton extends Control
    {
        private $button: JQuery;
        private $arrow: JQuery;
        private $menu: JQuery;

        private settings: OptionsButtonSettings;
        private options: string[];
        private selectedOption: string;
        private clickHandler: (evt: any, option: string) => void;

        constructor(element: any, settings: OptionsButtonSettings)
        {
            super(element);
            
            this.settings = settings;

            this.$element.addClass("btn-group options-button");
            
            this.$button = $("<button type='button' class='btn btn-sm'></button>").appendTo(this.$element);
            if (settings.iconClass)
            {
                this.$button.html("<span class='" + settings.iconClass + "'></span>");
            }
            else if (settings.label)
            {
                this.$button.text(settings.label);
            }

            this.$button.on("click", (evt) =>
            {
                if (this.clickHandler)
                {
                    this.clickHandler(evt, this.selectedOption);
                }
            });

            this.$arrow = $("<button type='button' class='btn btn-sm btn-compact dropdown-toggle' data-toggle='dropdown'>" +
                "<span class='catdvicon catdvicon-pulldown_arrow'></span> <span class='sr-only'>Toggle Dropdown</span></button>").appendTo(this.$element);

            this.$menu = $("<ul class='dropdown-menu" + (settings.rightAlign ? " pull-right" : " dropdown-menu-right") + "' role='menu'>").appendTo(this.$element);

            this.setOptions(settings.options, settings.selectedOption || null);
        }

        public setOptions(options: string[], selectedOption: string)
        {
            this.options = options;
            this.selectedOption = selectedOption;

            this.$menu.empty();
            if (options)
            {
                options.forEach((option) =>
                {
                    var $li = $("<li>").appendTo(this.$menu);
                    var tickVisibility = (option == this.selectedOption) ? "visible" : "hidden";
                    var $link = $("<a href='#'><span class='catdvicon catdvicon-tick_min' style='visibility:" + tickVisibility + "'> </span> " + option + "</a>").appendTo($li);
                    $link.on("click", (evt) =>
                    {
                        this.selectedOption = option;
                        if (this.clickHandler)
                        {
                            this.clickHandler(evt, option);
                        }
                        this.$menu.find("li > a > span").css("visibility", "hidden");
                        $link.find("span").css("visibility", "visible");
                    });
                });
            }
        }

        // Override
        public onClick(clickHandler: (evt: any, option: string) => void)
        {
            this.clickHandler = clickHandler;
        }

        public setSelectedOption(option: string)
        {
            this.selectedOption = option;
            for (var i = 0; i < this.options.length; i++)
            {
                if (this.options[i].toLowerCase() == option.toLowerCase())
                {
                    this.$menu.find("li > a > span").css("visibility", "hidden").eq(i).css("visibility", "visible");
                    break;
                }
            }
        }

        public showOptions()
        {
            this.$element.find("button:nth-child(2)").show();
            this.$element.addClass("btn-group").removeClass("single-button");
        }

        public hideOptions()
        {
            this.$element.find("button:nth-child(2)").hide();
            this.$element.removeClass("btn-group").addClass("single-button");
        }

        public setEnabled(enabled: boolean)       
        {
            if (enabled)
            {
                this.$button.removeAttr("disabled");
                this.$arrow.removeAttr("disabled");
            }
            else
            {
                this.$button.attr("disabled", "disabled");
                this.$arrow.attr("disabled", "disabled");
            }
        }
    }
    
    export class Tooltip
    {
        public static addTooltip(tooltip : string, $element : JQuery)
        {
           $element.tooltip({
               delay: { "show": 500, "hide": 100 },
               placement: "auto bottom",
               container: 'body',
               html: true,
               template: '<div class="tooltip" role="tooltip"><div class="tooltip-inner"></div></div>',
               title: tooltip
           });
        }
    }
}