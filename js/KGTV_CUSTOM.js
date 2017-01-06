$('body').on('DOMNodeInserted',function(e){
  var element = e.target; //inserted element;
  console.log("ready; hiding password button");
  element.hide();
  console.log(element);
});
