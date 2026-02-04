const axios = require('axios');

/**
 * Fetch GeeksforGeeks profile data
 * Tries multiple API endpoints for reliability
 * @param {string} username - GFG username
 * @returns {Object} Parsed profile data
 */
const fetchGFGData = async (username) => {
    console.log(`📊 Fetching GFG data for: ${username}`);

    // Try Method 1: GFG Practice API (most reliable)
    try {
        const response = await axios.get(
            `https://www.geeksforgeeks.org/api/vr/auth/user-stats/${username}`,
            {
                headers: {
                    'Accept': 'application/json, text/plain, */*',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                },
                timeout: 15000
            }
        );

        if (response.data && response.data.data) {
            const data = response.data.data;
            return {
                platform: 'geeksforgeeks',
                username: username,
                totalSolved: data.total_problems_solved || 0,
                easySolved: data.school_solved || 0,
                mediumSolved: (data.basic_solved || 0) + (data.easy_solved || 0),
                hardSolved: (data.medium_solved || 0) + (data.hard_solved || 0),
                codingScore: data.score || 0,
                monthlyScore: data.monthly_score || 0,
                institutionRank: data.institute_rank || null,
                fetchStatus: 'success'
            };
        }
    } catch (error) {
        console.log(`GFG Method 1 failed: ${error.message}`);
    }

    // Try Method 2: Alternate stats API
    try {
        const response = await axios.get(
            `https://geeksforgeeks-profile-api.vercel.app/api/${username}`,
            { timeout: 15000 }
        );

        if (response.data && !response.data.error) {
            const data = response.data;
            return {
                platform: 'geeksforgeeks',
                username: username,
                totalSolved: data.totalProblemsSolved || data.problemsSolved || 0,
                easySolved: data.school || 0,
                mediumSolved: (data.basic || 0) + (data.easy || 0),
                hardSolved: (data.medium || 0) + (data.hard || 0),
                codingScore: data.codingScore || 0,
                fetchStatus: 'success'
            };
        }
    } catch (error) {
        console.log(`GFG Method 2 failed: ${error.message}`);
    }

    // Try Method 3: Another public API
    try {
        const response = await axios.get(
            `https://gfg-stats-api.vercel.app/?userName=${username}`,
            { timeout: 15000 }
        );

        if (response.data && response.data.totalProblemsSolved) {
            const data = response.data;
            return {
                platform: 'geeksforgeeks',
                username: username,
                totalSolved: data.totalProblemsSolved || 0,
                easySolved: data.School || data.school || 0,
                mediumSolved: (data.Basic || 0) + (data.Easy || 0),
                hardSolved: (data.Medium || 0) + (data.Hard || 0),
                codingScore: data.codingScore || 0,
                institutionRank: data.instituteRank || null,
                fetchStatus: 'success'
            };
        }
    } catch (error) {
        console.log(`GFG Method 3 failed: ${error.message}`);
    }

    // All methods failed
    console.error('❌ All GFG fetch methods failed');
    return {
        platform: 'geeksforgeeks',
        fetchStatus: 'failed',
        errorMessage: 'All API methods failed'
    };
};

module.exports = { fetchGFGData };
