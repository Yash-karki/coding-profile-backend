const mongoose = require('mongoose');

const PlatformStatsSchema = new mongoose.Schema({
    platform: {
        type: String,
        enum: ['leetcode', 'codeforces', 'codechef', 'geeksforgeeks'],
        required: true,
        unique: true
    },
    username: String,

    // Common fields
    totalSolved: { type: Number, default: 0 },
    totalSubmissions: { type: Number, default: 0 },

    // LeetCode specific
    easySolved: Number,
    mediumSolved: Number,
    hardSolved: Number,
    ranking: Number,
    acceptanceRate: Number,

    // Codeforces specific
    rating: Number,
    maxRating: Number,
    rank: String,
    ratingHistory: [{
        contestId: Number,
        contestName: String,
        rating: Number,
        date: Date
    }],

    // CodeChef specific
    stars: Number,
    globalRank: Number,
    countryRank: Number,

    // GeeksforGeeks specific
    institutionRank: Number,
    codingScore: Number,
    monthlyScore: Number,

    // Metadata
    lastFetched: { type: Date, default: Date.now },
    fetchStatus: {
        type: String,
        enum: ['success', 'partial', 'failed'],
        default: 'success'
    },
    errorMessage: String
}, { timestamps: true });

// Index for fast lookups
PlatformStatsSchema.index({ platform: 1 });

module.exports = mongoose.model('PlatformStats', PlatformStatsSchema);
