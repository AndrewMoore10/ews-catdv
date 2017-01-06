var catdv;
(function (catdv) {
    // Set by PageHeader tag
    catdv.API_URL = null;
    catdv.edition = null;
    catdv.settings = null;
    catdv.session = null;
    catdv.loggedInUser = null;
    catdv.loggedInUserID = null;
    var _RestApi = (function () {
        function _RestApi() {
        }
        _RestApi.prototype.getApiUrl = function (path) {
            var apiUrl = ((typeof (catdv.API_URL) != "undefined") && (catdv.API_URL != null)) ? catdv.API_URL : "/catdv/api";
            var apiVersion = 7;
            return apiUrl + "/" + apiVersion + "/" + path;
        };
        _RestApi.prototype.registerLogInHandler = function (login_handler) {
            this.catdv_login_handler = login_handler;
        };
        _RestApi.prototype.getSessionKey = function (success_callback, failure_callback) {
            this.api_get("session/key", {}, success_callback, failure_callback);
        };
        _RestApi.prototype.getSession = function (success_callback, failure_callback) {
            this.api_get("session", {}, success_callback, failure_callback);
        };
        _RestApi.prototype.login = function (username, encryptedPassword, success_callback, failure_callback) {
            this.api_call("POST", "session", {
                username: username,
                encryptedPassword: encryptedPassword
            }, success_callback, failure_callback);
        };
        _RestApi.prototype.logout = function (success_callback, failure_callback) {
            this.api_call('DELETE', "session", {}, success_callback, failure_callback);
        };
        _RestApi.prototype.getInfo = function (infoSet, success_callback, failure_callback) {
            this.api_get("info" + (infoSet ? "/" + infoSet : ""), { "details": true }, success_callback, failure_callback);
        };
        _RestApi.prototype.getServerProperty = function (propertyName, success_callback, failure_callback) {
            this.api_get("info/properties/" + propertyName, {}, success_callback, failure_callback);
        };
        _RestApi.prototype.getServerProperties = function (propertyNames, success_callback, failure_callback) {
            this.api_get("info/properties/[" + propertyNames.join(",") + "]", {}, success_callback, failure_callback);
        };
        _RestApi.prototype.addToBasket = function (clipIds, success_callback, failure_callback) {
            this.api_call("POST", "basket", { clipIds: clipIds }, success_callback, failure_callback);
        };
        _RestApi.prototype.updateBasketItems = function (items, success_callback, failure_callback) {
            this.api_call("PUT", "basket", items, success_callback, failure_callback);
        };
        _RestApi.prototype.removeFromBasket = function (clipIds, success_callback, failure_callback) {
            this.api_call("DELETE", "basket/[" + clipIds.join() + "]", {}, success_callback, failure_callback);
        };
        _RestApi.prototype.getBasketItems = function (success_callback, failure_callback) {
            this.api_get("basket", {}, success_callback, failure_callback);
        };
        _RestApi.prototype.getNumBasketItems = function (success_callback, failure_callback) {
            this.api_get("basket?count=true", {}, success_callback, failure_callback);
        };
        _RestApi.prototype.isItemInBasket = function (clipId, success_callback, failure_callback) {
            this.api_get("basket?clipId=" + clipId + "&count=true", {}, function (count) { success_callback(count > 0); }, failure_callback);
        };
        _RestApi.prototype.getBasketActions = function (success_callback, failure_callback) {
            this.api_get("basket/actions", {}, success_callback, failure_callback);
        };
        _RestApi.prototype.performBasketAction = function (actionId, success_callback, failure_callback) {
            this.api_call("POST", "basket/actions/" + actionId, {}, success_callback, failure_callback);
        };
        _RestApi.prototype.getCatalogs = function (success_callback, failure_callback) {
            this.api_get("catalogs", null, success_callback, failure_callback);
        };
        _RestApi.prototype.getCatalogsBasicInfo = function (success_callback, failure_callback) {
            this.api_get("catalogs", { "include": "onlyBasicInfo" }, success_callback, failure_callback);
        };
        _RestApi.prototype.findCatalogs = function (params, success_callback, failure_callback) {
            this.api_get("catalogs", params, success_callback, failure_callback);
        };
        _RestApi.prototype.getClips = function (params, success_callback, failure_callback) {
            this.api_get("clips", params, success_callback, failure_callback);
        };
        _RestApi.prototype.exportClipsAsFcpXml = function (query, success_callback, failure_callback) {
            this.api_get("clips", $.extend({ "fmt": "fcpxml" }, query), success_callback, failure_callback);
        };
        _RestApi.prototype.getClip = function (clipId, success_callback, failure_callback) {
            this.api_get("clips/" + clipId, { include: "proxyPath" }, success_callback, failure_callback);
        };
        _RestApi.prototype.saveClip = function (clip, success_callback, failure_callback) {
            if (!clip.ID) {
                this.api_call('POST', "clips", clip, success_callback, failure_callback);
            }
            else {
                this.api_call('PUT', "clips/" + clip.ID, clip, success_callback, failure_callback);
            }
        };
        _RestApi.prototype.saveClips = function (clips, success_callback, failure_callback) {
            this.api_call('PUT', "clips", clips, success_callback, failure_callback);
        };
        _RestApi.prototype.deleteClip = function (clipID, success_callback, failure_callback) {
            this.api_call("DELETE", "clips/" + clipID, {}, success_callback, failure_callback);
        };
        _RestApi.prototype.getClipFilters = function (query, success_callback, failure_callback) {
            this.api_get("clips/filters", query, success_callback, failure_callback);
        };
        _RestApi.prototype.getClipLists = function (success_callback, failure_callback) {
            this.api_get("cliplists", null, success_callback, failure_callback);
        };
        _RestApi.prototype.addToClipList = function (clipListID, clipIDs, success_callback, failure_callback) {
            this.api_call('POST', "cliplists/" + clipListID + "/clips", clipIDs, success_callback, failure_callback);
        };
        _RestApi.prototype.removeFromClipList = function (clipListID, clipIDs, success_callback, failure_callback) {
            this.api_call("DELETE", "cliplists/" + clipListID + "/clips", clipIDs, success_callback, failure_callback);
        };
        _RestApi.prototype.saveClipList = function (clipList, success_callback, failure_callback) {
            if (!clipList.ID) {
                this.api_call('POST', "cliplists", clipList, success_callback, failure_callback);
            }
            else {
                this.api_call('PUT', "cliplists/" + clipList.ID, clipList, success_callback, failure_callback);
            }
        };
        _RestApi.prototype.deleteClipList = function (clipListID, success_callback, failure_callback) {
            this.api_call("DELETE", "cliplists/" + clipListID, {}, success_callback, failure_callback);
        };
        _RestApi.prototype.getFields = function (params, success_callback, failure_callback) {
            this.api_get("fields", params, success_callback, failure_callback);
        };
        _RestApi.prototype.getFieldDefinition = function (fieldDefID, success_callback, failure_callback) {
            this.api_get("fields/" + fieldDefID, {}, success_callback, failure_callback);
        };
        _RestApi.prototype.getFieldUsage = function (fieldDefID, params, success_callback, failure_callback) {
            this.api_get("fields/" + fieldDefID + "/usage", params, success_callback, failure_callback);
        };
        _RestApi.prototype.getFieldValues = function (field, success_callback, failure_callback) {
            this.api_get("fields/" + field + "/values", {}, success_callback, failure_callback);
        };
        _RestApi.prototype.getFieldListValues = function (field, success_callback, failure_callback) {
            this.api_get("fields/" + field + "/list/values", {}, success_callback, failure_callback);
        };
        _RestApi.prototype.saveField = function (field, success_callback, failure_callback) {
            if (!field.ID) {
                this.api_call('POST', "fields", field, success_callback, failure_callback);
            }
            else {
                this.api_call('PUT', "fields/" + field.ID, field, success_callback, failure_callback);
            }
        };
        _RestApi.prototype.mergeFields = function (keepFieldDefID, mergeFieldDefIDs, success_callback, failure_callback) {
            this.api_call("PUT", "fields/" + keepFieldDefID, { "mergeWith": mergeFieldDefIDs }, success_callback, failure_callback);
        };
        _RestApi.prototype.demergeFields = function (oldFieldDefID, newFieldDefID, groupIDs, success_callback, failure_callback) {
            this.api_call("PUT", "fields/" + oldFieldDefID, { "demergeTo": newFieldDefID, "forGroupIDs": groupIDs }, success_callback, failure_callback);
        };
        _RestApi.prototype.deleteField = function (fieldDefID, success_callback, failure_callback) {
            this.api_call("DELETE", "fields/" + fieldDefID, {}, success_callback, failure_callback);
        };
        _RestApi.prototype.getFieldGroups = function (params, success_callback, failure_callback) {
            this.api_get("fieldGroups", params, success_callback, failure_callback);
        };
        _RestApi.prototype.getFieldGroup = function (fieldGroupID, success_callback, failure_callback) {
            this.api_get("fieldGroups/" + fieldGroupID, {}, success_callback, failure_callback);
        };
        _RestApi.prototype.saveFieldGroup = function (fieldGroup, success_callback, failure_callback) {
            if (!fieldGroup.ID) {
                this.api_call('POST', "fieldGroups", fieldGroup, success_callback, failure_callback);
            }
            else {
                this.api_call('PUT', "fieldGroups/" + fieldGroup.ID, fieldGroup, success_callback, failure_callback);
            }
        };
        _RestApi.prototype.deleteFieldGroup = function (fieldGroupDefID, success_callback, failure_callback) {
            this.api_call("DELETE", "fieldGroups/" + fieldGroupDefID, {}, success_callback, failure_callback);
        };
        _RestApi.prototype.reorderUserFields = function (userFieldChanges, success_callback, failure_callback) {
            this.api_call("PUT", "fields/userfieldindexes", userFieldChanges, success_callback, failure_callback);
        };
        _RestApi.prototype.getFormSetsWithForms = function (success_callback, failure_callback) {
            this.api_get("formsets?include=forms,visibility", {}, success_callback, failure_callback);
        };
        _RestApi.prototype.getFormDefinition = function (formID, formType, success_callback, failure_callback) {
            this.api_get("forms/" + formID, { "formType": formType, "include": "fields,fieldDefs,picklists,values" }, success_callback, failure_callback);
        };
        _RestApi.prototype.saveForm = function (form, success_callback, failure_callback) {
            if (!form.ID) {
                this.api_call('POST', "forms", form, success_callback, failure_callback);
            }
            else {
                this.api_call('PUT', "forms/" + form.ID, form, success_callback, failure_callback);
            }
        };
        _RestApi.prototype.getGroups = function (params, success_callback, failure_callback) {
            this.api_get("groups", params, success_callback, failure_callback);
        };
        _RestApi.prototype.saveGroup = function (group, success_callback, failure_callback) {
            if ((group.ID == null) || (group.ID == -1)) {
                this.api_call('POST', "groups", group, success_callback, failure_callback);
            }
            else {
                this.api_call('PUT', "groups/" + group.ID, group, success_callback, failure_callback);
            }
        };
        _RestApi.prototype.deleteGroup = function (groupID, success_callback, failure_callback) {
            this.api_call("DELETE", "groups/" + groupID, {}, success_callback, failure_callback);
        };
        _RestApi.prototype.getGroupRolePermissions = function (groupID, success_callback, failure_callback) {
            this.api_get("groups/" + groupID + "/roles?allRoles=true", {}, success_callback, failure_callback);
        };
        _RestApi.prototype.updateGroupRolePermissions = function (groupID, roles, success_callback, failure_callback) {
            this.api_call('PUT', "groups/" + groupID + "/roles", roles, success_callback, failure_callback);
        };
        _RestApi.prototype.getServices = function (success_callback, failure_callback) {
            this.api_get("services", {}, success_callback, failure_callback);
        };
        _RestApi.prototype.getJobs = function (params, success_callback, failure_callback) {
            this.api_get("jobs", params, success_callback, failure_callback);
        };
        _RestApi.prototype.getJob = function (jobID, success_callback, failure_callback) {
            this.api_get("jobs/" + jobID, { "include": "formattedData" }, success_callback, failure_callback);
        };
        _RestApi.prototype.getJobResults = function (jobID, params, success_callback, failure_callback) {
            this.api_get("jobs/" + jobID + "/results", params, success_callback, failure_callback);
        };
        _RestApi.prototype.getLogEntries = function (params, success_callback, failure_callback) {
            this.api_get("auditlog", params, success_callback, failure_callback);
        };
        _RestApi.prototype.getMediaStores = function (success_callback, failure_callback) {
            this.api_get("mediastores", null, success_callback, failure_callback);
        };
        _RestApi.prototype.saveMediaStore = function (mediaStore, success_callback, failure_callback) {
            if (!mediaStore.ID) {
                this.api_call('POST', "mediastores", mediaStore, success_callback, failure_callback);
            }
            else {
                this.api_call('PUT', "mediastores/" + mediaStore.ID, mediaStore, success_callback, failure_callback);
            }
        };
        _RestApi.prototype.saveMediaPath = function (mediaPath, success_callback, failure_callback) {
            if (!mediaPath.ID) {
                this.api_call('POST', "mediastores/" + mediaPath.mediaStoreID + "/paths", mediaPath, success_callback, failure_callback);
            }
            else {
                this.api_call('PUT', "mediastores/" + mediaPath.mediaStoreID + "/paths/" + mediaPath.ID, mediaPath, success_callback, failure_callback);
            }
        };
        _RestApi.prototype.getMediaStore_MediaTypes = function (success_callback, failure_callback) {
            this.api_get("info/mediastore/mediatypes", null, success_callback, failure_callback);
        };
        _RestApi.prototype.getMediaStore_PathTargets = function (success_callback, failure_callback) {
            this.api_get("info/mediastore/targets", null, success_callback, failure_callback);
        };
        _RestApi.prototype.deleteMediaStore = function (mediastoreID, success_callback, failure_callback) {
            this.api_call("DELETE", "mediastores/" + mediastoreID, {}, success_callback, failure_callback);
        };
        _RestApi.prototype.deleteMediaPath = function (mediastoreID, mediastorePathID, success_callback, failure_callback) {
            this.api_call("DELETE", "mediastores/" + mediastoreID + "/paths/" + mediastorePathID, {}, success_callback, failure_callback);
        };
        _RestApi.prototype.getPanelDefinitions = function (groupID, success_callback, failure_callback) {
            this.api_get("panels", { "groupID": groupID, "include": "builtin,fields,fieldDefs,picklists,values" }, success_callback, failure_callback);
        };
        _RestApi.prototype.getSharedLinkPanelDefinitions = function (linkUID, success_callback, failure_callback) {
            this.api_get("panels/" + linkUID, { "include": "builtin,fields,fieldDefs,picklists,values" }, success_callback, failure_callback);
        };
        _RestApi.prototype.getPanelFields = function (panelDefID, success_callback, failure_callback) {
            this.api_get("panels/" + panelDefID + "/fields", {}, success_callback, failure_callback);
        };
        _RestApi.prototype.getPanelSetsWithPanels = function (success_callback, failure_callback) {
            this.api_get("panelsets?include=panels,visibility", {}, success_callback, failure_callback);
        };
        _RestApi.prototype.savePanel = function (panel, success_callback, failure_callback) {
            if (!panel.ID) {
                this.api_call('POST', "panels", panel, success_callback, failure_callback);
            }
            else {
                this.api_call('PUT', "panels/" + panel.ID, panel, success_callback, failure_callback);
            }
        };
        _RestApi.prototype.getPicklist = function (fieldID, success_callback, failure_callback) {
            this.api_get("fields/" + fieldID + "/list?include=values", {}, success_callback, failure_callback);
        };
        _RestApi.prototype.updatePicklist = function (fieldID, picklist, success_callback, failure_callback) {
            this.api_call("PUT", "fields/" + fieldID + "/list", picklist, success_callback, failure_callback);
        };
        _RestApi.prototype.getRoles = function (params, success_callback, failure_callback) {
            this.api_get("roles", params, success_callback, failure_callback);
        };
        _RestApi.prototype.saveRole = function (role, success_callback, failure_callback) {
            if (!role.ID) {
                this.api_call('POST', "roles", role, success_callback, failure_callback);
            }
            else {
                this.api_call('PUT', "roles/" + role.ID, role, success_callback, failure_callback);
            }
        };
        _RestApi.prototype.deleteRole = function (roleID, success_callback, failure_callback) {
            this.api_call("DELETE", "roles/" + roleID, {}, success_callback, failure_callback);
        };
        _RestApi.prototype.getRoleGroupPermissions = function (roleID, success_callback, failure_callback) {
            this.api_get("roles/" + roleID + "/groups?allGroups=true", {}, success_callback, failure_callback);
        };
        _RestApi.prototype.updateRoleGroupPermissions = function (roleID, groups, success_callback, failure_callback) {
            this.api_call('PUT', "roles/" + roleID + "/groups", groups, success_callback, failure_callback);
        };
        _RestApi.prototype.getSharedLinks = function (params, success_callback, failure_callback) {
            this.api_get("sharedLinks", params, success_callback, failure_callback);
        };
        _RestApi.prototype.getSharedLink = function (sharedLinkID, success_callback, failure_callback) {
            this.api_get("sharedLinks/" + sharedLinkID, null, success_callback, failure_callback);
        };
        _RestApi.prototype.createSharedLink = function (sharedLink, success_callback, failure_callback) {
            this.api_call('POST', "sharedLinks", sharedLink, success_callback, failure_callback);
        };
        _RestApi.prototype.updateSharedLink = function (sharedLink, success_callback, failure_callback) {
            this.api_call('PUT', "sharedLinks/" + sharedLink.ID, sharedLink, success_callback, failure_callback);
        };
        _RestApi.prototype.deleteSharedLink = function (sharedLinkID, success_callback, failure_callback) {
            this.api_call("DELETE", "sharedLinks/" + sharedLinkID, {}, success_callback, failure_callback);
        };
        _RestApi.prototype.getSmartFolders = function (success_callback, failure_callback) {
            this.api_get("smartfolders", null, success_callback, failure_callback);
        };
        _RestApi.prototype.saveSmartFolder = function (smartFolder, success_callback, failure_callback) {
            if (!smartFolder.ID) {
                this.api_call('POST', "smartFolders", smartFolder, success_callback, failure_callback);
            }
            else {
                this.api_call('PUT', "smartFolders/" + smartFolder.ID, smartFolder, success_callback, failure_callback);
            }
        };
        _RestApi.prototype.deleteSmartFolder = function (smartFolderID, success_callback, failure_callback) {
            this.api_call("DELETE", "smartFolders/" + smartFolderID, {}, success_callback, failure_callback);
        };
        _RestApi.prototype.setServerProperties = function (propertySet, success_callback, failure_callback) {
            this.api_call('PUT', "info/properties", propertySet, success_callback, failure_callback);
        };
        _RestApi.prototype.getSuggestions = function (prefix, success_callback, failure_callback) {
            this.api_get("suggest", { "prefix": prefix }, success_callback, failure_callback);
        };
        _RestApi.prototype.getThemeSchema = function (success_callback, failure_callback) {
            this.api_get("themes/schema", {}, success_callback, failure_callback);
        };
        _RestApi.prototype.getThemes = function (success_callback, failure_callback) {
            this.api_get("themes", {}, success_callback, failure_callback);
        };
        _RestApi.prototype.getTheme = function (theme, success_callback, failure_callback) {
            this.api_get("themes/" + theme, {}, success_callback, failure_callback);
        };
        _RestApi.prototype.createTheme = function (webTheme, success_callback, failure_callback) {
            this.api_call('POST', "themes", webTheme, success_callback, failure_callback);
        };
        _RestApi.prototype.updateTheme = function (webTheme, success_callback, failure_callback) {
            this.api_call('PUT', "themes/" + webTheme.name, webTheme, success_callback, failure_callback);
        };
        _RestApi.prototype.deleteTheme = function (themeName, success_callback, failure_callback) {
            this.api_call('DELETE', "themes/" + themeName, {}, success_callback, failure_callback);
        };
        _RestApi.prototype.getThumbnailsForMedia = function (mediaID, success_callback, failure_callback) {
            this.api_get("sourcemedia/" + mediaID + "/thumbnails", null, success_callback, failure_callback);
        };
        _RestApi.prototype.initiateUpload = function (filename, fileSize, metadata, success_callback, failure_callback) {
            this.api_call('POST', "uploads", { "filename": filename, "fileSize": fileSize, "metadata": metadata }, success_callback, failure_callback);
        };
        _RestApi.prototype.getUsers = function (params, success_callback, failure_callback) {
            this.api_get("users", params, success_callback, failure_callback);
        };
        _RestApi.prototype.getUser = function (userID, success_callback, failure_callback) {
            this.api_get("users/" + userID, {}, success_callback, failure_callback);
        };
        _RestApi.prototype.insertUser = function (user, success_callback, failure_callback) {
            this.api_call('POST', "users", user, success_callback, failure_callback);
        };
        _RestApi.prototype.updateUser = function (user, success_callback, failure_callback) {
            this.api_call('PUT', "users/" + user.ID, user, success_callback, failure_callback);
        };
        _RestApi.prototype.deleteUser = function (userID, success_callback, failure_callback) {
            this.api_call("DELETE", "users/" + userID, {}, success_callback, failure_callback);
        };
        _RestApi.prototype.getViewSetsWithViews = function (success_callback, failure_callback) {
            this.api_get("viewsets?include=views,visibility", {}, success_callback, failure_callback);
        };
        _RestApi.prototype.saveViewSet = function (viewType, viewSet, success_callback, failure_callback) {
            var endpoint = viewType + "sets"; // viewsets or panelsets
            if (!viewSet.ID) {
                this.api_call('POST', endpoint, viewSet, success_callback, failure_callback);
            }
            else {
                this.api_call('PUT', endpoint + "/" + viewSet.ID, viewSet, success_callback, failure_callback);
            }
        };
        _RestApi.prototype.deleteViewSet = function (viewSetID, success_callback, failure_callback) {
            this.api_call("DELETE", "viewsets/" + viewSetID, {}, success_callback, failure_callback);
        };
        _RestApi.prototype.getViewDefinitions = function (success_callback, failure_callback) {
            this.api_get("views?include=fields,fieldDefs", {}, success_callback, failure_callback);
        };
        _RestApi.prototype.getViewFields = function (viewType, viewDefID, success_callback, failure_callback) {
            var endpoint = viewType + "s"; // views, panels or forms
            this.api_get(endpoint + "/" + viewDefID + "/fields", {}, success_callback, failure_callback);
        };
        _RestApi.prototype.saveView = function (viewType, view, success_callback, failure_callback) {
            var endpoint = viewType + "s"; // views, panels or forms
            if (!view.ID) {
                this.api_call('POST', endpoint, view, success_callback, failure_callback);
            }
            else {
                this.api_call('PUT', endpoint + "/" + view.ID, view, success_callback, failure_callback);
            }
        };
        _RestApi.prototype.deleteView = function (viewID, success_callback, failure_callback) {
            this.api_call("DELETE", "views/" + viewID, {}, success_callback, failure_callback);
        };
        _RestApi.prototype.getWebWorkspaces = function (success_callback, failure_callback) {
            this.api_get("web-workspaces", {}, success_callback, failure_callback);
        };
        _RestApi.prototype.getWebWorkspaceSchema = function (success_callback, failure_callback) {
            this.api_get("web-workspaces/schema", {}, success_callback, failure_callback);
        };
        _RestApi.prototype.saveWebWorkspace = function (settings, success_callback, failure_callback) {
            if (!settings.ID) {
                this.api_call('POST', "web-workspaces", settings, success_callback, failure_callback);
            }
            else {
                this.api_call('PUT', "web-workspaces/" + settings.ID, settings, success_callback, failure_callback);
            }
        };
        _RestApi.prototype.deleteWebWorkspace = function (settingsID, success_callback, failure_callback) {
            this.api_call("DELETE", "web-workspaces/" + settingsID, {}, success_callback, failure_callback);
        };
        _RestApi.prototype.getServerCommands = function (success_callback, failure_callback) {
            this.api_get("commands", {}, success_callback, failure_callback);
        };
        _RestApi.prototype.getArgumentForm = function (commandID, commandName, success_callback, failure_callback) {
            var selector = commandID != null ? String(commandID) : "chained";
            this.api_get("commands/" + selector + "/argumentForm", { "commandName": commandName }, success_callback, failure_callback);
        };
        _RestApi.prototype.processServerCommandEvent = function (commandID, commandParams, success_callback, failure_callback) {
            var selector = commandID != null ? String(commandID) : "chained";
            this.api_call("POST", "commands/" + selector + "/events", commandParams, success_callback, failure_callback);
        };
        _RestApi.prototype.execServerCommand = function (commandID, commandParams, success_callback, failure_callback) {
            var selector = commandID != null ? String(commandID) : "chained";
            this.api_call("POST", "commands/" + selector, commandParams, success_callback, failure_callback);
        };
        _RestApi.prototype.api_get = function (path, data, success_callback, failure_callback) {
            var _this = this;
            try {
                $.ajax({
                    type: "GET",
                    url: this.getApiUrl(path),
                    headers: {
                        "CatDV-Client": "WEB.2"
                    },
                    data: data,
                    success: function (reply) {
                        _this.handle_response(reply, success_callback, failure_callback);
                    },
                    error: function (jqXHR, textStatus, errorThrown) {
                        _this.handle_failure(jqXHR, failure_callback);
                    }
                });
            }
            catch (e) {
                if (failure_callback != null) {
                    failure_callback("ERR", e, e);
                }
                else if ((e == "NoHost") && (this.catdv_login_handler != null)) {
                    this.catdv_login_handler("AUTH", "Not Initialised", null);
                }
                else {
                    alert("EX:" + e + "\n[" + path + "]");
                }
            }
        };
        _RestApi.prototype.api_call = function (method, path, data, success_callback, failure_callback) {
            var _this = this;
            try {
                $.ajax({
                    type: method,
                    url: this.getApiUrl(path),
                    headers: {
                        "CatDV-Client": "WEB.2"
                    },
                    contentType: "application/json; charset=UTF-8",
                    data: JSON.stringify(data),
                    success: function (reply) {
                        _this.handle_response(reply, success_callback, failure_callback);
                    },
                    error: function (jqXHR, textStatus, errorThrown) {
                        _this.handle_failure(jqXHR, failure_callback);
                    }
                });
            }
            catch (e) {
                if (failure_callback != null) {
                    failure_callback("ERR", e, e);
                }
                else if ((e == "NoHost") && (this.catdv_login_handler != null)) {
                    this.catdv_login_handler("AUTH", "Not Initialised", null);
                }
                else {
                    alert("EX:" + e + "\n[" + path + "]");
                }
            }
        };
        _RestApi.prototype.now = function () {
            return new Date().getTime();
        };
        _RestApi.prototype.handle_response = function (reply, success_callback, failure_callback) {
            if ((typeof Document != "undefined") && reply instanceof Document) {
                // Handle raw XML response - used by FCP XML export
                success_callback((new XMLSerializer()).serializeToString(reply));
            }
            else if (reply.status == "OK") {
                success_callback(reply.data);
            }
            else if (((reply.status == "AUTH") || (reply.status == "BUSY")) && (this.catdv_login_handler != null)) {
                this.catdv_login_handler(reply.status, reply.errorMessage, reply.data);
            }
            else {
                if (failure_callback) {
                    failure_callback(reply.status, reply.errorMessage, reply.data);
                }
                else {
                    controls.MessageBox.alert(reply.errorMessage);
                }
            }
        };
        _RestApi.prototype.handle_failure = function (jqXHR, failure_callback) {
            // Ignore AJAX zero errors - they just indicate an interrrupted connection
            if (jqXHR.status != 0) {
                var errorMessage = "AJAX Error[" + jqXHR.status + "]:\n" + jqXHR.statusText;
                // parse the Apache error response to extract the underlying Java exception message
                var msg = jqXHR.responseText;
                var m = msg.indexOf("<b>message</b>");
                if (m != -1) {
                    var s = msg.indexOf("<u>", m);
                    if (s != -1) {
                        var e = msg.indexOf("</u>", s);
                        if (e != -1) {
                            errorMessage = msg.substring(s + 3, e);
                        }
                    }
                }
                if (failure_callback) {
                    failure_callback("ERR", errorMessage, jqXHR.status);
                }
                else if (jqXHR.status) {
                    alert(errorMessage);
                }
            }
        };
        return _RestApi;
    }());
    catdv._RestApi = _RestApi;
    catdv.RestApi = new _RestApi();
})(catdv || (catdv = {}));
