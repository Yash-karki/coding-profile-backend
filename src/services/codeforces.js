const axios = require('axios');

const CODEFORCES_API = 'https://codeforces.com/api';

/**
 * Fetch Codeforces profile data using official API
 * @param {string} handle - Codeforces handle
 * @returns {Object} Parsed profile data
 */
const fetchCodeforcesData = async (handle) => {
    try {
        // Fetch user info, rating history, and submissions in parallel
        const [infoRes, ratingRes, statusRes] = await Promise.all([
            axios.get(`${CODEFORCES_API}/user.info`, {
                params: { handles: handle },
                timeout: 10000
            }),
            axios.get(`${CODEFORCES_API}/user.rating`, {
                params: { handle },
                timeout: 10000
            }),
            axios.get(`${CODEFORCES_API}/user.status`, {
                params: { handle, from: 1, count: 10000 },
                timeout: 15000
            })
        ]);

        const userInfo = infoRes.data?.result?.[0];
        const ratingHistory = ratingRes.data?.result || [];
        const submissions = statusRes.data?.result || [];

        if (!userInfo) {
            throw new Error(`Codeforces user "${handle}" not found`);
        }

        // Count unique solved problems
        const solvedSet = new Set();
        const submissionsByDate = {};

        submissions.forEach(sub => {
            // Track solved problems
            if (sub.verdict === 'OK') {
                const problemKey = `${sub.problem.contestId}-${sub.problem.index}`;
                solvedSet.add(problemKey);
            }

            // Track submissions by date for heatmap
            const date = new Date(sub.creationTimeSeconds * 1000)
                .toISOString()
                .split('T')[0];
            submissionsByDate[date] = (submissionsByDate[date] || 0) + 1;
        });

        // Format rating history
        const formattedRatingHistory = ratingHistory.slice(-20).map(r => ({
            contestId: r.contestId,
            contestName: r.contestName,
            rating: r.newRating,
            date: new Date(r.ratingUpdateTimeSeconds * 1000)
        }));

        return {
            platform: 'codeforces',
            username: handle,
            rating: userInfo.rating || 0,
            maxRating: userInfo.maxRating || 0,
            rank: userInfo.rank || 'unrated',
            totalSolved: solvedSet.size,
            totalSubmissions: submissions.length,
            ratingHistory: formattedRatingHistory,
            submissionsByDate, // { 'YYYY-MM-DD': count }
            fetchStatus: 'success'
        };
    } catch (error) {
        console.error(`Codeforces fetch error: ${error.message}`);
        return {
            platform: 'codeforces',
            fetchStatus: 'failed',
            errorMessage: error.message
        };
    }
};

/**
 * Get daily submissions from Codeforces data
 * @param {Object} submissionsByDate - Submissions by date object
 * @param {string} dateStr - Date string (YYYY-MM-DD)
 * @returns {number} Number of submissions on that date
 */
const getCodeforcesDailySubmissions = (submissionsByDate, dateStr) => {
    return submissionsByDate[dateStr] || 0;
};

module.exports = { fetchCodeforcesData, getCodeforcesDailySubmissions };
