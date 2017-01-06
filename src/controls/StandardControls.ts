module controls
{
    import Platform = util.Platform;
    import HtmlUtil = util.HtmlUtil;
    
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
    export class Element
    {
        public elementId: string;
        public $element: JQuery;

        constructor(element: any)
        {
            this.$element = Element.get$(element);
            this.elementId = this.$element.length > 0 ? this.$element.get(0).id : null;
        }

        // Return a JQquery object that wraps the specified element
        // The element parameter may be an element ID string, an HTMLELement or a JQuery object 
        // (in which case it is just returned).
        public static get$(element): JQuery
        {
            if (typeof element === "string")
            {
                return $("#" + <string>element);
            }
            else if (element.$element) // i.e. it's a Control
            {
                return element.$element;
            }
            else if (typeof element === "HTMLElement")
            {
                return $(<HTMLElement>element);
            }
            else
            {
                return <JQuery>element;
            }
        }

        // Utility function to render an HTML tag based on passed in options
        public static render(tag: string, options: any, tagContent: string = "")
        {
            var html = "<" + tag;
            if (options)
            {
                for (var option in options)
                {
                    var optionValue = options[option];
                    if (typeof optionValue == 'Boolean')
                    {
                        if (optionValue)
                        {
                            html += " " + option;
                        }
                    }
                    else if ((typeof optionValue != 'Object') && (typeof optionValue != 'Array'))
                    {
                        html += " " + option + "='" + HtmlUtil.escapeHtml(optionValue) + "'";
                    }
                }
            }
            html += ">" + tagContent + "</" + tag + ">";
            return html;
        }

        // Utility function to convert a string into a valid element id
        public static toID(str: string): string
        {
            return str.replace(new RegExp('[^A-Za-z0-9]', 'g'), "_");
        }

        public getElement(): HTMLElement
        {
            return document.getElementById(this.elementId);
        }

        public setSize(width: number, height: number)
        {
            this.setWidth(width);
            this.setHeight(height);
        }

        public getLeft(): number
        {
            return this.$element.position().left;
        }
        public setLeft(left: number)
        {
            this.$element.css({ "left": left });
        }

        public getTop(): number
        {
            return this.$element.position().top;
        }
        public setTop(top: number)
        {
            this.$element.css({ "top": top });
        }

        public getBottom(): number
        {
            return parseInt(this.$element.css("bottom"));
        }
        public setBottom(bottom: number)
        {
            this.$element.css({ "bottom": bottom });
        }

        public getRight(): number
        {
            return parseInt(this.$element.css("right"));
        }
        public setRight(right: number)
        {
            this.$element.css({ "right": right });
        }

        public getWidth(): number
        {
            return this.$element.width();
        }
        public setWidth(width: number)
        {
            this.$element.css({ "width": width });
        }

        public getHeight(): number
        {
            return this.$element.height();
        }
        public setHeight(height: any)
        {
            this.$element.css({ "height": height });
        }

        // Get postiion of element relative to document
        public getAbsoluteLeft(): number
        {
            return this.$element.offset().left;
        }
        public getAbsoluteTop(): number
        {
            return this.$element.offset().top;
        }

        public css(css: any): any
        {
            return this.$element.css(css);
        }

        public show(show?: boolean)
        {
            if ((typeof show == "undefined") || (show == true))
            {
                this.$element.show();
            }
            else
            {
                this.$element.hide();
            }
        }

        public hide()
        {
            this.$element.hide();
        }

        public onClick(clickHandler: (evt: any) => void)
        {
            this.$element.click(function(evt)
            {
                return clickHandler(evt);
            });
        }
    }

    // Base class for Panels (User Controls)
    export class Panel extends Element
    {
        constructor(element: any)
        {
            super(element);
        }

        public clear()
        {
            this.$element.empty();
        }
    }

    // Base class for all controls
    export class Control extends Element
    {
        constructor(element: any)
        {
            super(element);
        }
    }

    // Form controls encompases input controls and action controls (buttons). Support enable/disable.
    export class FormControl extends Control
    {
        public setEnabled(enabled: boolean)       
        {
            if (enabled)
            {
                this.$element.removeAttr("disabled");
            }
            else
            {
                this.$element.attr("disabled", "disabled");
            }
        }

    }

    // Input Controls (<input>, <select> and <textarea>) that support changed events
    export class InputControl extends FormControl
    {
        constructor(element: any)
        {
            super(element);
        }

        public onChanged(changeHandler: (evt: any) => void)
        {
            this.$element.change(function(evt)
            {
                changeHandler(evt);
            });
        }

    }

    export class Button extends FormControl
    {
        constructor(element: any)
        {
            super(element);
        }

        public static create(buttonText: string, options: any, parent: any)
        {
            return new Button($(Element.render("button", options, buttonText)).appendTo(Element.get$(parent)));
        }

    }

    export class Image extends Control
    {
        constructor(element: any)
        {
            super(element);
        }

        public static create(options: any, parent: any)
        {
            return new Image($(Element.render("img", options)).appendTo(Element.get$(parent)));
        }

        public setSourceUrl(url: string)
        {
            this.$element.attr("src", url);
        }
    }

    export class HyperLink extends Control
    {
        constructor(element: any)
        {
            super(element);
        }

        public static create(options: any, parent: any)
        {
            return new HyperLink($(Element.render("a", options)).appendTo(Element.get$(parent)));
        }

        public setHREF(url: string)
        {
            this.$element.attr("href", url);
        }
        
        public setText(text: string)
        {
            this.$element.text(text);
        }
    }

    export class TextBox extends InputControl
    {
        constructor(element: any)
        {
            super(element);
        }

        public static create(options: any, parent: any)
        {
            return new TextBox($(Element.render("input", $.extend({ "type": "text" }, options))).appendTo(Element.get$(parent)));
        }

        public setText(value: string)
        {
            this.$element.val(value);
        }
        public getText(): string
        {
            return this.$element.val();
        }

        public setReadOnly(readonly: boolean)
        {
            this.$element.prop("readonly", readonly);
        }

        // Override           
        public onChanged(changeHandler: (evt: any) => void)
        {
            super.onChanged(changeHandler);
            
            // IE does not generate change event when user presses return
            if(Platform.isIE())
            {
                this.$element.keydown(function(evt){
                    if (evt.keyCode==13) changeHandler(evt);
                });              
            }
        }

        // Input event fires immediately unlike changed which only fires on lost focus
        public onInput(inputHandler: (evt: any) => void)
        {
            // Something on the Mac eats input, change and keypress events - so we have to use keyup!
            if (Platform.isMac())
            {
                this.$element.on("keyup", function(evt)
                {
                    inputHandler(evt);
                });
            }
            else
            {
                this.$element.on("input", function(evt)
                {
                    inputHandler(evt);
                });
            }
        }
    }

    export class TextArea extends InputControl
    {
        constructor(element: any)
        {
            super(element);
        }

        public static create(options: any, parent: any)
        {
            return new TextArea($(Element.render("textarea", options)).appendTo(Element.get$(parent)));
        }

        public setText(value: string)
        {
            this.$element.val(value);
        }
        public getText(): string
        {
            return this.$element.val();
        }

        public setReadOnly(readonly: boolean)
        {
            this.$element.prop("readonly", readonly);
        }
        
        // Input event fires immediately unlike changed which only fires on lost focus
        public onInput(inputHandler: (evt: any) => void)
        {
            // Something on the Mac eats input, change and keypress events - so we have to use keyup!
            if (Platform.isMac())
            {
                this.$element.on("keyup", function(evt)
                {
                    inputHandler(evt);
                });
            }
            else
            {
                this.$element.on("input", function(evt)
                {
                    inputHandler(evt);
                });
            }
        }

    }

    // Can wrap any HTML element with text content
    export class Label extends Control
    {
        constructor(element: any)
        {
            super(element);
        }

        public static create(options: any, parent: any)
        {
            return new Label($(Element.render("span", options)).appendTo(Element.get$(parent)));
        }

        public setText(value: string)
        {
            this.$element.text(value);
        }
    }

    export interface ListItem
    {
        value: any;
        text: string;
        tooltip?: string;
        cssClass?: string;
        isSelected?: boolean;
    }

    export class DropDownList extends InputControl
    {
        private items: ListItem[] = [];
        
        constructor(element: any)
        {
            super(element);
        }

        public static create(options: any, parent: any): DropDownList
        {
            var newDropDownList = new DropDownList($(Element.render("select", options)).appendTo(Element.get$(parent)));
            if (options.values)
            {
                newDropDownList.setItems(options.values.map((s) => { return { value: s, text: s }; }));
            }
            else if (options.items)
            {
                newDropDownList.setItems(options.items);
            }
            return newDropDownList;
        }

        public clearItems()
        {
            this.items = [];
            this.$element.empty();
        }

        public setItems(items: ListItem[])
        {
            this.items = items;
            this.$element.empty();
            if (items)
            {
                items.forEach((item) => this.addItem(item));
            }
        }
        
        public getItems() : ListItem[]
        {
            return this.items;
        }

        public addItem(item: ListItem)
        {
            this.items.push(item);
            var $option = $("<option value='" + item.value + "' " + (item.isSelected ? " selected" : "") + "/>").appendTo(this.$element);
            $option.text(item.text);
        }

        public getSelectedIndex(): number
        {
            return this.$element.find("option:selected").index();
        }
        public setSelectedIndex(selectedIndex : number)
        {
            this.$element.val(this.items[selectedIndex].value);
        }

        public getSelectedValue(): string
        {
            return this.$element.val();
        }

        public setSelectedValue(value: string): DropDownList
        {
            this.$element.val(value);
            return this;
        }
    }

    export class ListBox extends InputControl
    {
        constructor(element: any)
        {
            super(element);
        }

        public static create(options: any, parent: any): ListBox
        {
            var opts = $.extend({ "size": 5 }, options);
            if (opts.multiselect)
            {
                opts.multiple = "multiple";
            }
            delete opts.multiselect;

            var newListBox = new ListBox($(Element.render("select", opts)).appendTo(Element.get$(parent)));
            if (options.values)
            {
                newListBox.setItems(options.values.map((s) => { return { value: s, text: s }; }));
            }
            else if (options.items)
            {
                newListBox.setItems(options.items);
            }
            return newListBox;
        }

        public clear(): void
        {
            this.$element.empty();
        }

        public add(value: string, text: string = null, tooltip: string = null)
        {
            this.$element.append(this.createOptionElement(value, text, tooltip));
        }

        public addItem(item: ListItem)
        {
            this.$element.append(this.createOptionElement(item.value, item.text, item.tooltip));
        }

        public setItemAt(index: number, value: string, text: string = null, tooltip: string = null)
        {
            this.$element.find("option:nth-child(" + (index + 1) + ")").replaceWith(this.createOptionElement(value, text, tooltip));
        }

        private createOptionElement(value: string, text: string = null, tooltip: string = null)
        {
            return "<option value='" + HtmlUtil.escapeHtml(value) + "'"
             + (tooltip ? " title='" + HtmlUtil.escapeHtml(tooltip) + "'" : "") + ">" + HtmlUtil.escapeHtml(text || value) + "</option>";
        }

        public removeItemAt(index: number)
        {
            this.$element.find("option:nth-child(" + (index + 1) + ")").remove();
        }

        public setItems(items: ListItem[]): void
        {
            this.$element.empty();
            if (items)
            {
                items.forEach((item) =>
                {
                    $("<option value='" + HtmlUtil.escapeHtml(item.value) + "' " + (item.isSelected ? " selected" : "") + ">" 
                    + HtmlUtil.escapeHtml(item.text) + "</option>").appendTo(this.$element);
                });
            }
        }

        public getItems(): ListItem[] 
        {
            var items: ListItem[] = [];
            this.$element.find("option").each(function()
            {
                items.push({ value: $(this).val(), text: $(this).text() });
            });
            return items;
        }

        public getSelectedValue(): string
        {
            return this.$element.val();
        }

        public setSelectedValue(value: string)
        {
            this.$element.val(value);
        }

        public getSelectedValues(): string[]
        {
            var values: string[] = [];
            this.$element.find("option").each((i, e) => { if ($(e).is(":selected")) values.push($(e).val()); });
            return values;
        }

        public setSelectedValues(values: string[])
        {
            this.$element.find("option").removeAttr('selected');
            values.forEach((value) =>
            {
                this.$element.find("option[value='" + value + "']'").attr('selected', 'selected');
            });
        }
        
        public getSelectedIndex(): number
        {
            return this.$element.find("option:selected").index();
        }

        public setSelectedIndex(index: number) 
        {
            this.$element.find("option").removeAttr('selected');
            this.$element.find("option").eq(index).attr('selected', 'selected');
        }

        public getSelectedIndices(): number[]
        {
            var indices: number[] = [];
            this.$element.find("option").each((i, e) => { if ($(e).is(":selected")) indices.push(i); });
            return indices;
        }

        public setSelectedIndices(indices: number[])
        {
            this.$element.find("option").removeAttr('selected');
            indices.forEach((index) =>
            {
                this.$element.find("option").eq(index).attr('selected', 'selected');
            });
        }
  }

    export class CheckBox extends InputControl
    {
        constructor(element: any)
        {
            super(element);
        }

        public static create(options: any, parent: any): CheckBox
        {
            return new CheckBox($(Element.render("input type='checkbox'", options)).appendTo(Element.get$(parent)));
        }

        public isChecked(): boolean
        {
            return this.$element.prop("checked") ? true : false;
        }

        public setChecked(checked: boolean): CheckBox
        {
            this.$element.prop("checked", checked ? true : false);
            return this;
        }
    }

    export class MultiCheckBoxes
    {
        private values: string[] = null;
        private checkBoxes: CheckBox[] = null;
        private name: string = null;

        constructor(checkBoxes: CheckBox[], values: string[], name: string)
        {
            this.checkBoxes = checkBoxes;
            this.values = values;
            this.name = name;
        }

        public static create(name: string, values: string[], options: any, parent: any): MultiCheckBoxes
        {
            var checkBoxes: CheckBox[] = [];

            values.forEach((value, i) =>
            {
                var $parent = Element.get$(parent);
                var $label = $("<label class='checkbox-inline'>").appendTo($parent);
                var chkOptions = $.extend({ "id": name + "_" + i, "name": name }, options);
                var $checkbox = $(Element.render("input type='checkbox'", chkOptions)).appendTo($label);
                $(document.createTextNode(value)).appendTo($label);
                checkBoxes.push(new CheckBox($checkbox));
            });
            return new MultiCheckBoxes(checkBoxes, values, name);
        }

        public setEnabled(enabled: boolean)
        {
            this.checkBoxes.forEach((rdo) => rdo.setEnabled(enabled));
        }

        public setValues(values: string[])
        {
            this.checkBoxes.forEach((checkBox, i) => checkBox.setChecked(values.contains(this.values[i])));
        }

        public getValues(): string[]
        {
            var values: string[] = [];
            this.checkBoxes.forEach((checkBox, i) =>
            {
                if (checkBox.isChecked())
                {
                    values.push(this.values[i]);
                }
            });
            return values;
        }
        
        public getIsChecked() : boolean[]
        {
            return this.checkBoxes.map((checkBox) => checkBox.isChecked());
        }
        
        public setIsChecked(isChecked : boolean[])
        {
           this.checkBoxes.forEach((checkBox, i) => checkBox.setChecked(isChecked[i]));
        }

        public onChanged(changeHandler: (evt: any) => void)
        {
            $("input[type=checkbox][name=" + this.name + "]").change(changeHandler);
        }
    }

    export class RadioButton extends InputControl
    {
        constructor(element: any, parent: any = null, options: any = null)
        {
            super(element);
        }

        public static create(options: any, parent: any): RadioButton
        {
            return new RadioButton($(Element.render("input type='radio'", options)).appendTo(Element.get$(parent)));
        }

        public isSelected(): boolean
        {
            return this.$element.prop("checked") ? true : false;
        }

        public setSelected(checked: boolean): RadioButton
        {
            this.$element.prop("checked", checked ? true : false);
            return this;
        }
    }

    export class RadioButtonSet
    {
        private radioButtons: RadioButton[] = null;
        private values: string[] = null;
        private name : string;

        constructor(radioButtons: RadioButton[], values: string[], name : string)
        {
            this.radioButtons = radioButtons;
            this.values = values;
            this.name = name;
        }

        public static create(name: string, values: string[], options: any, parent: any): RadioButtonSet
        {
            var radioButtons: RadioButton[] = [];

            values.forEach((value, i) =>
            {
                var $parent = Element.get$(parent);
                var $label = $("<label class='radio-inline'>").appendTo($parent);
                var rdoOptions = $.extend({ "id": name + "_" + i, "name": name }, options);
                var $radio = $(Element.render("input type='radio'", rdoOptions)).appendTo($label);
                $(document.createTextNode(value)).appendTo($label);
                radioButtons.push(new RadioButton($radio));
            });
            return new RadioButtonSet(radioButtons, values, name);
        }

        public setEnabled(enabled: boolean)
        {
            this.radioButtons.forEach((rdo) => rdo.setEnabled(enabled));
        }

        public setValue(value: string)
        {
            var index = this.values.indexOf(value);
            if ((index >= 0) && (index < this.radioButtons.length))
            {
                this.radioButtons[index].setSelected(true);
            }
        }

        public getValue(): string
        {
            for (var i = 0; i < this.values.length; i++)
            {
                if (this.radioButtons[i].isSelected()) return this.values[i];
            }
            return null;
        }
        
        public onChanged(changeHandler: (evt: any) => void)
        {
            $("input[type=radio][name=" + this.name + "]").change(changeHandler);
        }
    }

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
    export class FocusPanel extends Control
    {
        private $hiddenTextBox: JQuery;
        private keypressHandler: (evt: JQueryKeyEventObject) => void = null;
        private keydownHandler: (evt: JQueryKeyEventObject) => void = null;

        constructor(element: any)
        {
            super(element);

            // This is used to allow a non-input control to capture key input (specifically the video player controls)
            // But on a touch device setting the focus to a text input control causes the keyboard to pop up
            // so lets just not do it on touch device...
            if (!Platform.isTouchDevice())
            {
                this.$hiddenTextBox = $("<input type='text' tabindex='-1' role='presentation' "
                    + "style='opacity: 0; position: absolute; bottom: 0px; right:0px; "
                    + "height: 1px; width: 1px; z-index: -1; overflow: hidden; '>").appendTo($("body"));

                this.$element.on("click", (evt) => this.$hiddenTextBox.focus());

                this.$hiddenTextBox.keypress((evt) =>
                {
                    if (this.keypressHandler) this.keypressHandler(evt);
                });

                this.$hiddenTextBox.keydown((evt) =>
                {
                    if (this.keydownHandler) this.keydownHandler(evt);
                });
            }
        }

        public focus()
        {
            this.$hiddenTextBox.focus();
        }

        public onKeyPress(keypressHandler: (evt: JQueryKeyEventObject) => void)
        {
            this.keypressHandler = keypressHandler;
        }
        public onKeyDown(keydownHandler: (evt: JQueryKeyEventObject) => void)
        {
            this.keydownHandler = keydownHandler;
        }
    }

    export class Timer
    {
        private intervalMilliseconds: number;
        private timerHandle: number = null;
        private task: () => void;

        constructor(intervalMilliseconds: number, task: () => void)
        {
            this.intervalMilliseconds = intervalMilliseconds;
            this.task = task;
        }

        public start()
        {
            if (this.timerHandle) 
            {
                this.stop();
            }
            this.timerHandle = window.setInterval(this.task, this.intervalMilliseconds);
        }

        public stop()
        {
            window.clearInterval(this.timerHandle);
            this.timerHandle = null;
        }

        public static defer(delayMilliseconds: number, task: () => void)
        {
            // It can be useful to have an optional delay - so allow zero to mean just call task
            if (delayMilliseconds == 0) 
            {
                task()
            }
            else
            {
                window.setTimeout(task, delayMilliseconds);
            }
        }
    }

    export class Dispatcher
    {
        private static messageName = "dispatch-task";
        private static tasks: { (): void }[] = null;

        public static dispatch(task: () => void)
        {
            if (Dispatcher.tasks == null)
            {
                Dispatcher.tasks = [task];
                if (window.addEventListener)
                {
                    window.addEventListener("message", Dispatcher.messagehandler, true);
                }
                else
                {
                    (<any>window).attachEvent("onmessage", Dispatcher.messagehandler);
                }
            }
            else
            {
                Dispatcher.tasks.push(task);
            }
            window.postMessage(Dispatcher.messageName, "*");
        }

        private static messagehandler(event: MessageEvent)
        {
            if (event.source == window && event.data == Dispatcher.messageName)
            {
                if (event.stopPropagation)
                {
                    event.stopPropagation();
                } 
                else
                {
                    // IE
                    (<any>event).returnValue = false;
                }
                
                if (Dispatcher.tasks.length > 0)
                {
                    var task = Dispatcher.tasks.shift();
                    task();
                }
            }
        }
    }

    interface EventListener<T>
    {
        (evt: T): void;
    }

    export class EventListeners<T>
    {
        private listeners: EventListener<T>[] = [];

        constructor()
        { }

        public addListener(listener: (evt: T) => void)
        {
            this.listeners.push(listener);
        }

        public removeListener(listener: (evt: T) => void)
        {
            this.listeners = this.listeners.filter((l) => listener !== l);
        }

        public notifyListeners(evt: T)
        {
            for (var i = 0; i < this.listeners.length; i++)
            {
                this.listeners[i](evt);
            }
        }
    }


    // Wrapper around browser's console object - handles IE where console object only exists if console window open
    export class Console
    {
        public static debug(msg: string)
        {
            if (typeof console != "undefined") { console.log(msg); }
        }
    }


}