<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib uri="/WEB-INF/catdv.tld" prefix="catdv"%>
<!DOCTYPE html>
<html class="fullPage" lang="en">
<head>
<meta charset="utf-8">
<title>CatDV: Admin</title>
<catdv:pageheader pageScript="../js/ui/admin/Roles.js" pageClass="ui.admin.RolesForm" loginPage="../login.jsp" requiresAdmin="true">
	<%@include file="headers.inc"%>
    <script type="text/javascript" src="../js/ui/admin/Groups.js"></script>
</catdv:pageheader>
</head>
<body class="adminListPage">
	<header>
		<%@include file="admin-nav.jsp"%>
	</header>
	<div class="content">
		<h1>Roles</h1>
		<div id="rolesTable" class="adminList"></div>
	</div>
	<footer>
		<button id="btnAddRole" class="btn btn-primary">Add</button>
        <button id="btnDeleteRole" class="btn btn-primary item-action" disabled="disabled">Delete</button>
	</footer>


<div id="editRoleDialog" class="modal fade bs-modal-lg">
    <div class="modal-dialog  modal-lg">
        <div class="modal-content">
            <div class="modal-header">
                <button class="close" data-dismiss="modal">&times;</button>
                <h4 class="modal-title">Edit Role</h4>
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
                <div class="form-group">
                     <label for="chkAdvancedUI">Advanced UI:</label> 
                     <div class="checkbox"><input id="chkAdvancedUI" type="checkbox"> Enable Advanced User Interface </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-primary" data-dismiss="modal">Cancel</button>
                <button id="btnEditRoleOK" class="btn btn-primary">OK</button>
            </div>
        </div>
    </div>
</div>


<div id="editRolePermissionsDialog" class="modal fade bs-modal-lg">
    <div class="modal-dialog  modal-lg">
        <div class="modal-content">
            <div class="modal-header">
                <button class="close" data-dismiss="modal">&times;</button>
                <h4 id="lblEditRolePermissionsTitle" class="modal-title">Edit Role Permissions</h4>
            </div>
            <div class="modal-body">
                <div class="form-group">
                    <label for="listGroups">Production Groups</label>
                    <div id="listGroups" class="form-control permissions-checklist"></div>
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
                <button id="btnEditRolePermissionsOK" class="btn btn-primary">OK</button>
            </div>
        </div>
    </div>
</div>


</body>
</html>