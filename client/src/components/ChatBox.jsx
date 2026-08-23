import { useEffect, useRef } from "react";
import ChatMessage from "./ChatMessage";
import "../styles/chatbox.css";

function ChatBox({
    messages,
    currentUser,
    onReply,
    onStar,
    onForward,
    selectMode = false,
    selectedMsgIds = [],
    onEnterSelect,
    onToggleSelect
}) {

    const bottomRef = useRef(null);

    useEffect(() => {

        bottomRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "end"
        });

    }, [messages]);

    return (
        <div className="chatbox-wrapper">

            <div className="chatbox-background"></div>

            <div className="chat-messages">

                {messages.length === 0 ? (

                    <div className="empty-chat">

                        <div className="empty-icon">
                            💬
                        </div>

                        <h2>
                            No Messages Yet
                        </h2>

                        <p>
                            Send your first message to start chatting.
                        </p>

                    </div>

                ) : (

                    messages.map((msg, index) => {

                        const previous = messages[index - 1];

                        const showDate =
                            index === 0 ||
                            msg.date !== previous?.date;

                        return (

                            <div
                                key={msg.id || `${msg.sender}-${msg.time}-${index}`}
                                className="chat-message-row"
                            >

                                {showDate && (

                                    <div className="chat-date">
                                        {msg.date || "Today"}
                                    </div>

                                )}

                                <ChatMessage
                                    message={msg}
                                    currentUser={currentUser}
                                    onStar={onStar}
                                    onReply={onReply}
                                    onForward={onForward}
                                    selectMode={selectMode}
                                    isSelected={selectedMsgIds.includes(msg.id)}
                                    onEnterSelect={onEnterSelect}
                                    onToggleSelect={onToggleSelect}
                                    messages={messages}
                                />

                            </div>

                        );

                    })

                )}

                <div
                    ref={bottomRef}
                    className="chat-bottom-anchor"
                />

            </div>

        </div>
    );
}

export default ChatBox;