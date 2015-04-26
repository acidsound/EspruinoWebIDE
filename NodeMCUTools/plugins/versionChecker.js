/**
 Copyright 2014 Gordon Williams (gw@pur3.co.uk)

 This Source Code is subject to the terms of the Mozilla Public
 License, v2.0. If a copy of the MPL was not distributed with this
 file, You can obtain one at http://mozilla.org/MPL/2.0/.
 
 ------------------------------------------------------------------
   Check for the latest version of the board's software
 ------------------------------------------------------------------
**/
"use strict";
(function(){
  
  function init() {
    // Configuration
    NodeMCU.Core.Config.add("SERIAL_THROTTLE_SEND", {
      section : "Communications",
      name : "Throttle Send",
      description : "Throttle code when sending to NodeMCU? If you are experiencing lost characters when sending code from the Code Editor pane, this may help.",
      type : "boolean",
      defaultValue : false,
      onChange : function() { 
        checkEnv(NodeMCU.Core.Env.getData());
      }
    });
    
    // must be AFTER boardJSON
    NodeMCU.addProcessor("environmentVar", function(env, callback) {
      checkEnv(env);
      callback(env);
    }); 

    NodeMCU.addProcessor("flashComplete", function(env, callback) {

      var icon = NodeMCU.Core.App.findIcon("update");
      if(icon) icon.remove();

      callback(env);
    }); 

    NodeMCU.addProcessor("disconnected", function(env, callback) {
      var icon = NodeMCU.Core.App.findIcon("update");
      if(icon) icon.remove();
      
      callback(env);
    });
  }
  
  function checkEnv(env) {
    if (env!==undefined && 
        env.VERSION!==undefined) {        
      var tCurrent = env.VERSION;
      var vCurrent = NodeMCU.Core.Utils.versionToFloat(tCurrent);

      if (vCurrent > 1.43 && env.CONSOLE=="USB") {
        console.log("Firmware >1.43 supports faster writes over USB");
        NodeMCU.Core.Serial.setSlowWrite(false);
      } else {
        NodeMCU.Core.Serial.setSlowWrite(true);
      }  

      if (env.info!==undefined &&
          env.info.binary_version!==undefined) {
        var tAvailable = env.info.binary_version;
        var vAvailable = NodeMCU.Core.Utils.versionToFloat(tAvailable);

        console.log("FIRMWARE: Current "+tCurrent+", Available "+tAvailable);
      
        if (vAvailable > vCurrent && env.BOARD=="ESPRUINOBOARD") {
          console.log("New Firmware "+tAvailable+" available");

          NodeMCU.Core.App.addIcon({
            id:'update',
            icon: 'alert',
            title: 'New Firmware '+ tAvailable +' available. Click to update.',
            order: 999,
            cssClass: 'title-bar__button--alert',
            area: {
              name: "titlebar",
              position: "right"
            },
            click: function(){
              NodeMCU.Core.MenuSettings.show("Flasher");
            }
          });
        }
      }
    } 
  }
  
  NodeMCU.Plugins.VersionChecker = {
    init : init,
  };
}());
