import {
    FaPhone,
    FaVideo,
    FaMoon,
    FaSun,
    FaEllipsisVertical,
    FaUser,
    FaArrowRightFromBracket
} from "react-icons/fa6";

import "../styles/header.css";

function Header({
    user,
    selectedUser,
    onlineUsers = [],
    theme,
    toggleTheme,
    navigate,
    logout,
    startVoiceCall,
    startVideoCall,
    openMoreMenu,
    openInfoPanel
}) {

    const online =
        selectedUser &&
        onlineUsers.includes(selectedUser);

    return (
        <header className="header">

            {/* LEFT */}

            <div
                className="header-left"
                onClick={openInfoPanel}
            >

                <img
                    className="header-avatar"
                    src={
                        selectedUser
                            ? `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(selectedUser)}`
                            : user?.avatar
                    }
                    alt=""
                />

                <div className="header-user-info">

                    <h2>
                        {selectedUser || "Dashboard"}
                    </h2>

                    {selectedUser && (
                        <span
                            className={`status ${
                                online ? "online" : ""
                            }`}
                        >
                            <span className="status-dot" />

                            {online
                                ? "Online"
                                : "Offline"}
                        </span>
                    )}

                </div>

            </div>


            {/* RIGHT */}

            <div className="header-right">

    <button
        type="button"
        className="header-icon-btn phone-btn"
        title="Voice Call"
        onClick={() => startVoiceCall?.()}
    >
        <FaPhone />
    </button>

    <button
        type="button"
        className="header-icon-btn video-btn"
        title="Video Call"
        onClick={() => startVideoCall?.()}
    >
        <FaVideo />
    </button>

    {/* OLD THEME BUTTON */}
    <button
        type="button"
        className="header-icon-btn theme-btn"
        title={
            theme === "dark"
                ? "Switch to Light Mode"
                : "Switch to Dark Mode"
        }
        onClick={toggleTheme}
    >
        {theme === "dark" ? <FaSun /> : <FaMoon />}
    </button>

    <div className="header-more-wrapper">
        <button
            type="button"
            className="header-icon-btn more-btn"
            title="More"
            onClick={(e) => openMoreMenu?.(e)}
        >
            <FaEllipsisVertical />
        </button>
    </div>

    <button
        type="button"
        className="header-profile-btn"
        onClick={() => navigate("/profile")}
    >
        <FaUser />
        <span>Profile</span>
    </button>

    <button
        type="button"
        className="header-logout-btn"
        onClick={logout}
    >
        <FaArrowRightFromBracket />
        <span>Logout</span>
    </button>

</div>

        </header>
    );
}

export default Header;