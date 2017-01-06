<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib uri="/WEB-INF/catdv.tld" prefix="catdv"%>
<!DOCTYPE html>
<html class="fullPage" lang="en">
<head>
<meta charset="utf-8">
<title>CatDV: Admin</title>
<catdv:pageheader pageScript="../js/ui/monitor/Services.js" pageClass="ui.monitor.ServicesForm" loginPage="../login.jsp" requiresAdmin="true">
	<%@include file="headers.inc"%>
</catdv:pageheader>
</head>
<body class="adminListPage">
	<header>
		<%@include file="monitor-nav.jsp"%>
	</header>
	<div class="content">
		<h1>Services</h1>
		<div id="servicesTable" class="adminList"></div>
	</div>
	<footer>
		<button id="btnAddService" class="btn btn-primary">Add</button>
	</footer>
</body>
</html>