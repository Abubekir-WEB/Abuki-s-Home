export function notification(io, socket) {
  socket.on('joinNotification', (myid) => {
    socket.join(`notification${myid}`);
    console.log('joined notification room:', myid);
  });
}

