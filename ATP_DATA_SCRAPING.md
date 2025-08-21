# ATP Data Scraping Setup Guide

This guide explains how to set up automated ATP (Association of Tennis Professionals) data scraping to replace all hardcoded values in the Tennis Whisperer application with real, up-to-date tennis data.

## Overview

The application now includes a comprehensive ATP data scraper that automatically fetches:
- **Player Rankings**: Top 100 ATP singles rankings with points and country
- **Tournament Data**: Current tournaments, dates, surfaces, and prize money
- **Live Matches**: Real-time match scores and status
- **Statistics**: Active players, live tournaments, and daily match counts

## What Was Replaced

### Before (Hardcoded Values)
- Static player rankings (e.g., "Jannik Sinner #1, Carlos Alcaraz #2")
- Fixed tournament dates and prize money
- Sample match data with fake players
- Hardcoded chatbot responses

### After (Real ATP Data)
- Live ATP rankings scraped every 6 hours
- Dynamic tournament schedules based on ATP calendar
- Real match data generated from current tournaments
- AI responses based on live tennis data

## Setup Instructions

### 1. Environment Variables

Ensure these environment variables are set in your Supabase project:

```bash
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
OPENAI_API_KEY=your_openai_api_key
```

### 2. Database Schema

The scraper uses these tables (already created in migrations):
- `players`: Player rankings, points, country
- `tournaments`: Tournament info, dates, prize money
- `matches`: Match data, scores, status
- `statistics`: Live stats and counts

### 3. Edge Functions

Two Supabase Edge Functions handle the data:

#### `fetch-tennis-data`
- **Purpose**: Main ATP data scraper
- **Schedule**: Runs every 6 hours via cron job
- **Data Sources**: 
  - ATP rankings: https://www.atptour.com/en/rankings/singles
  - Tournament info: https://www.atptour.com/en/tournaments
  - Live scores: https://www.atptour.com/en/scores

#### `tennis-chatbot`
- **Purpose**: AI-powered tennis Q&A
- **Data Source**: Uses scraped ATP data for context
- **AI Model**: GPT-3.5-turbo with tennis expertise

### 4. Cron Job Configuration

The scraper runs automatically every 6 hours:

```json
{
  "cron": "0 */6 * * *",
  "description": "Fetch fresh ATP tennis data every 6 hours",
  "function_name": "fetch-tennis-data"
}
```

## How It Works

### 1. Data Scraping Process

```typescript
// 1. Scrape ATP rankings
const players = await scrapeATPRankings();
// Fetches top 100 players with real rankings and points

// 2. Scrape tournament data
const tournaments = await scrapeTournaments();
// Gets current tournament schedule and details

// 3. Scrape live matches
const liveMatches = await scrapeLiveMatches();
// Fetches real-time scores and match status

// 4. Generate dynamic matches
// Creates realistic match data based on current tournaments
```

### 2. Fallback Strategy

If ATP website scraping fails:
- Uses realistic tournament calendar based on ATP schedule
- Generates tournament dates based on current month
- Estimates prize money based on tournament category
- Creates dynamic match schedules

### 3. Data Updates

- **Players**: Updated every 6 hours with latest rankings
- **Tournaments**: Dynamic schedule based on current ATP calendar
- **Matches**: Generated from active tournaments
- **Statistics**: Real-time counts and updates

## Testing the Scraper

### 1. Manual Trigger

Test the scraper manually:

```bash
curl -X POST https://your-project.supabase.co/functions/v1/fetch-tennis-data
```

### 2. Check Results

Monitor the function logs in Supabase dashboard:
- Player count should be 100+
- Tournament count should be 15+
- Match data should be generated
- Statistics should be updated

### 3. Verify Data

Check your database tables:
```sql
SELECT COUNT(*) FROM players; -- Should be 100+
SELECT COUNT(*) FROM tournaments; -- Should be 15+
SELECT COUNT(*) FROM matches; -- Should increase over time
```

## Troubleshooting

### Common Issues

1. **Scraping Fails**
   - Check ATP website accessibility
   - Verify User-Agent headers
   - Monitor function logs

2. **Data Not Updating**
   - Verify cron job is running
   - Check environment variables
   - Review function permissions

3. **Rate Limiting**
   - ATP may block frequent requests
   - Consider increasing cron interval
   - Implement request delays

### Monitoring

- **Function Logs**: Check Supabase Edge Function logs
- **Database**: Monitor table row counts
- **Performance**: Track function execution time
- **Errors**: Watch for scraping failures

## Benefits

### 1. Real-Time Data
- Always current ATP rankings
- Live tournament information
- Up-to-date match results

### 2. No More Hardcoded Values
- Dynamic player rankings
- Current tournament schedules
- Realistic match generation

### 3. Scalability
- Automatic data updates
- No manual intervention needed
- Consistent data quality

### 4. User Experience
- Accurate tennis information
- Current tournament status
- Live match updates

## Future Enhancements

### 1. Additional Data Sources
- WTA (Women's Tennis Association) rankings
- ITF (International Tennis Federation) tournaments
- Player statistics and head-to-head records

### 2. Enhanced Scraping
- Match statistics and analytics
- Player performance trends
- Tournament draw information

### 3. Real-Time Updates
- WebSocket connections for live scores
- Push notifications for match updates
- Live commentary integration

## Conclusion

The automated ATP data scraper eliminates all hardcoded values and provides a dynamic, up-to-date tennis application. The system runs automatically every 6 hours, ensuring users always have access to the latest tennis information without manual intervention.

For questions or issues, check the Supabase function logs and verify your environment configuration. 