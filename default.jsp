<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib uri="/WEB-INF/catdv.tld" prefix="catdv"%>
<!DOCTYPE html>
<html class="fullPage" lang="en">
<head>
<meta charset="utf-8">
<title>CatDV: Server</title>

<catdv:pageheader pageScript="js/ui/DefaultPage.js" pageClass="ui.SearchPage" loginPage="login.jsp" emitSettings="true">
	<%@include file="headers.inc"%>
    <script type="text/javascript" src="js/logic/ServerCommands.js"></script>
	<script type="text/javascript" src="js/ui/panels/NavigatorPanel.js"></script>
	<script type="text/javascript" src="js/ui/panels/ClipsPanel.js"></script>
	<script type="text/javascript" src="js/ui/panels/SearchPanels.js"></script>
    <script type="text/javascript" src="js/ui/panels/ArgumentFormPanel.js"></script>
    <script type="text/javascript" src="js/ui/ServerCommandDialog.js"></script>
</catdv:pageheader>

</head>
<body>
	<div id="searchPage" class="fullPage">
		<div id="leftPanel">
			<a id="logo" href="${settings.parentSiteUrl}"></a>		
			<div id="navigatorPanel"></div>
	        <div id="infoPanel">${settings.infoMessage}</div>
		</div>
		<div id="mainPanel">
			<header>
				<nav class="navbar navbar-default" role="navigation">
					<div class="navbar-header">
						<button type="button" class="navbar-toggle" data-toggle="collapse" data-target="#bs-example-navbar-collapse-1">
							<span class="sr-only">Toggle navigation</span><span class="icon-bar"></span><span class="icon-bar"></span><span class="icon-bar"></span>
						</button>
					</div>

					<div class="collapse navbar-collapse top-nav" id="bs-example-navbar-collapse-1">
<catdv:if isTrue="showLoginMenu">
						<ul id="navbarLoginMenu" class="nav navbar-nav navbar-right"></ul>
</catdv:if>
 						<ul class="nav navbar-nav navbar-right">
                            ${settings.topNavLinks}
<catdv:if isTrue="canUploadMedia">
							<li><a href="#" id='btnFileUpload'>Upload Files</a></li>
</catdv:if>
<catdv:if isTrue="canAddToClipBasket">
                            <li><a href="basket.jsp" id='btnClipBasket'>${settings.clipBasketLongAlias}<span id="numBasketItemsBadge" class="badge"></span></a></li>
</catdv:if>
<catdv:if isTrue="canRunServerCommands">
                            <li id="menuServerCommands" class="dropdown" style="display:none;">
                                <a href="#" class="dropdown-toggle" data-toggle="dropdown">Tools<strong class="catdvicon catdvicon-pulldown_arrow"></strong></a>
                                <ul class="dropdown-menu"></ul>
                            </li>
</catdv:if>
<catdv:if isTrue="hasAdmin">
                            <li><a href="admin/default.jsp" >Admin</a></li>
</catdv:if>
						</ul>
					</div>
				</nav>
			</header>

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
			    <div class="pull-left">
	                <button id="btnSelectMode" class="btn btn-primary">
	                    <span class="glyphicon glyphicon-ok-circle"> </span> Select
	                </button>
                    <button id="btnSelectAll" class="btn btn-primary" style="display:none;">
                        <span class="glyphicon glyphicon-ok-circle"> </span> Select All
                    </button>
                    <button id="btnCancelSelect" class="btn btn-primary" style="display:none;">
                        <span class="glyphicon glyphicon-remove-circle"> </span> Cancel
                    </button>
			    </div>
			    
				<button type="button" class="btn btn-primary hamburger-menu item-action" data-toggle="collapse" data-target="#action-buttons">
				    <div><span class="icon-bar"></span><span class="icon-bar"></span><span class="icon-bar"></span></div> Actions
				</button>
			    
                <ul id="action-buttons" class="action-buttons collapse">
<catdv:if isTrue="canEditClipLists">
                 <li><a id="btnRemoveClip" class="btn btn-primary item-action" style="display:none;">
                        <span class="glyphicon glyphicon-remove"> </span> Remove
                 </a></li>                  
</catdv:if>
<catdv:if isTrue="canEditClipLists">
	             <li><a id="btnAddToList" class="btn btn-primary item-action">
	                    <span class="glyphicon glyphicon-plus-sign"> </span> Add to ${settings.clipListAlias}
	             </a></li>	                
</catdv:if>               
<catdv:if isTrue="canAddToClipBasket">
	             <li><a id="btnAddToBasket" class="btn btn-primary item-action">
	                    <span class="glyphicon glyphicon-plus-sign"> </span> Add to ${settings.clipBasketShortAlias}
                 </a></li>                  
</catdv:if>
<catdv:if isTrue="canEditMultipleClips">
	             <li><a id="btnEditClips" class="btn btn-primary item-action">
	                    <span class="glyphicon glyphicon-edit"> </span> Edit Clips
                 </a></li>                  
</catdv:if>
<catdv:if isTrue="canEditSequences">
				 <li><a id="btnCreateSequence" class="btn btn-primary item-action">
						<span class="glyphicon glyphicon-film"> </span> New Sequence
                 </a></li>                  
</catdv:if>
<catdv:if isTrue="canDeleteClips">
				<li><a id="btnDeleteClip" class="btn btn-primary item-action">
						<span class="glyphicon glyphicon-remove"> </span> Delete
                 </a></li>                  
</catdv:if>
<catdv:if isTrue="canExportAsXML">
				 <li><a id="btnFCPExport" class="btn btn-primary item-action">
						<span class="glyphicon glyphicon-share"> </span> Export
                 </a></li>                  
