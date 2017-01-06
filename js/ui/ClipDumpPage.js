var ui;
(function (ui) {
    var HtmlUtil = util.HtmlUtil;
    var Label = controls.Label;
    var Button = controls.Button;
    var Panel = controls.Panel;
    var NavbarLoginMenu = ui.panels.NavbarLoginMenu;
    var $catdv = catdv.RestApi;
    var TimecodeUtil = catdv.TimecodeUtil;
    var DateUtil = catdv.DateUtil;
    var ClipDumpPage = (function () {
        function ClipDumpPage() {
            var _this = this;
            this.clipHeading = new Label("clipHeading");
            this.clipDumpPanel = new Panel("clipDumpPanel");
            this.navbarLoginMenu = new NavbarLoginMenu("navbarLoginMenu");
            this.closeBtn = new Button("closeBtn");
            this.clipId = $.urlParam("id");
            $catdv.getClip(this.clipId, function (clip) {
                _this.clipHeading.setText(clip.name);
                $catdv.getFields({ "include": "builtin,media,file" }, function (fields) {
                    _this.dumpClip(clip, fields.items);
                });
            });
            this.closeBtn.onClick(function (evt) {
                document.location.href = "default.jsp";
            });
        }
        ClipDumpPage.prototype.dumpClip = function (clip, fieldDefinitions) {
            var _this = this;
            this.clipDumpPanel.clear();
            var fieldDefLookup = {};
            fieldDefinitions.forEach(function (fieldDefinition) {
                var propertyName;
                if (fieldDefinition.isBuiltin) {
                    propertyName = fieldDefinition.memberOf + "." + fieldDefinition.identifier;
                }
                else {
                    propertyName = fieldDefinition.memberOf + "[" + fieldDefinition.identifier + "]";
                }
                fieldDefLookup[propertyName] = fieldDefinition;
            });
            var html = "";
            html += "<h3>Clip</h3>";
            html += "<table class='table'>";
            html += "<tr><th>ID</th><th>Name</th><th>Value</th><th>Description</th></tr>\n";
            Object.getOwnPropertyNames(clip).forEach(function (propertyName) {
                var fieldDef = fieldDefLookup["clip." + propertyName];
                html += "<tr><td>" + HtmlUtil.escapeHtml(propertyName) + "</td><td>";
                if (fieldDef) {
                    html += HtmlUtil.escapeHtml(fieldDef.name) + "</td>"
                        + "<td>" + _this.formatValue(clip[propertyName], fieldDef) + "</td><td>" + HtmlUtil.escapeHtml(fieldDef.description);
                }
                else {
                    html += "N/A" + "</td><td>" + HtmlUtil.escapeHtml(clip[propertyName]) + "</td><td>";
                }
                html += "</td></tr>\n";
            });
            html += "<table>";
            html += "<h3>Clip User Fields</h3>";
            html += "<table class='table'>";
            html += "<tr><th>ID</th><th>Name</th><th>Value</th></tr>\n";
            if (clip.userFields) {
                var userFields = clip.userFields;
                Object.getOwnPropertyNames(userFields).forEach(function (propertyName) {
                    var fieldDef = fieldDefLookup["clip[" + propertyName + "]"];
                    html += "<tr><td>" + HtmlUtil.escapeHtml(propertyName) + "</td><td>";
                    if (fieldDef) {
                        html += HtmlUtil.escapeHtml(fieldDef.name) + "</td><td>" + _this.formatValue(userFields[propertyName], fieldDef);
                    }
                    else {
                        html += "N/A" + "</td><td>" + HtmlUtil.escapeHtml(userFields[propertyName]);
                    }
                    html += "</td></tr>\n";
                });
            }
            html += "<table>";
            if (clip.media) {
                html += "<h3>Source Media</h3>";
                html += "<table class='table'>";
                html += "<tr><th>ID</th><th>Name</th><th>Value</th><th>Description</th></tr>\n";
                Object.getOwnPropertyNames(clip.media).forEach(function (propertyName) {
                    var fieldDef = fieldDefLookup["media." + propertyName];
                    html += "<tr><td>" + HtmlUtil.escapeHtml(propertyName) + "</td><td>";
                    if (fieldDef) {
                        html += HtmlUtil.escapeHtml(fieldDef.name) + "</td><td>" + _this.formatValue(clip.media[propertyName], fieldDef)
                            + "</td><td>" + HtmlUtil.escapeHtml(fieldDef.description);
                    }
                    else {
                        html += "N/A" + "</td><td>" + HtmlUtil.escapeHtml(clip.media[propertyName]) + "</td><td>";
                    }
                    html += "</td></tr>\n";
                });
                html += "<table>";
                if (clip.media.metadata) {
                    html += "<h3>Source Media Metadata Fields</h3>";
                    html += "<table class='table'>";
                    html += "<tr><th>ID</th><th>Name</th><th>Value</th></tr>\n";
                    var metadata = clip.media.metadata;
                    Object.getOwnPropertyNames(metadata).forEach(function (propertyName) {
                        var fieldDef = fieldDefLookup["media[" + propertyName + "]"];
                        html += "<tr><td>" + HtmlUtil.escapeHtml(propertyName) + "</td><td>";
                        if (fieldDef) {
                            html += HtmlUtil.escapeHtml(fieldDef.name) + "</td><td>" + _this.formatValue(metadata[propertyName], fieldDef);
                        }
                        else {
                            html += "N/A" + "</td><td>" + HtmlUtil.escapeHtml(metadata[propertyName]);
                        }
                        html += "</td></tr>\n";
                    });
                    html += "<table>";
                }
            }
            this.clipDumpPanel.$element.html(html);
        };
        ClipDumpPage.prototype.formatValue = function (value, fieldDef) {
            if (!value)
                return "";
            switch (fieldDef.fieldType) {
                case "timecode":
                    return value.txt || TimecodeUtil.formatTimecode(value);
                case "date":
                    return DateUtil.format(this.getDateValue(value, fieldDef), ClipDumpPage.DATE_FORMAT);
                case "datetime":
                    return DateUtil.format(this.getDateValue(value, fieldDef), ClipDumpPage.DATETIME_FORMAT);
                case "time":
                    return DateUtil.format(this.getDateValue(value, fieldDef), ClipDumpPage.TIME_FORMAT);
                case "history":
                    return this.formatHistory(value);
                default:
                    return HtmlUtil.escapeHtml(value);
            }
        };
        ClipDumpPage.prototype.getDateValue = function (value, fieldDef) {
            if (fieldDef.isBuiltin) {
                return new Date(Number(value));
            }
            else {
                return DateUtil.parse(String(value));
            }
        };
        ClipDumpPage.prototype.formatHistory = function (historyItems) {
            var html = "";
            if (historyItems != null) {
                html += "<table class='history'>";
                html += "<tr><th>Action</th><th>Date</th><th>User</th></tr>";
                historyItems.forEach(function (item) {
                    html += "<tr><td>" + HtmlUtil.escapeHtml(item.action) + "</td>"
                        + "<td>" + new Date(Number(item.date)).toDateString() + "</td><td>" + HtmlUtil.escapeHtml(item.user) + "</td></tr>";
                });
                html += "</table>";
            }
            return html;
        };
        ClipDumpPage.DATE_FORMAT = "YYYY-MM-DD";
        ClipDumpPage.DATETIME_FORMAT = "YYYY-MM-DD HH:mm:ss";
        ClipDumpPage.TIME_FORMAT = "HH:mm:ss";
        return ClipDumpPage;
    }());
    ui.ClipDumpPage = ClipDumpPage;
})(ui || (ui = {}));
