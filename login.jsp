<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib uri="/WEB-INF/catdv.tld" prefix="catdv"%>
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>CatDV: Login</title>
<catdv:pageheader >
<%@include file="headers.inc"%>
<script type="text/javascript" src="js/lib/rsa.js"></script>
<script type="text/javascript">

    $(document).ready(function()
    {
    	if($.urlParam("cause") == "BUSY")
   		{
    		showBusyMessage();
   		}
    	else
   		{
	   		$("#btnSignIn").click(btnSignIn_onclick);
	   		
	        $(document).keyup(function(event)
	        {
	            if (event.keyCode == 13)
	            {
	                $("#btnSignIn").click();
	            }
	        });
	        
	        $("input[name='txtUsername']").val($.cookie("saved_login_username"));
            $("input[name='chkRememberMe']").prop("checked", ($.cookie("saved_remember_me") == "true"));
	    }
    });

    function btnSignIn_onclick()
    {
    	var $catdv = catdv.RestApi;

    	$catdv.getSessionKey(function(reply)
        {
            try
            {
                var username = $("input[name='txtUsername']").val();
                var password = $("input[name='txtPassword']").val();
                var encryptedPassword = encrypt(password, reply.key);

                $catdv.login(username, encryptedPassword, 
               		function()
	                {
	                    $.cookie("username", username);
	                    var rememberMe = $("input[name='chkRememberMe']").prop("checked") ? true : false;
                        $.cookie("saved_login_username", rememberMe ? username : null, { expires: 90 });
                        $.cookie("saved_remember_me", rememberMe ? "true" : "false", { expires: 90 });
	                    var fwd = $.urlParam("fwd");
	                    window.location.replace(fwd ? fwd : "default.jsp");
	                },
	                function(status, errorMessage)
	                {
	                	if(status == "BUSY")
	                	{
	                		showBusyMessage();
	                	}
	                	else
	                	{
	                		$("#lblError").text("Incorrect user name or password").show();
	                	}
	                }
                );
            }
            catch (e)
            {
                alert(e);
            }
        });
    }
    
    function showBusyMessage()
    {
        $("#lblHeading").text("Server Busy");
        $("#lblMessage").html("<h2>Sorry - too many people are currently using the server. <br/><br/>Please try again later.</h2>");
        $("#loginForm").hide();
        $("#lblError").hide();
    }
</script>
</catdv:pageheader>
</head>
<body>
	<div id="loginPage">
	    <header>
	        <div id="logo"></div>
	    </header>
	    <div class="container">
	        <div class="row">
	            <div class="col-md-6 col-md-offset-3">
					<div class="panel panel-default">
						<div class="panel-body">
	  	  				  <h1 id="lblHeading">Log In</h1>
	  	  				  <p id="lblMessage">Please log in to search your CatDV Server assets.</p>
                            <div id="lblError" class="alert alert-danger" role="alert" style="display:none;"></div>
	  	  					<form id="loginForm" class="form form-horizontal" role="form">
	  	  					  <div class="form-group">
	  	  					    <label for="txtUsername" class="col-sm-2 control-label">Username</label>
	  	  					    <div class="col-sm-10">
	  	  					      <input type="text" class="form-control" name="txtUsername" placeholder="User name">
	  	  					    </div>
	  	  					  </div>
	  	  					  <div class="form-group">
	  	  					    <label for="txtPassword" class="col-sm-2 control-label">Password</label>
	  	  					    <div class="col-sm-10">
	  	  					      <input type="password" class="form-control" name="txtPassword" placeholder="Password">
	  	  					    </div>
	  	  					  </div>
							  <div class="form-group">
							    <div class="col-sm-offset-2 col-sm-10">
							      <div class="checkbox-inline" style="padding-top: 0px;">
							        <label> <input type="checkbox" name="chkRememberMe"> Remember me on this machine.</label>
							      </div>
							    </div>
							  </div>
	  	  					  <div class="form-group">
	  	  					    <div class="col-sm-offset-2 col-sm-10">
	  	  					      <button type="button" class="btn btn-primary" id="btnSignIn">Sign in</button>
	  	  					    </div>
	  	  					  </div>
	  	  					</form>
						</div>			  
					</div>
	            </div>
	        </div>
	    </div>
	    <div id="version-info">
	       <catdv:get path="info">${info.version}</catdv:get>
	    </div>
	</div>
</body>
</html>