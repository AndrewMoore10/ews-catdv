module util
{
    var entityMap = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': '&quot;',
        "'": '&#39;',
        "/": '&#x2F;'
    };


    function float2int(value: number): number
    {
        // Bitwise operations convert their numeric argument (which are normally floats in JS) to ints. 
        // Therefore ORing with ZERO (which is a Noop) has the side effect of converting the input to int!
        return value | 0;
    }

    export class HtmlUtil
    {
        public static escapeHtml(str: string, maxLength?: number)
        {
            var escaped = String(str || "").replace(/[&<>"'\/]/g, function(s)
            {
                return entityMap[s];
            });
            if (maxLength && escaped.length > maxLength)
            {
                return escaped.substr(0, maxLength) + "...";
            }
            else
            {
                return escaped;
            }
        }
    }

    export class PathUtil
    {
        public static getFilename(path: string)
        {
            var separatorIndex = path.lastIndexOf("/");
            if (separatorIndex != -1)
            {
                return path.substring(separatorIndex + 1);
            }
            separatorIndex = path.lastIndexOf("\\");
            if (separatorIndex != -1)
            {
                return path.substring(separatorIndex + 1);
            }
            return path;
        }
    }

    export class Platform
    {

        public static isTouchDevice(): boolean
        {
            try { document.createEvent("TouchEvent"); return true; }
            catch (e) { return false; }
        }

        public static isIOS(): boolean
        {
            return ((navigator.platform == "iPad") || (navigator.platform == "iPhone"));
        }

        public static isMac(): boolean
        {
            return ((navigator.platform == "MacIntel") || (navigator.platform == "Macintosh"));
        }

        public static isSafari(): boolean
        {
            return navigator.userAgent.contains("Safari");
        }

        public static isFirefox(): boolean
        {
            return navigator.userAgent.contains("Firefox");
        }

        public static isIE(): boolean
        {
            return navigator.userAgent.contains("MSIE") || navigator.userAgent.contains("Trident");
        }

        // Pre IE 10
        public static isOldIE(): boolean
        {
            var userAgent = navigator.userAgent;
            var msieIndex = userAgent.indexOf("MSIE");
            if (msieIndex == -1) return false;
            var ieVersion = Number(userAgent.substring(msieIndex + 4, userAgent.indexOf(";", msieIndex + 4)));
            return (ieVersion < 10);
        }
    }

    export class FormatUtil
    {
        public static formatBytes(bytes: number): string
        {
            if ((bytes == null) || (typeof bytes == "undefined")) return "";

            if (bytes < 1024)
            {
                return bytes + " bytes";
            }
            else if (bytes < 1024 * 1024)
            {
                return (bytes / 1024).toFixed(2) + " KB";
            }
            else if (bytes < 1024 * 1024 * 1024)
            {
                return (bytes / (1024 * 1024)).toFixed(2) + " MB";
            }
            else
            {
                return (bytes / (1024 * 1024 * 1024)).toFixed(2) + " GB";
            }
        }

        public static formatBytesPerSecond(bytesPerSecond: number): string
        {
            if ((bytesPerSecond == null) || (typeof bytesPerSecond == "undefined")) return "";

            var bitsPerSecond = bytesPerSecond * 8;

            if (bitsPerSecond < 1000)
            {
                return bitsPerSecond + " b/s";
            }
            else if (bitsPerSecond < 1000 * 1000)
            {
                return (bitsPerSecond / 1000).toFixed(2) + " Kb/s";
            }
            else if (bitsPerSecond < 1000 * 1000 * 1000)
            {
                return (bitsPerSecond / (1000 * 1000)).toFixed(2) + " Mb/s";
            }
            else
            {
                return (bitsPerSecond / (1000 * 1000 * 1000)).toFixed(2) + " Gb/s";
            }
        }

        public static formatAspectRatio(aspectRatio: number): string
        {
            if ((aspectRatio == null) || (typeof aspectRatio == "undefined") || isNaN(aspectRatio)) return "";

            if (float2int(aspectRatio * 90 + 0.5) == 120)
            {
                return "4:3";
            }
            else if (float2int(aspectRatio * 90 + 0.5) == 160)
            {
                return "16:9";
            }
            else if (float2int(aspectRatio * 90 + 0.5) == 210)
            {
                return "21:9";
            }
            else if (float2int(aspectRatio * 90 + 0.5) == 140)
            {
                return "14:9";
            }
            else if (float2int(aspectRatio * 100 + 0.5) == 150)
            {
                return "3:2";
            }
            else if (float2int(aspectRatio * 100 + 0.5) == 125)
            {
                return "5:4";
            }
            else
            {
                return aspectRatio.toFixed(2);
            }
        }

        public static formatGPS(packedLatLong: string): string
        {
            var longLat: string[] = packedLatLong.split(",");
            var longitude = parseFloat(longLat[0]);
            var latitude = parseFloat(longLat[1]);
            return FormatUtil.floatToDMS(longitude) + "," + FormatUtil.floatToDMS(latitude);
        }

        private static floatToDMS(degrees: number): string
        {
            var wholeDegrees = float2int(degrees);
            var mins = (degrees - wholeDegrees) * 60;
            var whileMins = float2int(mins);
            var secs = (mins - whileMins) * 60;
            return wholeDegrees + "&deg;" + whileMins + '"' + secs.toFixed(1) + "'";
        }
    }
    
    export interface RGBA
    {
        r: number, g: number, b: number, a?: number
    }

    export interface HSLA
    {
        h: number, s: number, l: number, a?: number
    }

    export class ColorUtil
    {
        public static hsl2rgb(hsl : HSLA) : RGBA
        {
            if(!hsl) return null;
            
            var r, g, b;

            if (hsl.s == 0)
            {
                r = g = b = hsl.l; 
            } 
            else
            {
                var hue2rgb = (p, q, t) =>
                {
                    if (t < 0) t += 1;
                    if (t > 1) t -= 1;
                    if (t < 1 / 6) return p + (q - p) * 6 * t;
                    if (t < 1 / 2) return q;
                    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
                    return p;
                };

                var q = hsl.l < 0.5 ? hsl.l * (1 + hsl.s) : hsl.l + hsl.s - hsl.l * hsl.s;
                var p = 2 * hsl.l - q;
                r = hue2rgb(p, q, hsl.h + 1 / 3);
                g = hue2rgb(p, q, hsl.h);
                b = hue2rgb(p, q, hsl.h - 1 / 3);
            }
            return { "r": Math.round(r * 255), "g" : Math.round(g * 255), "b" : Math.round(b * 255),  "a" : hsl.a };
        }

        public static rgb2hsl(rgb: RGBA) : HSLA
        {
            if(!rgb) return null;

            rgb.r /= 255, rgb.g /= 255, rgb.b /= 255;
            var max = Math.max(rgb.r, rgb.g, rgb.b), min = Math.min(rgb.r, rgb.g, rgb.b);
            var h, s, l = (max + min) / 2;

            if (max == min)
            {
                h = s = 0; 
            } 
            else
            {
                var d = max - min;
                s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
                switch (max)
                {
                    case rgb.r: h = (rgb.g - rgb.b) / d + (rgb.g < rgb.b ? 6 : 0); break;
                    case rgb.g: h = (rgb.b - rgb.r) / d + 2; break;
                    case rgb.b: h = (rgb.r - rgb.g) / d + 4; break;
                }
                h /= 6;
            }
            return { "h" : h, "s" : s, "l" : l, "a" : rgb.a };
        }
        
        public static rgb2hex(rgb: RGBA)
        {
            return rgb ? "#" + ColorUtil.toHex(rgb.r) + ColorUtil.toHex(rgb.g) + ColorUtil.toHex(rgb.b) : null;
        }
        
        public static parseHex(hex: string): RGBA
        {
            if(hex == null) return null;

            if (hex.match("^#[0-9a-fA-F]{3}$"))
            {
                return {
                    "r": parseInt(hex.substr(1, 1) + hex.substr(1, 1), 16),
                    "g": parseInt(hex.substr(2, 1) + hex.substr(2, 1), 16),
                    "b": parseInt(hex.substr(3, 1) + hex.substr(3, 1), 16)
                };
            }
            else if (hex.match("^#[0-9a-fA-F]{6}$"))
            {
                return {
                    "r": parseInt(hex.substr(1, 2), 16),
                    "g": parseInt(hex.substr(3, 2), 16),
                    "b": parseInt(hex.substr(5, 2), 16)
                };
            }
            else
            {
                return null;
            }
        }

        private static toHex(d)
        {
            return ("0" + (Number(d).toString(16))).slice(-2).toUpperCase()
        }
    }
}

