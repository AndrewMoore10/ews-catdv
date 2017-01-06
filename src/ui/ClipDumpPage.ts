module ui
{
    import HtmlUtil = util.HtmlUtil;
    import Control = controls.Control;
    import Label = controls.Label;
    import Button = controls.Button;
    import Panel = controls.Panel;

    import NavbarLoginMenu = ui.panels.NavbarLoginMenu;

    import $catdv = catdv.RestApi;
    import Clip = catdv.Clip;
    import FieldDefinition = catdv.FieldDefinition;
    import PartialResultSet = catdv.PartialResultSet;
    import TimecodeUtil = catdv.TimecodeUtil;
    import DateUtil = catdv.DateUtil;

    export class ClipDumpPage
    {
        private static DATE_FORMAT = "YYYY-MM-DD";
        private static DATETIME_FORMAT = "YYYY-MM-DD HH:mm:ss";
        private static TIME_FORMAT = "HH:mm:ss";

        private clipId;
        private clipHeading = new Label("clipHeading");
        private clipDumpPanel = new Panel("clipDumpPanel");
        private navbarLoginMenu = new NavbarLoginMenu("navbarLoginMenu");

        private closeBtn = new Button("closeBtn");

        constructor()
        {
            this.clipId = $.urlParam("id");

            $catdv.getClip(this.clipId, (clip) =>
            {
                this.clipHeading.setText(clip.name);
                $catdv.getFields({ "include": "builtin,media,file" }, (fields: PartialResultSet<FieldDefinition>) =>
                {
                    this.dumpClip(clip, fields.items);
                });
            });

            this.closeBtn.onClick((evt) =>
            {
                document.location.href = "default.jsp";
            });
        }

        private dumpClip(clip: Clip, fieldDefinitions: FieldDefinition[])
        {
            this.clipDumpPanel.clear();

            var fieldDefLookup: { [id: string]: FieldDefinition } = {};
            fieldDefinitions.forEach((fieldDefinition) =>
            {
                var propertyName: string;
                if (fieldDefinition.isBuiltin)
                {
                    propertyName = fieldDefinition.memberOf + "." + fieldDefinition.identifier;
                }
                else
                {
                    propertyName = fieldDefinition.memberOf + "[" + fieldDefinition.identifier + "]";
                }
                fieldDefLookup[propertyName] = fieldDefinition;
            });

            var html = "";

            html += "<h3>Clip</h3>";
            html += "<table class='table'>";
            html += "<tr><th>ID</th><th>Name</th><th>Value</th><th>Description</th></tr>\n";
            Object.getOwnPropertyNames(clip).forEach((propertyName) =>
            {
                var fieldDef = fieldDefLookup["clip." + propertyName];
                html += "<tr><td>" + HtmlUtil.escapeHtml(propertyName) + "</td><td>";
                if (fieldDef)
                {
                    html += HtmlUtil.escapeHtml(fieldDef.name) + "</td>" 
                        + "<td>" + this.formatValue(clip[propertyName], fieldDef) + "</td><td>" + HtmlUtil.escapeHtml(fieldDef.description);
                }
                else
                {
                    html += "N/A" + "</td><td>" + HtmlUtil.escapeHtml(clip[propertyName]) + "</td><td>";
                }
                html += "</td></tr>\n";
            });
            html += "<table>";

            html += "<h3>Clip User Fields</h3>";
            html += "<table class='table'>";
            html += "<tr><th>ID</th><th>Name</th><th>Value</th></tr>\n";

            if (clip.userFields)
            {
                var userFields = clip.userFields;
                Object.getOwnPropertyNames(userFields).forEach((propertyName) =>
                {
                    var fieldDef = fieldDefLookup["clip[" + propertyName + "]"];
                    html += "<tr><td>" + HtmlUtil.escapeHtml(propertyName) + "</td><td>";
                    if (fieldDef)
                    {
                        html += HtmlUtil.escapeHtml(fieldDef.name) + "</td><td>" + this.formatValue(userFields[propertyName], fieldDef);
                    }
                    else
                    {
                        html += "N/A" + "</td><td>" + HtmlUtil.escapeHtml(userFields[propertyName]);
                    }
                    html += "</td></tr>\n";
                });
            }
            html += "<table>";

            if (clip.media)
            {
                html += "<h3>Source Media</h3>";
                html += "<table class='table'>";
                html += "<tr><th>ID</th><th>Name</th><th>Value</th><th>Description</th></tr>\n";
                Object.getOwnPropertyNames(clip.media).forEach((propertyName) =>
                {
                    var fieldDef = fieldDefLookup["media." + propertyName];
                    html += "<tr><td>" + HtmlUtil.escapeHtml(propertyName) + "</td><td>";
                    if (fieldDef)
                    {
                        html += HtmlUtil.escapeHtml(fieldDef.name) + "</td><td>" + this.formatValue(clip.media[propertyName], fieldDef) 
                        + "</td><td>" + HtmlUtil.escapeHtml(fieldDef.description);
                    }
                    else
                    {
                        html += "N/A" + "</td><td>" + HtmlUtil.escapeHtml(clip.media[propertyName]) + "</td><td>";
                    }
                    html += "</td></tr>\n";
                });
                html += "<table>";


                if (clip.media.metadata)
                {
                    html += "<h3>Source Media Metadata Fields</h3>";
                    html += "<table class='table'>";
                    html += "<tr><th>ID</th><th>Name</th><th>Value</th></tr>\n";

                    var metadata = clip.media.metadata;
                    Object.getOwnPropertyNames(metadata).forEach((propertyName) =>
                    {
                        var fieldDef = fieldDefLookup["media[" + propertyName + "]"];
                        html += "<tr><td>" + HtmlUtil.escapeHtml(propertyName) + "</td><td>";
                        if (fieldDef)
                        {
                            html += HtmlUtil.escapeHtml(fieldDef.name) + "</td><td>" + this.formatValue(metadata[propertyName], fieldDef);
                        }
                        else
                        {
                            html += "N/A" + "</td><td>" + HtmlUtil.escapeHtml(metadata[propertyName]);
                        }
                        html += "</td></tr>\n";
                    });
                    html += "<table>";
                }
            }


            this.clipDumpPanel.$element.html(html);

        }

        private formatValue(value: any, fieldDef: FieldDefinition)
        {
            if (!value) return "";

            switch (fieldDef.fieldType)
            {
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
        }

        private getDateValue(value: string, fieldDef: FieldDefinition)
        {
            if (fieldDef.isBuiltin)
            {
                return new Date(Number(value));
            }
            else
            {
                return DateUtil.parse(String(value));
            }
        }

        private formatHistory(historyItems)
        {
            var html = "";
            if (historyItems != null)
            {
                html += "<table class='history'>";
                html += "<tr><th>Action</th><th>Date</th><th>User</th></tr>";
                historyItems.forEach((item) =>
                {
                    html += "<tr><td>" + HtmlUtil.escapeHtml(item.action) + "</td>" 
                    + "<td>" + new Date(Number(item.date)).toDateString() + "</td><td>" + HtmlUtil.escapeHtml(item.user) + "</td></tr>";
                });

                html += "</table>";
            }
            return html;
        }
    }
}

