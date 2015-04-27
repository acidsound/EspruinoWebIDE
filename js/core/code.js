/**
 Copyright 2014 Gordon Williams (gw@pur3.co.uk)

 This Source Code is subject to the terms of the Mozilla Public
 License, v2.0. If a copy of the MPL was not distributed with this
 file, You can obtain one at http://mozilla.org/MPL/2.0/.
 
 ------------------------------------------------------------------
  Handling the getting and setting of code
 ------------------------------------------------------------------
**/
"use strict";
(function(){
  
  var viewModeButton;

  function init() {
    // Configuration
    NodeMCU.Core.Config.add("AUTO_SAVE_CODE", {
      section : "Communications",
      name : "Auto Save",
      description : "Save code to Chrome's cloud storage when clicking 'Send to NodeMCU'?",
      type : "boolean",
      defaultValue : true
    });    

    // Setup code mode button
    viewModeButton = NodeMCU.Core.App.addIcon({
      id: "code",
      icon: "code", 
      title : "Switch between Code and Graphical Designer", 
      order: 0, 
      area: {
        name: "code",
        position: "bottom"
      },
      click: function() {
        if (isInBlockly()) {
          switchToCode();
          NodeMCU.Core.EditorLUA.madeVisible();
        } else {
          switchToBlockly();
        }
      }
    });

    // get code from our config area at bootup
    NodeMCU.addProcessor("initialised", function(data,callback) {
      var code;
      if (NodeMCU.Config.CODE) {
        code = NodeMCU.Config.CODE;
        console.log("Loaded code from storage.");
      } else {
        code = "gpio.mode(4,gpio.OUTPUT)\nl=false\ntmr.alarm(0,1000,1,function()\n  gpio.write(4,l and gpio.HIGH or gpio.LOW)\n  l=not l\nend)";
        console.log("No code in storage.");
      }
      NodeMCU.Core.EditorLUA.setCode(code);
      callback(data);
    });
    
    
    NodeMCU.addProcessor("sending", function(data, callback) {
      if(NodeMCU.Config.AUTO_SAVE_CODE)
        NodeMCU.Config.set("CODE", NodeMCU.Core.EditorLUA.getCode()); // save the code
      callback(data);
    });
  }
  
  function isInBlockly() { // TODO: we should really enumerate views - we might want another view?
    return $("#divblockly").is(":visible");
  }

  function switchToBlockly() {
    $("#divcode").hide();
    $("#divblockly").show();
    viewModeButton.setIcon("block");
  }

  function switchToCode() {
    $("#divblockly").hide();
    $("#divcode").show();
    viewModeButton.setIcon("code");
  }

  function getNodeMCUCode(callback) {
    NodeMCU.callProcessor("transformForNodeMCU", getCurrentCode(), callback);
  }
  
  function getCurrentCode() {
    if (isInBlockly()) {
      return NodeMCU.Core.EditorBlockly.getCode();
    } else {
      return NodeMCU.Core.EditorLUA.getCode();
    }
  }
  
  NodeMCU.Core.Code = {
    init : init,
    getNodeMCUCode : getNodeMCUCode, // get the currently selected bit of code ready to send to NodeMCU (including Modules)
    getCurrentCode : getCurrentCode, // get the currently selected bit of code (either blockly or javascript editor)
    isInBlockly: isInBlockly,
    switchToCode: switchToCode,
    switchToBlockly: switchToBlockly
  };
}());