import express from 'express';
import cors from 'cors'
import userRoute from './Routes/userRoute.js'
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer } from "http";
import { Server } from "socket.io";
import { Chat } from './controller/chat.js';
import { notification } from './controller/notification.js';
const app=express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: "http://localhost:5173" },
});

// Recreate __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config();


app.use(cors())
app.use(express.json())
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
//userRoute
app.use('/user',userRoute)
  io.on('connection',(socket)=>{
   
    socket.on('join',(myid)=>{
        socket.join(String(myid));
        console.log('joined room:', myid, '| all rooms:', [...io.sockets.adapter.rooms.keys()]);
    })
    Chat(io,socket);
    notification(io,socket)
     })
httpServer.listen(4000,()=>{
    console.log("Running on port 4000")
})