<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib uri="/WEB-INF/catdv.tld" prefix="catdv"%>
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>CatDV: Server</title>

<catdv:pageheader pageScript="js/ui/ClipDumpPage.js" pageClass="ui.ClipDumpPage" loginPage="login.jsp" emitSettings="true">
	<%@include file="headers.inc"%>
</catdv:pageheader>

</head>
<body>
	<div class="clipViewPage">
		<div class="content">
			<div class="row clearfix">
				<div class="col-md-12 column">
					<h1 id="clipHeading"></h1>
				</div>
			</div>
			<div class="row">
				<div class="col-md-12 clearfix">
					<div id="clipDumpPanel"></div>
				</div>
			</div>
		</div>
	</div>

 </body>
</html>