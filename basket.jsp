<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib uri="/WEB-INF/catdv.tld" prefix="catdv"%>
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>CatDV: Clip Basket</title>
<catdv:pageheader pageScript="js/ui/BasketPage.js" pageClass="ui.BasketPage" loginPage="login.jsp" emitSettings="true">
    <%@include file="headers.inc"%>
    <script type="text/javascript" src="js/ui/ServerCommandDialog.js"></script>
    <script type="text/javascript" src="js/logic/ServerCommands.js"></script>
    <script type="text/javascript" src="js/ui/panels/ClipMediaPanel.js"></script>
</catdv:pageheader>
</head>
<body>
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
<catdv:if isTrue="showLoginMenu">
                    <ul id="navbarLoginMenu" class="nav navbar-nav navbar-right"></ul>
</catdv:if>
                    <ul class="nav navbar-nav navbar-right">
                         ${settings.topNavLinks}
                    </ul>
                 </div>
            </nav>
        </header>

        <div class="content">
	        <h1>${settings.clipBasketLongAlias}</h1>
            <div id="basketItemsTable" class="adminList"></div>
        </div>

        <footer>
            <button id="btnDone" class="btn btn-primary">Back</button>          
            <button id="btnEmpty" class="btn btn-primary basket-action" disabled="disabled">Remove All</button>          
<catdv:if isTrue="canReorderClipBasket">
	        <button id="btnMoveUp" class="btn btn-primary item-action" disabled="disabled">
	            <span class="glyphicon glyphicon-play glyph-rotate-270"></span> Move Up
	        </button>
	        <button id="btnMoveDown" class="btn btn-primary item-action" disabled="disabled">
	            <span class="glyphicon glyphicon-play glyph-rotate-90"></span> Move Down
	        </button>
</catdv:if>
<catdv:if isTrue="canSaveClipBasket">
            <button id="btnSave" class="btn btn-primary basket-action" disabled="disabled">
                <span class="glyphicon glyphicon-save"></span> Save
            </button>
</catdv:if>
<catdv:if isTrue="canPlayClipBasket">
            <button id="btnPlay" class="btn btn-primary basket-action" disabled="disabled">
                <span class="glyphicon glyphicon-play"></span> Play
            </button>
</catdv:if>
<catdv:if isTrue="canDownloadClipBasket">
            <button id="btnDownload" class="btn btn-primary basket-action" disabled="disabled">
                <span class="glyphicon glyphicon-download"></span> Download
            </button>
</catdv:if>
         </footer>
    </div>

    <div id="serverCommandArgsDialog" style="display: none;" class="modal fade bs-modal-lg">
        <div class="modal-dialog  modal-lg">
            <div class="modal-content">
                <div class="modal-header">
                    <h4 id="svrCmdArgsDlg_lblTitle" class="modal-title"></h4>
                </div>
                <div id="svrCmdArgsDlg_divArguments" class="modal-body"></div>
                <div id="svrCmdArgsDlg_buttonPanel" class="modal-footer"></div>
            </div>
        </div>
    </div>
    
    <div id="saveAsClipListDialog" style="display: none;" class="modal fade">
	    <div class="modal-dialog">
	        <div class="modal-content">
	            <div class="modal-header">
	                <h4>Save as Clip List</h4>
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
	
   <div id="previewBasketClipsDialog" style="display: none;" class="modal fade">
       <div class="modal-dialog">
           <div class="modal-content">
               <div class="modal-header">
                   <h4 class="modal-title">Preview Clips</h4>
               </div>
               <div class="modal-body">
                    <div id="playerContainer">
                        <div id="previewClipsDialog_sequencePlayer" style="width: 568px;"></div>
                        <div id="previewClipsDialog_playerControls"></div>
                    </div>               </div>
               <div class="modal-footer">
                    <button id="previewClipsDialog_btnClose" class="btn btn-sm btn-primary">Close</button>
               </div>
           </div>
       </div>
   </div>
	

</body>
</html>