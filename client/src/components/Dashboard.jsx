import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import DonorBadge from "../components/DonorBadge";

import "../styles/dashboard.css";

function Dashboard({
    user,
    conversations,
    groups,
    onlineUsers,
    onOpenChat
}) {

    const navigate = useNavigate();

    const [donors, setDonors] = useState([]);

    const [myDonor, setMyDonor] = useState(null);

    useEffect(() => {

        loadDonors();

    }, [user?.username]);


    const loadDonors = async () => {

        try {

            const response =
                await api.get("/users/donors");

            setDonors(
                response.data.donors || []
            );

            const me =
                response.data.donors.find(
                    donor =>
                        donor.username ===
                        user.username
                );

            setMyDonor(me || {

                username:
                    user.username,

                totalDonated: 0,

                rank: null,

                badgeNumber: null,

                isTopDonor: false,

                donorBadgeActive: false

            });

        } catch (error) {

            console.error(
                "DONOR LOAD ERROR:",
                error
            );

        }

    };


    return (

        <div className="dashboard">

            {/* ================= DONORS ================= */}

            <div className="supporters-card">

                <div className="supporters-header">

                    <div>

                        <h2>
                            👑 Top Supporters
                        </h2>

                        <p>
                            The people supporting
                            ChatSphere
                        </p>

                    </div>

                    <button
                        onClick={() =>
                            navigate(
                                "/top-supporters"
                            )
                        }
                    >
                        View all →
                    </button>

                </div>


                {donors.length > 0 && (

                    <>

                        {/* TOP DONOR */}

                        <div
                            className="top-donor-feature"
                            onClick={() =>
                                onOpenChat
                                    ? onOpenChat(donors[0].username)
                                    : navigate(
                                        `/profile/${donors[0].username}`
                                    )
                            }
                        >

                            <div className="top-donor-crown">
                                👑
                            </div>

                            <img
                                src={
                                    donors[0].avatar ||
                                    `https://api.dicebear.com/9.x/initials/svg?seed=${donors[0].username}`
                                }
                                alt=""
                            />

                            <h2>
                                {donors[0].displayName ||
                                    donors[0].username}
                                <DonorBadge username={donors[0].username} />
                            </h2>

                            <div className="top-donor-rank">
                                #1
                            </div>

                            <strong>
                                ₹
                                {(
                                    donors[0].totalDonated /
                                    100
                                ).toFixed(2)}
                            </strong>

                            <span className="top-donor-cta">
                                Tap to chat →
                            </span>

                        </div>


                        {/* OTHER TOP DONORS */}

                        <div className="supporter-list">

                            {donors
                                .slice(1, 5)
                                .map(donor => (

                                    <div
                                        className="supporter-row"
                                        key={
                                            donor.username
                                        }
                                        onClick={() =>
                                            onOpenChat
                                                ? onOpenChat(donor.username)
                                                : navigate(
                                                    `/profile/${donor.username}`
                                                )
                                        }
                                    >

                                        <span className="supporter-rank">
                                            #{donor.rank}
                                        </span>

                                        <img
                                            src={
                                                donor.avatar ||
                                                `https://api.dicebear.com/9.x/initials/svg?seed=${donor.username}`
                                            }
                                            alt=""
                                        />

                                        <div className="supporter-info">

                                            <strong>
                                                {donor.displayName ||
                                                    donor.username}
                                                <DonorBadge username={donor.username} />
                                            </strong>

                                            {donor.badgeNumber && (
                                                <span>
                                                    🏅 #{donor.badgeNumber}
                                                </span>
                                            )}

                                        </div>

                                        <strong>
                                            ₹
                                            {(
                                                donor.totalDonated /
                                                100
                                            ).toFixed(2)}
                                        </strong>

                                    </div>

                                ))}

                        </div>

                    </>

                )}


                {/* MY POSITION */}

                {myDonor && (

                    <div className="my-donor-position">

                        <div>

                            <strong>
                                Your supporter status
                            </strong>

                            <span>

                                {myDonor.rank
                                    ? `#${myDonor.rank}`
                                    : "Not ranked"}

                            </span>

                        </div>

                        <div>

                            <strong>
                                Total donated
                            </strong>

                            <span>
                                ₹
                                {(
                                    myDonor.totalDonated /
                                    100
                                ).toFixed(2)}
                            </span>

                        </div>

                    </div>

                )}

            </div>


            <div className="dashboard-grid">

                <div className="card">

                    <h3>Total Chats</h3>

                    <h1>
                        {conversations.length}
                    </h1>

                </div>


                <div className="card">

                    <h3>Groups</h3>

                    <h1>
                        {groups.length}
                    </h1>

                </div>


                <div className="card">

                    <h3>Online Users</h3>

                    <h1>
                        {onlineUsers.length}
                    </h1>

                </div>

            </div>


            {/* RECENT CHATS */}

            <div className="recent-section">

                <h2>Recent Chats</h2>

                {conversations.length === 0 ? (

                    <p>
                        No conversations yet.
                    </p>

                ) : (

                    conversations
                        .slice(0, 5)
                        .map(chat => {

                            const other =
                                chat.sender ===
                                user.username
                                    ? chat.receiver
                                    : chat.sender;

                            return (

                                <div
                                    className="recent-chat"
                                    key={other}
                                    onClick={() =>
                                        onOpenChat && onOpenChat(other)
                                    }
                                >
                                    <img
                                        src={`https://api.dicebear.com/9.x/initials/svg?seed=${other}`}
                                        alt=""
                                    />

                                    <div>

                                        <b>
    {other}
    <DonorBadge username={other} />
</b>

                                        <p>
                                            {chat.message}
                                        </p>

                                    </div>

                                </div>

                            );

                        })

                )}

            </div>

        </div>

    );

}

export default Dashboard;