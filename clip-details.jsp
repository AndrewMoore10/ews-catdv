<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib uri="/WEB-INF/catdv.tld" prefix="catdv"%>
<!DOCTYPE html>
<html class="fullPage" lang="en">
<head>
<meta charset="utf-8">
<title>CatDV: Server</title>

<!-- Enable DOM Event in QuickTime plugin in older versions of IE  -->
<!--[if lt IE 9]>
<object id="qt_event_source" classid="clsid:CB927D12-4FF7-4a9e-A169-56E4B8A75598" style="display: none" codebase="http://www.apple.com/qtactivex/qtplugin.cab#version=7,2,1,0"></object>
<![endif]-->

<catdv:pageheader pageScript="js/ui/ClipDetailsPage.js" pageClass="ui.ClipDetailsPage" loginPage="login.jsp" emitSettings="true">
	<%@include file="headers.inc"%>
	<script type="text/javascript" src="js/ui/panels/ClipMediaPanel.js"></script>
	<script type="text/javascript" src="js/ui/panels/ClipDetailsPanel.js"></script>
	<script type="text/javascript" src="js/ui/panels/EventMarkersPanel.js"></script>
	<script type="text/javascript" src="js/ui/ServerCommandDialog.js"></script>
    <script type="text/javascript" src="js/logic/ServerCommands.js"></script>
</catdv:pageheader>

</head>
<body>
	<div class="detailPage fullPage">
		<header>
			<nav class="navbar navbar-default" role="navigation">
				<div class="navbar-header">
					<button type="button" class="navbar-toggle" data-toggle="collapse" data-target="#bs-example-navbar-collapse-1">
						<span class="sr-only">Toggle navigation</span><span class="icon-bar"></span><span class="icon-bar"></span><span class="icon-bar"></span>
					</button>
					<a class="navbar-brand" href="default.jsp"></a>
				</div>
				<div class="collapse navbar-collapse top-nav" id="bs-example-navbar-collapse-1">
<catdv:if isTrue="showLoginMenu">
                    <ul id="navbarLoginMenu" class="nav navbar-nav navbar-right"></ul>
</catdv:if>
                    <ul class="nav navbar-nav navbar-right">
                         ${settings.topNavLinks}
<catdv:if isTrue="canShareClips">
                        <li><a href="#" id='btnShareClip'><span class="glyphicon glyphicon-share-alt"></span> Share Link</a></li>
</catdv:if>
<catdv:if isTrue="canRunServerCommands">
	                    <li id="menuServerCommands" class="dropdown" style="display:none;">
	                        <a href="#" class="dropdown-toggle" data-toggle="dropdown">Tools<strong class="catdvicon catdvicon-pulldown_arrow"></strong></a>
	                        <ul class="dropdown-menu"></ul>
	                    </li>
</catdv:if>
<catdv:if isTrue="canAddToClipBasket">
                         <li><a href="basket.jsp" id='btnClipBasket'>${settings.clipBasketLongAlias}<span id="numBasketItemsBadge" class="badge"></span></a></li>
</catdv:if>
                     </ul>
				</div>
			</nav>
		</header>

		<div class="content">
			<div class="row clearfix">
				<div class="col-md-12 column">
					<h1 id="clipHeading"></h1>
				</div>
			</div>
			<div class="row">
				<div class="col-sm-5 clearfix">
					<div id="playerContainer">
						<div id="clipMediaPanel"></div>
						<div id="playerControls"></div>
					</div>
					<div id='eventMarkersPanel'></div>
				</div>
				<div class="col-sm-7">
					<div id="clipDetailsPanel"></div>
				</div>
			</div>
		</div>

		<footer>
<catdv:if isTrue="canAddToClipBasket">
             <button id="btnAddToBasket" class="btn btn-primary">
                 <span class="glyphicon glyphicon-plus-sign"> </span> Add to ${settings.clipBasketShortAlias}
             </button>
</catdv:if>
<catdv:if isTrue="canDownloadMedia">
             <button id="btnDownload" class="btn btn-primary" disabled="disabled">
                 <span class="glyphicon glyphicon-download-alt"> </span> Download
             </button>
</catdv:if>
<catdv:if isTrue="canEditSequences">
             <button id="editSeqBtn" class="btn btn-primary" style="display:none;"><span class="glyphicon glyphicon-pencil"> </span> Edit Sequence</button>
