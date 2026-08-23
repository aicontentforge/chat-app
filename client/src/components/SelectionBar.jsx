import { useState } from "react";
import { FaReply, FaShare, FaThumbtack, FaTrash } from "react-icons/fa6";
import "../styles/selectionbar.css";

const QUICK_REACTIONS = ["❤️", "👍", "😂", "😮", "😢", "🔥"];

function SelectionBar({
    count,
    canDelete,
    onForward,
    onPin,
    onReply,
    onReact,
    onDelete,
    onCancel
}) {

    const [showEmoji, setShowEmoji] = useState(false);

    const react = (emoji) => {
        onReact(emoji);
        setShowEmoji(false);
    };

    return (

        <div className="selection-bar">

            <button
                type="button"
                className="selection-cancel"
                title="Cancel selection"
                onClick={onCancel}
            >
                ✕
            </button>

            <span className="selection-count">
                {count} selected
            </span>

            <div className="selection-actions">

                <div className="selection-react-wrapper">

                    <button
                        type="button"
                        title="React"
                        onClick={() => setShowEmoji((s) => !s)}
                    >
                        😊
                    </button>

                    {showEmoji && (

                        <div className="selection-emoji-picker">

                            {QUICK_REACTIONS.map((emoji) => (

                                <button
                                    type="button"
                                    key={emoji}
                                    onClick={() => react(emoji)}
                                >
                                    {emoji}
                                </button>

                            ))}

                        </div>

                    )}

                </div>

                <button
                    type="button"
                    title="Reply"
                    onClick={onReply}
                >
                    <FaReply />
                </button>

                <button
                    type="button"
                    title="Pin"
                    onClick={onPin}
                >
                    <FaThumbtack />
                </button>

                <button
                    type="button"
                    title="Forward"
                    onClick={onForward}
                >
                    <FaShare />
                </button>

                {canDelete && (

                    <button
                        type="button"
                        className="selection-delete"
                        title="Delete"
                        onClick={onDelete}
                    >
                        <FaTrash />
                    </button>

                )}

            </div>

        </div>

    );

}

export default SelectionBar;
