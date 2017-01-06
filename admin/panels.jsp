<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib uri="/WEB-INF/catdv.tld" prefix="catdv"%>
<!DOCTYPE html>
<html class="fullPage" lang="en">
<head>
<meta charset="utf-8">
<title>CatDV: Admin</title>

<catdv:pageheader pageScript="../js/ui/admin/Panels.js" pageClass="ui.admin.PanelsForm" loginPage="../login.jsp" requiresAdmin="true">
	<%@include file="headers.inc"%>

	<!-- Base classes for editing views are defined in Views.ts -->
	<script type="text/javascript" src="../js/ui/admin/Views.js"></script>
	<script type="text/javascript" src="../js/ui/admin/Visibility.js"></script>
	<script type="text/javascript">
var roleLookup = {
	<catdv:get path="roles">
	 ${role.ID} : "${role.name}",
	</catdv:get>
};

var groupLookup = {
	<catdv:get path="groups">
	 ${group.ID} : "${group.name}",
	</catdv:get>
};
	
var clientLookup = {
    <catdv:get path="info/clienttypes">
     ${clienttype.ID} : "${clienttype.name}",
    </catdv:get>
};
</script>
</catdv:pageheader>

</head>
<body class="adminListPage">
	<header>
		<%@include file="admin-nav.jsp"%>
	</header>
	<div class="content">
		<h1>Panel Sets / Panels</h1>
		<div id="panelsTable" class="adminList"></div>
	</div>
	<footer>
		<button id="btnAddViewSet" class="btn btn-primary">Add Panel Set</button>
		<button id="btnAddView" class="btn btn-primary" disabled="disabled">Add Panel</button>
		<button id="btnDelete" class="btn btn-primary item-action" disabled="disabled">Delete</button>
		<button id="btnMoveUp" class="btn btn-primary item-action" disabled="disabled">
			<span class="glyphicon glyphicon-play glyph-rotate-270"></span> Move Up
		</button>
		<button id="btnMoveDown" class="btn btn-primary item-action" disabled="disabled">
			<span class="glyphicon glyphicon-play glyph-rotate-90"></span> Move Down
		</button>
	</footer>


<div id="editPanelDialog" class="modal fade bs-modal-lg">
    <div class="modal-dialog  modal-lg">
        <div class="modal-content">
            <div class="modal-header">
                <button class="close" data-dismiss="modal">&times;</button>
                <h4 class="modal-title">Edit Panel</h4>
            </div>
            <div class="modal-body">
              <div class="row">
                    <div class="col-md-3">
                        <form role="form">
                            <div class="form-group">
                                <label for="txtName">Panel Name</label> <input type="text"
                                    id="txtName" class="form-control input-sm">
                            </div>
                        </form>
                    </div>
                     <div class="col-md-8">
                        <form role="form">
                            <div class="form-group">
                                <label for="txtDescription">Description</label> <input type="text"
                                    id="txtDescription" class="form-control input-sm">
                            </div>
                        </form>
                    </div>
                </div>
                <div class="row">
                    <div class="col-md-3">
                          <div class="form-group">
                            <label for="lstViewType">Type</label> <select id="lstViewType"
                                class="form-control input-sm">
                                    <option value="normal">Normal</option>
                                    <option value="html">HTML Summary</option>
                                    <option value="builtin">Built in</option>
                             </select>
                        </div>
                   </div>
                </div>
                <div id="editFieldsSection">
                    <div class="row">
                        <div class="col-md-5">
                            <form role="form">
                                <div class="form-group">
                                    <label for="txtFilter">Filter</label> <input type="text"
                                        id="txtFilter" class="form-control input-sm">
                                </div>
                            </form>
                        </div>
                    </div>
                    <div class="row">
                        <div class="col-md-5">
                            <form role="form">
                                <div class="form-group">
                                    <label for="listAllFields">Available Fields</label>
                                   <div id="listAllFields" class="form-control input-sm" style="height: 250px;"></div>                          
                                </div>
	                            <div class="form-group">
	                                <div class="checkbox">
	                                    <label class="field-label builtin-field"> <input type="checkbox" id="chkBuiltIn">
	                                        Show Built-in Fields
	                                    </label>
	                                </div>
	                                <div class="checkbox">
	                                    <label class="field-label user-field"> <input type="checkbox" id="chkUserFields" checked>
	                                        Show User-defined Fields
	                                    </label>
	                                </div>
	                                <div class="checkbox">
	                                    <label class="field-label metadata-field"> <input type="checkbox" id="chkMetadata">
	                                        Show Media Metadata
	                                    </label>
	                                </div>
	                            </div>
                            </form>
                        </div>
                        <div class="col-md-1" style="margin-top: 100px;">
                            <div class="form-group">
                                <button id="btnFieldAdd" class="btn btn-default btn-sm">
                                    <span class="glyphicon glyphicon-forward"> </span>
                                </button>
                            </div>
                            <div class="form-group">
                                <button id="btnFieldRemove" class="btn btn-default btn-sm">
                                    <span class="glyphicon glyphicon-backward"> </span>
                                </button>
                            </div>
    
                        </div>
                        <div class="col-md-5">
                            <form role="form">
                                <div class="form-group">
                                   <label for="listIncludedFields">Panel Fields</label>
                                   <div id="listIncludedFields" class="form-control input-sm" style="height: 250px;"></div>                          
                                </div>
                                <div class="form-group">
                                    <div class="checkbox">
                                        <label> <input type="checkbox" id="chkReadOnly">
                                            Read Only
                                        </label>
                                    </div>
                                    <div class="checkbox">
                                        <label> <input type="checkbox" id="chkSpanTwoCols">
                                            Span two columns
                                        </label>
                                    </div>
                                    <div class="checkbox">
                                        <label> <input type="checkbox" id="chkHideIfBlank">
                                            Hide if blank
                                        </label>
                                    </div>
                                    <div class="checkbox">
                                        <label> <input type="checkbox" id="chkMultiline">
                                            Multiline
                                        </label>
                                    </div>
                                </div>
    
                            </form>
                        </div>
                        <div class="col-md-1" style="margin-top: 50px;">
                            <div class="form-group">
                                <button id="btnFieldTop" class="btn btn-default btn-sm">
                                    <span class="glyphicon glyphicon-step-backward glyph-rotate-90">
                                    </span>
                                </button>
                            </div>
                            <div class="form-group">
                                <button id="btnFieldUp" class="btn btn-default btn-sm">
                                    <span class="glyphicon glyphicon-play glyph-rotate-270">
                                    </span>
                                </button>
                            </div>
                            <div class="form-group">
                                <button id="btnFieldDown" class="btn btn-default btn-sm">
                                    <span class="glyphicon glyphicon-play glyph-rotate-90"> </span>
                                </button>
                            </div>
                            <div class="form-group">
                                <button id="btnFieldBottom" class="btn btn-default btn-sm">
                                    <span class="glyphicon glyphicon-step-forward glyph-rotate-90">
                                    </span>
                                </button>
                            </div>
    
                        </div>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-primary" data-dismiss="modal">Cancel</button>
                <button id="btnEditViewOK" class="btn btn-primary">OK</button>
            </div>
        </div>
    </div>
</div>

	<%@ include file="visibility-edit.html"%>
	<%@ include file="viewset-edit.html"%>
	
</body>
</html>
