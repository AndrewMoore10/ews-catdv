<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib uri="/WEB-INF/catdv.tld" prefix="catdv"%>
<!DOCTYPE html>
<html class="fullPage" lang="en">
<head>
<meta charset="utf-8">
<title>CatDV: Admin</title>
<catdv:pageheader pageScript="../js/ui/admin/MediaStores.js" pageClass="ui.admin.MediaStoresForm" loginPage="../login.jsp" requiresAdmin="true">
	<%@include file="headers.inc"%>
</catdv:pageheader>

</head>
<body id="mediaStorePage" class="adminListPage">
	<header>
		<%@include file="admin-nav.jsp"%>
	</header>
	<div class="content">
		<h1>Media Stores</h1>
		<div id="mediaStoreList"></div>
	</div>
	<footer>
		<button id="btnAddMediaStore" class="btn btn-primary ">Add Media Store</button>
		<button id="btnAddPath" class="btn btn-primary" disabled>Add Path</button>
		<button id="btnEdit" class="btn btn-primary" disabled>Edit</button>
		<!--button id="btnUp" class="btn btn-btn-primary" disabled><span class="glyphicon glyphicon-play glyph-rotate-270"> </span> Move Up</button>
                <button id="btnDown" class="btn btn-btn-primary" disabled><span class="glyphicon glyphicon-play glyph-rotate-90"> </span> Move Down</button   -->
		<button id="btnDelete" class="btn btn-primary" disabled>Delete</button>
	</footer>


<div id="editMediaStoreDialog" class="modal fade">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <button class="close" data-dismiss="modal">&times;</button>
                <h3 id="lblMediaStoreName">Media Store</h3>
            </div>
            <div class="modal-body">
                <div class="form-group">
                    <label for="txtMediaStoreName">Name:</label> <input id="txtMediaStoreName"
                        class="form-control input-sm"></input>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-primary btn-sm" data-dismiss="modal">Cancel</button>
                <button id="btnEditMediaStoreOK" class="btn btn-primary btn-sm">OK</button>
            </div>
        </div>
    </div>
</div>


<div id="editPathDialog" class="modal fade">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <button class="close" data-dismiss="modal">&times;</button>
                <h3>Media Path</h3>
            </div>
            <div class="modal-body">
                <div class="form-group">
                    <label for="lstMediaType">Media Type:</label> <select id="lstMediaType"
                        class="form-control input-sm">
                        <catdv:get path="info/mediaStore/mediaTypes">
                            <option value="${mediaType.ID}">${mediaType.name}</option>
                        </catdv:get>
                    </select>
                </div>
                <div class="form-group">
                    <label for="txtMediaPath">Path:</label> <input id="txtMediaPath"
                        class="form-control input-sm"></input>
                </div>
                <div id="rowExtension" class="form-group">
                    <label for="txtExtensions">Target Media Extensions (optional):</label> <input id="txtExtensions"
                        class="form-control input-sm" placeholder="e.g. .mp4,.avi" ></input>
                </div>
                <div class="form-group">
                    <label for="lstTarget">Target:</label> <select id="lstTarget"
                        class="form-control input-sm">
                        <catdv:get path="info/mediaStore/targets">
                            <option value="${target.ID}">${target.name}</option>
                        </catdv:get>
                    </select>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-primary btn-sm" data-dismiss="modal">Cancel</button>
                <button id="btnEditPathOK" class="btn btn-primary btn-sm">OK</button>
            </div>
        </div>
    </div>
</div>


</body>
</html>
