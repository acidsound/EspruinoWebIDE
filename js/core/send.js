/**
 Copyright 2014 Gordon Williams (gw@pur3.co.uk)

 This Source Code is subject to the terms of the Mozilla Public
 License, v2.0. If a copy of the MPL was not distributed with this
 file, You can obtain one at http://mozilla.org/MPL/2.0/.
 
 ------------------------------------------------------------------
  "Send to NodeMCU" implementation
 ------------------------------------------------------------------
**/
"use strict";
(function(){
  
  function init() {
    // Add stuff we need
    NodeMCU.Core.App.addIcon({
      id: "deploy",
      icon: "deploy", 
      title : "Send to NodeMCU",
      order: 400, 
      area: { 
        name: "code", 
        position: "top"
      }, 
      click: function() {
        NodeMCU.Core.MenuPortSelector.ensureConnected(function() {
          NodeMCU.Core.Terminal.focus(); // give the terminal focus
          NodeMCU.callProcessor("sending");
          NodeMCU.Core.Code.getNodeMCUCode(NodeMCU.Core.CodeWriter.writeToNodeMCU);
        });
      }
    });
    
    NodeMCU.addProcessor("connected", function(data, callback) {
      $(".send").button( "option", "disabled", false);
      callback(data);
    });
    NodeMCU.addProcessor("disconnected", function(data, callback) {
      $(".send").button( "option", "disabled", true);  
      callback(data);
    });     
  }
  
  NodeMCU.Core.Send = {
    init : init,
  };
}());
