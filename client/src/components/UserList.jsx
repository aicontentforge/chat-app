import "../styles/sidebar.css";
import DonorBadge from "./DonorBadge";

function getInitials(name = "") {
    return name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((word) => word[0])
        .join("")
        .toUpperCase() || "?";
}

function GroupPeopleBadge() {
    return (
        <span className="group-people-badge" aria-hidden="true">
            <svg
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
            >
                <circle cx="9" cy="8" r="3" fill="currentColor" />
                <path
                    d="M3.5 19c.4-3.4 2.3-5 5.5-5s5.1 1.6 5.5 5"
                    fill="currentColor"
                />
                <path
                    d="M16 6.5a2.5 2.5 0 0 1 0 5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                />
                <path
                    d="M17 14c2.2.4 3.5 1.9 3.7 4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                />
            </svg>
        </span>
    );
}

function GroupAvatar({ name }) {
    return (
        <div className="chat-avatar-wrapper group-chat-avatar-wrapper">
            <div className="chat-avatar group-chat-avatar">
                {getInitials(name)}
            </div>

            <GroupPeopleBadge />
        </div>
    );
}

function UserList({
    conversations = [],
    groups = [],
    currentUser,
    selectedUser,
    setSelectedUser,
    pinChat,
    onlineUsers = []
}) {
    const handleSelectUser = (username) => {
        setSelectedUser(username);
    };

    const handleSelectGroup = (groupId) => {
        setSelectedUser(`group_${groupId}`);
    };

    return (
        <div className="sidebar-container">

            <div className="chat-list">

                {/* =================================================
                    GROUPS
                ================================================= */}

                <section className="sidebar-section">

                    <div className="sidebar-section-header">
                        <h4>Groups</h4>
                    </div>

                    {groups.length === 0 ? (

                        <div className="groups-empty">
                            No groups yet — start one above
                        </div>

                    ) : (

                        <div className="users-list">

                            {groups.map((group) => {

                                const groupKey = `group_${group.id}`;

                                const isActive =
                                    selectedUser === groupKey;

                                /*
                                 * Your group members should look like:
                                 *
                                 * members: [
                                 *   { username: "Alex", isOnline: true },
                                 *   { username: "John", isOnline: false }
                                 * ]
                                 */

                                const members = Array.isArray(group.members)
                                    ? group.members
                                    : [];

                                const memberCount = members.length;

                                const onlineMemberCount =
                                    members.filter(
                                        (member) => member?.isOnline === true
                                    ).length;

                                /*
                                 * Support common names for the last message
                                 * so you don't have to restructure your backend
                                 * immediately.
                                 */

                                const lastMessage =
                                    group.message ||
                                    group.lastMessage ||
                                    group.last_message ||
                                    "No messages";

                                const groupTime =
                                    group.time ||
                                    group.lastMessageTime ||
                                    group.last_message_time ||
                                    "";

                                return (

                                    <div
                                        key={group.id}
                                        className={`
                                            chat-card
                                            group-chat-card
                                            ${isActive ? "active" : ""}
                                        `}
                                        onClick={() =>
                                            handleSelectGroup(group.id)
                                        }
                                        onDoubleClick={() => {
                                            window.location.href =
                                                `/group/${group.id}`;
                                        }}
                                    >

                                        {/* GROUP AVATAR */}

                                        <GroupAvatar
                                            name={group.name}
                                        />


                                        {/* GROUP INFORMATION */}

                                        <div className="chat-info">

                                            <div className="chat-name">
                                                {group.name}
                                            </div>

                                            <div className="chat-message">

                                                <span>
                                                    {lastMessage}
                                                </span>

                                                <span className="group-online-count">
                                                    • {onlineMemberCount} of{" "}
                                                    {memberCount} online
                                                </span>

                                            </div>

                                        </div>


                                        {/* RIGHT SIDE */}

                                        <div className="chat-right">

                                            <small className="chat-time">
                                                {groupTime}
                                            </small>

                                        </div>

                                    </div>

                                );

                            })}

                        </div>

                    )}

                </section>


                {/* =================================================
                    CHATS
                ================================================= */}

                <section className="sidebar-section chats-section">

                    <div className="sidebar-section-header">
                        <h4>Chats</h4>
                    </div>

                    <div className="users-list">

                        {[...conversations]
                            .sort(
                                (a, b) =>
                                    (b.pinned || 0) -
                                    (a.pinned || 0)
                            )
                            .map((chat) => {

                                const otherUser =
                                    chat.sender === currentUser
                                        ? chat.receiver
                                        : chat.sender;

                                const isActive =
                                    selectedUser === otherUser;

                                const isOnline =
                                    onlineUsers.includes(otherUser);

                                return (

                                    <div
                                        key={otherUser}
                                        className={`
                                            chat-card
                                            ${isActive ? "active" : ""}
                                            ${chat.pinned ? "pinned" : ""}
                                        `}
                                        onClick={() =>
                                            handleSelectUser(otherUser)
                                        }
                                        onDoubleClick={() => {
                                            window.location.href =
                                                `/profile/${otherUser}`;
                                        }}
                                    >

                                        {/* USER AVATAR */}

                                        <div className="chat-avatar-wrapper">

                                            <img
                                                className="chat-avatar"
                                                src={`https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(
                                                    otherUser
                                                )}`}
                                                alt={otherUser}
                                            />

                                            {isOnline && (
                                                <span className="chat-online-dot" />
                                            )}

                                        </div>


                                        {/* CHAT INFORMATION */}

                                        <div className="chat-info">

                                            <div className="chat-name">
                                                {otherUser}
                                                <DonorBadge username={otherUser} />
                                            </div>

                                            <div className="chat-message">
                                                {chat.message || "No messages"}
                                            </div>

                                        </div>


                                        {/* RIGHT SIDE */}

                                        <div className="chat-right">

                                            <small className="chat-time">
                                                {chat.time}
                                            </small>

                                            {chat.unread > 0 && (
                                                <div className="unread">
                                                    {chat.unread}
                                                </div>
                                            )}

                                            <button
                                                type="button"
                                                className={`
                                                    pin-chat-btn
                                                    ${chat.pinned ? "is-pinned" : ""}
                                                `}
                                                title={
                                                    chat.pinned
                                                        ? "Unpin chat"
                                                        : "Pin chat"
                                                }
                                                onClick={(e) => {

                                                    e.stopPropagation();

                                                    pinChat(otherUser);

                                                }}
                                            >
                                                {chat.pinned ? "📍" : "📌"}
                                            </button>

                                        </div>

                                    </div>

                                );

                            })}

                    </div>

                </section>

            </div>

        </div>
    );
}

export default UserList;