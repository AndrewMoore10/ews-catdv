
<script type="text/javascript">
$(document).ready(function()
{
    var pageFileName = location.pathname.substring(location.pathname.lastIndexOf("/") + 1);
    $("#nav-" + pageFileName.substring(0, pageFileName.indexOf("."))).addClass("active");
});

</script>

<nav class="navbar navbar-default" role="navigation">
	<div class="navbar-header">
		<button type="button" class="navbar-toggle" data-toggle="collapse"
			data-target="#bs-example-navbar-collapse-1">
			<span class="sr-only">Toggle navigation</span><span class="icon-bar"></span><span
				class="icon-bar"></span><span class="icon-bar"></span>
		</button>
        <a class="navbar-brand" href='${homePage != null ? homePage: "default.jsp"}'></a>
	</div>

	<div class="collapse navbar-collapse" id="bs-example-navbar-collapse-1">
<catdv:if isTrue="showLoginMenu">
                        <ul id="navbarLoginMenu" class="nav navbar-nav navbar-right"></ul>
</catdv:if>
		<ul class="nav navbar-nav">

<catdv:if isTrue="isEnterprise">
			<li id="nav-groups" class="admin-menu-wide"><a href="groups.jsp">Groups</a></li>
		    <li id="nav-roles" class="admin-menu-wide"><a href="roles.jsp">Roles</a></li>
            <li id="nav-users" class="admin-menu-wide"><a href="users.jsp">Users</a></li>
		
            <li id="nav-fields" class="admin-menu-wide"><a href="fieldgroups.jsp">Fields</a></li>
            <li id="nav-panels" class="admin-menu-wide"><a href="panels.jsp">Panels</a></li>
            <li id="nav-views" class="admin-menu-wide"><a href="views.jsp">Views</a></li>
            <li id="nav-forms" class="admin-menu-wide"><a href="forms.jsp">Forms/Filters</a></li>
</catdv:if>
			<li id="nav-mediastores" class="admin-menu-wide"><a href="mediastores.jsp">Media Stores</a></li>
<catdv:if isTrue="isEnterprise">
			<li id="shared-links" class="admin-menu-wide"><a href="shared-links.jsp">Shared Links</a></li>
			<li id="nav-web-workspaces" class="admin-menu-wide"><a href="web-workspaces.jsp">Web Workspaces</a></li>
</catdv:if>
			
<catdv:if isTrue="isEnterprise">
			<li id="menu-security" class="dropdown admin-menu-compact">
                 <a href="#" class="dropdown-toggle" data-toggle="dropdown">Security<strong class="catdvicon catdvicon-pulldown_arrow"></strong></a>
                 <ul class="dropdown-menu">
		            <li id="nav-groups"><a href="groups.jsp">Groups</a></li>
		            <li id="nav-roles"><a href="roles.jsp">Roles</a></li>
                    <li id="nav-users"><a href="users.jsp">Users</a></li>
                 </ul>
			</li>

			<li id="menu-ui" class="dropdown admin-menu-compact">
	             <a href="#" class="dropdown-toggle" data-toggle="dropdown">Customise<strong class="catdvicon catdvicon-pulldown_arrow"></strong></a>
	             <ul class="dropdown-menu">
		            <li id="nav-fields"><a href="fieldgroups.jsp">Fields</a></li>
		            <li id="nav-panels"><a href="panels.jsp">Panels</a></li>
		            <li id="nav-views"><a href="views.jsp">Views</a></li>
		            <li id="nav-forms"><a href="forms.jsp">Forms/Filters</a></li>
	             </ul>
	        </li>
	         
            <li id="menu-other" class="dropdown admin-menu-compact">
                 <a href="#" class="dropdown-toggle" data-toggle="dropdown">Other<strong class="catdvicon catdvicon-pulldown_arrow"></strong></a>
                 <ul class="dropdown-menu">
		            <li id="nav-mediastores"><a href="mediastores.jsp">Media Stores</a></li>
		            <li id="shared-links"><a href="shared-links.jsp">Shared Links</a></li>
		            <li id="nav-web-workspaces"><a href="web-workspaces.jsp">Web Workspaces</a></li>
                 </ul>
            </li>
</catdv:if>
		</ul>
	</div>

</nav>