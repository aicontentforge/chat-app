import "../styles/profilemodel.css";
import DonorBadge from "./DonorBadge";

function ProfileModal({
    open,
    onClose,
    profile
}) {

    if (!open) return null;
    if (!profile) return null;

    return (

        <div className="profile-overlay">

            <div className="profile-modal">

                <button
                    className="close-btn"
                    onClick={onClose}
                >
                    ✕

                </button>

                <img
                    className="profile-avatar"
                    src={`https://api.dicebear.com/9.x/initials/svg?seed=${profile.username}`}
                    alt=""
                />

                <h2 className="profile-name">

    {profile.displayName || profile.username}
    <DonorBadge username={profile.username} />

</h2>

                <p>{profile.bio}</p>

                <div className="profile-grid">

                    <div><strong>Username</strong><br />{profile.username}</div>

                    <div><strong>Age</strong><br />{profile.age || "-"}</div>

                    <div><strong>Gender</strong><br />{profile.gender || "-"}</div>

                    <div><strong>Country</strong><br />{profile.country || "-"}</div>

                    <div><strong>State</strong><br />{profile.state || "-"}</div>

                    <div><strong>City</strong><br />{profile.city || "-"}</div>

                    <div><strong>Joined</strong><br />{profile.joinedAt}</div>

                    <div><strong>Last Seen</strong><br />{profile.lastSeen}</div>

                </div>

            </div>

        </div>

    );

}

export default ProfileModal;