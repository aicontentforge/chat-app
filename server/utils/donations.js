const db = require("../database");

function getDonorRankings(callback) {

    db.all(
        `
        SELECT
            username,
            displayName,
            avatar,
            totalDonated,
            donorBadgeExpiresAt
        FROM users
        WHERE totalDonated > 0
        ORDER BY totalDonated DESC, username ASC
        `,
        [],
        (err, users) => {

            if (err) {
                return callback(err);
            }

            const now = new Date();

            const rankings = users.map((user, index) => {

                const rank = index + 1;

                const donorBadgeActive =
                    user.donorBadgeExpiresAt &&
                    new Date(user.donorBadgeExpiresAt) > now;

                /*
                 * Top 100 receive a numbered badge.
                 *
                 * The number is NOT permanent.
                 * It is simply their current leaderboard position.
                 */
                const badgeNumber =
                    rank <= 100
                        ? rank
                        : null;

                /*
                 * People outside the top 100 can still have
                 * the temporary numberless donor badge.
                 */
                const hasDonorBadge =
                    rank <= 100 ||
                    donorBadgeActive;

                return {

                    username:
                        user.username,

                    displayName:
                        user.displayName ||
                        user.username,

                    avatar:
                        user.avatar,

                    totalDonated:
                        user.totalDonated || 0,

                    rank,

                    badgeNumber,

                    isTopDonor:
                        rank === 1,

                    donorBadgeActive,

                    hasDonorBadge,

                    donorBadgeExpiresAt:
                        user.donorBadgeExpiresAt || null

                };

            });

            callback(null, rankings);

        }
    );

}

module.exports = {
    getDonorRankings
};