module logic
{
    import Clip = catdv.Clip;
    import User = catdv.User;
    import FieldDefinition = catdv.FieldDefinition;
    import DateUtil = catdv.DateUtil;
    import TimecodeUtil = catdv.TimecodeUtil;
    import AudioFormatUtil = catdv.AudioFormatUtil;
    import VideoFormatUtil = catdv.VideoFormatUtil;
    import ArchiveStatusUtil = catdv.ArchiveStatusUtil;

    export interface FieldAccessor
    {
        getValue(object: any): any;
        setValue(object: any, value: any);
    }

    class AbstractFieldAccessor implements FieldAccessor
    {
        private fieldDef: FieldDefinition;

        constructor(fieldDef: FieldDefinition)
        {
            this.fieldDef = fieldDef;
        }

        public getValue(object: any): any
        {
            var containerObject = this.getContainerObject(this.fieldDef, object);
            var value = (containerObject != null) ? containerObject[this.fieldDef.identifier] : "Not supported";
            if (value)
            {
                if (this.fieldDef.isMultiValue)
                {
                    if (value instanceof Array)
                    {
                        return value;
                    }
                    else
                    {
                        return String(value).split("\n");
                    }
                }
                else if ((this.fieldDef.fieldType == "date") || (this.fieldDef.fieldType == "datetime") || (this.fieldDef.fieldType == "time"))
                {
                    // Built-in fields store dates/time as milliseconds, whereas user fields store them as strings
                    if (this.fieldDef.isBuiltin)
                    {
                        return new Date(Number(value));
                    }
                    else
                    {
                        return DateUtil.parse(String(value));
                    }
                }
                else
                {
                    return value;
                }
            }
            else
            {
                return this.fieldDef.isMultiValue ? [] : "";
            }
        }

        public setValue(object: any, value: any)
        {
            var containerObject = this.getContainerObject(this.fieldDef, object);
            if (containerObject != null)
            {
                if (typeof value != 'undefined')
                {
                    if (value != null)
                    {
                        if (this.fieldDef.isMultiValue)
                        {
                            if (value instanceof Array)
                            {
                                // So code works with 6.9 and 7 send multi-value values back to server as newline separated
                                // string. Server 7 will convert to array server-side.
                                value = (<Array<any>>value).join("\n");
                            }
                        }
                        else if ((this.fieldDef.fieldType == "date") || (this.fieldDef.fieldType == "datetime") || (this.fieldDef.fieldType == "time"))
                        {
                            // Built-in fields sotre dates/time as milliseconds, whereas user fields store them as strings
                            if (this.fieldDef.isBuiltin)
                            {
                                value = (<Date>value).getTime();
                            }
                            else
                            {
                                value = DateUtil.format(<Date>value, DateUtil.ISO_DATETIME_FORMAT);
                            }
                        }
                    }
                    containerObject[this.fieldDef.identifier] = value;
                }
            }
        }
        
        // Return the object that contains the field specified by the given FieldDefinition
        public getContainerObject(fieldDefinition: FieldDefinition, object: any): any
        { /* Abstract */ }
    }

    class StandardClipFieldAccessor extends AbstractFieldAccessor
    {
        constructor(fieldDef: FieldDefinition)
        {
            super(fieldDef);
        }

        public getContainerObject(fieldDefinition: FieldDefinition, clip: Clip): any
        {
            switch (fieldDefinition.memberOf)
            {
                case "clip":
                    if (fieldDefinition.isBuiltin)
                    {
                        return clip;
                    }
                    else
                    {
                        if (!clip.userFields)
                        {
                            clip.userFields = {};
                        }
                        return clip.userFields;
                    }

                case "catalog":
                    if (fieldDefinition.isBuiltin)
                    {
                        return clip.catalog;
                    }
                    else
                    {
                        if (!clip.catalog.fields)
                        {
                            clip.catalog.fields = {};
                        }
                        return clip.catalog.fields;
                    }

                case "media":
                    if (!clip.media)
                    {
                        clip.media = {};
                    }
                    if (fieldDefinition.isBuiltin)
                    {
                        return clip.media;
                    }
                    else
                    {
                        if (!clip.media.metadata)
                        {
                            clip.media.metadata = {};
                        }
                        return clip.media.metadata;
                    }

                case "importSource":
                    if (!clip.importSource)
                    {
                        clip.importSource = {};
                    }
                    if (fieldDefinition.isBuiltin)
                    {
                        return clip.importSource;
                    }
                    else
                    {
                        if (!clip.importSource.metadata)
                        {
                            clip.importSource.metadata = {};
                        }
                        return clip.importSource.metadata;
                    }

                default:
                    return null;

            }
        }
    }

