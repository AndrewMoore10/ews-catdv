module controls
{
    import Platform = util.Platform;
    import ColorUtil = util.ColorUtil;
    import RGBA = util.RGBA;
    import HSLA = util.HSLA;

    class PopupControl extends Control
    {
        private dataSource: SimpleDataSource<ListItem>;
        private enabled: boolean = true;

        private $inputWrapper: JQuery;
        private $input: JQuery;
        private $previewInput: JQuery;
        private $arrow: JQuery;
        private $popup: JQuery;

        private popupVisible: boolean = false;
        private supressCloseOnBlur = false;

        // Full list of items from the datasource
        private listItems: ListItem[] = null;

        // currently selected item in pop-up (for up-arrow/down-arrow selecting)
        private currentIndex: number = null;

        // Save reference to handler so we can wire/unwire it as required
        private backgroundClickHandler: (evt: any) => void = null;

        private changeHandler: (evt: any) => void = null;

        constructor(element: any, cssClass: string, dataSource: SimpleDataSource<ListItem> = null, isComboBox: boolean = false, suggestOnly: boolean = false)
        {
            super(element);

            if (dataSource != null)
            {
                this.dataSource = dataSource;
            }
            else
            {
                // Read items from existing markup    
                var listItems: ListItem[] = [];
                this.$element.find("option").each((i, element: HTMLOptionElement) =>
                {
                    listItems.push({
                        value: this.getAttribute(element, "value"),
                        tooltip: this.getAttribute(element, "tool-tip"),
                        isSelected: this.getAttribute(element, "selected") ? true : false,
                        text: element.textContent || ""
                    });
                });
                this.dataSource = new SimpleArrayDataSource<ListItem>(listItems);
            }

            // Replace passed in custom combo element with actual markup
            var inputClass = this.$element.attr("class") || "";
            var inputWidth = this.$element.attr("width");
            var inputStyle = inputWidth ? "style='width:" + inputWidth + ";' " : "";
            var inputWrapperStyle = inputWidth ? "width:" + inputWidth + ";" : "";
            var $comboDiv = $("<div id='" + this.elementId + "' class='" + cssClass + "' style='position: relative;'/>");
            this.$element.replaceWith($comboDiv);
            this.$element = $comboDiv;
            this.$inputWrapper = $("<div class='input' style='position: relative; " + inputWrapperStyle + "'/>").appendTo(this.$element);
            if (isComboBox)
            {
                this.$previewInput = $("<input type=text  class='preview " + inputClass + "' " + inputStyle + " disabled/>").appendTo(this.$inputWrapper);
            }
            this.$input = $("<input type=text class='" + inputClass + "' " + inputStyle + "/>").appendTo(this.$inputWrapper);
            if (isComboBox)
            {
                // Position input in front of the preview box
                this.$input.css({
                    "background-color": "transparent",
                    "position": "absolute",
                    "left": "0px",
                    "top": "0px",
                    "bottom": "0px",
                    "right": "0px"
                });
            }

            if (!suggestOnly)
            {
                this.$arrow = $("<span class='arrow'/>").appendTo(this.$inputWrapper);
            }

            this.$popup = $("<div class='popup'/>").appendTo(this.$element);
            this.$popup.css({
                "position": "absolute",
                "display": "none",
                "left": "0px",
                "top": "100%",
                "width": "100%",
                "color": this.$input.css("color"),
                "font-size": this.$input.css("font-size")
            });

            this.backgroundClickHandler = (evt) => this._handleBackgroundClick(evt);

            this.$input.keyup((evt: JQueryKeyEventObject) =>
            {
                return this.input_keyUp(evt);
            });
            this.$input.keydown((evt: JQueryKeyEventObject) =>
            {
                return this.input_keyDown(evt);
            });
            this.$input.keypress((evt: JQueryKeyEventObject) =>
            {
                return this.input_keyPress(evt);
            });
            this.$input.blur((evt) =>
            {
                return this._input_blur(evt);
            });

            // For ComboBox user has to click on arrow - for others click aywhere in control
            if (isComboBox)
            {
                if (this.$arrow)
                {
                    this.$arrow.click((evt) =>
                    {
                        if (this.enabled)
                        {
                            if (!this.popupVisible)
                            {
                                // ComboBox needs to show complete unfiltered list if user clicks arrow
                                this.refreshList();
                            }
                            this._showPopup(!this.popupVisible);
                            evt.stopPropagation();
                        }
                    });
                }
            }
            else
            {
                this.$inputWrapper.click((evt) =>
                {
                    if (this.enabled) 
                    {
                        this.refreshList();
                        this._showPopup(!this.popupVisible);
                        evt.stopPropagation();
                    }
                });
            }

            this.$popup.mousedown((evt) =>
            {
                Console.debug("$popup.mousedown()");
                this.supressCloseOnBlur = true;
            });
            this.$popup.mouseup((evt) =>
            {
                Console.debug("$popup.mouseup()");
                this.supressCloseOnBlur = false;
            });
        }

        public onChanged(changeHandler: (evt: any) => void)
        {
            this.changeHandler = changeHandler;
        }

        public getText(): any
        {
            return this.$input.val();
        }

        public setText(text: string)
        {
            this.$input.val(text);
        }

        public reload()
        {
            this._loadData({}, (listItems) => this.refreshList());
        }

        public setEnabled(enabled: boolean)
        {
            this.enabled = enabled;
            if (this.enabled)
            {
                this.$input.prop("readonly", false);
                this.$input.addClass("editable");
                this.$arrow.show();
            }
            else
            {
                this.$input.prop("readonly", true);
                this.$input.removeClass("editable");
                this.$arrow.hide();
            }
        }
        public isEnabled()
        {
            return this.enabled;
        }

        /*** "Protected" methods ***/

        public _loadData(params: SimpleDataSourceParams, callback: (listItems: ListItem[]) => void)
        {
            this.dataSource.getItems(params || {}, (listItems: ListItem[]) =>
            {
                this.listItems = listItems;
                this.listItems.forEach((item) =>
                {
                    item.text = (item.text || "").toString();
                });
                callback(this.listItems);
            });
        }

        public _getListItems(callback: (listItems: ListItem[]) => void)
        {
            if (this.listItems != null)
            {
                callback(this.listItems);
            }
            else
            {
                this._loadData(null, callback);
            }
            return this.listItems;
        }

        public _clearSelection()
        {
            this.currentIndex = null;
        }

        public _get$Input(): JQuery
        {
            return this.$input;
        }
        public _get$PreviewInput(): JQuery
        {
            return this.$previewInput;
        }

        public _get$Popup(): JQuery
        {
            return this.$popup;
        }

        public _showPopup(show: boolean, keepFocus: boolean = false)
        {
            Console.debug("showPopup(show:" + show + ",keepFocus:" + keepFocus + ")");
            if (show != this.popupVisible)
            {
                if (show)
                {
                    this.$popup.show();
                    this.popupVisible = true;
                    // manually add/remove "focus" class so we can arrange for hover outline to 
                    // stay visible in clip details view while pop-up is open. 
                    this.$inputWrapper.addClass("focus");
                    $(document).on("click", this.backgroundClickHandler);
                }
                else
                {
                    this.$popup.hide();
                    this.$popup.children().removeClass("selected");
                    this.popupVisible = false;
                    this.currentIndex = null;
                    if (keepFocus) this.$input.focus();
                    // manually add/remove "focus" class 
                    this.$inputWrapper.removeClass("focus");
                    $(document).off("click", this.backgroundClickHandler);
                }
            }
        }

        public _processNavKey(keyCode: number, spaceSelectsCurrentItem: boolean, currentItemsCount: number = null)
        {
            if (!this.enabled || !this.listItems) return null;

            var numCurrentItems = currentItemsCount || this.listItems.length;

            if (keyCode == 40 /* down arrow */)
            {
                this._showPopup(true);
                this._setCurrentItem((this.currentIndex != null) ? Math.min(this.currentIndex + 1, numCurrentItems - 1) : 0);
                return true;
            }
            else if ((keyCode == 38  /* up arrow */) && (this.currentIndex != null))
            {
                this._setCurrentItem(Math.max(this.currentIndex - 1, 0));
                return true;
            }
            else if (spaceSelectsCurrentItem && (keyCode == 32  /* space */) && (this.currentIndex != null))
            {
                this._selectCurrentItem(this.currentIndex);
            }
            else if (keyCode == 13  /* enter */)
            {
                if (this.popupVisible)
                {
                    if (this.currentIndex != null)
                    {
                        // Enter while pop-up visible accepts currently select item in pop-up and closes pop-up
                        this._showPopup(false, true);
                        return true;
                    }
                }
                else
                {
                    // Enter while pop-up not visible accepts currently value
                    this._fireChangeEvent({});
                    return true;
                }
            }
            return false;
        }

        public _setCurrentItem(currentItemIndex: number)
        {
            Console.debug("_setCurrentItem(" + currentItemIndex + ")");
            this.currentIndex = currentItemIndex;
            this.$popup.children().removeClass("selected");
            var $selected = this.$popup.children().eq(this.currentIndex);
            $selected.addClass("selected");
            $selected.scrollintoview();
        }

        public _fireChangeEvent(evt: any)
        {
            if (this.changeHandler)
            {
                this.changeHandler($.extend({ "src": this }, evt));
            }
        }

        public _input_blur(evt)
        {
            Console.debug("$input.blur()");
            // Ignore blur if it's because we clicked in the popup
            if (this.enabled && !this.supressCloseOnBlur && this.popupVisible)
            {
                this._showPopup(false, false);
            }
            return true;
        }

        public _handleBackgroundClick(evt: any)
        {
            if (this.popupVisible)
            {
                Console.debug("backgroundClickHandler()");
                this._showPopup(false, false);
            }
        }

        /** Private methods **/

        private getAttribute(element: HTMLOptionElement, attributeName: string): string
        {
            var attr = element.attributes.getNamedItem(attributeName);
            return attr != null ? attr.value : null;
        }

        /** Abstract methods **/

        public refreshList()
        { /*-- Abstract --*/ }

        public inputWrapper_click(evt: JQueryEventObject)
        { /*-- Abstract --*/ }

        public input_keyUp(evt: JQueryKeyEventObject): boolean
        { /*-- Abstract --*/ return true; }

        public input_keyDown(evt: JQueryKeyEventObject): boolean
        { /*-- Abstract --*/  return true; }

        public input_keyPress(evt: JQueryKeyEventObject): boolean
        { /*-- Abstract --*/  return true; }

        public _selectCurrentItem(currentItemIndex: number)
        { /*-- Abstract --*/ }

    }

    export class ComboBox extends PopupControl
    {
        // User MUST chose one of the values in the picklist
        private fixedValues: boolean;

        // The items in the picklist are dynamically created as suggestions only
        private suggestOnly: boolean;

        private selectedItem: ListItem = null;
        private previewSelectedItem: ListItem = null;

        private allItems: ListItem[] = [];
        private currentItems: ListItem[] = [];

        constructor(element: any, dataSource: SimpleDataSource<ListItem> = null, fixedValues: boolean = true, suggestOnly: boolean = false)
        {
            super(element, 'dropdown-list auto-suggest', dataSource, true, suggestOnly);

            this.fixedValues = fixedValues && !suggestOnly;
            this.suggestOnly = suggestOnly;

            // ComboBox needs to pre-load the data because the key event handlers need to be check if a key should be accepted
            // or not, based on whether it matches against the list of items, but can't call the asynchronous _getListItems() 
            // method as the key handlers are synchronous and need to return true or false. 
            super._getListItems((items) => { });
        }

        public static create(options: any, dataSource: SimpleDataSource<ListItem>, fixedValues: boolean, suggestOnly: boolean, parent: any): ComboBox
        {
            return new ComboBox($(Element.render("select", options)).appendTo(Element.get$(parent)), dataSource, fixedValues, suggestOnly);
        }

        public getSelectedItem(): ListItem
        {
            return this.selectedItem;
        }

        public getSelectedValue(): any
        {
            if (this.fixedValues)
            {
                return this.selectedItem != null ? this.selectedItem.value : null;
            }
            else
            {
                return super.getText();
            }
        }
        public setSelectedValue(value: any)
        {
            if (this.fixedValues)
            {
                this.setSelectedItem(this.allItems.find((item) => item.value == value), false);
            }
            else
            {
                super.setText(value);
                this.filterList(value);
            }
        }

        // Override
        public setText(text: string)
        {
            super.setText(text);
            if (!this.suggestOnly) this.filterList(text);
        }

        public input_keyDown(evt: JQueryKeyEventObject): boolean
        {
            if (!super.isEnabled() || !this.fixedValues) return true;

            Console.debug("keydown - evt.keyCode:" + evt.keyCode);
            if ((evt.keyCode == 46  /* delete */) || (evt.keyCode == 8  /* backspace */))
            {
                // Calculate what text would look like if this key was processed
                var selection = this.getInputSelection(this._get$Input().get(0));
                var oldValue: string = this._get$Input().val();
                var textAfterKeyPressApplied;
                if (selection.start == selection.end)
                {
                    if (evt.keyCode == 46  /* delete */)
                    {
                        textAfterKeyPressApplied = oldValue.substring(0, selection.start) + oldValue.substring(selection.start + 1);
                    }
                    else
                    {
                        textAfterKeyPressApplied = oldValue.substring(0, selection.start - 1) + oldValue.substring(selection.start);
                    }
                }
                else
                {
                    textAfterKeyPressApplied = oldValue.substring(0, selection.start) + oldValue.substring(selection.end);
                }

                var match = this.allItems.find((item) => item.text.toLowerCase().startsWith(textAfterKeyPressApplied.toLowerCase()));
                Console.debug("match:" + match);
                return match ? true : false;
            }
            else
            {
                return true;
            }
        }

        public input_keyUp(evt: JQueryKeyEventObject): boolean
        {
            // Process control keys
            Console.debug("keyup - evt.keyCode:" + evt.keyCode);
            if (!super.isEnabled()) return true;

            if (!super._processNavKey(evt.keyCode, false, this.currentItems.length))
            {
                if ((evt.keyCode != 9  /* tab */) && (evt.keyCode != 37  /* left */) && (evt.keyCode != 39  /* right */) && (evt.keyCode != 46  /* del */))
                {
                    Console.debug("keyup - default action");
                    Dispatcher.dispatch(() =>
                    {
                        if (!this.suggestOnly) this._showPopup(true, false);
                        this.filterList(this._get$Input().val());
                    });
                }
            }
            return true;
        }

        public input_keyPress(evt: JQueryKeyEventObject): boolean
        {
            if (!this.isEnabled() || !this.fixedValues) return true;

            Console.debug("keypress - evt.keyCode:" + evt.keyCode + " String.fromCharCode(evt.charCode): '" + String.fromCharCode(evt.charCode) + "'");

            // Calculate what text would look like if this key was processed
            var selection = this.getInputSelection(this._get$Input().get(0));
            var oldValue: string = this._get$Input().val();
            var textAfterKeyPressApplied = oldValue.substring(0, selection.start) + String.fromCharCode(evt.charCode) + oldValue.substring(selection.end);

            Console.debug("textAfterKeyPressApplied:'" + textAfterKeyPressApplied + "'");
            if (this.allItems.find((item) => item.text.toLowerCase().startsWith(textAfterKeyPressApplied.toLowerCase())))
            {
                Dispatcher.dispatch(() =>
                {
                    this._showPopup(true);
                    this.filterList(this._get$Input().val());
                });
                Console.debug("OK");
                return true;
            }
            else
            {
                Console.debug("Cancel");
                return false;
            }
        }

        // Override

        public _loadData(params: SimpleDataSourceParams, callback: (listItems: ListItem[]) => void)
        {
            super._loadData(params, (items) =>
            {
                this.allItems = items;
                if (this.fixedValues)
                {
                    this.allItems.forEach((item) =>
                    {
                        if (item.isSelected)
                        {
                            this.setSelectedItem(item, false);
                        }
                    });
                }
                callback(items);
            });
        }

        public _input_blur(evt)
        {
            super._input_blur(evt);

            // auto-accept the currently matched item
            if (this.fixedValues && !this.getSelectedItem())
            {
                this.setSelectedItem(this.previewSelectedItem || this.currentItems[0] || this.allItems[0], true);
            }
            return true;
        }

        // Override
        public _setCurrentItem(currentItemIndex: number)
        {
            super._setCurrentItem(currentItemIndex);
            if (currentItemIndex != null)
            {
                this.setSelectedItem(this.currentItems[currentItemIndex], true);
            }
        }

        // Override
        public _showPopup(show: boolean, keepFocus: boolean = true)
        {
            super._showPopup(show, keepFocus);
            if (!show)
            {
                if (!keepFocus && this.fixedValues && (this.previewSelectedItem != null))
                {
                    this.setSelectedItem(this.previewSelectedItem, true);
                }
                else if (this.suggestOnly && keepFocus)
                {
                    this._fireChangeEvent({});
                }
            }
        }

        public refreshList()
        {
            Console.debug("ComboBox.refreshList()");
            // Refresh gets called when the user clicks the arrow so we want to populate the list with all the values 
            // We only do the filtering as they type otherwise you can't use it like a normal combo.
            this.filterList("");
        }

        private filterList(filterValue: string)
        {
            if (this.suggestOnly)
            {
                this._loadData({ "filter": filterValue }, (listItems) => 
                {
                    this.currentItems = this.allItems = listItems;
                    this.renderList();
                    super._showPopup(this.currentItems.length > 0)
                });
            }
            else
            {
                this.currentItems = this.allItems.filter((item) => item.text.toLowerCase().startsWith((filterValue || "").toLowerCase()));
                this.renderList();

                if (this.currentItems.length > 0)
                {
                    if (this.fixedValues)
                    {
                        var inputValLength = filterValue.length;
                        if (inputValLength > 0)
                        {
                            // Get first suggestion
                            this.previewSelectedItem = this.currentItems[0];
                            // Set the preview text to that
                            this._get$PreviewInput().val(this.previewSelectedItem.text);
                            // If what the user has typed isn't the same case as what's in the list then 'correct' the typed value
                            var textFromValue = this.previewSelectedItem.text.substr(0, inputValLength);
                            if (this._get$Input().val() !== textFromValue)
                            {
                                this._get$Input().val(textFromValue);
                            }
                        }
                        else
                        {
                            this.previewSelectedItem = null;
                            this.selectedItem = null;
                            this._get$PreviewInput().val("");
                        }
                    }
                }
                else
                {
                    this._get$Popup().html("<i>No matches</i>");
                }
            }
        }

        private renderList()
        {
            this._get$Popup().empty();

            if (this.selectedItem && !this.currentItems.find((item) => item.value == this.selectedItem.value))
            {
                this.selectedItem = null;
            }

            this._clearSelection();

            this.currentItems.forEach((item, i) =>
            {
                // breaks focussing because <a> tags get focus then get hidden. need another way to do tootltips
                // var $item = $("<div class='item " + (item.cssClass || "") + "'><a href='#' title='" + item.tooltip + "' disabled>" + item.text + "</a></div>").appendTo(this.$popup);
                var $item = $("<div class='item " + (item.cssClass || "") + "'></div>").appendTo(this._get$Popup()).text(item.text);
                $item.click((evt) =>
                {
                    Console.debug("$item.click()");
                    this.setSelectedItem(item, true);
                    this._showPopup(false);
                });
            });
        }

        private getInputSelection(el)
        {
            if (typeof el.selectionStart == "number" && typeof el.selectionEnd == "number")
            {
                return {
                    start: el.selectionStart,
                    end: el.selectionEnd
                };
            }
            else
            {
                var range = (<any>document).selection.createRange();
                var stored_range = range.duplicate();
                stored_range.moveToElementText(el);
                stored_range.setEndPoint('EndToEnd', range);
                return {
                    start: stored_range.text.length - range.text.length,
                    end: el.selectionStart + range.text.length
                };
            }
        }

        private setSelectedItem(item: ListItem, raiseChangeEvent : boolean )
        {
            var changed = (item != this.selectedItem);
            Console.debug("setSelectedItem(" + (item ? item.text : "null") + ") - changed:" + changed);
            this.selectedItem = item;
            this.previewSelectedItem = null;
            this._get$Input().val(this.selectedItem ? this.selectedItem.text : "");
            if (this.fixedValues)
            {
                this._get$PreviewInput().val("");
            }
            if (raiseChangeEvent && changed && !this.suggestOnly) this._fireChangeEvent({});
        }

    }

    export class MultiSelectDropDownList extends PopupControl
    {
        private fixedValues: boolean;

        private itemCheckBoxes: JQuery[] = [];
        private selectedItems: ListItem[] = [];

        private searchString: string = "";
        private lastSearch: number = 0;

        constructor(element: any, fixedValues: boolean, dataSource: SimpleDataSource<ListItem> = null)
        {
            super(element, 'dropdown-list multi-dropdown', dataSource);

            this.fixedValues = fixedValues;
        }

        public static create(options: any, fixedValues: boolean, dataSource: SimpleDataSource<ListItem>, parent: any): MultiSelectDropDownList
        {
            return new MultiSelectDropDownList($(Element.render("select", options)).appendTo(Element.get$(parent)), fixedValues, dataSource);
        }

        public getSelectedItems(): ListItem[]
        {
            return this.selectedItems;
        }

        public getSelectedValues(): any[]
        {
            return this.selectedItems.map((item) => item.value);
        }
        public setSelectedValues(values: any[])
        {
            this.selectedItems = [];
            this._get$Popup().find("input[type=checkbox]").prop("checked", false);
            if (values && values.forEach)
            {
                this._getListItems((items) => 
                {
                    items.forEach((item, i) =>
                    {
                        values.forEach((value) =>
                        {
                            if (item.value == value) 
                            {
                                this.selectedItems.push(item);
                                if (this.itemCheckBoxes.length > i)
                                {
                                    this.itemCheckBoxes[i].prop("checked", true);
                                }
                            }
                        });
                    });
                });
            }
            this.updateDisplayedValue();
        }

        public refreshList()
        {
            this._get$Popup().empty();
            this.itemCheckBoxes = [];

            this._getListItems((items) =>
            {
                items.forEach((item, i) =>
                {
                    var $item = $("<div class='item " + (item.cssClass || "") + "'>").appendTo(this._get$Popup());
                    var $checkbox = $("<input type='checkbox'>").appendTo($item);
                    $(document.createTextNode(item.text)).appendTo($item);

                    this.itemCheckBoxes.push($checkbox);
                    if (this.selectedItems.findIndex((si) => si.value == item.value) != -1)
                    {
                        $checkbox.prop("checked", true);
                    }

                    $checkbox.click((evt) =>
                    {
                        this.item_selectionUpdated(item, $checkbox.prop("checked") ? true : false);
                        evt.stopPropagation();
                    });

                    $item.click((evt) =>
                    {
                        $checkbox.prop("checked", !($checkbox.prop("checked")));
                        this.item_selectionUpdated(item, $checkbox.prop("checked") ? true : false);
                        evt.stopPropagation();
                    });
                });
            });

            this.updateDisplayedValue();
        }

        public input_keyDown(evt)
        {
            Console.debug("keyDown - evt.keyCode:" + evt.keyCode);
            return this.isEnabled() ? this.input_keyPress(evt) : false;
        }

        public input_keyPress(evt: JQueryKeyEventObject)
        {
            Console.debug("keypress - evt.keyCode:" + evt.keyCode);

            if (super._processNavKey(evt.keyCode, true))
            {
                return false;
            }
            else if ((evt.keyCode >= 65 /* A */) && (evt.keyCode <= 90 /* Z */))
            {
                if ((Date.now() - this.lastSearch) > 750)
                {
                    this.searchString = "";
                }
                this.searchString += String.fromCharCode(evt.keyCode).toLowerCase();
                this._getListItems((items) => 
                {
                    var itemIndex = items.findIndex((item) => item.text.toLowerCase().startsWith(this.searchString));
                    if (itemIndex != -1)
                    {
                        this._setCurrentItem(itemIndex);
                    }
                });
                this.lastSearch = Date.now();
                return false;
            }
            else if (evt.keyCode == 8 /* backspace */)
            {
                if (this.selectedItems.length > 0)
                {
                    this._getListItems((items) => 
                    {
                        var itemIndex = items.findIndex((item) => item === this.selectedItems[this.selectedItems.length - 1]);
                        this._selectCurrentItem(itemIndex);
                    });
                }
                return false;
            }
            else if (evt.keyCode != 9  /* tab */)
            {
                // Eat everything that isn't a tab
                return false;
            }
            // Do default processing
            return true;
        }

        public _selectCurrentItem(itemIndex: number)
        {
            var $checkbox = this.itemCheckBoxes[itemIndex];
            $checkbox.prop("checked", !($checkbox.prop("checked")));
            this._getListItems((items) => 
            {
                this.item_selectionUpdated(items[itemIndex], $checkbox.prop("checked") ? true : false);
            });
        }

        private item_selectionUpdated(selectedItem: ListItem, isSelected: boolean)
        {
            if (isSelected)
            {
                this.selectedItems.push(selectedItem);
            }
            else
            {
                this.selectedItems = this.selectedItems.filter((item) => item.value != selectedItem.value);
            }
            this.updateDisplayedValue();

            this._get$Input().focus();
            this._fireChangeEvent({});
        }

        private updateDisplayedValue()
        {
            var value = "";
            this.selectedItems.forEach((item, i) =>
            {
                if (i > 0) value += ",";
                value += item.text;
            });

            Console.debug("updateDisplayedValue('" + value + "')");

            this._get$Input().val(value);
        }
    }


    export class DropDownTree extends PopupControl
    {
        private treeView: TreeView;
        private selectedValue: string = "";
        private alwaysReload: boolean = false;
        private onlyShowLeafInText: boolean = false;

        constructor(element: any, dataSource: SimpleDataSource<ListItem> = null)
        {
            super(element, 'dropdown-list multi-dropdown', dataSource);

            this.treeView = new TreeView($("<div id='" + this.elementId + "_tree'>").appendTo(this._get$Popup()));
            this.treeView.onSelectionChanged((evt) =>
            {
                var selectedNode = this.treeView.getSelectedItem();
                this.selectedValue = selectedNode && selectedNode.value ? selectedNode.value : "";
                super._get$Input().val(this.onlyShowLeafInText ? this.selectedValue.split("/").pop() : this.selectedValue);
                super._showPopup(false);
                super._fireChangeEvent({ "selectedValue": this.selectedValue });
            });
        }

        public static create(options: any, dataSource: SimpleDataSource<ListItem>, parent: any): DropDownTree
        {
            return new DropDownTree($(Element.render("select", options)).appendTo(Element.get$(parent)), dataSource);
        }

        public getSelectedValue(): string
        {
            return this.selectedValue;
        }
        public setSelectedValue(value: string)
        {
            this.selectedValue = value || "";
            this.setText(this.onlyShowLeafInText ? value.split("/").pop() : value);
        }

        public setAlwaysReload(alwaysReload: boolean)
        {
            this.alwaysReload = alwaysReload;
        }
        
        public setOnlyShowLeafInText(onlyShowLeafInText: boolean)
        {
            this.onlyShowLeafInText = onlyShowLeafInText;
        }

        public refreshList()
        {
            if (this.alwaysReload)
            {
                super._loadData(null, (items) => this.treeView.setModel(this.buildTree(items)));
            }
            else
            {
                this._getListItems((items) => this.treeView.setModel(this.buildTree(items)));
            }
        }

        private buildTree(namedObjects: ListItem[]): TreeNode[]
        {
            var rootNodes: TreeNode[] = [];
            var treeNodesByPath: { [path: string]: TreeNode } = {};

            namedObjects.forEach((listItem) => 
            {
                // Used to accumulate path from root down to the leaves
                var path = "";
                // branch we are currently adding nodes to - initially root then the child collection of each node down the path
                var currentBranch: TreeNode[] = rootNodes;

                var pathElements = listItem.text.split("/");
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
                            isExpanded: false,
                            isSelectable: isLeafNode,
                            value: isLeafNode ? listItem.value : null,
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

        // Eat all key events to diable typing in combo-box input control
        public input_keyPress(evt: JQueryKeyEventObject)
        {
            return false;
        }
        public input_keyDown(evt)
        {
            return false;
        }
    }


    export class CheckList extends Control
    {
        private dataSource: SimpleDataSource<ListItem>;
        private enabled: boolean = true;
        private $list: JQuery = null;

        private listItems: ListItem[] = [];

        private rowClickSelects: boolean;
        private currentItemIndex: number = null;

        private currentItemChangeHandler: (evt: any) => void = null;
        private selectionChangeHandler: (evt: any) => void = null;

        constructor(element: any, rowClickSelects: boolean = true, dataSource: SimpleDataSource<ListItem> = null)
        {
            super(element);

            this.$element.addClass("form-control check-list");
            this.$list = $("<ul>").appendTo(this.$element);

            this.rowClickSelects = rowClickSelects;
            this.dataSource = dataSource || new SimpleArrayDataSource<ListItem>([]);

            this.reload();
        }

        public static create(options: any, rowClickSelects: boolean, dataSource: SimpleDataSource<ListItem>, parent: any): CheckList
        {
            return new CheckList($(Element.render("div", options)).appendTo(Element.get$(parent)), rowClickSelects, dataSource);
        }

        public onSelectionChanged(changeHandler: (evt: any) => void)
        {
            this.selectionChangeHandler = changeHandler;
        }

        public onCurrentItemChanged(changeHandler: (evt: any) => void)
        {
            this.currentItemChangeHandler = changeHandler;
        }

        public setEnabled(enabled: boolean)
        {
            this.enabled = enabled;
            if (this.enabled)
            {
                this.$element.find("input[type=checkbox]").removeAttr("disabled");
            }
            else
            {
                this.$element.find("input[type=checkbox]").attr("disabled", "disabled");
            }
        }

        public getCurrentItemIndex(): number
        {
            return this.currentItemIndex;
        }

        public getSelectedValues(): string[]
        {
            return this.listItems.filter((item) => item.isSelected).map((item) => item.value);
        }

        public isChecked(index: number): boolean
        {
            return this.listItems[index].isSelected;
        }

        public reload()
        {
            this.$list.empty();

            this.dataSource.getItems(null, (items) =>
            {
                this.listItems = items;

                this.listItems.forEach((item, i) =>
                {
                    var $li = $("<li class='item " + (item.cssClass || "") + "'>").appendTo(this.$list);
                    var $checkbox = $("<input type='checkbox'>").appendTo($li);
                    $(document.createTextNode(item.text)).appendTo($li);

                    $checkbox.prop("checked", item.isSelected);

                    $checkbox.click((evt) =>
                    {
                        Console.debug("$checkbox.click()");
                        this.$list.find("li").removeClass("selected");
                        this.currentItemIndex = i;
                        $li.addClass("selected");
                        item.isSelected = $checkbox.prop("checked") ? true : false;
                        this.fireSelectionChangeEvent();
                        this.fireCurrentItemChangeEvent();
                        evt.stopPropagation();
                    });

                    $li.click((evt) =>
                    {
                        Console.debug("$li.click()");
                        this.$list.find("li").removeClass("selected");
                        this.currentItemIndex = i;
                        $li.addClass("selected");
                        if (this.rowClickSelects)
                        {
                            var checkCheckbox = $checkbox.prop("checked") ? false : true;
                            $checkbox.prop("checked", checkCheckbox);
                            item.isSelected = checkCheckbox;
                            this.fireSelectionChangeEvent();
                        }
                        this.fireCurrentItemChangeEvent();
                        evt.stopPropagation();
                    });
                });
            });
        }

        private fireCurrentItemChangeEvent()
        {
            if (this.currentItemChangeHandler) this.currentItemChangeHandler({ "src": this });
        }

        private fireSelectionChangeEvent()
        {
            if (this.selectionChangeHandler) this.selectionChangeHandler({ "src": this });
        }
    }

    export interface DraggableListDropEvent
    {
        srcList: DraggableListBox;
        itemValues: string[];
        targetItemValue: string;
    }


    export class DraggableListBox extends Control
    {
        private selectionChangedHandler: (evt: any) => void = null;
        private dropHandler: (evt: DraggableListDropEvent) => void = null;

        private listModel: ListItem[] = [];
        private $UL: JQuery;
        private dragManager = new DragManager();
        private currentDragEvent: DragDropEvent = null;
        private supportsInsert: boolean = false;
        private multiSelect: boolean = true;

        constructor(element: any, supportsInsert: boolean = false, multiSelect: boolean = true)
        {
            super(element);

            this.supportsInsert = supportsInsert;
            this.multiSelect = multiSelect;
            this.$element.addClass("listbox");

            // Create list inside passed in DIV
            this.$UL = $("<ul>").appendTo(this.$element);

            // click on the background of the list de-selects eveything 
            this.$element.on("click", (evt) => this.setSelectedIndex(-1));

            // wire up drag manager events
            this.dragManager.onDragStart((evt) => this.dragManager_onDragStart(evt));
            this.dragManager.onTrackDrag((evt, overTarget) => this.dragManager_onTrackDrag(evt, overTarget));
            this.dragManager.onDrop((evt) => this.dragManager_onDrop(evt));

            // Register the whole control as a drop target
            this.dragManager.registerDropTarget(this.getElement());
        }

        // Register for selection changed events
        public onSelectionChanged(selectionChangedHandler: (evt: any) => void)
        {
            this.selectionChangedHandler = selectionChangedHandler;
        }

        // Register for notification when user drags items to list
        public onDrop(dragDropHandler: (evt: DraggableListDropEvent) => void)
        {
            this.dropHandler = dragDropHandler;
        }

        public clear(): void
        {
            this.$UL.empty();
            this.listModel = [];
            this.fireSelectionChanged();
        }

        public add(value: string, text: string = null, tooltip: string = null, cssClass: string = null)
        {
            var $li = $("<li id='" + this.elementId + "_" + this.listModel.length + "' style='position:relative;' "
                + (cssClass ? " class='" + cssClass + "'" : "") + "></li>").appendTo(this.$UL).text(text || value);

            if (tooltip)
            {
                Tooltip.addTooltip(tooltip, $li);
            }

            this.dragManager.$registerDragSource($li);

            $li.on("mousedown", (evt) => this.onItemMouseDown(evt));
            $li.on("click", (evt) =>
            {
                evt.stopPropagation();
                this.onItemClick(evt);
                return false;
            });
            this.listModel.push({ value: value, text: text, tooltip: tooltip, cssClass: cssClass, isSelected: false });
        }

        public getSelectedValue(): string
        {
            var selectedValues = this.getSelectedValues();
            return selectedValues.length > 0 ? selectedValues[0] : null;
        }

        public getSelectedValues(): string[]
        {
            return this.listModel.filter((item) => item.isSelected).map((item) => item.value);
        }

        public getAllValues(): string[]
        {
            return this.listModel.map((item) => item.value);
        }

        public getListItems(): ListItem[]
        {
            return this.listModel;
        }

        public getSelectedIndex(): number
        {
            var selectedIndices = this.getSelectedIndices();
            return selectedIndices.length > 0 ? selectedIndices[0] : -1;
        }

        public getSelectedIndices(): number[]
        {
            return this.listModel.map((item, i) => item.isSelected ? i : null).filter((index) => index != null);
        }

        public setSelectedIndex(index: number)
        {
            // clear existing selection
            this.$UL.children().removeClass("selected");
            $.each(this.listModel, (i, item) => { item.isSelected = false; });

            if (index != -1)
            {
                $("#" + this.elementId + "_" + index).addClass("selected");
                this.listModel[index].isSelected = true;
            }
            this.fireSelectionChanged();
        }

        // Handling selection in the presense of drag and drop is fiddly as the use needs selection
        // feedback on mouse down rather than click (so the item to be dragged gets selected before it gets dragged)
        // But, have to handle cases where dragging already selected items vs. dragging item that isn't selected
        // when other items are.... Fiddly.
        private onItemMouseDown(evt: JQueryEventObject): any
        {
            var selectedIndex = this.getIndexFromElementId((<HTMLElement>evt.delegateTarget).id);

            // handle multi-select
            var oldSelectedIndex = this.getSelectedIndex();
            if (evt.shiftKey && this.multiSelect && oldSelectedIndex != -1)
            {
                for (var i = Math.min(selectedIndex, oldSelectedIndex); i <= Math.max(selectedIndex, oldSelectedIndex); i++)
                {
                    $("#" + this.elementId + "_" + i).addClass("selected");
                    this.listModel[i].isSelected = true;
                }
                this.getSelectedIndex();
                this.fireSelectionChanged();
            }
            else
            {
                // When user mouse downs on an element that is not already selected and they aren't
                // holding the ctrl key then deselect everything before selecting the clicked item.
                // BUT if user mouse downs on an item that IS selected (and other items are also selected)
                // then we they may either be about to drag the selection or they want to discard the 
                // selection and replace it with the clicked item - but we can't know that until the mouse up
                // so that one case is handled in the click handler)
                if ((!(evt.ctrlKey || evt.metaKey) || !this.multiSelect) && !this.listModel[selectedIndex].isSelected)
                {
                    this.$UL.children().removeClass("selected");
                    $.each(this.listModel, (i, item) => { item.isSelected = false; });
                }
                $(evt.delegateTarget).addClass("selected");
                this.listModel[selectedIndex].isSelected = true;
                this.fireSelectionChanged();
            }
            evt.preventDefault();
            return false;
        }

        private onItemClick(evt: JQueryEventObject)
        {
            // Handle the case where user click on a selected item in a multi-selected set of items
            // and they didn't drag them - so deselect the other items
            var selectedIndex = this.getIndexFromElementId((<HTMLElement>evt.delegateTarget).id);
            if (((!evt.ctrlKey && !evt.metaKey && !evt.shiftKey) || !this.multiSelect) && this.listModel[selectedIndex].isSelected)
            {
                $.each(this.listModel, (i, item) =>
                {
                    if (i != selectedIndex)
                    {
                        item.isSelected = false;
                        $("#" + this.elementId + "_" + i).removeClass("selected");
                    }
                });
                this.fireSelectionChanged();
            }
        }

        // Internal drag-drop handling
        private dragManager_onDragStart(evt: DragDropEvent)
        {
            this.currentDragEvent = evt;

            evt.data = {
                srcList: this,
                itemValues: this.getSelectedValues()
            };

            if (this.getSelectedValues().length > 1)
            {
                // Create a 'stack' image to drag
                var $dragElement = $("<div>");
                $dragElement.css("position", "relative");
                $dragElement.css("width", $(evt.sourceElement).width() + 16);
                $dragElement.css("height", $(evt.sourceElement).height() + 16);

                var backgroundColor = $.Color($(evt.sourceElement).css("background-color"));
                var style = {
                    "position": "absolute",
                    "width": $(evt.sourceElement).width(),
                    "height": $(evt.sourceElement).height(),
                    "top": "",
                    "left": "",
                    "background-color": backgroundColor.toRgbaString(),
                    "cursor": "default"
                };

                var $shadow1 = $("<div>").appendTo($dragElement);
                style.top = style.left = "8px";
                style["background-color"] = backgroundColor.lightness(backgroundColor.lightness() * 0.95).toRgbaString();
                $shadow1.css(style);

                var $shadow2 = $("<div>").appendTo($dragElement);
                style.top = style.left = "4px";
                style["background-color"] = backgroundColor.lightness(backgroundColor.lightness() * 0.975).toRgbaString();
                $shadow2.css(style);

                var $mainElement = $("<div>").appendTo($dragElement).text(this.listModel[this.getSelectedIndex()].text);
                style.top = style.left = "0px";
                style["background-color"] = backgroundColor.toRgbaString();
                $mainElement.css(style);

                evt.visualDragElement = $dragElement.get(0);
            }
        }

        private dragManager_onTrackDrag(evt: DragDropEvent, overTarget: boolean)
        {
            if (overTarget)
            {
                if (this.currentDragEvent !== evt)
                {
                    this.$element.addClass("dragover");
                }
                if (this.supportsInsert)
                {
                    var overItemIndex = this.findTargetItemIndex(evt);
                    for (var i = 0; i < this.listModel.length; i++)
                    {
                        var $target = $("#" + this.elementId + "_" + i);
                        if ((overItemIndex == null) || (i < overItemIndex))
                        {
                            $target.css("top", "");
                        }
                        else
                        {
                            $target.css("top", "8px");
                        }
                    }
                }
            }
            else
            {
                this.$element.removeClass("dragover");
                if (this.supportsInsert)
                {
                    this.listModel.forEach((item, i) => $("#" + this.elementId + "_" + i).css("top", ""));
                }
            }
        }

        private dragManager_onDrop(evt: DragDropEvent)
        {
            var dropEvent = <DraggableListDropEvent>evt.data;
            if (this.supportsInsert)
            {
                var overItemIndex = this.findTargetItemIndex(evt);
                if (overItemIndex != null)
                {
                    dropEvent.targetItemValue = this.listModel[overItemIndex].value;
                }
            }
            if (this.dropHandler)
            {
                this.dropHandler(dropEvent);
            }
        }


        private getIndexFromElementId(elementId: string): number
        {
            return Number(elementId.substring(elementId.lastIndexOf("_") + 1));
        }

        private fireSelectionChanged()
        {
            if (this.selectionChangedHandler)
            {
                this.selectionChangedHandler({ src: this });
            }
        }

        private findTargetItemIndex(evt: DragDropEvent): number
        {
            for (var i = 0; i < this.listModel.length; i++)
            {
                var $target = $("#" + this.elementId + "_" + i);
                // When we drag over items they get shifted down by setting their "top" value - need to substract that

                var elementShift = this.convertToPixels($target.css("top"));
                var targetRect = $target.get(0).getBoundingClientRect();
                if ((evt.mouseX >= targetRect.left) && (evt.mouseX <= targetRect.right)
                    && (evt.mouseY >= (targetRect.top - elementShift)) && (evt.mouseY <= (targetRect.bottom - elementShift)))                  
                {
                    return i;
                }
            }
            return null;
        }

        private convertToPixels(cssDimension: string): number
        {
            if (cssDimension && cssDimension.endsWith("px"))
            {
                return parseInt(cssDimension.substring(0, cssDimension.indexOf("px")));
            }
            else
            {
                return 0;
            }
        }
    }

    class ColorSlider extends Control
    {
        private static THUMB_WIDTH  = 10;

        private track: Element;
        private thumb: DraggableElement;
        private canvas: HTMLCanvasElement;
        
        private currentValue : number = 0;

        constructor(element: any)
        {
            super(element);

            this.track = new Element($("<div class='color-slider'>").appendTo(this.$element));
            this.track.css({
                "position": "relative",
                "height": "16px"
            });

            var $canvas = $("<canvas>").appendTo(this.track.$element);
            $canvas.css({
                "position": "absolute",
                "top": "0px",
                "left": "0px",
                "width": "100%",
                "height": "100%",
            });
            this.canvas = <HTMLCanvasElement>($canvas.get(0));

            this.thumb = new DraggableElement($("<div>").appendTo(this.track.$element), Direction.Horizontal, -(ColorSlider.THUMB_WIDTH / 2), this.track.getWidth() - (ColorSlider.THUMB_WIDTH / 2));
            this.thumb.css({
                "position": "absolute",
                "top": "-4px",
                "left": "-" + (ColorSlider.THUMB_WIDTH / 2) + "px",
                "bottom": "-4px",
                "width": "" + ColorSlider.THUMB_WIDTH + "px",
                "-webkit-user-select": "none", /* Chrome/Safari */
                "-moz-user-select": "none", /* Firefox */
                "-ms-user-select": "none", /* IE10+ */
                "user-select": "none"
            });   
            
            this.thumb.onClick((evt) =>  evt.stopPropagation());
        }

        public static create(parent: any): ColorSlider
        {
            return new ColorSlider($(Element.render("div", {})).appendTo(Element.get$(parent)));
        }
        
        public onChanged(changeHandler: (evt: any) => void)
        {
            this.thumb.onDrag((evt) => {
                this.currentValue = (evt.position + (ColorSlider.THUMB_WIDTH / 2)) / this.track.getWidth();
                changeHandler({ "value" : this.currentValue});
            });

            this.track.onClick((evt) =>
            {
                this.currentValue = evt.offsetX / this.track.getWidth();
                this.thumb.setLeft(evt.offsetX - (ColorSlider.THUMB_WIDTH / 2));
                changeHandler({ "value": this.currentValue });
            });
        }
        
        public set value(value : number)
        {
            this.currentValue = value;
            this.thumb.setLeft((value * this.track.getWidth()) - (ColorSlider.THUMB_WIDTH / 2));
        }        
        public get value() : number
        {
            return this.currentValue;
        }
        
        public setColorScale(scale : RGBA[])
        {
            var g = this.canvas.getContext("2d");
            var width = this.canvas.width;
            var height = this.canvas.height;

            g.rect(0, 0, width, height);
            var colorGradient = g.createLinearGradient(0, 0, width, 0);

            for (var i = 0; i < scale.length; i++)
            {
                colorGradient.addColorStop(i / (scale.length - 1), "rgba(" + scale[i].r + "," + scale[i].g + "," + scale[i].b + ",1.0)");
            }
            
            g.fillStyle = colorGradient;
            g.fill();
       }
    }

    export class ColorPicker extends PopupControl
    {
        private sliderHue: ColorSlider = null;
        private sliderSaturation: ColorSlider = null;
        private sliderLightness: ColorSlider = null;
        
        private currentColor : HSLA;
        // Allow use to select no colour
        private optional : boolean;
        
        constructor(element: any, optional: boolean = false)
        {
            super(element, 'dropdown-list color-picker', new SimpleArrayDataSource([]));
            
            this.optional = optional;
            this.currentColor = optional ? null : {"h":0.5,"s":0.5,"l":0.5};
            
            if(optional)
            {
                this._get$Input().val("").attr("placeholder", "Auto");
            }   
            
            this._get$Input().on("blur", (evt) =>
            {
                var enteredColor = ColorUtil.parseHex(this.getText());
                if (enteredColor)
                {
                    this.currentColor = ColorUtil.rgb2hsl(enteredColor);
                }
                else if (this.optional)
                {
                    this.currentColor = null;
                    this.setText("");
                }
                else
                {
                    this.setText(ColorUtil.rgb2hex(ColorUtil.hsl2rgb(this.currentColor)));
                }
                this.updateUIColors();
            });
        }

        public static create(options: any, optional : boolean, parent: any): ColorPicker
        {
            return new ColorPicker($(Element.render("div", options)).appendTo(Element.get$(parent)), optional);
        }

        public getColor(): string
        {
            var enteredColor = ColorUtil.parseHex(this.getText());
            return ColorUtil.rgb2hex(enteredColor || ColorUtil.hsl2rgb(this.currentColor));
        }
        public setColor(value: string)
        {
            this.setText(value || "");

            if (value)
            {
                var rgb = ColorUtil.parseHex(value) || { "r": 128, "g": 128, "b": 128 };
                this.currentColor = ColorUtil.rgb2hsl(rgb);

                if (this.sliderHue != null)
                {
                    this.sliderHue.value = this.currentColor.h;
                    this.sliderSaturation.value = this.currentColor.s;
                    this.sliderLightness.value = this.currentColor.l;
                }
            }
            else
            {
                this.currentColor = null;
            }
            this.updateUIColors();
        }

        // Override
        public _showPopup(show: boolean)
        {
            super._showPopup(show);

            if (show && (this.sliderHue == null))
            {
                var $popup = this._get$Popup();
                $popup.empty();

                this.sliderHue = ColorSlider.create($popup);
                this.sliderHue.onChanged((evt) => this.onSliderChanged());
                this.sliderHue.setColorScale(this.createHueColorScale());
                this.sliderHue.value = this.currentColor ? this.currentColor.h : 0.5;

                this.sliderSaturation = ColorSlider.create($popup);
                this.sliderSaturation.onChanged((evt) => this.onSliderChanged());
                if( this.currentColor)
                {
                    this.sliderSaturation.setColorScale(this.createSaturationColorScale());
                    this.sliderSaturation.value = this.currentColor.s;
                }
                else
                {
                    this.sliderSaturation.setColorScale([{ "r": 128, "g": 128, "b": 128 }, { "r": 0, "g": 255, "b": 255 }]);
                    this.sliderSaturation.value = 0.5;
                }
 
                this.sliderLightness = ColorSlider.create($popup);
                this.sliderLightness.onChanged((evt) => this.onSliderChanged());
                this.sliderLightness.setColorScale([{ "r": 0, "g": 0, "b": 0 }, { "r": 255, "g": 255, "b": 255 }]);
                this.sliderLightness.value = this.currentColor ? this.currentColor.l : 0.5;
            }
        }

        // Override
        public _handleBackgroundClick(evt: any)
        {
            // do nothing
        }
        
        private onSliderChanged()
        {
            this.currentColor = {
                "h": this.sliderHue.value,
                "s": this.sliderSaturation.value,
                "l": this.sliderLightness.value
            };
            this.updateUIColors();
        }

        private updateUIColors()
        {
            var $input = this._get$Input();
            if (this.currentColor)
            {
                if (this.sliderSaturation != null)
                {
                    this.sliderSaturation.setColorScale(this.createSaturationColorScale());
                }

                var rgb = ColorUtil.hsl2rgb(this.currentColor);
                $input.css({ "background-color": "rgba(" + rgb.r + "," + rgb.g + "," + rgb.b + ",1.0)" });
                $input.css({ "color": (this.currentColor.l < 0.5) ? "#FFFFFF" : "#000000" });
                $input.val(ColorUtil.rgb2hex(rgb));
            }
            else
            {
                $input.css({ "background-color": "#FFFFFF" });
                $input.css({ "color": "#000000" });
            }
        }
        
        private createSaturationColorScale(): RGBA[]
        {
            var desaturated = ColorUtil.hsl2rgb({ "h": this.currentColor.h, "s": 0, "l": 0.6 });
            var saturated = ColorUtil.hsl2rgb({ "h": this.currentColor.h, "s": 1.0, "l": 0.6 });
            return [desaturated, saturated];
        }
        
        private createHueColorScale(): RGBA[]
        {
            var colorStops: RGBA[] = [];

            var hsl = { "h": 0, "s": 1.0, "l": 0.5 };
            for (var i = 0; i < 16; i++)
            {
                hsl.h = i / 15;
                colorStops[i] = ColorUtil.hsl2rgb(hsl);
            }
            return colorStops;
        }
    }
    
 
    export class ProgressBar extends Control
    {
        private progressBar: Element;

        constructor(element: any)
        {
            super(element);

            this.$element.addClass("progress active");

            this.progressBar = new Element($("<div class='progress-bar' role='progressbar' style='width: 0%;'>").appendTo(this.$element));
        }
        
        public setPercentage(percentage : number)
        {
            this.progressBar.css({ "width" : percentage + "%"});
        }

        public static create(parent: any): ProgressBar
        {
            return new ProgressBar($(Element.render("div", {})).appendTo(Element.get$(parent)));
        }
    }
}