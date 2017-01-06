<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib uri="/WEB-INF/catdv.tld" prefix="catdv"%>
<!DOCTYPE html>
<html class="fullPage" lang="en">
<head>
<meta charset="utf-8">
<title>CatDV: Admin</title>
<catdv:pageheader pageScript="../js/ui/admin/SharedLinks.js" pageClass="ui.admin.SharedLinksForm" loginPage="../login.jsp" requiresAdmin="true">
	<%@include file="headers.inc"%>
</catdv:pageheader>
</head>
<body class="adminListPage">
	<header>
		<%@include file="admin-nav.jsp"%>
	</header>
	<div class="content">
		<h1>Shared Links</h1>
		<div id="sharedLinksTable" class="adminList"></div>
	</div>
	<footer>
        <button id="btnExpireSharedLink" class="btn btn-primary item-action">Expire Now</button>
		<button id="btnDeleteSharedLink" class="btn btn-primary item-action">Delete</button>
	</footer>


	<div id="editSharedLinkDialog" class="modal fade">
	    <div class="modal-dialog">
	        <div class="modal-content">
	            <div class="modal-header">
	                <button class="close" data-dismiss="modal">&times;</button>
	                <h3>Edit Shared Link.</h3>
	            </div>
	            <div class="modal-body">
	                <div class="form-group">
	                    <label for="txtAssetName">Asset Name:</label> <input id="txtAssetName" class="form-control input-sm" />
	                </div>
					<div class="form-group">
						<label for="selectExpiryPeriod">Download Media Type:</label> 
						<div class="radio">
							<label class="radio-inline"> <input type="radio" name="downloadMediaType" id="rdoDownloadOriginalMedia" value="orig"> Original Media
							</label> 
							<label class="radio-inline"> <input type="radio" name="downloadMediaType" id="rdoDownloadProxyMedia" value="proxy"> Proxy Media
							</label>
						</div>
					</div>
					<div class="form-group">
	                    <label for="txtSharedWith">Shared With:</label> <input id="txtSharedWith" class="form-control input-sm" />
	                </div>
	                <div class="form-group">
	                    <label for="txtCreatedBy">Created By:</label> <input id="txtCreatedBy" class="form-control input-sm" readonly />
	                </div>
	                <div class="form-group">
	                    <label for="txtSharedDate">Shared Date:</label> <input id="txtSharedDate" class="form-control input-sm" readonly />
	                </div>
	                <div class="form-group">
	                    <label for="txtExpiryDate">Expires:</label> <input id="txtExpiryDate" type="date" class="form-control input-sm" />
	                </div>
	                <div class="form-group">
	                    <label for="txtNotes">Notes:</label>
	                    <textarea id="txtNotes" class="form-control input-sm" rows="6"></textarea>
	                </div>
	            </div>
	            <div class="modal-footer">
	                <button class="btn btn-primary btn-sm" data-dismiss="modal">Cancel</button>
	                <button id="btnEditSharedLinkOK" class="btn btn-primary btn-sm">OK</button>
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

</body>
</html>