declare module catdv
{
    export interface BaseDTO
    {
        ID?: number;
    }

    export interface User extends BaseDTO
    {
        name?: string;
        notes?: string;
        password?: string;
        roleID?: number;
        role?: string;
        fields?: any;
    }

    export interface RoleSettings extends BaseDTO
    {
        enabledTabs?: string[];
        disabledTabs?: string[];
        advancedUI?: boolean;
    }

    export interface Role extends BaseDTO
    {
        name?: string;
        notes?: string;
        settings?: RoleSettings;
        permissions?: string[];
    }

    export interface Group extends BaseDTO
    {
        name?: string;
        notes?: string;
        defaultPermissions?: string[];
        permissions?: string[];
        acl?: AccessRule[]
    }

    export interface AccessRuleSelector
    {
        field?: string; // e.g. user.name, media.filePath, user.role or user[field.identifier] etc.
        values?: string[]; // rule matches if field is one of the values in the list
    }

    export interface AccessRule extends BaseDTO
    {
        userSelector?: AccessRuleSelector // Who do these permissions apply to
        permissions?: string[]; // List of permissions     
        targetSelectors?: AccessRuleSelector[]; // What do these permissions apply to. Complete group/catalog if null or selected children if set.
    }
    
    export interface EnumItem
    {
        ID: string;
        name: string;
    }

    export interface MediaStore extends BaseDTO
    {
        name?: string;
        paths?: MediaPath[];
    }

    export interface MediaPath extends BaseDTO
    {
        mediaStoreID?: number;
        path?: string;
        extensions?: string;
        mediaType?: string;
        target?: string;
        pathOrder?: number;
    }

    export interface BaseViewSet extends BaseDTO
    {
        name?: string;
        description?: string;
        order?: number;
        visibility?: VisibilityRules;
    }

    export interface ViewSet extends BaseViewSet
    {
        views: ViewDefinition[];
    }

    export interface PanelSet extends BaseViewSet
    {
        panels: PanelDefinition[];
    }

    export interface FormSet extends BaseViewSet
    {
        formType: string;
        forms: FormDefinition[];
    }

    export interface NamedObject 
    {
        groupName?: string;
        name?: string;
    }

    export interface Catalog extends BaseDTO, NamedObject
    {
        userID?: number;
        userName?: string;
        groupID?: number;
        groupName?: string;
        name?: string;
        whoCreated?: string;
        whoSaved?: string;
        owner?: string;
        comment?: string;
        whenCreated?: number;
        whenExtended?: number;
        whenSaved?: number;
        whenPublished?: number;
        readOnly?: boolean;
        readProtected?: boolean;
        password?: number;
        version?: string;
        fields?: any;
    }

    export enum TimecodeFormat
    {
        WHOLE_SECONDS_FORMAT = 1,
        DECIMAL_FORMAT = 10,
        P15_FORMAT = 15,
        P24_NTSC_FORMAT = 2398,   // was P24_SLOW_FORMAT
        P24_FORMAT = 24,
        PAL_FORMAT = 25,
        NTSC_DF_FORMAT = 2997,   // was NTSC_DROPFRAME_FORMAT
        NTSC_NDF_FORMAT = 3000,   // was NONDROP_2997_FORMAT (29.97nd)
        NTSC_EXACT_FORMAT = 30,  // was NTSC_NONDROP_FORMAT (30.0)
        P50_FORMAT = 50,
        P60_NTSC_DF_FORMAT = 5994,    // was P60_SLOW_FORMAT
        P60_NTSC_NDF_FORMAT = 6000,   // was NONDROP_5994_FORMAT
        P60_FORMAT = 60,
        HUNDREDTHS_FORMAT = 100  // was HUNDRETHS_FORMAT
    }

    export interface Timecode
    {
        fmt: TimecodeFormat;
        secs: number;
        frm?: number;
        txt?: string;
    }

