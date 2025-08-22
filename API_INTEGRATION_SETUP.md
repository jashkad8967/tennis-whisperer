# API Integration Setup Guide

This guide explains how to set up the new ChatGPT API chatbot and 3rd party tennis data scraper integrations.

## 🚀 **What's New**

### **1. ChatGPT-Powered Tennis Chatbot**
- **Replaces** the old basic chatbot with OpenAI's GPT-4o-mini
- **Features**: Conversational AI, tennis expertise, context awareness
- **Benefits**: Better responses, maintains conversation history, tennis knowledge

### **2. 3rd Party Tennis Data API**
- **Replaces** unreliable web scraping with professional tennis data APIs
- **Features**: Real-time rankings, tournaments, live matches
- **Benefits**: More accurate data, faster updates, reliable service

## 🔑 **Required API Keys**

### **OpenAI API Key**
1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign up/Login and navigate to API Keys
3. Create a new API key
4. Copy the key (starts with `sk-`)

### **Livescore API Key (Real Tennis Data)**
1. Visit [Livescore API](https://livescore-api.com/)
2. Sign up for an account
3. Get your API key and secret from the dashboard
4. **Free tier available** with rate limits

### **Alternative Tennis APIs**
If Livescore doesn't meet your needs, consider:
- **Sportradar**: Professional sports data provider ($100-500/month)
- **API-Football**: Multi-sport data including tennis ($10-50/month)
- **Tennis Abstract**: Historical data (free with limits)

## ⚙️ **Environment Configuration**

### **1. Supabase Environment Variables**
Add these to your Supabase project's environment variables:

```bash
# Supabase Configuration
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# OpenAI API Configuration
OPENAI_API_KEY=sk-your_openai_api_key_here

# Livescore API Configuration (Real tennis data)
LIVESCORE_API_KEY=your_livescore_api_key_here
LIVESCORE_SECRET=your_livescore_secret_here
```

### **2. Local Development**
Create a `.env.local` file in your project root:

```bash
cp supabase/functions/.env.example .env.local
# Edit .env.local with your actual API keys
```

## 🚀 **Deployment Steps**

### **1. Deploy Updated Functions**
```bash
# Deploy the new chatbot function
supabase functions deploy tennis-chatbot

# Deploy the new data fetcher function
supabase functions deploy fetch-tennis-data
```

### **2. Set Environment Variables in Supabase**
```bash
# Set OpenAI API key
supabase secrets set OPENAI_API_KEY=sk-your_key_here

# Set Livescore API credentials
supabase secrets set LIVESCORE_API_KEY=your_livescore_key_here
supabase secrets set LIVESCORE_SECRET=your_livescore_secret_here
```

### **3. Test the Functions**
```bash
# Test the chatbot
curl -X POST https://your-project.supabase.co/functions/v1/tennis-chatbot \
  -H "Authorization: Bearer your_anon_key" \
  -H "Content-Type: application/json" \
  -d '{"message": "Who is ranked #1?", "sessionId": "test123"}'

# Test the data fetcher
curl -X POST https://your-project.supabase.co/functions/v1/fetch-tennis-data \
  -H "Authorization: Bearer your_anon_key"
```

## 🔄 **How It Works**

### **Chatbot Flow**
1. User sends message with session ID
2. Function fetches conversation history from database
3. Gets current tennis data for context
4. Sends to ChatGPT API with context
5. Saves conversation to database
6. Returns AI response

### **Data Fetcher Flow**
1. **Primary**: Attempts to fetch from Tennis Live Data API
2. **Fallback**: If API fails, scrapes ATP website as backup
3. **Database**: Updates all tables with fresh data
4. **Statistics**: Updates dashboard statistics

## 📊 **API Endpoints**

### **Livescore API (Real Tennis Data)**
- **Live Scores**: `GET /api-client/scores/live.json?key={key}&secret={secret}&category=tennis`
- **Fixtures**: `GET /api-client/fixtures/matches.json?key={key}&secret={secret}&category=tennis`
- **Match Details**: `GET /api-client/scores/data.json?key={key}&secret={secret}&id={match_id}`

### **OpenAI API**
- **Chat Completions**: `POST /v1/chat/completions`
- **Model**: `gpt-4o-mini`
- **Max Tokens**: 500
- **Temperature**: 0.7

## 🛠️ **Troubleshooting**

### **Common Issues**

#### **1. OpenAI API Errors**
- Check API key is correct
- Verify account has credits
- Check rate limits

#### **2. Tennis API Errors**
- Verify API key is valid
- Check subscription status
- Review API documentation

#### **3. Function Deployment Issues**
- Ensure environment variables are set
- Check Supabase project permissions
- Verify function code syntax

### **Fallback Behavior**
- If 3rd party API fails → ATP website scraping
- If OpenAI fails → Basic error response
- If database fails → Log error and continue

## 💰 **Cost Considerations**

### **OpenAI API**
- **GPT-4o-mini**: ~$0.15 per 1M input tokens
- **Typical cost**: $0.01-0.05 per conversation
- **Monthly estimate**: $5-20 for moderate usage

### **Tennis Data API**
- **Tennis Live Data**: $50-200/month depending on plan
- **Sportradar**: $100-500/month for tennis data
- **Alternative**: Free tier available on some APIs

## 🔒 **Security Notes**

- **Never commit API keys** to version control
- **Use environment variables** for all sensitive data
- **Rotate API keys** regularly
- **Monitor API usage** for unexpected charges

## 📈 **Performance Benefits**

### **Before (Web Scraping)**
- ❌ Unreliable data extraction
- ❌ Slow parsing (2-5 seconds)
- ❌ Frequent failures
- ❌ Inaccurate data

### **After (3rd Party APIs)**
- ✅ Reliable data delivery
- ✅ Fast responses (<500ms)
- ✅ High success rate
- ✅ Accurate, structured data

## 🎯 **Next Steps**

1. **Get API keys** from OpenAI and Tennis Live Data
2. **Set environment variables** in Supabase
3. **Deploy updated functions**
4. **Test the integrations**
5. **Monitor performance** and costs
6. **Optimize** based on usage patterns

## 📞 **Support**

- **OpenAI**: [OpenAI Help Center](https://help.openai.com/)
- **Tennis Live Data**: [API Documentation](https://tennis-live-data.com/docs)
- **Supabase**: [Supabase Docs](https://supabase.com/docs)

---

**Note**: This setup provides a robust, scalable solution that eliminates the need for unreliable web scraping while maintaining fallback options for maximum reliability. 