module catdv
{
    // These lookup tables are created by the server and emitted into a script in the head of calling jsp
    declare var roleLookup;
    declare var groupLookup;
    declare var clientLookup;

    export class TimecodeUtil
    {
        public static formatTimecode(timecode: Timecode)
        {
            if (!timecode || isNaN(timecode.secs)) return "-:--:--:--";

            var frames;

            // There are two strategies for dealing with formats with non-integer framerates:
            //
            // 1 - Drop Frame (DF) - attempts to keep the indicated timecode roughly the same as the wallclock time
            //     It does this by having the frame number in the timecode periodically only going to N-1
            //     e.g. for 29.97 fps the frame number normally runs 0-29, but periodically runs 0-28. (meaning indicated timecode 
            //     seconds are not all the same length - they jitter - but over many frames the timecode's hh:mm:ss stay
            //     in sync with real elapsed time)
            //     Note: all frames are still displayed - the 'dropping' just refers the the displayed frame numbers
            //
            // 2 - Non-drop-frame (NDF) - the timecode indicator effectively becomes a frame counter, with the 'seconds' column
            //     measuring units of 30 (or whatever) frames, rather than real seconds. Therefore the hh:mm:ss displayed in the 
            //     timecode drift out of sync with the actual elapsed time
            // 

            if (TimecodeUtil.isNonDropFrameFormat(timecode.fmt))
            {
                // For non-drop-frame formats frames in the timecode map one-to-one with frames in the media 
                // so calculate the frames using the real framerate. (However the 'frames' aren't really
                // 1/30th second long so when we subsequently convert them to hh:mm:ss assuming they
                // are 1/30th long the hh:mm:ss will not represent wallclock time.) 
                frames = timecode.secs * TimecodeUtil.getFrameRate(timecode.fmt);
            }
            else
            {
                // For drop-frame we calculate notional frames, where each frame is exactly 1/30th (or whatever) seconds long.
                // This means when we subsequently convert them to hh:mm:ss using the assumption that they are 1/30th second
                // long then the resultant hh:mm:ss will correspond to wallclock time. However the
                // calculated frame numbers will contain a fractional part that represents the error between the real and notional
                // frame length, and this error will accumulate over time until rounding causes the frame
                // number to skip a value - as required by the DF format.
                // Note: integer framerates come through here too, but notional == actual for them so it has no effect
                frames = timecode.secs * TimecodeUtil.getNotionalFrameRate(timecode.fmt);
            }

            // fps is number of frames per indicated timecode second (which for NDF is longer than a wallclock second)
            var fps = TimecodeUtil.getNotionalFrameRate(timecode.fmt);

            var hours = Math.floor(frames / (fps * 60 * 60));
            frames -= hours * (fps * 60 * 60);
            var minutes = Math.floor(frames / (fps * 60));
            frames -= minutes * (fps * 60);
            var seconds = Math.floor(frames / fps);
            frames -= seconds * fps;

            if (timecode.fmt == 6000 /* TimecodeFormat.P60_NTSC_NDF_FORMAT */) // MOD30
            {
                frames = frames / 2;
            }

            var hhmmss = TimecodeUtil.twoDigits(hours) + ":" + TimecodeUtil.twoDigits(minutes) + ":" + TimecodeUtil.twoDigits(seconds);

            switch (timecode.fmt)
            {
                case 1 /* TimecodeFormat.WHOLE_SECONDS_FORMAT */:
                    return hhmmss;

                case 10 /* TimecodeFormat.DECIMAL_FORMAT */:
                    return hhmmss + "." + Math.floor(frames);

                case 100 /* TimecodeFormat.HUNDREDTHS_FORMAT */:
                    return hhmmss + "." + TimecodeUtil.twoDigits(Math.floor(frames));

                case 2398 /* TimecodeFormat.P24_NTSC_FORMAT */:
                case 24 /* TimecodeFormat.P24_FORMAT */:
                    return hhmmss + "'" + TimecodeUtil.twoDigits(Math.floor(frames));

                case 2997 /* TimecodeFormat.NTSC_DF_FORMAT */:
                case 5994 /* TimecodeFormat.P60_NTSC_DF_FORMAT */:
                    return hhmmss + ";" + TimecodeUtil.twoDigits(Math.floor(frames));

                default:
                    return hhmmss + ":" + TimecodeUtil.twoDigits(Math.floor(frames));
            }
        }

