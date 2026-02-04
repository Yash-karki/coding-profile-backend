# Coding Profile Backend

Backend API service for the Coding Profile Analytics Dashboard.

## Setup

1. Copy `.env.example` to `.env` and fill in your values
2. Run `npm install`
3. Run `npm run dev` for development

## Deployment

Deploy to Render.com:
1. Create a new Web Service
2. Connect your GitHub repository
3. Set environment variables from `.env.example`
4. Deploy!

## API Endpoints

- `GET /api/health` - Health check
- `GET /api/stats` - All platform statistics
- `GET /api/stats/:platform` - Single platform stats
- `GET /api/heatmap` - Combined heatmap data
- `GET /api/heatmap/:year` - Year-specific heatmap
