import {io} from 'socket.io-client';
 export const socket = io("http://localhost:4000");
 socket.on("connect", () => console.log("connected:", socket.id));
socket.on("connect_error", (err) => console.log("connect error:", err.message));