var util;
(function (util) {
    var entityMap = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': '&quot;',
        "'": '&#39;',
        "/": '&#x2F;'
    };
    function float2int(value) {
        // Bitwise operations convert their numeric argument (which are normally floats in JS) to ints. 
        // Therefore ORing with ZERO (which is a Noop) has the side effect of converting the input to int!
        return value | 0;
    }
    var HtmlUtil = (function () {
        function HtmlUtil() {
        }
        HtmlUtil.escapeHtml = function (str, maxLength) {
            var escaped = String(str || "").replace(/[&<>"'\/]/g, function (s) {
                return entityMap[s];
            });
            if (maxLength && escaped.length > maxLength) {
                return escaped.substr(0, maxLength) + "...";
            }
            else {
                return escaped;
            }
        };
        return HtmlUtil;
    }());
    util.HtmlUtil = HtmlUtil;
    var PathUtil = (function () {
        function PathUtil() {
        }
        PathUtil.getFilename = function (path) {
            var separatorIndex = path.lastIndexOf("/");
            if (separatorIndex != -1) {
                return path.substring(separatorIndex + 1);
            }
            separatorIndex = path.lastIndexOf("\\");
            if (separatorIndex != -1) {
                return path.substring(separatorIndex + 1);
            }
            return path;
        };
        return PathUtil;
    }());
    util.PathUtil = PathUtil;
    var Platform = (function () {
        function Platform() {
        }
        Platform.isTouchDevice = function () {
            try {
                document.createEvent("TouchEvent");
                return true;
            }
            catch (e) {
                return false;
            }
        };
        Platform.isIOS = function () {
            return ((navigator.platform == "iPad") || (navigator.platform == "iPhone"));
        };
        Platform.isMac = function () {
            return ((navigator.platform == "MacIntel") || (navigator.platform == "Macintosh"));
        };
        Platform.isSafari = function () {
            return navigator.userAgent.contains("Safari");
        };
        Platform.isFirefox = function () {
            return navigator.userAgent.contains("Firefox");
        };
        Platform.isIE = function () {
            return navigator.userAgent.contains("MSIE") || navigator.userAgent.contains("Trident");
        };
        // Pre IE 10
        Platform.isOldIE = function () {
            var userAgent = navigator.userAgent;
            var msieIndex = userAgent.indexOf("MSIE");
            if (msieIndex == -1)
                return false;
            var ieVersion = Number(userAgent.substring(msieIndex + 4, userAgent.indexOf(";", msieIndex + 4)));
            return (ieVersion < 10);
        };
        return Platform;
    }());
    util.Platform = Platform;
    var FormatUtil = (function () {
        function FormatUtil() {
        }
        FormatUtil.formatBytes = function (bytes) {
            if ((bytes == null) || (typeof bytes == "undefined"))
                return "";
            if (bytes < 1024) {
                return bytes + " bytes";
            }
            else if (bytes < 1024 * 1024) {
                return (bytes / 1024).toFixed(2) + " KB";
            }
            else if (bytes < 1024 * 1024 * 1024) {
                return (bytes / (1024 * 1024)).toFixed(2) + " MB";
            }
            else {
                return (bytes / (1024 * 1024 * 1024)).toFixed(2) + " GB";
            }
        };
        FormatUtil.formatBytesPerSecond = function (bytesPerSecond) {
            if ((bytesPerSecond == null) || (typeof bytesPerSecond == "undefined"))
                return "";
            var bitsPerSecond = bytesPerSecond * 8;
            if (bitsPerSecond < 1000) {
                return bitsPerSecond + " b/s";
            }
            else if (bitsPerSecond < 1000 * 1000) {
                return (bitsPerSecond / 1000).toFixed(2) + " Kb/s";
            }
            else if (bitsPerSecond < 1000 * 1000 * 1000) {
                return (bitsPerSecond / (1000 * 1000)).toFixed(2) + " Mb/s";
            }
            else {
                return (bitsPerSecond / (1000 * 1000 * 1000)).toFixed(2) + " Gb/s";
            }
        };
        FormatUtil.formatAspectRatio = function (aspectRatio) {
            if ((aspectRatio == null) || (typeof aspectRatio == "undefined") || isNaN(aspectRatio))
                return "";
            if (float2int(aspectRatio * 90 + 0.5) == 120) {
                return "4:3";
            }
            else if (float2int(aspectRatio * 90 + 0.5) == 160) {
                return "16:9";
            }
            else if (float2int(aspectRatio * 90 + 0.5) == 210) {
                return "21:9";
            }
            else if (float2int(aspectRatio * 90 + 0.5) == 140) {
                return "14:9";
            }
            else if (float2int(aspectRatio * 100 + 0.5) == 150) {
                return "3:2";
            }
            else if (float2int(aspectRatio * 100 + 0.5) == 125) {
                return "5:4";
            }
            else {
                return aspectRatio.toFixed(2);
            }
        };
        FormatUtil.formatGPS = function (packedLatLong) {
            var longLat = packedLatLong.split(",");
            var longitude = parseFloat(longLat[0]);
            var latitude = parseFloat(longLat[1]);
            return FormatUtil.floatToDMS(longitude) + "," + FormatUtil.floatToDMS(latitude);
        };
        FormatUtil.floatToDMS = function (degrees) {
            var wholeDegrees = float2int(degrees);
            var mins = (degrees - wholeDegrees) * 60;
            var whileMins = float2int(mins);
            var secs = (mins - whileMins) * 60;
            return wholeDegrees + "&deg;" + whileMins + '"' + secs.toFixed(1) + "'";
        };
        return FormatUtil;
    }());
    util.FormatUtil = FormatUtil;
    var ColorUtil = (function () {
        function ColorUtil() {
        }
        ColorUtil.hsl2rgb = function (hsl) {
            if (!hsl)
                return null;
            var r, g, b;
            if (hsl.s == 0) {
                r = g = b = hsl.l;
            }
            else {
                var hue2rgb = function (p, q, t) {
                    if (t < 0)
                        t += 1;
                    if (t > 1)
                        t -= 1;
                    if (t < 1 / 6)
                        return p + (q - p) * 6 * t;
                    if (t < 1 / 2)
                        return q;
                    if (t < 2 / 3)
                        return p + (q - p) * (2 / 3 - t) * 6;
                    return p;
                };
                var q = hsl.l < 0.5 ? hsl.l * (1 + hsl.s) : hsl.l + hsl.s - hsl.l * hsl.s;
                var p = 2 * hsl.l - q;
                r = hue2rgb(p, q, hsl.h + 1 / 3);
                g = hue2rgb(p, q, hsl.h);
                b = hue2rgb(p, q, hsl.h - 1 / 3);
            }
            return { "r": Math.round(r * 255), "g": Math.round(g * 255), "b": Math.round(b * 255), "a": hsl.a };
        };
        ColorUtil.rgb2hsl = function (rgb) {
            if (!rgb)
                return null;
            rgb.r /= 255, rgb.g /= 255, rgb.b /= 255;
            var max = Math.max(rgb.r, rgb.g, rgb.b), min = Math.min(rgb.r, rgb.g, rgb.b);
            var h, s, l = (max + min) / 2;
            if (max == min) {
                h = s = 0;
            }
            else {
                var d = max - min;
                s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
                switch (max) {
                    case rgb.r:
                        h = (rgb.g - rgb.b) / d + (rgb.g < rgb.b ? 6 : 0);
                        break;
                    case rgb.g:
                        h = (rgb.b - rgb.r) / d + 2;
                        break;
                    case rgb.b:
                        h = (rgb.r - rgb.g) / d + 4;
                        break;
                }
                h /= 6;
            }
            return { "h": h, "s": s, "l": l, "a": rgb.a };
        };
        ColorUtil.rgb2hex = function (rgb) {
            return rgb ? "#" + ColorUtil.toHex(rgb.r) + ColorUtil.toHex(rgb.g) + ColorUtil.toHex(rgb.b) : null;
        };
        ColorUtil.parseHex = function (hex) {
            if (hex == null)
                return null;
            if (hex.match("^#[0-9a-fA-F]{3}$")) {
                return {
                    "r": parseInt(hex.substr(1, 1) + hex.substr(1, 1), 16),
                    "g": parseInt(hex.substr(2, 1) + hex.substr(2, 1), 16),
                    "b": parseInt(hex.substr(3, 1) + hex.substr(3, 1), 16)
                };
            }
            else if (hex.match("^#[0-9a-fA-F]{6}$")) {
                return {
                    "r": parseInt(hex.substr(1, 2), 16),
                    "g": parseInt(hex.substr(3, 2), 16),
                    "b": parseInt(hex.substr(5, 2), 16)
                };
            }
            else {
                return null;
            }
        };
        ColorUtil.toHex = function (d) {
            return ("0" + (Number(d).toString(16))).slice(-2).toUpperCase();
        };
        return ColorUtil;
    }());
    util.ColorUtil = ColorUtil;
})(util || (util = {}));
var catdv;
(function (catdv) {
    var TimecodeUtil = (function () {
        function TimecodeUtil() {
        }
        TimecodeUtil.formatTimecode = function (timecode) {
            if (!timecode || isNaN(timecode.secs))
                return "-:--:--:--";
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
            if (TimecodeUtil.isNonDropFrameFormat(timecode.fmt)) {
                // For non-drop-frame formats frames in the timecode map one-to-one with frames in the media 
                // so calculate the frames using the real framerate. (However the 'frames' aren't really
                // 1/30th second long so when we subsequently convert them to hh:mm:ss assuming they
                // are 1/30th long the hh:mm:ss will not represent wallclock time.) 
                frames = timecode.secs * TimecodeUtil.getFrameRate(timecode.fmt);
            }
            else {
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
            if (timecode.fmt == 6000 /* TimecodeFormat.P60_NTSC_NDF_FORMAT */) {
                frames = frames / 2;
            }
            var hhmmss = TimecodeUtil.twoDigits(hours) + ":" + TimecodeUtil.twoDigits(minutes) + ":" + TimecodeUtil.twoDigits(seconds);
            switch (timecode.fmt) {
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
        };
        // TODO: this needs to take account of drop-frame formats
        TimecodeUtil.parseTimecode = function (timecodeString, timecodeFormat) {
            if (!timecodeString)
                return null;
            var fields = timecodeString.split(/[:;'.]/);
            var hours = Number(fields[0]);
            var mins = Number(fields[1]);
            var secs = Number(fields[2]);
            var frames = Number(fields.length > 3 ? fields[3] : "0");
            var seconds = hours * (3600) + mins * 60 + secs;
            switch (timecodeFormat) {
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
            if (TimecodeUtil.isNonDropFrameFormat(timecodeFormat)) {
                seconds = seconds * TimecodeUtil.getNotionalFrameRate(timecodeFormat) / TimecodeUtil.getFrameRate(timecodeFormat);
            }
            var frames = Math.floor(seconds * TimecodeUtil.getFrameRate(timecodeFormat));
            return { secs: seconds, frm: frames, fmt: timecodeFormat, txt: timecodeString };
        };
        TimecodeUtil.getFrameRate = function (timecodeFormat) {
            switch (timecodeFormat) {
                case 2398 /* TimecodeFormat.P24_NTSC_FORMAT */:
                    return 24 / 1.001;
                case 3000 /* TimecodeFormat.NTSC_NDF_FORMAT */:
                    return 30 / 1.001;
                case 6000 /* TimecodeFormat.P60_NTSC_NDF_FORMAT */:
                    return 60 / 1.001;
                default:
                    return (timecodeFormat > 1000) ? (Math.floor(Number(timecodeFormat) / 100.0 + 0.5)) / 1.001 : Number(timecodeFormat);
            }
        };
        // Get the rounded-up integer framerate for the format (so 29.97 -> 30 etc.)
        // This value will always be the number of frames in each timecode second even for non-iteger framerates (DF & NDF).
        TimecodeUtil.getNotionalFrameRate = function (fmt) {
            return (fmt > 1000) ? (Math.floor(Number(fmt) / 100.0 + 0.5)) : Number(fmt);
        };
        // Formats with a non-integer framerate, where we periodically skip one in the frames column of the timcode to keep the 
        // timecode in sync with the wallclock time. This means tiemcode 1:00:00:00 corresponds to wallclock time of one hour
        TimecodeUtil.isDropFrameFormat = function (fmt) {
            return fmt == 2997 /* TimecodeFormat.NTSC_DF_FORMAT */ || fmt == 5994 /* TimecodeFormat.P60_NTSC_DF_FORMAT */;
        };
        // Formats with a non-integer framerate, where we do not periodically drop timcode frames to keep the timecode in sync
        // with the wallclock time. This means 1:00:00:00 doesn't correspond to a wallclock time of exactly one hour
        TimecodeUtil.isNonDropFrameFormat = function (fmt) {
            return fmt == 2398 /* TimecodeFormat.P24_NTSC_FORMAT */ || fmt == 3000 /* TimecodeFormat.NTSC_NDF_FORMAT */ || fmt == 6000 /* TimecodeFormat.P60_NTSC_NDF_FORMAT */;
        };
        // Strip out text and frames parts of timecodes (we do all the calculations in seconds
        // so frames and text are not guarateed to be correct)
        TimecodeUtil.simplify = function (tc) {
            delete (tc.frm);
            delete (tc.txt);
        };
        TimecodeUtil.twoDigits = function (n) {
            var tmp = ("0" + n);
            return tmp.substring(tmp.length - 2);
        };
        return TimecodeUtil;
    }());
    catdv.TimecodeUtil = TimecodeUtil;
    var DateUtil = (function () {
        function DateUtil() {
        }
        DateUtil.format = function (date, format) {
            if (format === void 0) { format = null; }
            return moment(date).format(format);
        };
        DateUtil.parse = function (dateString, format) {
            if (format === void 0) { format = null; }
            return moment(dateString, format).toDate();
        };
        DateUtil.ISO_DATETIME_FORMAT = "YYYY-MM-DD HH:mm:ss";
        DateUtil.ISO_DATE_FORMAT = "YYYY-MM-DD";
        DateUtil.ISO_TIME_FORMAT = "HH:mm:ss";
        return DateUtil;
    }());
    catdv.DateUtil = DateUtil;
    var VideoFormatUtil = (function () {
        function VideoFormatUtil() {
        }
        VideoFormatUtil.getFrameRate = function (videoFormat) {
            if (videoFormat == null)
                return "";
            var e = videoFormat.indexOf("fps");
            var s = e < 0 ? -1 : videoFormat.lastIndexOf(" ", e);
            if (s >= 0) {
                return videoFormat.substring(s + 1, e);
            }
            else if (videoFormat.endsWith(" still)")) {
                return "Still";
            }
            else {
                return "";
            }
        };
        VideoFormatUtil.getFrameSize = function (videoFormat) {
            if (videoFormat == null)
                return "";
            var n = videoFormat.lastIndexOf('(');
            if (n < 0) {
                return null;
            }
            var p = videoFormat.indexOf(' ', n);
            var q = videoFormat.indexOf(')', n);
            if (p < 0 && q < 0) {
                return null;
            }
            if (p < 0 || q >= 0 && q < p) {
                p = q;
            }
            return videoFormat.substring(n + 1, p);
        };
        return VideoFormatUtil;
    }());
    catdv.VideoFormatUtil = VideoFormatUtil;
    var AudioFormatUtil = (function () {
        function AudioFormatUtil() {
        }
        AudioFormatUtil.getAudioRate = function (audioFormat) {
            if (audioFormat == null)
                return "";
            var p1 = audioFormat.lastIndexOf('(');
            var p2 = audioFormat.indexOf(", ", p1);
            var p3 = audioFormat.indexOf(')', p1);
            return (p1 > 0 && p2 > 0 && p3 > 0) ? audioFormat.substring(p1 + 1, p2) : null;
        };
        AudioFormatUtil.getAudioChannels = function (audioFormat) {
            if (audioFormat == null)
                return "";
            var p = audioFormat.indexOf(", ");
            if (p < 0 || !audioFormat.endsWith(")"))
                return "unknown";
            var tmp = audioFormat.substring(p + 2);
            p = tmp.indexOf(", ");
            if (p < 0)
                p = tmp.indexOf(")");
            return tmp.substring(0, p);
        };
        AudioFormatUtil.getAudioBits = function (audioFormat) {
            if (audioFormat == null || !audioFormat.endsWith(" bit)") || audioFormat.indexOf(',') < 0)
                return "";
            return audioFormat.substring(audioFormat.lastIndexOf(", ") + 2, audioFormat.length - 1);
        };
        return AudioFormatUtil;
    }());
    catdv.AudioFormatUtil = AudioFormatUtil;
    var ArchiveStatusUtil = (function () {
        function ArchiveStatusUtil() {
        }
        /**
         * Parse the archive status field and extract a summary suitable for grouping
         * eg. "Copied to '0012314' (Volumes/Xyz/File1.mp4) on Jan 1 2009; currently on vtape" -> "Copied to '0012314'; currently on vtape"
         */
        ArchiveStatusUtil.getArchiveStatus = function (archiveStatus) {
            if (!archiveStatus)
                return null;
            var p = archiveStatus.indexOf(" \'");
            if (p < 0)
                return null;
            var msg = archiveStatus.substring(0, p);
            var tape = ArchiveStatusUtil.getArchiveTape(archiveStatus, false);
            if (tape != null) {
                msg += " '" + tape + "'";
            }
            var q = archiveStatus.lastIndexOf(';');
            if (q > p) {
                msg += archiveStatus.substring(q);
            }
            return msg;
        };
        /**
         * Parse the archive status field and extract the tape name
         * eg. "Copied to '0012314' (Volumes/Xyz/File1.mp4) on Jan 1 2009" -> "0012314"
         */
        ArchiveStatusUtil.getArchiveTape = function (archiveStatus, firstOnly) {
            if (firstOnly === void 0) { firstOnly = true; }
            if (!archiveStatus)
                return null;
            var lines = archiveStatus.split('\n');
            var tapes = [];
            lines.forEach(function (line) {
                var p = line.indexOf('\'');
                var q = line.indexOf('\'', p + 1);
                if (p >= 0 && q >= 0 && p != q) {
                    var tape = line.substring(p + 1, q);
                    if (tape != null && !tapes.contains(tape)) {
                        tapes.push(tape);
                    }
                }
            });
            if (tapes.length == 0) {
                return null;
            }
            else if ((tapes.length == 1) || firstOnly) {
                return tapes[0];
            }
            else {
                return tapes[0] + "," + tapes[1] + (tapes.length > 2 ? ",..." : "");
            }
        };
        return ArchiveStatusUtil;
    }());
    catdv.ArchiveStatusUtil = ArchiveStatusUtil;
    var FieldDefinitionUtil = (function () {
        function FieldDefinitionUtil() {
        }
        // True is this field has associated values (picklist, hiearchy, multi-checkbox etc.)
        FieldDefinitionUtil.hasValues = function (fieldDef) {
            return fieldDef && fieldDef.fieldType.contains("multi") || fieldDef.fieldType.contains("picklist") || fieldDef.fieldType.contains("hiearchy");
        };
        FieldDefinitionUtil.isLinkedField = function (fieldDef) {
            return fieldDef && (fieldDef.fieldType == "linked-hierarchy" || fieldDef.fieldType == "multi-linked-hierarchy");
        };
        FieldDefinitionUtil.isListField = function (fieldDef) {
            if (!fieldDef)
                return false;
            var fieldType = fieldDef.fieldType;
            return fieldType.contains("picklist") || fieldType.contains("hierarchy") || fieldType.contains("radio") || fieldType.contains("multi");
        };
        FieldDefinitionUtil.getLongIdentifier = function (fieldDef) {
            if (fieldDef.isBuiltin) {
                return fieldDef.memberOf + "." + fieldDef.identifier;
            }
            else {
                return fieldDef.memberOf + "[" + fieldDef.identifier + "]";
            }
        };
        FieldDefinitionUtil.getTooltip = function (fieldDef) {
            if (fieldDef.description) {
                return fieldDef.description + "<br/><i>" + util.HtmlUtil.escapeHtml(FieldDefinitionUtil.getLongIdentifier(fieldDef)) + "</i>";
            }
            else {
                return "<i>" + util.HtmlUtil.escapeHtml(FieldDefinitionUtil.getLongIdentifier(fieldDef)) + "</i>";
            }
        };
        FieldDefinitionUtil.getCssClass = function (fieldDef) {
            return "field-label " + (fieldDef.isBuiltin ? "builtin-field" : (fieldDef.memberOf == "clip" ? "user-field" : "metadata-field"));
        };
        FieldDefinitionUtil.getSortBy = function (fieldDef) {
            return fieldDef.isSortable ? fieldDef.memberOf + (fieldDef.isBuiltin ? "." + fieldDef.identifier : "[" + fieldDef.identifier + "]") : null;
        };
        FieldDefinitionUtil.makeDummyFieldDefinition = function (longIdentifier) {
            var fieldDef = { "fieldType": "text", "canQuery": true };
            var index = longIdentifier.indexOf("[");
            if (index != -1) {
                fieldDef.isBuiltin = false;
                fieldDef.memberOf = longIdentifier.substring(0, index);
                fieldDef.identifier = longIdentifier.substring(index + 1, longIdentifier.length - 1);
                fieldDef.name = fieldDef.identifier;
            }
            else {
                fieldDef.isBuiltin = true;
                var fields = longIdentifier.split(".");
                fieldDef.memberOf = fields[0];
                fieldDef.identifier = fields[1];
                fieldDef.name = fieldDef.identifier;
            }
            return fieldDef;
        };
        return FieldDefinitionUtil;
    }());
    catdv.FieldDefinitionUtil = FieldDefinitionUtil;
    var QueryDefinitionUtil = (function () {
        function QueryDefinitionUtil() {
        }
        QueryDefinitionUtil.toFilterString = function (queryDef) {
            // TODO: handle advanced options like related data
            var filterString = "";
            queryDef.terms.forEach(function (term) {
                var params = term.params ? term.params.replaceAll("~", "~7E").replaceAll("(", "~28").replaceAll(")", "~29") : "";
                filterString += (term.logicalOR ? "or" : "and") + (term.logicalNOT ? "Not" : "");
                filterString += "((" + term.field + ")" + term.op + "(" + params + "))";
            });
            return filterString;
        };
        QueryDefinitionUtil.toQueryString = function (queryDef) {
            var orTerms = queryDef.terms ? queryDef.terms.filter(function (term) { return term.logicalOR; }) : [];
            var andTerms = queryDef.terms ? queryDef.terms.filter(function (term) { return !term.logicalOR; }) : [];
            var queryString = "";
            if (andTerms.length > 0) {
                andTerms.forEach(function (term, i) {
                    if (i > 0)
                        queryString += "and";
                    var params = term.params ? term.params.replaceAll("~", "~7E").replaceAll("(", "~28").replaceAll(")", "~29") : "";
                    queryString += "((" + term.field + ")" + (term.logicalNOT ? "!" : "") + term.op + "(" + params + "))";
                });
            }
            if (orTerms.length > 0) {
                if (andTerms.length > 0)
                    queryString += "and";
                queryString + "(";
                orTerms.forEach(function (term, i) {
                    if (i > 0)
                        queryString += "or";
                    var params = term.params ? term.params.replaceAll("~", "~7E").replaceAll("(", "~28").replaceAll(")", "~29") : "";
                    queryString += "((" + term.field + ")" + (term.logicalNOT ? "!" : "") + term.op + "(" + params + "))";
                });
                queryString + ")";
            }
            return queryString;
        };
        QueryDefinitionUtil.parse = function (filterText) {
            return new FilterTestParser(filterText).parse();
        };
        return QueryDefinitionUtil;
    }());
    catdv.QueryDefinitionUtil = QueryDefinitionUtil;
    var FilterTestParser = (function () {
        function FilterTestParser(filterText) {
            this.filterText = filterText;
        }
        FilterTestParser.prototype.parse = function () {
            this.pos = -1;
            this.eol = false;
            this.next();
            var query = {
                name: "query",
                terms: []
            };
            if (this.filterText.length > 0) {
                do {
                    var term = {};
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
                } while (!this.eol);
            }
            return query;
        };
        FilterTestParser.prototype.readIdentifier = function (mandatory) {
            var identifier = "";
            while (!this.eol && this.c != ')' && this.c != '(') {
                identifier += this.c;
                this.next();
            }
            if (mandatory && identifier.length == 0) {
                throw "expected identifier";
            }
            return identifier.toString();
        };
        FilterTestParser.prototype.readString = function () {
            var str = "";
            while (!this.eol && this.c != ')') {
                str += this.c;
                this.next();
            }
            if (this.eol) {
                throw "unterminated string at " + this.pos;
            }
            return str.replace("~28", "(").replace("~29", ")").replace("~7E", "~");
        };
        FilterTestParser.prototype.readChar = function (d) {
            if (this.c == d) {
                this.next();
            }
            else {
                throw "expected '" + d + "' at " + this.pos;
            }
        };
        FilterTestParser.prototype.next = function () {
            if (++this.pos >= this.filterText.length) {
                this.eol = true;
            }
            else {
                this.c = this.filterText.charAt(this.pos);
            }
        };
        return FilterTestParser;
    }());
    var VisibilityUtil = (function () {
        function VisibilityUtil() {
        }
        VisibilityUtil.visibilitySummary = function (visibility) {
            var summary = "";
            if (visibility && (visibility.visibleToGroups || visibility.hiddenFromGroups)) {
                summary += "<i>Groups:</i> ";
                summary += VisibilityUtil.getItemSummary(visibility.visibleToGroups, "", groupLookup);
                summary += VisibilityUtil.getItemSummary(visibility.hiddenFromGroups, " not ", groupLookup);
            }
            if (visibility && (visibility.visibleToRoles || visibility.hiddenFromRoles)) {
                if (summary != "") {
                    summary += "; ";
                }
                summary += "<i>Roles:</i> ";
                summary += VisibilityUtil.getItemSummary(visibility.visibleToRoles, "", roleLookup);
                summary += VisibilityUtil.getItemSummary(visibility.hiddenFromRoles, " not ", roleLookup);
            }
            if (visibility && (visibility.visibleToClients || visibility.hiddenFromClients)) {
                if (summary != "") {
                    summary += "; ";
                }
                summary += "<i>Clients:</i> ";
                summary += VisibilityUtil.getItemSummary(visibility.visibleToClients, "", clientLookup);
                summary += VisibilityUtil.getItemSummary(visibility.hiddenFromClients, " not ", clientLookup);
            }
            if (visibility && visibility.notDisplayed) {
                if (summary != "") {
                    summary += "; ";
                }
                summary += "<i>Display:</i> no";
            }
            return summary || "<small><i>Always Visible</i></small>";
        };
        VisibilityUtil.getItemSummary = function (itemIDs, prefix, itemLookup) {
            if (itemIDs != null) {
                var summary = "";
                for (var i = 0; i < itemIDs.length; i++) {
                    var item = itemLookup[itemIDs[i]];
                    if (item) {
                        if (summary)
                            summary += ", ";
                        summary += item;
                    }
                }
                return prefix + summary;
            }
            else {
                return "";
            }
        };
        return VisibilityUtil;
    }());
    catdv.VisibilityUtil = VisibilityUtil;
})(catdv || (catdv = {}));
