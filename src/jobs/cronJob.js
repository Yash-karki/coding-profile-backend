const cron = require('node-cron');
const PlatformStats = require('../models/PlatformStats');
const DailyActivity = require('../models/DailyActivity');
const { fetchLeetCodeData, getLeetCodeDailySubmissions } = require('../services/leetcode');
const { fetchCodeforcesData, getCodeforcesDailySubmissions } = require('../services/codeforces');
const { fetchCodeChefData } = require('../services/codechef');
const { fetchGFGData } = require('../services/geeksforgeeks');

// Track previous day's data for change detection
let previousStats = {};

/**
 * Sleep utility for rate limiting
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Fetch data from all platforms with rate limiting
 */
const fetchAllPlatforms = async () => {
    console.log('🚀 Starting data fetch from all platforms...');

    const usernames = {
        leetcode: process.env.LEETCODE_USERNAME,
        codeforces: process.env.CODEFORCES_USERNAME,
        codechef: process.env.CODECHEF_USERNAME,
        geeksforgeeks: process.env.GFG_USERNAME
    };

    const results = {};

    // Fetch LeetCode
    if (usernames.leetcode) {
        console.log('📊 Fetching LeetCode data...');
        results.leetcode = await fetchLeetCodeData(usernames.leetcode);
        await sleep(1000); // Rate limit delay
    }

    // Fetch Codeforces
    if (usernames.codeforces) {
        console.log('📊 Fetching Codeforces data...');
        results.codeforces = await fetchCodeforcesData(usernames.codeforces);
        await sleep(1000);
    }

    // Fetch CodeChef
    if (usernames.codechef) {
        console.log('📊 Fetching CodeChef data...');
        results.codechef = await fetchCodeChefData(usernames.codechef);
        await sleep(1000);
    }

    // Fetch GFG
    if (usernames.geeksforgeeks) {
        console.log('📊 Fetching GeeksforGeeks data...');
        results.geeksforgeeks = await fetchGFGData(usernames.geeksforgeeks);
    }

    return results;
};

/**
 * Calculate daily activity from platform data
 */
const calculateDailyActivity = (platformData) => {
    const today = new Date().toISOString().split('T')[0];
    let totalSubmissions = 0;
    const breakdown = {
        leetcode: 0,
        codeforces: 0,
        codechef: 0,
        geeksforgeeks: 0
    };

    // LeetCode - use submission calendar
    if (platformData.leetcode?.submissionCalendar) {
        const todayTimestamp = Math.floor(new Date(today).getTime() / 1000);
        breakdown.leetcode = platformData.leetcode.submissionCalendar[todayTimestamp] || 0;
    }

    // Codeforces - use submissions by date
    if (platformData.codeforces?.submissionsByDate) {
        breakdown.codeforces = platformData.codeforces.submissionsByDate[today] || 0;
    }

    // CodeChef & GFG - detect from total solved changes
    if (previousStats.codechef && platformData.codechef) {
        const diff = (platformData.codechef.totalSolved || 0) -
            (previousStats.codechef.totalSolved || 0);
        breakdown.codechef = Math.max(0, diff);
    }

    if (previousStats.geeksforgeeks && platformData.geeksforgeeks) {
        const diff = (platformData.geeksforgeeks.totalSolved || 0) -
            (previousStats.geeksforgeeks.totalSolved || 0);
        breakdown.geeksforgeeks = Math.max(0, diff);
    }

    totalSubmissions = Object.values(breakdown).reduce((a, b) => a + b, 0);

    return { date: today, totalSubmissions, breakdown };
};

/**
 * Save platform stats to database
 */
const savePlatformStats = async (platformData) => {
    for (const [platform, data] of Object.entries(platformData)) {
        if (data.fetchStatus === 'failed') {
            console.log(`⚠️ Skipping ${platform} - fetch failed`);
            continue;
        }

        try {
            await PlatformStats.findOneAndUpdate(
                { platform },
                {
                    ...data,
                    lastFetched: new Date()
                },
                { upsert: true, new: true }
            );
            console.log(`✅ Saved ${platform} stats`);
        } catch (error) {
            console.error(`❌ Error saving ${platform}:`, error.message);
        }
    }
};

/**
 * Save daily activity to database
 */
const saveDailyActivity = async (activityData) => {
    try {
        const dateObj = new Date(activityData.date);
        dateObj.setHours(0, 0, 0, 0);

        const activity = new DailyActivity({
            date: dateObj,
            totalSubmissions: activityData.totalSubmissions,
            breakdown: activityData.breakdown
        });

        // Use findOneAndUpdate with upsert to avoid duplicates
        await DailyActivity.findOneAndUpdate(
            { date: dateObj },
            {
                date: dateObj,
                totalSubmissions: activityData.totalSubmissions,
                breakdown: activityData.breakdown,
                // Intensity level is calculated in pre-save hook
                intensityLevel: getIntensityLevel(activityData.totalSubmissions)
            },
            { upsert: true, new: true }
        );

        console.log(`✅ Saved daily activity for ${activityData.date}`);
    } catch (error) {
        console.error('❌ Error saving daily activity:', error.message);
    }
};

/**
 * Calculate intensity level for heatmap
 */
const getIntensityLevel = (count) => {
    if (count === 0) return 0;
    if (count <= 2) return 1;
    if (count <= 5) return 2;
    if (count <= 9) return 3;
    return 4;
};

/**
 * Main cron job function
 */
const runDailyJob = async () => {
    console.log('\n========================================');
    console.log(`🕐 Cron Job Started: ${new Date().toISOString()}`);
    console.log('========================================\n');

    try {
        // Load previous stats for change detection
        const prevStatsArray = await PlatformStats.find({});
        previousStats = {};
        prevStatsArray.forEach(stat => {
            previousStats[stat.platform] = stat.toObject();
        });

        // Fetch fresh data
        const platformData = await fetchAllPlatforms();

        // Calculate daily activity
        const dailyActivity = calculateDailyActivity(platformData);

        // Save to database
        await savePlatformStats(platformData);
        await saveDailyActivity(dailyActivity);

        console.log('\n✅ Cron Job Completed Successfully\n');
    } catch (error) {
        console.error('❌ Cron Job Failed:', error.message);
    }
};

/**
 * Initialize cron scheduler
 * Runs every day at 2:00 AM IST (8:30 PM UTC previous day)
 */
const initCronJob = () => {
    // Schedule: Minute 30, Hour 20 UTC = 2:00 AM IST
    cron.schedule('30 20 * * *', runDailyJob, {
        timezone: 'Asia/Kolkata'
    });

    console.log('⏰ Cron job scheduled: Daily at 2:00 AM IST');

    // Also run immediately on server start (for initial data)
    console.log('🔄 Running initial data fetch...');
    setTimeout(runDailyJob, 5000); // Delay 5s to allow DB connection
};

module.exports = { initCronJob, runDailyJob };
