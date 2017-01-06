var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var logic;
(function (logic) {
    var DateUtil = catdv.DateUtil;
    var TimecodeUtil = catdv.TimecodeUtil;
    var AudioFormatUtil = catdv.AudioFormatUtil;
    var VideoFormatUtil = catdv.VideoFormatUtil;
    var ArchiveStatusUtil = catdv.ArchiveStatusUtil;
    var AbstractFieldAccessor = (function () {
        function AbstractFieldAccessor(fieldDef) {
            this.fieldDef = fieldDef;
        }
        AbstractFieldAccessor.prototype.getValue = function (object) {
            var containerObject = this.getContainerObject(this.fieldDef, object);
            var value = (containerObject != null) ? containerObject[this.fieldDef.identifier] : "Not supported";
            if (value) {
                if (this.fieldDef.isMultiValue) {
                    if (value instanceof Array) {
                        return value;
                    }
                    else {
                        return String(value).split("\n");
                    }
                }
                else if ((this.fieldDef.fieldType == "date") || (this.fieldDef.fieldType == "datetime") || (this.fieldDef.fieldType == "time")) {
                    // Built-in fields store dates/time as milliseconds, whereas user fields store them as strings
                    if (this.fieldDef.isBuiltin) {
                        return new Date(Number(value));
                    }
                    else {
                        return DateUtil.parse(String(value));
                    }
                }
                else {
                    return value;
                }
            }
            else {
                return this.fieldDef.isMultiValue ? [] : "";
            }
        };
        AbstractFieldAccessor.prototype.setValue = function (object, value) {
            var containerObject = this.getContainerObject(this.fieldDef, object);
            if (containerObject != null) {
                if (typeof value != 'undefined') {
                    if (value != null) {
                        if (this.fieldDef.isMultiValue) {
                            if (value instanceof Array) {
                                // So code works with 6.9 and 7 send multi-value values back to server as newline separated
                                // string. Server 7 will convert to array server-side.
                                value = value.join("\n");
                            }
                        }
                        else if ((this.fieldDef.fieldType == "date") || (this.fieldDef.fieldType == "datetime") || (this.fieldDef.fieldType == "time")) {
                            // Built-in fields sotre dates/time as milliseconds, whereas user fields store them as strings
                            if (this.fieldDef.isBuiltin) {
                                value = value.getTime();
                            }
                            else {
                                value = DateUtil.format(value, DateUtil.ISO_DATETIME_FORMAT);
                            }
                        }
                    }
                    containerObject[this.fieldDef.identifier] = value;
                }
            }
        };
        // Return the object that contains the field specified by the given FieldDefinition
        AbstractFieldAccessor.prototype.getContainerObject = function (fieldDefinition, object) { };
        return AbstractFieldAccessor;
    }());
    var StandardClipFieldAccessor = (function (_super) {
        __extends(StandardClipFieldAccessor, _super);
        function StandardClipFieldAccessor(fieldDef) {
            _super.call(this, fieldDef);
        }
        StandardClipFieldAccessor.prototype.getContainerObject = function (fieldDefinition, clip) {
            switch (fieldDefinition.memberOf) {
                case "clip":
                    if (fieldDefinition.isBuiltin) {
                        return clip;
                    }
                    else {
                        if (!clip.userFields) {
                            clip.userFields = {};
                        }
                        return clip.userFields;
                    }
                case "catalog":
                    if (fieldDefinition.isBuiltin) {
                        return clip.catalog;
                    }
                    else {
                        if (!clip.catalog.fields) {
                            clip.catalog.fields = {};
                        }
                        return clip.catalog.fields;
                    }
                case "media":
                    if (!clip.media) {
                        clip.media = {};
                    }
                    if (fieldDefinition.isBuiltin) {
                        return clip.media;
                    }
                    else {
                        if (!clip.media.metadata) {
                            clip.media.metadata = {};
                        }
                        return clip.media.metadata;
                    }
                case "importSource":
                    if (!clip.importSource) {
                        clip.importSource = {};
                    }
                    if (fieldDefinition.isBuiltin) {
                        return clip.importSource;
                    }
                    else {
                        if (!clip.importSource.metadata) {
                            clip.importSource.metadata = {};
                        }
                        return clip.importSource.metadata;
                    }
                default:
                    return null;
            }
        };
        return StandardClipFieldAccessor;
    }(AbstractFieldAccessor));
    var UserFieldAccessor = (function (_super) {
        __extends(UserFieldAccessor, _super);
        function UserFieldAccessor(fieldDef) {
            _super.call(this, fieldDef);
        }
        UserFieldAccessor.prototype.getContainerObject = function (fieldDefinition, user) {
            if (fieldDefinition.isBuiltin) {
                return user;
            }
            else {
                if (!user.fields) {
                    user.fields = {};
                }
                return user.fields;
            }
        };
        return UserFieldAccessor;
    }(AbstractFieldAccessor));
    logic.UserFieldAccessor = UserFieldAccessor;
    var MediaPathAccessor = (function () {
        function MediaPathAccessor(fieldDef, viewingSharedLink) {
            this.fieldDef = fieldDef;
            this.viewingSharedLink = viewingSharedLink;
        }
        MediaPathAccessor.prototype.getValue = function (clip) {
            var link = {};
            if (this.fieldDef.ID == "MF") {
                link.path = clip.media ? clip.media.filePath : null;
                if (!this.viewingSharedLink) {
                    link.downloadUrl = logic.ClipManager.getDownloadUrl(clip, true, false, true);
                    link.viewUrl = logic.ClipManager.getDownloadUrl(clip, true, false, false);
                }
            }
            else if (this.fieldDef.ID == "PF") {
                link.path = clip.media ? clip.media.proxyPath : null;
                if (!this.viewingSharedLink) {
                    link.downloadUrl = logic.ClipManager.getDownloadUrl(clip, false, true, true);
                    link.viewUrl = logic.ClipManager.getDownloadUrl(clip, false, true, false);
                }
            }
            return link;
        };
        MediaPathAccessor.prototype.setValue = function (clip, value) {
            /* Read only */
        };
        return MediaPathAccessor;
    }());
    var TimecodeFieldAccessor = (function (_super) {
        __extends(TimecodeFieldAccessor, _super);
        function TimecodeFieldAccessor(fieldDef) {
            _super.call(this, fieldDef);
        }
        TimecodeFieldAccessor.prototype.getValue = function (clip) {
            var timecode = _super.prototype.getValue.call(this, clip);
            return timecode.txt || TimecodeUtil.formatTimecode(timecode);
        };
        TimecodeFieldAccessor.prototype.setValue = function (clip, value) {
            _super.prototype.setValue.call(this, clip, value ? TimecodeUtil.parseTimecode(value, clip["in"].fmt) : null);
        };
        return TimecodeFieldAccessor;
    }(StandardClipFieldAccessor));
    // Custom Bindings for calculated fields
    var CustomAccessor = (function () {
        function CustomAccessor(fieldDef, getter) {
            this.fieldDef = fieldDef;
            this.getter = getter;
        }
        CustomAccessor.prototype.getValue = function (clip) {
            return this.getter(clip);
        };
        CustomAccessor.prototype.setValue = function (clip, value) {
            /* Read only */
        };
        return CustomAccessor;
    }());
    var CompositeAccessor = (function () {
        function CompositeAccessor(fieldDefs) {
            var _this = this;
            this.fieldDefs = fieldDefs;
            this.fieldAccessors = [];
            this.fieldDefs.forEach(function (fieldDef) {
                _this.fieldAccessors.push(new StandardClipFieldAccessor(fieldDef));
            });
        }
        CompositeAccessor.prototype.getValue = function (clip) {
            var values = [];
            this.fieldAccessors.forEach(function (fieldAccessor) {
                values.push(fieldAccessor.getValue(clip));
            });
            return values;
        };
        CompositeAccessor.prototype.setValue = function (clip, value) {
            var values = value || [];
            for (var i = 0; i < values.length && i < this.fieldAccessors.length; i++) {
                if (this.fieldDefs[i].isEditable) {
                    this.fieldAccessors[i].setValue(clip, values[i]);
                }
            }
        };
        return CompositeAccessor;
    }());
    var AccessorFactory = (function () {
        function AccessorFactory() {
        }
        AccessorFactory.createAccessor = function (fieldDef, viewingSharedLink) {
            switch (fieldDef.ID) {
                case "IO":
                    return new CustomAccessor(fieldDef, function (clip) {
                        return TimecodeUtil.formatTimecode(clip["in"]) + " - " + (clip.out ? TimecodeUtil.formatTimecode(clip.out) : "--:--:--:--");
                    });
                case "IO2":
                    return new CustomAccessor(fieldDef, function (clip) {
                        return TimecodeUtil.formatTimecode(clip.in2) + " - " + (clip.out2 ? TimecodeUtil.formatTimecode(clip.out2) : "--:--:--:--");
                    });
                case "CAT":
                    return new CustomAccessor(fieldDef, function (clip) {
                        return clip.catalog.name;
                    });
                case "CGRP":
                    return new CustomAccessor(fieldDef, function (clip) {
                        return clip.catalog.groupName;
                    });
                case "RD3":
                    return new CustomAccessor(fieldDef, function (clip) {
                        return clip.gmtDate; // TODO: adjust for time zone (clip.clockAdjust)
                    });
                case "AR":
                    return new CustomAccessor(fieldDef, function (clip) {
                        return clip.media ? AudioFormatUtil.getAudioRate(clip.media.audioFormat) : "";
                    });
                case "ACHN":
                    return new CustomAccessor(fieldDef, function (clip) {
                        return clip.media ? AudioFormatUtil.getAudioChannels(clip.media.audioFormat) : "";
                    });
                case "ABIT":
                    return new CustomAccessor(fieldDef, function (clip) {
                        return clip.media ? AudioFormatUtil.getAudioBits(clip.media.audioFormat) : "";
                    });
                case "FR":
                    return new CustomAccessor(fieldDef, function (clip) {
                        return clip.media ? VideoFormatUtil.getFrameRate(clip.media.videoFormat) : "";
                    });
                case "FS":
                    return new CustomAccessor(fieldDef, function (clip) {
                        return clip.media ? VideoFormatUtil.getFrameSize(clip.media.videoFormat) : "";
                    });
                case "SM":
                    return new CustomAccessor(fieldDef, function (clip) {
                        if (!clip.media || !clip.media.filePath)
                            return null;
                        var lastSeparator = Math.max(clip.media.filePath.lastIndexOf("/"), clip.media.filePath.lastIndexOf("\\"));
                        return (lastSeparator != -1) ? clip.media.filePath.substring(lastSeparator + 1) : clip.media.filePath;
                    });
                case "FLD":
                    return new CustomAccessor(fieldDef, function (clip) {
                        if (!clip.media || !clip.media.filePath)
                            return null;
                        var lastSeparator = Math.max(clip.media.filePath.lastIndexOf("/"), clip.media.filePath.lastIndexOf("\\"));
                        return (lastSeparator != -1) ? clip.media.filePath.substring(0, lastSeparator) : "";
                    });
                case "ARCHS":
                    return new CustomAccessor(fieldDef, function (clip) {
                        return clip.media ? ArchiveStatusUtil.getArchiveStatus(clip.media.archiveStatus) : "";
                    });
                case "ARCHT":
                    return new CustomAccessor(fieldDef, function (clip) {
                        return clip.media ? ArchiveStatusUtil.getArchiveTape(clip.media.archiveStatus) : "";
                    });
                case "RTGTYP":
                    return new CompositeAccessor([logic.BuiltInFields["RTG"], logic.BuiltInFields["TY2"], logic.BuiltInFields["GPS"]]);
                case "TYPGPS":
                    return new CompositeAccessor([logic.BuiltInFields["TY2"], logic.BuiltInFields["GPS"]]);
                case "MKHID":
                    return new CompositeAccessor([logic.BuiltInFields["MK"], logic.BuiltInFields["HID"]]);
                case "MF":
                case "PF":
                    return new MediaPathAccessor(fieldDef, viewingSharedLink);
                default:
                    if (fieldDef.fieldType == "timecode") {
                        return new TimecodeFieldAccessor(fieldDef);
                    }
                    else {
                        return new StandardClipFieldAccessor(fieldDef);
                    }
            }
        };
        return AccessorFactory;
    }());
    logic.AccessorFactory = AccessorFactory;
})(logic || (logic = {}));
