module logic
{
    import HtmlUtil = util.HtmlUtil;

    import Control = controls.Control;
    import Button = controls.Button;
    import TextBox = controls.TextBox;
    import TextArea = controls.TextArea;
    import DropDownList = controls.DropDownList;
    import ListBox = controls.ListBox;
    import CheckBox = controls.CheckBox;
    import RadioButtonSet = controls.RadioButtonSet;
    import MultiCheckBoxes = controls.MultiCheckBoxes;
    import Timer = controls.Timer;
    import MessageBox = controls.MessageBox;

    import $catdv = catdv.RestApi;
    import Clip = catdv.Clip;
    import ArgumentForm = catdv.ArgumentForm;
    import ServerCommand = catdv.ServerCommand;
    import CommandParams = catdv.CommandParams;
    import CommandResults = catdv.CommandResults;
    import QueryDefinition = catdv.QueryDefinition;

    interface ArgumentControl
    {
        controlType: string;
        inputControl: any;
    }

    // TODO: not really the right place for this
    export class ServerCommandMenu extends Control
    {
        private $menu: JQuery;

        constructor(element: any)
        {
            super(element);

            this.$menu = this.$element.find("ul");
        }

        public onClick(clickHandler: (command: ServerCommand) => void)
        {
            ServerCommandManager.getCommands((commands) =>
            {
                if (commands && commands.length > 0) this.show(true);
                commands.forEach((command) =>
                {
                    var $menuItem = $("<li" + (command.requiresClip ? " class='item-action disabled'" : "") + "><a href='#'>"
                        + HtmlUtil.escapeHtml(command.name) + "</a></li>").appendTo(this.$menu);
                    $menuItem.on("click", (evt) =>
                    {
                        if ($menuItem.hasClass("disabled")) return false;
                        clickHandler(command);
                    });
                });
            });
        }
    }

    /**
     * This class runs in the web client to interpret and execute the commands that are returned from a server plugin
     */
    export class ServerCommandManager
    {
        // Values taken from squarebox.catdv.plugin.CommandResponse
        public static RESULT_MESSAGE = 0;        // don't return clips, display information message
        public static RESULT_WARNING = 1;        // display a warning message
        public static RESULT_ERROR = 2;          // display an error message
        public static RESULT_QUERY_RESULTS = 3;  // return existing server clips (as if it's a query result set)
        public static RESULT_CHAIN_COMMAND = 4;  // execute another command
        // Passing clips by value isn't supported so the following all just refresh the web client
        public static RESULT_UPDATE_CLIPS = 5;   // update the specified clips (passed by value)
        public static RESULT_REPLACE_CLIPS = 6;  // replace the old client selection with the new ones (passed by value)
        public static RESULT_ADD_CLIPS = 7;      // add new clips to the client window (passed by value)
        public static RESULT_SAVE_CHANGES = 8;   // clips were passed by reference so save changes on the server and get client to refresh window
        // Checkin/checkout isn't currently supported in web client
        public static RESULT_UPLOAD_FILES = 9;     // client should copy file for each clip to fileRoot then call chained command
        public static RESULT_DOWNLOAD_FILES = 10;  // client should copy files[] from fileRoot to local disk (optional chained command called on completion)
        public static RESULT_DELETE_UPLOADED = 11; // after successful file upload the client can now delete the original files (if clips is non-null then
        // also implies RESULT_UPDATE_CLIPS, if chainCommand is not null implies RESULT_CHAIN_COMMAND).
        // This is implemented though...
        public static RESULT_POLL_PROGRESS = 12;   // automatically call the chained action after 5s (eg. display progress for long running operation) (V2 ONLY)  

        private static serverCommands: ServerCommand[] = null;

        private static serverCommandArgsDialog: ui.ServerCommandDialog = null;

        /**
       * Get a list of server plugin commands to display in a drop down menu on the web client
       */
        public static getCommands(callback: (commands: ServerCommand[]) => void)
        {
            if (ServerCommandManager.serverCommands == null)
            {
                $catdv.getServerCommands((commands) =>
                {
                    ServerCommandManager.serverCommands = commands;
                    callback(commands);
                });
            }
            else
            {
                callback(ServerCommandManager.serverCommands);
            }
        }
        
       /**
       * If present return the custom search command
       */
        public static getCustomSearchCommand(callback: (command: ServerCommand, argumentForm: ArgumentForm) => void) 
        {
            ServerCommandManager.getCommands((commands: ServerCommand[]) => 
            {
                var searchCommand = commands.find((cmd) => cmd.ui == "search");
                if (searchCommand)
                {
                    ServerCommandManager.getArgumentForm(searchCommand, (argumentForm: ArgumentForm) => 
                    {
                        callback(searchCommand, argumentForm);
                    });
                }
                else
                {
                    callback(null, null);
                }
            });
        }

        // User has selected a command from the drop down so perform it
        public static getCommand(commandId: number)
        {
            return ServerCommandManager.serverCommands.find((command) => command.id == commandId);
        }


