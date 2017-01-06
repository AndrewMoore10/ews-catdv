var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var ui;
(function (ui) {
    var panels;
    (function (panels) {
        var Element = controls.Element;
        var TextBox = controls.TextBox;
        var Button = controls.Button;
        var Alert = controls.Alert;
        var Modal = controls.Modal;
        var $catdv = catdv.RestApi;
        var NavbarLoginMenu = (function (_super) {
            __extends(NavbarLoginMenu, _super);
            // element is empty <ul> in Bootrap-style NavBar 
            function NavbarLoginMenu(element) {
                var _this = this;
                _super.call(this, element);
                var scriptIncludeUrl = $("script[src*='RestApi.js']").get(0).src;
                var baseUrl = scriptIncludeUrl.substring(0, scriptIncludeUrl.indexOf("js/"));
                this.$element.html("<li id='loginLink'><a href='#'>Login</a></li>" +
                    "<li id='userMenu' class='dropdown' style='display:none;'>" +
                    "  <a href='#'class='dropdown-toggle' data-toggle='dropdown'>" +
                    "    <span id='loggedInUser'>User Name</span><strong class='catdvicon catdvicon-pulldown_arrow'></strong>" +
                    "  </a>" +
                    "  <ul class='dropdown-menu'>" +
                    "      <li id='user-changePassword'><a href='#' id='changePasswordLink'>Change Password</a></li>" +
                    "      <li id='user-logOut'><a href='#' id='logoutLink'>Log out</a></li>" +
                    "   </ul>" +
                    "</li>");
                $("#loginLink").on("click", function (evt) { window.location.href = (baseUrl + "login.jsp"); });
                $("#logoutLink").on("click", function (evt) {
                    $.cookie("username", null);
                    catdv.loggedInUser = null;
                    $catdv.logout(function (reply) {
                        window.location.href = baseUrl + "default.jsp";
                    });
                });
                $("#changePasswordLink").on("click", function (evt) { return _this.showChangePasswordDialog(); });
                if (catdv.loggedInUser) {
                    $("#loggedInUser").text(catdv.loggedInUser);
                    $("#loginLink").hide();
                    $("#userMenu").show();
                    if (catdv.loggedInUser.contains("@")) {
                        $("#user-changePassword").hide();
                    }
                    else {
                        $("#user-changePassword").show();
                    }
                }
                else {
                    $("#loginLink").show();
                    $("#userMenu").hide();
                }
            }
            NavbarLoginMenu.prototype.showChangePasswordDialog = function () {
                new ChangePasswordDialog().show();
            };
            return NavbarLoginMenu;
        }(Element));
        panels.NavbarLoginMenu = NavbarLoginMenu;
        var ChangePasswordDialog = (function (_super) {
            __extends(ChangePasswordDialog, _super);
            function ChangePasswordDialog() {
                var _this = this;
                _super.call(this, ChangePasswordDialog.createDiv());
                this.lblName = new TextBox("change_password_lblName");
                this.txtPassword1 = new TextBox("change_password_txtNewPassword1");
                this.txtPassword2 = new TextBox("change_password_txtNewPassword2");
                this.btnChangePasswordOK = new Button("change_password_okButton");
                this.btnChangePasswordCancel = new Button("change_password_cancelButton");
                this.alertPasswordMismatch = new Alert("change_password_alertNewPasswordMismatch");
                this.userID = catdv.loggedInUserID;
                this.userName = catdv.loggedInUser;
                this.btnChangePasswordOK.onClick(function (evt) {
                    _this.alertPasswordMismatch.hide();
                    if (_this.txtPassword1.getText() != _this.txtPassword2.getText()) {
                        _this.alertPasswordMismatch.show();
                    }
                    else {
                        var user = {
                            ID: _this.userID,
                            password: _this.txtPassword1.getText(),
                        };
                        $catdv.updateUser(user, function () {
                            _this.close(true);
                        });
                    }
                });
                this.btnChangePasswordCancel.onClick(function (evt) {
                    _this.close(false);
                });
            }
            ChangePasswordDialog.createDiv = function () {
                $("#change_password_dialog").remove();
                var html = "<div id='change_password_dialog' style='display: none;' class='modal fade'>";
                html += "  <div class='modal-dialog'>";
                html += "    <div class='modal-content'>";
                html += "      <div class='modal-header'>";
                html += "        <h4 class='modal-title'>Change Password for '" + catdv.loggedInUser + "'</h4>";
                html += "      </div>";
                html += "      <div class='modal-body'>";
                html += "        <div id='change_password_alertNewPasswordMismatch' class='alert alert-danger hide'>";
                html += "          <strong>Error!</strong> Passwords do not match.";
                html += "        </div>";
                html += "        <div class='form-group'>";
                html += "          <label for='change_password_txtNewPassword1'>Password:</label> <input";
                html += "             id='change_password_txtNewPassword1' type='password' class='form-control input-sm'>";
                html += "         </div>";
                html += "         <div class='form-group'>";
                html += "           <label for='change_password_txtNewPassword2'>Confirm Password:</label> <input";
                html += "                id='change_password_txtNewPassword2' type='password' class='form-control input-sm'>";
                html += "        </div>";
                html += "      </div>";
                html += "      <div class='modal-footer'>";
                html += "        <button id='change_password_cancelButton' class='btn btn-sm btn-primary'>Cancel</button>";
                html += "        <button id='change_password_okButton' class='btn btn-sm btn-primary'>OK</button>";
                html += "      </div>";
                html += "    </div>";
                html += "  </div>";
                html += "</div>";
                return $(html).appendTo($("body"));
            };
            return ChangePasswordDialog;
        }(Modal));
    })(panels = ui.panels || (ui.panels = {}));
})(ui || (ui = {}));
