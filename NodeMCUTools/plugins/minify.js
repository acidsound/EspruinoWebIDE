/**
 Copyright 2014 Gordon Williams (gw@pur3.co.uk)

 This Source Code is subject to the terms of the Mozilla Public
 License, v2.0. If a copy of the MPL was not distributed with this
 file, You can obtain one at http://mozilla.org/MPL/2.0/.
 
 ------------------------------------------------------------------
  Automatically minify code before it is sent to NodeMCU
 ------------------------------------------------------------------
**/
"use strict";
(function(){
  
  var minifyUrl = "http://closure-compiler.appspot.com/compile";
  
  function init() {
    NodeMCU.Core.Config.add("MINIFICATION_LEVEL", {
      section : "Communications",
      name : "Minification",
      description : "Automatically minify sent code? This will save NodeMCU's memory and may increase execution speed, but it will make debugging harder.",
      type : { "":"No Minification",
               "WHITESPACE_ONLY":"Whitespace Only",
               "SIMPLE_OPTIMIZATIONS":"Simple Optimizations",
               "ADVANCED_OPTIMIZATIONS":"Advanced Optimizations (not recommended)"},
      defaultValue : ""
    });
    NodeMCU.Core.Config.add("MODULE_MINIFICATION_LEVEL", {
      section : "Communications",
      name : "Module Minification",
      description : "Automatically minify modules? This will save NodeMCU's memory and may increase execution speed, but it will make debugging modules harder. Modules with the extension .min.js will not be minified by default.",
      type : { "":"No Minification",
               "WHITESPACE_ONLY":"Whitespace Only",
               "SIMPLE_OPTIMIZATIONS":"Simple Optimizations",
               "ADVANCED_OPTIMIZATIONS":"Advanced Optimizations (not recommended)"},
      defaultValue : "WHITESPACE_ONLY"
    });
    
    // When code is sent to NodeMCU, search it for modules and add extra code required to load them
    NodeMCU.addProcessor("transformForNodeMCU", minifyNodeMCU);
   // When code is sent to NodeMCU, search it for modules and add extra code required to load them
    NodeMCU.addProcessor("transformModuleForNodeMCU", minifyModule);
  }
  
  function closureCompiler(code, minificationLevel, output_info, callback) {
    var minifyObj = $.param({
      compilation_level: minificationLevel,
      output_format: "text",
      output_info: output_info,
      js_code: code,
      language : "ECMASCRIPT6" // so no need to mess with binary numbers now. \o/
    });      
    $.post(minifyUrl, minifyObj, function(minifiedCode) {      
      code = minifiedCode;          
    },"text")
      .error(function() { 
        NodeMCU.Core.Notifications.error("HTTP error while minifying.");
      })
      .complete(function() {
        // ensure we call the callback even if minification failes
        callback(code);
    });
  }

  function minifyCode(code, callback, minificationLevel) {
    closureCompiler(code, minificationLevel, 'compiled_code', function(minified) {
      if (minified.trim()!="") { 
        console.log("Minification complete. Code Size reduced from " + code.length + " to " + minified.length);
        console.log(JSON.stringify(minified));
        callback(minified);
      } else {
        NodeMCU.Core.Notifications.warning("Errors while minifying - sending unminified code.");
        callback(code);
        // get errors...
        closureCompiler(code, minificationLevel, 'errors', function(errors) {
          console.log("Closure compiler errors: "+errors);
          errors.split("\n").forEach(function (err) {
            if (err.trim()!="")
              NodeMCU.Core.Notifications.error(err.trim());
          });
        });
      }
    });
  }

  function minifyNodeMCU(code, callback) {
    if (NodeMCU.Config.MINIFICATION_LEVEL != "") {
      // if we've been asked to minify...
      minifyCode(code, callback, NodeMCU.Config.MINIFICATION_LEVEL);
    } else {
      // just pass code onwards
      callback(code);
    }
  }

  function minifyModule(code, callback) {
    if (NodeMCU.Config.MODULE_MINIFICATION_LEVEL != "") {
      /* we add a header and footer to make sure that the closure compiler
      can rename non-public constants, but NOT the `exports` variable.*/
      var header = "(function(){";
      var footer = "})();";
      // if we've been asked to minify...
      minifyCode(header+code+footer, function(minified) {
       callback(minified.substr(header.length, minified.length-(header.length+footer.length+1)));
      }, NodeMCU.Config.MODULE_MINIFICATION_LEVEL);
    } else {
      // just pass code onwards
      callback(code);
    }
  }
  
  NodeMCU.Plugins.Minify = {
    init : init,
  };
}());
