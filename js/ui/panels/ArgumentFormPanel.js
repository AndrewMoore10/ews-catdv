var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var ui;
(function (ui) {
    var panels;
    (function (panels) {
        var HtmlUtil = util.HtmlUtil;
        var Panel = controls.Panel;
        var Console = controls.Console;
        var Button = controls.Button;
        var Label = controls.Label;
        var TextBox = controls.TextBox;
        var TextArea = controls.TextArea;
        var ComboBox = controls.ComboBox;
        var MultiSelectDropDownList = controls.MultiSelectDropDownList;
        var SimpleArrayDataSource = controls.SimpleArrayDataSource;
        var ListBox = controls.ListBox;
        var CheckBox = controls.CheckBox;
        var RadioButtonSet = controls.RadioButtonSet;
        var MultiCheckBoxes = controls.MultiCheckBoxes;
        var DataTable = controls.DataTable;
        var TabPanel = controls.TabPanel;
        var ProgressBar = controls.ProgressBar;
        var ServerCommandManager = logic.ServerCommandManager;
        var ServerCmdArgFlags = (function () {
            function ServerCmdArgFlags(flags) {
                var _this = this;
                this.resizable = false;
                this.fillVertically = false;
                this.fillHorizontally = true;
                this.vertical = false;
                this.numRows = 6;
                this.numColumns = 1;
                this.colSpan = 1;
                this.initialSize = null;
                this.colWidth = null;
                this.labelWidth = null;
                this.inputWidth = null;
                this.refresh = null;
                this.raiseEvents = false;
                this.hierarchical = false;
                this.readonly = false;
                if (flags != null) {
                    flags.split(",").forEach(function (option) {
                        if (option == "resizable")
                            _this.resizable = true;
                        else if (option == "vfill" || option == "vfill:true")
                            _this.fillVertically = true;
                        else if (option == "hfill:false")
                            _this.fillHorizontally = false;
                        else if (option == "vertical")
                            _this.vertical = true;
                        else if (option == "events")
                            _this.raiseEvents = true;
                        else if (option == "hierarchical")
                            _this.hierarchical = true;
                        else if (option == "readonly")
                            _this.readonly = true;
                        else if (option.startsWith("rows:"))
                            _this.numRows = Number(option.substring(5));
                        else if (option.startsWith("cols:"))
                            _this.numColumns = Number(option.substring(5));
                        else if (option.startsWith("span:"))
                            _this.colSpan = Number(option.substring(5));
                        else if (option.startsWith("refresh:"))
                            _this.refresh = Number(option.substring(8));
                        else if (option.startsWith("web.width:")) {
                            var args = option.substring(10).split(":");
                            _this.colWidth = Number(args[0]);
                            if (args.length > 1) {
                                _this.labelWidth = Number(args[0]);
                                _this.inputWidth = Number(args[1]);
                            }
                        }
                        else {
                            var matches = option.match(/([0-9]+)x([0-9]+)/);
                            if (matches) {
                                _this.initialSize = { width: Number(matches[0]), height: Number(matches[1]) };
                            }
                        }
                    });
                }
            }
            return ServerCmdArgFlags;
        }());
        panels.ServerCmdArgFlags = ServerCmdArgFlags;
        var ArgumentFormPanel = (function (_super) {
            __extends(ArgumentFormPanel, _super);
            function ArgumentFormPanel(element) {
                _super.call(this, element);
                this.argControls = [];
                this.argLookup = {};
                this.submitBtns = null;
                this.submitHandler = null;
            }
            ArgumentFormPanel.prototype.setCommand = function (cmd, argumentForm) {
                this.cmd = cmd;
                this.argumentForm = argumentForm;
                this.$element.empty();
                this.argControls = [];
                this.argLookup = {};
                this.submitBtns = null;
                var flags = new ServerCmdArgFlags(argumentForm.flags);
                var metrics = this.measureLayout(this.cmd, this.argumentForm.items, flags);
                Console.debug(JSON.stringify(metrics));
                this.layoutArguments(this.cmd, this.argumentForm.items, flags, metrics, this.$element);
            };
            ArgumentFormPanel.prototype.getSubmitButtons = function () {
                return this.submitBtns;
            };
            ArgumentFormPanel.prototype.onSubmit = function (submitHandler) {
                this.submitHandler = submitHandler;
            };
            ArgumentFormPanel.prototype.readArgumentValues = function (event) {
                var values = [];
                this.argControls.forEach(function (argControl, i) {
                    if (argControl == null)
                        return;
                    switch (argControl.controlType) {
                        case "textbox":
                            values[i] = (argControl.inputControl).getText();
                            break;
                        case "textarea":
                            values[i] = (argControl.inputControl).getText();
                            break;
                        case "checkbox":
                            values[i] = (argControl.inputControl).isChecked() ? "1" : "0";
                            break;
                        case "dropDownList":
                            values[i] = (argControl.inputControl).getSelectedValue();
                            break;
                        case "listBox":
                            var selectedIndices = (argControl.inputControl).getSelectedIndices();
                            values[i] = selectedIndices.length ? selectedIndices.map(function (i) { return i.toString(); }).join(",") : null;
                            break;
                        case "multilist":
                            var multilist = (argControl.inputControl);
                            values[i] = multilist.getSelectedValues().join("\n");
                            break;
                        case "checkboxes":
                            var checked = (argControl.inputControl).getIsChecked();
                            values[i] = checked.map(function (isChecked) { return isChecked ? "1" : "0"; }).join("");
                            break;
                        case "radiobuttons":
                            values[i] = (argControl.inputControl).getValue();
                            break;
                        case "datatable":
                            var selectedItems = (argControl.inputControl).getSelectedItems();
                            values[i] = selectedItems.length ? selectedItems.map(function (item) { return String(item.index); }).join(",") : null;
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
            };
            ArgumentFormPanel.prototype.updateForm = function (formUpdates) {
                var _this = this;
                (formUpdates || []).forEach(function (updateItem) {
                    if (!updateItem)
                        return;
                    var newValue = updateItem.initialValue;
                    var argControl = _this.argLookup[updateItem.name];
                    if (argControl && argControl.controlType) {
                        switch (argControl.controlType) {
                            case "label":
                                (argControl.inputControl).setText(newValue);
                                break;
                            case "textbox":
                                (argControl.inputControl).setText(newValue);
                                break;
                            case "textarea":
                                (argControl.inputControl).setText(newValue);
                                break;
                            case "checkbox":
                                (argControl.inputControl).setChecked(newValue == "1");
                                break;
                            case "dropDownList":
                                (argControl.inputControl).setSelectedValue(newValue);
                                break;
                            case "listBox":
                                var listBox = (argControl.inputControl);
                                if (updateItem.options) {
                                    listBox.setItems(updateItem.options.map(function (option) {
                                        return {
                                            value: option,
                                            text: option,
                                            isSelected: option == updateItem.initialValue
                                        };
                                    }));
                                }
                                var selectedIndices = (newValue || "").split(",").map(function (s) { return Number(s); });
                                listBox.setSelectedIndices(selectedIndices);
                                break;
                            case "multilist":
                                var multilist = (argControl.inputControl);
                                multilist.setSelectedValues((newValue || "").split("\n"));
                                break;
                            case "checkboxes":
                                var isChecked = (newValue || "").split(" ").map(function (s) { return (s == "1"); });
                                (argControl.inputControl).setIsChecked(isChecked);
                                break;
                            case "radiobuttons":
                                (argControl.inputControl).setValue(newValue);
                                break;
                            case "progress":
                                (argControl.inputControl).setPercentage(Number(newValue));
                                break;
                            case "datatable":
                                var datatable = (argControl.inputControl);
                                if (updateItem.data) {
                                    var dataSource = argControl.dataSource;
                                    dataSource.setItems(updateItem.data.map(function (d, i) { d["index"] = i; return d; }));
                                    datatable.reload();
                                }
                                break;
                            default:
                                break;
                        }
                    }
                });
            };
            ArgumentFormPanel.prototype.measureLayout = function (cmd, args, flags) {
                var numColumns = flags.numColumns;
                var col = 0;
                var numRows = 0;
                var numTables = 0;
                var i = 0;
                while (i < args.length) {
                    var arg = args[i++];
                    var argFlags = new ServerCmdArgFlags(arg.flags);
                    if (arg.type == "tab") {
                        var tabRows = 0;
                        var tabTables = 0;
                        while (arg.type == "tab") {
                            var tabMetrics = this.measureLayout(cmd, arg.children, argFlags);
                            tabRows = Math.max(tabRows, tabMetrics.numRows);
                            tabTables = Math.max(tabTables, tabMetrics.numTables);
                            arg = args[i++];
                            argFlags = new ServerCmdArgFlags(arg.flags);
                        }
                        numTables += tabTables;
                        numRows += tabRows + 1;
                    }
                    else if (i <= args.length) {
                        if ((argFlags.colSpan > 1) || (arg.type == "tab"))
                            col == 0;
                        if (arg.type == "panel") {
                            var panelMetrics = this.measureLayout(cmd, arg.children, new ServerCmdArgFlags(arg.flags));
                            numTables += panelMetrics.numTables;
                            numRows += (panelMetrics.numTables == 0) ? panelMetrics.numRows : 0;
                        }
                        else if (arg.type == "datatable") {
                            numTables++;
                        }
                        else {
                            if (col == 0)
                                numRows++;
                        }
                        col = (col + 1) % flags.numColumns;
                    }
                }
                return { numRows: numRows, numTables: numTables };
            };
            ArgumentFormPanel.prototype.layoutArguments = function (cmd, args, flags, metrics, parent) {
                var _this = this;
                var currentTabPanel = null;
                var $form = $("<form class='form-horizontal' role='form'></form>").appendTo(parent);
                var $row = null;
                var numColumns = flags.numColumns;
                var colWidth = ([12, 6, 4, 3])[numColumns - 1];
                var labelWidth = ([3, 2, 1, 1])[numColumns - 1];
                var inputWidth = colWidth - labelWidth;
                var col = 0;
                for (var i = 0; i < args.length; ++i) {
                    var arg = args[i];
                    if (arg.type == "submit") {
                        this.submitBtns = arg.options;
                        if (arg.label) {
                            // Custom window title
                            this.title = arg.label;
                        }
                        this.argControls.push({ controlType: "submit", inputControl: null });
                        continue;
                    }
                    if (arg.type == "tab") {
                        var firstTab = (currentTabPanel == null);
                        if (firstTab) {
                            currentTabPanel = TabPanel.create($form);
                            if (i < (args.length - 1))
                                currentTabPanel.$element.find("+ div").css({ "margin-bottom": "12px" });
                        }
                        this.argControls.push(firstTab ? { controlType: "tab", inputControl: currentTabPanel } : null);
                        var $tabPanel = currentTabPanel.addTab(arg.label, firstTab);
                        this.layoutArguments(cmd, arg.children, new ServerCmdArgFlags(arg.flags), metrics, $tabPanel);
                    }
                    else {
                        var $inputContainer;
                        var argFlags = new ServerCmdArgFlags(arg.flags);
                        if (argFlags.colSpan > 1)
                            col = 0;
                        if (col == 0)
                            $row = $("<div class='form-group form-group-sm'>").appendTo($form);
                        col = (col + 1) % flags.numColumns;
                        if (arg.type == "panel") {
                            this.argControls.push(null);
                            var $panel = $("<div class='col-sm-" + colWidth + "'>").appendTo($row);
                            $row.removeClass("form-group-sm");
                            this.layoutArguments(cmd, arg.children, new ServerCmdArgFlags(arg.flags), metrics, $panel);
                        }
                        else {
                            if ((arg.label == null) || (arg.type == "label") || ((arg.type == "html") && (arg.initialValue == null))) {
                                // no label or type label means span the component over complete column
                                var spannedWidth = argFlags.colWidth || colWidth;
                                if (argFlags.colSpan > 1) {
                                    spannedWidth += colWidth * (argFlags.colSpan - 1);
                                }
                                $inputContainer = $("<div class='col-sm-" + spannedWidth + "'></div>").appendTo($row);
                            }
                            else {
                                // normal case: label and a widget (plus the case where there's no widget and we span label over two columns)
                                var spannedWidth = argFlags.inputWidth || inputWidth;
                                if (argFlags.colSpan > 1) {
                                    spannedWidth += colWidth * (argFlags.colSpan - 1);
                                }
                                $("<label for='cmdarg_" + i + "' class='col-sm-" + (argFlags.labelWidth || labelWidth) + " control-label'>" + HtmlUtil.escapeHtml(arg.label) + "</label>").appendTo($row);
                                $inputContainer = $("<div class='col-sm-" + spannedWidth + "'>").appendTo($row);
                            }
                            if (arg.type == "row") {
                                this.argControls.push(null);
                                if (arg.children != null) {
                                    var $input_group = $("<div class='inline-form-controls'>").appendTo($inputContainer);
                                    arg.children.forEach(function (child) {
                                        if (child.label && (child.type != "checkbox")) {
                                            $("<label>" + HtmlUtil.escapeHtml(child.label) + "</label>").appendTo($input_group);
                                        }
                                        var childControl = _this.createArgumentControl(cmd, child, new ServerCmdArgFlags(child.flags), metrics, $input_group);
                                        _this.argControls.push(childControl);
                                        if (child.name)
                                            _this.argLookup[child.name] = childControl;
                                    });
                                }
                            }
                            else {
                                var argumentControl = this.createArgumentControl(cmd, arg, argFlags, metrics, $inputContainer);
                                // Adjust row class for multi-line controls
                                if (argumentControl && (argumentControl.controlType == "listBox" || argumentControl.controlType == "textarea")) {
                                    $row.removeClass("form-group-sm");
                                }
                                this.argControls.push(argumentControl);
                                if (arg.name)
                                    this.argLookup[arg.name] = argumentControl;
                            }
                        }
                    }
                }
            };
            ArgumentFormPanel.prototype.createArgumentControl = function (cmd, arg, flags, metrics, $parent) {
                var _this = this;
                if (((arg.type == "list") || (arg.type == "combo") || (arg.type == "autolist")) && arg.options) {
                    var dataSource = new SimpleArrayDataSource(arg.options.map(function (option) {
                        return {
                            value: option,
                            text: option,
                            isSelected: option == arg.initialValue
                        };
                    }));
                    var dropDownList = ComboBox.create({ "class": "form-control input-sm", "width": "100%" }, dataSource, true, false, $parent);
                    if ((arg.type == "autolist") || flags.raiseEvents) {
                        dropDownList.onChanged(function (evt) {
                            if (_this.argumentForm.isLegacyCommandArguments) {
                                var argValues = _this.readArgumentValues(arg.label);
                                if (_this.submitHandler) {
                                    _this.submitHandler(arg.label || "", argValues);
                                }
                            }
                            else {
                                _this.raiseEvent(cmd, arg.name);
                            }
                            return false;
                        });
                    }
                    return { controlType: "dropDownList", inputControl: dropDownList };
                }
                else if ((arg.type == "multiselect") && arg.options != null) {
                    // multi row, multi select
                    var listBox = ListBox.create({ "class": "form-control", "multiselect": true }, $parent);
                    arg.options.forEach(function (option) {
                        listBox.addItem({
                            value: option,
                            text: option,
                            isSelected: option == arg.initialValue
                        });
                    });
                    if (flags.raiseEvents) {
                        listBox.onChanged(function (evt) {
                            _this.raiseEvent(cmd, arg.name);
                        });
                    }
                    return { controlType: "listBox", inputControl: listBox };
                }
                else if (arg.type == "label") {
                    var label = Label.create({}, $parent);
                    label.setText(arg.label);
                    return { controlType: "label", inputControl: label };
                }
                else if (arg.type == "html") {
                    $parent.html(arg.initialValue || arg.label);
                    return null;
                }
                else if ((arg.type == "radio") && arg.options != null) {
                    var radioButtonSet = RadioButtonSet.create("rdoArg" + this.argControls.length, arg.options, {}, $parent);
                    radioButtonSet.setValue(arg.initialValue);
                    if (flags.raiseEvents) {
                        radioButtonSet.onChanged(function (evt) {
                            _this.raiseEvent(cmd, arg.name + "." + radioButtonSet.getValue());
                        });
                    }
                    return { controlType: "radiobuttons", inputControl: radioButtonSet };
                }
                else if ((arg.type == "checkbox") && arg.options != null) {
                    var checkboxes = MultiCheckBoxes.create("chkArg" + this.argControls.length, arg.options, {}, $parent);
                    checkboxes.setValues(arg.initialValue ? arg.initialValue.split(",") : []);
                    if (flags.raiseEvents) {
                        checkboxes.onChanged(function (evt) {
                            _this.raiseEvent(cmd, arg.name);
                        });
                    }
                    return { controlType: "checkboxes", inputControl: checkboxes };
                }
                else if (arg.type == "checkbox") {
                    var $label = $("<label class='checkbox-inline'>").appendTo($parent);
                    var checkbox = CheckBox.create({}, $label);
                    $(document.createTextNode(arg.label)).appendTo($label);
                    checkbox.setChecked((arg.initialValue != null) && (arg.initialValue == "1"));
                    if (flags.raiseEvents) {
                        checkbox.onChanged(function (evt) {
                            _this.raiseEvent(cmd, arg.name);
                        });
                    }
                    return { controlType: "checkbox", inputControl: checkbox };
                }
                else if (arg.type == "password") {
                    var text = TextBox.create({ "type": "password", "class": "form-control input-sm" }, $parent);
                    text.setText(arg.initialValue);
                    return { controlType: "textbox", inputControl: text };
                }
                else if ((arg.type == "multilist") && arg.options != null) {
                    var listDataSource = new SimpleArrayDataSource(arg.options.map(function (i) { return { text: i, value: i }; }));
                    var multilist = MultiSelectDropDownList.create({ "class": "form-control", "width": "100%" }, true, listDataSource, $parent);
                    multilist.setSelectedValues(arg.initialValue ? arg.initialValue.split("\n") : []);
                    return { controlType: "multilist", inputControl: multilist, "dataSource": listDataSource };
                }
                else if (arg.type == "multiline") {
                    var textarea = TextArea.create({ "class": "form-control", "rows": 4, "width": "20em" }, $parent);
                    textarea.setText(arg.initialValue);
                    textarea.setReadOnly(flags.readonly);
                    return { controlType: "textarea", inputControl: textarea };
                }
                else if ((arg.type == "datatable") && arg.options) {
                    var columns = arg.options.map(function (columnName, i) {
                        var column = {
                            title: columnName,
                            dataProp: "" + i,
                            isSortable: true,
                            renderer: (flags.hierarchical && i == 0) ? function (obj, val, row) { return _this.renderHierarchyColumn(obj, val, row); } : null
                        };
                        return column;
                    });
                    var gridDataSource = new SimpleArrayDataSource(arg.data.map(function (d, i) { d["index"] = i; return d; }));
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
                    if (flags.raiseEvents) {
                        dataTable.onSelectionChanged(function (evt) {
                            _this.raiseEvent(cmd, arg.name);
                        });
                    }
                    if (flags.hierarchical) {
                        dataTable.onItemClicked(function (evt) {
                            var rowIndexAttr = evt.srcElement.attributes["row-index"];
                            if (rowIndexAttr) {
                                var rowIndex = rowIndexAttr.nodeValue;
                                _this.raiseEvent(cmd, arg.name + ".discloser." + rowIndex);
                            }
                        });
                    }
                    return { "controlType": "datatable", "inputControl": dataTable, "dataSource": gridDataSource };
                }
                else if (arg.type == "progress") {
                    var progressBar = ProgressBar.create($parent);
                    progressBar.setPercentage(Number(arg.initialValue));
                    return { controlType: "progress", inputControl: progressBar };
                }
                else if ((arg.type == "buttons") && arg.options) {
                    var buttonOptions = { "class": "btn btn-sm btn-primary" };
                    if (flags.vertical) {
                        buttonOptions["style"] = "display: block; margin-bottom: 6px; width: 100px;";
                    }
                    else {
                        buttonOptions["style"] = "margin-right: 6px;";
                    }
                    arg.options.forEach(function (buttonText) {
                        var button = Button.create(buttonText, buttonOptions, $parent);
                        button.onClick(function (evt) {
                            _this.raiseEvent(cmd, (arg.name ? arg.name + "." : "") + buttonText);
                            return false;
                        });
                    });
                    return null;
                }
                else {
                    var textbox = TextBox.create({ "class": "form-control input-sm", "width": "20em" }, $parent);
                    textbox.setText(arg.initialValue);
                    textbox.setReadOnly(flags.readonly);
                    return { controlType: "textbox", inputControl: textbox };
                }
            };
            ArgumentFormPanel.prototype.renderHierarchyColumn = function (obj, value, row) {
                var indent = 0;
                while (value.startsWith("|")) {
                    value = value.substring(1);
                    indent++;
                }
                var html = (indent > 0) ? "<span style='padding-left:" + (12 * indent) + "px'>" : "";
                if (value.startsWith("[+]")) {
                    value = value.substring(3);
                    html += "<span class='glyphicon glyphicon-play discloser' row-index='" + row + "'> </span> ";
                }
                else if (value.startsWith("[-]")) {
                    value = value.substring(3);
                    html += "<span class='glyphicon glyphicon-play discloser glyph-rotate-90' row-index='" + row + "'> </span> ";
                }
                else {
                    html += "<span class='glyphicon glyphicon-play discloser' style='visibility: hidden;'> </span> ";
                }
                if (indent > 0)
                    html += "</span> ";
                html += value;
                return html;
            };
            ArgumentFormPanel.prototype.raiseEvent = function (cmd, event) {
                var _this = this;
                var argValues = this.readArgumentValues(event);
                ServerCommandManager.processEvent(cmd, event, argValues, function (updates) {
                    if (updates) {
                        _this.updateForm(updates.items);
                    }
                });
            };
            return ArgumentFormPanel;
        }(Panel));
        panels.ArgumentFormPanel = ArgumentFormPanel;
    })(panels = ui.panels || (ui.panels = {}));
})(ui || (ui = {}));