        // TODO: this needs to take account of drop-frame formats
        public static parseTimecode(timecodeString: string, timecodeFormat: TimecodeFormat): Timecode
        {
            if (!timecodeString) return null;

            var fields = timecodeString.split(/[:;'.]/);
            var hours = Number(fields[0]);
            var mins = Number(fields[1]);
            var secs = Number(fields[2]);
            var frames = Number(fields.length > 3 ? fields[3] : "0");

            var seconds = hours * (3600) + mins * 60 + secs;

            switch (timecodeFormat)
            {
                case 1 /* TimecodeFormat.WHOLE_SECONDS_FORMAT */:
                    break;

                case 10 /* TimecodeFormat.DECIMAL_FORMAT */:
                case 100 /* TimecodeFormat.HUNDREDTHS_FORMAT */:
                    seconds += Number("0." + frames);
                    break;

                default:
                    var frameRate = TimecodeUtil.getNotionalFrameRate(timecodeFormat);
                    seconds += Number(frames) / frameRate;
                    break;
            }

            if (TimecodeUtil.isNonDropFrameFormat(timecodeFormat))
            {
                seconds = seconds * TimecodeUtil.getNotionalFrameRate(timecodeFormat) / TimecodeUtil.getFrameRate(timecodeFormat);
            }

            var frames = Math.floor(seconds * TimecodeUtil.getFrameRate(timecodeFormat));
            return { secs: seconds, frm: frames, fmt: timecodeFormat, txt: timecodeString };

        }


        public static getFrameRate(timecodeFormat: TimecodeFormat): number
        {
            switch (timecodeFormat)
            {
                case 2398 /* TimecodeFormat.P24_NTSC_FORMAT */:
                    return 24 / 1.001;
                case 3000 /* TimecodeFormat.NTSC_NDF_FORMAT */:
                    return 30 / 1.001;
                case 6000 /* TimecodeFormat.P60_NTSC_NDF_FORMAT */:
                    return 60 / 1.001;
                default:
                    return (timecodeFormat > 1000) ? (Math.floor(Number(timecodeFormat) / 100.0 + 0.5)) / 1.001 : Number(timecodeFormat);
            }
        }

        // Get the rounded-up integer framerate for the format (so 29.97 -> 30 etc.)
        // This value will always be the number of frames in each timecode second even for non-iteger framerates (DF & NDF).
        private static getNotionalFrameRate(fmt: number): number
        {
            return (fmt > 1000) ? (Math.floor(Number(fmt) / 100.0 + 0.5)) : Number(fmt);
        }

        // Formats with a non-integer framerate, where we periodically skip one in the frames column of the timcode to keep the 
        // timecode in sync with the wallclock time. This means tiemcode 1:00:00:00 corresponds to wallclock time of one hour
        public static isDropFrameFormat(fmt: TimecodeFormat): boolean
        {
            return fmt == 2997 /* TimecodeFormat.NTSC_DF_FORMAT */ || fmt == 5994 /* TimecodeFormat.P60_NTSC_DF_FORMAT */;
        }

        // Formats with a non-integer framerate, where we do not periodically drop timcode frames to keep the timecode in sync
        // with the wallclock time. This means 1:00:00:00 doesn't correspond to a wallclock time of exactly one hour
        public static isNonDropFrameFormat(fmt: TimecodeFormat): boolean
        {
            return fmt == 2398 /* TimecodeFormat.P24_NTSC_FORMAT */ || fmt == 3000 /* TimecodeFormat.NTSC_NDF_FORMAT */ || fmt == 6000 /* TimecodeFormat.P60_NTSC_NDF_FORMAT */;
        }


        // Strip out text and frames parts of timecodes (we do all the calculations in seconds
        // so frames and text are not guarateed to be correct)
        public static simplify(tc: Timecode)
        {
            delete (tc.frm);
            delete (tc.txt);
        }

        private static twoDigits(n: number): string
        {
            var tmp = ("0" + n);
            return tmp.substring(tmp.length - 2);
        }
    }

    export class DateUtil
    {
        public static ISO_DATETIME_FORMAT = "YYYY-MM-DD HH:mm:ss";
        public static ISO_DATE_FORMAT = "YYYY-MM-DD";
        public static ISO_TIME_FORMAT = "HH:mm:ss";

        public static format(date: Date, format: string = null): string
        {
            return moment(date).format(format);
        }

        public static parse(dateString: string, format: string = null): Date
        {
            return moment(dateString, format).toDate();
        }
    }

    export class VideoFormatUtil
    {
        public static getFrameRate(videoFormat: string): string
        {
            if (videoFormat == null) return "";
            var e = videoFormat.indexOf("fps");
            var s = e < 0 ? -1 : videoFormat.lastIndexOf(" ", e);
            if (s >= 0)
            {
                return videoFormat.substring(s + 1, e);
            }
            else if (videoFormat.endsWith(" still)"))
            {
                return "Still";
            }
            else
            {
                return "";
            }
        }

        public static getFrameSize(videoFormat: string): string
        {
            if (videoFormat == null) return "";

            var n = videoFormat.lastIndexOf('(');
            if (n < 0)
            {
                return null;
            }
            var p = videoFormat.indexOf(' ', n);
            var q = videoFormat.indexOf(')', n);
            if (p < 0 && q < 0)
            {
                return null;
            }
            if (p < 0 || q >= 0 && q < p)
            {
                p = q;
            }
            return videoFormat.substring(n + 1, p);
        }
    }

    export class AudioFormatUtil
    {
        public static getAudioRate(audioFormat: string): string
        {
            if (audioFormat == null) return "";
            var p1 = audioFormat.lastIndexOf('(');
            var p2 = audioFormat.indexOf(", ", p1);
            var p3 = audioFormat.indexOf(')', p1);
            return (p1 > 0 && p2 > 0 && p3 > 0) ? audioFormat.substring(p1 + 1, p2) : null;
        }

        public static getAudioChannels(audioFormat: string): string
        {
            if (audioFormat == null) return "";
            var p = audioFormat.indexOf(", ");
            if (p < 0 || !audioFormat.endsWith(")")) return "unknown";
            var tmp = audioFormat.substring(p + 2);
            p = tmp.indexOf(", ");
            if (p < 0) p = tmp.indexOf(")");
            return tmp.substring(0, p);
        }

        public static getAudioBits(audioFormat: string): string
        {
            if (audioFormat == null || !audioFormat.endsWith(" bit)") || audioFormat.indexOf(',') < 0) return "";
            return audioFormat.substring(audioFormat.lastIndexOf(", ") + 2, audioFormat.length - 1);
        }
    }

    export class ArchiveStatusUtil
    {
        /**
         * Parse the archive status field and extract a summary suitable for grouping
         * eg. "Copied to '0012314' (Volumes/Xyz/File1.mp4) on Jan 1 2009; currently on vtape" -> "Copied to '0012314'; currently on vtape"
         */
        public static getArchiveStatus(archiveStatus: string)
        {
            if (!archiveStatus) return null;
            
            var p = archiveStatus.indexOf(" \'");
            if (p < 0) return null;
            
            var msg = archiveStatus.substring(0, p);
            
            var tape = ArchiveStatusUtil.getArchiveTape(archiveStatus, false);
            if (tape != null)
            {
                msg += " '" + tape + "'";
            }
            
            var q = archiveStatus.lastIndexOf(';');         
            if (q > p)
            {
                msg += archiveStatus.substring(q);
            }
            return msg;
        }
        
        /**
         * Parse the archive status field and extract the tape name
         * eg. "Copied to '0012314' (Volumes/Xyz/File1.mp4) on Jan 1 2009" -> "0012314"
         */
        public static getArchiveTape(archiveStatus: string, firstOnly: boolean = true)
        {
            if (!archiveStatus) return null;

            var lines = archiveStatus.split('\n');

            var tapes: string[] = [];

            lines.forEach((line) =>
            {
                var p = line.indexOf('\'');
                var q = line.indexOf('\'', p + 1);

                if (p >= 0 && q >= 0 && p != q)
                {
                    var tape = line.substring(p + 1, q);
                    if (tape != null && !tapes.contains(tape))
                    {
                        tapes.push(tape);
                    }
                }
            });

            if (tapes.length == 0)
            {
                return null;
            }
            else if ((tapes.length == 1) || firstOnly)
            {
                return tapes[0];
            }
            else
            {
                return tapes[0] + "," + tapes[1] + (tapes.length > 2 ? ",..." : "");
            }
        }
    }
    
    export class FieldDefinitionUtil
    {
        // True is this field has associated values (picklist, hiearchy, multi-checkbox etc.)
        public static hasValues(fieldDef: FieldDefinition)
        {
            return fieldDef && fieldDef.fieldType.contains("multi") || fieldDef.fieldType.contains("picklist") || fieldDef.fieldType.contains("hiearchy");
        }

        public static isLinkedField(fieldDef: FieldDefinition)
        {
            return fieldDef && (fieldDef.fieldType == "linked-hierarchy" || fieldDef.fieldType == "multi-linked-hierarchy");
        }
        
        public static isListField(fieldDef: FieldDefinition)
        {
            if (!fieldDef) return false;
            var fieldType = fieldDef.fieldType;
            return fieldType.contains("picklist") || fieldType.contains("hierarchy") || fieldType.contains("radio") || fieldType.contains("multi");
        }

        public static getLongIdentifier(fieldDef: FieldDefinition)
        {
            if (fieldDef.isBuiltin)
            {
                return fieldDef.memberOf + "." + fieldDef.identifier;
            }
            else
            {
                return fieldDef.memberOf + "[" + fieldDef.identifier + "]";
            }
        }

        public static getTooltip(fieldDef: FieldDefinition)
        {
            if (fieldDef.description)
            {
                return fieldDef.description + "<br/><i>" + util.HtmlUtil.escapeHtml(FieldDefinitionUtil.getLongIdentifier(fieldDef)) + "</i>";
            }
            else
            {
                return "<i>" + util.HtmlUtil.escapeHtml(FieldDefinitionUtil.getLongIdentifier(fieldDef)) + "</i>";
            }
        }

        public static getCssClass(fieldDef: FieldDefinition)
        {
            return "field-label " + (fieldDef.isBuiltin ? "builtin-field" : (fieldDef.memberOf == "clip" ? "user-field" : "metadata-field"));
        }

        public static getSortBy(fieldDef: FieldDefinition)
        {
            return fieldDef.isSortable ? fieldDef.memberOf + (fieldDef.isBuiltin ? "." + fieldDef.identifier : "[" + fieldDef.identifier + "]") : null;
        }

        public static makeDummyFieldDefinition(longIdentifier: string): FieldDefinition
        {
            var fieldDef: FieldDefinition = { "fieldType": "text", "canQuery": true };

            var index = longIdentifier.indexOf("[");
            if (index != -1)
            {
                fieldDef.isBuiltin = false;
                fieldDef.memberOf = longIdentifier.substring(0, index);
                fieldDef.identifier = longIdentifier.substring(index + 1, longIdentifier.length - 1);
                fieldDef.name = fieldDef.identifier;
            }
            else
            {
                fieldDef.isBuiltin = true;
                var fields = longIdentifier.split(".");
                fieldDef.memberOf = fields[0];
                fieldDef.identifier = fields[1];
                fieldDef.name = fieldDef.identifier;
            }
            return fieldDef;
        }
    }

    export class QueryDefinitionUtil
    {
        public static toFilterString(queryDef: QueryDefinition): string
        {
            // TODO: handle advanced options like related data
            var filterString = "";
            queryDef.terms.forEach((term) =>
            {
                var params = term.params ? term.params.replaceAll("~", "~7E").replaceAll("(", "~28").replaceAll(")", "~29") : "";
                filterString += (term.logicalOR ? "or" : "and") + (term.logicalNOT ? "Not" : "");
                filterString += "((" + term.field + ")" + term.op + "(" + params + "))";
            });
            return filterString;
        }

        public static toQueryString(queryDef: QueryDefinition): string
        {
            var orTerms = queryDef.terms ? queryDef.terms.filter((term) => term.logicalOR) : [];
            var andTerms = queryDef.terms ? queryDef.terms.filter((term) => !term.logicalOR) : [];

            var queryString = "";
            if (andTerms.length > 0)
            {
                andTerms.forEach((term, i) =>
                {
                    if (i > 0) queryString += "and";
                    var params = term.params ? term.params.replaceAll("~", "~7E").replaceAll("(", "~28").replaceAll(")", "~29") : "";
                    queryString += "((" + term.field + ")" + (term.logicalNOT ? "!" : "") + term.op + "(" + params + "))";
                })
            }
            if (orTerms.length > 0)
            {
                if (andTerms.length > 0) queryString += "and";
                queryString + "(";
                orTerms.forEach((term, i) =>
                {
                    if (i > 0) queryString += "or";
                    var params = term.params ? term.params.replaceAll("~", "~7E").replaceAll("(", "~28").replaceAll(")", "~29") : "";
                    queryString += "((" + term.field + ")" + (term.logicalNOT ? "!" : "") + term.op + "(" + params + "))";
                })
                queryString + ")";
            }
            return queryString;
        }
        
        public static parse(filterText: string): QueryDefinition
        {
            return new FilterTestParser(filterText).parse();
        }
    }

    class FilterTestParser
    {
        private filterText: string;
        private pos: number;
        private c: string;
        private eol: boolean;

        constructor(filterText: string)
        {
            this.filterText = filterText;
        }

        public parse(): QueryDefinition
        {
            this.pos = -1;
            this.eol = false;
            this.next();

            var query: QueryDefinition = {
                name: "query",
                terms: []
            };

            if (this.filterText.length > 0)
            {
                do
                {
                    var term: QueryTerm = {};
                    var logicalOp = this.readIdentifier(false);
                    term.logicalOR = (logicalOp != null) && logicalOp.toLowerCase().startsWith("or");
                    term.logicalNOT = (logicalOp != null) && logicalOp.toLowerCase().endsWith("not");

                    this.readChar('(');
                    this.readChar('(');
                    term.field = this.readIdentifier(true);
                    this.readChar(')');
                    term.op = this.readIdentifier(true);
                    this.readChar('(');
                    term.params = this.readString();
                    this.readChar(')');
                    this.readChar(')');

                    query.terms.push(term);
                }
                while (!this.eol);
            }

            return query;
        }

        private readIdentifier(mandatory: boolean): string
        {
            var identifier = "";
            while (!this.eol && this.c != ')' && this.c != '(')
            {
                identifier += this.c;
                this.next();
            }
            if (mandatory && identifier.length == 0)
            {
                throw "expected identifier";
            }
            return identifier.toString();
        }

        private readString(): string
        {
            var str = "";
            while (!this.eol && this.c != ')')
            {
                str += this.c;
                this.next();
            }
            if (this.eol)
            {
                throw "unterminated string at " + this.pos;
            }
            return str.replace("~28", "(").replace("~29", ")").replace("~7E", "~");
        }

        private readChar(d: string) 
        {
            if (this.c == d)
            {
                this.next();
            }
            else
            {
                throw "expected '" + d + "' at " + this.pos;
            }
        }

        private next()
        {
            if (++this.pos >= this.filterText.length)
            {
                this.eol = true;
            }
            else
            {
                this.c = this.filterText.charAt(this.pos);
            }
        }
    }
    
    export class VisibilityUtil 
    {
        public static visibilitySummary(visibility: VisibilityRules)
        {
            var summary = "";
            if (visibility && (visibility.visibleToGroups || visibility.hiddenFromGroups))
            {
                summary += "<i>Groups:</i> ";
                summary += VisibilityUtil.getItemSummary(visibility.visibleToGroups, "", groupLookup);
                summary += VisibilityUtil.getItemSummary(visibility.hiddenFromGroups, " not ", groupLookup);
            }
            if (visibility && (visibility.visibleToRoles || visibility.hiddenFromRoles))
            {
                if (summary != "")
                {
                    summary += "; ";
                }
                summary += "<i>Roles:</i> ";
                summary += VisibilityUtil.getItemSummary(visibility.visibleToRoles, "", roleLookup);
                summary += VisibilityUtil.getItemSummary(visibility.hiddenFromRoles, " not ", roleLookup);
            }
            if (visibility && (visibility.visibleToClients || visibility.hiddenFromClients))
            {
                if (summary != "")
                {
                    summary += "; ";
                }
                summary += "<i>Clients:</i> ";
                summary += VisibilityUtil.getItemSummary(visibility.visibleToClients, "", clientLookup);
                summary += VisibilityUtil.getItemSummary(visibility.hiddenFromClients, " not ", clientLookup);
            }
            if (visibility && visibility.notDisplayed)
            {
                if (summary != "")
                {
                    summary += "; ";
                }
                summary += "<i>Display:</i> no";
            }
            return summary || "<small><i>Always Visible</i></small>";
        }

        private static getItemSummary(itemIDs: string[], prefix: string, itemLookup: any)
        {
            if (itemIDs != null)
            {
                var summary = "";
                for (var i = 0; i < itemIDs.length; i++)
                {
                    var item = itemLookup[itemIDs[i]];
                    if(item)
                    {
                        if (summary) summary += ", ";
                        summary += item;
                    }
                }
                return prefix + summary;
            }
            else
            {
                return "";
            }
        }
    }


}
