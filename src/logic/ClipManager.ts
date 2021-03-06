module logic
{
    import $catdv = catdv.RestApi;
    import Clip = catdv.Clip;
    import SequenceItem = catdv.SequenceItem;
    import QueryTerm = catdv.QueryTerm;
    import QueryDefinition = catdv.QueryDefinition;
    import QueryDefinitionUtil = catdv.QueryDefinitionUtil;

    export enum SaveContext 
    {
        SingleClip = 1,
        MultiClip = 2,
        Sequence = 3
    }

    export class ClipManager
    {

        // Remove all read-only/calculated properties from Clip object to reduce data sent over the wire
        public static prepareForSaving(clip: Clip, saveContext: SaveContext)
        {
            // TODO: don't like this - it is too arbitrary
            // It's fair enough to remove the genuinely read-only/calculated properties
            // but things like in/out and sourceMediaID aren't strictly read-only
            // and the complex properties are definitely not read-only, but on the 
            // other hand they are big, and seldom edited, so it would be good to remove
            // them if we can.
            // Possible solutions:
            // - check if anything has changed and remove the unchanged ones
            // - maybe an enum to say the context i.e. editing a single clip, editing a sequence
            //   since we know that currently we don't support editing thumbnails or metaclip members for instance

            // Always safe to remove read-only/calculated properties
            delete clip.catalog;
            delete clip.userName;
            delete clip.duration;
            delete clip.duration2;
            delete clip.modifiedDate;
            delete clip.mediaStart;
            delete clip.mediaEnd;
            delete clip.isEditable;

            if ((saveContext == SaveContext.SingleClip) || (saveContext == SaveContext.MultiClip))
            {
                delete clip.format;
                delete clip.fps;
                delete clip["in"];
                delete clip.out;
                delete clip.gmtDate;
                delete clip.clockAdjust;
                delete clip.sourceMediaID;
                delete clip.importSourceID;

                if (saveContext == SaveContext.MultiClip)
                {
                    delete clip.markers;
                }
                
                delete clip.seqItems;
                delete clip.members;
                delete clip.thumbnailIDs;
                delete clip.media;
                delete clip.importSource;
                delete clip.history;
            }
        }

        public static createSequence(name: string, useSelection: boolean, clips: Clip[], callback: (sequence: Clip) => void)
        {
            // validate clips
            var illegalClip = clips.find((clip) => ((clip.type != "clip") && (clip.type != "subclip") && (clip.type != "metaclip")));
            if (illegalClip)
            {
                controls.MessageBox.showMessage("Cannot include clip '" + illegalClip.name + "' (it has type '" + illegalClip.type + "')", "Illegal clip type");
                return;
            }

            var firstClip = clips[0];

            var sequence: Clip =
                {
                    catalogID: firstClip.catalogID,
                    name: name,
                    type: "seq",
                    bin: firstClip.bin,
                    posterID: firstClip.posterID,
                    seqItems: []
                };

            var tcFmt = firstClip["in"].fmt;

            // Sequence timecode start at 1 hour by convention
            var tc = { secs: 3600.0, fmt: tcFmt };

            sequence["in"] = { secs: tc.secs, fmt: tc.fmt };
            clips.forEach((clip, i) =>
            {
                var seqItem: SequenceItem = {
                    catalogID: clip.catalogID,
                    clipID: clip.ID,
                    clipName: clip.name,
                    clipTape: clip.tape,
                    clipMediaID: clip.sourceMediaID,
                    track: "VA1"
                };

                seqItem.seqIn = { secs: tc.secs, fmt: tcFmt };
                if (useSelection && clip.duration2)
                {
                    seqItem.clipIn = clip.in2;
                    seqItem.clipOut = clip.out2;
                    tc.secs += clip.duration2.secs;
                }
                else
                {
                    seqItem.clipIn = clip["in"];
                    seqItem.clipOut = clip.out;
                    tc.secs += clip.duration.secs;
                }
                seqItem.seqOut = { secs: tc.secs, fmt: tcFmt };

                sequence.seqItems.push(seqItem);
            });
            sequence.out = { secs: tc.secs, fmt: tcFmt };

            $catdv.saveClip(sequence, (savedSequence) =>
            {
                callback(savedSequence);
            });
        }

        public static createSubclip(name: string, notes: string, clip: Clip, callback: (subclip: Clip) => void)
        {
            var subclip: Clip = $.extend({}, clip);

            subclip.ID = null;
            subclip.name = name;
            subclip.notes = notes;
            subclip.type = "subclip";
            subclip.marked = false;
            subclip.hidden = false;
            subclip.rating = 0;
            subclip.status = null;
            subclip.clipref = null;

            subclip.userFields = null;
            subclip.markers = null;
            subclip.seqItems = null;

            subclip["in"] = clip.in2;
            subclip.out = clip.out2;
            subclip.duration = { secs: clip.out2.secs - clip.in2.secs, fmt: clip["in"].fmt };

            subclip.in2 = null;
            subclip.out2 = null;
            subclip.duration2 = null;
            
            subclip.media = null;

            $catdv.saveClip(subclip, (savedSubclip) =>
            {
                callback(savedSubclip);
            });
        }

        public static exportFCPXML(clips: Clip[])
        {
             var query: QueryDefinition = { name: "cliplist", terms: [{
                field: "clip.id",
                op: "isOneOf",
                params: clips.map((clip) => clip.ID).join(","),
                logicalOR: false,
                logicalNOT: false,
                ignoreCase: false
            }]};

            window.location.href = $catdv.getApiUrl("clips/fcp.xml?query=" + QueryDefinitionUtil.toQueryString(query) + "&fmt=fcpxml&download=true");
        }

        // NOTE: if both originalMedia and proxyMedia are true then download original if available but fallback to proxy
        // if original is not available or user is not allowed to download originals. This is used for the download button
        // rather than the individual media path / proxy path links, which only ever set one or other to true.
        public static getDownloadUrl(clip: Clip, originalMedia: boolean, proxyMedia: boolean, download: boolean = true): string
        {
            if (!clip.media) return null;

            var mediaPath = clip.media.filePath;
            var proxyPath = clip.media.proxyPath;

            // pick the path that available and we are allowed to use
            var path = (originalMedia && mediaPath) ? mediaPath : (proxyMedia ? proxyPath : null);

            if ((originalMedia && ServerSettings.canDownloadOriginals && mediaPath && clip.media.isMediaAvailable)
                || (proxyMedia && ServerSettings.canDownloadsProxies && proxyPath && (proxyPath !== mediaPath)))
            {
                var url = "media/" + clip.sourceMediaID;

                // extract filename from path and append to url
                var p = path.lastIndexOf('/');
                if (p < 0)
                {
                    p = path.lastIndexOf('\\');
                }
                if (p > 0)
                {
                    url += "/" + encodeURIComponent(path.substring(p + 1)).replaceAll("'","%27").replaceAll('"',"%22");
                }

                url += "?download=" + download + "&type=" + (originalMedia && ServerSettings.canDownloadOriginals ? "orig" : "proxy");

                return $catdv.getApiUrl(url);
            }
            else
            {
                return null;
            }
        }

    }
}
