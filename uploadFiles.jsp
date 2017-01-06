<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib uri="/WEB-INF/catdv.tld" prefix="catdv"%>
<!DOCTYPE html>
<html class="fullPage" lang="en">
<head>
<meta charset="utf-8">
<title>CatDV: Server</title>
<catdv:pageheader pageScript="js/ui/UploadFilesPage.js" pageClass="ui.UploadFilesPage" loginPage="login.jsp">
	<%@include file="headers.inc"%>
</catdv:pageheader>
</head>
<body>
	<div class="detailPage uploadPage fullPage" ondragover="return false;">
		<header>
			<nav class="navbar navbar-default" role="navigation">
				<div class="navbar-header">
					<a class="navbar-brand" href="default.jsp"></a>
				</div>
			</nav>
		</header>

		<div class="content dropContainer">
			<h1>Upload Files</h1>
			<div class="row">
				<div class="col-lg-12">
					<p>Drag files to the list and then press Upload to submit them to the server for processing.
					<p>
					<div id="lblValidationError" class="alert alert-danger" role="alert" style="display:none;">Required field not filled in.</div>
				    <table id="tblUploadForm" class="uploadForm details"></table>
					<div id="drop-files" ondragover="return false">
 						<table class="table" id="tblFileList">
							<tr class="header">
								<th>Name</th>
								<th>Size</th>
								<th class='status'>Status</th>
							</tr>
						</table>
						<div id="lblDropFiles">Drop File(s) Here</div>
					</div>
				</div>
			</div>
		</div>
		<footer>
			<!-- Add button is underneath a transparent input type=file control which actually catches the click. -->
			<!-- This way user doesn't see ugly file path part of file control.  -->
			<div style="display: inline; position: relative; overflow: hidden;">
				<button id="btnAdd" class="btn btn-primary" style="width: 150px;">Add...</button>
				<input type="file" id="fileBrowser" name="upload" multiple="multiple" style="position: absolute; left: 0px; top: -8px; width: 150px; height: 40px; opacity: 0; filter: alpha(opacity : 0);" />
			</div>
			<button id="btnUpload" class="btn btn-primary" style="width: 150px" disabled="disabled">Upload Files</button>
			<button id="btnClose" class="btn btn-primary" style="width: 90px">Cancel</button>
		</footer>
	</div>
</body>
</html>