import { useEffect, useState } from "react";
import axios from "axios";
import { API_ORIGIN } from "../config";
import "../styles/donorBadge.css";

const API = API_ORIGIN;

function DonorBadge({ username }) {

    const [donor, setDonor] = useState(null);

    useEffect(() => {

        if (!username) return;

        let cancelled = false;

        axios
            .get(
                `${API}/api/users/donor-status/${encodeURIComponent(username)}`
            )
            .then(response => {

                if (!cancelled && response.data?.success) {

                    setDonor(response.data.user);

                }

            })
            .catch(error => {

                console.error(
                    "DONOR BADGE LOAD ERROR:",
                    username,
                    error
                );

            });

        return () => {
            cancelled = true;
        };

    }, [username]);


    if (!donor) {
        return null;
    }


    /*
     * #1 gets the special crown.
     */
    if (donor.rank === 1) {

        return (
            <span
                className="donor-badge donor-crown"
                title="Top Supporter — #1"
            >
                👑
            </span>
        );

    }


    /*
     * Current top 100 get numbered badges.
     */
    if (
        donor.rank &&
        donor.rank >= 2 &&
        donor.rank <= 100
    ) {

        return (
            <span
                className="donor-badge donor-number"
                title={`Top Supporter #${donor.rank}`}
            >
                {donor.rank}
            </span>
        );

    }


    /*
     * Donors outside the top 100 get the
     * temporary numberless donor badge.
     */
    if (
        donor.rank > 100 &&
        donor.donorBadgeActive
    ) {

        return (
            <span
                className="donor-badge donor-supporter"
                title="Supporter"
            >
                💙
            </span>
        );

    }


    return null;
}

export default DonorBadge;