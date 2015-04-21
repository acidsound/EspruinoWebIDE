/**
 Copyright 2014 Gordon Williams (gw@pur3.co.uk)

 This Source Code is subject to the terms of the Mozilla Public
 License, v2.0. If a copy of the MPL was not distributed with this
 file, You can obtain one at http://mozilla.org/MPL/2.0/.
 
 ------------------------------------------------------------------
  Handle URLS of the form http://www.espruino.com/webide?...
  These are sent from background.js and are picked up by the Web IDE
 ------------------------------------------------------------------
**/
"use strict";
(function(){
  
  function init() {
  }
  
  function handleQuery(key, val) {
    NodeMCU.Core.Code.switchToCode(); // if in blockly
    switch(key){
      case "code":
        NodeMCU.Core.EditorJavaScript.setCode(val);
        break;
      case "upload":
        NodeMCU.Core.MenuPortSelector.ensureConnected(function() {
          NodeMCU.Core.Terminal.focus(); // give the terminal focus
          NodeMCU.callProcessor("sending");
          NodeMCU.Core.CodeWriter.writeToEspruino(val);
          NodeMCU.Core.EditorJavaScript.setCode(val);
        });        
        break;
      case "gist":
        NodeMCU.Core.EditorJavaScript.setCode("Loading...");
        $.getJSON("https://api.github.com/gists/"+ val, function(data){
          if(data && data.files){
            var keys = Object.keys(data.files);
            if(keys.length > 0){
              NodeMCU.Core.EditorJavaScript.setCode(data.files[keys[0]].content);
            }
          }
        }).error(function(){
          NodeMCU.Core.EditorJavaScript.setCode("ERROR");
        });
        break;
    }
  }
  
  function handle(url) {    
    console.log("Handling URL "+JSON.stringify(url));
    url = (url);
    var q = url.indexOf("?");
    if (q<0) return;
    var query = url.substr(q+1).split("&");
    for (var i in query) {
      var eq = query[i].split("=");
      if (eq.length==1)
        handleQuery(eq[0],undefined);
      else if (eq.length==2)
        handleQuery(decodeURIComponent(eq[0]),decodeURIComponent(eq[1]));
      else
        console.warn("Didn't understand query section "+JSON.stringify(query[i]));
    }
  }
    

  NodeMCU.Plugins.URLHandler = {
    init : init,
    
    handle : handle, // handle a URL
  };
}());