import "../styles/infopanel.css";
import BadgeCollection from "./BadgeCollection";

function InfoPanel({
    user,
    selectedUser,
    onlineUsers,
    onClose,
    openProfile,
    openSharedMedia,
    openStarredMessages,
    openFiles,
    openVoiceMessages,
    openConversationSearch,
    openLinks,
    
    toggleMute,
    changeWallpaper,
    exportChat,
    blockUser,
    reportUser,
    clearChat
}) {

    const online = onlineUsers.includes(selectedUser);

    /*
     * Groups don't have a personal donor badge, so the
     * collection only makes sense for a real 1-to-1 contact.
     */
    const isGroupChat =
        !!selectedUser && selectedUser.startsWith("group_");

    return (

    <div className="info-panel">

        <div className="info-header">

            <h3>Contact Info</h3>

            <button
                className="close-info"
                onClick={onClose}
            >
                ✕
            </button>

        </div>

        {selectedUser ? (

            <>

                <img
                    className="info-avatar"
                    src={`https://api.dicebear.com/9.x/initials/svg?seed=${selectedUser}`}
                    alt={selectedUser}
                />

                <h2>{selectedUser}</h2>

                <span className={online ? "info-status online" : "info-status"}>
                    {online ? "Online" : "Offline"}
                </span>

                {!isGroupChat && (
                    <BadgeCollection username={selectedUser} />
                )}

                <div
    className="info-card"
    onClick={openProfile}
>
    <h4>👤 About</h4>
    <p>View profile, bio and account information.</p>
</div>

<div
    className="info-card"
    onClick={openSharedMedia}
>
    <h4>📷 Media</h4>
    <p>Images, videos and documents shared in this chat.</p>
</div>

<div
    className="info-card"
    onClick={openStarredMessages}
>
    <h4>⭐ Starred Messages</h4>
    <p>Quick access to important messages.</p>
</div>

<div
    className="info-card"
    onClick={openFiles}
>
    <h4>📄 Files</h4>
    <p>View all documents, PDFs and attachments.</p>
</div>

<div
    className="info-card"
    onClick={openVoiceMessages}
>
    <h4>🎵 Voice Messages</h4>
    <p>Browse all shared voice notes.</p>
</div>

<div
    className="info-card"
    onClick={openLinks}
>
    <h4>📅 Shared Links</h4>
    <p>All URLs exchanged in this conversation.</p>
</div>

<div
    className="info-card"
    onClick={openConversationSearch}
>

    <h4>🔍 Search Conversation</h4>

    <p>Find messages instantly.</p>

</div>

<div
    className="info-card"
    onClick={toggleMute}
>
    <h4>🔕 Notifications</h4>
    <p>Mute or customize notifications.</p>
</div>

<div
    className="info-card"
    onClick={changeWallpaper}
>
    <h4>🖼 Change Wallpaper</h4>
    <p>Personalize this chat background.</p>
</div>

<div
    className="info-card"
    onClick={exportChat}
>
    <h4>📤 Export Chat</h4>
    <p>Download this conversation.</p>
</div>

<div
    className="info-card danger"
    onClick={blockUser}
>
    <h4>🚫 Block User</h4>
    <p>Prevent this user from contacting you.</p>
</div>

<div
    className="info-card danger"
    onClick={reportUser}
>
    <h4>⚠ Report User</h4>
    <p>Report abusive or suspicious activity.</p>
</div>

<div
    className="info-card danger"
    onClick={clearChat}
>
    <h4>🗑 Clear Conversation</h4>
    <p>Delete all messages in this chat.</p>
</div>

            </>

        ) : (

            <div className="empty-panel">

                <h2>Details</h2>

                <p>Select a conversation</p>

            </div>

        )}

    </div>

);

}

export default InfoPanel;