    export class UserFieldAccessor extends AbstractFieldAccessor
    {
        constructor(fieldDef: FieldDefinition)
        {
            super(fieldDef);
        }

        public getContainerObject(fieldDefinition: FieldDefinition, user: User): any
        {
            if (fieldDefinition.isBuiltin)
            {
                return user;
            }
            else
            {
                if (!user.fields)
                {
                    user.fields = {};
                }
                return user.fields;
            }
        }
    }

    class MediaPathAccessor implements FieldAccessor
    {
        private fieldDef: FieldDefinition;
        private viewingSharedLink : boolean;

        constructor(fieldDef: FieldDefinition, viewingSharedLink : boolean)
        {
            this.fieldDef = fieldDef;
            this.viewingSharedLink = viewingSharedLink;
        }

        public getValue(clip: Clip): any
        {
            var link: { path?: string; downloadUrl?: string, viewUrl?: string } = {};

            if (this.fieldDef.ID == "MF") // Media Path
            {
                link.path = clip.media ? clip.media.filePath : null;
                if (!this.viewingSharedLink)
                {
                    link.downloadUrl = ClipManager.getDownloadUrl(clip, true, false, true);
                    link.viewUrl = ClipManager.getDownloadUrl(clip, true, false, false);
                }
            }
            else if (this.fieldDef.ID == "PF") // Proxy Path
            {
                link.path = clip.media ? clip.media.proxyPath : null;
                if (!this.viewingSharedLink)
                {
                    link.downloadUrl = ClipManager.getDownloadUrl(clip, false, true, true);
                    link.viewUrl = ClipManager.getDownloadUrl(clip, false, true, false);
                }
            }
            return link;
        }

        public setValue(clip: Clip, value: any)
        {
            /* Read only */
        }
    }

    class TimecodeFieldAccessor extends StandardClipFieldAccessor
    {
        constructor(fieldDef: FieldDefinition)
        {
            super(fieldDef);
        }

        public getValue(clip: Clip): any
        {
            var timecode = super.getValue(clip);
            return timecode.txt || TimecodeUtil.formatTimecode(timecode);
        }

        public setValue(clip: Clip, value: any)
        {
            super.setValue(clip, value ? TimecodeUtil.parseTimecode(value, clip["in"].fmt) : null);
        }
    }

    // Custom Bindings for calculated fields
    class CustomAccessor implements FieldAccessor
    {
        private fieldDef: FieldDefinition;
        private getter: (clip: Clip) => any;

        constructor(fieldDef: FieldDefinition, getter: (clip: Clip) => any)
        {
            this.fieldDef = fieldDef;
            this.getter = getter;
        }

        public getValue(clip: Clip): any
        {
            return this.getter(clip);
        }

        public setValue(clip: Clip, value: any)
        {
            /* Read only */
        }
    }

    class CompositeAccessor implements FieldAccessor
    {
        private fieldDefs: FieldDefinition[];
        private fieldAccessors: FieldAccessor[];

        constructor(fieldDefs: FieldDefinition[])
        {
            this.fieldDefs = fieldDefs;
            this.fieldAccessors = [];
            this.fieldDefs.forEach((fieldDef) =>
            {
                this.fieldAccessors.push(new StandardClipFieldAccessor(fieldDef));
            });
        }

        public getValue(clip: Clip): any
        {
            var values = [];
            this.fieldAccessors.forEach((fieldAccessor) =>
            {
                values.push(fieldAccessor.getValue(clip));
            });
            return values;
        }

        public setValue(clip: Clip, value: any)
        {
            var values: any[] = value || [];
            for (var i = 0; i < values.length && i < this.fieldAccessors.length; i++)
            {
                if (this.fieldDefs[i].isEditable)
                {
                    this.fieldAccessors[i].setValue(clip, values[i]);
                }
            }
        }
    }

