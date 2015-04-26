/**
 Copyright 2014 Gordon Williams (gw@pur3.co.uk)

 This Source Code is subject to the terms of the Mozilla Public
 License, v2.0. If a copy of the MPL was not distributed with this
 file, You can obtain one at http://mozilla.org/MPL/2.0/.
 
 ------------------------------------------------------------------
  An Example Plugin
 ------------------------------------------------------------------
**/
"use strict";
(function(){
  
  function init() {
    NodeMCU.Core.Config.add("RESET_BEFORE_SEND", {
      section : "Communications",
      name : "Reset before Send",
      description : "Reset NodeMCU before sending code from the editor pane?",
      type : "boolean",
      defaultValue : true
    });
  }

  function writeToNodeMCU(code) {
    code = reformatCode(code);
    
    var realSendSerial = function(data) {
      console.log("Sending... "+data);
      NodeMCU.Core.Serial.write(data);
    };
    var sendSerial = realSendSerial;
    
    // If we're supposed to reset NodeMCU before sending...
    if (NodeMCU.Config.RESET_BEFORE_SEND) {
      sendSerial = function(data) { 
        // reset NodeMCU
        //NodeMCU.Core.Serial.write("node.restart()\n");
        // wait for the reset
        setTimeout(function() {
          realSendSerial(data);
        }, 200);
      };
    } 
    
    // We want to make sure we've got a prompt before sending. If not,
    // this will issue a Ctrl+C
    var sendSerialAfterPrompt = function(data) {
      NodeMCU.Core.Utils.getNodeMCUPrompt(function() {
        sendSerial(data);
      });
    };
    
    if(NodeMCU.Config.SEND_MINIFIED === true){
      NodeMCU.Plugins.Minify.MinifyCode(code,sendSerialAfterPrompt);
    } else {
      sendSerialAfterPrompt(code);
    }      
  }
  
  /// Parse and fix issues like `if (false)\n foo` in the root scope
  function reformatCode(code) {      
    var resultCode = "";
    /** we're looking for:
     *   `a = \n b`
     *   `for (.....) \n X`
     *   `if (.....) \n X`
     *   `while (.....) \n X`
     *   `do \n X`
     *   `function (.....) \n X`   
     *   `function N(.....) \n X`
     *   `var a \n , b`    `var a = 0 \n, b`
     *   `var a, \n b`     `var a = 0, \n b`
     *   
     *   These are divided into two groups - where there are brackets
     *   after the keyword (statementBeforeBrackets) and where there aren't
     *   (statement)
     *   
     *   We fix them by replacing \n with what you get when you press
     *   Alt+Enter (Ctrl + LF). This tells NodeMCU that it's a newline
     *   but NOT to execute. 
     */ 
    var lex = NodeMCU.Core.Utils.getLexer(code);
    var brackets = 0;
    var statementBeforeBrackets = false;
    var statement = false;
    var varDeclaration = false;
    var lastIdx = 0;
    var lastTok;
    var tok = lex.next();
    while (tok!==undefined) {
      var previousString = code.substring(lastIdx, tok.startIdx);
      var tokenString = code.substring(tok.startIdx, tok.endIdx);
      //console.log("prev "+JSON.stringify(previousString)+"   next "+tokenString);
      
      if (tok.str=="(" || tok.str=="{" || tok.str=="[") brackets++;
      
      if (brackets>0 || statement || statementBeforeBrackets || varDeclaration) {
        //console.log("Possible"+JSON.stringify(previousString));
        previousString = previousString.replace(/\n/g, "\x1B\x0A");
      }
      
      if (tok.str==")" || tok.str=="}" || tok.str=="]") brackets--;      

      
      
      if (brackets==0) {
        if (tok.str=="for" || tok.str=="if" || tok.str=="while" || tok.str=="function") {
          statementBeforeBrackets = true;
          varDeclaration = false;
        } else if (tok.str=="var") {
          varDeclaration = true;
        } else if (tok.type=="ID" && lastTok!==undefined && lastTok.str=="function") {
          statementBeforeBrackets = true;
        } else if (tok.str==")" && statementBeforeBrackets) {            
          statementBeforeBrackets = false;
          statement = true;
        } else if (tok.str=="=" || tok.str=="do") {
          statement = true;
        } else {            
          if (tok.str==";") varDeclaration = false;
          statement = false;
          statementBeforeBrackets = false;
        }          
      }
      // add our stuff back together
      resultCode += previousString + tokenString;
      // next
      lastIdx = tok.endIdx;
      lastTok = tok;
      tok = lex.next();               
    }
    //console.log(resultCode);
    return resultCode;
  };
  
  NodeMCU.Core.CodeWriter = {
    init : init,
    writeToNodeMCU : writeToNodeMCU,
  };
}());
