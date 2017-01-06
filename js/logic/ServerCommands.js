var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var logic;
(function (logic) {
    var HtmlUtil = util.HtmlUtil;
    var Control = controls.Control;
    var Timer = controls.Timer;
    var MessageBox = controls.MessageBox;
    var $catdv = catdv.RestApi;
    // TODO: not really the right place for this
    var ServerCommandMenu = (function (_super) {
        __extends(ServerCommandMenu, _super);
        function ServerCommandMenu(element) {
            _super.call(this, element);
            this.$menu = this.$element.find("ul");
        }
        ServerCommandMenu.prototype.onClick = function (clickHandler) {
            var _this = this;
            ServerCommandManager.getCommands(function (commands) {
                if (commands && commands.length > 0)
                    _this.show(true);
                commands.forEach(function (command) {
                    var $menuItem = $("<li" + (command.requiresClip ? " class='item-action disabled'" : "") + "><a href='#'>"
                        + HtmlUtil.escapeHtml(command.name) + "</a></li>").appendTo(_this.$menu);
                    $menuItem.on("click", function (evt) {
                        if ($menuItem.hasClass("disabled"))
                            return false;
                        clickHandler(command);
                    });
                });
            });
        };
        return ServerCommandMenu;
    }(Control));
    logic.ServerCommandMenu = ServerCommandMenu;
    /**
     * This class runs in the web client to interpret and execute the commands that are returned from a server plugin
     */
    var ServerCommandManager = (function () {
        function ServerCommandManager() {
        }
        /**
       * Get a list of server plugin commands to display in a drop down menu on the web client
       */
        ServerCommandManager.getCommands = function (callback) {
            if (ServerCommandManager.serverCommands == null) {
                $catdv.getServerCommands(function (commands) {
                    ServerCommandManager.serverCommands = commands;
                    callback(commands);
                });
            }
            else {
                callback(ServerCommandManager.serverCommands);
            }
        };
        /**
        * If present return the custom search command
        */
        ServerCommandManager.getCustomSearchCommand = function (callback) {
            ServerCommandManager.getCommands(function (commands) {
                var searchCommand = commands.find(function (cmd) { return cmd.ui == "search"; });
                if (searchCommand) {
                    ServerCommandManager.getArgumentForm(searchCommand, function (argumentForm) {
                        callback(searchCommand, argumentForm);
                    });
                }
                else {
                    callback(null, null);
                }
            });
        };
        // User has selected a command from the drop down so perform it
        ServerCommandManager.getCommand = function (commandId) {
            return ServerCommandManager.serverCommands.find(function (command) { return command.id == commandId; });
        };
        // Performing a command either involves displaying a input dialog that prompts the user to enter some data
        // to be submitted to the server or immediately executing the command on the server if it has no args.
        ServerCommandManager.performCommand = function (cmd, clipIDs, callback) {
            if (cmd == null) {
                alert("null command");
            }
            else if (cmd.arguments != null && cmd.arguments.length > 0) {
                ServerCommandManager.showArgumentForm(cmd, { items: cmd.arguments, isLegacyCommandArguments: true }, clipIDs, callback);
            }
            else {
                ServerCommandManager.getArgumentForm(cmd, function (argumentForm) {
                    if (argumentForm == null) {
                        ServerCommandManager.executeCommand(cmd, "", clipIDs, null, callback);
                    }
                    else if (argumentForm.errorMessage) {
                        var dlg = new MessageBox(argumentForm.errorMessage, "Error", MessageBox.BUTTONS_OK);
                        dlg.show();
                    }
                    else {
                        ServerCommandManager.showArgumentForm(cmd, argumentForm, clipIDs, callback);
                    }
                });
            }
        };
        ServerCommandManager.getArgumentForm = function (cmd, callback) {
            $catdv.getArgumentForm(cmd.id, cmd.name, function (argumentForm) {
                callback(argumentForm);
            });
        };
        ServerCommandManager.showArgumentForm = function (cmd, argumentForm, clipIDs, callback) {
            if (ServerCommandManager.serverCommandArgsDialog == null) {
                ServerCommandManager.serverCommandArgsDialog = new ui.ServerCommandDialog("serverCommandArgsDialog");
                ServerCommandManager.serverCommandArgsDialog.onOK(function (cmd, event, args) {
                    ServerCommandManager.executeCommand(cmd, event, clipIDs, args, callback);
                });
            }
            ServerCommandManager.serverCommandArgsDialog.setCommand(cmd, argumentForm);
            ServerCommandManager.serverCommandArgsDialog.show();
        };
        ServerCommandManager.processEvent = function (cmd, event, args, callback) {
            var params = {
                commandName: cmd.name,
                event: event,
                arguments: args
            };
            $catdv.processServerCommandEvent(cmd.id, params, function (updates) {
                if (!updates || updates.errorMessage == null) {
                    callback(updates);
                }
                else {
                    MessageBox.showMessage(updates.errorMessage, "Error");
                }
            });
        };
        // User has entered arguments (if appropriate) so now we're ready to submit the command to execute
        // on the server, and then interpret whatever response the server sends us.
        ServerCommandManager.executeCommand = function (cmd, event, clipIDs, args, callback) {
            var params = {
                commandName: cmd.name,
                event: event,
                clipIDs: clipIDs,
                arguments: args
            };
            $catdv.execServerCommand(cmd.id, params, function (result) {
                ServerCommandManager.processResults(cmd, clipIDs, result, callback);
            });
        };
        ServerCommandManager.processResults = function (cmd, selectedClipIDs, result, callback) {
            if (result.message != null) {
                // if we have a message, we need to show that before continuing, remembering that we have to use a callback
                var autoRefresh = result.resultMode == ServerCommandManager.RESULT_POLL_PROGRESS;
                var chainedCommand = result.resultMode == ServerCommandManager.RESULT_CHAIN_COMMAND;
                var mode = autoRefresh ? MessageBox.BUTTONS_CANCEL : chainedCommand ? MessageBox.BUTTONS_OK_CANCEL : MessageBox.BUTTONS_OK;
                var dlg = new MessageBox(result.message, cmd.name.substring(cmd.name.indexOf("|") + 1), mode);
                dlg.onOK(function () {
                    // we've dealt with the message now, so carry on and process the rest of the results
                    result.message = null;
                    ServerCommandManager.processResults(cmd, selectedClipIDs, result, callback);
                });
                dlg.show();
                if (autoRefresh) {
                    ServerCommandManager.pollServer(result.chainedCommand, dlg, callback);
                }
            }
            else if (result.resultMode == ServerCommandManager.RESULT_CHAIN_COMMAND) {
                ServerCommandManager.performCommand(result.chainedCommand, selectedClipIDs, callback);
            }
            else if ((result.resultMode == ServerCommandManager.RESULT_QUERY_RESULTS && result.clipIDs != null) ||
                (result.resultMode == ServerCommandManager.RESULT_SAVE_CHANGES) ||
                (result.resultMode == ServerCommandManager.RESULT_UPDATE_CLIPS)) {
                callback(result);
            }
        };
        ServerCommandManager.pollServer = function (cmd, progressDialog, callback) {
            Timer.defer(500, function () {
                $catdv.execServerCommand(cmd.id, { commandName: cmd.name }, function (result) {
                    if (result.resultMode == ServerCommandManager.RESULT_POLL_PROGRESS) {
                        progressDialog.updateMessage(result.message);
                        ServerCommandManager.pollServer(cmd, progressDialog, callback);
                    }
                    else {
                        progressDialog.close(false);
                        ServerCommandManager.processResults(cmd, null, result, callback);
                    }
                });
            });
        };
        // Values taken from squarebox.catdv.plugin.CommandResponse
        ServerCommandManager.RESULT_MESSAGE = 0; // don't return clips, display information message
        ServerCommandManager.RESULT_WARNING = 1; // display a warning message
        ServerCommandManager.RESULT_ERROR = 2; // display an error message
        ServerCommandManager.RESULT_QUERY_RESULTS = 3; // return existing server clips (as if it's a query result set)
        ServerCommandManager.RESULT_CHAIN_COMMAND = 4; // execute another command
        // Passing clips by value isn't supported so the following all just refresh the web client
        ServerCommandManager.RESULT_UPDATE_CLIPS = 5; // update the specified clips (passed by value)
        ServerCommandManager.RESULT_REPLACE_CLIPS = 6; // replace the old client selection with the new ones (passed by value)
        ServerCommandManager.RESULT_ADD_CLIPS = 7; // add new clips to the client window (passed by value)
        ServerCommandManager.RESULT_SAVE_CHANGES = 8; // clips were passed by reference so save changes on the server and get client to refresh window
        // Checkin/checkout isn't currently supported in web client
        ServerCommandManager.RESULT_UPLOAD_FILES = 9; // client should copy file for each clip to fileRoot then call chained command
        ServerCommandManager.RESULT_DOWNLOAD_FILES = 10; // client should copy files[] from fileRoot to local disk (optional chained command called on completion)
        ServerCommandManager.RESULT_DELETE_UPLOADED = 11; // after successful file upload the client can now delete the original files (if clips is non-null then
        // also implies RESULT_UPDATE_CLIPS, if chainCommand is not null implies RESULT_CHAIN_COMMAND).
        // This is implemented though...
        ServerCommandManager.RESULT_POLL_PROGRESS = 12; // automatically call the chained action after 5s (eg. display progress for long running operation) (V2 ONLY)  
        ServerCommandManager.serverCommands = null;
        ServerCommandManager.serverCommandArgsDialog = null;
        return ServerCommandManager;
    }());
    logic.ServerCommandManager = ServerCommandManager;
})(logic || (logic = {}));