    export class AccessorFactory
    {
        public static createAccessor(fieldDef: FieldDefinition, viewingSharedLink : boolean): FieldAccessor
        {
            switch (fieldDef.ID)
            {
                case "IO":
                    return new CustomAccessor(fieldDef,(clip: Clip) =>
                    {
                        return TimecodeUtil.formatTimecode(clip["in"]) + " - " + (clip.out ? TimecodeUtil.formatTimecode(clip.out) : "--:--:--:--");
                    });
                case "IO2":
                    return new CustomAccessor(fieldDef,(clip: Clip) =>
                    {
                        return TimecodeUtil.formatTimecode(clip.in2) + " - " + (clip.out2 ? TimecodeUtil.formatTimecode(clip.out2) : "--:--:--:--");
                    });
                case "CAT":
                    return new CustomAccessor(fieldDef,(clip: Clip) =>
                    {
                        return clip.catalog.name;
                    });
                case "CGRP":
                    return new CustomAccessor(fieldDef,(clip: Clip) =>
                    {
                        return clip.catalog.groupName;
                    });
                case "RD3":
                    return new CustomAccessor(fieldDef,(clip: Clip) =>
                    {
                        return clip.gmtDate; // TODO: adjust for time zone (clip.clockAdjust)
                    });
                case "AR": // Audio Rate
                    return new CustomAccessor(fieldDef,(clip: Clip) =>
                    {
                        return clip.media ? AudioFormatUtil.getAudioRate(clip.media.audioFormat) : "";
                    });
                case "ACHN": // Audio Channels
                    return new CustomAccessor(fieldDef,(clip: Clip) =>
                    {
                        return clip.media ? AudioFormatUtil.getAudioChannels(clip.media.audioFormat) : "";
                    });
                case "ABIT": // Audio Bits
                    return new CustomAccessor(fieldDef,(clip: Clip) =>
                    {
                        return clip.media ? AudioFormatUtil.getAudioBits(clip.media.audioFormat) : "";
                    });

                case "FR": // Frame Rate
                    return new CustomAccessor(fieldDef,(clip: Clip) =>
                    {
                        return clip.media ? VideoFormatUtil.getFrameRate(clip.media.videoFormat) : "";
                    });
                case "FS": // Frame Size
                    return new CustomAccessor(fieldDef,(clip: Clip) =>
                    {
                        return clip.media ? VideoFormatUtil.getFrameSize(clip.media.videoFormat) : "";
                    });

                case "SM": // Source media file name
                    return new CustomAccessor(fieldDef,(clip: Clip) =>
                    {
                        if (!clip.media || !clip.media.filePath) return null;
                        var lastSeparator = Math.max(clip.media.filePath.lastIndexOf("/"), clip.media.filePath.lastIndexOf("\\"));
                        return (lastSeparator != -1) ? clip.media.filePath.substring(lastSeparator + 1) : clip.media.filePath;
                    });
                case "FLD": // Source media file location (full path of parent folder)
                    return new CustomAccessor(fieldDef,(clip: Clip) =>
                    {
                        if (!clip.media || !clip.media.filePath) return null;
                        var lastSeparator = Math.max(clip.media.filePath.lastIndexOf("/"), clip.media.filePath.lastIndexOf("\\"));
                        return (lastSeparator != -1) ? clip.media.filePath.substring(0, lastSeparator) : "";
                    });
                case "ARCHS": // "Archive Status" - Extract archive status part of media.archiveStatus field
                    return new CustomAccessor(fieldDef, (clip: Clip) =>
                    {
                        return clip.media ? ArchiveStatusUtil.getArchiveStatus(clip.media.archiveStatus) : "";
                    });
                case "ARCHT": // "Archive Tape" - Extract archive tape part of media.archiveStatus field
                    return new CustomAccessor(fieldDef, (clip: Clip) =>
                    {
                        return clip.media ? ArchiveStatusUtil.getArchiveTape(clip.media.archiveStatus) : "";
                    });               
                case "RTGTYP": // oddly this is Rating/Type/GPS!
                    return new CompositeAccessor([BuiltInFields["RTG"], BuiltInFields["TY2"], BuiltInFields["GPS"]]);
                case "TYPGPS":
                    return new CompositeAccessor([BuiltInFields["TY2"], BuiltInFields["GPS"]]);
                case "MKHID":
                    return new CompositeAccessor([BuiltInFields["MK"], BuiltInFields["HID"]]);
                case "MF":
                case "PF":
                    return new MediaPathAccessor(fieldDef, viewingSharedLink);
                default:
                    if (fieldDef.fieldType == "timecode")
                    {
                        return new TimecodeFieldAccessor(fieldDef);
                    }
                    else
                    {
                        return new StandardClipFieldAccessor(fieldDef);
                    }
            }
        }
    }
}