<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib uri="/WEB-INF/catdv.tld" prefix="catdv"%>
<!DOCTYPE html>
<html class="fullPage" lang="en">
<head>
<meta charset="utf-8">
<title>CatDV: Admin</title>
<catdv:pageheader pageScript="../js/ui/admin/Themes.js" pageClass="ui.admin.ThemesPage" loginPage="../login.jsp" requiresAdmin="true">
	<%@include file="headers.inc"%>
</catdv:pageheader>
</head>
<body class="adminListPage">
	<header>
		<%@include file="admin-nav.jsp"%>
	</header>
	<div class="content">
		<h1>
			<a href="web-workspaces.jsp">Workspaces</a> / UI Themes
		</h1>
<catdv:if isTrue="allowThemes">
		<div id="themesTable" class="adminList"></div>
</catdv:if>
	</div>
	<footer>
		<button id="btnAddTheme" class="btn btn-primary">Add Theme</button>
		<button id="btnDelete" class="btn btn-primary item-action" disabled="disabled">Delete</button>
	</footer>

<catdv:if isTrue="allowThemes">
	<div id="editThemeDialog" class="modal fade">
		<div class="modal-dialog">
			<div class="modal-content">
				<div class="modal-header">
					<button class="close" data-dismiss="modal">&times;</button>
					<h3>Edit Theme</h3>
				</div>
				<div class="modal-body">
					<form class="form-horizontal">
						<div class="form-group form-group-sm">
							<label for="txtThemeName" class="col-sm-3 control-label">Theme Name:</label>
							<div class="col-sm-9">
								<input id="txtThemeName" class="form-control input-sm">
							</div>
						</div>
					</form>
					<ul id="tabsEditTheme" class='nav nav-tabs' role='tablist'>
						<li><a href='#tabImagess' role='tab' data-toggle='tab'>Images</a></li>
						<li><a href='#tabColors' role='tab' data-toggle='tab'>Colours</a></li>
                        <li><a href='#tabAdvanced' role='tab' data-toggle='tab'>Advanced</a></li>
					</ul>
					<div class='tab-content'>
						<div class='tab-pane details-form' id='tabImagess'>
							<form class="form">
								<div class="form-group form-group-sm">
									<label for="txtImageFolder" class="control-label">Images Folder:</label> 
									<input id="txtImageFolder" class="form-control input-sm" placeholder="file path">
								</div>
							</form>
							<p>
							Enter the path of a folder containing the images for this theme. 
							The images must have the following names and sizes:
							</p>
							<dl>
							<dt>logo_main.png</dt>
							<dd>Logo at the top left of the main page. 240px x 120px
                            <dt>logo_other.png</dt>
                            <dd>Logo at the top left of other pages. 240px x 60px
                            <dt>login_bg.jpg</dt>
                            <dd>Background image for the login page. 
                            <dt>header_main.png</dt>
                            <dd>Background image for header on main page. 120px high.
                            <dt>header_other.png</dt>
                            <dd>Background image for header on other pages. 60px high.
                            <dt>sprocket_hole.png</dt>
                            <dd>Image used for the sprocket holes in the filmstrip view. 24px x 30px
							</dl>
							<p>
							Images from the default theme will be used where an image is not present in the folder.
							</p>
						</div>
						<div class='tab-pane' id='tabColors'>
							<form class="form-horizontal">
								<div id="colorSchemeSettingsContainer" class="settingsContainer color-scheme"></div>
							</form>
						</div>
                        <div class='tab-pane' id='tabAdvanced'>
                            <form class="form-horizontal">
                                <div id="advancedSettingsContainer" class="settingsContainer color-scheme"></div>
                            </form>
                        </div>
					</div>
				</div>
				<div class="modal-footer">
                    <button id="btnEditThemeApply" class="btn btn-primary pull-left">Apply</button>
					<button class="btn btn-primary" data-dismiss="modal">Cancel</button>
					<button id="btnEditThemeOK" class="btn btn-primary">OK</button>
				</div>
			</div>
		</div>
	</div>
</catdv:if>
</body>
</html>