        // Performing a command either involves displaying a input dialog that prompts the user to enter some data
        // to be submitted to the server or immediately executing the command on the server if it has no args.
        public static performCommand(cmd: ServerCommand, clipIDs: number[], callback: (result: CommandResults) => void)
        {
            if (cmd == null)
            {
                alert("null command");
            }
            else if (cmd.arguments != null && cmd.arguments.length > 0)
            {
                ServerCommandManager.showArgumentForm(cmd, { items: cmd.arguments, isLegacyCommandArguments : true }, clipIDs, callback);
            }
            else
            {
                ServerCommandManager.getArgumentForm(cmd, (argumentForm: ArgumentForm) => 
                {
                    if (argumentForm == null)
                    {
                        ServerCommandManager.executeCommand(cmd, "", clipIDs, null, callback);
                    }
                    else if (argumentForm.errorMessage)
                    {
                        var dlg = new MessageBox(argumentForm.errorMessage, "Error", MessageBox.BUTTONS_OK);
                        dlg.show();
                    }
                    else
                    {
                        ServerCommandManager.showArgumentForm(cmd, argumentForm, clipIDs, callback);
                    }
                });
            }
        }

        private static getArgumentForm(cmd: ServerCommand, callback: (argumentForm: ArgumentForm) => void)
        {
            $catdv.getArgumentForm(cmd.id, cmd.name, (argumentForm: ArgumentForm) =>
            {
                callback(argumentForm);
            });
        }

        private static showArgumentForm(cmd: ServerCommand, argumentForm: ArgumentForm, clipIDs: number[], callback: (result: CommandResults) => void)
        {
            if (ServerCommandManager.serverCommandArgsDialog == null)
            {
                ServerCommandManager.serverCommandArgsDialog = new ui.ServerCommandDialog("serverCommandArgsDialog");
                ServerCommandManager.serverCommandArgsDialog.onOK((cmd, event, args: string[]) =>
                {
                    ServerCommandManager.executeCommand(cmd, event, clipIDs, args, callback);
                });
            }
            ServerCommandManager.serverCommandArgsDialog.setCommand(cmd, argumentForm);
            ServerCommandManager.serverCommandArgsDialog.show();
        }

        public static processEvent(cmd: ServerCommand, event: string, args: string[], callback: (updates: ArgumentForm) => void)
        {
            var params: CommandParams = {
                commandName: cmd.name,
                event: event,
                arguments: args
            };

            $catdv.processServerCommandEvent(cmd.id, params, (updates: ArgumentForm) =>
            {
                if (!updates || updates.errorMessage == null)
                {
                    callback(updates);
                }
                else
                {
                    MessageBox.showMessage(updates.errorMessage, "Error");
                }
            });
        }

        // User has entered arguments (if appropriate) so now we're ready to submit the command to execute
        // on the server, and then interpret whatever response the server sends us.
        public static executeCommand(cmd: ServerCommand, event: string, clipIDs: number[], args: string[], callback: (result: CommandResults) => void)
        {
            var params: CommandParams = {
                commandName: cmd.name,
                event: event,
                clipIDs: clipIDs,
                arguments: args
            };

            $catdv.execServerCommand(cmd.id, params, (result: CommandResults) =>
            {
                ServerCommandManager.processResults(cmd, clipIDs, result, callback);
            });
        }

        private static processResults(cmd: ServerCommand, selectedClipIDs: number[], result: CommandResults, callback: (result: CommandResults) => void)
        {
            if (result.message != null)
            {
                // if we have a message, we need to show that before continuing, remembering that we have to use a callback
                var autoRefresh = result.resultMode == ServerCommandManager.RESULT_POLL_PROGRESS;
                var chainedCommand = result.resultMode == ServerCommandManager.RESULT_CHAIN_COMMAND;

                var mode = autoRefresh ? MessageBox.BUTTONS_CANCEL : chainedCommand ? MessageBox.BUTTONS_OK_CANCEL : MessageBox.BUTTONS_OK;

                var dlg = new MessageBox(result.message, cmd.name.substring(cmd.name.indexOf("|") + 1), mode);
                dlg.onOK(() =>
                {
                    // we've dealt with the message now, so carry on and process the rest of the results
                    result.message = null;
                    ServerCommandManager.processResults(cmd, selectedClipIDs, result, callback);
                });
                dlg.show();

                if (autoRefresh)
                {
                    ServerCommandManager.pollServer(result.chainedCommand, dlg, callback);
                }
            }
            else if (result.resultMode == ServerCommandManager.RESULT_CHAIN_COMMAND)
            {
                ServerCommandManager.performCommand(result.chainedCommand, selectedClipIDs, callback);
            }
            else if ((result.resultMode == ServerCommandManager.RESULT_QUERY_RESULTS && result.clipIDs != null) ||
                (result.resultMode == ServerCommandManager.RESULT_SAVE_CHANGES) ||
                (result.resultMode == ServerCommandManager.RESULT_UPDATE_CLIPS))
            {
                callback(result);
            }
        }

        private static pollServer(cmd: ServerCommand, progressDialog: MessageBox, callback: (result: CommandResults) => void)
        {
            Timer.defer(500, () => 
            {
                $catdv.execServerCommand(cmd.id, { commandName: cmd.name }, (result: CommandResults) =>
                {
                    if (result.resultMode == ServerCommandManager.RESULT_POLL_PROGRESS)
                    {
                        progressDialog.updateMessage(result.message);
                        ServerCommandManager.pollServer(cmd, progressDialog, callback);
                    }
                    else
                    {
                        progressDialog.close(false);
                        ServerCommandManager.processResults(cmd, null, result, callback);
                    }
                });
            });
        }

    }
}