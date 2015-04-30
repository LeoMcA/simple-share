var webrtc = {};

webrtc.RTCPeerConnection = window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection;
webrtc.RTCIceCandidate = window.RTCIceCandidate || window.mozRTCIceCandidate || window.webkitRTCIceCandidate;
webrtc.RTCSessionDescription = window.RTCSessionDescription || window.mozRTCSessionDescription || window.webkitRTCSessionDescription;

document.getElementById('input').addEventListener('change', function(){
  var file = this.files[0];
  reader = new FileReader();
  reader.onload = function(){
    fileBuffer = common.setFileBuffer(this.result, this.result.byteLength);
    createHexHash('SHA-1', fileBuffer, function(hash){
      var sid = common.setSid(hash);
      
      var server = getParameterByName('s');
      var client = getParameterByName('c');
      
      if(server){
        if(client)
          console.log(client + '?s=' + server + '&i=' + sid);
        else
          console.log('http://' + server + '/client.html?s=' + server + '&i=' + sid);
        var ws = common.setSignalling(new WebSocket('ws://' + server));
      } else {
        console.log('http://simple-share.mca.me.uk/client.html?s=simple-share.mca.me.uk&i=' + sid);
        var ws = common.setSignalling(new WebSocket('ws://simple-share.mca.me.uk'));
      }
      
      ws.onopen = function(){
        common.onSignallingConnect();
      }
      ws.onmessage = function(data){
        common.onSignallingMessage(data.data, onDataChannel);
      }
      
    });
  }
  reader.readAsArrayBuffer(file);
}, false);

function onDataChannel(dc){
  console.log('dc open');
  for(var i = 0; i <= fileBuffer.byteLength; i += 66528){
    dc.send(fileBuffer.slice(i, i + 66528));
  }
}

function createHexHash(algo, arrayBuffer, callback){
  crypto.subtle.digest(algo, arrayBuffer).then(function(hash){
    var hex = "";
    var array = new Uint8Array(hash);
    array.forEach(function(byte){
      var pad = "";
      if(byte < 16) pad = "0"
      hex += pad + byte.toString(16);
    });
    callback(hex);
  });
}

function getParameterByName(name) {
    var match = RegExp('[?&]' + name + '=([^&]*)').exec(window.location.search);
    return match && decodeURIComponent(match[1].replace(/\+/g, ' '));
}
