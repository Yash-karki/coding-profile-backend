const axios = require('axios');

// Using community-maintained CodeChef API
const CODECHEF_API = 'https://codechef-api.vercel.app/handle';

/**
 * Fetch CodeChef profile data
 * @param {string} username - CodeChef username
 * @returns {Object} Parsed profile data
 */
const fetchCodeChefData = async (username) => {
    try {
        const response = await axios.get(`${CODECHEF_API}/${username}`, {
            timeout: 15000
        });

        const data = response.data;

        if (!data || data.success === false) {
            throw new Error(`CodeChef user "${username}" not found`);
        }

        // Parse rating history if available
        const ratingHistory = (data.ratingData || []).slice(-20).map(r => ({
            contestName: r.name,
            rating: r.rating,
            date: new Date(r.end_date)
        }));

        return {
            platform: 'codechef',
            username: data.name || username,
            rating: data.currentRating || 0,
            maxRating: data.highestRating || 0,
            stars: data.stars ? parseInt(data.stars) : 0,
            globalRank: data.globalRank || null,
            countryRank: data.countryRank || null,
            totalSolved: data.fullySolvedCount || 0,
            ratingHistory,
            fetchStatus: 'success'
        };
    } catch (error) {
        console.error(`CodeChef fetch error: ${error.message}`);
        return {
            platform: 'codechef',
            fetchStatus: 'failed',
            errorMessage: error.message
        };
    }
};

module.exports = { fetchCodeChefData };
