var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var ui;
(function (ui) {
    var Console = controls.Console;
    var Button = controls.Button;
    var Label = controls.Label;
    var Modal = controls.Modal;
    var Timer = controls.Timer;
    var ServerCommandManager = logic.ServerCommandManager;
    var ArgumentFormPanel = ui.panels.ArgumentFormPanel;
    var ServCmdArgFlags = ui.panels.ServerCmdArgFlags;
    var ServerCommandDialog = (function (_super) {
        __extends(ServerCommandDialog, _super);
        function ServerCommandDialog(element) {
            _super.call(this, element);
            this.lblTitle = new Label("svrCmdArgsDlg_lblTitle");
            this.argumentFormPanel = new ArgumentFormPanel("svrCmdArgsDlg_divArguments");
            this.$buttonPanel = $("#svrCmdArgsDlg_buttonPanel");
            this.cancelTimer = false;
        }
        ServerCommandDialog.prototype.setCommand = function (cmd, argumentForm) {
            var _this = this;
            var nameParts = cmd.name.split("|");
            if (nameParts.length > 1) {
                this.lblTitle.$element.html("<span class='glyphicon glyphicon-" + nameParts[0] + "'></span> " + nameParts[1]);
            }
            else {
                this.lblTitle.setText(cmd.name);
            }
            var flags = new ServCmdArgFlags(argumentForm.flags);
            if (flags.resizable || (flags.initialSize && flags.initialSize.width > 320)) {
                $("#serverCommandArgsDialog div").addClass("modal-lg");
            }
            else {
                $("#serverCommandArgsDialog div").removeClass("modal-lg");
            }
            this.argumentFormPanel.setCommand(cmd, argumentForm);
            this.argumentFormPanel.onSubmit(function (evt, args) {
                _this.close(true, cmd, evt || "", args);
            });
            // Either default OK/Cancel buttons or override by specifying a final argument of type "submit"
            this.$buttonPanel.empty();
            var submitBtns = this.argumentFormPanel.getSubmitButtons() || ["OK", "Cancel"];
            submitBtns.forEach(function (submitButtonText, i) {
                var submitButton;
                if (submitButtonText == "Cancel") {
                    submitButton = Button.create(submitButtonText, { "class": "btn btn-sm btn-primary", "data-dismiss": "modal" }, _this.$buttonPanel);
                }
                else {
                    submitButton = Button.create(submitButtonText, { "class": "btn btn-sm btn-primary" }, _this.$buttonPanel);
                    submitButton.onClick(function (evt) {
                        var argValues = _this.argumentFormPanel.readArgumentValues(submitButtonText);
                        _this.close(true, cmd, submitButtonText || "", argValues);
                    });
                }
            });
            if (flags.refresh) {
                this.pollServer(cmd, flags.refresh);
            }
        };
        // Override Modal.closed()
        ServerCommandDialog.prototype.closed = function () {
            this.cancelTimer = true;
        };
        // If ArgumentForm set refresh:millis option then periodically raise REFRESH event until dialog is closed
        ServerCommandDialog.prototype.pollServer = function (cmd, refreshInterval) {
            var _this = this;
            Console.debug("pollServer()");
            this.cancelTimer = false;
            Timer.defer(refreshInterval, function () {
                if (!_this.cancelTimer) {
                    Console.debug("pollServer() - ok");
                    var argValues = _this.argumentFormPanel.readArgumentValues("REFRESH");
                    ServerCommandManager.processEvent(cmd, "REFRESH", argValues, function (updates) {
                        if (updates) {
                            _this.argumentFormPanel.updateForm(updates.items);
                            _this.pollServer(cmd, refreshInterval);
                        }
                        else {
                            _this.close(true, cmd, "REFRESH", argValues);
                        }
                    });
                }
                else {
                    Console.debug("pollServer() - cancelled");
                }
            });
        };
        return ServerCommandDialog;
    }(Modal));
    ui.ServerCommandDialog = ServerCommandDialog;
})(ui || (ui = {}));
