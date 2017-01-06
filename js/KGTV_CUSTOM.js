$("#user-changePassword").on("DOMNodeInserted", function(){
  var element = $(this);
  console.log("ready; hiding password button");
  element.hide();
  console.log(element);
});
