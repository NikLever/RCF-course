import express from 'express';
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { Server } from 'socket.io';

const app = express();
const server = createServer(app);
const io = new Server(server);

app.use(express.static('../../../'));
app.use(express.static('./'));
const __dirname = dirname(fileURLToPath(import.meta.url));

app.get('/', (req, res) => {
  res.sendFile(join(__dirname, 'index.html'));
});

server.listen(3000, () => {
  console.log('server running at http://localhost:3000');
});

io.on('connection', (socket) => {
  socket.userData = { x:0, y:0, z:0, heading:0 };//Default values;
 
	console.log(`${socket.id} connected.`);

	socket.emit('setId', { id:socket.id });
	
  socket.on('disconnect', () => {
    console.log(`socket.deletePlayer ${socket.id}`);
		socket.broadcast.emit('deletePlayer', { id: socket.id });
  });	
	
	socket.on('init', (data) => {
		console.log(`socket.init color:${data.color}`);
		socket.userData.color = data.color;
		socket.userData.x = data.x;
		socket.userData.y = data.y;
		socket.userData.z = data.z;
		socket.userData.heading = data.h;
	});
	
	socket.on('update', (data) => {
		socket.userData.x = data.x;
		socket.userData.y = data.y;
		socket.userData.z = data.z;
		socket.userData.heading = data.h;
	});
});

setInterval(() => { 	
  const pack = [];
  //console.log(`setInterval: ${JSON.stringify(io.sockets.sockets)}`);
  for (const [_, socket] of io.of("/").sockets) {
    //Only push sockets that have been initialised
    if (socket.userData.color!==undefined){
      pack.push({
        id: socket.id,
        color: socket.userData.color,
        x: socket.userData.x,
        y: socket.userData.y,
        z: socket.userData.z,
        heading: socket.userData.heading
      });    
    }
  }
	if (pack.length>0) io.emit('remoteData', pack);
}, 40);