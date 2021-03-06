
        // _RestApi.prototype.getClip = function (clipId, success_callback, failure_callback) {
        //     this.api_get("clips/" + clipId, { include: "proxyPath" }, success_callback, failure_callback);
        // };

//         {
//     "ID": "3562",
//     "status": "updated via API 3 (0001)",
//     "userFields":{
//         "U6" : "Rattlesnake Kid"
//     }
// }

var $catdv = catdv.RestApi;

var downloadTracker = function(){
  var downloadsField = "catdv.master.download.count";
  var downloadedByField = "catdv.master.downloaded..by";
  var functions = {
    updateDownloadCount : function(clipID, cb, fcb){
      $catdv.getClip(clipID, function(result){
        // console.log(result);
        var downloadCount = (result.userFields && result.userFields[downloadsField] ? parseInt(result.userFields[downloadsField]) : 0);
        var downloadBy = (result.userFields && result.userFields[downloadedByField] ? result.userFields[downloadedByField] : "");
        result.userFields[downloadsField] = downloadCount + 1;
        result.userFields[downloadedByField] = downloadBy + "<p>" + $.cookie("username") + " @ " + moment().format('MMMM Do YYYY, h:mm:ss a Z z') + "</p>\n";
        $catdv.saveClip(result, cb, fcb);
        // cb();
      }, fcb);
    }
  };
  return functions;
}
var tracker = downloadTracker();

// =====
// left and right click tracker
// right click context menu is disabled by this code.
// =====
$(document).on('click contextmenu', '.mediaPath a', function(event){
  var href = event.target.href
  event.preventDefault();
  tracker.updateDownloadCount(getUrlParameter("id"),
    function(){
      console.log("success");
      window.location = href;
    },
    function(){
      window.location = href;
      console.log("failed");
    }
  )
  return false;
})

$(document).on('click', '#btnDownload', function(event){

  tracker.updateDownloadCount(getUrlParameter("id"),
    function(){
      console.log("download button clicked update count incremented");
      return true;
    },
    function(){
      console.log("download button ajax failed. ");
      return false;
    }
  )
  return false;
});




var getUrlParameter = function getUrlParameter(sParam) {
    var sPageURL = decodeURIComponent(window.location.search.substring(1)),
        sURLVariables = sPageURL.split('&'),
        sParameterName,
        i;

    for (i = 0; i < sURLVariables.length; i++) {
        sParameterName = sURLVariables[i].split('=');

        if (sParameterName[0] === sParam) {
            return sParameterName[1] === undefined ? true : sParameterName[1];
        }
    }
};
