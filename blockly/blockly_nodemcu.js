/**
 Copyright 2014 Gordon Williams (gw@pur3.co.uk)

 This Source Code is subject to the terms of the Mozilla Public
 License, v2.0. If a copy of the MPL was not distributed with this
 file, You can obtain one at http://mozilla.org/MPL/2.0/.

 ------------------------------------------------------------------
  Blockly blocks for Espruino
 ------------------------------------------------------------------
**/

// --------------------------------- Blockly init code - see /js/core/editorBlockly.js
window.onload = function() {
  Blockly.inject(document.body,{path: '', toolbox: document.getElementById('toolbox')});
  Blockly.Xml.domToWorkspace(Blockly.mainWorkspace, document.getElementById('blocklyInitial'));
  window.parent.blocklyLoaded(Blockly, window); // see core/editorBlockly.js
};
// When we have JSON from the board, use it to
// update our list of available pins
Blockly.setBoardJSON = function(info) {
  console.log("Blockly.setBoardJSON ", info);
  if (!("pins" in info)) return;
  if (!("devices" in info)) return;
  PINS = [];
  var i,s;
  for (i=1;i<8;i++) {
    s = "LED"+i;
    if (s in info.devices) PINS.push([s,s]);
  }
  for (i=1;i<8;i++) {
    s = "BTN"+i;
    if (s in info.devices) PINS.push([s,s]);
  }
  for (i in info.pins)
    PINS.push([info.pins[i].name, info.pins[i].name]);


};
// ---------------------------------

var NODEMCU_COL = 190;

var PORTS = ["A","B","C"];
var PINS = [
      ["LED1", 'LED1'],
      ["LED2", 'LED2'],
      ["LED3", 'LED3'],
      ["BTN1", 'BTN1']];
for (var p in PORTS)
  for (var i=0;i<16;i++) {
    var pinname = PORTS[p]+i;
    PINS.push([pinname,pinname]);
  }

Blockly.Blocks.nodemcu_timeout = {
  category: 'NodeMCU',
  init: function() {
      this.appendValueInput('SECONDS')
          .setCheck('Number')
          .appendField('wait');
      this.appendDummyInput()
          .appendField("seconds");
      this.appendStatementInput('DO')
           .appendField('do');

    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setColour(NODEMCU_COL);
    this.setInputsInline(true);
    this.setTooltip('Waits for a certain period before running code');
  }
};
Blockly.Blocks.nodemcu_interval = {
  category: 'NodeMCU',
  init: function() {
      this.appendValueInput('SECONDS')
          .setCheck('Number')
          .appendField('every');
      this.appendDummyInput()
          .appendField("seconds");
      this.appendStatementInput('DO')
           .appendField('do');

    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setColour(NODEMCU_COL);
    this.setInputsInline(true);
    this.setTooltip('Runs code repeatedly, every so many seconds');
  }
};

Blockly.Blocks.nodemcu_pin = {
//      category: 'NodeMCU',
  init: function() {

    var start = 0;
    var incrementStep = 10;
    var originalPin = undefined;
    var listGen = function() {
      originalPin = this.value_;
      var list = PINS.slice(start, start+incrementStep);
      if (start>0) list.unshift(['Back...', 'Back']);
      if (start+incrementStep<PINS.length) list.push(['More...', 'More']);
      return list;
    };

    var pinSelector = new Blockly.FieldDropdown(listGen, function(selection){
      var ret = undefined;

      if (selection == "More" || selection == "Back") {
        if (selection == "More")
          start += incrementStep;
        else
          start -= incrementStep;

        var t = this;
        setTimeout(function(){t.showEditor_();},1);

        return originalPin;
      }
    });

    this.setColour(NODEMCU_COL);
    this.setOutput(true, 'Pin');
    this.appendDummyInput().appendField(pinSelector, 'PIN');
    this.setTooltip('The Name of a Pin');
  },
};


