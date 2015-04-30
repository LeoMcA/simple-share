var WebSocketServer = require('ws').Server;

var wss = new WebSocketServer({ port: 8080 });

var server = {};
var fileInfo = {};
var client = [];

wss.on('connection', function(ws){
  ws.on('message', function(dataString){
    console.log(dataString);
    data = JSON.parse(dataString);
    try {
      switch(data.type){
        case 'file-info':
          server[data.sid] = ws;
          fileInfo[data.sid] = data;
          break;
        case 'cid-request':
          var cid = client.length;
          client.push(ws);
          ws.send(JSON.stringify({
            type: 'cid',
            cid: cid
          }));
          break;
        case 'file-request':
          ws.send(JSON.stringify(fileInfo[data.sid]));
          server[data.sid].send(dataString);
          break;
        case 'ice-candidate':
          if(ws == server[data.sid]) client[data.cid].send(dataString);
          else server[data.sid].send(dataString);
          break;
        case 'webrtc-offer':
          client[data.cid].send(dataString);
          break;
        case 'webrtc-answer':
          server[data.sid].send(dataString);
          break;
      }
    } catch(e){
      console.log(e)
    }
  });
});