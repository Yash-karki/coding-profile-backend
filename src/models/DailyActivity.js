const mongoose = require('mongoose');

const DailyActivitySchema = new mongoose.Schema({
    date: {
        type: Date,
        required: true,
        unique: true
    },

    // Total submissions across all platforms
    totalSubmissions: { type: Number, default: 0 },

    // Platform-wise breakdown
    breakdown: {
        leetcode: { type: Number, default: 0 },
        codeforces: { type: Number, default: 0 },
        codechef: { type: Number, default: 0 },
        geeksforgeeks: { type: Number, default: 0 }
    },

    // For color intensity calculation
    // 0 = no activity (gray)
    // 1 = 1-2 submissions (light green)
    // 2 = 3-5 submissions (medium green)
    // 3 = 6-9 submissions (dark green)
    // 4 = 10+ submissions (darkest green)
    intensityLevel: {
        type: Number,
        min: 0,
        max: 4,
        default: 0
    }
}, { timestamps: true });

// Index for fast date-range queries
DailyActivitySchema.index({ date: -1 });

// Auto-calculate intensity level before saving
DailyActivitySchema.pre('save', function (next) {
    const count = this.totalSubmissions;
    if (count === 0) this.intensityLevel = 0;
    else if (count <= 2) this.intensityLevel = 1;
    else if (count <= 5) this.intensityLevel = 2;
    else if (count <= 9) this.intensityLevel = 3;
    else this.intensityLevel = 4;
    next();
});

module.exports = mongoose.model('DailyActivity', DailyActivitySchema);