Blockly.Blocks.nodemcu_watch = {
  category: 'NodeMCU',
  init: function() {
      this.appendValueInput('PIN')
          .setCheck('Pin')
          .appendField('watch');
      this.appendDummyInput()
           .appendField(new Blockly.FieldDropdown(this.EDGES), 'EDGE').appendField('edge');;
      this.appendStatementInput('DO')
           .appendField('do');

    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setColour(NODEMCU_COL);
    this.setInputsInline(true);
    this.setTooltip('Runs code when an input changes');
  },
EDGES: [
["both", 'both'],
["rising", 'rising'],
["falling", 'falling']]
};


Blockly.Blocks.nodemcu_getTime = {
    category: 'NodeMCU',
    init: function() {
      this.appendDummyInput().appendField('Time');
      this.setOutput(true, 'Number');
      this.setColour(230/*Number*/);
      this.setInputsInline(true);
      this.setTooltip('Read the current time in seconds');
    }
  };


Blockly.Blocks.nodemcu_digitalWrite = {
  category: 'NodeMCU',
  init: function() {
      this.appendValueInput('PIN')
          .setCheck('Pin')
          .appendField('digitalWrite Pin');
      this.appendValueInput('VAL')
          .setCheck(['Number','Boolean'])
          .appendField('Value');

    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setColour(NODEMCU_COL);
    this.setInputsInline(true);
    this.setTooltip('Writes a Digital Value to a Pin');
  }
};
Blockly.Blocks.nodemcu_digitalPulse = {
    category: 'NodeMCU',
    init: function() {
        this.appendValueInput('PIN')
            .setCheck('Pin')
            .appendField('digitalPulse Pin');
        this.appendValueInput('VAL')
            .setCheck(['Boolean']);
        this.appendValueInput('TIME')
            .setCheck(['Number'])
            .appendField('Milliseconds');

      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setColour(NODEMCU_COL);
      this.setInputsInline(true);
      this.setTooltip('Pulses a pin for the given number of milliseconds');
    }
  };
Blockly.Blocks.nodemcu_digitalRead = {
  category: 'NodeMCU',
  init: function() {
      this.appendValueInput('PIN')
          .setCheck('Pin')
          .appendField('digitalRead Pin');

    this.setOutput(true, 'Boolean');
    this.setColour(NODEMCU_COL);
    this.setInputsInline(true);
    this.setTooltip('Read a Digital Value from a Pin');
  }
};

Blockly.Blocks.nodemcu_analogWrite = {
    category: 'NodeMCU',
    init: function() {
        this.appendValueInput('PIN')
            .setCheck('Pin')
            .appendField('analogWrite Pin');
        this.appendValueInput('VAL')
            .setCheck(['Number','Boolean'])
            .appendField('Value');

      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setColour(NODEMCU_COL);
      this.setInputsInline(true);
      this.setTooltip('Writes an Analog Value to a Pin');
    }
  };
Blockly.Blocks.nodemcu_analogRead = {
    category: 'NodeMCU',
    init: function() {
        this.appendValueInput('PIN')
            .setCheck('Pin')
            .appendField('analogRead Pin');

      this.setOutput(true, 'Number');
      this.setColour(NODEMCU_COL);
      this.setInputsInline(true);
      this.setTooltip('Read an Analog Value from a Pin');
    }
  };

Blockly.Blocks.nodemcu_code = {
    category: 'NodeMCU',
    init: function() {
      this.appendDummyInput().appendField(new Blockly.FieldTextArea("// Enter Lua Code Here"),"CODE");

      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setColour(NODEMCU_COL);
      this.setInputsInline(true);
      this.setTooltip('Executes the given Lua code');
    }
  };
// -----------------------------------------------------------------------------------

