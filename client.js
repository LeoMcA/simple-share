var PeerConnection = window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection;
var IceCandidate = window.RTCIceCandidate || window.mozRTCIceCandidate || window.webkitRTCIceCandidate;
var SessionDescription = window.RTCSessionDescription || window.mozRTCSessionDescription || window.webkitRTCSessionDescription;

var sid = getSid();
var cid = createCid();

var pc;
var pcConfig = {
  iceServers: [{ url: 'stun:stun.services.mozilla.com' }]
}
var dc;

var fileLength;
var blobLength = 0;
var blobArray = [];

var ws = new WebSocket('ws://' + getParameterByName('s'));

ws.onopen = function(){
  signallingSend({
    type: 'file-request',
    sid: sid,
    cid: cid
  });
}

ws.onmessage = function(dataString){
  data = JSON.parse(dataString.data);
  switch(data.type){
    case 'file-info':
      onFileInfo(data);
      break;
    case 'ice-candidate':
      onIceCandidate(data);
      break;
    case 'webrtc-offer':
      onWebrtcOffer(data);
      break;
  }
}

function onFileInfo(data){
  fileLength = data.length;
  
  pc = new PeerConnection(pcConfig);
  
  pc.onicecandidate = function(evt){
    if(evt.candidate)
      signallingSend({
        type: 'ice-candidate',
        sid: sid,
        cid: cid,
        candidate: evt.candidate
      });
  }

  pc.ondatachannel = function(evt){
    dc = evt.channel;
    dc.binaryType = 'arraybuffer';
    dc.onmessage = function(data){
      blobLength += data.data.byteLength;
      blobArray.push(data.data);
      if(blobLength >= fileLength) {
        window.location = URL.createObjectURL(new Blob(blobArray));
      }
    }
  }
}

function onIceCandidate(data){
  pc.addIceCandidate(new IceCandidate(data.candidate), function(){}, onError);
}

function onWebrtcOffer(data){
  pc.setRemoteDescription(new SessionDescription(data.offer), function(){
    pc.createAnswer(function(answer){
      pc.setLocalDescription(answer, function(){
        signallingSend({
          type: 'webrtc-answer',
          sid: sid,
          cid: cid,
          answer: pc.localDescription
        });
      }, onError);
    }, onError);
  }, onError);
}

function onError(err){
  console.log(err);
}

function signallingSend(json){
  ws.send(JSON.stringify(json));
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