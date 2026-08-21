import "../styles/starredmessages.css";

function StarredMessages({
    open,
    messages,
    onClose
}) {

    if (!open) return null;

    return (

        <div className="gallery-overlay">

            <div className="gallery-modal">

                <div className="gallery-header">

                    <h2>⭐ Starred Messages</h2>

                    <button onClick={onClose}>✕</button>

                </div>

                {messages.length === 0 ? (

                    <p>No starred messages.</p>

                ) : (

                    messages.map(msg => (

                        <div
                            key={msg.id}
                            className="starred-item"
                        >

                            <strong>{msg.sender}</strong>

                            <p>{msg.message}</p>

                            <small>{msg.time}</small>

                        </div>

                    ))

                )}

            </div>

        </div>

    );

}

export default StarredMessages;