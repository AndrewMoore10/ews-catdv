module ui
{
    import HtmlUtil = util.HtmlUtil;
    import Console = controls.Console;
    import Label = controls.Label;
    import Button = controls.Button;

    import $catdv = catdv.RestApi;
    import Clip = catdv.Clip;
    import FormDefinition = catdv.FormDefinition;

    import UploadFormManager = logic.UploadFormManager;
    import DetailFieldFactory = logic.DetailFieldFactory;
    import FieldBinding = logic.FieldBinding;
    import AccessorFactory = logic.AccessorFactory;

    // Non-standard File object for Mozilla
    declare var File: any;

    export class UploadFilesPage
    {
        private lblValidationError = new Label("lblValidationError");
        private btnUpload = new Button("btnUpload");
        private btnClose = new Button("btnClose");

        private filesToUpload = [];
        private allDone = false;
        private uploadFormFields: FieldBinding[] = [];

        constructor()
        {
            // Magic to make JQuery include the dataTransfer property in its event object
            (<any>$).event.props.push('dataTransfer');
            
            // add some visual feedback for drag-drop interaction
            $(".dropContainer").on('dragenter',(e) =>
            {
                e.preventDefault();
                e.stopPropagation();
                $(".dropContainer").addClass("highlight");
            });

            $(".dropContainer").on('dragleave',(e) =>
            {
                e.preventDefault();
                e.stopPropagation();
                $(".dropContainer").removeClass("highlight");
            });

            // allow drop anywhere on page
            $("body").on('drop',(e) =>
            {
                $(".dropContainer").removeClass("highlight");
                if (this.allDone) return;

                // Retrieve native HTML5 dataTransfer object's file
                var files = (<any>e).dataTransfer.files;

                e.preventDefault();
                e.stopPropagation();

                this.addFiles(files);

                $(".dropContainer").trigger("dragleave");
            });

            $("#fileBrowser").change((e) =>
            {
                this.addFiles((<any>e).target.files);
            });

            this.btnUpload.onClick((e) =>
            {
                if (this.filesToUpload.length == 0)
                {
                    alert("You must select a file to upload");
                }
                else if(this.validateForm())
                {
                    $("#btnAdd").prop("disabled", true);
                    $("#fileBrowser").prop("disabled", true);
                    $("#btnUpload").prop("disabled", true);
                    $("#btnClose").prop("disabled", true);
                    this.uploadFile(0, this.getUploadMetadata());
                }
            });

            this.btnClose.onClick((e) =>
            {
                 self.close();
            });

            UploadFormManager.getUploadForm((uploadForm: FormDefinition) => 
            {
                var $uploadFormTable = $("#tblUploadForm");

                if (uploadForm.fields)
                {
                    uploadForm.fields.forEach((field, f) =>
                    {
                        if (field.fieldDefinition)
                        {
                            var fieldID = "uf_" + f;
                            var css = field.options.mandatory ? " class='mandatory'" : "";
                            var $tr = $("<tr><th" + css + ">" + HtmlUtil.escapeHtml(field.fieldDefinition.name) + "</th></tr>").appendTo($uploadFormTable);
                            var $td = $("<td></td>").appendTo($tr);
                            var detailField = DetailFieldFactory.createField(fieldID, field, $td);
                            detailField.setEditable(true);
                            var fieldBinding = new FieldBinding(detailField, AccessorFactory.createAccessor(field.fieldDefinition, false));
                            this.uploadFormFields.push(fieldBinding);
                        }
                    });
                }
            });
        }
        
        private validateForm()
        {
            var valid = true;
            this.uploadFormFields.forEach((uploadFormField) =>
            {
                if(uploadFormField.detailField.panelField.options.mandatory)
                {
                    if(!uploadFormField.detailField.getValue())
                    {
                        valid = false;
                        uploadFormField.detailField.setError(true);
                    }
                    else
                    {
                        uploadFormField.detailField.setError(false);
                    }
                }
            });
            this.lblValidationError.show(!valid);
            return valid;
       }

        private getUploadMetadata()
        {
            var clipMetadata : Clip = {};
            this.uploadFormFields.forEach((uploadFormField) =>
            {
                uploadFormField.fieldAccessor.setValue(clipMetadata, uploadFormField.detailField.getValue());
            });
            return clipMetadata;
        }

        private addFiles(files)
        {
            for (var i = 0; i < files.length; i++)
            {
                var file = files[i];
                var id = "file_" + this.filesToUpload.length;

                //                $("#tblFileList").append(
                //                    $("<tr>" + "<td width='50%'>" + file.name + "</td>" + "<td width='25%'>" + this.bytesToSize(file.size, 1) + "</td>"
                //                        + "<td width='25%' class='status'><div id='" + id + "_progress' class='progress'></div><div id='" + id + "_status' class='status'></div>        //                        + "</tr>"));

                $("#tblFileList").append(
                    $("<tr>" + "<td width='50%'>" + HtmlUtil.escapeHtml(file.name) + "</td>" + "<td width='25%'>" + this.bytesToSize(file.size, 1) + "</td>"
                        + "<td width='25%' class='status'><div class='progress' id='" + id + "_progress'>"
                        + "<div class='progress-bar' role='progressbar' aria-valuenow='0' aria-valuemin='0' aria-valuemax='100'><span>0%</span></div></div></td>"
                        + "</tr>"));


                this.filesToUpload.push(
                    {
                        id: id,
                        file: file,
                        uploaded: false
                    });
            }
            if (this.filesToUpload.length > 0)
            {
                $("#lblDropFiles").hide();
                $("#btnUpload").prop("disabled", false);
            }
            else
            {
                $("#lblDropFiles").show();
                $("#btnUpload").prop("disabled", true);
            }
        }

        private uploadFile(fileIndex, uploadMetadata)
        {
            if ((fileIndex >= 0) && (fileIndex < this.filesToUpload.length))
            {
                this.doFileUpload(this.filesToUpload[fileIndex], uploadMetadata,(success) =>
                {
                    if (success)
                    {
                        this.uploadFile(fileIndex + 1, uploadMetadata);
                    }
                    else
                    {
                        $("#btnClose").text("Close");
                        $("#btnClose").prop("disabled", false);
                    }
                });
            }
            else
            {
                $("#btnClose").text("Close");
                $("#btnClose").prop("disabled", false);
                this.allDone = true;
            }
        }

        private doFileUpload(fileInfo, uploadMetadata, callback)
        {
            var fileId = fileInfo.id;
            var progressDiv = $("#" + fileId + "_progress");
            var statusDiv = $(".progress-bar", $(progressDiv));

            $(progressDiv).scrollintoview();

            var file = fileInfo.file;

            $catdv.initiateUpload(file.name, file.size, uploadMetadata,
                (reply) =>
                {
                    var ticket = reply.ticket;

                    var funcBlobSlice = File.prototype.mozSlice || File.prototype.webkitSlice || Blob.prototype.slice;

                    var chunkSize = Math.max(Math.min(file.size / 100, 65535 * 1024), 64 * 1024);
                    var fileSize = file.size;
                    var bytesUploaded = 0;

                    var sendChunk = () =>
                    {
                        var start = bytesUploaded;
                        if ((start + chunkSize) > fileSize)
                        {
                            chunkSize = fileSize - start;
                        }
                        if (chunkSize > 0)
                        {
                            var xhr = new XMLHttpRequest();
                            xhr.addEventListener("load", function transferComplete(evt)
                            {
                                var st = xhr.status;
                                if (st == 200)
                                {
                                    // The transfer is complete - send the next chunk
                                    bytesUploaded += chunkSize;

                                    Console.debug("chunkSize=" + chunkSize + " bytesUploaded=" + bytesUploaded);
                                    var progressValue = Math.round(bytesUploaded * 100 / fileSize);
                                    statusDiv.css('width', progressValue + '%').attr('aria-valuenow', progressValue).find("span").text(progressValue + "%");
                                    sendChunk();
                                }
                                else
                                {
                                    statusDiv.addClass("progress-bar-danger").css('width', '100%').attr('aria-valuenow', 100).find("span").text("Failed");
                                    alert("An error occurred while transferring the file.\n'" + xhr.statusText + "'");
                                    callback(false);
                                }
                            }, false);

                            xhr.open("PUT", $catdv.getApiUrl("uploads/" + ticket));
                            xhr.setRequestHeader("Content-Type", "application/octet-stream");
                            var chunkBlob = funcBlobSlice.call(file, start, start + chunkSize);

                            xhr.send(chunkBlob);
                        }
                        else
                        {
                            // done 
                            statusDiv.css('width', '100%').attr('aria-valuenow', 100).find("span").text("Done");
                            progressDiv.width(0);
                            callback(true);
                        }
                    };

                    sendChunk();
                },
                (status, errorMessage) =>
                {
                    statusDiv.css('width', '0').attr('aria-valuenow', 0).find("span").text("Failed");
                    alert("File Upload failed: " + errorMessage);
                    callback(false);
                }
                );
        }

        private bytesToSize(bytes, precision)
        {
            var kilobyte = 1024;
            var megabyte = kilobyte * 1024;
            var gigabyte = megabyte * 1024;
            var terabyte = gigabyte * 1024;

            if ((bytes >= 0) && (bytes < kilobyte))
            {
                return bytes + ' bytes';
            }
            else if ((bytes >= kilobyte) && (bytes < megabyte))
            {
                return (bytes / kilobyte).toFixed(precision) + ' Kb';

            }
            else if ((bytes >= megabyte) && (bytes < gigabyte))
            {
                return (bytes / megabyte).toFixed(precision) + ' Mb';

            }
            else
            // if ((bytes >= gigabyte)
            {
                return (bytes / gigabyte).toFixed(precision) + ' Gb';
            }
        }

    }
}




