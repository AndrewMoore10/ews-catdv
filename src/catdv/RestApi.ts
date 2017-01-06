module catdv
{
    // Set by PageHeader tag
    export var API_URL: string = null;
    export var edition: string = null;
    export var settings: SettingsSchema = null;

    export var session: string = null;
    export var loggedInUser: string = null;
    export var loggedInUserID: number = null;

    import FieldDefinition = catdv.FieldDefinition;

    export interface Reply
    {
        status: string;
        errorMessage: string;
        data: any;
    }

    export interface PartialResultSet<T>
    {
        totalItems: number;
        offset: number;
        items: T[];
        echo?: string;
    }

    export interface StdParams
    {
        filter?: string;
        skip?: number;
        take?: number;
        useCache?: boolean;
        include?: string;
        sortBy?: string;
        sortDir?: string
    }

    export interface successCallback<T>
    {
        (data: T): void;
    }

    export interface failureCallback
    {
        (status: String, error: string, data: any): void;
    }

    export class _RestApi
    {
        private catdv_login_handler: failureCallback;

        constructor()
        {
        }

        public getApiUrl(path: string): string
        {
            var apiUrl = ((typeof (catdv.API_URL) != "undefined") && (catdv.API_URL != null)) ? catdv.API_URL : "/catdv/api";
            var apiVersion = 7;
            return apiUrl + "/" + apiVersion + "/" + path;
        }

        public registerLogInHandler(login_handler: () => void)
        {
            this.catdv_login_handler = login_handler;
        }

        public getSessionKey(success_callback: successCallback<any>, failure_callback?: failureCallback)
        {
            this.api_get("session/key", {}, success_callback, failure_callback);
        }

        public getSession(success_callback: successCallback<any>, failure_callback?: failureCallback)
        {
            this.api_get("session", {}, success_callback, failure_callback);
        }

        public login(username: string, encryptedPassword: string, success_callback: successCallback<any>, failure_callback?: failureCallback)
        {
            this.api_call("POST", "session",
                {
                    username: username,
                    encryptedPassword: encryptedPassword
                }, success_callback, failure_callback);
        }

        public logout(success_callback: successCallback<any>, failure_callback?: failureCallback)
        {
            this.api_call('DELETE', "session", {}, success_callback, failure_callback);
        }

        public getInfo(infoSet : string, success_callback: successCallback<any>, failure_callback?: failureCallback)
        {
            this.api_get("info" + (infoSet ? "/" + infoSet : ""), {"details" : true}, success_callback, failure_callback);
        }
        
        public getServerProperty(propertyName: string, success_callback: successCallback<string>, failure_callback?: failureCallback)
        {
            this.api_get("info/properties/" + propertyName, {}, success_callback, failure_callback);
        }

        public getServerProperties(propertyNames: string[], success_callback: successCallback<string[]>, failure_callback?: failureCallback)
        {
            this.api_get("info/properties/[" + propertyNames.join(",") + "]", {}, success_callback, failure_callback);
        }

        public addToBasket(clipIds: number[], success_callback: successCallback<ClipBasketOperationResult>, failure_callback?: failureCallback)
        {
            this.api_call("POST", "basket", { clipIds: clipIds }, success_callback, failure_callback);
        }

        public updateBasketItems(items, success_callback: successCallback<ClipBasketOperationResult>, failure_callback?: failureCallback)
        {
            this.api_call("PUT", "basket", items, success_callback, failure_callback);
        }

        public removeFromBasket(clipIds: number[], success_callback: successCallback<ClipBasketOperationResult>, failure_callback?: failureCallback)
        {
            this.api_call("DELETE", "basket/[" + clipIds.join() + "]", {}, success_callback, failure_callback);
        }

        public getBasketItems(success_callback: successCallback<ClipBasketItem[]>, failure_callback?: failureCallback)
        {
            this.api_get("basket", {}, success_callback, failure_callback);
        }

        public getNumBasketItems(success_callback: successCallback<number>, failure_callback?: failureCallback)
        {
            this.api_get("basket?count=true", {}, success_callback, failure_callback);
        }

        public isItemInBasket(clipId: number, success_callback: successCallback<boolean>, failure_callback?: failureCallback)
        {
            this.api_get("basket?clipId=" + clipId + "&count=true", {}, function(count) { success_callback(count > 0); }, failure_callback);
        }

        public getBasketActions(success_callback: successCallback<ClipBasketAction[]>, failure_callback?: failureCallback)
        {
            this.api_get("basket/actions", {}, success_callback, failure_callback);
        }

        public performBasketAction(actionId: number, success_callback: successCallback<any>, failure_callback?: failureCallback)
        {
            this.api_call("POST", "basket/actions/" + actionId, {}, success_callback, failure_callback);
        }

        public getCatalogs(success_callback: successCallback<Catalog[]>, failure_callback?: failureCallback)
        {
            this.api_get("catalogs", null, success_callback, failure_callback);
        }

        public getCatalogsBasicInfo(success_callback: successCallback<Catalog[]>, failure_callback?: failureCallback)
        {
            this.api_get("catalogs", { "include": "onlyBasicInfo" }, success_callback, failure_callback);
        }
        
        public findCatalogs(params: any, success_callback: successCallback<Catalog[]>, failure_callback?: failureCallback)
        {
            this.api_get("catalogs", params, success_callback, failure_callback);
        }

        public getClips(params: StdParams, success_callback: successCallback<PartialResultSet<Clip>>, failure_callback?: failureCallback)
        {
            this.api_get("clips", params, success_callback, failure_callback);
        }

        public exportClipsAsFcpXml(query, success_callback: successCallback<string>, failure_callback?: failureCallback)
        {
            this.api_get("clips", $.extend({ "fmt": "fcpxml" }, query), success_callback, failure_callback);
        }

        public getClip(clipId: any, success_callback: successCallback<Clip>, failure_callback?: failureCallback)
        {
            this.api_get("clips/" + clipId, { include: "proxyPath" }, success_callback, failure_callback);
        }

        public saveClip(clip: any, success_callback: successCallback<any>, failure_callback?: failureCallback)
        {
            if (!clip.ID)
            {
                this.api_call('POST', "clips", clip, success_callback, failure_callback);
            }
            else
            {
                this.api_call('PUT', "clips/" + clip.ID, clip, success_callback, failure_callback);
            }
        }

        public saveClips(clips: Clip[], success_callback: successCallback<number>, failure_callback?: failureCallback)
        {
            this.api_call('PUT', "clips", clips, success_callback, failure_callback);
        }

        public deleteClip(clipID: number, success_callback: successCallback<any>, failure_callback?: failureCallback)
        {
            this.api_call("DELETE", "clips/" + clipID, {}, success_callback, failure_callback);
        }

        public getClipFilters(query, success_callback: successCallback<Filter[]>, failure_callback?: failureCallback)
        {
            this.api_get("clips/filters", query, success_callback, failure_callback);
        }

        public getClipLists(success_callback: successCallback<ClipList[]>, failure_callback?: failureCallback)
        {
            this.api_get("cliplists", null, success_callback, failure_callback);
        }

        public addToClipList(clipListID: number, clipIDs: number[], success_callback: successCallback<any>, failure_callback?: failureCallback)
        {
            this.api_call('POST', "cliplists/" + clipListID + "/clips", clipIDs, success_callback, failure_callback);
        }

        public removeFromClipList(clipListID: number, clipIDs: number[], success_callback: successCallback<any>, failure_callback?: failureCallback)
        {
            this.api_call("DELETE", "cliplists/" + clipListID + "/clips", clipIDs, success_callback, failure_callback);
        }

        public saveClipList(clipList: any, success_callback: successCallback<number>, failure_callback?: failureCallback)
        {
            if (!clipList.ID)
            {
                this.api_call('POST', "cliplists", clipList, success_callback, failure_callback);
            }
            else
            {
                this.api_call('PUT', "cliplists/" + clipList.ID, clipList, success_callback, failure_callback);
            }
        }

        public deleteClipList(clipListID: number, success_callback: successCallback<any>, failure_callback?: failureCallback)
        {
            this.api_call("DELETE", "cliplists/" + clipListID, {}, success_callback, failure_callback);
        }

        public getFields(params: any, success_callback: successCallback<PartialResultSet<FieldDefinition>>, failure_callback?: failureCallback)
        {
            this.api_get("fields", params, success_callback, failure_callback);
        }

        public getFieldDefinition(fieldDefID: number, success_callback: successCallback<PartialResultSet<FieldDefinition>>, failure_callback?: failureCallback)
        {
            this.api_get("fields/" + fieldDefID, {}, success_callback, failure_callback);
        }

        public getFieldUsage(fieldDefID: number, params: any, success_callback: successCallback<any[]>, failure_callback?: failureCallback)
        {
            this.api_get("fields/" + fieldDefID + "/usage", params, success_callback, failure_callback);
        }

        public getFieldValues(field: string, success_callback: successCallback<string[]>, failure_callback?: failureCallback)
        {
            this.api_get("fields/" + field + "/values", {}, success_callback, failure_callback);
        }

        public getFieldListValues(field: string, success_callback: successCallback<string[]>, failure_callback?: failureCallback)
        {
            this.api_get("fields/" + field + "/list/values", {}, success_callback, failure_callback);
        }

        public saveField(field: any, success_callback: successCallback<any>, failure_callback?: failureCallback)
        {
            if (!field.ID)
            {
                this.api_call('POST', "fields", field, success_callback, failure_callback);
            }
            else
            {
                this.api_call('PUT', "fields/" + field.ID, field, success_callback, failure_callback);
            }
        }

        public mergeFields(keepFieldDefID: number, mergeFieldDefIDs: number[], success_callback: successCallback<any>, failure_callback?: failureCallback)
        {
            this.api_call("PUT", "fields/" + keepFieldDefID, { "mergeWith": mergeFieldDefIDs }, success_callback, failure_callback);
        }

        public demergeFields(oldFieldDefID: number, newFieldDefID: number, groupIDs: number[], success_callback: successCallback<any>, failure_callback?: failureCallback)
        {
            this.api_call("PUT", "fields/" + oldFieldDefID, { "demergeTo": newFieldDefID, "forGroupIDs": groupIDs }, success_callback, failure_callback);
        }

        public deleteField(fieldDefID: string, success_callback: successCallback<any>, failure_callback?: failureCallback)
        {
            this.api_call("DELETE", "fields/" + fieldDefID, {}, success_callback, failure_callback);
        }

        public getFieldGroups(params: any, success_callback: successCallback<FieldGroup[]>, failure_callback?: failureCallback)
        {
            this.api_get("fieldGroups", params, success_callback, failure_callback);
        }

        public getFieldGroup(fieldGroupID: number, success_callback: successCallback<FieldGroup>, failure_callback?: failureCallback)
        {
            this.api_get("fieldGroups/" + fieldGroupID, {}, success_callback, failure_callback);
        }

        public saveFieldGroup(fieldGroup: any, success_callback: successCallback<any>, failure_callback?: failureCallback)
        {
            if (!fieldGroup.ID)
            {
                this.api_call('POST', "fieldGroups", fieldGroup, success_callback, failure_callback);
            }
            else
            {
                this.api_call('PUT', "fieldGroups/" + fieldGroup.ID, fieldGroup, success_callback, failure_callback);
            }
        }

        public deleteFieldGroup(fieldGroupDefID: string, success_callback: successCallback<any>, failure_callback?: failureCallback)
        {
            this.api_call("DELETE", "fieldGroups/" + fieldGroupDefID, {}, success_callback, failure_callback);
        }

        public reorderUserFields(userFieldChanges: FieldDefinition[], success_callback: successCallback<any>, failure_callback?: failureCallback)
        {
            this.api_call("PUT", "fields/userfieldindexes", userFieldChanges, success_callback, failure_callback);
        }

        public getFormSetsWithForms(success_callback: successCallback<PanelDefinition[]>, failure_callback?: failureCallback)
        {
            this.api_get("formsets?include=forms,visibility", {}, success_callback, failure_callback);
        }

        public getFormDefinition(formID, formType, success_callback: successCallback<FormDefinition>, failure_callback?: failureCallback)
        {
            this.api_get("forms/" + formID, { "formType": formType, "include": "fields,fieldDefs,picklists,values" }, success_callback, failure_callback);
        }

        public saveForm(form: FormDefinition, success_callback: successCallback<any>, failure_callback?: failureCallback)
        {
            if (!form.ID)
            {
                this.api_call('POST', "forms", form, success_callback, failure_callback);
            }
            else
            {
                this.api_call('PUT', "forms/" + form.ID, form, success_callback, failure_callback);
            }
        }

        public getGroups(params: any, success_callback: successCallback<any>, failure_callback?: failureCallback)
        {
            this.api_get("groups", params, success_callback, failure_callback);
        }

        public saveGroup(group: any, success_callback: successCallback<any>, failure_callback?: failureCallback)
        {
            if ((group.ID == null) || (group.ID == -1))
            {
                this.api_call('POST', "groups", group, success_callback, failure_callback);
            }
            else
            {
                this.api_call('PUT', "groups/" + group.ID, group, success_callback, failure_callback);
            }
        }

        public deleteGroup(groupID: number, success_callback: successCallback<any>, failure_callback?: failureCallback)
        {
            this.api_call("DELETE", "groups/" + groupID, {}, success_callback, failure_callback);
        }

        public getGroupRolePermissions(groupID: number, success_callback: successCallback<Role[]>, failure_callback?: failureCallback)
        {
            this.api_get("groups/" + groupID + "/roles?allRoles=true", {}, success_callback, failure_callback);
        }

        public updateGroupRolePermissions(groupID: number, roles: Role[], success_callback: successCallback<Role[]>, failure_callback?: failureCallback)
        {
            this.api_call('PUT', "groups/" + groupID + "/roles", roles, success_callback, failure_callback);
        }


        public getServices(success_callback: successCallback<Service[]>, failure_callback?: failureCallback)
        {
            this.api_get("services", {}, success_callback, failure_callback);
        }

        public getJobs(params: any, success_callback: successCallback<PartialResultSet<Job>>, failure_callback?: failureCallback)
        {
            this.api_get("jobs", params, success_callback, failure_callback);
        }

        public getJob(jobID: number, success_callback: successCallback<Job>, failure_callback?: failureCallback)
        {
            this.api_get("jobs/" + jobID, { "include": "formattedData" }, success_callback, failure_callback);
        }

        public getJobResults(jobID: number, params: any, success_callback: successCallback<JobResult[]>, failure_callback?: failureCallback)
        {
            this.api_get("jobs/" + jobID + "/results", params, success_callback, failure_callback);
        }
        
        public getLogEntries(params: any, success_callback: successCallback<PartialResultSet<LogEntry>>, failure_callback?: failureCallback)
        {
            this.api_get("auditlog", params, success_callback, failure_callback);
        }

        public getMediaStores(success_callback: successCallback<MediaStore[]>, failure_callback?: failureCallback)
        {
            this.api_get("mediastores", null, success_callback, failure_callback);
        }

        public saveMediaStore(mediaStore: MediaStore, success_callback: successCallback<MediaStore>, failure_callback?: failureCallback)
        {
            if (!mediaStore.ID)
            {
                this.api_call('POST', "mediastores", mediaStore, success_callback, failure_callback);
            }
            else
            {
                this.api_call('PUT', "mediastores/" + mediaStore.ID, mediaStore, success_callback, failure_callback);
            }
        }

        public saveMediaPath(mediaPath: MediaPath, success_callback: successCallback<MediaPath>, failure_callback?: failureCallback)
        {
            if (!mediaPath.ID)
            {
                this.api_call('POST', "mediastores/" + mediaPath.mediaStoreID + "/paths", mediaPath, success_callback, failure_callback);
            }
            else
            {
                this.api_call('PUT', "mediastores/" + mediaPath.mediaStoreID + "/paths/" + mediaPath.ID, mediaPath, success_callback, failure_callback);
            }
        }

        public getMediaStore_MediaTypes(success_callback: successCallback<EnumItem[]>, failure_callback?: failureCallback)
        {
            this.api_get("info/mediastore/mediatypes", null, success_callback, failure_callback);
        }

        public getMediaStore_PathTargets(success_callback: successCallback<EnumItem[]>, failure_callback?: failureCallback)
        {
            this.api_get("info/mediastore/targets", null, success_callback, failure_callback);
        }

        public deleteMediaStore(mediastoreID: number, success_callback: successCallback<any>, failure_callback?: failureCallback)
        {
            this.api_call("DELETE", "mediastores/" + mediastoreID, {}, success_callback, failure_callback);
        }

        public deleteMediaPath(mediastoreID: number, mediastorePathID: number, success_callback: successCallback<any>, failure_callback?: failureCallback)
        {
            this.api_call("DELETE", "mediastores/" + mediastoreID + "/paths/" + mediastorePathID, {}, success_callback, failure_callback);
        }

        public getPanelDefinitions(groupID: number, success_callback: successCallback<PanelDefinition[]>, failure_callback?: failureCallback)
        {
            this.api_get("panels", { "groupID": groupID, "include": "builtin,fields,fieldDefs,picklists,values" }, success_callback, failure_callback);
        }

        public getSharedLinkPanelDefinitions(linkUID: string, success_callback: successCallback<PanelDefinition[]>, failure_callback?: failureCallback)
        {
            this.api_get("panels/" + linkUID, { "include": "builtin,fields,fieldDefs,picklists,values" }, success_callback, failure_callback);
        }

        public getPanelFields(panelDefID: number, success_callback: successCallback<PanelField[]>, failure_callback?: failureCallback)
        {
            this.api_get("panels/" + panelDefID + "/fields", {}, success_callback, failure_callback);
        }

        getPanelSetsWithPanels(success_callback: successCallback<PanelDefinition[]>, failure_callback?: failureCallback)
        {
            this.api_get("panelsets?include=panels,visibility", {}, success_callback, failure_callback);
        }

        public savePanel(panel: PanelDefinition, success_callback: successCallback<any>, failure_callback?: failureCallback)
        {
            if (!panel.ID)
            {
                this.api_call('POST', "panels", panel, success_callback, failure_callback);
            }
            else
            {
                this.api_call('PUT', "panels/" + panel.ID, panel, success_callback, failure_callback);
            }
        }

        public getPicklist(fieldID: string, success_callback: successCallback<string[]>, failure_callback?: failureCallback)
        {
            this.api_get("fields/" + fieldID + "/list?include=values", {}, success_callback, failure_callback);
        }

        public updatePicklist(fieldID: string, picklist: Picklist, success_callback: successCallback<string[]>, failure_callback?: failureCallback)
        {
            this.api_call("PUT", "fields/" + fieldID + "/list", picklist, success_callback, failure_callback);
        }

        public getRoles(params: any, success_callback: successCallback<Role[]>, failure_callback?: failureCallback)
        {
            this.api_get("roles", params, success_callback, failure_callback);
        }

        public saveRole(role: any, success_callback: successCallback<any>, failure_callback?: failureCallback)
        {
            if (!role.ID)
            {
                this.api_call('POST', "roles", role, success_callback, failure_callback);
            }
            else
            {
                this.api_call('PUT', "roles/" + role.ID, role, success_callback, failure_callback);
            }
        }

        public deleteRole(roleID: number, success_callback: successCallback<any>, failure_callback?: failureCallback)
        {
            this.api_call("DELETE", "roles/" + roleID, {}, success_callback, failure_callback);
        }

        public getRoleGroupPermissions(roleID: number, success_callback: successCallback<Group[]>, failure_callback?: failureCallback)
        {
            this.api_get("roles/" + roleID + "/groups?allGroups=true", {}, success_callback, failure_callback);
        }

        public updateRoleGroupPermissions(roleID: number, groups: Group[], success_callback: successCallback<Role[]>, failure_callback?: failureCallback)
        {
            this.api_call('PUT', "roles/" + roleID + "/groups", groups, success_callback, failure_callback);
        }

        public getSharedLinks(params: any, success_callback: successCallback<PartialResultSet<SharedLink>>, failure_callback?: failureCallback)
        {
            this.api_get("sharedLinks", params, success_callback, failure_callback);
        }

        public getSharedLink(sharedLinkID: number, success_callback: successCallback<SharedLink[]>, failure_callback?: failureCallback)
        {
            this.api_get("sharedLinks/" + sharedLinkID, null, success_callback, failure_callback);
        }

        public createSharedLink(sharedLink: SharedLink, success_callback: successCallback<any>, failure_callback?: failureCallback)
        {
            this.api_call('POST', "sharedLinks", sharedLink, success_callback, failure_callback);
        }

        public updateSharedLink(sharedLink: SharedLink, success_callback: successCallback<any>, failure_callback?: failureCallback)
        {
            this.api_call('PUT', "sharedLinks/" + sharedLink.ID, sharedLink, success_callback, failure_callback);
        }

        public deleteSharedLink(sharedLinkID: number, success_callback: successCallback<any>, failure_callback?: failureCallback)
        {
            this.api_call("DELETE", "sharedLinks/" + sharedLinkID, {}, success_callback, failure_callback);
        }

        public getSmartFolders(success_callback: successCallback<SmartFolder[]>, failure_callback?: failureCallback)
        {
            this.api_get("smartfolders", null, success_callback, failure_callback);
        }

        public saveSmartFolder(smartFolder: any, success_callback: successCallback<any>, failure_callback?: failureCallback)
        {
            if (!smartFolder.ID)
            {
                this.api_call('POST', "smartFolders", smartFolder, success_callback, failure_callback);
            }
            else
            {
                this.api_call('PUT', "smartFolders/" + smartFolder.ID, smartFolder, success_callback, failure_callback);
            }
        }

        public deleteSmartFolder(smartFolderID: number, success_callback: successCallback<any>, failure_callback?: failureCallback)
        {
            this.api_call("DELETE", "smartFolders/" + smartFolderID, {}, success_callback, failure_callback);
        }

        public setServerProperties(propertySet: any, success_callback: successCallback<Thumbnail[]>, failure_callback?: failureCallback)
        {
            this.api_call('PUT', "info/properties", propertySet, success_callback, failure_callback);
        }

        public getSuggestions(prefix: string, success_callback: successCallback<string[]>, failure_callback?: failureCallback)
        {
            this.api_get("suggest", { "prefix": prefix }, success_callback, failure_callback);
        }

        public getThemeSchema(success_callback: successCallback<WebWorkspaceSchemaItem[]>, failure_callback?: failureCallback)
        {
            this.api_get("themes/schema", {}, success_callback, failure_callback);
        }
             
        public getThemes(success_callback: successCallback<WebTheme[]>, failure_callback?: failureCallback)
        {
            this.api_get("themes", {}, success_callback, failure_callback);
        }

        public getTheme(theme: string, success_callback: successCallback<WebTheme>, failure_callback?: failureCallback)
        {
            this.api_get("themes/" + theme, {}, success_callback, failure_callback);
        }

        public createTheme(webTheme: WebTheme, success_callback: successCallback<any>, failure_callback?: failureCallback)
        {
            this.api_call('POST', "themes", webTheme, success_callback, failure_callback);
        }

        public updateTheme(webTheme: WebTheme, success_callback: successCallback<any>, failure_callback?: failureCallback)
        {
            this.api_call('PUT', "themes/" + webTheme.name, webTheme, success_callback, failure_callback);
        }

        public deleteTheme(themeName: string, success_callback: successCallback<any>, failure_callback?: failureCallback)
        {
            this.api_call('DELETE', "themes/" + themeName, {}, success_callback, failure_callback);
        }

        public getThumbnailsForMedia(mediaID: number, success_callback: successCallback<Thumbnail[]>, failure_callback?: failureCallback)
        {
            this.api_get("sourcemedia/" + mediaID + "/thumbnails", null, success_callback, failure_callback);
        }

        public initiateUpload(filename: string, fileSize: number, metadata: any, success_callback: successCallback<any>, failure_callback?: failureCallback)
        {
            this.api_call('POST', "uploads", { "filename": filename, "fileSize": fileSize, "metadata": metadata }, success_callback, failure_callback);
        }

        public getUsers(params: any, success_callback: successCallback<User[]>, failure_callback?: failureCallback)
        {
            this.api_get("users", params, success_callback, failure_callback);
        }

        public getUser(userID: number, success_callback: successCallback<User>, failure_callback?: failureCallback)
        {
            this.api_get("users/" + userID, {}, success_callback, failure_callback);
        }

        public insertUser(user: User, success_callback: successCallback<any>, failure_callback?: failureCallback)
        {
            this.api_call('POST', "users", user, success_callback, failure_callback);
        }

        public updateUser(user: User, success_callback: successCallback<any>, failure_callback?: failureCallback)
        {
            this.api_call('PUT', "users/" + user.ID, user, success_callback, failure_callback);
        }

        public deleteUser(userID: number, success_callback: successCallback<any>, failure_callback?: failureCallback)
        {
            this.api_call("DELETE", "users/" + userID, {}, success_callback, failure_callback);
        }

        getViewSetsWithViews(success_callback: successCallback<ViewDefinition[]>, failure_callback?: failureCallback)
        {
            this.api_get("viewsets?include=views,visibility", {}, success_callback, failure_callback);
        }

        saveViewSet(viewType: string, viewSet: BaseViewSet, success_callback: successCallback<any>, failure_callback?: failureCallback)
        {
            var endpoint = viewType + "sets"; // viewsets or panelsets
            if (!viewSet.ID)
            {
                this.api_call('POST', endpoint, viewSet, success_callback, failure_callback);
            }
            else
            {
                this.api_call('PUT', endpoint + "/" + viewSet.ID, viewSet, success_callback, failure_callback);
            }
        }

        public deleteViewSet(viewSetID: number, success_callback: successCallback<any>, failure_callback?: failureCallback)
        {
            this.api_call("DELETE", "viewsets/" + viewSetID, {}, success_callback, failure_callback);
        }

        public getViewDefinitions(success_callback: successCallback<ViewDefinition[]>, failure_callback?: failureCallback)
        {
            this.api_get("views?include=fields,fieldDefs", {}, success_callback, failure_callback);
        }

        public getViewFields(viewType: string, viewDefID: number, success_callback: successCallback<ViewField[]>, failure_callback?: failureCallback)
        {
            var endpoint = viewType + "s"; // views, panels or forms
            this.api_get(endpoint + "/" + viewDefID + "/fields", {}, success_callback, failure_callback);
        }

        public saveView(viewType: string, view: ViewDefinition, success_callback: successCallback<any>, failure_callback?: failureCallback)
        {
            var endpoint = viewType + "s"; // views, panels or forms
            if (!view.ID)
            {
                this.api_call('POST', endpoint, view, success_callback, failure_callback);
            }
            else
            {
                this.api_call('PUT', endpoint + "/" + view.ID, view, success_callback, failure_callback);
            }
        }

        public deleteView(viewID: number, success_callback: successCallback<any>, failure_callback?: failureCallback)
        {
            this.api_call("DELETE", "views/" + viewID, {}, success_callback, failure_callback);
        }

        getWebWorkspaces(success_callback: successCallback<WebWorkspace[]>, failure_callback?: failureCallback)
        {
            this.api_get("web-workspaces", {}, success_callback, failure_callback);
        }

        getWebWorkspaceSchema(success_callback: successCallback<WebWorkspaceSchemaItem[]>, failure_callback?: failureCallback)
        {
            this.api_get("web-workspaces/schema", {}, success_callback, failure_callback);
        }

        saveWebWorkspace(settings: WebWorkspace, success_callback: successCallback<any>, failure_callback?: failureCallback)
        {
            if (!settings.ID)
            {
                this.api_call('POST', "web-workspaces", settings, success_callback, failure_callback);
            }
            else
            {
                this.api_call('PUT', "web-workspaces/" + settings.ID, settings, success_callback, failure_callback);
            }
        }

        public deleteWebWorkspace(settingsID: number, success_callback: successCallback<any>, failure_callback?: failureCallback)
        {
            this.api_call("DELETE", "web-workspaces/" + settingsID, {}, success_callback, failure_callback);
        }

        getServerCommands(success_callback: successCallback<ServerCommand[]>, failure_callback?: failureCallback)
        {
            this.api_get("commands", {}, success_callback, failure_callback);
        }

        getArgumentForm(commandID: number, commandName: string, success_callback: successCallback<ArgumentForm>, failure_callback?: failureCallback)
        {
            var selector = commandID != null ? String(commandID) : "chained";
            this.api_get("commands/" + selector + "/argumentForm", {"commandName": commandName }, success_callback, failure_callback);
        }

        public processServerCommandEvent(commandID: number, commandParams: CommandParams, success_callback: successCallback<ArgumentForm>, failure_callback?: failureCallback)
        {
            var selector = commandID != null ? String(commandID) : "chained";
            this.api_call("POST", "commands/" + selector + "/events", commandParams, success_callback, failure_callback);
        }

        public execServerCommand(commandID: number, commandParams: CommandParams, success_callback: successCallback<CommandResults>, failure_callback?: failureCallback)
        {
            var selector = commandID != null ? String(commandID) : "chained";
            this.api_call("POST", "commands/" + selector, commandParams, success_callback, failure_callback);
        }

        private api_get(path: string, data: any, success_callback: successCallback<any>, failure_callback?: failureCallback): void
        {
            try
            {
                $.ajax({
                    type: "GET",
                    url: this.getApiUrl(path),
                    headers: {
                        "CatDV-Client": "WEB.2"
                    },
                    data: data,
                    success: (reply) =>
                    {
                        this.handle_response(reply, success_callback, failure_callback);
                    },
                    error: (jqXHR: JQueryXHR, textStatus: string, errorThrown: string) => 
                    {
                        this.handle_failure(jqXHR, failure_callback);
                    }
                });
            }
            catch (e)
            {
                if (failure_callback != null)
                {
                    failure_callback("ERR", e, e);
                }
                else if ((e == "NoHost") && (this.catdv_login_handler != null))
                {
                    this.catdv_login_handler("AUTH", "Not Initialised", null);
                }
                else
                {
                    alert("EX:" + e + "\n[" + path + "]");
                }
            }
        }


        private api_call(method: string, path: string, data: any, success_callback: successCallback<any>, failure_callback?: failureCallback): void
        {
            try
            {
                $.ajax({
                    type: method,
                    url: this.getApiUrl(path),
                    headers: {
                        "CatDV-Client": "WEB.2"
                    },
                    contentType: "application/json; charset=UTF-8",
                    data: JSON.stringify(data),
                    success: (reply) =>
                    {
                        this.handle_response(reply, success_callback, failure_callback);
                    },
                    error: (jqXHR: JQueryXHR, textStatus: string, errorThrown: string) => 
                    {
                        this.handle_failure(jqXHR, failure_callback);
                    }
                });
            }
            catch (e)
            {
                if (failure_callback != null)
                {
                    failure_callback("ERR", e, e);
                }
                else if ((e == "NoHost") && (this.catdv_login_handler != null))
                {
                    this.catdv_login_handler("AUTH", "Not Initialised", null);
                }
                else
                {
                    alert("EX:" + e + "\n[" + path + "]");
                }
            }
        }

        private now(): number
        {
            return new Date().getTime();
        }

        private handle_response(reply: Reply, success_callback: successCallback<any>, failure_callback?: failureCallback): void
        {
            if ((typeof Document != "undefined") && reply instanceof Document)
            {
                // Handle raw XML response - used by FCP XML export
                success_callback((new XMLSerializer()).serializeToString(<Node>(<any>reply)));
            }
            else if (reply.status == "OK")
            {
                success_callback(reply.data);
            }
            else if (((reply.status == "AUTH") || (reply.status == "BUSY")) && (this.catdv_login_handler != null))
            {
                this.catdv_login_handler(reply.status, reply.errorMessage, reply.data);
            }
            else
            {
                if (failure_callback)
                {
                    failure_callback(reply.status, reply.errorMessage, reply.data);
                }
                else
                {
                    controls.MessageBox.alert(reply.errorMessage);
                }
            }
        }

        private handle_failure(jqXHR: JQueryXHR, failure_callback: failureCallback)
        {
            // Ignore AJAX zero errors - they just indicate an interrrupted connection
            if (jqXHR.status != 0)
            {
                var errorMessage = "AJAX Error[" + jqXHR.status + "]:\n" + jqXHR.statusText;
                // parse the Apache error response to extract the underlying Java exception message
                var msg = jqXHR.responseText;
                var m = msg.indexOf("<b>message</b>");
                if (m != -1)
                {
                    var s = msg.indexOf("<u>", m);
                    if (s != -1)
                    {
                        var e = msg.indexOf("</u>", s);
                        if (e != -1)
                        {
                            errorMessage = msg.substring(s + 3, e);
                        }
                    }
                }
                if (failure_callback)
                {
                    failure_callback("ERR", errorMessage, jqXHR.status);
                }
                else if (jqXHR.status)
                {
                    alert(errorMessage);
                }
            }
        }
    }

    export var RestApi = new _RestApi();
}
