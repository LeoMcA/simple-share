var webrtc = {};

webrtc.RTCPeerConnection = window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection;
webrtc.RTCIceCandidate = window.RTCIceCandidate || window.mozRTCIceCandidate || window.webkitRTCIceCandidate;
webrtc.RTCSessionDescription = window.RTCSessionDescription || window.mozRTCSessionDescription || window.webkitRTCSessionDescription;

common.setClient(true);

var sid = getSid();
var cid = common.setCid(createCid());

var blobLength = 0;
var blobArray = [];

var ws = common.setSignalling(new WebSocket('ws://' + getParameterByName('s')));

ws.onopen = function(){
  common.onSignallingConnect();
}

ws.onmessage = function(data){
  common.onSignallingMessage(data.data, onDataChannel);
}

function onDataChannel(dc){
  dc.onmessage = function(data){
    blobLength += data.data.byteLength;
    blobArray.push(data.data);
    if(blobLength >= common.fileLength) {
      window.location = URL.createObjectURL(new Blob(blobArray));
    }
  }
}

function createCid(){
  return Date.now()+""+Math.floor(Math.random()*1000);
}

function getSid(){
  return getParameterByName('i');
}

function getParameterByName(name) {
    var match = RegExp('[?&]' + name + '=([^&]*)').exec(window.location.search);
    return match && decodeURIComponent(match[1].replace(/\+/g, ' '));
}