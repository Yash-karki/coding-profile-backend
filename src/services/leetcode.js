const axios = require('axios');

const LEETCODE_GRAPHQL_URL = 'https://leetcode.com/graphql';

// Query for user profile and submission stats
const LEETCODE_PROFILE_QUERY = `
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

// Query for contest rating
const LEETCODE_CONTEST_QUERY = `
  query userContestRankingInfo($username: String!) {
    userContestRanking(username: $username) {
      rating
      globalRanking
      attendedContestsCount
      topPercentage
    }
    userContestRankingHistory(username: $username) {
      contest {
        title
        startTime
      }
      rating
      ranking
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
        // Fetch profile data
        const profileResponse = await axios.post(
            LEETCODE_GRAPHQL_URL,
            {
                query: LEETCODE_PROFILE_QUERY,
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

        const user = profileResponse.data?.data?.matchedUser;

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

        // Fetch contest rating separately
        let contestData = { rating: null, globalRanking: null, attendedContestsCount: 0 };
        let ratingHistory = [];

        try {
            const contestResponse = await axios.post(
                LEETCODE_GRAPHQL_URL,
                {
                    query: LEETCODE_CONTEST_QUERY,
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

            const contestInfo = contestResponse.data?.data?.userContestRanking;
            if (contestInfo) {
                contestData = {
                    rating: Math.round(contestInfo.rating) || null,
                    globalRanking: contestInfo.globalRanking || null,
                    attendedContestsCount: contestInfo.attendedContestsCount || 0,
                    topPercentage: contestInfo.topPercentage || null
                };
            }

            // Get rating history (last 10 contests)
            const historyData = contestResponse.data?.data?.userContestRankingHistory || [];
            ratingHistory = historyData.slice(-10).map(h => ({
                contestName: h.contest?.title,
                rating: Math.round(h.rating),
                ranking: h.ranking,
                date: new Date(h.contest?.startTime * 1000)
            }));
        } catch (contestError) {
            console.warn('Failed to fetch LeetCode contest data:', contestError.message);
        }

        return {
            platform: 'leetcode',
            username: user.username,
            totalSolved: allStats.count,
            easySolved: easyStats.count,
            mediumSolved: mediumStats.count,
            hardSolved: hardStats.count,
            ranking: user.profile?.ranking || null,
            rating: contestData.rating,
            globalRanking: contestData.globalRanking,
            attendedContests: contestData.attendedContestsCount,
            topPercentage: contestData.topPercentage,
            ratingHistory,
            submissionCalendar,
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
