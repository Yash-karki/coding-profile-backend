const axios = require('axios');

/**
 * Fetch CodeChef profile data
 * Tries multiple methods for reliability
 * @param {string} username - CodeChef username
 * @returns {Object} Parsed profile data
 */
const fetchCodeChefData = async (username) => {
    console.log(`📊 Fetching CodeChef data for: ${username}`);

    // Try Method 1: CodeChef unofficial API
    try {
        const response = await axios.get(
            `https://codechef-api.vercel.app/handle/${username}`,
            { timeout: 15000 }
        );

        const data = response.data;
        if (data && data.currentRating) {
            return {
                platform: 'codechef',
                username: data.name || username,
                rating: data.currentRating || 0,
                maxRating: data.highestRating || 0,
                stars: data.stars ? parseInt(data.stars) : 0,
                globalRank: data.globalRank || null,
                countryRank: data.countryRank || null,
                totalSolved: data.fullySolvedCount || 0,
                fetchStatus: 'success'
            };
        }
    } catch (error) {
        console.log(`CodeChef Method 1 failed: ${error.message}`);
    }

    // Try Method 2: Alternate CodeChef API
    try {
        const response = await axios.get(
            `https://competitive-coding-api.herokuapp.com/api/codechef/${username}`,
            { timeout: 15000 }
        );

        const data = response.data;
        if (data && (data.rating || data.currentRating)) {
            return {
                platform: 'codechef',
                username: username,
                rating: data.currentRating || data.rating || 0,
                maxRating: data.highestRating || data.maxRating || 0,
                stars: data.stars ? parseInt(data.stars.replace('★', '')) : 0,
                totalSolved: parseInt(data.fullySolvedCount || data.problemsSolved || 0),
                fetchStatus: 'success'
            };
        }
    } catch (error) {
        console.log(`CodeChef Method 2 failed: ${error.message}`);
    }

    // Try Method 3: CodeChef public profile scraping via API
    try {
        const response = await axios.get(
            `https://codechef-stats-api.vercel.app/user/${username}`,
            { timeout: 15000 }
        );

        const data = response.data;
        if (data && !data.error) {
            return {
                platform: 'codechef',
                username: username,
                rating: data.currentRating || data.rating || 0,
                maxRating: data.highestRating || 0,
                stars: data.stars || 0,
                totalSolved: data.problemsSolved || data.fullySolvedCount || 0,
                fetchStatus: 'success'
            };
        }
    } catch (error) {
        console.log(`CodeChef Method 3 failed: ${error.message}`);
    }

    // Try Method 4: Direct profile data approach
    try {
        const response = await axios.get(
            `https://www.codechef.com/users/${username}`,
            {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Accept': 'text/html'
                },
                timeout: 15000
            }
        );

        const html = response.data;

        // Extract rating using regex
        const ratingMatch = html.match(/class="rating-number">(\d+)<\/span>/);
        const rating = ratingMatch ? parseInt(ratingMatch[1]) : 0;

        // Extract highest rating
        const highestMatch = html.match(/Highest Rating.*?(\d+)/s);
        const maxRating = highestMatch ? parseInt(highestMatch[1]) : rating;

        // Count stars from rating-star spans
        const starsMatch = html.match(/rating-star/g);
        const stars = starsMatch ? starsMatch.length : 0;

        if (rating > 0) {
            return {
                platform: 'codechef',
                username: username,
                rating: rating,
                maxRating: maxRating,
                stars: stars,
                totalSolved: 0, // Hard to extract from HTML
                fetchStatus: 'partial'
            };
        }
    } catch (error) {
        console.log(`CodeChef Method 4 failed: ${error.message}`);
    }

    // All methods failed - return cached data if available
    console.error('❌ All CodeChef fetch methods failed');
    return {
        platform: 'codechef',
        fetchStatus: 'failed',
        errorMessage: 'All API methods failed'
    };
};

module.exports = { fetchCodeChefData };