    export interface Clip extends BaseDTO
    {
        catalogID?: number;
        catalog?: Catalog;
        userID?: number;
        userName?: string;
        type?: string; // clip, subclip, metaclip, seq
        underlyingType?: string; // full type description
        name?: string;
        notes?: string;
        bigNotes?: string;
        tape?: string;
        status?: string;
        bin?: string;
        format?: string;
        fps?: number;
        in?: Timecode; //  start of clip 
        out?: Timecode; //  end of clip 
        duration?: Timecode; // Duration of clip as timecode 
        marked?: boolean;
        hidden?: boolean;
        orientation?: number;   // rotation of stills
        good?: string;
        rating?: number;
        posterID?: number;
        transition?: string;
        in2?: Timecode; //  start of selection within clip
        out2?: Timecode; //   end of selection within clip 
        duration2?: Timecode; // Duration of selection within clip as timecode 
        markers?: EventMarker[];
        importNotes?: string;
        seqItems?: SequenceItem[]; // if this clip is a sequence then this lists the sequences contents
        members?: Clip[]; // for metaclips - contains all the members clips
        clipref?: string;
        modifiedDate?: number;
        recordedDate?: number;
        gmtDate?: number;
        clockAdjust?: string;
        thumbnailIDs?: number[];
        sourceMediaID?: number;
        media?: SourceMedia;
        importSourceID?: number;
        importSource?: ImportSource;
        mediaStart?: Timecode; // start of source media 
        mediaEnd?: Timecode; //  end of source media
        userFields?: any; //  PropertyBag
        history?: ClipHistoryEntry[];
        isEditable?: boolean; // Calculated field based on currently logged in user's permissions
        tapeInfoRef?: string;
        tapeInfo?: TapeInfo;
    }


    export interface ClipList extends BaseDTO, NamedObject
    {
        name?: string;
        notes?: string;
        catalogID?: number;   // Null if not tied to a specific catalog
        groupID?: number;
        groupName?: string;
        userID?: number;
        modified?: number;
        clipIDs?: number[];
    }

    export interface EventMarker
    {
        in?: Timecode;
        out?: Timecode;
        name?: string;
        category?: string;
        description?: string;
    }

    export interface SequenceItem extends BaseDTO
    {
        catalogID?: number;
        seqID?: number;
        seqIn?: Timecode;
        seqOut?: Timecode;
        clipID?: number;
        clipName?: string;
        clipTape?: string;
        clipIn?: Timecode;
        clipOut?: Timecode;
        clipMediaID?: number;
        track?: string; // V1, A1, A2 AV1 etc.
        mediaStart?: Timecode;
        mediaEnd?: Timecode;
        mediaAspectRatio?: number;
    }

    export interface SourceMedia extends BaseDTO
    {
        filePath?: string;
        fileSize?: number;
        tape?: string;
        videoFormat?: string;
        audioFormat?: string;
        tracks?: string;
        aspectRatio?: number;
        modifiedDate?: number;
        start?: Timecode;
        end?: Timecode;
        tcFmt?: number;
        importer?: string;
        still?: boolean;
        dataRate?: number;
        archiveStatus?: string;
        omfRef?: string;
        qttc?: number;
        proxyPath?: string;
        isMediaAvailable?: boolean;
        altPaths?: string[];
        metadata?: any;
    }

    export interface ImportSource extends BaseDTO
    {
        file?: string;
        modifiedDate?: number;
        size?: number;
        importedDate?: number;
        userData?: string;
        metadata?: any;
    }

    export interface ClipHistoryEntry
    {
        date?: number;
        user?: string;
        action?: string;
    }

    export interface TapeInfo
    {
        tapeName?: string;
        description?: string;
        notes?: string;
        location?: string;
        format?: string;
        history?: string;
        reelNumber?: string;
        videographer?: string;
        project?: string;
        status?: string;
        subject?: string;
        media?: string;
        loggedDate?: number;
        createdDate?: number;
        modifiedDate?: number;
    }

    export interface Thumbnail extends BaseDTO
    {
        time: number;
        orientation: number;
    }

    export interface FilterValue
    {
        name?: string;
        value?: string;
        minValue?: string;
        maxValue?: string;
        childValues?: FilterValue[];
    }

    export interface Filter
    {
        name?: string;
        field?: string;
        filterOp?: string;
        values?: FilterValue[];
    }

    export interface QueryTerm
    {
        field?: string;
        op?: string;
        params?: string;
        logicalOR?: boolean;
        logicalNOT?: boolean;
        ignoreCase?: boolean;
    }

    export interface QueryDefinition
    {
        name?: string;
        terms?: QueryTerm[];
    }

