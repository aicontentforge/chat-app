import { useEffect, useState } from "react";
import { FaUser, FaArrowRightFromBracket } from "react-icons/fa6";
import axios from "axios";
import { API_ORIGIN } from "../config";
import "../styles/settingsmenu.css";

/*
 * Dropdown shown from the header's Settings button.
 * Holds the things that used to be their own buttons
 * (Profile, Logout) plus the donor-badge visibility
 * toggle.
 */
function SettingsMenu({
    user,
    navigate,
    logout,
    onClose
}) {

    const [donor, setDonor] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {

        if (!user?.username) {
            setLoading(false);
            return;
        }

        let cancelled = false;

        axios
            .get(
                `${API_ORIGIN}/api/users/donor-status/${encodeURIComponent(user.username)}`
            )
            .then(response => {

                if (!cancelled && response.data?.success) {
                    setDonor(response.data.user);
                }

            })
            .catch(error => {
                console.error("SETTINGS DONOR LOOKUP ERROR:", error);
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };

    }, [user?.username]);


    /*
     * "Is a donor" = has ever donated / has a rank at all.
     * Everyone else sees the toggle shaded out.
     */
    const isDonor = !!(
        donor &&
        (donor.rank || Number(donor.totalDonated) > 0)
    );

    const badgeOn = donor
        ? donor.donorBadgeActive !== false
        : false;

    const toggleBadge = async () => {

        if (!isDonor || saving) return;

        const next = !badgeOn;

        setDonor(prev =>
            prev ? { ...prev, donorBadgeActive: next } : prev
        );

        setSaving(true);

        try {

            await axios.post(
                `${API_ORIGIN}/api/users/donor-badge-toggle`,
                {
                    username: user.username,
                    active: next
                }
            );

        } catch (error) {

            console.error("BADGE TOGGLE ERROR:", error);

        } finally {

            setSaving(false);

        }

    };

    return (
        <>
            <div
                className="menu-overlay"
                onClick={onClose}
            />

            <div className="settings-dropdown">

                {/* PROFILE */}

                <button
                    type="button"
                    className="settings-menu-item"
                    onClick={() => {
                        onClose();
                        navigate("/profile");
                    }}
                >
                    <FaUser />
                    <span>Profile</span>
                </button>


                {/* BADGE TOGGLE */}

                <div
                    className={`settings-menu-item badge-toggle-row ${
                        !isDonor ? "disabled" : ""
                    }`}
                >
                    <span>🏅 Show Donor Badge</span>

                    <span
                        className={`badge-toggle-switch ${
                            badgeOn ? "on" : ""
                        }`}
                        onClick={toggleBadge}
                    >
                        <span className="badge-toggle-knob" />
                    </span>
                </div>

                {!loading && !isDonor && (
                    <div className="badge-toggle-hint">
                        Donate to unlock a supporter badge.
                    </div>
                )}


                {/* LOGOUT */}

                <button
                    type="button"
                    className="settings-menu-item logout-item"
                    onClick={() => {
                        onClose();
                        logout();
                    }}
                >
                    <FaArrowRightFromBracket />
                    <span>Logout</span>
                </button>

            </div>
        </>
    );
}

export default SettingsMenu;
