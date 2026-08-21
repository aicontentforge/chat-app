import { useState } from "react";
import socket from "../services/socket";
import "../styles/sharepostsheet.css";

function SharePostSheet({
    open,
    post,
    conversations,
    currentUser,
    onClose
}) {
    const [selected, setSelected] = useState([]);
    const [sharing, setSharing] = useState(false);

    if (!open || !post) {
        return null;
    }

    const contacts = [];

    conversations.forEach(chat => {

        const username =
            chat.sender === currentUser
                ? chat.receiver
                : chat.sender;

        if (
            username &&
            username !== currentUser &&
            !contacts.includes(username)
        ) {
            contacts.push(username);
        }

    });

    const toggleContact = (username) => {

        setSelected(prev => {

            if (prev.includes(username)) {
                return prev.filter(
                    user => user !== username
                );
            }

            return [
                ...prev,
                username
            ];

        });

    };

    const copyLink = async () => {

        const link =
            `${window.location.origin}/global/post/${post.id}`;

        try {

            await navigator.clipboard.writeText(link);

            alert("Post link copied.");

        } catch (err) {

            console.error(
                "COPY LINK ERROR:",
                err
            );

        }

    };

    const sharePost = async () => {

        if (selected.length === 0) {
            return;
        }

        setSharing(true);

        try {

            for (const username of selected) {

                socket.emit(
                    "send_message",
                    {
                        sender: currentUser,

                        receiver: username,

                        message:
                            post.text || "",

                        image:
                            post.imageUrl || "",

                        audio: "",

                        file: "",

                        fileName: "",

                        replyTo: null
                    }
                );

            }

            alert(
                `Post shared with ${selected.length} contact${
                    selected.length > 1
                        ? "s"
                        : ""
                }.`
            );

            setSelected([]);

            onClose();

        } catch (err) {

            console.error(
                "SHARE POST ERROR:",
                err
            );

        } finally {

            setSharing(false);

        }

    };

    return (
        <div
            className="share-sheet-overlay"
            onClick={onClose}
        >

            <div
                className="share-post-sheet"
                onClick={e =>
                    e.stopPropagation()
                }
            >

                <div className="share-sheet-handle" />

                <h3>
                    Share post
                </h3>

                {/* COPY LINK */}

                <button
                    className="share-copy-link"
                    onClick={copyLink}
                >

                    <span>
                        🔗
                    </span>

                    <span>
                        Copy link
                    </span>

                </button>

                <div className="share-divider" />

                {/* CONTACTS */}

                <div className="share-contacts">

                    {contacts.length === 0 ? (

                        <div className="share-no-contacts">
                            No personal chats available.
                        </div>

                    ) : (

                        contacts.map(username => {

                            const checked =
                                selected.includes(
                                    username
                                );

                            return (
                                <label
                                    key={username}
                                    className="share-contact"
                                >

                                    <div className="share-contact-info">

                                        <div className="share-contact-avatar">
                                            {username
                                                .charAt(0)
                                                .toUpperCase()}
                                        </div>

                                        <span>
                                            {username}
                                        </span>

                                    </div>

                                    <input
                                        type="checkbox"
                                        checked={checked}
                                        onChange={() =>
                                            toggleContact(
                                                username
                                            )
                                        }
                                    />

                                </label>
                            );

                        })

                    )}

                </div>

                {/* SHARE */}

                <button
                    className="share-submit-button"
                    disabled={
                        selected.length === 0 ||
                        sharing
                    }
                    onClick={sharePost}
                >

                    {sharing
                        ? "Sharing..."
                        : `Share (${selected.length})`}

                </button>

            </div>

        </div>
    );
}

export default SharePostSheet;