module ui.panels
{
    import HtmlUtil = util.HtmlUtil;

    import Panel = controls.Panel;
    import Console = controls.Console;
    import Button = controls.Button;
    import Label = controls.Label;
    import TextBox = controls.TextBox;
    import TextArea = controls.TextArea;
    import ComboBox = controls.ComboBox;
    import MultiSelectDropDownList = controls.MultiSelectDropDownList;
    import SimpleArrayDataSource = controls.SimpleArrayDataSource;
    import ListItem = controls.ListItem;
    import ListBox = controls.ListBox;
    import CheckBox = controls.CheckBox;
    import RadioButtonSet = controls.RadioButtonSet;
    import MultiCheckBoxes = controls.MultiCheckBoxes;
    import DataTable = controls.DataTable;
    import DataTableColumn = controls.DataTableColumn;
    import TabPanel = controls.TabPanel;
    import ProgressBar = controls.ProgressBar;

    import ServerCommand = catdv.ServerCommand;
    import ArgumentForm = catdv.ArgumentForm;
    import CommandArgument = catdv.CommandArgument;
    import ServerCommandManager = logic.ServerCommandManager;

    interface ArgumentControl
    {
        controlType: string;
        inputControl: any;
        dataSource?: any;
    }
    
    interface FormMetrics 
    {
        numRows : number;
        numTables : number;
    }

    export class ServerCmdArgFlags
    {
        public resizable: boolean = false;
        public fillVertically: boolean = false;
        public fillHorizontally: boolean = true;
        public vertical: boolean = false;
        public numRows: number = 6;
        public numColumns: number = 1;
        public colSpan: number = 1;
        public initialSize: { width: number, height: number } = null;
        public colWidth: number = null;
        public labelWidth: number = null;
        public inputWidth: number = null;
        public refresh: number = null;
        public raiseEvents: boolean = false;
        public hierarchical: boolean = false;
        public readonly: boolean = false;

        constructor(flags: string)
        {
            if (flags != null)
            {
                flags.split(",").forEach((option) =>
                {
                    if (option == "resizable") this.resizable = true;
                    else if (option == "vfill" || option == "vfill:true") this.fillVertically = true;
                    else if (option == "hfill:false") this.fillHorizontally = false;
                    else if (option == "vertical") this.vertical = true;
                    else if (option == "events") this.raiseEvents = true;
                    else if (option == "hierarchical") this.hierarchical = true;
                    else if (option == "readonly") this.readonly = true;
                    else if (option.startsWith("rows:")) this.numRows = Number(option.substring(5));
                    else if (option.startsWith("cols:")) this.numColumns = Number(option.substring(5));
                    else if (option.startsWith("span:")) this.colSpan = Number(option.substring(5));
                    else if (option.startsWith("refresh:")) this.refresh = Number(option.substring(8));
                    else if (option.startsWith("web.width:"))
                    {
                        var args = option.substring(10).split(":");
                        this.colWidth = Number(args[0]);
                        if (args.length > 1)
                        {
                            this.labelWidth = Number(args[0]);
                            this.inputWidth = Number(args[1]);
                        }
                    }
                    else
                    {
                        var matches = option.match(/([0-9]+)x([0-9]+)/);
                        if (matches)
                        {
                            this.initialSize = { width: Number(matches[0]), height: Number(matches[1]) };
                        }
                    }
                });
            }
        }
    }

    export class ArgumentFormPanel extends Panel
    {
        private cmd: ServerCommand;
        private argumentForm: ArgumentForm;
        private title: string;
        private argControls: ArgumentControl[] = [];
        private argLookup: { [name: string]: ArgumentControl } = {};
        private submitBtns: string[] = null;
        private submitHandler: (evt: string, args: string[]) => void = null;

        constructor(element: any)
        {
            super(element);
        }

