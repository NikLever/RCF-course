import express from 'express';
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { inspect } from 'node:util';
import { Server } from 'socket.io';

const app = express();
const server = createServer(app);
const io = new Server(server);

const __dirname = dirname(fileURLToPath(import.meta.url));

app.get('/', (req, res) => {
  res.sendFile(join(__dirname, 'index.html'));
});

io.on('connection', (socket) => {
  console.log('a user connected ');

  io.emit('rooms', getRooms('connected'));
  
  socket.on('disconnect', ( socket ) => {
    console.log(`${socket.username} disconnected`);
  });

  socket.on('new room', (room) => {
	  console.log(`A new room is created ${room}`);
	  socket.room = room;
	  socket.join(room);
  	io.emit('rooms', getRooms('new room'));
  });

  socket.on('join room', (room) => {
	  console.log(`A new user joined room ${room}`);
	  socket.room = room;
	  socket.join(room);
  	  io.emit('rooms', getRooms('joined room'));
  });

  socket.on('chat message', (data) => {
    io.in(data.room).emit('chat message', `${data.name}: ${data.msg}` );
  });

  socket.on('set username', (name) => { 
	  console.log(`username set to ${name}(${socket.id})`);
	  socket.username = name; 
  });
});

server.listen(3000, () => {
  console.log('server running at http://localhost:3000');
});

function getRooms(msg){
  const nsp = io.of('/');
  const rooms = nsp.adapter.rooms;
  /*Returns data in this form
  {
    'roomid1': { 'socketid1', socketid2', ...},
    ...
  }
  */
  //console.log('getRooms rooms>>' + util.inspect(rooms));

  const list = {};
	
  for(let roomId in rooms){
	  const room = rooms[roomId];
	  if (room===undefined) continue;
	  const sockets = [];
	  let roomName = "";
	  console.log(`getRooms room>>${inspect(room)}`);
	  for(let socketId in room.sockets){
		  const socket = nsp.connected[socketId];
		  if (socket===undefined || socket.username===undefined || socket.room===undefined) continue;
		  console.log(`getRooms socket(${socketId})>>${socket.username}:${socket.room}`);
		  sockets.push(socket.username);
		  if (roomName=="") roomName = socket.room;
	  }
	  if (roomName!="") list[roomName] = sockets;
  }
	
  console.log(`getRooms: ${msg} >>${inspect(list)}`);
	
  return list;
}