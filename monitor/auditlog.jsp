<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib uri="/WEB-INF/catdv.tld" prefix="catdv"%>
<!DOCTYPE html>
<html class="fullPage" lang="en">
<head>
<meta charset="utf-8">
<title>CatDV: Admin</title>
<catdv:pageheader pageScript="../js/ui/monitor/AuditLog.js" pageClass="ui.monitor.AuditLogForm" loginPage="../login.jsp" requiresAdmin="true">
	<%@include file="headers.inc"%>
</catdv:pageheader>
</head>
<body class="adminListPage">
	<header>
		<%@include file="monitor-nav.jsp"%>
	</header>
	<div class="content">
        <div class="list-filters">
            <label>When: </label><select id="selectPeriod" class="inline-form-control">
                <option value="1">Last Hour</option>
                <option value="24">Last Day</option>
                <option value="168">Last Week</option>
                <option value="720">Last Month</option>
                <option value="2190">Last 3 Months</option>
                <option value="-1">Any time</option>
            </select>&nbsp;
            <label>Category: </label><select id="selectCategory" class="inline-form-control">
	            <catdv:get path="info/logCategories">
	            <option value="${logCategory.ID}">${logCategory.name}</option>
	            </catdv:get>
            </select>
            <label>Search: </label><input type="text" id="txtSearch" size="24">
        </div>
   		<h1>Audit Log</h1>
		<div id="logEntryTable" class="adminList"></div>
	</div>
	<footer>
	</footer>


<div id="viewExtendedDetailsDialog" class="modal fade bs-modal-lg">
    <div class="modal-dialog  modal-lg">
        <div class="modal-content">
            <div class="modal-header">
                <button class="close" data-dismiss="modal">&times;</button>
                <h4 class="modal-title">Extended Details</h4>
            </div>
            <div class="modal-body">
                <div id="lstDetails">
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-primary"data-dismiss="modal" >Done</button>
            </div>
        </div>
    </div>
</div>

</body>
</html>