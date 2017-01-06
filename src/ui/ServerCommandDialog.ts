module ui
{
    import Console = controls.Console;
    import Button = controls.Button;
    import Label = controls.Label;
    import Modal = controls.Modal;
    import Timer = controls.Timer;

    import $catdv = catdv.RestApi;
    import Clip = catdv.Clip;
    import ServerCommand = catdv.ServerCommand;
    import ArgumentForm = catdv.ArgumentForm;
    import CommandArgument = catdv.CommandArgument;
    import CommandParams = catdv.CommandParams;
    import CommandResults = catdv.CommandResults;
    import QueryDefinition = catdv.QueryDefinition;

    import ServerCommandManager = logic.ServerCommandManager;
    import ArgumentFormPanel = ui.panels.ArgumentFormPanel;
    import ServCmdArgFlags = ui.panels.ServerCmdArgFlags;

    export class ServerCommandDialog extends Modal
    {
        private lblTitle = new Label("svrCmdArgsDlg_lblTitle");
        private argumentFormPanel = new ArgumentFormPanel("svrCmdArgsDlg_divArguments");
        private $buttonPanel = $("#svrCmdArgsDlg_buttonPanel");
        private cancelTimer = false;
      
        constructor(element: any)
        {
            super(element);
        }

        public setCommand(cmd: ServerCommand, argumentForm: ArgumentForm)
        {
            var nameParts = cmd.name.split("|");
            if (nameParts.length > 1)
            {
                this.lblTitle.$element.html("<span class='glyphicon glyphicon-" + nameParts[0] + "'></span> " + nameParts[1]);
            }
            else
            {
                this.lblTitle.setText(cmd.name);
            }

            var flags = new ServCmdArgFlags(argumentForm.flags);

            if (flags.resizable || (flags.initialSize && flags.initialSize.width > 320))
            {
                $("#serverCommandArgsDialog div").addClass("modal-lg");
            }
            else
            {
                $("#serverCommandArgsDialog div").removeClass("modal-lg");
            }
            
            this.argumentFormPanel.setCommand(cmd, argumentForm);
            this.argumentFormPanel.onSubmit((evt: string, args : string[]) =>
            {
                 this.close(true, cmd, evt || "", args);
            });

            // Either default OK/Cancel buttons or override by specifying a final argument of type "submit"
            this.$buttonPanel.empty();
            var submitBtns = this.argumentFormPanel.getSubmitButtons() || ["OK", "Cancel"];
            submitBtns.forEach((submitButtonText, i) =>
            {
                var submitButton
                if (submitButtonText == "Cancel")
                {
                    submitButton = Button.create(submitButtonText, { "class": "btn btn-sm btn-primary", "data-dismiss": "modal" }, this.$buttonPanel);
                }
                else
                {
                    submitButton = Button.create(submitButtonText, { "class": "btn btn-sm btn-primary" }, this.$buttonPanel);
                    submitButton.onClick((evt) =>
                    {
                        var argValues = this.argumentFormPanel.readArgumentValues(submitButtonText);
                        this.close(true, cmd, submitButtonText || "", argValues);
                    });
                }
            });

            if (flags.refresh)
            {
                this.pollServer(cmd, flags.refresh);
            }
        }

        // Override Modal.closed()
        public closed()
        {
            this.cancelTimer = true;
        }

        // If ArgumentForm set refresh:millis option then periodically raise REFRESH event until dialog is closed
        private pollServer(cmd: ServerCommand, refreshInterval: number)
        {
            Console.debug("pollServer()");
            this.cancelTimer = false;
            Timer.defer(refreshInterval, () =>
            {
                if (!this.cancelTimer)
                {
                    Console.debug("pollServer() - ok");
                    var argValues = this.argumentFormPanel.readArgumentValues("REFRESH");
                    ServerCommandManager.processEvent(cmd, "REFRESH", argValues, (updates) =>
                    {
                        if (updates)
                        {
                            this.argumentFormPanel.updateForm(updates.items);
                            this.pollServer(cmd, refreshInterval);
                        }
                        else
                        {
                            this.close(true, cmd, "REFRESH", argValues);
                        }
                    });
                }
                else
                {
                    Console.debug("pollServer() - cancelled");
                }
            });
        }

       
    }
}

