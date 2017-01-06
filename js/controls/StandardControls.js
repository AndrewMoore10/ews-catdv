var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var controls;
(function (controls) {
    var Platform = util.Platform;
    var HtmlUtil = util.HtmlUtil;
    // Wrappers for common HTML controls such as text boxes, checkboxes etc.
    //
    // There are two patterns for creating controls:
    //
    //   new Control(element : any) - Wrap an existing DOM element. 
    //
    //      element - the element to wrap. Can be a string ID, an HTMLElement that has already been added to the DOM 
    //                or a JQuery object that refers to an element that has already been added to the DOM
    //
    //   Control.create(options: any, parent : any) - create a new intance of the control and add it to the parent
    // 
    //      options - optional settings for the control. Typically these are added as attributes to the HTML element that is created.
    //                e.g. { "id" : "new_control", "class" : "some-css-class", "disabled" : true }
    //
    //      parent  - the parent element that the newly created control will be added to. Can be an ID, an HTMLElement or a JQuery object.
    // Any HTML Element and base class for all Controls
    var Element = (function () {
        function Element(element) {
            this.$element = Element.get$(element);
            this.elementId = this.$element.length > 0 ? this.$element.get(0).id : null;
        }
        // Return a JQquery object that wraps the specified element
        // The element parameter may be an element ID string, an HTMLELement or a JQuery object 
        // (in which case it is just returned).
        Element.get$ = function (element) {
            if (typeof element === "string") {
                return $("#" + element);
            }
            else if (element.$element) {
                return element.$element;
            }
            else if (typeof element === "HTMLElement") {
                return $(element);
            }
            else {
                return element;
            }
        };
        // Utility function to render an HTML tag based on passed in options
        Element.render = function (tag, options, tagContent) {
            if (tagContent === void 0) { tagContent = ""; }
            var html = "<" + tag;
            if (options) {
                for (var option in options) {
                    var optionValue = options[option];
                    if (typeof optionValue == 'Boolean') {
                        if (optionValue) {
                            html += " " + option;
                        }
                    }
                    else if ((typeof optionValue != 'Object') && (typeof optionValue != 'Array')) {
                        html += " " + option + "='" + HtmlUtil.escapeHtml(optionValue) + "'";
                    }
                }
            }
            html += ">" + tagContent + "</" + tag + ">";
            return html;
        };
        // Utility function to convert a string into a valid element id
        Element.toID = function (str) {
            return str.replace(new RegExp('[^A-Za-z0-9]', 'g'), "_");
        };
        Element.prototype.getElement = function () {
            return document.getElementById(this.elementId);
        };
        Element.prototype.setSize = function (width, height) {
            this.setWidth(width);
            this.setHeight(height);
        };
        Element.prototype.getLeft = function () {
            return this.$element.position().left;
        };
        Element.prototype.setLeft = function (left) {
            this.$element.css({ "left": left });
        };
        Element.prototype.getTop = function () {
            return this.$element.position().top;
        };
        Element.prototype.setTop = function (top) {
            this.$element.css({ "top": top });
        };
        Element.prototype.getBottom = function () {
            return parseInt(this.$element.css("bottom"));
        };
        Element.prototype.setBottom = function (bottom) {
            this.$element.css({ "bottom": bottom });
        };
        Element.prototype.getRight = function () {
            return parseInt(this.$element.css("right"));
        };
        Element.prototype.setRight = function (right) {
            this.$element.css({ "right": right });
        };
        Element.prototype.getWidth = function () {
            return this.$element.width();
        };
        Element.prototype.setWidth = function (width) {
            this.$element.css({ "width": width });
        };
        Element.prototype.getHeight = function () {
            return this.$element.height();
        };
        Element.prototype.setHeight = function (height) {
            this.$element.css({ "height": height });
        };
        // Get postiion of element relative to document
        Element.prototype.getAbsoluteLeft = function () {
            return this.$element.offset().left;
        };
        Element.prototype.getAbsoluteTop = function () {
            return this.$element.offset().top;
        };
        Element.prototype.css = function (css) {
            return this.$element.css(css);
        };
        Element.prototype.show = function (show) {
            if ((typeof show == "undefined") || (show == true)) {
                this.$element.show();
            }
            else {
                this.$element.hide();
            }
        };
        Element.prototype.hide = function () {
            this.$element.hide();
        };
        Element.prototype.onClick = function (clickHandler) {
            this.$element.click(function (evt) {
                return clickHandler(evt);
            });
        };
        return Element;
    }());
    controls.Element = Element;
    // Base class for Panels (User Controls)
    var Panel = (function (_super) {
        __extends(Panel, _super);
        function Panel(element) {
            _super.call(this, element);
        }
        Panel.prototype.clear = function () {
            this.$element.empty();
        };
        return Panel;
    }(Element));
    controls.Panel = Panel;
    // Base class for all controls
    var Control = (function (_super) {
        __extends(Control, _super);
        function Control(element) {
            _super.call(this, element);
        }
        return Control;
    }(Element));
    controls.Control = Control;
    // Form controls encompases input controls and action controls (buttons). Support enable/disable.
    var FormControl = (function (_super) {
        __extends(FormControl, _super);
        function FormControl() {
            _super.apply(this, arguments);
        }
        FormControl.prototype.setEnabled = function (enabled) {
            if (enabled) {
                this.$element.removeAttr("disabled");
            }
            else {
                this.$element.attr("disabled", "disabled");
            }
        };
        return FormControl;
    }(Control));
    controls.FormControl = FormControl;
    // Input Controls (<input>, <select> and <textarea>) that support changed events
    var InputControl = (function (_super) {
        __extends(InputControl, _super);
        function InputControl(element) {
            _super.call(this, element);
        }
        InputControl.prototype.onChanged = function (changeHandler) {
            this.$element.change(function (evt) {
                changeHandler(evt);
            });
        };
        return InputControl;
    }(FormControl));
    controls.InputControl = InputControl;
    var Button = (function (_super) {
        __extends(Button, _super);
        function Button(element) {
            _super.call(this, element);
        }
        Button.create = function (buttonText, options, parent) {
            return new Button($(Element.render("button", options, buttonText)).appendTo(Element.get$(parent)));
        };
        return Button;
    }(FormControl));
    controls.Button = Button;
    var Image = (function (_super) {
        __extends(Image, _super);
        function Image(element) {
            _super.call(this, element);
        }
        Image.create = function (options, parent) {
            return new Image($(Element.render("img", options)).appendTo(Element.get$(parent)));
        };
        Image.prototype.setSourceUrl = function (url) {
            this.$element.attr("src", url);
        };
        return Image;
    }(Control));
    controls.Image = Image;
    var HyperLink = (function (_super) {
        __extends(HyperLink, _super);
        function HyperLink(element) {
            _super.call(this, element);
        }
        HyperLink.create = function (options, parent) {
            return new HyperLink($(Element.render("a", options)).appendTo(Element.get$(parent)));
        };
        HyperLink.prototype.setHREF = function (url) {
            this.$element.attr("href", url);
        };
        HyperLink.prototype.setText = function (text) {
            this.$element.text(text);
        };
        return HyperLink;
    }(Control));
    controls.HyperLink = HyperLink;
    var TextBox = (function (_super) {
        __extends(TextBox, _super);
        function TextBox(element) {
            _super.call(this, element);
        }
        TextBox.create = function (options, parent) {
            return new TextBox($(Element.render("input", $.extend({ "type": "text" }, options))).appendTo(Element.get$(parent)));
        };
        TextBox.prototype.setText = function (value) {
            this.$element.val(value);
        };
        TextBox.prototype.getText = function () {
            return this.$element.val();
        };
        TextBox.prototype.setReadOnly = function (readonly) {
            this.$element.prop("readonly", readonly);
        };
        // Override           
        TextBox.prototype.onChanged = function (changeHandler) {
            _super.prototype.onChanged.call(this, changeHandler);
            // IE does not generate change event when user presses return
            if (Platform.isIE()) {
                this.$element.keydown(function (evt) {
                    if (evt.keyCode == 13)
                        changeHandler(evt);
                });
            }
        };
        // Input event fires immediately unlike changed which only fires on lost focus
        TextBox.prototype.onInput = function (inputHandler) {
            // Something on the Mac eats input, change and keypress events - so we have to use keyup!
            if (Platform.isMac()) {
                this.$element.on("keyup", function (evt) {
                    inputHandler(evt);
                });
            }
            else {
                this.$element.on("input", function (evt) {
                    inputHandler(evt);
                });
            }
        };
        return TextBox;
    }(InputControl));
    controls.TextBox = TextBox;
    var TextArea = (function (_super) {
        __extends(TextArea, _super);
        function TextArea(element) {
            _super.call(this, element);
        }
        TextArea.create = function (options, parent) {
            return new TextArea($(Element.render("textarea", options)).appendTo(Element.get$(parent)));
        };
        TextArea.prototype.setText = function (value) {
            this.$element.val(value);
        };
        TextArea.prototype.getText = function () {
            return this.$element.val();
        };
        TextArea.prototype.setReadOnly = function (readonly) {
            this.$element.prop("readonly", readonly);
        };
        // Input event fires immediately unlike changed which only fires on lost focus
        TextArea.prototype.onInput = function (inputHandler) {
            // Something on the Mac eats input, change and keypress events - so we have to use keyup!
            if (Platform.isMac()) {
                this.$element.on("keyup", function (evt) {
                    inputHandler(evt);
                });
            }
            else {
                this.$element.on("input", function (evt) {
                    inputHandler(evt);
                });
            }
        };
        return TextArea;
    }(InputControl));
    controls.TextArea = TextArea;
    // Can wrap any HTML element with text content
    var Label = (function (_super) {
        __extends(Label, _super);
        function Label(element) {
            _super.call(this, element);
        }
        Label.create = function (options, parent) {
            return new Label($(Element.render("span", options)).appendTo(Element.get$(parent)));
        };
        Label.prototype.setText = function (value) {
            this.$element.text(value);
        };
        return Label;
    }(Control));
    controls.Label = Label;
    var DropDownList = (function (_super) {
        __extends(DropDownList, _super);
        function DropDownList(element) {
            _super.call(this, element);
            this.items = [];
        }
        DropDownList.create = function (options, parent) {
            var newDropDownList = new DropDownList($(Element.render("select", options)).appendTo(Element.get$(parent)));
            if (options.values) {
                newDropDownList.setItems(options.values.map(function (s) { return { value: s, text: s }; }));
            }
            else if (options.items) {
                newDropDownList.setItems(options.items);
            }
            return newDropDownList;
        };
        DropDownList.prototype.clearItems = function () {
            this.items = [];
            this.$element.empty();
        };
        DropDownList.prototype.setItems = function (items) {
            var _this = this;
            this.items = items;
            this.$element.empty();
            if (items) {
                items.forEach(function (item) { return _this.addItem(item); });
            }
        };
        DropDownList.prototype.getItems = function () {
            return this.items;
        };
        DropDownList.prototype.addItem = function (item) {
            this.items.push(item);
            var $option = $("<option value='" + item.value + "' " + (item.isSelected ? " selected" : "") + "/>").appendTo(this.$element);
            $option.text(item.text);
        };
        DropDownList.prototype.getSelectedIndex = function () {
            return this.$element.find("option:selected").index();
        };
        DropDownList.prototype.setSelectedIndex = function (selectedIndex) {
            this.$element.val(this.items[selectedIndex].value);
        };
        DropDownList.prototype.getSelectedValue = function () {
            return this.$element.val();
        };
        DropDownList.prototype.setSelectedValue = function (value) {
            this.$element.val(value);
            return this;
        };
        return DropDownList;
    }(InputControl));
    controls.DropDownList = DropDownList;
    var ListBox = (function (_super) {
        __extends(ListBox, _super);
        function ListBox(element) {
            _super.call(this, element);
        }
        ListBox.create = function (options, parent) {
            var opts = $.extend({ "size": 5 }, options);
            if (opts.multiselect) {
                opts.multiple = "multiple";
            }
            delete opts.multiselect;
            var newListBox = new ListBox($(Element.render("select", opts)).appendTo(Element.get$(parent)));
            if (options.values) {
                newListBox.setItems(options.values.map(function (s) { return { value: s, text: s }; }));
            }
            else if (options.items) {
                newListBox.setItems(options.items);
            }
            return newListBox;
        };
        ListBox.prototype.clear = function () {
            this.$element.empty();
        };
        ListBox.prototype.add = function (value, text, tooltip) {
            if (text === void 0) { text = null; }
            if (tooltip === void 0) { tooltip = null; }
            this.$element.append(this.createOptionElement(value, text, tooltip));
        };
        ListBox.prototype.addItem = function (item) {
            this.$element.append(this.createOptionElement(item.value, item.text, item.tooltip));
        };
        ListBox.prototype.setItemAt = function (index, value, text, tooltip) {
            if (text === void 0) { text = null; }
            if (tooltip === void 0) { tooltip = null; }
            this.$element.find("option:nth-child(" + (index + 1) + ")").replaceWith(this.createOptionElement(value, text, tooltip));
        };
        ListBox.prototype.createOptionElement = function (value, text, tooltip) {
            if (text === void 0) { text = null; }
            if (tooltip === void 0) { tooltip = null; }
            return "<option value='" + HtmlUtil.escapeHtml(value) + "'"
                + (tooltip ? " title='" + HtmlUtil.escapeHtml(tooltip) + "'" : "") + ">" + HtmlUtil.escapeHtml(text || value) + "</option>";
        };
        ListBox.prototype.removeItemAt = function (index) {
            this.$element.find("option:nth-child(" + (index + 1) + ")").remove();
        };
        ListBox.prototype.setItems = function (items) {
            var _this = this;
            this.$element.empty();
            if (items) {
                items.forEach(function (item) {
                    $("<option value='" + HtmlUtil.escapeHtml(item.value) + "' " + (item.isSelected ? " selected" : "") + ">"
                        + HtmlUtil.escapeHtml(item.text) + "</option>").appendTo(_this.$element);
                });
            }
        };
        ListBox.prototype.getItems = function () {
            var items = [];
            this.$element.find("option").each(function () {
                items.push({ value: $(this).val(), text: $(this).text() });
            });
            return items;
        };
        ListBox.prototype.getSelectedValue = function () {
            return this.$element.val();
        };
        ListBox.prototype.setSelectedValue = function (value) {
            this.$element.val(value);
        };
        ListBox.prototype.getSelectedValues = function () {
            var values = [];
            this.$element.find("option").each(function (i, e) { if ($(e).is(":selected"))
                values.push($(e).val()); });
            return values;
        };
        ListBox.prototype.setSelectedValues = function (values) {
            var _this = this;
            this.$element.find("option").removeAttr('selected');
            values.forEach(function (value) {
                _this.$element.find("option[value='" + value + "']'").attr('selected', 'selected');
            });
        };
        ListBox.prototype.getSelectedIndex = function () {
            return this.$element.find("option:selected").index();
        };
        ListBox.prototype.setSelectedIndex = function (index) {
            this.$element.find("option").removeAttr('selected');
            this.$element.find("option").eq(index).attr('selected', 'selected');
        };
        ListBox.prototype.getSelectedIndices = function () {
            var indices = [];
            this.$element.find("option").each(function (i, e) { if ($(e).is(":selected"))
                indices.push(i); });
            return indices;
        };
        ListBox.prototype.setSelectedIndices = function (indices) {
            var _this = this;
            this.$element.find("option").removeAttr('selected');
            indices.forEach(function (index) {
                _this.$element.find("option").eq(index).attr('selected', 'selected');
            });
        };
        return ListBox;
    }(InputControl));
    controls.ListBox = ListBox;
    var CheckBox = (function (_super) {
        __extends(CheckBox, _super);
        function CheckBox(element) {
            _super.call(this, element);
        }
        CheckBox.create = function (options, parent) {
            return new CheckBox($(Element.render("input type='checkbox'", options)).appendTo(Element.get$(parent)));
        };
        CheckBox.prototype.isChecked = function () {
            return this.$element.prop("checked") ? true : false;
        };
        CheckBox.prototype.setChecked = function (checked) {
            this.$element.prop("checked", checked ? true : false);
            return this;
        };
        return CheckBox;
    }(InputControl));
    controls.CheckBox = CheckBox;
    var MultiCheckBoxes = (function () {
        function MultiCheckBoxes(checkBoxes, values, name) {
            this.values = null;
            this.checkBoxes = null;
            this.name = null;
            this.checkBoxes = checkBoxes;
            this.values = values;
            this.name = name;
        }
        MultiCheckBoxes.create = function (name, values, options, parent) {
            var checkBoxes = [];
            values.forEach(function (value, i) {
                var $parent = Element.get$(parent);
                var $label = $("<label class='checkbox-inline'>").appendTo($parent);
                var chkOptions = $.extend({ "id": name + "_" + i, "name": name }, options);
                var $checkbox = $(Element.render("input type='checkbox'", chkOptions)).appendTo($label);
                $(document.createTextNode(value)).appendTo($label);
                checkBoxes.push(new CheckBox($checkbox));
            });
            return new MultiCheckBoxes(checkBoxes, values, name);
        };
        MultiCheckBoxes.prototype.setEnabled = function (enabled) {
            this.checkBoxes.forEach(function (rdo) { return rdo.setEnabled(enabled); });
        };
        MultiCheckBoxes.prototype.setValues = function (values) {
            var _this = this;
            this.checkBoxes.forEach(function (checkBox, i) { return checkBox.setChecked(values.contains(_this.values[i])); });
        };
        MultiCheckBoxes.prototype.getValues = function () {
            var _this = this;
            var values = [];
            this.checkBoxes.forEach(function (checkBox, i) {
                if (checkBox.isChecked()) {
                    values.push(_this.values[i]);
                }
            });
            return values;
        };
        MultiCheckBoxes.prototype.getIsChecked = function () {
            return this.checkBoxes.map(function (checkBox) { return checkBox.isChecked(); });
        };
        MultiCheckBoxes.prototype.setIsChecked = function (isChecked) {
            this.checkBoxes.forEach(function (checkBox, i) { return checkBox.setChecked(isChecked[i]); });
        };
        MultiCheckBoxes.prototype.onChanged = function (changeHandler) {
            $("input[type=checkbox][name=" + this.name + "]").change(changeHandler);
        };
        return MultiCheckBoxes;
    }());
    controls.MultiCheckBoxes = MultiCheckBoxes;
    var RadioButton = (function (_super) {
        __extends(RadioButton, _super);
        function RadioButton(element, parent, options) {
            if (parent === void 0) { parent = null; }
            if (options === void 0) { options = null; }
            _super.call(this, element);
        }
        RadioButton.create = function (options, parent) {
            return new RadioButton($(Element.render("input type='radio'", options)).appendTo(Element.get$(parent)));
        };
        RadioButton.prototype.isSelected = function () {
            return this.$element.prop("checked") ? true : false;
        };
        RadioButton.prototype.setSelected = function (checked) {
            this.$element.prop("checked", checked ? true : false);
            return this;
        };
        return RadioButton;
    }(InputControl));
    controls.RadioButton = RadioButton;
    var RadioButtonSet = (function () {
        function RadioButtonSet(radioButtons, values, name) {
            this.radioButtons = null;
            this.values = null;
            this.radioButtons = radioButtons;
            this.values = values;
            this.name = name;
        }
        RadioButtonSet.create = function (name, values, options, parent) {
            var radioButtons = [];
            values.forEach(function (value, i) {
                var $parent = Element.get$(parent);
                var $label = $("<label class='radio-inline'>").appendTo($parent);
                var rdoOptions = $.extend({ "id": name + "_" + i, "name": name }, options);
                var $radio = $(Element.render("input type='radio'", rdoOptions)).appendTo($label);
                $(document.createTextNode(value)).appendTo($label);
                radioButtons.push(new RadioButton($radio));
            });
            return new RadioButtonSet(radioButtons, values, name);
        };
        RadioButtonSet.prototype.setEnabled = function (enabled) {
            this.radioButtons.forEach(function (rdo) { return rdo.setEnabled(enabled); });
        };
        RadioButtonSet.prototype.setValue = function (value) {
            var index = this.values.indexOf(value);
            if ((index >= 0) && (index < this.radioButtons.length)) {
                this.radioButtons[index].setSelected(true);
            }
        };
        RadioButtonSet.prototype.getValue = function () {
            for (var i = 0; i < this.values.length; i++) {
                if (this.radioButtons[i].isSelected())
                    return this.values[i];
            }
            return null;
        };
        RadioButtonSet.prototype.onChanged = function (changeHandler) {
            $("input[type=radio][name=" + this.name + "]").change(changeHandler);
        };
        return RadioButtonSet;
    }());
    controls.RadioButtonSet = RadioButtonSet;
    //    export class FancyCheckbox extends InputControl
    //    {
    //        private checked: boolean = false;
    //        private changeHandler: (evt: any) => void = null;
    //
    //        constructor(element: any)
    //        {
    //            super(element);
    //
    //            this.$element.click((evt) => 
    //            {
    //                this.checked = !this.checked;
    //                this.setChecked(this.checked);
    //                if (this.changeHandler)
    //                {
    //                    this.changeHandler(evt);
    //                }
    //            });
    //        }
    //
    //        public static create(options: any, parent: any): FancyCheckbox
    //        {
    //            var $button = $(Element.render("button", options)).appendTo(Element.get$(parent));
    //            $button.addClass("checkbox unchecked");
    //            $("<span class='icon catdvicon catdvicon-blank no-tick'></span>").appendTo($button);
    //            $("<span class='icon catdvicon catdvicon-tick_min tick'></span>").appendTo($button);
    //            return new FancyCheckbox($button);
    //        }
    //
    //        public setEnabled(enabled: boolean)       
    //        {
    //            if (enabled)
    //            {
    //                this.$element.removeAttr("disabled");
    //            }
    //            else
    //            {
    //                this.$element.attr("disabled", "disabled");
    //            }
    //        }
    //
    //        public onChanged(changeHandler: (evt: any) => void)
    //        {
    //            this.changeHandler = changeHandler;
    //        }
    //
    //        public isChecked(): boolean
    //        {
    //            return this.checked;
    //        }
    //
    //        public setChecked(checked: boolean): CheckBox
    //        {
    //            this.checked = checked;
    //            if (this.checked)
    //            {
    //                this.$element.addClass("checked");
    //                this.$element.removeClass("unchecked");
    //            }
    //            else
    //            {
    //                this.$element.addClass("unchecked");
    //                this.$element.removeClass("checked");
    //            }
    //            return this;
    //        }
    //    }
    //
    // Enables setting focus on a DIV so you can capture keyboard events
    // Creates a hidden text box and sets focus to it when child is clicked on
    var FocusPanel = (function (_super) {
        __extends(FocusPanel, _super);
        function FocusPanel(element) {
            var _this = this;
            _super.call(this, element);
            this.keypressHandler = null;
            this.keydownHandler = null;
            // This is used to allow a non-input control to capture key input (specifically the video player controls)
            // But on a touch device setting the focus to a text input control causes the keyboard to pop up
            // so lets just not do it on touch device...
            if (!Platform.isTouchDevice()) {
                this.$hiddenTextBox = $("<input type='text' tabindex='-1' role='presentation' "
                    + "style='opacity: 0; position: absolute; bottom: 0px; right:0px; "
                    + "height: 1px; width: 1px; z-index: -1; overflow: hidden; '>").appendTo($("body"));
                this.$element.on("click", function (evt) { return _this.$hiddenTextBox.focus(); });
                this.$hiddenTextBox.keypress(function (evt) {
                    if (_this.keypressHandler)
                        _this.keypressHandler(evt);
                });
                this.$hiddenTextBox.keydown(function (evt) {
                    if (_this.keydownHandler)
                        _this.keydownHandler(evt);
                });
            }
        }
        FocusPanel.prototype.focus = function () {
            this.$hiddenTextBox.focus();
        };
        FocusPanel.prototype.onKeyPress = function (keypressHandler) {
            this.keypressHandler = keypressHandler;
        };
        FocusPanel.prototype.onKeyDown = function (keydownHandler) {
            this.keydownHandler = keydownHandler;
        };
        return FocusPanel;
    }(Control));
    controls.FocusPanel = FocusPanel;
    var Timer = (function () {
        function Timer(intervalMilliseconds, task) {
            this.timerHandle = null;
            this.intervalMilliseconds = intervalMilliseconds;
            this.task = task;
        }
        Timer.prototype.start = function () {
            if (this.timerHandle) {
                this.stop();
            }
            this.timerHandle = window.setInterval(this.task, this.intervalMilliseconds);
        };
        Timer.prototype.stop = function () {
            window.clearInterval(this.timerHandle);
            this.timerHandle = null;
        };
        Timer.defer = function (delayMilliseconds, task) {
            // It can be useful to have an optional delay - so allow zero to mean just call task
            if (delayMilliseconds == 0) {
                task();
            }
            else {
                window.setTimeout(task, delayMilliseconds);
            }
        };
        return Timer;
    }());
    controls.Timer = Timer;
    var Dispatcher = (function () {
        function Dispatcher() {
        }
        Dispatcher.dispatch = function (task) {
            if (Dispatcher.tasks == null) {
                Dispatcher.tasks = [task];
                if (window.addEventListener) {
                    window.addEventListener("message", Dispatcher.messagehandler, true);
                }
                else {
                    window.attachEvent("onmessage", Dispatcher.messagehandler);
                }
            }
            else {
                Dispatcher.tasks.push(task);
            }
            window.postMessage(Dispatcher.messageName, "*");
        };
        Dispatcher.messagehandler = function (event) {
            if (event.source == window && event.data == Dispatcher.messageName) {
                if (event.stopPropagation) {
                    event.stopPropagation();
                }
                else {
                    // IE
                    event.returnValue = false;
                }
                if (Dispatcher.tasks.length > 0) {
                    var task = Dispatcher.tasks.shift();
                    task();
                }
            }
        };
        Dispatcher.messageName = "dispatch-task";
        Dispatcher.tasks = null;
        return Dispatcher;
    }());
    controls.Dispatcher = Dispatcher;
    var EventListeners = (function () {
        function EventListeners() {
            this.listeners = [];
        }
        EventListeners.prototype.addListener = function (listener) {
            this.listeners.push(listener);
        };
        EventListeners.prototype.removeListener = function (listener) {
            this.listeners = this.listeners.filter(function (l) { return listener !== l; });
        };
        EventListeners.prototype.notifyListeners = function (evt) {
            for (var i = 0; i < this.listeners.length; i++) {
                this.listeners[i](evt);
            }
        };
        return EventListeners;
    }());
    controls.EventListeners = EventListeners;
    // Wrapper around browser's console object - handles IE where console object only exists if console window open
    var Console = (function () {
        function Console() {
        }
        Console.debug = function (msg) {
            if (typeof console != "undefined") {
                console.log(msg);
            }
        };
        return Console;
    }());
    controls.Console = Console;
})(controls || (controls = {}));
