<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib uri="/WEB-INF/catdv.tld" prefix="catdv"%>
<!DOCTYPE html>
<html class="fullPage" lang="en">
<head>
<meta charset="utf-8">
<title>CatDV: Admin</title>
<catdv:pageheader pageScript="../js/ui/admin/FieldUsage.js" pageClass="ui.admin.FieldUsageForm" loginPage="../login.jsp" requiresAdmin="true">
	<%@include file="headers.inc"%>
</catdv:pageheader>
<style>
.adminList tr {
    vertical-align: top;
}
</style>
</head>
<body class="adminListPage">
	<header>
		<%@include file="admin-nav.jsp"%>
	</header>
	<div class="content">
        <h1 id="lblPageHeader"></h1> 
		<div id="fieldUsageTable" class="adminList"></div>
	</div>
	<footer>
        <button id="btnDeMergeField" class="btn btn-primary item-action" disabled="disabled">De-Merge Field Definition</button>
	</footer>
</body>

<div id="deMergeFieldDialog" class="modal fade">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <button class="close" data-dismiss="modal">&times;</button>
                <h3>De-merge Field Definition.</h3>
            </div>
            <div class="modal-body">
                <h4>Enter a name for the newly de-merged field definition</h4>
                <div class="form-group">
                    <label for="lblName">Name:</label> <input id="txtName"
                        class="form-control input-sm" ></input>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-primary btn-sm" data-dismiss="modal">Cancel</button>
                <button id="btnDeMergeDialogOK" class="btn btn-primary btn-sm">OK</button>
            </div>
        </div>
    </div>
</div>

</html>