        public setCommand(cmd: ServerCommand, argumentForm: ArgumentForm)
        {
            this.cmd = cmd;
            this.argumentForm = argumentForm;

            this.$element.empty();
            this.argControls = [];
            this.argLookup = {};
            this.submitBtns = null;            

            var flags = new ServerCmdArgFlags(argumentForm.flags);
            var metrics = this.measureLayout(this.cmd,  this.argumentForm.items, flags);
            Console.debug(JSON.stringify(metrics));
            this.layoutArguments(this.cmd, this.argumentForm.items,flags, metrics, this.$element);
        }

        public getSubmitButtons(): string[]
        {
            return this.submitBtns;
        }

        public onSubmit(submitHandler: (evt: string, args: string[]) => void)
        {
            this.submitHandler = submitHandler;
        }

        public readArgumentValues(event: string): string[] 
        {
            var values: string[] = [];

            this.argControls.forEach((argControl, i) =>
            {
                if (argControl == null) return;

                switch (argControl.controlType)
                {
                    case "textbox":
                        values[i] = (<TextBox>(argControl.inputControl)).getText();
                        break;
                    case "textarea":
                        values[i] = (<TextArea>(argControl.inputControl)).getText();
                        break;
                    case "checkbox":
                        values[i] = (<CheckBox>(argControl.inputControl)).isChecked() ? "1" : "0";
                        break;
                    case "dropDownList":
                        values[i] = (<ComboBox>(argControl.inputControl)).getSelectedValue();
                        break;
                    case "listBox":
                        var selectedIndices = (<ListBox>(argControl.inputControl)).getSelectedIndices()
                        values[i] = selectedIndices.length ? selectedIndices.map((i) => i.toString()).join(",") : null;
                        break;
                    case "multilist":
                        var multilist = <MultiSelectDropDownList>(argControl.inputControl);
                        values[i] = multilist.getSelectedValues().join("\n");
                        break;
                    case "checkboxes":
                        var checked = (<MultiCheckBoxes>(argControl.inputControl)).getIsChecked();
                        values[i] = checked.map((isChecked) => isChecked ? "1" : "0").join("");
                        break;
                    case "radiobuttons":
                        values[i] = (<RadioButtonSet>(argControl.inputControl)).getValue();
                        break;
                    case "datatable":
                        var selectedItems = (<DataTable>(argControl.inputControl)).getSelectedItems()
                        values[i] = selectedItems.length ? selectedItems.map((item) => String(item.index)).join(",") : null;
                        break;
                    case "submit":
                        values[i] = event;
                        break;
                    default:
                        values[i] = null;
                        break;
                }
            });
            return values;
        }

        public updateForm(formUpdates: CommandArgument[])
        {
            (formUpdates || []).forEach((updateItem) =>
            {
                if (!updateItem) return;

                var newValue = updateItem.initialValue;
                var argControl = this.argLookup[updateItem.name];
                if (argControl && argControl.controlType)
                {
                    switch (argControl.controlType)
                    {
                        case "label":
                            (<Label>(argControl.inputControl)).setText(newValue);
                            break;
                        case "textbox":
                            (<TextBox>(argControl.inputControl)).setText(newValue);
                            break;
                        case "textarea":
                            (<TextArea>(argControl.inputControl)).setText(newValue);
                            break;
                        case "checkbox":
                            (<CheckBox>(argControl.inputControl)).setChecked(newValue == "1");
                            break;
                        case "dropDownList":
                            (<ComboBox>(argControl.inputControl)).setSelectedValue(newValue);
                            break;
                        case "listBox":
                            var listBox = (<ListBox>(argControl.inputControl));
                            if (updateItem.options)
                            {
                                listBox.setItems(updateItem.options.map((option) =>
                                {
                                    return {
                                        value: option,
                                        text: option,
                                        isSelected: option == updateItem.initialValue
                                    };
                                }));
                            }
                            var selectedIndices = (newValue || "").split(",").map((s) => Number(s));
                            listBox.setSelectedIndices(selectedIndices);
                            break;
                        case "multilist":
                            var multilist = <MultiSelectDropDownList>(argControl.inputControl);
                            multilist.setSelectedValues((newValue || "").split("\n"));
                            break;
                        case "checkboxes":
                            var isChecked = (newValue || "").split(" ").map((s) => (s == "1"));
                            (<MultiCheckBoxes>(argControl.inputControl)).setIsChecked(isChecked);
                            break;
                        case "radiobuttons":
                            (<RadioButtonSet>(argControl.inputControl)).setValue(newValue);
                            break;
                        case "progress":
                            (<ProgressBar>(argControl.inputControl)).setPercentage(Number(newValue));
                            break;
                        case "datatable":
                            var datatable = (<DataTable>(argControl.inputControl));
                            if (updateItem.data)
                            {
                                var dataSource: SimpleArrayDataSource<string[]> = argControl.dataSource;
                                dataSource.setItems(updateItem.data.map((d, i) => { d["index"] = i; return d; }));
                                datatable.reload();
                            }
                            break;
                        default:
                            break;
                    }
                }
            });
        }

