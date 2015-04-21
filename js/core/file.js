/**
 Copyright 2014 Gordon Williams (gw@pur3.co.uk)

 This Source Code is subject to the terms of the Mozilla Public
 License, v2.0. If a copy of the MPL was not distributed with this
 file, You can obtain one at http://mozilla.org/MPL/2.0/.
 
 ------------------------------------------------------------------
  File Load/Save
 ------------------------------------------------------------------
**/
"use strict";
(function(){
  
  var currentJSFileName = "code.js";
  var currentXMLFileName = "code_blocks.xml";
  
  function init() {
    // Configuration
    
   
    // Add stuff we need
    NodeMCU.Core.App.addIcon({
      id: "openFile",
      icon: "folder-open", 
      title : "Open File", 
      order: 100, 
      area: { 
        name: "code", 
        position: "top"
      }, 
      click: function() {
        if (NodeMCU.Core.Code.isInBlockly())
          loadFile(NodeMCU.Core.EditorBlockly.setXML, currentXMLFileName);
        else
          loadFile(NodeMCU.Core.EditorJavaScript.setCode, currentJSFileName);
      }
    });

    NodeMCU.Core.App.addIcon({
      id: "saveFile",
      icon: "save", 
      title : "Save File", 
      order: 200, 
      area: { 
        name: "code", 
        position: "top"
      },
      click: function() {
        if (NodeMCU.Core.Code.isInBlockly())
          saveFile(NodeMCU.Core.EditorBlockly.getXML(), currentXMLFileName);
        else
          saveFile(NodeMCU.Core.EditorJavaScript.getCode(), currentJSFileName);
      }
    });
  }

  function setCurrentFileName(filename) {
    if (NodeMCU.Core.Code.isInBlockly()) {
      currentXMLFileName = filename;
    } else { 
      currentJSFileName = filename;
    }
  }
  
  /**  Handle newline conversions - Windows expects newlines as /r/n when we're saving/loading files */
  function convertFromOS(chars) {
   if (!NodeMCU.Core.Utils.isWindows()) return chars;
   return chars.replace(/\r\n/g,"\n");
  };
  
  /**  Handle newline conversions - Windows expects newlines as /r/n when we're saving/loading files */
  function convertToOS(chars) {
   if (!NodeMCU.Core.Utils.isWindows()) return chars;
   return chars.replace(/\r\n/g,"\n").replace(/\n/g,"\r\n");
  };  

  function loadFile(callback, filename) {
    chrome.fileSystem.chooseEntry({type: 'openFile', suggestedName:filename}, function(fileEntry) {
      if (!fileEntry) return;
      if (fileEntry.name) setCurrentFileName(fileEntry.name);
      fileEntry.file(function(file) {
        var reader = new FileReader();
        reader.onload = function(e) {
          callback(convertFromOS(e.target.result));
        };
        reader.onerror = function() {
          NodeMCU.Core.Notifications.error("Error Loading", true);
        };
        reader.readAsText(file);
      });
    });
  }
  
  function saveFile(data, filename) {
    //saveAs(new Blob([convertToOS(data)], { type: "text/plain" }), filename); // using FileSaver.min.js

    function errorHandler() {
      NodeMCU.Core.Notifications.error("Error Saving", true);
    }

    chrome.fileSystem.chooseEntry({type: 'saveFile', suggestedName:filename}, function(writableFileEntry) {
      if (writableFileEntry.name)
        setCurrentFileName(writableFileEntry.name);
      writableFileEntry.createWriter(function(writer) {
        var blob = new Blob([convertToOS(data)],{ type: "text/plain"} );
        writer.onerror = errorHandler;
        // when truncation has finished, write
        writer.onwriteend = function(e) {
          writer.onwriteend = function(e) {
            console.log('FileWriter: complete');
          };
          console.log('FileWriter: writing');
          writer.write(blob);
        };
        // truncate
        console.log('FileWriter: truncating');
        writer.truncate(blob.size);
      }, errorHandler);
    });
  };  

  NodeMCU.Core.File = {
    init : init
  };
}());