    export interface ClipQuery
    {
        title: string;
        advancedQuery?: boolean;
        queryDef?: QueryDefinition;
        catalog?: Catalog
        smartFolder?: SmartFolder;
        clipList?: ClipList;
        cached?: boolean;
    }

    export interface SharedLink extends BaseDTO
    {
        clipID?: number;
        clipListID?: number;
        uid?: string;
        assetName?: string;
        createdBy?: string;
        createdDate?: number;
        expiryDate?: number;
        mediaType?: string;
        sharedWith?: string;
        notes?: string;
        viewUrl?: string;
        downloadUrl?: string;
        validityPeriod?: string;
    }

    export interface SmartFolder extends BaseDTO, NamedObject
    {
        groupID?: number;
        groupName?: string;
        userID?: number;
        name?: string;
        notes?: string;
        modifiedDate?: number;
        query?: QueryDefinition;
    }

    export interface FieldGroup
    {
        ID?: number;
        name?: string;
        description?: string;
        objectClass?: string;
        identifierPrefix?: string;
        isBuiltIn?: boolean;
        visibility?: VisibilityRules;
    }

    export interface FieldDefinition
    {
        // ID is either FieldDefinition.ID or attributeID (e.g. NM1, STS etc.) for builtin fields
        ID?: string;

        fieldGroupID?: number;
        memberOf?: string;
        fieldType?: string;
        data? : string; // Additional data - purpose depends on fieldType (e.g. list of radio buttons, calculated field expression etc.) 
 
        // For built-in fields this is the name of the property of whatever object this field is a memberOf
        // For user-defined fields this is the key in the userFields/metadata object.
        // Value can be accessed in JavaScript by evaluating memberOf.identifier for built-ins or 
        // memberOf.userFields[identifier] where memberOf == 'clip' or memberOf.metadata[identifier] for other objects
        identifier?: string;
        
        // Fixed identifier set whenfield is first created to indicate where it came from
        origin?: string;

        // Human readable name
        name?: string;

        // Longer human-readable description of what is stored in this field
        description?: string;

        isBuiltin?: boolean;
        canQuery?: boolean;
        isSortable?: boolean;  // can this field be specified in sortBy argument to clip queries 
        isEditable?: boolean;
        isMandatory?: boolean;
        isMultiValue?: boolean;
        isList?: boolean;
        userFieldIndex?: number;

        picklist?: Picklist; 
    }
    
    export interface BuiltinFieldDefinition extends FieldDefinition
    {
        width?: number;        
    }

    export interface Picklist extends BaseDTO
    {
        isExtensible?: boolean;
        isKeptSorted?: boolean;
        isLocked?: boolean;
        savesValues?: boolean;
        linkedField?: string;
        values?: string[];
    }

    export interface BaseViewDefinition extends BaseDTO
    {
        name?: string;
        description?: string;
        type?: string;
        options?: any;
        order?: number;
        visibility?: VisibilityRules;
    }

    export interface ViewDefinition extends BaseViewDefinition
    {
        viewSetID?: number;
        fields?: ViewField[];
    }

    export interface PanelDefinition extends BaseViewDefinition
    {
        panelSetID?: number;
        fields?: PanelField[];
    }

    export interface FormDefinition extends BaseViewDefinition
    {
        formSetID?: number;
        fields?: FormField[];
    }

    export interface FieldOptions
    {
        readOnly?: boolean;
        hideIfBlank?: boolean;
        spanTwoColumns?: boolean;
        multiline?: boolean;
        mandatory?: boolean;
        width?: number;
    }

    export interface BaseViewField extends BaseDTO
    {
        viewDefID?: number;
        fieldDefID?: string;
        fieldDefinition?: FieldDefinition;
        options?: FieldOptions;
    }
    
    export interface ViewField extends BaseViewField
    {}

    export interface PanelField extends BaseViewField
    {}

    export interface FormField extends BaseViewField
    {}

    export interface VisibilityRules
    {
        visibleToGroups?: string[];
        hiddenFromGroups?: string[];
        visibleToRoles?: string[];
        hiddenFromRoles?: string[];
        visibleToClients?: string[];
        hiddenFromClients?: string[];
        notDisplayed?: boolean;
    }

