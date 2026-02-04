const axios = require('axios');
const cheerio = require('cheerio');

/**
 * Fetch GeeksforGeeks profile data via HTML scraping
 * @param {string} username - GFG username
 * @returns {Object} Parsed profile data
 */
const fetchGFGData = async (username) => {
    try {
        // GFG provides a user profile API
        const response = await axios.get(
            `https://geeks-for-geeks-stats-api.vercel.app/?userName=${username}`,
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
            easySolved: data.Easy || 0,
            mediumSolved: data.Medium || 0,
            hardSolved: data.Hard || 0,
            codingScore: data.codingScore || 0,
            monthlyScore: data.monthlyScore || 0,
            institutionRank: data.instituteRank || null,
            fetchStatus: 'success'
        };
    } catch (error) {
        console.error(`GFG fetch error: ${error.message}`);

        // Fallback: Try direct scraping
        try {
            return await fetchGFGDataScraping(username);
        } catch (scrapingError) {
            return {
                platform: 'geeksforgeeks',
                fetchStatus: 'failed',
                errorMessage: error.message
            };
        }
    }
};

/**
 * Fallback: Scrape GFG profile directly
 * @param {string} username - GFG username
 * @returns {Object} Scraped profile data
 */
const fetchGFGDataScraping = async (username) => {
    const response = await axios.get(
        `https://www.geeksforgeeks.org/user/${username}/`,
        {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            timeout: 15000
        }
    );

    const $ = cheerio.load(response.data);

    // Extract data from profile page
    const scoreCards = $('.score_card_value');

    return {
        platform: 'geeksforgeeks',
        username: username,
        codingScore: parseInt(scoreCards.eq(0).text()) || 0,
        totalSolved: parseInt(scoreCards.eq(1).text()) || 0,
        monthlyScore: parseInt(scoreCards.eq(2).text()) || 0,
        institutionRank: parseInt($('.instituteRank').text()) || null,
        fetchStatus: 'partial' // Indicate scraping fallback was used
    };
};

module.exports = { fetchGFGData };
