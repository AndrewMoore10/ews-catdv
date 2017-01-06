<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib uri="/WEB-INF/catdv.tld" prefix="catdv"%>
<!DOCTYPE html>
<html class="fullPage" lang="en">
<head>
<meta charset="utf-8">
<title>CatDV: Admin</title>
<catdv:pageheader pageScript="../js/ui/admin/Groups.js" pageClass="ui.admin.GroupsForm" loginPage="../login.jsp" emitSettings="true" requiresAdmin="true">
	<%@include file="headers.inc"%>
</catdv:pageheader>
<script type="text/javascript" src="../js/ui/admin/AccessControl.js"></script>
</head>
<body class="adminListPage">
	<header>
		<%@include file="admin-nav.jsp"%>
	</header>
	<div class="content">
		<h1>Production Groups</h1>
		<div id="groupsTable" class="adminList"></div>
	</div>
	<footer>
		<button id="btnAddGroup" class="btn btn-primary">Add</button>
        <button id="btnDeleteGroup" class="btn btn-primary item-action" disabled="disabled">Delete</button>
	</footer>


<div id="editGroupDialog" class="modal fade bs-modal-lg">
    <div class="modal-dialog  modal-lg">
        <div class="modal-content">
            <div class="modal-header">
                <button class="close" data-dismiss="modal">&times;</button>
                <h4 class="modal-title">Edit Group</h4>
            </div>
            <div class="modal-body">
                <div class="form-group">
                    <label for="txtName">Name:</label> <input id="txtName"
                        class="form-control" placeholder="Name"></input>
                </div>
                <div class="form-group">
                    <label for="txtNotes">Notes:</label> <input id="txtNotes"
                        class="form-control" placeholder="Notes">
                </div>
                <div class="group-box">
                    <h5>Default Permissions</h5>
                    <div class="row ">
                         <div class="col-md-3"><label class="checkbox-inline"><input type="checkbox" id="createCatalogs1Chk"> Create new catalogs</label></div>
                         <div class="col-md-3"><label class="checkbox-inline"><input type="checkbox" id="createClips1Chk"> Create new clips</label></div>
                         <div class="col-md-3"><label class="checkbox-inline"><input type="checkbox" id="readOthersCatalogs1Chk"> Read other's catalogs</label></div>
                         <div class="col-md-3"><label class="checkbox-inline"><input type="checkbox" id="editCatalogs1Chk"> Edit own catalogs</label></div>
                    </div>     
                    <div class="row">
                        <div class="col-md-3"><label class="checkbox-inline"><input type="checkbox" id="editOthersCatalogs1Chk"> Edit other's catalogs</label></div>
                        <div class="col-md-3"><label class="checkbox-inline"><input type="checkbox" id="deleteClips1Chk"> Delete own clips</label></div>
                        <div class="col-md-3"><label class="checkbox-inline"><input type="checkbox" id="deleteCatalogs1Chk"> Delete own catalogs</label></div>
                        <div class="col-md-3"><label class="checkbox-inline"><input type="checkbox" id="deleteOthersCatalogs1Chk"> Delete other's catalogs</label></div>
                    </div>
                    <div class="row">
                        <div class="col-md-3"><label class="checkbox-inline"><input type="checkbox" id="editPicklist1Chk"> Edit pick lists</label></div>
                        <div class="col-md-3"><label class="checkbox-inline"><input type="checkbox" id="editLockedFields1Chk"> Edit locked fields</label></div>
                        <div class="col-md-3"><label class="checkbox-inline"><input type="checkbox" id="editTapes1Chk"> Tape management</label></div>
                        <div class="col-md-3"><label class="checkbox-inline"><input type="checkbox" id="admin1Chk"> System administration</label></div>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-primary" data-dismiss="modal">Cancel</button>
                <button id="btnEditGroupOK" class="btn btn-primary">OK</button>
            </div>
        </div>
    </div>
</div>


<div id="editGroupPermissionsDialog" class="modal fade bs-modal-lg">
    <div class="modal-dialog  modal-lg">
        <div class="modal-content">
            <div class="modal-header">
                <button class="close" data-dismiss="modal">&times;</button>
                <h4  id="lblEditGroupPermissionsTitle" class="modal-title">Edit Group Permissions</h4>
            </div>
            <div class="modal-body">
                <div class="form-group">
                    <label for="listRoles">Roles</label> 
                    <div id="listRoles" class="form-control permissions-checklist"></div>
                </div>
                <div class="group-box">
                    <h5>Permissions</h5>
                    <div class="row ">
                        <div class="col-md-3">
                            <label class="checkbox-inline"><input type="checkbox"
                                id="createCatalogs2Chk"> Create new catalogs</label>
                        </div>
                        <div class="col-md-3">
                            <label class="checkbox-inline"><input type="checkbox"
                                id="createClips2Chk"> Create new clips</label>
                        </div>
                        <div class="col-md-3">
                            <label class="checkbox-inline"><input type="checkbox"
                                id="readOthersCatalogs2Chk"> Read other's catalogs</label>
                        </div>
                        <div class="col-md-3">
                            <label class="checkbox-inline"><input type="checkbox"
                                id="editCatalogs2Chk"> Edit own catalogs</label>
                        </div>
                    </div>
                    <div class="row">
                        <div class="col-md-3">
                            <label class="checkbox-inline"><input type="checkbox"
                                id="editOthersCatalogs2Chk"> Edit other's catalogs</label>
                        </div>
                        <div class="col-md-3">
                            <label class="checkbox-inline"><input type="checkbox"
                                id="deleteClips2Chk"> Delete own clips</label>
                        </div>
                        <div class="col-md-3">
                            <label class="checkbox-inline"><input type="checkbox"
                                id="deleteCatalogs2Chk"> Delete own catalogs</label>
                        </div>
                        <div class="col-md-3">
                            <label class="checkbox-inline"><input type="checkbox"
                                id="deleteOthersCatalogs2Chk"> Delete other's catalogs</label>
                        </div>
                    </div>
                    <div class="row">
                        <div class="col-md-3">
                            <label class="checkbox-inline"><input type="checkbox"
                                id="editPicklist2Chk"> Edit pick lists</label>
                        </div>
                        <div class="col-md-3">
                            <label class="checkbox-inline"><input type="checkbox"
                                id="editLockedFields2Chk"> Edit locked fields</label>
                        </div>
                        <div class="col-md-3">
                            <label class="checkbox-inline"><input type="checkbox"
                                id="editTapes2Chk"> Tape management</label>
                        </div>
                        <div class="col-md-3">
                            <label class="checkbox-inline"><input type="checkbox"
                                id="admin2Chk"> System administration</label>
                        </div>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-primary" data-dismiss="modal">Cancel</button>
                <button id="btnEditGroupPermissionsOK" class="btn btn-primary">OK</button>
            </div>
        </div>
    </div>
</div>

<catdv:if isTrue="useAccessControlLists">
<%@ include file="acl-edit.html"%>
</catdv:if>

</body>
</html>