import { useState, useRef } from "react";
import EmojiPicker from "emoji-picker-react";
import { FiSend } from "react-icons/fi";
import "../styles/chatinput.css";

function ChatInput({
    value,
    onChange,
    onSend,
    onTyping,
    onStopTyping,
    attachment,
    audio
}) {

    const [showEmoji, setShowEmoji] = useState(false);

    const textareaRef = useRef(null);
    const timer = useRef(null);

    const text = value || "";

    const send = () => {

        if (!text.trim()) return;

        onSend(text);

        onChange("");

        onStopTyping();

        if (textareaRef.current) {
            textareaRef.current.style.height = "50px";
        }
    };

    const handleChange = (e) => {

        const newText = e.target.value;

        onChange(newText);

        onTyping();

        clearTimeout(timer.current);

        timer.current = setTimeout(() => {

            onStopTyping();

        }, 1000);

        e.target.style.height = "50px";

        e.target.style.height =
            e.target.scrollHeight + "px";
    };

    const handleEmoji = (emojiData) => {

        const newText =
            text + emojiData.emoji;

        onChange(newText);
    };

    return (

        <div className="chat-input-wrapper">

            <button
                type="button"
                className="emoji-btn"
                onClick={() =>
                    setShowEmoji(prev => !prev)
                }
            >
                😊
            </button>

            {attachment}

            {showEmoji && (

                <div className="emoji-picker">

                    <EmojiPicker
                        onEmojiClick={handleEmoji}
                    />

                </div>

            )}

            <textarea
                ref={textareaRef}
                value={text}
                placeholder="Type your message..."
                onChange={handleChange}
                className="chat-textarea"
                rows={1}
                onKeyDown={(e) => {

                    if (
                        e.key === "Enter" &&
                        !e.shiftKey
                    ) {

                        e.preventDefault();

                        send();

                    }

                }}
            />

            {audio}

            <button
                type="button"
                className="send-btn"
                onClick={send}
                aria-label="Send message"
                title="Send"
            >
                <FiSend />
            </button>

        </div>
    );
}

export default ChatInput;