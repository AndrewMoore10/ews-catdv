<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib uri="/WEB-INF/catdv.tld" prefix="catdv"%>
<!DOCTYPE html>
<html class="fullPage" lang="en">
<head>
<meta charset="utf-8">
<title>CatDV: Server</title>

<!-- Enable DOM Event in QuickTime plugin in older versions of IE  -->
<object id="qt_event_source" classid="clsid:CB927D12-4FF7-4a9e-A169-56E4B8A75598" style="display: none" codebase="http://www.apple.com/qtactivex/qtplugin.cab#version=7,2,1,0"></object>

<catdv:pageheader pageScript="js/ui/ClipViewPage.js" pageClass="ui.ClipViewPage" emitSettings="true">
	<%@include file="headers.inc"%>
	<script type="text/javascript" src="js/ui/panels/ClipMediaPanel.js"></script>
	<script type="text/javascript" src="js/ui/panels/ClipDetailsPanel.js"></script>
	<script type="text/javascript" src="js/ui/panels/EventMarkersPanel.js"></script>
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
					<a class="navbar-brand" href="#"></a>
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
             <button id="btnDownload" class="btn btn-primary">
                 <span class="glyphicon glyphicon-download-alt"> </span> Download
             </button>
        </footer>
		
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
                            <label for="txtShareWith">Share with:</label> <input id="txtShareWith" class="form-control input-sm"></input>
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
</body>
</html>