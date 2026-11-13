import connection from "../db/dbConnection.js";

export function Chat(io, socket) {

    console.log("Chat socket initialized:", socket.id);

    socket.on("private", ({ from, to, text }) => {

        console.log("1. Private event received:", { from, to, text });

        const senderId = Number(from);
        const receiverId = Number(to);
        const messageText = String(text || "").trim();

        if (
            !Number.isSafeInteger(senderId) || senderId <= 0 ||
            !Number.isSafeInteger(receiverId) || receiverId <= 0 ||
            !messageText
        ) {
            console.log("Invalid message data");
            return;
        }

        const query = `
            INSERT INTO messages
            (sender_id, receiver_id, message_text)
            VALUES (?, ?, ?)
        `;

        console.log("2. Attempting database insertion...");

        connection.query(
            query,
            [senderId, receiverId, messageText],
            (err, result) => {

                if (err) {
                    console.error("DATABASE INSERT ERROR:", err);
                    return;
                }

                console.log("3. MESSAGE SAVED SUCCESSFULLY!");
                console.log("Inserted message ID:", result.insertId);

                const message = {
                    messageId: result.insertId,
                    from: senderId,
                    to: receiverId,
                    text: messageText
                };

                io.to(String(receiverId))
                    .to(String(senderId))
                    .emit("private", message);

                io.to(`notification${receiverId}`)
                    .emit("newNotification", message);
            }
        );
    });
}