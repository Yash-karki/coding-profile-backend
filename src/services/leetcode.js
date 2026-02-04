const axios = require('axios');

const LEETCODE_GRAPHQL_URL = 'https://leetcode.com/graphql';

const LEETCODE_QUERY = `
  query userProfile($username: String!) {
    matchedUser(username: $username) {
      username
      profile {
        ranking
      }
      submitStats {
        acSubmissionNum {
          difficulty
          count
        }
      }
      submissionCalendar
    }
  }
`;

/**
 * Fetch LeetCode profile data using GraphQL API
 * @param {string} username - LeetCode username
 * @returns {Object} Parsed profile data
 */
const fetchLeetCodeData = async (username) => {
    try {
        const response = await axios.post(
            LEETCODE_GRAPHQL_URL,
            {
                query: LEETCODE_QUERY,
                variables: { username }
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Referer': 'https://leetcode.com'
                },
                timeout: 10000
            }
        );

        const user = response.data?.data?.matchedUser;

        if (!user) {
            throw new Error(`LeetCode user "${username}" not found`);
        }

        // Parse submission stats
        const stats = user.submitStats?.acSubmissionNum || [];
        const easyStats = stats.find(s => s.difficulty === 'Easy') || { count: 0 };
        const mediumStats = stats.find(s => s.difficulty === 'Medium') || { count: 0 };
        const hardStats = stats.find(s => s.difficulty === 'Hard') || { count: 0 };
        const allStats = stats.find(s => s.difficulty === 'All') || { count: 0 };

        // Parse submission calendar for daily activity
        let submissionCalendar = {};
        try {
            submissionCalendar = JSON.parse(user.submissionCalendar || '{}');
        } catch (e) {
            console.warn('Failed to parse LeetCode submission calendar');
        }

        return {
            platform: 'leetcode',
            username: user.username,
            totalSolved: allStats.count,
            easySolved: easyStats.count,
            mediumSolved: mediumStats.count,
            hardSolved: hardStats.count,
            ranking: user.profile?.ranking || null,
            submissionCalendar, // { timestamp: count }
            fetchStatus: 'success'
        };
    } catch (error) {
        console.error(`LeetCode fetch error: ${error.message}`);
        return {
            platform: 'leetcode',
            fetchStatus: 'failed',
            errorMessage: error.message
        };
    }
};

/**
 * Get daily submissions from LeetCode calendar
 * @param {Object} calendar - Submission calendar object
 * @param {Date} date - Date to check
 * @returns {number} Number of submissions on that date
 */
const getLeetCodeDailySubmissions = (calendar, date) => {
    // LeetCode uses Unix timestamps (seconds)
    const startOfDay = Math.floor(new Date(date).setHours(0, 0, 0, 0) / 1000);
    return calendar[startOfDay] || 0;
};

module.exports = { fetchLeetCodeData, getLeetCodeDailySubmissions };
