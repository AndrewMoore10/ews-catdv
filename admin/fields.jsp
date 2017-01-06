<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib uri="/WEB-INF/catdv.tld" prefix="catdv"%>
<!DOCTYPE html>
<html class="fullPage" lang="en">
<head>
<meta charset="utf-8">
<title>CatDV: Admin</title>
<catdv:pageheader pageScript="../js/ui/admin/Fields.js" pageClass="ui.admin.FieldsForm" loginPage="../login.jsp" requiresAdmin="true">
	<%@include file="headers.inc"%>
<script>
<catdv:if isParamSet="$fieldGroupID">
	<catdv:get path="fieldgroups/$fieldGroupID">
		currentFieldGroup = {
			ID : ${fieldgroup.ID},
			name : "${fieldgroup.name}",
			description : "${fieldgroup.description}",
			objectClass : "${fieldgroup.objectClass}"
		}
	</catdv:get> 
</catdv:if>

var fieldGroupLookup = {
    <catdv:get path="fieldgroups">
     "${fieldgroup.ID}" : {
         ID : ${fieldgroup.ID},
         objectClass : "${fieldgroup.objectClass}",
         name : "${fieldgroup.name}",
         identifierPrefix: "${fieldgroup.identifierPrefix}"
    },
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
        <div style="position:absolute;right:0px;top:25px;">
            <b>Filter: </b><input type="text" id="txtSearch" size="32">
            &nbsp;&nbsp;<input type="checkbox" id="chkAdvanced"> Advanced
        </div>
        <h1 id="lblPageHeader"></h1> 
		<div id="fieldsTable" class="adminList"></div>
	</div>
	<footer>
        <button id="btnRenumberUserFields" class="btn btn-primary pull-left" style="display:none">Renumber Fields</button>
		<button id="btnAddField" class="btn btn-primary">Add</button>
        <button id="btnMergeFields" class="btn btn-primary item-action" disabled="disabled" style="display:none;">Merge</button>
		<button id="btnDeleteField" class="btn btn-primary item-action" disabled="disabled">Delete</button>
	</footer>


<div id="editFieldDialog" class="modal fade">
    <div class="modal-dialog modal-lg">
        <div class="modal-content">
            <div class="modal-header">
                <button class="close" data-dismiss="modal">&times;</button>
                <h4 id="lblEditFieldDialogTitle" class="modal-title"></h4>
            </div>
            <div class="modal-body">
				<form class="form-horizontal">
					<div class="form-group form-group-sm">
						<label for="lstFieldGroup" class="col-sm-3 control-label">Field Group:</label>
						<div class="col-sm-9">
							<select id="lstFieldGroup" class="form-control input-sm"></select>
						</div>
					</div>
					<div class="form-group form-group-sm">
						<label for="txtName" class="col-sm-3 control-label">Display Name:</label>
						<div class="col-sm-9">
							<input id="txtName" class="form-control input-sm" placeholder="Name to display in UI">
						</div>
					</div>
					<div class="form-group form-group-sm">
						<label for="txtIdentifier" class="col-sm-3 control-label">Identifier (slug):</label>
						<div class="col-sm-9">
							<input id="txtIdentifier" class="form-control input-sm" placeholder="Unique name"></input>
						</div>
					</div>
					<div class="form-group form-group-sm">
						<label for="lstFieldType" class="col-sm-3 control-label">Field Type:</label>
						<div class="col-sm-9">
							<select id="lstFieldType" class="form-control input-sm">
								<catdv:get path="fields/types">
									<option value="${type.ID}">${type.name}</option>
								</catdv:get>
							</select>
						</div>
					</div>
                    <div id="divData" class="form-group form-group-sm" style="display:none;">
                        <label id="lblData" for="txtData" class="col-sm-3 control-label"></label>
                        <div class="col-sm-9">
                            <textarea id="txtData" class="form-control input-sm" style="height:60px;" >
                            </textarea>
                            <i id="lblDataHelpText"></i>
                        </div>
                    </div>
					<div class="form-group form-group-sm">
						<label for="txtUserField" class="col-sm-3 control-label">User Field Number:</label>
						<div class="col-sm-9">
							<input id="txtUserField" class="form-control input-sm" placeholder="Not yet allocated" readonly="readonly"></input>
						</div>
					</div>
                    <div class="form-group form-group-sm">
                        <label for="txtDescription" class="col-sm-3 control-label">Description:</label>
                        <div class="col-sm-9">
                            <textarea id="txtDescription" class="form-control input-sm" rows="3"  style="height:60px;" ></textarea>
                        </div>
                    </div>
					<div class="form-group form-group-sm">
						<label for="chkEditable" class="col-sm-3 control-label">Editable:</label>
						<div class="col-sm-9">
							<div class="checkbox input-sm">
								<input id="chkEditable" type="checkbox"> User can edit this field
							</div>
						</div>
					</div>
					<div class="form-group form-group-sm">
						<label for="chkMandatory" class="col-sm-3 control-label">Mandatory:</label>
						<div class="col-sm-9">
							<div class="checkbox input-sm">
								<input id="chkMandatory" type="checkbox"> User must complete this field
							</div>
						</div>
					</div>
				</form>
			</div>
            <div class="modal-footer">
                <div id="chkEditLockedContainer" style="position:absolute"><input id="chkEditLocked" type="checkbox"> Edit locked fields</div>
                <button class="btn btn-primary btn-sm" data-dismiss="modal">Cancel</button>
                <button id="btnEditFieldOK" class="btn btn-primary btn-sm">OK</button>
            </div>
        </div>
    </div>
</div>


<div id="editListDialog" class="modal fade bs-modal-lg">
    <div class="modal-dialog  modal-lg">
        <div class="modal-content">
            <div class="modal-header">
                <button class="close" data-dismiss="modal">&times;</button>
                <h4 class="modal-title">Edit List</h4>
            </div>
            <div class="modal-body">
                <form role="form">
                    <div class="row">
                        <div class="col-md-8">
                                <div class="form-group">
                                    <label for="listValues">Values</label> <textarea
                                        id="listValues" class="form-control input-sm" rows="16" title="Enter one picklist item per line">
                                    </textarea>
                                </div>
                        </div>
                        <div class="col-md-4">
                            <br/>
                            <div class="checkbox">
                                <label title="Only administrators can add values to list"> <input type="checkbox" id="chkLocked"> Locked </label> 
                            </div>
                            <div class="checkbox">
                                <label> <input type="checkbox" id="chkExtensible"> Extensible </label> 
                            </div>
                            <div class="checkbox">
                                <label> <input type="checkbox" id="chkSaveValues"> Save values </label> 
                                </div>
                            <div class="checkbox">
                                <label> <input type="checkbox" id="chkKeepSorted"> Keep sorted </label>
                            </div>
                            <br/>
                            <button id="btnPopulate" type="button" class="btn btn-primary">Populate from Server</button>
                         </div>
                    </div>
                    <div id="divLinkedField" class="row" style="display:none;">
                        <div class="col-md-8">
                            <div class="form-group">
                                <label for="txtLinkedField">Linked Field</label> <input type="text" id="txtLinkedField" class="form-control  input-sm">
                            </div>
                        </div>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button class="btn btn-primary" data-dismiss="modal">Cancel</button>
                <button id="btnEditListOK" class="btn btn-primary">OK</button>
            </div>
        </div>
    </div>
</div>

<div id="mergeFieldsDialog" class="modal fade">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <button class="close" data-dismiss="modal">&times;</button>
                <h4 class="modal-title">Merge Fields</h4>
            </div>
            <div class="modal-body">
                <div class="form-group">
                    <label for="lstKeepField">Keep Field:</label> <select id="lstKeepField"
                        class="form-control input-sm">
                    </select>
                </div>
                <div class="form-group">
                    <label for="lstKeepField">Merge Field(s):</label>
                    <div id="lblMergeFields"></div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-primary btn-sm" data-dismiss="modal">Cancel</button>
                <button id="btnMergeFieldsOK" class="btn btn-primary btn-sm">Merge Fields</button>
            </div>
        </div>
    </div>
</div>

<div id="renumberUserFieldsDialog" class="modal fade">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <button class="close" data-dismiss="modal">&times;</button>
                <h4 class="modal-title">Re-order User Fields</h4>
            </div>
            <div class="modal-body">
                <div id="editFieldsSection">
                    <div class="row">
                         <div class="col-md-9">
                            <div class="form-group">
                                <label for="lstUserFields">User Fields</label> 
                                <div id="lstUserFields" class="form-control input-sm" style="height: 450px;"></div>                         
                            </div>
                         </div>
                         <div class="col-md-3" style="margin-top: 50px;">
                            <div class="form-group">
                                <button id="btnFieldUp" class="btn btn-default btn-sm" disabled="disabled"> Move Up</button>
                            </div>
                            <div class="form-group">
                                <button id="btnFieldDown" class="btn btn-default btn-sm" disabled="disabled"> Move Down</button>
                            </div>
                            <div class="form-group">
                                <button id="btnFieldInsert" class="btn btn-default btn-sm" disabled="disabled"> Insert Slot</button>
                            </div>
                            <div class="form-group">
                                <button id="btnFieldRemove" class="btn btn-default btn-sm" disabled="disabled">Remove Slot</button>
                            </div>
                        </div>
                    </div>
                </div>
             </div>
            <div class="modal-footer">
                <button class="btn btn-primary btn-sm" data-dismiss="modal">Cancel</button>
                <button id="btnReorderUserFieldsOK" class="btn btn-primary btn-sm">OK</button>
            </div>
        </div>
    </div>
</div>


</body>
</html>