    export interface Service extends BaseDTO
    {
        serviceType?: string;
        serviceUID?: string;
        name?: string;
        description?: string;
        createdDate?: number;
        lastModifiedDate?: number;
        statusCode?: number;
        status?: string;
        statusDetails?: string;
        statusData?: any;
        config?: any;
        data?: any;
    }

    export interface Job extends BaseDTO
    {
        jobType?: string;
        userID?: number;
        createdDate?: number;
        lastModifiedDate?: number;
        description?: string;
        status?: string;
        percentComplete?: number;
        serviceType?: string;
        allocatedToService?: string;
        allocatedDate?: number;
        data?: any;
        formattedData?: string;
    }

    export interface JobResult extends BaseDTO
    {
        jobID?: number;
        succeeded?: boolean;
        createdDate?: number;
        output?: string;
    }

    export interface LogEntry
    {
        time?: number;
        userID?: number;
        type?: number;
        logUser?: string;
        logHost?: string;
        action?: string;
        details?: string;
        numClips?: number;
        objectType?: number;
        objectID?: number;
        data?: any;
    }

    export interface CommandArgument
    {
        name?: string;
        label?: string;
        type?: string; // one of "text", "radio", "list", "combo", etc.
        flags?: string; 
        options?: string[];
        initialValue?: string;
        data?: string[][];
        children?: CommandArgument[]
   }

    export interface ArgumentForm
    {
        title?: string;
        flags?: string;
        errorMessage?: string;
        items?: CommandArgument[]
        isLegacyCommandArguments?: boolean;
    }

    export interface ServerCommand 
    {
        id?: number;  // unique id of the command, assigned by server
        name?: string; // command name
        ui?: string; // where the command should appear in the UI (menu or search)
        arguments: CommandArgument[]; // arguments that the command takes
        requiresClip: boolean; // does a clip need to be selected?
    }

    export interface CommandParams 
    {
        commandName?: string;
        event?: string;
        clipIDs?: number[];
        arguments?: string[];
    }

    export interface CommandResults 
    {
        message: string;
        resultMode: number;
        clipIDs: number[];
        chainedCommand: ServerCommand;
    }

    export interface ClipBasketItem
    {
        clipID: number;
        clipName: string;
        posterID: number;
        pos: number;
    }

    export interface ClipBasketAction
    {
        icon: string;
        name: string;
        serverCommand: ServerCommand;
    }

    export interface ClipBasketOperationResult
    {
        added?: number;
        alreadyPresent?: number;
        removed?: number;
        notFound?: number;
        items: ClipBasketItem[];
    }

    export interface WebTheme
    {
        name?: string;
        settings?: any;
     }
    
    export interface WebWorkspace extends BaseDTO
    {
        name?: string;
        settings?: any;
        visibility?: VisibilityRules;
        pos?: number;
    }

    export interface WebWorkspaceSchemaItem
    {
        section: string;
        name: string;
        description: string;
        inputType: string;
        values: any;
        defaultValue: any;
    }
    
    // The active WebWorkspace schema for this session set in PageHeader
    export interface SettingsSchema
    {
        // Global Server Setting
        useAccessControlLists: boolean;
        canDownloadMedia: boolean;
        canDownloadOriginals: boolean;
        canDownloadProxies: boolean;
        canUploadMedia: boolean;
        sharedLinkDownloadUrl: string;
        webPlayer: string;
        dateTimeFormat: string;

        // Workspace Settings
        simpleSearchField: string;
        canSearch: boolean;
        canSearchAdvanced: boolean;
        canBrowseByCatalog: boolean;
        canBrowseByMediaPath: boolean;
        canBrowseSmartFolders: boolean;
        canBrowseClipLists: boolean;
        canFilterResults: boolean;
        canEditClipLists: boolean;
        canEditSmartFolders: boolean;
        canExportAsXML: boolean;
        canAddToClipBasket: boolean;
        canSaveClipBasket: boolean;
        defaultClipViewType: string;
        defaultClipView: string;
        clipsPageSize: number;
        searchAlias: string;
        catalogAlias: string;
        catalogsAlias: string;
        smartFolderAlias: string;
        smartFoldersAlias: string;
        clipBasketLongAlias: string;
        clipBasketShortAlias: string;
        clipListAlias: string;
        clipListsAlias: string;
        showRecentClips: boolean;
        initialMessage: string;
        noResultsMessage: string;
    }

}