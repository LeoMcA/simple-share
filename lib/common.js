var common = {};

var pc = {};
var dc = {};
var pcConfig = {
  iceServers: [{ url: 'stun:stun.services.mozilla.com' }]
}
var ws;
var fileBuffer;
var sid;

common.onSignallingConnect = function(){
  signallingSend({
    type: 'file-info',
    sid: sid,
    length: fileLength
  });
}

common.onSignallingMessage = function(dataString, callback){
  var data = JSON.parse(dataString);
  switch(data.type){
      case 'file-request':
        onFileRequest(data, callback);
        break;
      case 'ice-candidate':
        onIceCandidate(data);
        break;
      case 'webrtc-answer':
        onWebrtcAnswer(data);
        break;
  }
}

common.setSid = function(hash){
  sid = hash;
  return sid;
}

common.setFileBuffer = function(file, length){
  fileBuffer = file;
  fileLength = length;
  return file;
}

common.setSignalling = function(signalling){
  ws = signalling;
  return ws;
}

common.setWebrtc = function(wrtc){
  webrtc = wrtc;
}

var onError = common.onError = function(err){
  console.log(err);
  process.exit(1);
}

function onFileRequest(data, callback){
  var cid = data.cid;
  
  var p = pc[cid] = new webrtc.RTCPeerConnection(pcConfig);
  
  var d = dc[cid] = p.createDataChannel('file');
  d.binaryType = 'arraybuffer';
  
  d.onopen = function(){
    callback(d);
  }
  
  p.onicecandidate = function(evt){
    if(evt.candidate)
      signallingSend({
        type: 'ice-candidate',
        sid: sid,
        cid: cid,
        candidate: evt.candidate
      });
  }
  
  p.createOffer(function(offer){
    p.setLocalDescription(offer, function(){
      signallingSend({
        type: 'webrtc-offer',
        sid: sid,
        cid: cid,
        offer: p.localDescription
      });
    }, onError);
  }, onError);
}

function onIceCandidate(data){
  var cid = data.cid;
  var p = pc[cid];
  p.addIceCandidate(new webrtc.RTCIceCandidate(data.candidate), function(){}, onError);
}

function onWebrtcAnswer(data){
  var cid = data.cid;
  var p = pc[cid];
  p.setRemoteDescription(new webrtc.RTCSessionDescription(data.answer), function(){}, onError);
}

function signallingSend(json){
  ws.send(JSON.stringify(json));
}

module.exports = common;
