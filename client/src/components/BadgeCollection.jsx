import { useEffect, useState } from "react";

import api from "../services/api";

import "../styles/badgeCollection.css";

const MONTH_NAMES = [
    "January", "February", "March",
    "April", "May", "June",
    "July", "August", "September",
    "October", "November", "December"
];


/*
 * Your server doesn't have GET /users/badge-history/:username
 * yet, so this stays OFF for now - the box just shows the
 * normal "No badges yet" state everywhere, with no network
 * requests and nothing failing in the console.
 *
 * Once that endpoint exists on your backend, flip this to
 * `true` and real history will start showing up automatically -
 * nothing else here needs to change.
 */
const BADGE_HISTORY_ENABLED = false;


/*
 * Turns one month's saved snapshot into a badge to display,
 * using the exact same tiers as the live DonorBadge component:
 *   - rank 1              -> crown
 *   - rank 2-100          -> numbered badge
 *   - rank > 100 + active -> plain supporter badge
 *   - anything else       -> no badge that month
 *
 * Returning null means "they had no badge that month", and the
 * caller skips it entirely - a month with nothing never shows
 * up as an empty row.
 */

function resolveBadge(entry) {

    if (!entry) return null;

    if (entry.donorBadgeActive === false) {
        return null;
    }

    const rank = entry.rank;

    if (rank === 1) {

        return {
            type: "crown",
            icon: "👑",
            label: "Top Supporter — #1"
        };

    }

    if (rank && rank >= 2 && rank <= 100) {

        return {
            type: "number",
            icon: String(rank),
            label: `Top Supporter #${rank}`
        };

    }

    if (rank && rank > 100 && entry.donorBadgeActive) {

        return {
            type: "supporter",
            icon: "💙",
            label: "Supporter"
        };

    }

    return null;

}


function BadgeCollection({
    username,
    title = "Badge Collection",
    subtitle = "Badges earned at the end of each month"
}) {

    const [status, setStatus] = useState("loading");

    const [entries, setEntries] = useState([]);


    useEffect(() => {

        if (!username) {

            setEntries([]);

            setStatus("ready");

            return;

        }

        if (!BADGE_HISTORY_ENABLED) {

            setEntries([]);

            setStatus("ready");

            return;

        }

        let cancelled = false;

        setStatus("loading");

        api.get(
            `/users/badge-history/${encodeURIComponent(username)}`
        )
            .then(response => {

                if (cancelled) return;

                const history = Array.isArray(
                    response.data?.history
                )
                    ? response.data.history
                    : [];

                const resolved = history
                    .map(entry => {

                        const badge = resolveBadge(entry);

                        if (!badge) return null;

                        return {
                            month: entry.month,
                            year: entry.year,
                            badge
                        };

                    })
                    .filter(Boolean)
                    .sort((a, b) => {

                        if (a.year !== b.year) {
                            return b.year - a.year;
                        }

                        return b.month - a.month;

                    });

                setEntries(resolved);

                setStatus("ready");

            })
            .catch(() => {

                if (cancelled) return;

                /*
                 * No history yet for this user (or the
                 * backend doesn't have this endpoint set
                 * up yet) - either way, this is just an
                 * empty collection, not an error worth
                 * alarming anyone about.
                 */

                setEntries([]);

                setStatus("ready");

            });

        return () => {
            cancelled = true;
        };

    }, [username]);


    return (

        <div className="badge-collection">

            <div className="badge-collection-header">

                <h4>
                    🏅 {title}
                </h4>

                <p>
                    {subtitle}
                </p>

            </div>


            <div className="badge-collection-box">

                {status === "loading" ? (

                    <div className="badge-collection-loading">
                        Loading badges...
                    </div>

                ) : entries.length === 0 ? (

                    <div className="badge-collection-empty">

                        <div className="badge-collection-empty-icon">
                            🏅
                        </div>

                        <p>
                            No badges yet
                        </p>

                        <span>
                            Badges earned at the end of
                            each month will show up here.
                        </span>

                    </div>

                ) : (

                    <div className="badge-collection-list">

                        {entries.map(entry => (

                            <div
                                className="badge-collection-row"
                                key={`${entry.year}-${entry.month}`}
                            >

                                <div
                                    className={
                                        `badge-collection-icon ${entry.badge.type}`
                                    }
                                >
                                    {entry.badge.icon}
                                </div>

                                <div className="badge-collection-info">

                                    <strong>
                                        {(MONTH_NAMES[(entry.month || 1) - 1]) ||
                                            "—"}{" "}
                                        {entry.year}
                                    </strong>

                                    <span>
                                        {entry.badge.label}
                                    </span>

                                </div>

                            </div>

                        ))}

                    </div>

                )}

            </div>

        </div>

    );

}

export default BadgeCollection;
