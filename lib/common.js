var common = {};

var pc = {};
var dc = {};
var pcConfig = {
  iceServers: [{ url: 'stun:stun.services.mozilla.com' }]
}
var client = false;

common.onSignallingConnect = function(){
  if(client){
    signallingSend({
      type: 'file-request',
      sid: sid,
      cid: cid
    });
  } else {
    signallingSend({
      type: 'file-info',
      sid: sid,
      length: fileLength
    });
  }
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
      case 'file-info':
        onFileInfo(data, callback);
        break;
      case 'webrtc-offer':
        onWebrtcOffer(data);
        break;
  }
}

common.setSid = function(hash){
  sid = hash;
  return sid;
}

common.setCid = function(hash){
  cid = hash;
  return cid;
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

common.setClient = function(bool){
  client = bool;
}

var onError = common.onError = function(err){
  console.log(err);
  process.exit(1);
}

function onFileInfo(data, callback){
  common.fileLength = data.length;
  
  pc = new webrtc.RTCPeerConnection(pcConfig);
  
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
    callback(dc);
  }
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
  if(client){
    pc.addIceCandidate(new webrtc.RTCIceCandidate(data.candidate), function(){}, onError);
  } else {
    var cid = data.cid;
    var p = pc[cid];
    p.addIceCandidate(new webrtc.RTCIceCandidate(data.candidate), function(){}, onError);
  }
}

function onWebrtcOffer(data){
  pc.setRemoteDescription(new webrtc.RTCSessionDescription(data.offer), function(){
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

function onWebrtcAnswer(data){
  var cid = data.cid;
  var p = pc[cid];
  p.setRemoteDescription(new webrtc.RTCSessionDescription(data.answer), function(){}, onError);
}

function signallingSend(json){
  ws.send(JSON.stringify(json));
}

module.exports = common;