</catdv:if>
                </ul>
			</footer>
		</div>
	</div>

<catdv:if isTrue="canEditSequences">
	<div id="createSequenceDialog" style="display: none;" class="modal fade bs-modal-lg">
		<div class="modal-dialog  modal-lg">
			<div class="modal-content">
				<div class="modal-header">
					<h4 class="modal-title">Create Sequence</h4>
				</div>
				<div class="modal-body">
					<form role="form">
						<div class="form-group">
							<label for="txtName">Name:</label> <input id="txtSequenceName" class="form-control"></input>
						</div>
						<div class="radio">
							<label> <input type="radio" name="sequenceOptions" checked="checked" id="rdoUseSelection"> Use the selection within each clip.
							</label>
						</div>
						<div class="radio">
							<label> <input type="radio" name="sequenceOptions" id="rdoUseWholeClip"> Use the whole of each clip.
							</label>
						</div>
					</form>
				</div>
				<div class="modal-footer">
					<button class="btn btn-sm btn-primary" data-dismiss="modal">Cancel</button>
					<button id="btnCreateSequenceDialogOK" class="btn btn-sm btn-primary">OK</button>
				</div>
			</div>
		</div>
	</div>
</catdv:if>

<catdv:if isTrue="isEnterprise">
	<div id="smartFolderDialog" style="display: none;" class="modal fade bs-modal-lg">
		<div class="modal-dialog  modal-lg">
			<div class="modal-content">
				<div class="modal-header">
					<h4 id="lblSmartFolderName"></h4>
				</div>
				<div class="modal-body">
				    <div class="row">
                        <div class="form-group col-md-7">
                            <label for="txtSmartFolderName">Name:</label> <input id="txtSmartFolderName" type="text" class="form-control input-sm" placeholder="Smart Folder Name"></input>
                        </div>
                        <div class="form-group col-md-5">
                            <label for="selectSmartFolderGroup">Group:</label> 
                            <select id="selectSmartFolderGroup" class="form-control input-sm">
                            <catdv:get path="groups">
                                <option value="${group.ID}">${group.name}</option>
                            </catdv:get>
                            </select>
                        </div>
				    </div>
					<div id="smartFolderQueryBuilder"></div>
				</div>
				<div class="modal-footer">
					<button class="btn btn-sm btn-primary" data-dismiss="modal">Cancel</button>
					<button id="btnSmartFolderDialogOK" class="btn btn-sm btn-primary">OK</button>
				</div>
			</div>
		</div>
	</div>
</catdv:if>

<catdv:if isTrue="isEnterprise">
	<div id="clipListDialog" style="display: none;" class="modal fade">
	    <div class="modal-dialog">
	        <div class="modal-content">
	            <div class="modal-header">
	                <h4 id="lblClipListName"></h4>
	            </div>
	            <div class="modal-body">
	                    <div class="form-group">
	                        <label for="txtClipListName">Name:</label> 
	                        <input id="txtClipListName" type="text" class="form-control input-sm" placeholder="Clip List Name"></input>
	                    </div>
	                    <div class="form-group">
	                        <label for="selectClipListGroup">Group:</label> 
	                        <select id="selectClipListGroup" class="form-control input-sm">
	                        <catdv:get path="groups">
	                            <option value="${group.ID}">${group.name}</option>
	                        </catdv:get>
	                        </select>
	                    </div>
	            </div>
	            <div class="modal-footer">
	                <button class="btn btn-sm btn-primary" data-dismiss="modal">Cancel</button>
	                <button id="btnClipListDialogOK" class="btn btn-sm btn-primary">OK</button>
	            </div>
	        </div>
	    </div>
	</div>
</catdv:if>

<catdv:if isTrue="isEnterprise">
	<div id="addToClipListDialog" style="display: none;" class="modal fade">
	    <div class="modal-dialog">
	        <div class="modal-content">
	            <div class="modal-header">
	                <h4>Add to Clip List</h4>
	            </div>
	            <div class="modal-body">
                        <div class="radio">
                            <label> <input type="radio" name="newOrExistingClipList" checked="checked" id="rdoCreateClipList"> Create a new clip list.
                            </label>
                        </div>
 	                    <div class="form-group">
                            <label for="txtNewClipListName">Name:</label> 
                            <input id="txtNewClipListName" type="text" class="form-control input-sm" placeholder="Clip List Name"></input>
                        </div>
                       <div class="radio">
                            <label> <input type="radio" name="newOrExistingClipList" id="rdoAddToClipList"> Add clip to existing clip list.
                            </label>
                        </div>
                        <div class="form-group">
                            <div id="treeAddToClipList" class="form-control" style="height:250px;"></div>
                        </div>
	             </div>
	            <div class="modal-footer">
	                <button class="btn btn-sm btn-primary" data-dismiss="modal">Cancel</button>
	                <button id="btnAddToClipListDialogOK" class="btn btn-sm btn-primary">OK</button>
	            </div>
	        </div>
	    </div>
	</div>
</catdv:if>

<catdv:if isTrue="isEnterprise">
	<div id="serverCommandArgsDialog" style="display: none;" class="modal fade">
		<div class="modal-dialog">
			<div class="modal-content">
				<div class="modal-header">
					<h4 id="svrCmdArgsDlg_lblTitle" class="modal-title"></h4>
				</div>
				<div id="svrCmdArgsDlg_divArguments" class="modal-body"></div>
				<div id="svrCmdArgsDlg_buttonPanel" class="modal-footer"></div>
			</div>
		</div>
	</div>
</catdv:if>

</body>
</html>