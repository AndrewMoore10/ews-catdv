<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib uri="/WEB-INF/catdv.tld" prefix="catdv"%>
<!DOCTYPE html>
<html class="fullPage" lang="en">
<head>
<meta charset="utf-8">
<title>CatDV: Server</title>

<catdv:pageheader pageScript="js/ui/SequenceEditorPage.js" pageClass="ui.SequenceEditorPage" loginPage="login.jsp" emitSettings="true">
	<%@include file="headers.inc"%>
	<script type="text/javascript" src="js/ui/panels/NavigatorPanel.js"></script>
	<script type="text/javascript" src="js/ui/panels/ClipsPanel.js"></script>
	<script type="text/javascript" src="js/ui/panels/SearchPanels.js"></script>
	<script type="text/javascript" src="js/ui/panels/ClipMediaPanel.js"></script>
</catdv:pageheader>

</head>
<body id="sequenceEditPage">
	<div class="detailPage fullPage">
		<header>
			<nav class="navbar navbar-default" role="navigation">
				<div class="navbar-header">
					<button type="button" class="navbar-toggle" data-toggle="collapse" data-target="#bs-example-navbar-collapse-1">
						<span class="sr-only">Toggle navigation</span><span class="icon-bar"></span><span class="icon-bar"></span><span class="icon-bar"></span>
					</button>
					<a class="navbar-brand" href="default.jsp"></a>
				</div>
				<div class="collapse navbar-collapse top-nav" id="bs-example-navbar-collapse-1">
<catdv:if isTrue="isEnterprise">
					<ul id="navbarLoginMenu" class="nav navbar-nav navbar-right"></ul>
</catdv:if>
					<ul class="nav navbar-nav navbar-right">
						<li class="dropdown"><a href="#" class="dropdown-toggle" data-toggle="dropdown">Admin<strong class="catdvicon catdvicon-pulldown_arrow"></strong></a>
							<ul class="dropdown-menu">
								<li id="nav-users"><a href="admin/users.jsp">Users</a></li>
								<li id="nav-groups"><a href="admin/groups.jsp">Groups</a></li>
								<li id="nav-roles"><a href="admin/roles.jsp">Roles</a></li>
								<li id="nav-mediastores"><a href="admin/mediastores.jsp">Media Stores</a></li>
								<li id="nav-fields"><a href="admin/fields.jsp">Fields</a></li>
								<li id="nav-panels"><a href="admin/panels.jsp">Panels</a></li>
								<li id="nav-views"><a href="admin/views.jsp">Views</a></li>
							</ul></li>
					</ul>
				</div>
			</nav>
		</header>

		<div class="content">
			<div class="topPanel">
				<div class="container">
					<div class="row clearfix">
						<div class="col-md-12 column">
							<h1 id="clipHeading"></h1>
						</div>
					</div>
					<div class="row">
						<div class="col-sm-6 clearfix">
							<div id="playerContainer">
								<div id="sequencePlayer"></div>
								<div id="playerControls"></div>
							</div>
						</div>
						<div class="col-sm-6">
							<div id="clipInfoPanel">
								<ul id="infoTabs" class="nav nav-tabs" role="tablist">
									<li class="active"><a href="#seqTab" role="tab" data-toggle="tab">Sequence</a></li>
									<li><a href="#clipTab" role="tab" data-toggle="tab">Clip</a></li>
								</ul>
								<div class="tab-content">
									<div class="tab-pane active" id="seqTab">
										<table class='details inset'>
											<tr>
												<th>Name</th>
												<td><span id="lblSequenceName"></span></td>
											</tr>
											<tr>
												<th>In</th>
												<td><span id="lblSequenceIn"></span></td>
											</tr>
											<tr>
												<th>Out</th>
												<td><span id="lblSequenceOut"></span></td>
											</tr>
											<tr>
												<th>Duration</th>
												<td><span id="lblSequenceDuration"></span></td>
											</tr>
										</table>
									</div>
									<div class="tab-pane" id="clipTab">
										<table class='details inset'>
											<tr>
												<th>Name</th>
												<td><span id="lblItemName"></span></td>
											</tr>
											<tr>
												<th>In</th>
												<td><span id="lblItemIn"></span></td>
											</tr>
											<tr>
												<th>Out</th>
												<td><span id="lblItemOut"></span></td>
											</tr>
											<tr>
												<th>Duration</th>
												<td><span id="lblItemDuration"></span></td>
											</tr>
											<tr>
												<th>Item In</th>
												<td><span id="lblItemIn2"></span></td>
											</tr>
											<tr>
												<th>Item Out</th>
												<td><span id="lblItemOut2"></span></td>
											</tr>
											<tr>
												<th>Item Duration</th>
												<td><span id="lblItemDuration2"></span></td>
											</tr>
										</table>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
			<div class="bottomPanel">
				<div id="timelinePanel"></div>
			</div>
		</div>


		<footer>
			<button id="addItemBtn" class="btn btn-primary">Add Item</button>
			<button id="deleteItemBtn" class="btn btn-primary" disabled="disabled">Delete Item</button>
			<button id="clipSaveBtn" class="btn btn-primary">
				<span class="glyphicon glyphicon-ok"> </span> Save
			</button>
			<button id="clipCancelBtn" class="btn btn-primary">
				<span class="glyphicon glyphicon-remove"> </span> Cancel
			</button>
		</footer>
	</div>

	<div id="addItemPanel" style="display: none">
		<div id="leftPanel">
			<div id="logo"></div>
			<div id="navigatorPanel"></div>
		</div>
		<div id="mainPanel">
            <div class="content">
               <div id="clipListContainer">
                   <div class="clipListHeader">
                      <h1 id="listTitle">Clips</h1> 
                      <div id="viewControls" class='viewControls pull-right'></div>
                    </div>          
                    <div id="clipListPanel"></div>
               </div>           
            </div>
			<footer>
				<button id="addBtn" class="btn btn-primary">Add</button>
				<button id="cancelAddBtn" class="btn btn-primary">Cancel</button>
			</footer>
		</div>
	</div>
</body>
</html>