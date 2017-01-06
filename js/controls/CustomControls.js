var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var controls;
(function (controls) {
    var ColorUtil = util.ColorUtil;
    var PopupControl = (function (_super) {
        __extends(PopupControl, _super);
        function PopupControl(element, cssClass, dataSource, isComboBox, suggestOnly) {
            var _this = this;
            if (dataSource === void 0) { dataSource = null; }
            if (isComboBox === void 0) { isComboBox = false; }
            if (suggestOnly === void 0) { suggestOnly = false; }
            _super.call(this, element);
            this.enabled = true;
            this.popupVisible = false;
            this.supressCloseOnBlur = false;
            // Full list of items from the datasource
            this.listItems = null;
            // currently selected item in pop-up (for up-arrow/down-arrow selecting)
            this.currentIndex = null;
            // Save reference to handler so we can wire/unwire it as required
            this.backgroundClickHandler = null;
            this.changeHandler = null;
            if (dataSource != null) {
                this.dataSource = dataSource;
            }
            else {
                // Read items from existing markup    
                var listItems = [];
                this.$element.find("option").each(function (i, element) {
                    listItems.push({
                        value: _this.getAttribute(element, "value"),
                        tooltip: _this.getAttribute(element, "tool-tip"),
                        isSelected: _this.getAttribute(element, "selected") ? true : false,
                        text: element.textContent || ""
                    });
                });
                this.dataSource = new controls.SimpleArrayDataSource(listItems);
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
            if (isComboBox) {
                this.$previewInput = $("<input type=text  class='preview " + inputClass + "' " + inputStyle + " disabled/>").appendTo(this.$inputWrapper);
            }
            this.$input = $("<input type=text class='" + inputClass + "' " + inputStyle + "/>").appendTo(this.$inputWrapper);
            if (isComboBox) {
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
            if (!suggestOnly) {
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
            this.backgroundClickHandler = function (evt) { return _this._handleBackgroundClick(evt); };
            this.$input.keyup(function (evt) {
                return _this.input_keyUp(evt);
            });
            this.$input.keydown(function (evt) {
                return _this.input_keyDown(evt);
            });
            this.$input.keypress(function (evt) {
                return _this.input_keyPress(evt);
            });
            this.$input.blur(function (evt) {
                return _this._input_blur(evt);
            });
            // For ComboBox user has to click on arrow - for others click aywhere in control
            if (isComboBox) {
                if (this.$arrow) {
                    this.$arrow.click(function (evt) {
                        if (_this.enabled) {
                            if (!_this.popupVisible) {
                                // ComboBox needs to show complete unfiltered list if user clicks arrow
                                _this.refreshList();
                            }
                            _this._showPopup(!_this.popupVisible);
                            evt.stopPropagation();
                        }
                    });
                }
            }
            else {
                this.$inputWrapper.click(function (evt) {
                    if (_this.enabled) {
                        _this.refreshList();
                        _this._showPopup(!_this.popupVisible);
                        evt.stopPropagation();
                    }
                });
            }
            this.$popup.mousedown(function (evt) {
                controls.Console.debug("$popup.mousedown()");
                _this.supressCloseOnBlur = true;
            });
            this.$popup.mouseup(function (evt) {
                controls.Console.debug("$popup.mouseup()");
                _this.supressCloseOnBlur = false;
            });
        }
        PopupControl.prototype.onChanged = function (changeHandler) {
            this.changeHandler = changeHandler;
        };
        PopupControl.prototype.getText = function () {
            return this.$input.val();
        };
        PopupControl.prototype.setText = function (text) {
            this.$input.val(text);
        };
        PopupControl.prototype.reload = function () {
            var _this = this;
            this._loadData({}, function (listItems) { return _this.refreshList(); });
        };
        PopupControl.prototype.setEnabled = function (enabled) {
            this.enabled = enabled;
            if (this.enabled) {
                this.$input.prop("readonly", false);
                this.$input.addClass("editable");
                this.$arrow.show();
            }
            else {
                this.$input.prop("readonly", true);
                this.$input.removeClass("editable");
                this.$arrow.hide();
            }
        };
        PopupControl.prototype.isEnabled = function () {
            return this.enabled;
        };
        /*** "Protected" methods ***/
        PopupControl.prototype._loadData = function (params, callback) {
            var _this = this;
            this.dataSource.getItems(params || {}, function (listItems) {
                _this.listItems = listItems;
                _this.listItems.forEach(function (item) {
                    item.text = (item.text || "").toString();
                });
                callback(_this.listItems);
            });
        };
        PopupControl.prototype._getListItems = function (callback) {
            if (this.listItems != null) {
                callback(this.listItems);
            }
            else {
                this._loadData(null, callback);
            }
            return this.listItems;
        };
        PopupControl.prototype._clearSelection = function () {
            this.currentIndex = null;
        };
        PopupControl.prototype._get$Input = function () {
            return this.$input;
        };
        PopupControl.prototype._get$PreviewInput = function () {
            return this.$previewInput;
        };
        PopupControl.prototype._get$Popup = function () {
            return this.$popup;
        };
        PopupControl.prototype._showPopup = function (show, keepFocus) {
            if (keepFocus === void 0) { keepFocus = false; }
            controls.Console.debug("showPopup(show:" + show + ",keepFocus:" + keepFocus + ")");
            if (show != this.popupVisible) {
                if (show) {
                    this.$popup.show();
                    this.popupVisible = true;
                    // manually add/remove "focus" class so we can arrange for hover outline to 
                    // stay visible in clip details view while pop-up is open. 
                    this.$inputWrapper.addClass("focus");
                    $(document).on("click", this.backgroundClickHandler);
                }
                else {
                    this.$popup.hide();
                    this.$popup.children().removeClass("selected");
                    this.popupVisible = false;
                    this.currentIndex = null;
                    if (keepFocus)
                        this.$input.focus();
                    // manually add/remove "focus" class 
                    this.$inputWrapper.removeClass("focus");
                    $(document).off("click", this.backgroundClickHandler);
                }
            }
        };
        PopupControl.prototype._processNavKey = function (keyCode, spaceSelectsCurrentItem, currentItemsCount) {
            if (currentItemsCount === void 0) { currentItemsCount = null; }
            if (!this.enabled || !this.listItems)
                return null;
            var numCurrentItems = currentItemsCount || this.listItems.length;
            if (keyCode == 40 /* down arrow */) {
                this._showPopup(true);
                this._setCurrentItem((this.currentIndex != null) ? Math.min(this.currentIndex + 1, numCurrentItems - 1) : 0);
                return true;
            }
            else if ((keyCode == 38 /* up arrow */) && (this.currentIndex != null)) {
                this._setCurrentItem(Math.max(this.currentIndex - 1, 0));
                return true;
            }
            else if (spaceSelectsCurrentItem && (keyCode == 32 /* space */) && (this.currentIndex != null)) {
                this._selectCurrentItem(this.currentIndex);
            }
            else if (keyCode == 13 /* enter */) {
                if (this.popupVisible) {
                    if (this.currentIndex != null) {
                        // Enter while pop-up visible accepts currently select item in pop-up and closes pop-up
                        this._showPopup(false, true);
                        return true;
                    }
                }
                else {
                    // Enter while pop-up not visible accepts currently value
                    this._fireChangeEvent({});
                    return true;
                }
            }
            return false;
        };
        PopupControl.prototype._setCurrentItem = function (currentItemIndex) {
            controls.Console.debug("_setCurrentItem(" + currentItemIndex + ")");
            this.currentIndex = currentItemIndex;
            this.$popup.children().removeClass("selected");
            var $selected = this.$popup.children().eq(this.currentIndex);
            $selected.addClass("selected");
            $selected.scrollintoview();
        };
        PopupControl.prototype._fireChangeEvent = function (evt) {
            if (this.changeHandler) {
                this.changeHandler($.extend({ "src": this }, evt));
            }
        };
        PopupControl.prototype._input_blur = function (evt) {
            controls.Console.debug("$input.blur()");
            // Ignore blur if it's because we clicked in the popup
            if (this.enabled && !this.supressCloseOnBlur && this.popupVisible) {
                this._showPopup(false, false);
            }
            return true;
        };
        PopupControl.prototype._handleBackgroundClick = function (evt) {
            if (this.popupVisible) {
                controls.Console.debug("backgroundClickHandler()");
                this._showPopup(false, false);
            }
        };
        /** Private methods **/
        PopupControl.prototype.getAttribute = function (element, attributeName) {
            var attr = element.attributes.getNamedItem(attributeName);
            return attr != null ? attr.value : null;
        };
        /** Abstract methods **/
        PopupControl.prototype.refreshList = function () { };
        PopupControl.prototype.inputWrapper_click = function (evt) { };
        PopupControl.prototype.input_keyUp = function (evt) { return true; };
        PopupControl.prototype.input_keyDown = function (evt) { return true; };
        PopupControl.prototype.input_keyPress = function (evt) { return true; };
        PopupControl.prototype._selectCurrentItem = function (currentItemIndex) { };
        return PopupControl;
    }(controls.Control));
    var ComboBox = (function (_super) {
        __extends(ComboBox, _super);
        function ComboBox(element, dataSource, fixedValues, suggestOnly) {
            if (dataSource === void 0) { dataSource = null; }
            if (fixedValues === void 0) { fixedValues = true; }
            if (suggestOnly === void 0) { suggestOnly = false; }
            _super.call(this, element, 'dropdown-list auto-suggest', dataSource, true, suggestOnly);
            this.selectedItem = null;
            this.previewSelectedItem = null;
            this.allItems = [];
            this.currentItems = [];
            this.fixedValues = fixedValues && !suggestOnly;
            this.suggestOnly = suggestOnly;
            // ComboBox needs to pre-load the data because the key event handlers need to be check if a key should be accepted
            // or not, based on whether it matches against the list of items, but can't call the asynchronous _getListItems() 
            // method as the key handlers are synchronous and need to return true or false. 
            _super.prototype._getListItems.call(this, function (items) { });
        }
        ComboBox.create = function (options, dataSource, fixedValues, suggestOnly, parent) {
            return new ComboBox($(controls.Element.render("select", options)).appendTo(controls.Element.get$(parent)), dataSource, fixedValues, suggestOnly);
        };
        ComboBox.prototype.getSelectedItem = function () {
            return this.selectedItem;
        };
        ComboBox.prototype.getSelectedValue = function () {
            if (this.fixedValues) {
                return this.selectedItem != null ? this.selectedItem.value : null;
            }
            else {
                return _super.prototype.getText.call(this);
            }
        };
        ComboBox.prototype.setSelectedValue = function (value) {
            if (this.fixedValues) {
                this.setSelectedItem(this.allItems.find(function (item) { return item.value == value; }), false);
            }
            else {
                _super.prototype.setText.call(this, value);
                this.filterList(value);
            }
        };
        // Override
        ComboBox.prototype.setText = function (text) {
            _super.prototype.setText.call(this, text);
            if (!this.suggestOnly)
                this.filterList(text);
        };
        ComboBox.prototype.input_keyDown = function (evt) {
            if (!_super.prototype.isEnabled.call(this) || !this.fixedValues)
                return true;
            controls.Console.debug("keydown - evt.keyCode:" + evt.keyCode);
            if ((evt.keyCode == 46 /* delete */) || (evt.keyCode == 8 /* backspace */)) {
                // Calculate what text would look like if this key was processed
                var selection = this.getInputSelection(this._get$Input().get(0));
                var oldValue = this._get$Input().val();
                var textAfterKeyPressApplied;
                if (selection.start == selection.end) {
                    if (evt.keyCode == 46 /* delete */) {
                        textAfterKeyPressApplied = oldValue.substring(0, selection.start) + oldValue.substring(selection.start + 1);
                    }
                    else {
                        textAfterKeyPressApplied = oldValue.substring(0, selection.start - 1) + oldValue.substring(selection.start);
                    }
                }
                else {
                    textAfterKeyPressApplied = oldValue.substring(0, selection.start) + oldValue.substring(selection.end);
                }
                var match = this.allItems.find(function (item) { return item.text.toLowerCase().startsWith(textAfterKeyPressApplied.toLowerCase()); });
                controls.Console.debug("match:" + match);
                return match ? true : false;
            }
            else {
                return true;
            }
        };
        ComboBox.prototype.input_keyUp = function (evt) {
            var _this = this;
            // Process control keys
            controls.Console.debug("keyup - evt.keyCode:" + evt.keyCode);
            if (!_super.prototype.isEnabled.call(this))
                return true;
            if (!_super.prototype._processNavKey.call(this, evt.keyCode, false, this.currentItems.length)) {
                if ((evt.keyCode != 9 /* tab */) && (evt.keyCode != 37 /* left */) && (evt.keyCode != 39 /* right */) && (evt.keyCode != 46 /* del */)) {
                    controls.Console.debug("keyup - default action");
                    controls.Dispatcher.dispatch(function () {
                        if (!_this.suggestOnly)
                            _this._showPopup(true, false);
                        _this.filterList(_this._get$Input().val());
                    });
                }
            }
            return true;
        };
        ComboBox.prototype.input_keyPress = function (evt) {
            var _this = this;
            if (!this.isEnabled() || !this.fixedValues)
                return true;
            controls.Console.debug("keypress - evt.keyCode:" + evt.keyCode + " String.fromCharCode(evt.charCode): '" + String.fromCharCode(evt.charCode) + "'");
            // Calculate what text would look like if this key was processed
            var selection = this.getInputSelection(this._get$Input().get(0));
            var oldValue = this._get$Input().val();
            var textAfterKeyPressApplied = oldValue.substring(0, selection.start) + String.fromCharCode(evt.charCode) + oldValue.substring(selection.end);
            controls.Console.debug("textAfterKeyPressApplied:'" + textAfterKeyPressApplied + "'");
            if (this.allItems.find(function (item) { return item.text.toLowerCase().startsWith(textAfterKeyPressApplied.toLowerCase()); })) {
                controls.Dispatcher.dispatch(function () {
                    _this._showPopup(true);
                    _this.filterList(_this._get$Input().val());
                });
                controls.Console.debug("OK");
                return true;
            }
            else {
                controls.Console.debug("Cancel");
                return false;
            }
        };
        // Override
        ComboBox.prototype._loadData = function (params, callback) {
            var _this = this;
            _super.prototype._loadData.call(this, params, function (items) {
                _this.allItems = items;
                if (_this.fixedValues) {
                    _this.allItems.forEach(function (item) {
                        if (item.isSelected) {
                            _this.setSelectedItem(item, false);
                        }
                    });
                }
                callback(items);
            });
        };
        ComboBox.prototype._input_blur = function (evt) {
            _super.prototype._input_blur.call(this, evt);
            // auto-accept the currently matched item
            if (this.fixedValues && !this.getSelectedItem()) {
                this.setSelectedItem(this.previewSelectedItem || this.currentItems[0] || this.allItems[0], true);
            }
            return true;
        };
        // Override
        ComboBox.prototype._setCurrentItem = function (currentItemIndex) {
            _super.prototype._setCurrentItem.call(this, currentItemIndex);
            if (currentItemIndex != null) {
                this.setSelectedItem(this.currentItems[currentItemIndex], true);
            }
        };
        // Override
        ComboBox.prototype._showPopup = function (show, keepFocus) {
            if (keepFocus === void 0) { keepFocus = true; }
            _super.prototype._showPopup.call(this, show, keepFocus);
            if (!show) {
                if (!keepFocus && this.fixedValues && (this.previewSelectedItem != null)) {
                    this.setSelectedItem(this.previewSelectedItem, true);
                }
                else if (this.suggestOnly && keepFocus) {
                    this._fireChangeEvent({});
                }
            }
        };
        ComboBox.prototype.refreshList = function () {
            controls.Console.debug("ComboBox.refreshList()");
            // Refresh gets called when the user clicks the arrow so we want to populate the list with all the values 
            // We only do the filtering as they type otherwise you can't use it like a normal combo.
            this.filterList("");
        };
        ComboBox.prototype.filterList = function (filterValue) {
            var _this = this;
            if (this.suggestOnly) {
                this._loadData({ "filter": filterValue }, function (listItems) {
                    _this.currentItems = _this.allItems = listItems;
                    _this.renderList();
                    _super.prototype._showPopup.call(_this, _this.currentItems.length > 0);
                });
            }
            else {
                this.currentItems = this.allItems.filter(function (item) { return item.text.toLowerCase().startsWith((filterValue || "").toLowerCase()); });
                this.renderList();
                if (this.currentItems.length > 0) {
                    if (this.fixedValues) {
                        var inputValLength = filterValue.length;
                        if (inputValLength > 0) {
                            // Get first suggestion
                            this.previewSelectedItem = this.currentItems[0];
                            // Set the preview text to that
                            this._get$PreviewInput().val(this.previewSelectedItem.text);
                            // If what the user has typed isn't the same case as what's in the list then 'correct' the typed value
                            var textFromValue = this.previewSelectedItem.text.substr(0, inputValLength);
                            if (this._get$Input().val() !== textFromValue) {
                                this._get$Input().val(textFromValue);
                            }
                        }
                        else {
                            this.previewSelectedItem = null;
                            this.selectedItem = null;
                            this._get$PreviewInput().val("");
                        }
                    }
                }
                else {
                    this._get$Popup().html("<i>No matches</i>");
                }
            }
        };
        ComboBox.prototype.renderList = function () {
            var _this = this;
            this._get$Popup().empty();
            if (this.selectedItem && !this.currentItems.find(function (item) { return item.value == _this.selectedItem.value; })) {
                this.selectedItem = null;
            }
            this._clearSelection();
            this.currentItems.forEach(function (item, i) {
                // breaks focussing because <a> tags get focus then get hidden. need another way to do tootltips
                // var $item = $("<div class='item " + (item.cssClass || "") + "'><a href='#' title='" + item.tooltip + "' disabled>" + item.text + "</a></div>").appendTo(this.$popup);
                var $item = $("<div class='item " + (item.cssClass || "") + "'></div>").appendTo(_this._get$Popup()).text(item.text);
                $item.click(function (evt) {
                    controls.Console.debug("$item.click()");
                    _this.setSelectedItem(item, true);
                    _this._showPopup(false);
                });
            });
        };
        ComboBox.prototype.getInputSelection = function (el) {
            if (typeof el.selectionStart == "number" && typeof el.selectionEnd == "number") {
                return {
                    start: el.selectionStart,
                    end: el.selectionEnd
                };
            }
            else {
                var range = document.selection.createRange();
                var stored_range = range.duplicate();
                stored_range.moveToElementText(el);
                stored_range.setEndPoint('EndToEnd', range);
                return {
                    start: stored_range.text.length - range.text.length,
                    end: el.selectionStart + range.text.length
                };
            }
        };
        ComboBox.prototype.setSelectedItem = function (item, raiseChangeEvent) {
            var changed = (item != this.selectedItem);
            controls.Console.debug("setSelectedItem(" + (item ? item.text : "null") + ") - changed:" + changed);
            this.selectedItem = item;
            this.previewSelectedItem = null;
            this._get$Input().val(this.selectedItem ? this.selectedItem.text : "");
            if (this.fixedValues) {
                this._get$PreviewInput().val("");
            }
            if (raiseChangeEvent && changed && !this.suggestOnly)
                this._fireChangeEvent({});
        };
        return ComboBox;
    }(PopupControl));
    controls.ComboBox = ComboBox;
    var MultiSelectDropDownList = (function (_super) {
        __extends(MultiSelectDropDownList, _super);
        function MultiSelectDropDownList(element, fixedValues, dataSource) {
            if (dataSource === void 0) { dataSource = null; }
            _super.call(this, element, 'dropdown-list multi-dropdown', dataSource);
            this.itemCheckBoxes = [];
            this.selectedItems = [];
            this.searchString = "";
            this.lastSearch = 0;
            this.fixedValues = fixedValues;
        }
        MultiSelectDropDownList.create = function (options, fixedValues, dataSource, parent) {
            return new MultiSelectDropDownList($(controls.Element.render("select", options)).appendTo(controls.Element.get$(parent)), fixedValues, dataSource);
        };
        MultiSelectDropDownList.prototype.getSelectedItems = function () {
            return this.selectedItems;
        };
        MultiSelectDropDownList.prototype.getSelectedValues = function () {
            return this.selectedItems.map(function (item) { return item.value; });
        };
        MultiSelectDropDownList.prototype.setSelectedValues = function (values) {
            var _this = this;
            this.selectedItems = [];
            this._get$Popup().find("input[type=checkbox]").prop("checked", false);
            if (values && values.forEach) {
                this._getListItems(function (items) {
                    items.forEach(function (item, i) {
                        values.forEach(function (value) {
                            if (item.value == value) {
                                _this.selectedItems.push(item);
                                if (_this.itemCheckBoxes.length > i) {
                                    _this.itemCheckBoxes[i].prop("checked", true);
                                }
                            }
                        });
                    });
                });
            }
            this.updateDisplayedValue();
        };
        MultiSelectDropDownList.prototype.refreshList = function () {
            var _this = this;
            this._get$Popup().empty();
            this.itemCheckBoxes = [];
            this._getListItems(function (items) {
                items.forEach(function (item, i) {
                    var $item = $("<div class='item " + (item.cssClass || "") + "'>").appendTo(_this._get$Popup());
                    var $checkbox = $("<input type='checkbox'>").appendTo($item);
                    $(document.createTextNode(item.text)).appendTo($item);
                    _this.itemCheckBoxes.push($checkbox);
                    if (_this.selectedItems.findIndex(function (si) { return si.value == item.value; }) != -1) {
                        $checkbox.prop("checked", true);
                    }
                    $checkbox.click(function (evt) {
                        _this.item_selectionUpdated(item, $checkbox.prop("checked") ? true : false);
                        evt.stopPropagation();
                    });
                    $item.click(function (evt) {
                        $checkbox.prop("checked", !($checkbox.prop("checked")));
                        _this.item_selectionUpdated(item, $checkbox.prop("checked") ? true : false);
                        evt.stopPropagation();
                    });
                });
            });
            this.updateDisplayedValue();
        };
        MultiSelectDropDownList.prototype.input_keyDown = function (evt) {
            controls.Console.debug("keyDown - evt.keyCode:" + evt.keyCode);
            return this.isEnabled() ? this.input_keyPress(evt) : false;
        };
        MultiSelectDropDownList.prototype.input_keyPress = function (evt) {
            var _this = this;
            controls.Console.debug("keypress - evt.keyCode:" + evt.keyCode);
            if (_super.prototype._processNavKey.call(this, evt.keyCode, true)) {
                return false;
            }
            else if ((evt.keyCode >= 65 /* A */) && (evt.keyCode <= 90 /* Z */)) {
                if ((Date.now() - this.lastSearch) > 750) {
                    this.searchString = "";
                }
                this.searchString += String.fromCharCode(evt.keyCode).toLowerCase();
                this._getListItems(function (items) {
                    var itemIndex = items.findIndex(function (item) { return item.text.toLowerCase().startsWith(_this.searchString); });
                    if (itemIndex != -1) {
                        _this._setCurrentItem(itemIndex);
                    }
                });
                this.lastSearch = Date.now();
                return false;
            }
            else if (evt.keyCode == 8 /* backspace */) {
                if (this.selectedItems.length > 0) {
                    this._getListItems(function (items) {
                        var itemIndex = items.findIndex(function (item) { return item === _this.selectedItems[_this.selectedItems.length - 1]; });
                        _this._selectCurrentItem(itemIndex);
                    });
                }
                return false;
            }
            else if (evt.keyCode != 9 /* tab */) {
                // Eat everything that isn't a tab
                return false;
            }
            // Do default processing
            return true;
        };
        MultiSelectDropDownList.prototype._selectCurrentItem = function (itemIndex) {
            var _this = this;
            var $checkbox = this.itemCheckBoxes[itemIndex];
            $checkbox.prop("checked", !($checkbox.prop("checked")));
            this._getListItems(function (items) {
                _this.item_selectionUpdated(items[itemIndex], $checkbox.prop("checked") ? true : false);
            });
        };
        MultiSelectDropDownList.prototype.item_selectionUpdated = function (selectedItem, isSelected) {
            if (isSelected) {
                this.selectedItems.push(selectedItem);
            }
            else {
                this.selectedItems = this.selectedItems.filter(function (item) { return item.value != selectedItem.value; });
            }
            this.updateDisplayedValue();
            this._get$Input().focus();
            this._fireChangeEvent({});
        };
        MultiSelectDropDownList.prototype.updateDisplayedValue = function () {
            var value = "";
            this.selectedItems.forEach(function (item, i) {
                if (i > 0)
                    value += ",";
                value += item.text;
            });
            controls.Console.debug("updateDisplayedValue('" + value + "')");
            this._get$Input().val(value);
        };
        return MultiSelectDropDownList;
    }(PopupControl));
    controls.MultiSelectDropDownList = MultiSelectDropDownList;
    var DropDownTree = (function (_super) {
        __extends(DropDownTree, _super);
        function DropDownTree(element, dataSource) {
            var _this = this;
            if (dataSource === void 0) { dataSource = null; }
            _super.call(this, element, 'dropdown-list multi-dropdown', dataSource);
            this.selectedValue = "";
            this.alwaysReload = false;
            this.onlyShowLeafInText = false;
            this.treeView = new controls.TreeView($("<div id='" + this.elementId + "_tree'>").appendTo(this._get$Popup()));
            this.treeView.onSelectionChanged(function (evt) {
                var selectedNode = _this.treeView.getSelectedItem();
                _this.selectedValue = selectedNode && selectedNode.value ? selectedNode.value : "";
                _super.prototype._get$Input.call(_this).val(_this.onlyShowLeafInText ? _this.selectedValue.split("/").pop() : _this.selectedValue);
                _super.prototype._showPopup.call(_this, false);
                _super.prototype._fireChangeEvent.call(_this, { "selectedValue": _this.selectedValue });
            });
        }
        DropDownTree.create = function (options, dataSource, parent) {
            return new DropDownTree($(controls.Element.render("select", options)).appendTo(controls.Element.get$(parent)), dataSource);
        };
        DropDownTree.prototype.getSelectedValue = function () {
            return this.selectedValue;
        };
        DropDownTree.prototype.setSelectedValue = function (value) {
            this.selectedValue = value || "";
            this.setText(this.onlyShowLeafInText ? value.split("/").pop() : value);
        };
        DropDownTree.prototype.setAlwaysReload = function (alwaysReload) {
            this.alwaysReload = alwaysReload;
        };
        DropDownTree.prototype.setOnlyShowLeafInText = function (onlyShowLeafInText) {
            this.onlyShowLeafInText = onlyShowLeafInText;
        };
        DropDownTree.prototype.refreshList = function () {
            var _this = this;
            if (this.alwaysReload) {
                _super.prototype._loadData.call(this, null, function (items) { return _this.treeView.setModel(_this.buildTree(items)); });
            }
            else {
                this._getListItems(function (items) { return _this.treeView.setModel(_this.buildTree(items)); });
            }
        };
        DropDownTree.prototype.buildTree = function (namedObjects) {
            var rootNodes = [];
            var treeNodesByPath = {};
            namedObjects.forEach(function (listItem) {
                // Used to accumulate path from root down to the leaves
                var path = "";
                // branch we are currently adding nodes to - initially root then the child collection of each node down the path
                var currentBranch = rootNodes;
                var pathElements = listItem.text.split("/");
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
        };
        // Eat all key events to diable typing in combo-box input control
        DropDownTree.prototype.input_keyPress = function (evt) {
            return false;
        };
        DropDownTree.prototype.input_keyDown = function (evt) {
            return false;
        };
        return DropDownTree;
    }(PopupControl));
    controls.DropDownTree = DropDownTree;
    var CheckList = (function (_super) {
        __extends(CheckList, _super);
        function CheckList(element, rowClickSelects, dataSource) {
            if (rowClickSelects === void 0) { rowClickSelects = true; }
            if (dataSource === void 0) { dataSource = null; }
            _super.call(this, element);
            this.enabled = true;
            this.$list = null;
            this.listItems = [];
            this.currentItemIndex = null;
            this.currentItemChangeHandler = null;
            this.selectionChangeHandler = null;
            this.$element.addClass("form-control check-list");
            this.$list = $("<ul>").appendTo(this.$element);
            this.rowClickSelects = rowClickSelects;
            this.dataSource = dataSource || new controls.SimpleArrayDataSource([]);
            this.reload();
        }
        CheckList.create = function (options, rowClickSelects, dataSource, parent) {
            return new CheckList($(controls.Element.render("div", options)).appendTo(controls.Element.get$(parent)), rowClickSelects, dataSource);
        };
        CheckList.prototype.onSelectionChanged = function (changeHandler) {
            this.selectionChangeHandler = changeHandler;
        };
        CheckList.prototype.onCurrentItemChanged = function (changeHandler) {
            this.currentItemChangeHandler = changeHandler;
        };
        CheckList.prototype.setEnabled = function (enabled) {
            this.enabled = enabled;
            if (this.enabled) {
                this.$element.find("input[type=checkbox]").removeAttr("disabled");
            }
            else {
                this.$element.find("input[type=checkbox]").attr("disabled", "disabled");
            }
        };
        CheckList.prototype.getCurrentItemIndex = function () {
            return this.currentItemIndex;
        };
        CheckList.prototype.getSelectedValues = function () {
            return this.listItems.filter(function (item) { return item.isSelected; }).map(function (item) { return item.value; });
        };
        CheckList.prototype.isChecked = function (index) {
            return this.listItems[index].isSelected;
        };
        CheckList.prototype.reload = function () {
            var _this = this;
            this.$list.empty();
            this.dataSource.getItems(null, function (items) {
                _this.listItems = items;
                _this.listItems.forEach(function (item, i) {
                    var $li = $("<li class='item " + (item.cssClass || "") + "'>").appendTo(_this.$list);
                    var $checkbox = $("<input type='checkbox'>").appendTo($li);
                    $(document.createTextNode(item.text)).appendTo($li);
                    $checkbox.prop("checked", item.isSelected);
                    $checkbox.click(function (evt) {
                        controls.Console.debug("$checkbox.click()");
                        _this.$list.find("li").removeClass("selected");
                        _this.currentItemIndex = i;
                        $li.addClass("selected");
                        item.isSelected = $checkbox.prop("checked") ? true : false;
                        _this.fireSelectionChangeEvent();
                        _this.fireCurrentItemChangeEvent();
                        evt.stopPropagation();
                    });
                    $li.click(function (evt) {
                        controls.Console.debug("$li.click()");
                        _this.$list.find("li").removeClass("selected");
                        _this.currentItemIndex = i;
                        $li.addClass("selected");
                        if (_this.rowClickSelects) {
                            var checkCheckbox = $checkbox.prop("checked") ? false : true;
                            $checkbox.prop("checked", checkCheckbox);
                            item.isSelected = checkCheckbox;
                            _this.fireSelectionChangeEvent();
                        }
                        _this.fireCurrentItemChangeEvent();
                        evt.stopPropagation();
                    });
                });
            });
        };
        CheckList.prototype.fireCurrentItemChangeEvent = function () {
            if (this.currentItemChangeHandler)
                this.currentItemChangeHandler({ "src": this });
        };
        CheckList.prototype.fireSelectionChangeEvent = function () {
            if (this.selectionChangeHandler)
                this.selectionChangeHandler({ "src": this });
        };
        return CheckList;
    }(controls.Control));
    controls.CheckList = CheckList;
    var DraggableListBox = (function (_super) {
        __extends(DraggableListBox, _super);
        function DraggableListBox(element, supportsInsert, multiSelect) {
            var _this = this;
            if (supportsInsert === void 0) { supportsInsert = false; }
            if (multiSelect === void 0) { multiSelect = true; }
            _super.call(this, element);
            this.selectionChangedHandler = null;
            this.dropHandler = null;
            this.listModel = [];
            this.dragManager = new controls.DragManager();
            this.currentDragEvent = null;
            this.supportsInsert = false;
            this.multiSelect = true;
            this.supportsInsert = supportsInsert;
            this.multiSelect = multiSelect;
            this.$element.addClass("listbox");
            // Create list inside passed in DIV
            this.$UL = $("<ul>").appendTo(this.$element);
            // click on the background of the list de-selects eveything 
            this.$element.on("click", function (evt) { return _this.setSelectedIndex(-1); });
            // wire up drag manager events
            this.dragManager.onDragStart(function (evt) { return _this.dragManager_onDragStart(evt); });
            this.dragManager.onTrackDrag(function (evt, overTarget) { return _this.dragManager_onTrackDrag(evt, overTarget); });
            this.dragManager.onDrop(function (evt) { return _this.dragManager_onDrop(evt); });
            // Register the whole control as a drop target
            this.dragManager.registerDropTarget(this.getElement());
        }
        // Register for selection changed events
        DraggableListBox.prototype.onSelectionChanged = function (selectionChangedHandler) {
            this.selectionChangedHandler = selectionChangedHandler;
        };
        // Register for notification when user drags items to list
        DraggableListBox.prototype.onDrop = function (dragDropHandler) {
            this.dropHandler = dragDropHandler;
        };
        DraggableListBox.prototype.clear = function () {
            this.$UL.empty();
            this.listModel = [];
            this.fireSelectionChanged();
        };
        DraggableListBox.prototype.add = function (value, text, tooltip, cssClass) {
            var _this = this;
            if (text === void 0) { text = null; }
            if (tooltip === void 0) { tooltip = null; }
            if (cssClass === void 0) { cssClass = null; }
            var $li = $("<li id='" + this.elementId + "_" + this.listModel.length + "' style='position:relative;' "
                + (cssClass ? " class='" + cssClass + "'" : "") + "></li>").appendTo(this.$UL).text(text || value);
            if (tooltip) {
                controls.Tooltip.addTooltip(tooltip, $li);
            }
            this.dragManager.$registerDragSource($li);
            $li.on("mousedown", function (evt) { return _this.onItemMouseDown(evt); });
            $li.on("click", function (evt) {
                evt.stopPropagation();
                _this.onItemClick(evt);
                return false;
            });
            this.listModel.push({ value: value, text: text, tooltip: tooltip, cssClass: cssClass, isSelected: false });
        };
        DraggableListBox.prototype.getSelectedValue = function () {
            var selectedValues = this.getSelectedValues();
            return selectedValues.length > 0 ? selectedValues[0] : null;
        };
        DraggableListBox.prototype.getSelectedValues = function () {
            return this.listModel.filter(function (item) { return item.isSelected; }).map(function (item) { return item.value; });
        };
        DraggableListBox.prototype.getAllValues = function () {
            return this.listModel.map(function (item) { return item.value; });
        };
        DraggableListBox.prototype.getListItems = function () {
            return this.listModel;
        };
        DraggableListBox.prototype.getSelectedIndex = function () {
            var selectedIndices = this.getSelectedIndices();
            return selectedIndices.length > 0 ? selectedIndices[0] : -1;
        };
        DraggableListBox.prototype.getSelectedIndices = function () {
            return this.listModel.map(function (item, i) { return item.isSelected ? i : null; }).filter(function (index) { return index != null; });
        };
        DraggableListBox.prototype.setSelectedIndex = function (index) {
            // clear existing selection
            this.$UL.children().removeClass("selected");
            $.each(this.listModel, function (i, item) { item.isSelected = false; });
            if (index != -1) {
                $("#" + this.elementId + "_" + index).addClass("selected");
                this.listModel[index].isSelected = true;
            }
            this.fireSelectionChanged();
        };
        // Handling selection in the presense of drag and drop is fiddly as the use needs selection
        // feedback on mouse down rather than click (so the item to be dragged gets selected before it gets dragged)
        // But, have to handle cases where dragging already selected items vs. dragging item that isn't selected
        // when other items are.... Fiddly.
        DraggableListBox.prototype.onItemMouseDown = function (evt) {
            var selectedIndex = this.getIndexFromElementId(evt.delegateTarget.id);
            // handle multi-select
            var oldSelectedIndex = this.getSelectedIndex();
            if (evt.shiftKey && this.multiSelect && oldSelectedIndex != -1) {
                for (var i = Math.min(selectedIndex, oldSelectedIndex); i <= Math.max(selectedIndex, oldSelectedIndex); i++) {
                    $("#" + this.elementId + "_" + i).addClass("selected");
                    this.listModel[i].isSelected = true;
                }
                this.getSelectedIndex();
                this.fireSelectionChanged();
            }
            else {
                // When user mouse downs on an element that is not already selected and they aren't
                // holding the ctrl key then deselect everything before selecting the clicked item.
                // BUT if user mouse downs on an item that IS selected (and other items are also selected)
                // then we they may either be about to drag the selection or they want to discard the 
                // selection and replace it with the clicked item - but we can't know that until the mouse up
                // so that one case is handled in the click handler)
                if ((!(evt.ctrlKey || evt.metaKey) || !this.multiSelect) && !this.listModel[selectedIndex].isSelected) {
                    this.$UL.children().removeClass("selected");
                    $.each(this.listModel, function (i, item) { item.isSelected = false; });
                }
                $(evt.delegateTarget).addClass("selected");
                this.listModel[selectedIndex].isSelected = true;
                this.fireSelectionChanged();
            }
            evt.preventDefault();
            return false;
        };
        DraggableListBox.prototype.onItemClick = function (evt) {
            var _this = this;
            // Handle the case where user click on a selected item in a multi-selected set of items
            // and they didn't drag them - so deselect the other items
            var selectedIndex = this.getIndexFromElementId(evt.delegateTarget.id);
            if (((!evt.ctrlKey && !evt.metaKey && !evt.shiftKey) || !this.multiSelect) && this.listModel[selectedIndex].isSelected) {
                $.each(this.listModel, function (i, item) {
                    if (i != selectedIndex) {
                        item.isSelected = false;
                        $("#" + _this.elementId + "_" + i).removeClass("selected");
                    }
                });
                this.fireSelectionChanged();
            }
        };
        // Internal drag-drop handling
        DraggableListBox.prototype.dragManager_onDragStart = function (evt) {
            this.currentDragEvent = evt;
            evt.data = {
                srcList: this,
                itemValues: this.getSelectedValues()
            };
            if (this.getSelectedValues().length > 1) {
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
        };
        DraggableListBox.prototype.dragManager_onTrackDrag = function (evt, overTarget) {
            var _this = this;
            if (overTarget) {
                if (this.currentDragEvent !== evt) {
                    this.$element.addClass("dragover");
                }
                if (this.supportsInsert) {
                    var overItemIndex = this.findTargetItemIndex(evt);
                    for (var i = 0; i < this.listModel.length; i++) {
                        var $target = $("#" + this.elementId + "_" + i);
                        if ((overItemIndex == null) || (i < overItemIndex)) {
                            $target.css("top", "");
                        }
                        else {
                            $target.css("top", "8px");
                        }
                    }
                }
            }
            else {
                this.$element.removeClass("dragover");
                if (this.supportsInsert) {
                    this.listModel.forEach(function (item, i) { return $("#" + _this.elementId + "_" + i).css("top", ""); });
                }
            }
        };
        DraggableListBox.prototype.dragManager_onDrop = function (evt) {
            var dropEvent = evt.data;
            if (this.supportsInsert) {
                var overItemIndex = this.findTargetItemIndex(evt);
                if (overItemIndex != null) {
                    dropEvent.targetItemValue = this.listModel[overItemIndex].value;
                }
            }
            if (this.dropHandler) {
                this.dropHandler(dropEvent);
            }
        };
        DraggableListBox.prototype.getIndexFromElementId = function (elementId) {
            return Number(elementId.substring(elementId.lastIndexOf("_") + 1));
        };
        DraggableListBox.prototype.fireSelectionChanged = function () {
            if (this.selectionChangedHandler) {
                this.selectionChangedHandler({ src: this });
            }
        };
        DraggableListBox.prototype.findTargetItemIndex = function (evt) {
            for (var i = 0; i < this.listModel.length; i++) {
                var $target = $("#" + this.elementId + "_" + i);
                // When we drag over items they get shifted down by setting their "top" value - need to substract that
                var elementShift = this.convertToPixels($target.css("top"));
                var targetRect = $target.get(0).getBoundingClientRect();
                if ((evt.mouseX >= targetRect.left) && (evt.mouseX <= targetRect.right)
                    && (evt.mouseY >= (targetRect.top - elementShift)) && (evt.mouseY <= (targetRect.bottom - elementShift))) {
                    return i;
                }
            }
            return null;
        };
        DraggableListBox.prototype.convertToPixels = function (cssDimension) {
            if (cssDimension && cssDimension.endsWith("px")) {
                return parseInt(cssDimension.substring(0, cssDimension.indexOf("px")));
            }
            else {
                return 0;
            }
        };
        return DraggableListBox;
    }(controls.Control));
    controls.DraggableListBox = DraggableListBox;
    var ColorSlider = (function (_super) {
        __extends(ColorSlider, _super);
        function ColorSlider(element) {
            _super.call(this, element);
            this.currentValue = 0;
            this.track = new controls.Element($("<div class='color-slider'>").appendTo(this.$element));
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
            this.canvas = ($canvas.get(0));
            this.thumb = new controls.DraggableElement($("<div>").appendTo(this.track.$element), controls.Direction.Horizontal, -(ColorSlider.THUMB_WIDTH / 2), this.track.getWidth() - (ColorSlider.THUMB_WIDTH / 2));
            this.thumb.css({
                "position": "absolute",
                "top": "-4px",
                "left": "-" + (ColorSlider.THUMB_WIDTH / 2) + "px",
                "bottom": "-4px",
                "width": "" + ColorSlider.THUMB_WIDTH + "px",
                "-webkit-user-select": "none",
                "-moz-user-select": "none",
                "-ms-user-select": "none",
                "user-select": "none"
            });
            this.thumb.onClick(function (evt) { return evt.stopPropagation(); });
        }
        ColorSlider.create = function (parent) {
            return new ColorSlider($(controls.Element.render("div", {})).appendTo(controls.Element.get$(parent)));
        };
        ColorSlider.prototype.onChanged = function (changeHandler) {
            var _this = this;
            this.thumb.onDrag(function (evt) {
                _this.currentValue = (evt.position + (ColorSlider.THUMB_WIDTH / 2)) / _this.track.getWidth();
                changeHandler({ "value": _this.currentValue });
            });
            this.track.onClick(function (evt) {
                _this.currentValue = evt.offsetX / _this.track.getWidth();
                _this.thumb.setLeft(evt.offsetX - (ColorSlider.THUMB_WIDTH / 2));
                changeHandler({ "value": _this.currentValue });
            });
        };
        Object.defineProperty(ColorSlider.prototype, "value", {
            get: function () {
                return this.currentValue;
            },
            set: function (value) {
                this.currentValue = value;
                this.thumb.setLeft((value * this.track.getWidth()) - (ColorSlider.THUMB_WIDTH / 2));
            },
            enumerable: true,
            configurable: true
        });
        ColorSlider.prototype.setColorScale = function (scale) {
            var g = this.canvas.getContext("2d");
            var width = this.canvas.width;
            var height = this.canvas.height;
            g.rect(0, 0, width, height);
            var colorGradient = g.createLinearGradient(0, 0, width, 0);
            for (var i = 0; i < scale.length; i++) {
                colorGradient.addColorStop(i / (scale.length - 1), "rgba(" + scale[i].r + "," + scale[i].g + "," + scale[i].b + ",1.0)");
            }
            g.fillStyle = colorGradient;
            g.fill();
        };
        ColorSlider.THUMB_WIDTH = 10;
        return ColorSlider;
    }(controls.Control));
    var ColorPicker = (function (_super) {
        __extends(ColorPicker, _super);
        function ColorPicker(element, optional) {
            var _this = this;
            if (optional === void 0) { optional = false; }
            _super.call(this, element, 'dropdown-list color-picker', new controls.SimpleArrayDataSource([]));
            this.sliderHue = null;
            this.sliderSaturation = null;
            this.sliderLightness = null;
            this.optional = optional;
            this.currentColor = optional ? null : { "h": 0.5, "s": 0.5, "l": 0.5 };
            if (optional) {
                this._get$Input().val("").attr("placeholder", "Auto");
            }
            this._get$Input().on("blur", function (evt) {
                var enteredColor = ColorUtil.parseHex(_this.getText());
                if (enteredColor) {
                    _this.currentColor = ColorUtil.rgb2hsl(enteredColor);
                }
                else if (_this.optional) {
                    _this.currentColor = null;
                    _this.setText("");
                }
                else {
                    _this.setText(ColorUtil.rgb2hex(ColorUtil.hsl2rgb(_this.currentColor)));
                }
                _this.updateUIColors();
            });
        }
        ColorPicker.create = function (options, optional, parent) {
            return new ColorPicker($(controls.Element.render("div", options)).appendTo(controls.Element.get$(parent)), optional);
        };
        ColorPicker.prototype.getColor = function () {
            var enteredColor = ColorUtil.parseHex(this.getText());
            return ColorUtil.rgb2hex(enteredColor || ColorUtil.hsl2rgb(this.currentColor));
        };
        ColorPicker.prototype.setColor = function (value) {
            this.setText(value || "");
            if (value) {
                var rgb = ColorUtil.parseHex(value) || { "r": 128, "g": 128, "b": 128 };
                this.currentColor = ColorUtil.rgb2hsl(rgb);
                if (this.sliderHue != null) {
                    this.sliderHue.value = this.currentColor.h;
                    this.sliderSaturation.value = this.currentColor.s;
                    this.sliderLightness.value = this.currentColor.l;
                }
            }
            else {
                this.currentColor = null;
            }
            this.updateUIColors();
        };
        // Override
        ColorPicker.prototype._showPopup = function (show) {
            var _this = this;
            _super.prototype._showPopup.call(this, show);
            if (show && (this.sliderHue == null)) {
                var $popup = this._get$Popup();
                $popup.empty();
                this.sliderHue = ColorSlider.create($popup);
                this.sliderHue.onChanged(function (evt) { return _this.onSliderChanged(); });
                this.sliderHue.setColorScale(this.createHueColorScale());
                this.sliderHue.value = this.currentColor ? this.currentColor.h : 0.5;
                this.sliderSaturation = ColorSlider.create($popup);
                this.sliderSaturation.onChanged(function (evt) { return _this.onSliderChanged(); });
                if (this.currentColor) {
                    this.sliderSaturation.setColorScale(this.createSaturationColorScale());
                    this.sliderSaturation.value = this.currentColor.s;
                }
                else {
                    this.sliderSaturation.setColorScale([{ "r": 128, "g": 128, "b": 128 }, { "r": 0, "g": 255, "b": 255 }]);
                    this.sliderSaturation.value = 0.5;
                }
                this.sliderLightness = ColorSlider.create($popup);
                this.sliderLightness.onChanged(function (evt) { return _this.onSliderChanged(); });
                this.sliderLightness.setColorScale([{ "r": 0, "g": 0, "b": 0 }, { "r": 255, "g": 255, "b": 255 }]);
                this.sliderLightness.value = this.currentColor ? this.currentColor.l : 0.5;
            }
        };
        // Override
        ColorPicker.prototype._handleBackgroundClick = function (evt) {
            // do nothing
        };
        ColorPicker.prototype.onSliderChanged = function () {
            this.currentColor = {
                "h": this.sliderHue.value,
                "s": this.sliderSaturation.value,
                "l": this.sliderLightness.value
            };
            this.updateUIColors();
        };
        ColorPicker.prototype.updateUIColors = function () {
            var $input = this._get$Input();
            if (this.currentColor) {
                if (this.sliderSaturation != null) {
                    this.sliderSaturation.setColorScale(this.createSaturationColorScale());
                }
                var rgb = ColorUtil.hsl2rgb(this.currentColor);
                $input.css({ "background-color": "rgba(" + rgb.r + "," + rgb.g + "," + rgb.b + ",1.0)" });
                $input.css({ "color": (this.currentColor.l < 0.5) ? "#FFFFFF" : "#000000" });
                $input.val(ColorUtil.rgb2hex(rgb));
            }
            else {
                $input.css({ "background-color": "#FFFFFF" });
                $input.css({ "color": "#000000" });
            }
        };
        ColorPicker.prototype.createSaturationColorScale = function () {
            var desaturated = ColorUtil.hsl2rgb({ "h": this.currentColor.h, "s": 0, "l": 0.6 });
            var saturated = ColorUtil.hsl2rgb({ "h": this.currentColor.h, "s": 1.0, "l": 0.6 });
            return [desaturated, saturated];
        };
        ColorPicker.prototype.createHueColorScale = function () {
            var colorStops = [];
            var hsl = { "h": 0, "s": 1.0, "l": 0.5 };
            for (var i = 0; i < 16; i++) {
                hsl.h = i / 15;
                colorStops[i] = ColorUtil.hsl2rgb(hsl);
            }
            return colorStops;
        };
        return ColorPicker;
    }(PopupControl));
    controls.ColorPicker = ColorPicker;
    var ProgressBar = (function (_super) {
        __extends(ProgressBar, _super);
        function ProgressBar(element) {
            _super.call(this, element);
            this.$element.addClass("progress active");
            this.progressBar = new controls.Element($("<div class='progress-bar' role='progressbar' style='width: 0%;'>").appendTo(this.$element));
        }
        ProgressBar.prototype.setPercentage = function (percentage) {
            this.progressBar.css({ "width": percentage + "%" });
        };
        ProgressBar.create = function (parent) {
            return new ProgressBar($(controls.Element.render("div", {})).appendTo(controls.Element.get$(parent)));
        };
        return ProgressBar;
    }(controls.Control));
    controls.ProgressBar = ProgressBar;
})(controls || (controls = {}));
