import "../styles/moremenu.css";

function MoreMenu({
    open,
    onClose,
    onReport,
    onClearChat,
    onToggleTranslation,
    translationEnabled,
    position
}) {

    if (!open) return null;

    return (
        <>
            <div
                className="menu-overlay"
                onClick={onClose}
            />

            <div
                className="more-dropdown"
                style={{
                    top: position.top,
                    left: position.left
                }}
            >

                {/* AUTO TRANSLATION */}
                <button
                    type="button"
                    className="more-menu-item translation-menu-item"
                    onClick={onToggleTranslation}
                >
                    <span>
                        🌐 Auto Translation
                    </span>

                    <span
                        className={`translation-toggle ${
                            translationEnabled ? "enabled" : ""
                        }`}
                    >
                        <span className="translation-toggle-circle" />
                    </span>
                </button>

                {/* REPORT */}
                <button
                    type="button"
                    onClick={onReport}
                >
                    ⚠ Report User
                </button>

                {/* CLEAR CHAT */}
                <button
                    type="button"
                    onClick={onClearChat}
                >
                    🗑 Clear Chat
                </button>

            </div>
        </>
    );
}

export default MoreMenu;