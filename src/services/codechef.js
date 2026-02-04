const axios = require('axios');
const cheerio = require('cheerio');

/**
 * Fetch CodeChef profile data
 * @param {string} username - CodeChef username
 * @returns {Object} Parsed profile data
 */
const fetchCodeChefData = async (username) => {
    try {
        // Try primary API
        const response = await axios.get(
            `https://competitive-coding-api.p.rapidapi.com/api/codechef/${username}`,
            {
                headers: {
                    'X-RapidAPI-Key': process.env.RAPIDAPI_KEY || '',
                    'X-RapidAPI-Host': 'competitive-coding-api.p.rapidapi.com'
                },
                timeout: 15000
            }
        );

        const data = response.data;

        if (data && data.currentRating) {
            return {
                platform: 'codechef',
                username: data.name || username,
                rating: data.currentRating || 0,
                maxRating: data.highestRating || 0,
                stars: data.stars ? parseInt(data.stars.replace('★', '')) : 0,
                globalRank: data.globalRank || null,
                countryRank: data.countryRank || null,
                totalSolved: parseInt(data.totalProblemsSolved) || 0,
                fetchStatus: 'success'
            };
        }

        throw new Error('Primary API failed');
    } catch (error) {
        console.error(`CodeChef API error: ${error.message}`);

        // Fallback: Scrape CodeChef profile page
        try {
            return await fetchCodeChefScraping(username);
        } catch (scrapingError) {
            console.error(`CodeChef scraping error: ${scrapingError.message}`);
            return {
                platform: 'codechef',
                fetchStatus: 'failed',
                errorMessage: error.message
            };
        }
    }
};

/**
 * Fallback: Scrape CodeChef profile
 */
const fetchCodeChefScraping = async (username) => {
    const response = await axios.get(
        `https://www.codechef.com/users/${username}`,
        {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'text/html,application/xhtml+xml'
            },
            timeout: 15000
        }
    );

    const $ = cheerio.load(response.data);

    // Extract rating from profile
    const ratingText = $('.rating-number').first().text().trim();
    const rating = parseInt(ratingText) || 0;

    // Extract stars
    const stars = $('.rating-star').length || 0;

    // Extract highest rating
    const highestRatingMatch = $('small:contains("Highest Rating")').text().match(/(\d+)/);
    const maxRating = highestRatingMatch ? parseInt(highestRatingMatch[1]) : rating;

    // Extract problems solved
    const problemsSolved = $('h5:contains("Total Problems Solved")').next().text().trim();

    return {
        platform: 'codechef',
        username: username,
        rating: rating,
        maxRating: maxRating,
        stars: stars,
        totalSolved: parseInt(problemsSolved) || 0,
        fetchStatus: rating > 0 ? 'success' : 'partial'
    };
};

module.exports = { fetchCodeChefData };
