chrome.app.runtime.onLaunched.addListener(function(launchData) {
  chrome.app.window.create('main.html', {
    id:"nodemcu_mainwindow",
    width: 1024, 
    height: 600, 
    singleton: true,
    frame: 'none'
  }, function(win) {
    // ---------------------------------------------------------- SAVE ON EXIT
    win.onClosed.addListener(function() {
      // Copy code from local storage into sync storage
      // Code was put into local storage by editorJavaScript
      chrome.storage.local.get("CODE_JS", function (ldata) {        
        chrome.storage.sync.get( "CONFIGS", function (ddata) { 
          var data = ddata["CONFIGS"];
          data["CODE"] = ldata["CODE_JS"];
          chrome.storage.sync.set({ CONFIGS : data });   
        });
      });
    });
    // ---------------------------------------------------------- URL LAUNCH
    if (launchData.id) {
      // We are called to handle a URL that matches one of our url_handlers.
      if (launchData.id === 'nodemcu_code') {
       if (win.contentWindow.NodeMCU!==undefined && win.contentWindow.NodeMCU.initialised==true) {
          win.contentWindow.NodeMCU.Plugins.URLHandler.handle(launchData.url);
        } else {
          // timeout required for first launch for some reason
          win.contentWindow.setTimeout(function() {            
              win.contentWindow.NodeMCU.Plugins.URLHandler.handle(launchData.url);
          }, 2000);
        }
      } else {
        console.error("Unexpected URL handler ID: " + launchData.id);
      }
    }
    
  });
  
  
 
});