Blockly.Lua.text_print = function() {
  var argument0 = Blockly.Lua.valueToCode(this, 'TEXT',
      Blockly.Lua.ORDER_NONE) || '\'\'';
  return 'print(' + argument0 + ')\n';
};
Blockly.Lua.nodemcu_timeout = function() {
  var seconds = Blockly.Lua.valueToCode(this, 'SECONDS',
      Blockly.Lua.ORDER_ASSIGNMENT) || '1';
  var branch = Blockly.Lua.statementToCode(this, 'DO');
  return "setTimeout(function() {\n"+branch+" }, "+seconds+"*1000.0)\n";
};
Blockly.Lua.nodemcu_getTime = function() {
  return ["getTime()\n", Blockly.Lua.ORDER_ATOMIC];
};
Blockly.Lua.nodemcu_interval = function() {
  var seconds = Blockly.Lua.valueToCode(this, 'SECONDS',
      Blockly.Lua.ORDER_ASSIGNMENT) || '1';
  var branch = Blockly.Lua.statementToCode(this, 'DO');
  return "setInterval(function() {\n"+branch+" }, "+seconds+"*1000.0)\n";
};
Blockly.Lua.nodemcu_pin = function() {
  var code = this.getTitleValue('PIN');
  return [code, Blockly.Lua.ORDER_ATOMIC];
};
Blockly.Lua.nodemcu_watch = function() {
  var pin = Blockly.Lua.valueToCode(this, 'PIN', Blockly.Lua.ORDER_ASSIGNMENT) || '0';
  var edge = this.getTitleValue('EDGE');
  var branch = Blockly.Lua.statementToCode(this, 'DO');
  var json = { repeat : true, edge : edge };
  if (pin=="BTN1") json.debounce = 10;
  return "setWatch(function() {\n"+branch+" }, "+pin+", "+JSON.stringify(json)+")\n";
};
Blockly.Lua.nodemcu_digitalWrite = function() {
  var pin = Blockly.Lua.valueToCode(this, 'PIN', Blockly.Lua.ORDER_ASSIGNMENT) || '0';
  var val = Blockly.Lua.valueToCode(this, 'VAL', Blockly.Lua.ORDER_ASSIGNMENT) || '0';
  return "digitalWrite("+pin+", "+val+")\n";
};
Blockly.Lua.nodemcu_digitalPulse = function() {
  var pin = Blockly.Lua.valueToCode(this, 'PIN', Blockly.Lua.ORDER_ASSIGNMENT) || '0';
  var val = Blockly.Lua.valueToCode(this, 'VAL', Blockly.Lua.ORDER_ASSIGNMENT) || '0';
  var tim = Blockly.Lua.valueToCode(this, 'TIME', Blockly.Lua.ORDER_ASSIGNMENT) || '0';
  return "digitalPulse("+pin+", "+val+", "+tim+")\n";
};
Blockly.Lua.nodemcu_digitalRead = function() {
  var pin = Blockly.Lua.valueToCode(this, 'PIN', Blockly.Lua.ORDER_ASSIGNMENT) || '0';
  return ["digitalRead("+pin+")\n", Blockly.Lua.ORDER_ATOMIC];
};
Blockly.Lua.nodemcu_analogWrite = function() {
  var pin = Blockly.Lua.valueToCode(this, 'PIN', Blockly.Lua.ORDER_ASSIGNMENT) || '0';
  var val = Blockly.Lua.valueToCode(this, 'VAL', Blockly.Lua.ORDER_ASSIGNMENT) || '0';
  return "pwm.setduty("+pin+", "+val+")\n";
};
Blockly.Lua.nodemcu_analogRead = function() {
  var pin = Blockly.Lua.valueToCode(this, 'PIN', Blockly.Lua.ORDER_ASSIGNMENT) || '0';
  return ["adc.read("+pin+")\n", Blockly.Lua.ORDER_ATOMIC];
};
Blockly.Lua.nodemcu_code = function() {
  var code = this.getFieldValue("CODE");
  return code;
};
