<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib uri="/WEB-INF/catdv.tld" prefix="catdv"%>
<!DOCTYPE html>
<html class="fullPage" lang="en">
<head>
<meta charset="utf-8">
<title>CatDV: Monitoring</title>
<catdv:pageheader  pageScript="../js/ui/monitor/Dashboard.js" pageClass="ui.monitor.DashboardForm" loginPage="../login.jsp" homePage="../admin/default.jsp" requiresAdmin="true">
    <%@include file="headers.inc"%>
</catdv:pageheader>
<script type="text/javascript">
var navbarLoginMenu;
$(document).ready(function() {
	navbarLoginMenu = new ui.panels.NavbarLoginMenu("navbarLoginMenu");
});
</script>
<style>
p {
    font-size: 13pt;
}
</style>
</head>
<body class="adminListPage">
    <header>
        <%@include file="monitor-nav.jsp"%>
    </header>
	<div class="content">
		<h1>CatDV Server Dashboard</h1>
		<hr />
		<h2 id="serverIdent"></h2>
		<div class="row">
			<div class="col-md-6">
				<h3>Server</h3>
				<pre id="statusInfoList"></pre>
			</div>
			<div class="col-md-6">
				<h3>Database</h3>
				<pre id="databaseInfoList"></pre>
			</div>
		</div>
	</div>
	<footer>
        &nbsp;
    </footer>

</body>
</html>