import { useState } from "react";
import "../styles/settings.css";

function Settings() {

    const [darkMode, setDarkMode] = useState(false);

    const [notification, setNotification] = useState(true);

    const [enterToSend, setEnterToSend] = useState(true);

    return (

        <div className="settings-page">

            <div className="settings-card">

                <h1>Settings</h1>

                <p>Customize your chat experience.</p>

                <div className="setting-row">

                    <span>🌙 Dark Mode</span>

                    <input
                        type="checkbox"
                        checked={darkMode}
                        onChange={() =>
                            setDarkMode(!darkMode)
                        }
                    />

                </div>

                <div className="setting-row">

                    <span>🔔 Notifications</span>

                    <input
                        type="checkbox"
                        checked={notification}
                        onChange={() =>
                            setNotification(!notification)
                        }
                    />

                </div>

                <div className="setting-row">

                    <span>⌨️ Enter to Send</span>

                    <input
                        type="checkbox"
                        checked={enterToSend}
                        onChange={() =>
                            setEnterToSend(!enterToSend)
                        }
                    />

                </div>

            </div>

        </div>

    );

}

export default Settings;