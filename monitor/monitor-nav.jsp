
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
	    <ul id="navbarLoginMenu" class="nav navbar-nav navbar-right"></ul>
		<ul class="nav navbar-nav">
            <li id="monitor-dashboard"><a href="default.jsp">Dashboard</a></li>
			<li id="monitor-jobs"><a href="jobs.jsp">Jobs</a></li>
            <li id="monitor-services"><a href="services.jsp">Services</a></li>
			<li id="monitor-logs"><a href="auditlog.jsp">Audit Log</a></li>
		</ul>
	</div>

</nav>