        private measureLayout(cmd: ServerCommand, args: CommandArgument[], flags: ServerCmdArgFlags): FormMetrics
        {
            var numColumns = flags.numColumns;
            var col = 0;
            var numRows = 0;
            var numTables = 0;

            var i = 0;
            while (i < args.length)
            {
                var arg = args[i++];
                var argFlags = new ServerCmdArgFlags(arg.flags);

                if (arg.type == "tab")
                {
                    var tabRows = 0;
                    var tabTables = 0;
                    while (arg.type == "tab")
                    {
                        var tabMetrics = this.measureLayout(cmd, arg.children, argFlags);
                        tabRows = Math.max(tabRows, tabMetrics.numRows);
                        tabTables = Math.max(tabTables, tabMetrics.numTables);
                        arg = args[i++];
                        argFlags = new ServerCmdArgFlags(arg.flags);
                    }
                    numTables += tabTables;
                    numRows += tabRows + 1;
                }
                else if (i <= args.length)
                {
                    if ((argFlags.colSpan > 1) || (arg.type == "tab")) col == 0;

                    if (arg.type == "panel")
                    {
                        var panelMetrics = this.measureLayout(cmd, arg.children, new ServerCmdArgFlags(arg.flags));
                        numTables += panelMetrics.numTables;
                        numRows += (panelMetrics.numTables == 0) ? panelMetrics.numRows : 0;
                    }
                    else if (arg.type == "datatable")
                    {
                        numTables++;
                    }
                    else
                    {
                        if (col == 0) numRows++;
                    }
                    col = (col + 1) % flags.numColumns;
                }
            }
            return { numRows: numRows, numTables: numTables };
        }
        
