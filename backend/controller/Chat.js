 export function Chat(io, socket) {
  socket.on('private', ({ from, to, text }) => {
    const message = { from, to, text };
    io.to(String(to)).to(String(from)).emit('private', message);
    io.to(`notification${to}`).emit('newNotification', message); // new: recipient only
  });
}