const axios = require('axios');

/**
 * Fetch GeeksforGeeks profile data using GFG's internal API
 * @param {string} username - GFG username
 * @returns {Object} Parsed profile data
 */
const fetchGFGData = async (username) => {
    try {
        // Use GFG's internal practice API
        const response = await axios.get(
            `https://www.geeksforgeeks.org/gfg-assets/user-data/${username}?type=profile`,
            {
                headers: {
                    'Accept': 'application/json',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                },
                timeout: 15000
            }
        );

        const data = response.data?.data || response.data;

        if (!data) {
            throw new Error(`GFG user "${username}" not found`);
        }

        return {
            platform: 'geeksforgeeks',
            username: username,
            totalSolved: data.total_problems_solved || 0,
            codingScore: data.score || 0,
            monthlyScore: data.monthly_score || 0,
            institutionRank: data.institute_rank || null,
            currentStreak: data.pod_solved_current_streak || 0,
            longestStreak: data.pod_solved_longest_streak || 0,
            fetchStatus: 'success'
        };
    } catch (error) {
        console.error(`GFG API error: ${error.message}`);

        // Fallback: Try alternate API
        try {
            return await fetchGFGDataAlternate(username);
        } catch (fallbackError) {
            console.error(`GFG fallback error: ${fallbackError.message}`);
            return {
                platform: 'geeksforgeeks',
                fetchStatus: 'failed',
                errorMessage: error.message
            };
        }
    }
};

/**
 * Alternate method using geeksforgeeks-api
 */
const fetchGFGDataAlternate = async (username) => {
    const response = await axios.get(
        `https://geeksforgeeks-api.vercel.app/api?userName=${username}`,
        { timeout: 15000 }
    );

    const data = response.data;

    if (!data || data.error) {
        throw new Error(`GFG user "${username}" not found`);
    }

    return {
        platform: 'geeksforgeeks',
        username: username,
        totalSolved: data.totalProblemsSolved || 0,
        easySolved: data.school || 0,
        mediumSolved: (data.basic || 0) + (data.easy || 0),
        hardSolved: (data.medium || 0) + (data.hard || 0),
        codingScore: data.codingScore || 0,
        fetchStatus: 'success'
    };
};

module.exports = { fetchGFGData };
