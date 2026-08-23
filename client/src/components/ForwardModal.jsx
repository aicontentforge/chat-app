import { useMemo, useState } from "react";
import "../styles/forwardmodal.css";

/*
 * Lets the user pick one or more targets (people they already
 * chat with, groups, or a brand new username) to forward one
 * or more messages to.
 *
 * `messages` is always an array - a single forward passes a
 * one-item array, bulk "Select" forwarding passes several.
 */
function ForwardModal({
    open,
    messages = [],
    conversations = [],
    groups = [],
    currentUser,
    onClose,
    onForward
}) {

    const [search, setSearch] = useState("");
    const [selected, setSelected] = useState([]);
    const [addingNew, setAddingNew] = useState(false);
    const [newUsername, setNewUsername] = useState("");
    const [error, setError] = useState("");

    const people = useMemo(() => {

        const seen = new Set();
        const list = [];

        conversations.forEach((chat) => {

            const other =
                chat.sender === currentUser
                    ? chat.receiver
                    : chat.sender;

            if (!other || seen.has(other)) return;

            seen.add(other);

            list.push({
                key: other,
                type: "user",
                name: other
            });

        });

        return list;

    }, [conversations, currentUser]);

    const groupTargets = useMemo(() => {

        return groups.map((group) => ({
            key: `group_${group.id}`,
            type: "group",
            name: group.name
        }));

    }, [groups]);

    if (!open) return null;

    const allTargets = [...groupTargets, ...people];

    const filtered = allTargets.filter((target) =>
        target.name
            .toLowerCase()
            .includes(search.toLowerCase())
    );

    const toggleTarget = (key) => {

        setSelected((prev) =>
            prev.includes(key)
                ? prev.filter((item) => item !== key)
                : [...prev, key]
        );

    };

    const addNewPerson = () => {

        const username = newUsername.trim();

        if (!username) return;

        if (username === currentUser) {
            setError("That's you!");
            return;
        }

        if (!selected.includes(username)) {
            setSelected((prev) => [...prev, username]);
        }

        setNewUsername("");
        setAddingNew(false);
        setError("");

    };

    const handleForwardClick = () => {

        if (selected.length === 0) return;

        onForward(selected);

        setSelected([]);
        setSearch("");

    };

    const preview =
        messages[0]?.message ||
        (messages[0]?.image && "📷 Photo") ||
        (messages[0]?.audio && "🎤 Voice message") ||
        (messages[0]?.file && "📎 File") ||
        "";

    return (

        <div className="modal-overlay">

            <div className="forward-modal">

                <div className="modal-header">

                    <h2>
                        Forward {messages.length > 1
                            ? `${messages.length} messages`
                            : "message"}
                    </h2>

                    <button onClick={onClose}>
                        ✕
                    </button>

                </div>

                {messages.length === 1 && preview && (

                    <div className="forward-preview">
                        {preview}
                    </div>

                )}

                <input
                    placeholder="Search people or groups..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />

                <div className="forward-list">

                    {/* NEW PERSON */}

                    {!addingNew ? (

                        <div
                            className="forward-new-person"
                            onClick={() => setAddingNew(true)}
                        >

                            <div className="forward-new-icon">
                                +
                            </div>

                            <span>New Person</span>

                        </div>

                    ) : (

                        <div className="forward-new-input-row">

                            <input
                                autoFocus
                                placeholder="Enter their username..."
                                value={newUsername}
                                onChange={(e) => {
                                    setNewUsername(e.target.value);
                                    setError("");
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") addNewPerson();
                                    if (e.key === "Escape") {
                                        setAddingNew(false);
                                        setNewUsername("");
                                    }
                                }}
                            />

                            <button onClick={addNewPerson}>
                                Add
                            </button>

                        </div>

                    )}

                    {error && (
                        <div className="forward-error">
                            {error}
                        </div>
                    )}

                    {/* MANUALLY ADDED (NOT IN CONVERSATIONS) */}

                    {selected
                        .filter((key) =>
                            !allTargets.some((t) => t.key === key)
                        )
                        .map((key) => (

                            <div
                                key={key}
                                className="forward-person selected"
                                onClick={() => toggleTarget(key)}
                            >

                                <img
                                    src={`https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(key)}`}
                                    alt=""
                                />

                                <span className="forward-person-name">
                                    {key}
                                </span>

                                <span className="forward-check">
                                    ✓
                                </span>

                            </div>

                        ))}

                    {/* EXISTING CONVERSATIONS / GROUPS */}

                    {filtered.map((target) => (

                        <div
                            key={target.key}
                            className={`forward-person ${
                                selected.includes(target.key)
                                    ? "selected"
                                    : ""
                            }`}
                            onClick={() => toggleTarget(target.key)}
                        >

                            <img
                                src={`https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(target.name)}`}
                                alt=""
                            />

                            <span className="forward-person-name">
                                {target.name}
                                {target.type === "group" && " (group)"}
                            </span>

                            <span className="forward-check">
                                ✓
                            </span>

                        </div>

                    ))}

                </div>

                <div className="forward-footer">

                    <button
                        className="forward-send-btn"
                        disabled={selected.length === 0}
                        onClick={handleForwardClick}
                    >
                        ➤ Forward{" "}
                        {selected.length > 0 && `(${selected.length})`}
                    </button>

                </div>

            </div>

        </div>

    );

}

export default ForwardModal;
