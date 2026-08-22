import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config";
import "../styles/topSupporters.css";

function TopSupporters() {

    const navigate = useNavigate();

    const [rankings, setRankings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const user = (() => {
        try {
            return JSON.parse(localStorage.getItem("user"));
        } catch {
            return null;
        }
    })();


    useEffect(() => {

        loadLeaderboard();

    }, []);


    async function loadLeaderboard() {

        try {

            setLoading(true);
            setError("");

            const response = await axios.get(
                `${API_BASE_URL}/donations/leaderboard`
            );

            if (response.data.success) {

                setRankings(
                    response.data.rankings || []
                );

            }

        } catch (err) {

            console.error(
                "LEADERBOARD LOAD ERROR:",
                err
            );

            setError(
                "Unable to load supporters."
            );

        } finally {

            setLoading(false);

        }

    }


    function formatAmount(cents) {

        return `₹${(
            Number(cents || 0) / 100
        ).toFixed(2)}`;

    }


    function getBadge(supporter) {

        /*
         * Top 100
         */
        if (supporter.badgeNumber) {

            return (
                <span className="supporter-number-badge">
                    #{supporter.badgeNumber}
                </span>
            );

        }


        /*
         * Outside top 100 but temporary
         * donor badge is still active.
         */
        if (supporter.donorBadgeActive) {

            return (
                <span className="supporter-donor-badge">
                    💙 Donor
                </span>
            );

        }


        return null;

    }


    if (loading) {

        return (

            <div className="supporters-page">

                <button
                    className="back-button"
                    onClick={() => navigate("/chat")}
                >
                    ← Back
                </button>

                <div className="supporters-loading">
                    Loading supporters...
                </div>

            </div>

        );

    }


    if (error) {

        return (

            <div className="supporters-page">

                <button
                    className="back-button"
                    onClick={() => navigate("/chat")}
                >
                    ← Back
                </button>

                <div className="supporters-error">
                    {error}

                    <button
                        onClick={loadLeaderboard}
                    >
                        Try again
                    </button>

                </div>

            </div>

        );

    }


    const topDonor = rankings[0];

    /*
     * Everyone except #1.
     */
    const otherSupporters =
        rankings.slice(1);


    /*
     * Make sure logged-in user is visible
     * even if they are below the displayed list.
     */
    const currentUser =
        rankings.find(
            supporter =>
                supporter.username ===
                user?.username
        );


    const currentUserAlreadyVisible =
        otherSupporters.some(
            supporter =>
                supporter.username ===
                user?.username
        );


    return (

        <div className="supporters-page">

            <button
                className="back-button"
                onClick={() => navigate("/chat")}
            >
                ← Back to Dashboard
            </button>


            <div className="supporters-header">

                <h1>
                    👑 Top Supporters
                </h1>

                <p>
                    The people supporting ChatSphere
                </p>

            </div>


            {rankings.length === 0 ? (

                <div className="no-supporters">

                    <div className="empty-icon">
                        💙
                    </div>

                    <h2>
                        No supporters yet
                    </h2>

                    <p>
                        Be the first person to support
                        ChatSphere.
                    </p>

                </div>

            ) : (

                <>

                    {/* ========================= */}
                    {/* TOP DONOR */}
                    {/* ========================= */}

                    {topDonor && (

                        <div
                            className="top-donor-card"
                            onClick={() =>
                                navigate(
                                    `/profile/${topDonor.username}`
                                )
                            }
                        >

                            <div className="top-donor-crown">
                                👑
                            </div>

                            <div className="top-donor-rank">
                                #1 TOP DONOR
                            </div>

                            <img
                                src={
                                    topDonor.avatar ||
                                    `https://api.dicebear.com/9.x/initials/svg?seed=${topDonor.username}`
                                }
                                alt=""
                                className="top-donor-avatar"
                            />

                            <h2>
                                {topDonor.displayName ||
                                    topDonor.username}
                            </h2>

                            <p>
                                @{topDonor.username}
                            </p>

                            <div className="top-donor-badge">
                                👑 #1
                            </div>

                            <div className="top-donor-amount">
                                {formatAmount(
                                    topDonor.totalDonated
                                )}
                            </div>

                            <span>
                                Total supported
                            </span>

                        </div>

                    )}


                    {/* ========================= */}
                    {/* OTHER SUPPORTERS */}
                    {/* ========================= */}

                    <div className="supporters-list">

                        <h2>
                            Supporter Rankings
                        </h2>


                        {otherSupporters.map(
                            supporter => (

                                <div
                                    className="supporter-row"
                                    key={
                                        supporter.username
                                    }
                                    onClick={() =>
                                        navigate(
                                            `/profile/${supporter.username}`
                                        )
                                    }
                                >

                                    <div className="supporter-rank">
                                        #{supporter.rank}
                                    </div>


                                    <img
                                        src={
                                            supporter.avatar ||
                                            `https://api.dicebear.com/9.x/initials/svg?seed=${supporter.username}`
                                        }
                                        alt=""
                                        className="supporter-avatar"
                                    />


                                    <div className="supporter-info">

                                        <div className="supporter-name">

                                            <strong>
                                                {supporter.displayName ||
                                                    supporter.username}
                                            </strong>

                                            {getBadge(
                                                supporter
                                            )}

                                        </div>

                                        <small>
                                            @{supporter.username}
                                        </small>

                                    </div>


                                    <div className="supporter-total">

                                        {formatAmount(
                                            supporter.totalDonated
                                        )}

                                    </div>

                                </div>

                            )
                        )}


                        {/* ========================= */}
                        {/* CURRENT USER */}
                        {/* ========================= */}

                        {currentUser &&
                            !currentUserAlreadyVisible &&
                            currentUser.rank > 101 && (

                                <>

                                    <div className="your-position-divider">
                                        Your position
                                    </div>

                                    <div
                                        className="supporter-row your-supporter-row"
                                    >

                                        <div className="supporter-rank">
                                            #{currentUser.rank}
                                        </div>


                                        <img
                                            src={
                                                currentUser.avatar ||
                                                `https://api.dicebear.com/9.x/initials/svg?seed=${currentUser.username}`
                                            }
                                            alt=""
                                            className="supporter-avatar"
                                        />


                                        <div className="supporter-info">

                                            <div className="supporter-name">

                                                <strong>
                                                    {currentUser.displayName ||
                                                        currentUser.username}
                                                </strong>

                                                {getBadge(
                                                    currentUser
                                                )}

                                                <span className="you-label">
                                                    You
                                                </span>

                                            </div>

                                            <small>
                                                @{currentUser.username}
                                            </small>

                                        </div>


                                        <div className="supporter-total">

                                            {formatAmount(
                                                currentUser.totalDonated
                                            )}

                                        </div>

                                    </div>

                                </>

                            )}

                    </div>

                </>

            )}

        </div>

    );

}

export default TopSupporters;