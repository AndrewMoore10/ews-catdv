module ui.panels
{
    import Element = controls.Element;
    import TextBox = controls.TextBox;
    import Button = controls.Button;
    import Alert = controls.Alert;
    import Modal = controls.Modal;
     
    import $catdv = catdv.RestApi;

    export class NavbarLoginMenu extends Element
    {
        // element is empty <ul> in Bootrap-style NavBar 
        constructor(element)
        {
            super(element);

            var scriptIncludeUrl:string = (<any>$("script[src*='RestApi.js']").get(0)).src;
            var baseUrl = scriptIncludeUrl.substring(0, scriptIncludeUrl.indexOf("js/"));

            this.$element.html(
                "<li id='loginLink'><a href='#'>Login</a></li>" +
                "<li id='userMenu' class='dropdown' style='display:none;'>" +
                "  <a href='#'class='dropdown-toggle' data-toggle='dropdown'>" +
                "    <span id='loggedInUser'>User Name</span><strong class='catdvicon catdvicon-pulldown_arrow'></strong>" +
                "  </a>" +
                "  <ul class='dropdown-menu'>" +
                "      <li id='user-changePassword'><a href='#' id='changePasswordLink'>Change Password</a></li>" +
                "      <li id='user-logOut'><a href='#' id='logoutLink'>Log out</a></li>" +
                "   </ul>" +
                "</li>"
                );

            $("#loginLink").on("click", (evt) => { window.location.href = (baseUrl + "login.jsp"); });
            $("#logoutLink").on("click", (evt) =>
            {
                $.cookie("username", null);
                catdv.loggedInUser = null;
                $catdv.logout(function(reply)
                {
                    window.location.href = baseUrl + "default.jsp";
                });
            });
            $("#changePasswordLink").on("click", (evt) => this.showChangePasswordDialog());
  
            if (catdv.loggedInUser)
            {
                $("#loggedInUser").text(catdv.loggedInUser);
                $("#loginLink").hide();
                $("#userMenu").show();
                if (catdv.loggedInUser.contains("@"))
                {
                    $("#user-changePassword").hide();
                }
                else
                {
                    $("#user-changePassword").show();
                }
            }
            else
            {
                $("#loginLink").show();
                $("#userMenu").hide();
            }
        }
        
        private showChangePasswordDialog()
        {
             new ChangePasswordDialog().show();
        }
    }
    
    class ChangePasswordDialog extends Modal
    {
        private lblName: TextBox = new TextBox("change_password_lblName");
        private txtPassword1: TextBox = new TextBox("change_password_txtNewPassword1");
        private txtPassword2: TextBox = new TextBox("change_password_txtNewPassword2");

        private btnChangePasswordOK: Button = new Button("change_password_okButton");
        private btnChangePasswordCancel: Button = new Button("change_password_cancelButton");
        private alertPasswordMismatch: Alert = new Alert("change_password_alertNewPasswordMismatch");

        private userID: number;
        private userName: string;

        constructor()
        {
            super(ChangePasswordDialog.createDiv());
            
            this.userID = catdv.loggedInUserID;
            this.userName = catdv.loggedInUser;
            
            this.btnChangePasswordOK.onClick((evt: any) =>
            {
                this.alertPasswordMismatch.hide();

                if (this.txtPassword1.getText() != this.txtPassword2.getText())
                {
                    this.alertPasswordMismatch.show();
                }
                else
                {
                    var user =
                        {
                            ID: this.userID,
                            password: this.txtPassword1.getText(),
                        };

                    $catdv.updateUser(user, () =>
                    {
                        this.close(true);
                    });
                }
            });
            this.btnChangePasswordCancel.onClick((evt: any) =>
            {
                this.close(false);
            });
        }

        private static createDiv(): JQuery
        {
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
        }
    }
}