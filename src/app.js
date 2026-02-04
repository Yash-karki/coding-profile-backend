require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/database');
const apiRoutes = require('./routes/api');
const { initCronJob } = require('./jobs/cronJob');

const app = express();
const PORT = process.env.PORT || 3000;

// CORS configuration
const corsOptions = {
    origin: [
        'http://localhost:5500',
        'http://127.0.0.1:5500',
        process.env.FRONTEND_URL,
        'https://yash-karki.github.io'
    ].filter(Boolean),
    methods: ['GET'],
    optionsSuccessStatus: 200
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Request logging
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} | ${req.method} ${req.path}`);
    next();
});

// API routes
app.use('/api', apiRoutes);

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        name: 'Coding Profile Analytics API',
        version: '1.0.0',
        endpoints: {
            health: '/api/health',
            stats: '/api/stats',
            platformStats: '/api/stats/:platform',
            heatmap: '/api/heatmap',
            yearHeatmap: '/api/heatmap/:year'
        }
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server Error:', err.message);
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Endpoint not found'
    });
});

// Start server
const startServer = async () => {
    try {
        // Connect to MongoDB
        await connectDB();

        // Start Express server
        app.listen(PORT, () => {
            console.log(`\n🚀 Server running on port ${PORT}`);
            console.log(`📡 API available at http://localhost:${PORT}/api`);

            // Initialize cron job
            initCronJob();
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error.message);
        process.exit(1);
    }
};

startServer();
