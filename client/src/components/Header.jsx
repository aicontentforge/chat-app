import { useState } from "react";

import {
    FaPhone,
    FaVideo,
    FaMoon,
    FaSun,
    FaEllipsisVertical,
    FaGear,
    FaChevronLeft
} from "react-icons/fa6";

import SettingsMenu from "./SettingsMenu";
import DonorBadge from "./DonorBadge";

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
    openInfoPanel,
    onBack
}) {

    const online =
        selectedUser &&
        onlineUsers.includes(selectedUser);

    const [showSettings, setShowSettings] = useState(false);

    const isGroupChat =
        !!selectedUser &&
        selectedUser.startsWith("group_");

    return (
        <header className="header">

            {/* BACK (mobile only, only inside an open chat) */}

            {selectedUser && onBack && (
                <button
                    type="button"
                    className="header-back-btn"
                    title="Back to chats"
                    aria-label="Back to chats"
                    onClick={onBack}
                >
                    <FaChevronLeft />
                </button>
            )}

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
                        <span className="header-name-text">
                            {selectedUser || "Dashboard"}
                        </span>
                        {selectedUser && !isGroupChat && (
                            <DonorBadge username={selectedUser} />
                        )}
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

    <div className="header-more-wrapper">
        <button
            type="button"
            className="header-icon-btn settings-btn"
            title="Settings"
            onClick={() => setShowSettings(prev => !prev)}
        >
            <FaGear />
        </button>

        {showSettings && (
            <SettingsMenu
                user={user}
                navigate={navigate}
                logout={logout}
                onClose={() => setShowSettings(false)}
            />
        )}
    </div>

</div>

        </header>
    );
}

export default Header;