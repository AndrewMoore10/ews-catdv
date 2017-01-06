<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib uri="/WEB-INF/catdv.tld" prefix="catdv"%>
<!DOCTYPE html>
<html class="fullPage" lang="en">
<head>
<meta charset="utf-8">
<title>CatDV: Web Client</title>
<catdv:pageheader pageScript="../js/ui/desktop/MainPage.js" pageClass="ui.desktop.MainPage" loginPage="login.jsp" emitSettings="true">
    <%@include file="headers.inc"%>
    
    <script type="text/javascript" src="../js/logic/BuiltInFields.js"></script>
    <script type="text/javascript" src="../js/logic/Views.js"></script>
    <script type="text/javascript" src="../js/logic/FieldAccessors.js"></script>
    <script type="text/javascript" src="../js/logic/DetailPanels.js"></script>
    <script type="text/javascript" src="../js/logic/ClipViews.js"></script>
    <script type="text/javascript" src="../js/logic/ServerCommands.js"></script>
    <script type="text/javascript" src="../js/ui/desktop/TreeNavigatorPanel.js"></script>
	<script type="text/javascript" src="../js/ui/panels/ClipsPanel.js"></script>
	<script type="text/javascript" src="../js/ui/panels/ClipMediaPanel.js"></script>
    <script type="text/javascript" src="../js/ui/panels/ClipDetailsPanel.js"></script>
	<script type="text/javascript" src="../js/ui/panels/SearchPanels.js"></script>
	<script type="text/javascript" src="../js/ui/ServerCommandDialog.js"></script>

</catdv:pageheader>

<script type="text/javascript">
var navbarLoginMenu;
$(document).ready(function() {
    navbarLoginMenu = new ui.panels.NavbarLoginMenu("navbarLoginMenu");
});
</script>
<body>
	<div id="mainPage" class="pageContainer">
		<header>
			<div class="logo cell">
				<img src="img/logo.png">
			</div>
			<div class="cell nowrap">
				<div class="searchbox">
					<span class="glyphicon glyphicon-search"></span> <input type="text" id="txtSearch">
				</div>
			</div>
			<div class="cell nowrap">
				<button id="btnQuery">Query</button>
				<button id="btnRefresh">
					<span class="glyphicon glyphicon-refresh"></span>
				</button>
            </div>
			<div id="viewControls" class="view-controls cell nowrap"></div>
			<div class="cell nowrap right">
               <button id="btnEditClip" class="small">
                    <span class="glyphicon glyphicon-pencil"></span> Edit
                </button>
                <button id="btnCancelEdit" class="small" style="display:none;">
                    <span class="glyphicon glyphicon-remove"></span> Cancel
                </button>
                <button id="btnSaveClip" class="small" style="display:none;">
                    <span class="glyphicon glyphicon-ok"></span> Save
                </button>
            </div>
            <div class="cell nowrap right">
				<div id=loginMenu></div>
			</div>
		</header>

		<div class="content">
			<div id="hSplitter">
				<div id="navigatorPanel"></div>
				<div id="rightPane">
					<div id="vSplitter">
						<div id="clipViewSplitter">
		                    <div id="clipMediaContainer">
		                        <div id="clipMediaPanel"></div>
		                        <div id="playerControls"></div>
		                    </div>
				            <div id="clipDetailsPanel"></div>
						</div>
						<div id="clipListPanel"></div>
					</div>
				</div>
			</div>
		</div>
	</div>
	
	<!--  Advanced Query Dialog -->
    <div id="queryDialog" style="display: none;" class="modal fade">
        <div class="modal-dialog  modal-lg">
            <div class="modal-content">
                <div class="modal-header">
                    <h4 id="lblQueryDialogTitle" class="modal-title"></h4>
                </div>
                <div class="modal-body">
                    <div id="queryBuilder"></div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-sm btn-default" data-dismiss="modal">Cancel</button>
                    <button id="btnQueryDialogOK" class="btn btn-sm btn-primary run-query-action">OK</button>
                </div>
            </div>
        </div>
    </div>
</body>
</html>