<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib uri="/WEB-INF/catdv.tld" prefix="catdv"%>
<!DOCTYPE html>
<html class="fullPage" lang="en">
<head>
<meta charset="utf-8">
<title>CatDV: Admin</title>
<catdv:pageheader pageScript="../js/ui/monitor/Jobs.js" pageClass="ui.monitor.JobsForm" loginPage="../login.jsp" requiresAdmin="true">
	<%@include file="headers.inc"%>
</catdv:pageheader>
</head>
<body class="adminListPage">
	<header>
		<%@include file="monitor-nav.jsp"%>
	</header>
	<div class="content">
		<h1>Jobs</h1>
		<div id="jobsTable" class="adminList"></div>
	</div>
	<footer>
		<button id="btnAddJob" class="btn btn-primary">Add</button>
	</footer>
	
	
<div id="viewJobDialog" class="modal fade">
    <div class="modal-dialog modal-lg">
        <div class="modal-content">
            <div class="modal-header">
                <button class="close" data-dismiss="modal">&times;</button>
                <h3>View job details.</h3>
            </div>
            <div class="modal-body">
                <div class="form-group">
                    <label for="txtJobDescription">Job:</label> <input id="txtJobDescription"
                        class="form-control input-sm" disabled="disabled""></input>
                </div>
                <div class="form-group">
                    <label for="divJobData">Data:</label> <div id="divJobData"></div>
                </div>
                <div id="tableJobResults" style="height:320px"></div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-sm btn-primary" data-dismiss="modal">Cancel</button>
                <button id="btnEditJobOK" class="btn btn-sm btn-primary">OK</button>
            </div>
        </div>
    </div>
</div>
	
</body>
</html>