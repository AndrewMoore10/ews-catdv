<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib uri="/WEB-INF/catdv.tld" prefix="catdv"%>
<!DOCTYPE html>
<html class="fullPage" lang="en">
<head>
<meta charset="utf-8">
<title>CatDV: Admin</title>
<catdv:pageheader loginPage="../login.jsp" homePage="../default.jsp" requiresAdmin="true">
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
        <%@include file="admin-nav.jsp"%>
    </header>
    <div class="content">
<catdv:if isTrue="isEnterprise">
        <h1>CatDV Server Administration</h1>
</catdv:if>
<catdv:if isTrue="isWorkgroup">
        <h1>CatDV Workgroup Server Administration</h1>
</catdv:if>
        <hr/>
        <p>
        Welcome to the new web-based CatDV Server Administration site.
        </p>
        <p>
        Using this site you can administer:
        </p>
        <ul>
<catdv:if isTrue="isEnterprise">
            <li><a href="groups.jsp"><strong>Production Groups</strong></a> - used to origanise your catalogs appropriately for your business.</li>
            <li><a href="roles.jsp"><strong>Roles</strong></a> - assign users to different roles.</li>
            <li><a href="users.jsp"><strong>Users</strong></a> - manage users and passwords.</li>
</catdv:if>
            <li><a href="mediastores.jsp"><strong>Media Stores</strong></a> - manage shared storeage and proxies.</li>
<catdv:if isTrue="isEnterprise">
            <li><a href="fieldgroups.jsp"><strong>Fields</strong></a> - set up user-defined fields to hold custom metadata.</li>
            <li><a href="panels.jsp"><strong>Panels</strong></a> - design custom panels used to display user-defined fields in the UI.</li>
            <li><a href="views.jsp"><strong>Views</strong></a> - customise what columns are displayed in different list views.</li>
            <li><a href="forms.jsp"><strong>Forms/Filters</strong></a> - confugure upload and search forms and filters.</li>
            <li><a href="shared-links.jsp"><strong>Shared Links</strong></a> - view history of shared links.</li>
            <li><a href="web-workspaces.jsp"><strong>Workspaces</strong></a> - customise what aspects of the user interface are seen by different sets of users.</li>
</catdv:if>
        </ul>
<catdv:if isTrue="isEnterprise">
        <p>
        You can also use the <a href="../monitor"><strong>Monitor</strong></a> section to monitor the current state of the system:
        </p>
       <ul>
            <li><a href="../monitor/default.jsp"><strong>Dashboard</strong></a> - overview of server status.</li>
            <li><a href="../monitor/auditlog.jsp"><strong>Audit Log</strong></a> - detailed information about historical system activity.</li>
            <li><a href="../monitor/jobs.jsp"><strong>Jobs</strong></a> - monitor status of backgroud jobs.</li>
            <li><a href="../monitor/services.jsp"><strong>Background Services</strong></a> - monitor health of background services.</li>
        </ul>
</catdv:if>
        <p>
       
        </p>
    </div>
    <footer>
        &nbsp;
    </footer>

</body>
</html>