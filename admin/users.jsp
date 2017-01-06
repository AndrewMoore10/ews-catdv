<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib uri="/WEB-INF/catdv.tld" prefix="catdv"%>
<!DOCTYPE html>
<html class="fullPage" lang="en">
<head>
<meta charset="utf-8">
<title>CatDV: Admin</title>
<catdv:pageheader pageScript="../js/ui/admin/Users.js" pageClass="ui.admin.UsersForm" loginPage="../login.jsp" requiresAdmin="true">
	<%@include file="headers.inc"%>
    <script type="text/javascript" src="../js/logic/FieldAccessors.js"></script>
    <script type="text/javascript" src="../js/logic/DetailPanels.js"></script>
</catdv:pageheader>
</head>
<body class="adminListPage">
	<header>
		<%@include file="admin-nav.jsp"%>
	</header>
	<div class="content">
		<h1>Users</h1>
		<div id="usersTable" class="adminList"></div>
	</div>
	<footer>
		<button id="btnAddUser" class="btn btn-primary">Add</button>
        <button id="btnDeleteUser" class="btn btn-primary item-action" disabled="disabled">Delete</button>
	</footer>


<div id="addUserDialog" class="modal fade">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <button class="close" data-dismiss="modal">&times;</button>
                <h3>Create a new user.</h3>
            </div>
            <div class="modal-body">
                <div id="alertMissingData" class="alert alert-danger hide">
                    <strong>Error!</strong> You must enter a user name.
                </div>
                <div id="alertPasswordMismatch" class="alert alert-danger hide">
                    <strong>Error!</strong> Passwords do not match.
                </div>
                <form role="form">
                     <div class="form-group">
                        <label  for="txtName">Name:</label >
                        <input id="txtName" class="form-control input-sm" ></input>
                    </div>
                     <div class="form-group">
                        <label  for="txtNotes">Notes:</label >
                        <input id="txtNotes" class="form-control input-sm" >
                    </div>
                     <div class="form-group">
                        <label  for="txtPassword1">Password:</label >
                        <input id="txtPassword1" type="password" class="form-control input-sm" >
                    </div>
                     <div class="form-group">
                        <label  for="txtPassword2">Confirm Password:</label >
                        <input id="txtPassword2"type="password" class="form-control input-sm" >
                    </div>
                     <div class="form-group">
                        <label  for="lstRole">Role:</label >
                        <select id="lstRole" class="form-control input-sm" >
                                <catdv:get path="roles">
                                    <option value="${role.ID}">${role.name}</option>
                                </catdv:get>
                        </select>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button class="btn btn-primary btn-sm" data-dismiss="modal">Cancel</button>
                <button id="btnNewUserOK" class="btn btn-primary btn-sm">OK</button>
            </div>
        </div>
    </div>
</div>


<div id="editUserDialog" class="modal fade">
	<div class="modal-dialog">
		<div class="modal-content">
			<div class="modal-header">
				<button class="close" data-dismiss="modal">&times;</button>
				<h3>Edit user details.</h3>
			</div>
			<div class="modal-body">
				<ul id="tabsUserDetails" class='nav nav-tabs' role='tablist'>
					<li><a href='#tabDetails' role='tab' data-toggle='tab'>Details</a></li>
                    <li><a href='#tabCustomFields' role='tab' data-toggle='tab'>Custom Fields</a></li>
				</ul>
				<div class='tab-content'>
					<div class='tab-pane' id='tabDetails'>
						<div class="form-group">
							<label for="txtNewName">Name:</label> <input id="txtNewName" class="form-control input-sm"></input>
						</div>
						<div class="form-group">
							<label for="txtNewNotes">Notes:</label> <input id="txtNewNotes" class="form-control input-sm">
						</div>
						<div class="form-group">
							<label for="lstNewRole">Role:</label> 
							<select id="lstNewRole" class="form-control input-sm">
								<catdv:get path="roles">
								<option value="${role.ID}">${role.name}</option>
								</catdv:get>
							</select>
						</div>
					</div>
                    <div class='tab-pane details-form' id='tabCustomFields'>
                    </div>
 				</div>
			</div>
			<div class="modal-footer">
				<button class="btn btn-primary btn-sm" data-dismiss="modal">Cancel</button>
				<button id="btnEditUserOK" class="btn btn-primary btn-sm">OK</button>
			</div>
		</div>
	</div>
</div>

<div id="changePasswordDialog" class="modal fade">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <button class="close" data-dismiss="modal">&times;</button>
                <h3>Change Password.</h3>
            </div>
            <div class="modal-body">
                <div id="alertNewPasswordMismatch" class="alert alert-danger hide">
                    <strong>Error!</strong> Passwords do not match.
                </div>
                <div class="form-group">
                    <label for="lblName">Name:</label> <input id="lblName"
                        class="form-control input-sm" readonly="readonly"></input>
                </div>
                <div class="form-group">
                    <label for="txtNewPassword1">Password:</label> <input
                        id="txtNewPassword1" type="password" class="form-control input-sm">
                </div>
                <div class="form-group">
                    <label for="txtNewPassword2">Confirm Password:</label> <input
                        id="txtNewPassword2" type="password" class="form-control input-sm">
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-primary btn-sm" data-dismiss="modal">Cancel</button>
                <button id="btnChangePasswordOK" class="btn btn-primary btn-sm">OK</button>
            </div>
        </div>
    </div>
</div>

</body>
</html>