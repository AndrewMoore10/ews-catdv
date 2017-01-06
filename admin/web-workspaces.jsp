<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib uri="/WEB-INF/catdv.tld" prefix="catdv"%>
<!DOCTYPE html>
<html class="fullPage" lang="en">
<head>
<meta charset="utf-8">
<title>CatDV: Admin</title>
<catdv:pageheader pageScript="../js/ui/admin/WebWorkspaces.js" pageClass="ui.admin.WebWorkspacesPage" loginPage="../login.jsp" requiresAdmin="true">
	<%@include file="headers.inc"%>
    <script type="text/javascript" src="../js/ui/admin/Visibility.js"></script>
    <script type="text/javascript">
var roleLookup = {
    <catdv:get path="roles">
     ${role.ID} : "${role.name}",
    </catdv:get>
};
    
var clientLookup = {
    <catdv:get path="info/clienttypes">
     ${clienttype.ID} : "${clienttype.name}",
    </catdv:get>
};
</script>
</catdv:pageheader>
</head>
<body class="adminListPage">
	<header>
		<%@include file="admin-nav.jsp"%>
	</header>
	<div class="content">
		<h1>Web Workspaces</h1>
		<div id="uiSettingsTable" class="adminList"></div>
	</div>
	<footer>

<catdv:if isTrue="allowThemes">
        <button id="btnThemes" class="btn btn-primary pull-left">Manage Themes</button>
</catdv:if>
        <button id="btnAddSettings" class="btn btn-primary">Add Workspace</button>
        <button id="btnDelete" class="btn btn-primary item-action" disabled="disabled">Delete</button>
        <button id="btnMoveUp" class="btn btn-primary item-action" disabled="disabled">
            <span class="glyphicon glyphicon-play glyph-rotate-270"></span> Move Up
        </button>
        <button id="btnMoveDown" class="btn btn-primary item-action" disabled="disabled">
            <span class="glyphicon glyphicon-play glyph-rotate-90"></span> Move Down
        </button>
	</footer>


	<div id="editWebWorkspaceDialog" class="modal fade">
	    <div class="modal-dialog">
	        <div class="modal-content">
	            <div class="modal-header">
	                <button class="close" data-dismiss="modal">&times;</button>
	                <h3>Edit Web Workspace</h3>
	            </div>
	            <div class="modal-body">
	                <div class="form-group">
	                    <label for="txtWorkspaceName">Name:</label> <input id="txtWorkspaceName"
	                        class="form-control"></input>
	                </div>
	                <div class="settingsContainer">
	                    <table id="workspaceSettingsTable" class='details'></table>
	                </div>
	            </div>
	            <div class="modal-footer">
	                <button class="btn btn-primary" data-dismiss="modal">Cancel</button>
	                <button id="btnEditWebWorkspaceOK" class="btn btn-primary">OK</button>
	            </div>
	        </div>
	    </div>
	</div>

    <%@ include file="visibility-edit.html"%>
</body>
</html>