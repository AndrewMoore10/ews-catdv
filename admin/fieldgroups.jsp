<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib uri="/WEB-INF/catdv.tld" prefix="catdv"%>
<!DOCTYPE html>
<html class="fullPage" lang="en">
<head>
<meta charset="utf-8">
<title>CatDV: Admin</title>
<catdv:pageheader pageScript="../js/ui/admin/FieldGroups.js" pageClass="ui.admin.FieldGroupsForm" loginPage="../login.jsp" requiresAdmin="true">
	<%@include file="headers.inc"%>
    <script type="text/javascript" src="../js/ui/admin/Visibility.js"></script>
    <script type="text/javascript">
    var groupLookup = {
   	    <catdv:get path="groups">
   	     ${group.ID} : "${group.name}",
   	    </catdv:get>
   	};    
    
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
        <h1>Field Groups</h1>
		<div id="fieldGroupsTable" class="adminList"></div>
	</div>
	<footer>
		<button id="btnAddFieldGroup" class="btn btn-primary">Add</button>
		<button id="btnDeleteFieldGroup" class="btn btn-primary item-action" disabled="disabled">Delete</button>
	</footer>


<div id="editFieldGroupDialog" class="modal fade">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <button class="close" data-dismiss="modal">&times;</button>
                <h4 class="modal-title">Edit Field Group</h4>
            </div>
            <div class="modal-body">
                <div class="form-group">
                    <label for="txtName">Name:</label> <input
                        id="txtName" class="form-control input-sm" placeholder="Field Group Name">
                </div>
                <div class="form-group">
                    <label for="txtIdentiferPrefix">Slug Prefix:</label> <input
                        id="txtIdentiferPrefix" class="form-control input-sm" placeholder="Identifier Prefix">
                </div>
                <div class="form-group">
                    <label for="lstObjectClass">Type of Object Fields Apply To:</label> <select id="lstObjectClass"
                        class="form-control input-sm">
                        <catdv:get path="fields/objectclasses">
                            <option value="${objectclass.ID}">${objectclass.name}</option>
                        </catdv:get>
                    </select>
                </div>
                <div class="form-group">
                    <label for="txtDescription">Description:</label>
                    <textarea id="txtDescription" class="form-control input-sm"
                        placeholder="Description of data held in this field"></textarea>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-primary btn-sm" data-dismiss="modal">Cancel</button>
                <button id="btnEditFieldOK" class="btn btn-primary btn-sm">OK</button>
            </div>
        </div>
    </div>
</div>


<%@ include file="visibility-edit.html"%>

</body>
</html>