</catdv:if>
             <button id="clipSaveBtn" class="btn btn-primary" style="display:none;"><span class="glyphicon glyphicon-ok"> </span> Save</button>
             <button id="clipCancelBtn" class="btn  btn-primary" style="display:none;"><span class="glyphicon glyphicon-remove"> </span> Cancel</button>			
             <button id="clipCloseBtn" class="btn  btn-primary" style="display:none;"><span class="glyphicon glyphicon-arrow-left"> </span> Back</button>            
		</footer>
	</div>

    <div id="createSubclipDialog" style="display: none;" class="modal fade">
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h4 class="modal-title">Create Sub-clip</h4>
                </div>
                <div class="modal-body">
                    <form role="form">
                        <div class="form-group">
                            <label for="txtSubclipName">Name:</label> <input id="txtSubclipName" class="form-control input-sm"></input>
                        </div>
                       <div class="form-group">
                            <label for=txtSubclipNotes>Notes:</label> <input id="txtSubclipNotes" class="form-control input-sm"></input>
                        </div>
                     </form>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-sm btn-primary" data-dismiss="modal">Cancel</button>
                    <button id="btnCreateSubclipDialogOK" class="btn btn-sm btn-primary">OK</button>
                </div>
            </div>
        </div>
    </div>

   <div id="createSharedLinkDialog" style="display: none;" class="modal fade">
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h4 class="modal-title">Share Clip Link</h4>
                </div>
                <div class="modal-body">
                    <form role="form">
                        <div class="form-group">
                            <label for="txtShareWith">Share with:</label> <input id="txtShareWith" class="form-control input-sm" placeholder="Email Address"></input>
                        </div>
                       <div class="form-group">
                            <label for="selectExpiryPeriod">Expires:</label>
                             <select id="selectExpiryPeriod" class="form-control input-sm">
<catdv:get path="info/sharedlinkPeriods">
                                <option value="${sharedlinkPeriod.ID}">${sharedlinkPeriod.name}</option>
</catdv:get>                               
                             </select>
                        </div>
                       <div class="form-group">
	                        <label for="selectExpiryPeriod">Download Media Type:</label>
	                        <div class="radio">
	                            <label> <input type="radio" name="downloadMediaType" checked="checked" id="rdoDownloadOriginalMedia"> Original Media.
	                            </label>
	                        </div>
	                        <div class="radio">
	                            <label> <input type="radio" name="downloadMediaType" id="rdoDownloadProxyMedia"> Proxy Media.
	                            </label>
	                        </div>                       
                       </div>
                       <div class="form-group">
                            <label for=txtSharedLinkNotes>Notes:</label> <textarea id="txtSharedLinkNotes" class="form-control input-sm"></textarea>
                        </div>
                     </form>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-sm btn-primary" data-dismiss="modal">Cancel</button>
                    <button id="btnCreateSharedLinkDialogOK" class="btn btn-sm btn-primary">OK</button>
                </div>
            </div>
        </div>
    </div>

   <div id="viewSharedLinkDialog" style="display: none;" class="modal fade">
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h4 class="modal-title">Shared Link</h4>
                </div>
                <div class="modal-body">
                    <form role="form">
                        <div class="form-group">
                            <label for="txtViewClipUrl">View Clip URL:</label> <div id="txtViewClipUrl" class="form-control input-sm" style="height: auto;"></div>
                        </div>
                        <div class="form-group">
                            <label for=txtDownloadUrl>Download URL:</label> <div id="txtDownloadUrl" class="form-control input-sm" style="height: auto;"></div>
                        </div>
                       <div class="form-group">
                            <label for=lnkEmailLinks>Send Email:</label><a id="lnkEmailLinks" style="display:block;" href="#"></a>
                        </div>
                     </form>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-sm btn-primary" data-dismiss="modal">Done</button>
                </div>
            </div>
        </div>
    </div>

	<div id="addMarkerDialog" class="modal fade">
		<div class="modal-dialog">
			<div class="modal-content">
				<div class="modal-header">
					<button class="close" data-dismiss="modal">&times;</button>
					<h3 id="lblAddMarkerDialogTitle">Add Event Marker</h3>
				</div>
				<div class="modal-body">
                    <div class="form-group">
                        <label id="lblMarkerInfo"></label>
                    </div>
					<div class="form-group">
						<label for="txtName">Name:</label> <input id="txtName" class="form-control input-sm"></input>
					</div>
					<div class="form-group">
						<label for="txtComment">Comment:</label>
						<textarea id="txtComment" class="form-control input-sm" rows=4></textarea>
					</div>
				</div>
				<div class="modal-footer">
					<button class="btn btn-primary" data-dismiss="modal">Cancel</button>
					<button id="btnAddMarkerOK" class="btn btn-primary">OK</button>
				</div>
			</div>
		</div>
	</div>

	<div id="editMarkerDialog" class="modal fade">
		<div class="modal-dialog">
			<div class="modal-content">
				<div class="modal-header">
					<button class="close" data-dismiss="modal">&times;</button>
					<h3>Edit Event Marker</h3>
				</div>
				<div class="modal-body">
					<div class="form-group">
						<label for="txtNewName">Name:</label> <input id="txtNewName" class="form-control input-sm"></input>
					</div>
					<div class="form-group">
						<label for="txtNewComment">Comment:</label>
						<textarea id="txtNewComment" class="form-control input-sm" rows=4></textarea>
					</div>
				</div>
				<div class="modal-footer">
					<button class="btn btn-primary" data-dismiss="modal">Cancel</button>
					<button id="btnEditMarkerOK" class="btn btn-primary">OK</button>
				</div>
			</div>
		</div>
	</div>

<catdv:if isTrue="isEnterprise">
    <div id="serverCommandArgsDialog" style="display: none;" class="modal fade">
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h4 id="svrCmdArgsDlg_lblTitle" class="modal-title"></h4>
                </div>
                <div id="svrCmdArgsDlg_divArguments" class="modal-body"></div>
                <div id="svrCmdArgsDlg_buttonPanel" class="modal-footer"></div>
            </div>
        </div>
    </div>
</catdv:if>
</body>
</html>