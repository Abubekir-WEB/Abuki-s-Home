
import { useState } from "react";
import Chat from "./Chat";
import Inbox from "./Inbox";

import "./Messaging.css";

function Messaging() {
  const [selectedUser, setSelectedUser] = useState(null);

  return (
    <main className="messaging-page">
    

      <div className="messaging-layout">
        <aside className="messaging-sidebar">
          <Chat onSelectUser={setSelectedUser} />
        </aside>

        <section className="messaging-conversation">
          {selectedUser ? (
            <Inbox
              key={selectedUser.userid}
              selectedUserId={selectedUser?.userid}
            />
          ) : (
            <div className="conversation-placeholder">
              <div className="placeholder-icon">✉</div>
              <h2>Your messages</h2>
              <p>
                Select someone from the people list
                to start a conversation.
              </p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

export default Messaging;
