/**
Copyright 2012 Google Inc.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

Author: Renato Mangini (mangini@chromium.org)
Author: Luis Leao (luisleao@gmail.com)
Author: Gordon Williams (gw@pur3.co.uk)
**/

(function() {
  if (chrome.serial.getDevices===undefined) {
    // wrong chrome version
    console.log("Chrome does NOT have post-M33 serial API");
    return;
  }

  function init() {
    NodeMCU.Core.Config.add("BAUD_RATE", {
      section : "Communications",
      name : "Baud Rate",
      description : "When connecting over serial, this is the baud rate that is used. 9600 is the default for NodeMCU",
      type : {9600:9600,14400:14400,19200:19200,28800:28800,38400:38400,57600:57600,115200:115200},
      defaultValue : 9600
    });
  }

  var connectionInfo;
  var readListener;
  var connectedPort; // unused?
  var connectionDisconnectCallback;

  // For throttled write
  var slowWrite = true;
  var writeData = undefined;
  var writeTimeout = undefined;


  var startListening=function(callback) {
    var oldListener = readListener;
    readListener = callback;
    return oldListener;
  };

  var getPorts=function(callback) {
    chrome.serial.getDevices(function(devices) {

      var prefix = "";
      // Workaround for Chrome v34 bug - http://forum.espruino.com/conversations/1056/#comment16121
      // In this case, ports are reported as ttyACM0 - not /dev/ttyACM0
      if (navigator.userAgent.indexOf("Linux")>=0) {
        hasSlashes = false;
        devices.forEach(function(device) { if (device.path.indexOf("/")>=0) hasSlashes=true; });
        if (!hasSlashes) prefix = "/dev/";
      }

      callback(devices.map(function(device) {
        return prefix+device.path;
      }));
    });
  };

  var openSerial=function(serialPort, openCallback, disconnectCallback) {
    connectionDisconnectCallback = disconnectCallback;
    chrome.serial.connect(serialPort, {bitrate: parseInt(NodeMCU.Config.BAUD_RATE)},
      function(cInfo) {
        if (!cInfo) {
          console.log("Unable to open device (connectionInfo="+cInfo+")");
          openCallback(undefined);
        } else {
          connectionInfo = cInfo;
          connectedPort = serialPort;
          console.log(cInfo);
          NodeMCU.callProcessor("connected", undefined, function() {
            openCallback(cInfo);
          });
        }
    });
  };

  var writeSerialDirect = function(str) {
    str = str.replace(String.fromCharCode(27),'');
    //str = str.replace(String.fromCharCode(3),'');
        chrome.serial.send(connectionInfo.connectionId, str2ab(str), function() {});
  };

  var str2ab=function(str) {
    var buf=new ArrayBuffer(str.length);
    var bufView=new Uint8Array(buf);
    for (var i=0; i<str.length; i++) {
      bufView[i]=str.charCodeAt(i);
    }
    return buf;
  };


  var closeSerial=function(callback) {
   if (writeTimeout!==undefined)
     clearInterval(writeTimeout);
   writeTimeout = undefined;
   writeData = undefined;

   connectionDisconnectCallback = undefined;
   if (connectionInfo) {
     chrome.serial.disconnect(connectionInfo.connectionId,
      function(result) {
        connectionInfo=null;
        NodeMCU.callProcessor("disconnected");
        if (callback) callback(result);
      });
    }
  };

  var isConnected = function() {
    return connectionInfo!=null && connectionInfo.connectionId>=0;
  };

  // Throttled serial write
  var writeSerial = function(data, showStatus) {
    if (!isConnected()) return; // throw data away
    if (showStatus===undefined) showStatus=true;

    /*var d = [];
    for (var i=0;i<data.length;i++) d.push(data.charCodeAt(i));
    console.log("Write "+data.length+" bytes - "+JSON.stringify(d));*/

    /* Here we queue data up to write out. We do this slowly because somehow
    characters get lost otherwise (compared to if we used other terminal apps
    like minicom) */
    if (writeData == undefined)
      writeData = data;
    else
      writeData += data;
    if (showStatus) {
      NodeMCU.Core.Status.setStatus("Sending...", writeData.length);
    }
    if (writeTimeout===undefined) {
        var sender=function(str) {
            if(str) {
                var indexOfLF=(str.indexOf('\n'));
                if(~indexOfLF) {
                    writeSerialDirect(str.substr(0, indexOfLF+1));
                    if (showStatus) NodeMCU.Core.Status.incrementProgress(indexOfLF);
                    writeTimeout=setTimeout(function() {
                        sender(str.substr(indexOfLF+1));
                    }, 300);
                } else {
                    writeSerialDirect(str);
                    if (showStatus) NodeMCU.Core.Status.setStatus("Sent");
                    str="";
                    writeTimeout=undefined;
                    writeData=undefined;
                }
            } else {
                writeSerialDirect(str);
                if (showStatus) NodeMCU.Core.Status.setStatus("Sent");
                writeTimeout=undefined;
                writeData=undefined;
            }
        };
        sender(writeData);
      //function sender() {
      //  if (writeData!=undefined) {
      //    var d = undefined;
      //    if (~writeData.indexOf('\n')) {
      //      d = writeData.substr(0, writeData.indexOf('\n')+1);
      //      writeData = writeData.substr(writeData.indexOf('\n')+1);
      //    } else {
      //      d = writeData;
      //      writeData = undefined;
      //    }
      //    writeSerialDirect(d);
      //    if (showStatus)
      //      NodeMCU.Core.Status.incrementProgress(d.length);
      //  }
      //  if (writeData==undefined) {
      //    clearInterval(writeTimeout);
      //    writeTimeout = undefined;
      //    if (showStatus)
      //      NodeMCU.Core.Status.setStatus("Sent");
      //  }
      //}
      //sender(); // send data instantly
      //if (writeData!=undefined) {
      //  writeTimeout = setInterval(sender, 200);
      //} else {
      //  if(showStatus) NodeMCU.Core.Status.setStatus("Sent");
      //}
    }
  };

  // ----------------------------------------------------------
  chrome.serial.onReceive.addListener(function(receiveInfo) {
    //var bytes = new Uint8Array(receiveInfo.data);
    if (readListener!==undefined) readListener(receiveInfo.data);
  });

  chrome.serial.onReceiveError.addListener(function(errorInfo) {
    console.log("RECEIVE ERROR:",JSON.stringify(errorInfo));
    connectionDisconnectCallback();
  });

  NodeMCU.Core.Serial = {
    "init" : init,
    "getPorts": getPorts,
    "open": openSerial,
    "isConnected": isConnected,
    "startListening": startListening,
    "write": writeSerial,
    "close": closeSerial,
	"isSlowWrite": function() { return slowWrite; },
	"setSlowWrite": function(isOn, force) {
        if ((!force) && NodeMCU.Config.SERIAL_THROTTLE_SEND) {
          console.log("ForceThrottle option is set - set Slow Write = true");
          isOn = true;
        } else
  	    console.log("Set Slow Write = "+isOn);
	  slowWrite = isOn;
	}
  };
})();
