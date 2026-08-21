import { useNavigate } from "react-router-dom";
import DonorBadge from "./DonorBadge";

function UserCard({ user }) {

    const navigate = useNavigate();

    const categories = Array.isArray(user.categories)
        ? user.categories
        : JSON.parse(user.categories || "[]");

    return (

        <div className="user-card">

            <img
                src={
                    user.avatar ||
                    `https://api.dicebear.com/9.x/initials/svg?seed=${user.username}`
                }
                alt=""
            />

            <h3>
    {user.displayName || user.username}
    <DonorBadge username={user.username} />
</h3>
            <p>@{user.username}</p>

            <small><b>ID:</b> {user.uniqueId}</small>

            <br/><br/>

            {user.city && (
                <p>📍 {user.city}, {user.country}</p>
            )}

            <div className="chips">

                {categories.map(category => (

                    <span key={category}>
                        {category}
                    </span>

                ))}

            </div>

            <div
                style={{
                    display: "flex",
                    gap: "10px",
                    marginTop: "15px"
                }}
            >

                <button
                    style={{ flex: 1 }}
                    onClick={() => navigate(`/profile/${user.username}`)}
                >
                    👤 Profile
                </button>

                <button
                    style={{ flex: 1 }}
                    onClick={() => {

                        localStorage.setItem(

                            "selectedUser",

                            user.username

                        );

                        navigate("/chat");

                    }}
                >
                    💬 Message
                </button>

            </div>

        </div>

    );

}

export default UserCard;