        private layoutArguments(cmd: ServerCommand, args: CommandArgument[], flags: ServerCmdArgFlags, metrics: FormMetrics, parent: any)
        {
            var currentTabPanel: TabPanel = null;

            var $form = $("<form class='form-horizontal' role='form'></form>").appendTo(parent);
            var $row = null;

            var numColumns = flags.numColumns;
            var colWidth = ([12, 6, 4, 3])[numColumns - 1];
            var labelWidth = ([3, 2, 1, 1])[numColumns - 1];
            var inputWidth = colWidth - labelWidth;
            var col = 0;

            for (var i = 0; i < args.length; ++i)
            {
                var arg = args[i];

                if (arg.type == "submit")
                {
                    this.submitBtns = arg.options;
                    if (arg.label)
                    {
                        // Custom window title
                        this.title = arg.label;
                    }
                    this.argControls.push({ controlType: "submit", inputControl: null });
                    continue;
                }

                if (arg.type == "tab")
                {
                    var firstTab = (currentTabPanel == null);
                    if (firstTab)
                    {
                        currentTabPanel = TabPanel.create($form);
                        if (i < (args.length - 1)) currentTabPanel.$element.find("+ div").css({ "margin-bottom": "12px" });
                    }
                    this.argControls.push(firstTab ? { controlType: "tab", inputControl: currentTabPanel } : null);
                    var $tabPanel = currentTabPanel.addTab(arg.label, firstTab);
                    this.layoutArguments(cmd, arg.children, new ServerCmdArgFlags(arg.flags), metrics, $tabPanel);
                }
                else 
                {
                    var $inputContainer: JQuery;
                    var argFlags = new ServerCmdArgFlags(arg.flags);

                    if (argFlags.colSpan > 1) col = 0;
                    if (col == 0) $row = $("<div class='form-group form-group-sm'>").appendTo($form);
                    col = (col + 1) % flags.numColumns;

                    if (arg.type == "panel")
                    {
                        this.argControls.push(null);
                        var $panel = $("<div class='col-sm-" + colWidth + "'>").appendTo($row);
                        $row.removeClass("form-group-sm");
                        this.layoutArguments(cmd, arg.children, new ServerCmdArgFlags(arg.flags), metrics, $panel);
                    }
                    else
                    {
                        if ((arg.label == null) || (arg.type == "label") || ((arg.type == "html") && (arg.initialValue == null)))
                        {
                            // no label or type label means span the component over complete column
                            var spannedWidth = argFlags.colWidth || colWidth;
                            if (argFlags.colSpan > 1)
                            {
                                spannedWidth += colWidth * (argFlags.colSpan - 1)
                            }
                            $inputContainer = $("<div class='col-sm-" + spannedWidth + "'></div>").appendTo($row);
                        }
                        else 
                        {
                            // normal case: label and a widget (plus the case where there's no widget and we span label over two columns)
                            var spannedWidth = argFlags.inputWidth || inputWidth;
                            if (argFlags.colSpan > 1)
                            {
                                spannedWidth += colWidth * (argFlags.colSpan - 1)
                            }

                            $("<label for='cmdarg_" + i + "' class='col-sm-" + (argFlags.labelWidth || labelWidth) + " control-label'>" + HtmlUtil.escapeHtml(arg.label) + "</label>").appendTo($row);
                            $inputContainer = $("<div class='col-sm-" + spannedWidth + "'>").appendTo($row);
                        }

                        if (arg.type == "row")
                        {
                            this.argControls.push(null);

                            if (arg.children != null)
                            {
                                var $input_group = $("<div class='inline-form-controls'>").appendTo($inputContainer);
                                arg.children.forEach((child) =>
                                {
                                    if (child.label && (child.type != "checkbox"))
                                    {
                                        $("<label>" + HtmlUtil.escapeHtml(child.label) + "</label>").appendTo($input_group);
                                    }
                                    var childControl = this.createArgumentControl(cmd, child, new ServerCmdArgFlags(child.flags), metrics, $input_group);
                                    this.argControls.push(childControl);
                                    if (child.name) this.argLookup[child.name] = childControl;
                                });
                            }
                        }
                        else
                        {
                            var argumentControl = this.createArgumentControl(cmd, arg, argFlags, metrics, $inputContainer);

                            // Adjust row class for multi-line controls
                            if (argumentControl && (argumentControl.controlType == "listBox" || argumentControl.controlType == "textarea"))
                            {
                                $row.removeClass("form-group-sm");
                            }

                            this.argControls.push(argumentControl);
                            if (arg.name) this.argLookup[arg.name] = argumentControl;
                        }
                    }
                }
            }
        }

