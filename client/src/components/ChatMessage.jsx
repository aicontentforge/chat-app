import { useState } from "react";

import {
    FaPen,
    FaReply,
    FaShare,
    FaStar,
    FaThumbtack,
    FaTrash,
    FaCheck,
    FaCheckDouble
} from "react-icons/fa6";

import socket from "../services/socket";
import { API_ORIGIN } from "../config";
import DonorBadge from "./DonorBadge";
import VoiceMessagePlayer from "./VoiceMessagePlayer";

import "../styles/chatmessage.css";

function ChatMessage({
    message,
    currentUser,
    onReply,
    onStar,
    onForward,
    selectMode = false,
    isSelected = false,
    onEnterSelect,
    onToggleSelect
}) {

    const mine = message.sender === currentUser;

    const avatar =
        `https://api.dicebear.com/9.x/initials/svg?seed=${message.sender}`;

    const [showReactions, setShowReactions] = useState(false);

    const [editing, setEditing] = useState(false);

    const [editedText, setEditedText] = useState(
        message.message || ""
    );


    /* =========================
       REACTION
    ========================= */

    const react = (emoji) => {

        socket.emit("react_message", {
            id: message.id,
            reaction: emoji
        });

        setShowReactions(false);
    };


    /* =========================
       EDIT
    ========================= */

    const saveEdit = () => {

        const text = editedText.trim();

        if (!text) return;

        socket.emit("edit_message", {
            id: message.id,
            message: text
        });

        setEditing(false);
    };


    /* =========================
       REPLY
    ========================= */

    const handleReply = () => {

        if (onReply) {
            onReply(message);
        }
    };


    /* =========================
       FORWARD
    ========================= */

    const handleForward = () => {

        if (onForward) {
            onForward(message);
        }
    };


    /* =========================
       SELECT
    ========================= */

    const handleSelectClick = () => {

        if (selectMode) {
            onToggleSelect?.(message.id);
        } else {
            onEnterSelect?.(message.id);
        }

    };


    /* =========================
       STAR
    ========================= */

    const handleStar = () => {

        if (onStar) {
            onStar(message.id);
        }

    };


    /* =========================
       PIN
    ========================= */

    const handlePin = () => {

        socket.emit("pin_message", {

            id: message.id,

            pinned: !message.pinned

        });

    };


    /* =========================
       DELETE
    ========================= */

    const handleDelete = () => {

        socket.emit(
            "delete_message",
            message.id
        );

    };


    return (

        <div
            className={`message-row ${
                mine ? "me" : "other"
            } ${selectMode ? "selectable" : ""} ${
                isSelected ? "selected" : ""
            }`}
            onClick={() => {
                if (selectMode) {
                    onToggleSelect?.(message.id);
                }
            }}
        >

            {/* =========================
                SELECT CHECKBOX
            ========================= */}

            {selectMode && (

                <span
                    className={`select-checkbox ${
                        isSelected ? "checked" : ""
                    }`}
                >
                    {isSelected && <FaCheck />}
                </span>

            )}

            {/* =========================
                AVATAR - OTHER
            ========================= */}

            {!mine && (

                <img
                    className="chat-avatar"
                    src={avatar}
                    alt={message.sender}
                />

            )}


            {/* =========================
                MESSAGE WRAPPER
            ========================= */}

            <div className="message-wrapper">


                {/* SENDER */}

                {!mine && (

                    <div className="sender-name">
                        {message.sender}
                        <DonorBadge username={message.sender} />
                    </div>

                )}


                {/* =========================
                    MESSAGE CONTENT AREA
                ========================= */}

                <div className="message-content-area">


                    {/* =========================
                        MESSAGE BUBBLE
                    ========================= */}

                    <div
                        className={`message-bubble ${
                            mine ? "mine" : ""
                        }`}

                        onDoubleClick={() =>
                            !selectMode &&
                            setShowReactions(
                                prev => !prev
                            )
                        }

                        onContextMenu={(e) => {

                            e.preventDefault();

                            if (selectMode) {
                                onToggleSelect?.(message.id);
                                return;
                            }

                            handleReply();

                        }}
                    >


                        {/* =========================
                            REPLY
                        ========================= */}

                        {message.replyMessage && (

                            <div className="reply-card">

                                {message.replyMessage}

                            </div>

                        )}


                        {/* =========================
                            EDIT MODE
                        ========================= */}

                        {editing ? (

                            <div className="edit-container">

                                <input
                                    className="edit-input"

                                    value={editedText}

                                    onChange={(e) =>
                                        setEditedText(
                                            e.target.value
                                        )
                                    }

                                    autoFocus

                                    onKeyDown={(e) => {

                                        if (
                                            e.key === "Enter"
                                        ) {
                                            saveEdit();
                                        }

                                        if (
                                            e.key === "Escape"
                                        ) {
                                            setEditing(false);
                                        }

                                    }}
                                />

                                <div className="edit-buttons">

                                    <button
                                        className="edit-save-btn"
                                        onClick={saveEdit}
                                    >
                                        Save
                                    </button>

                                    <button
                                        className="edit-cancel-btn"
                                        onClick={() =>
                                            setEditing(false)
                                        }
                                    >
                                        Cancel
                                    </button>

                                </div>

                            </div>

                        ) : (

                            <>

                                {/* TEXT */}

                                {message.message && (

                                    <p className="message-text">

                                        {message.message}

                                    </p>

                                )}


                                {/* IMAGE */}

                                {message.image && (

                                    <img
                                        className="message-image"

                                        src={`${API_ORIGIN}${message.image}`}

                                        alt=""
                                    />

                                )}


                                {/* AUDIO */}

                                {message.audio && (

                                    <VoiceMessagePlayer
                                        src={`${API_ORIGIN}${message.audio}`}
                                        mine={mine}
                                    />

                                )}


                                {/* FILE */}

                                {message.file && (

                                    <a
                                        className="file-card"

                                        href={`${API_ORIGIN}${message.file}`}

                                        target="_blank"

                                        rel="noreferrer"
                                    >

                                        <span className="file-icon">
                                            📄
                                        </span>

                                        <span className="file-name">

                                            {message.fileName ||
                                                "Download file"}

                                        </span>

                                    </a>

                                )}

                            </>

                        )}


                        {/* =========================
                            REACTION
                        ========================= */}

                        {message.reaction && (

                            <div className="reaction">

                                {message.reaction}

                            </div>

                        )}


                        {/* =========================
                            FOOTER
                        ========================= */}

                        <div className="message-footer">

                            <span className="message-time">

                                {message.edited === 1 && (

                                    <span className="edited-label">
                                        Edited ·
                                    </span>

                                )}

                                {message.time}

                            </span>


                            {mine && (

                                <span className="ticks">

                                    {message.seen ? (

                                        <FaCheckDouble />

                                    ) : (

                                        <FaCheck />

                                    )}

                                </span>

                            )}

                        </div>

                    </div>


                    {/* =========================
                        ACTION TOOLBAR
                    ========================= */}

                    {!selectMode && (

                    <div className="message-actions">


                        {/* EDIT */}

                        {mine && (

                            <button
                                type="button"

                                title="Edit"

                                onClick={() =>
                                    setEditing(true)
                                }
                            >

                                <FaPen />

                            </button>

                        )}


                        {/* REPLY */}

                        <button
                            type="button"

                            title="Reply"

                            onClick={handleReply}
                        >

                            <FaReply />

                        </button>


                        {/* FORWARD */}

                        <button
                            type="button"

                            title="Forward"

                            onClick={handleForward}
                        >

                            <FaShare />

                        </button>


                        {/* STAR */}

                        <button
                            type="button"

                            title="Star"

                            className={
                                message.starred
                                    ? "active-action"
                                    : ""
                            }

                            onClick={handleStar}
                        >

                            <FaStar />

                        </button>


                        {/* PIN */}

                        <button
                            type="button"

                            title={
                                message.pinned
                                    ? "Unpin"
                                    : "Pin"
                            }

                            className={
                                message.pinned
                                    ? "active-action"
                                    : ""
                            }

                            onClick={handlePin}
                        >

                            <FaThumbtack />

                        </button>


                        {/* SELECT */}

                        <button
                            type="button"

                            title="Select"

                            onClick={handleSelectClick}
                        >

                            <FaCheck />

                        </button>


                        {/* DELETE */}

                        {mine && (

                            <button
                                type="button"

                                title="Delete"

                                className="delete-action"

                                onClick={handleDelete}
                            >

                                <FaTrash />

                            </button>

                        )}

                    </div>

                    )}


                    {/* =========================
                        REACTION PICKER
                    ========================= */}

                    {showReactions && (

                        <div className="reaction-picker">

                            {[
                                "❤️",
                                "👍",
                                "😂",
                                "😮",
                                "😢",
                                "🔥"
                            ].map((emoji) => (

                                <button
                                    type="button"

                                    key={emoji}

                                    onClick={() =>
                                        react(emoji)
                                    }
                                >

                                    {emoji}

                                </button>

                            ))}

                        </div>

                    )}

                </div>

            </div>


            {/* =========================
                AVATAR - MINE
            ========================= */}

            {mine && (

                <img
                    className="chat-avatar"

                    src={avatar}

                    alt={message.sender}
                />

            )}

        </div>

    );

}

export default ChatMessage;