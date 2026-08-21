import { useEffect, useMemo, useState } from "react";
import {
    FaXmark,
    FaMagnifyingGlass,
    FaCheck,
    FaUserPlus
} from "react-icons/fa6";

import "../styles/addPeopleSheet.css";

function AddPeopleSheet({
    open,
    users = [],
    currentUser,
    currentContact,
    onlineUsers = [],
    existingParticipants = [],
    onClose,
    onAdd
}) {
    const [search, setSearch] = useState("");
    const [selectedUsers, setSelectedUsers] = useState([]);

    /*
     * Reset selection whenever the sheet opens.
     */
    useEffect(() => {
        if (open) {
            setSearch("");
            setSelectedUsers([]);
        }
    }, [open]);

    /*
     * Users who can be added.
     */
    const availableUsers = useMemo(() => {
        const existing = new Set([
            currentUser,
            currentContact,
            ...existingParticipants
        ].filter(Boolean));

        return users
            .filter((user) => {
                const username =
                    typeof user === "string"
                        ? user
                        : user.username;

                return username && !existing.has(username);
            })
            .filter((user) => {
                const username =
                    typeof user === "string"
                        ? user
                        : user.username;

                return username
                    .toLowerCase()
                    .includes(search.toLowerCase().trim());
            });
    }, [
        users,
        currentUser,
        currentContact,
        existingParticipants,
        search
    ]);

    const getUsername = (user) => {
        return typeof user === "string"
            ? user
            : user.username;
    };

    const toggleUser = (username) => {
        setSelectedUsers((prev) => {
            if (prev.includes(username)) {
                return prev.filter(
                    (name) => name !== username
                );
            }

            return [...prev, username];
        });
    };

    const handleAdd = () => {
        if (selectedUsers.length === 0) {
            return;
        }

        onAdd?.(selectedUsers);

        setSelectedUsers([]);
        setSearch("");
    };

    if (!open) {
        return null;
    }

    return (
        <div
            className="add-people-overlay"
            onClick={onClose}
        >
            <div
                className="add-people-sheet"
                onClick={(e) => e.stopPropagation()}
            >
                {/* HEADER */}

                <div className="add-people-header">

                    <div className="add-people-title-wrapper">

                        <div className="add-people-icon">
                            <FaUserPlus />
                        </div>

                        <div>
                            <h2>Add people</h2>

                            <p>
                                Add people to this call
                            </p>
                        </div>

                    </div>

                    <button
                        type="button"
                        className="add-people-close"
                        onClick={onClose}
                        title="Close"
                    >
                        <FaXmark />
                    </button>

                </div>


                {/* SEARCH */}

                <div className="add-people-search">

                    <FaMagnifyingGlass />

                    <input
                        type="text"
                        placeholder="Search people..."
                        value={search}
                        onChange={(e) =>
                            setSearch(e.target.value)
                        }
                        autoFocus
                    />

                </div>


                {/* SELECTED COUNT */}

                {selectedUsers.length > 0 && (

                    <div className="add-people-selected-count">

                        <span>
                            {selectedUsers.length}
                            {" "}
                            {selectedUsers.length === 1
                                ? "person"
                                : "people"}
                            {" "}selected
                        </span>

                        <button
                            type="button"
                            onClick={() =>
                                setSelectedUsers([])
                            }
                        >
                            Clear
                        </button>

                    </div>

                )}


                {/* USERS */}

                <div className="add-people-list">

                    {availableUsers.length === 0 ? (

                        <div className="add-people-empty">

                            <div className="empty-icon">
                                <FaUserPlus />
                            </div>

                            <h3>
                                No people found
                            </h3>

                            <p>
                                Try a different search.
                            </p>

                        </div>

                    ) : (

                        availableUsers.map((user) => {

                            const username =
                                getUsername(user);

                            const isSelected =
                                selectedUsers.includes(
                                    username
                                );

                            const isOnline =
                                onlineUsers.includes(
                                    username
                                );

                            return (

                                <button
                                    type="button"
                                    key={username}
                                    className={
                                        `add-person-row ${
                                            isSelected
                                                ? "selected"
                                                : ""
                                        }`
                                    }
                                    onClick={() =>
                                        toggleUser(
                                            username
                                        )
                                    }
                                >

                                    {/* AVATAR */}

                                    <div className="add-person-avatar-wrapper">

                                        <img
                                            src={`https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(
                                                username
                                            )}`}
                                            alt={username}
                                            className="add-person-avatar"
                                        />

                                        {isOnline && (
                                            <span className="add-person-online" />
                                        )}

                                    </div>


                                    {/* INFO */}

                                    <div className="add-person-info">

                                        <strong>
                                            {username}
                                        </strong>

                                        <span>
                                            {isOnline
                                                ? "Online"
                                                : "Offline"}
                                        </span>

                                    </div>


                                    {/* CHECK */}

                                    <div
                                        className={
                                            `add-person-check ${
                                                isSelected
                                                    ? "checked"
                                                    : ""
                                            }`
                                        }
                                    >
                                        {isSelected && (
                                            <FaCheck />
                                        )}
                                    </div>

                                </button>

                            );
                        })

                    )}

                </div>


                {/* FOOTER */}

                <div className="add-people-footer">

                    <button
                        type="button"
                        className="add-people-cancel"
                        onClick={onClose}
                    >
                        Cancel
                    </button>

                    <button
                        type="button"
                        className="add-people-confirm"
                        disabled={
                            selectedUsers.length === 0
                        }
                        onClick={handleAdd}
                    >
                        <FaUserPlus />

                        Add
                        {" "}
                        {selectedUsers.length > 0
                            ? `(${selectedUsers.length})`
                            : ""}
                    </button>

                </div>

            </div>
        </div>
    );
}

export default AddPeopleSheet;