        private createArgumentControl(cmd: ServerCommand, arg: CommandArgument, flags: ServerCmdArgFlags, metrics: FormMetrics, $parent: JQuery): ArgumentControl
        {
            if (((arg.type == "list") || (arg.type == "combo") || (arg.type == "autolist")) && arg.options)
            {
                var dataSource = new SimpleArrayDataSource<ListItem>(arg.options.map((option) =>
                {
                    return {
                        value: option,
                        text: option,
                        isSelected: option == arg.initialValue
                    };
                }));
                var dropDownList = ComboBox.create({ "class": "form-control input-sm", "width": "100%" }, dataSource, true, false, $parent);

                if ((arg.type == "autolist") || flags.raiseEvents)
                {
                    dropDownList.onChanged((evt) =>
                    {
                        if (this.argumentForm.isLegacyCommandArguments)
                        {
                            var argValues = this.readArgumentValues(arg.label);
                            if (this.submitHandler)
                            {
                                this.submitHandler(arg.label || "", argValues);
                            }
                        }
                        else
                        {
                            this.raiseEvent(cmd, arg.name);
                        }
                        return false;

                    });
                }
                return { controlType: "dropDownList", inputControl: dropDownList };
            }
            else if ((arg.type == "multiselect") && arg.options != null)
            {
                // multi row, multi select
                var listBox = ListBox.create({ "class": "form-control", "multiselect": true }, $parent);
                arg.options.forEach((option) =>
                {
                    listBox.addItem({
                        value: option,
                        text: option,
                        isSelected: option == arg.initialValue
                    });
                });
                if (flags.raiseEvents)
                {
                    listBox.onChanged((evt) =>
                    {
                        this.raiseEvent(cmd, arg.name);
                    });
                }
                return { controlType: "listBox", inputControl: listBox };
            }
            else if (arg.type == "label") 
            {
                var label = Label.create({}, $parent);
                label.setText(arg.label);
                return { controlType: "label", inputControl: label };
            }
            else if (arg.type == "html")
            {
                $parent.html(arg.initialValue || arg.label);
                return null;
            }
            else if ((arg.type == "radio") && arg.options != null)
            {
                var radioButtonSet = RadioButtonSet.create("rdoArg" + this.argControls.length, arg.options, {}, $parent);
                radioButtonSet.setValue(arg.initialValue);
                if (flags.raiseEvents)
                {
                    radioButtonSet.onChanged((evt) =>
                    {
                        this.raiseEvent(cmd, arg.name + "." + radioButtonSet.getValue());
                    });
                }
                return { controlType: "radiobuttons", inputControl: radioButtonSet };
            }
            else if ((arg.type == "checkbox") && arg.options != null)
            {
                var checkboxes = MultiCheckBoxes.create("chkArg" + this.argControls.length, arg.options, {}, $parent);
                checkboxes.setValues(arg.initialValue ? arg.initialValue.split(",") : []);
                if (flags.raiseEvents)
                {
                    checkboxes.onChanged((evt) =>
                    {
                        this.raiseEvent(cmd, arg.name);
                    });
                }
                return { controlType: "checkboxes", inputControl: checkboxes };
            }
            else if (arg.type == "checkbox")
            {
                var $label = $("<label class='checkbox-inline'>").appendTo($parent)
                var checkbox = CheckBox.create({}, $label);
                $(document.createTextNode(arg.label)).appendTo($label);
                checkbox.setChecked((arg.initialValue != null) && (arg.initialValue == "1"));
                if (flags.raiseEvents)
                {
                    checkbox.onChanged((evt) =>
                    {
                        this.raiseEvent(cmd, arg.name);
                    });
                }
                return { controlType: "checkbox", inputControl: checkbox };
            }
            else if (arg.type == "password")
            {
                var text = TextBox.create({ "type": "password", "class": "form-control input-sm" }, $parent);
                text.setText(arg.initialValue);
                return { controlType: "textbox", inputControl: text };
            }
            else if ((arg.type == "multilist") && arg.options != null)
            {
                var listDataSource = new SimpleArrayDataSource<ListItem>(arg.options.map((i) => { return { text: i, value: i }; }));
                var multilist = MultiSelectDropDownList.create({ "class": "form-control", "width": "100%" }, true, listDataSource, $parent);
                multilist.setSelectedValues(arg.initialValue ? arg.initialValue.split("\n") : []);
                return { controlType: "multilist", inputControl: multilist, "dataSource": listDataSource };
            }
            else if (arg.type == "multiline")
            {
                var textarea = TextArea.create({ "class": "form-control", "rows": 4, "width": "20em" }, $parent);
                textarea.setText(arg.initialValue);
                textarea.setReadOnly(flags.readonly);
                return { controlType: "textarea", inputControl: textarea };
            }
            else if ((arg.type == "datatable") && arg.options)
            {
                var columns = arg.options.map((columnName, i) =>
                {
                    var column: DataTableColumn = {
                        title: columnName,
                        dataProp: "" + i,
                        isSortable: true,
                        renderer: (flags.hierarchical && i == 0) ? (obj, val, row) => this.renderHierarchyColumn(obj, val, row) : null
                    };
                    return column;
                });

                var gridDataSource = new SimpleArrayDataSource(arg.data.map((d, i) => { d["index"] = i; return d; }));
                var availableHeight = $("body").height() - 280 - (metrics.numRows * 32);
                var height = Math.max(100, availableHeight / metrics.numTables);
                Console.debug("$(body).height() " + $("body").height());
                Console.debug("metrics.numRows " + metrics.numRows);
                Console.debug("availableHeight " + availableHeight);
                Console.debug("height " + height);
                
                var dataTable = new DataTable($("<div style='height: " + height + "px'>").appendTo($parent), {
                    columns: columns,
                    simpleDataSource: gridDataSource
                });

                if (flags.raiseEvents)
                {
                    dataTable.onSelectionChanged((evt) =>
                    {
                        this.raiseEvent(cmd, arg.name);
                    });
                }
                if (flags.hierarchical)
                {
                    dataTable.onItemClicked((evt) => 
                    {
                        var rowIndexAttr = evt.srcElement.attributes["row-index"];
                        if (rowIndexAttr)
                        {
                            var rowIndex = rowIndexAttr.nodeValue;
                            this.raiseEvent(cmd, arg.name + ".discloser." + rowIndex);
                        }
                    });
                }

                return { "controlType": "datatable", "inputControl": dataTable, "dataSource": gridDataSource };
            }
            else if (arg.type == "progress")
            {
                var progressBar = ProgressBar.create($parent);
                progressBar.setPercentage(Number(arg.initialValue));
                return { controlType: "progress", inputControl: progressBar };
            }
            else if ((arg.type == "buttons") && arg.options)
            {
                var buttonOptions = { "class": "btn btn-sm btn-primary" };
                if (flags.vertical)
                {
                    buttonOptions["style"] = "display: block; margin-bottom: 6px; width: 100px;";
                }
                else
                {
                    buttonOptions["style"] = "margin-right: 6px;";
                }
                arg.options.forEach((buttonText) =>
                {
                    var button = Button.create(buttonText, buttonOptions, $parent);
                    button.onClick((evt) =>
                    {
                        this.raiseEvent(cmd, (arg.name ? arg.name + "." : "") + buttonText);
                        return false;
                    });
                });
                return null;
            }
            else
            {
                var textbox = TextBox.create({ "class": "form-control input-sm", "width": "20em" }, $parent);
                textbox.setText(arg.initialValue);
                textbox.setReadOnly(flags.readonly);
                return { controlType: "textbox", inputControl: textbox };
            }
        }

        private renderHierarchyColumn(obj: any, value: string, row: number): string
        {
            var indent = 0;
            while (value.startsWith("|"))
            {
                value = value.substring(1);
                indent++;
            }
            var html = (indent > 0) ? "<span style='padding-left:" + (12 * indent) + "px'>" : "";
            if (value.startsWith("[+]"))
            {
                value = value.substring(3);
                html += "<span class='glyphicon glyphicon-play discloser' row-index='" + row + "'> </span> ";
            }
            else if (value.startsWith("[-]"))
            {
                value = value.substring(3);
                html += "<span class='glyphicon glyphicon-play discloser glyph-rotate-90' row-index='" + row + "'> </span> ";
            }
            else
            {
                html += "<span class='glyphicon glyphicon-play discloser' style='visibility: hidden;'> </span> ";
            }
            if (indent > 0) html += "</span> ";
            html += value
            return html;
        }

        private raiseEvent(cmd: ServerCommand, event: string)
        {
            var argValues = this.readArgumentValues(event);
            ServerCommandManager.processEvent(cmd, event, argValues, (updates) =>
            {
                if(updates)
                {
                    this.updateForm(updates.items);
                }
            });
        }

    }
}
