const express = require('express');
const router = express.Router();
const PlatformStats = require('../models/PlatformStats');
const DailyActivity = require('../models/DailyActivity');

// In-memory cache
let cache = {
    stats: null,
    heatmap: null,
    lastUpdated: null
};
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Check if cache is valid
 */
const isCacheValid = () => {
    return cache.lastUpdated && (Date.now() - cache.lastUpdated < CACHE_TTL);
};

/**
 * GET /api/health
 * Health check endpoint
 */
router.get('/health', async (req, res) => {
    try {
        const lastStats = await PlatformStats.findOne().sort({ lastFetched: -1 });
        res.json({
            status: 'ok',
            timestamp: new Date().toISOString(),
            lastDataUpdate: lastStats?.lastFetched || null
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

/**
 * GET /api/stats
 * Get all platform statistics
 */
router.get('/stats', async (req, res) => {
    try {
        // Check cache first
        if (isCacheValid() && cache.stats) {
            return res.json({
                success: true,
                cached: true,
                lastUpdated: cache.stats[0]?.lastFetched,
                data: formatStatsResponse(cache.stats)
            });
        }

        const stats = await PlatformStats.find({});

        // Update cache
        cache.stats = stats;
        cache.lastUpdated = Date.now();

        res.json({
            success: true,
            cached: false,
            lastUpdated: stats[0]?.lastFetched,
            data: formatStatsResponse(stats)
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * GET /api/stats/:platform
 * Get single platform statistics
 */
router.get('/stats/:platform', async (req, res) => {
    try {
        const { platform } = req.params;
        const validPlatforms = ['leetcode', 'codeforces', 'codechef', 'geeksforgeeks'];

        if (!validPlatforms.includes(platform)) {
            return res.status(400).json({
                success: false,
                message: `Invalid platform. Use: ${validPlatforms.join(', ')}`
            });
        }

        const stats = await PlatformStats.findOne({ platform });

        if (!stats) {
            return res.status(404).json({ success: false, message: 'Platform data not found' });
        }

        res.json({
            success: true,
            lastUpdated: stats.lastFetched,
            data: stats
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * GET /api/heatmap
 * Get combined heatmap data (last 365 days)
 */
router.get('/heatmap', async (req, res) => {
    try {
        // Check cache
        if (isCacheValid() && cache.heatmap) {
            return res.json({
                success: true,
                cached: true,
                data: cache.heatmap
            });
        }

        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

        const activities = await DailyActivity.find({
            date: { $gte: oneYearAgo }
        }).sort({ date: 1 });

        // Format for frontend consumption
        const formattedData = activities.map(a => ({
            date: a.date.toISOString().split('T')[0],
            count: a.totalSubmissions,
            level: a.intensityLevel,
            breakdown: a.breakdown
        }));

        // Update cache
        cache.heatmap = formattedData;
        cache.lastUpdated = Date.now();

        res.json({
            success: true,
            cached: false,
            data: formattedData
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * GET /api/heatmap/:year
 * Get heatmap data for specific year
 */
router.get('/heatmap/:year', async (req, res) => {
    try {
        const year = parseInt(req.params.year);

        if (isNaN(year) || year < 2000 || year > 2100) {
            return res.status(400).json({ success: false, message: 'Invalid year' });
        }

        const startDate = new Date(year, 0, 1);
        const endDate = new Date(year, 11, 31, 23, 59, 59);

        const activities = await DailyActivity.find({
            date: { $gte: startDate, $lte: endDate }
        }).sort({ date: 1 });

        const formattedData = activities.map(a => ({
            date: a.date.toISOString().split('T')[0],
            count: a.totalSubmissions,
            level: a.intensityLevel,
            breakdown: a.breakdown
        }));

        res.json({
            success: true,
            year,
            data: formattedData
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * Helper: Format stats response
 */
const formatStatsResponse = (statsArray) => {
    const result = {};
    statsArray.forEach(stat => {
        result[stat.platform] = {
            totalSolved: stat.totalSolved,
            totalSubmissions: stat.totalSubmissions,
            easySolved: stat.easySolved,
            mediumSolved: stat.mediumSolved,
            hardSolved: stat.hardSolved,
            rating: stat.rating,
            maxRating: stat.maxRating,
            rank: stat.rank,
            stars: stat.stars,
            globalRank: stat.globalRank,
            codingScore: stat.codingScore,
            institutionRank: stat.institutionRank,
            ratingHistory: stat.ratingHistory,
            fetchStatus: stat.fetchStatus,
            lastFetched: stat.lastFetched
        };
    });
    return result;
};

module.exports = router;
