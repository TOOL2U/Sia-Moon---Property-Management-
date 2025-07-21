# Multi-Model AI Agent Setup Guide

## 🎯 Overview

This system provides intelligent routing between multiple AI models (ChatGPT and Claude) with automatic task-based selection and manual override capabilities.

## 🔧 Environment Configuration

### Required API Keys

Add these to your `.env.local` file:

```env
# OpenAI Configuration
OPENAI_API_KEY=sk-your-openai-api-key-here

# Anthropic Configuration  
ANTHROPIC_API_KEY=claude-your-anthropic-api-key-here

# Optional: Model availability flags (for UI)
NEXT_PUBLIC_OPENAI_AVAILABLE=true
NEXT_PUBLIC_ANTHROPIC_AVAILABLE=true
```

### API Key Setup Instructions

#### 1. OpenAI API Key
1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Create a new API key
3. Copy the key (starts with `sk-`)
4. Add to `.env.local` as `OPENAI_API_KEY`

#### 2. Anthropic API Key
1. Go to [Anthropic Console](https://console.anthropic.com/)
2. Create a new API key
3. Copy the key (starts with `claude-`)
4. Add to `.env.local` as `ANTHROPIC_API_KEY`

## 🚀 Features

### Intelligent Routing
- **Auto Mode**: Automatically selects the best model based on message content
- **Manual Override**: Force specific model selection
- **Task-Based Routing**: Different models for different task types

### Model Specializations

#### ChatGPT (GPT-4) - Best for:
- ✅ **Action Tasks**: Creating, updating, executing commands
- ✅ **Creative Tasks**: Writing, composing, generating content
- ✅ **General Queries**: Default for most interactions
- ✅ **Command Execution**: Operational tasks and automation

#### Claude (Sonnet) - Best for:
- ✅ **Analysis Tasks**: Data analysis, performance review, insights
- ✅ **Planning Tasks**: Strategic planning, scheduling, optimization
- ✅ **Technical Tasks**: Debugging, configuration, troubleshooting
- ✅ **Complex Reasoning**: Multi-step logical analysis

### Routing Logic Examples

```typescript
// Analysis → Claude
"Analyze our booking performance this quarter"

// Action → ChatGPT  
"Create a new booking for Villa Paradise"

// Planning → Claude
"Plan the optimal staff schedule for next week"

// Creative → ChatGPT
"Write a welcome message for guests"

// Technical → Claude
"Debug the calendar integration issue"
```

## 🎮 Usage

### 1. Access AI Chat
1. Navigate to **AI Dashboard** → **AI Chat** tab
2. Select model from dropdown:
   - **⚡ Auto (Smart Routing)** - Recommended
   - **🤖 ChatGPT (GPT-4)** - Force ChatGPT
   - **🧠 Claude (Sonnet)** - Force Claude

### 2. Message Examples

#### For Analysis (will route to Claude):
```
"Analyze the financial performance of our bookings"
"Review staff workload distribution and efficiency"
"Examine booking patterns compared to last year"
```

#### For Actions (will route to ChatGPT):
```
"Create a booking for Villa Sunset on July 25th"
"Assign John to the cleaning job at Villa Paradise"
"Update booking status and send notifications"
```

#### For Planning (will route to Claude):
```
"Plan optimal staff schedule for next week"
"Develop strategy to improve conversion rates"
"Organize maintenance to minimize disruption"
```

### 3. Model Information Display
- Each AI response shows which model was used
- Response time and confidence scores displayed
- Model badges: 🤖 GPT-4, 🧠 Claude, ⚡ Auto

## 📊 Logging & Analytics

### Multi-Model Logs
- All interactions logged to `/ai_multi_model_logs`
- Includes model selection reasoning
- Performance metrics and cost tracking
- Command execution results

### Usage Statistics
- Model usage distribution
- Average response times per model
- Success rates and confidence scores
- Cost analysis and optimization

## 🛡️ Safety & Fallbacks

### Automatic Fallbacks
- If primary model unavailable, automatically falls back
- Graceful error handling with user feedback
- Rate limiting and usage monitoring

### Model Availability
- Real-time availability checking
- UI updates based on API key configuration
- Fallback to available models when needed

## 🧪 Testing

### Run Test Suite
```bash
# Test routing logic
npm run test:multi-model

# Test individual components
npm run test:ai-router
npm run test:multi-model-client
```

### Manual Testing
1. Open AI Dashboard → AI Chat
2. Try different message types with Auto mode
3. Verify correct model selection
4. Test manual model override
5. Check response quality and timing

## 📈 Performance Optimization

### Response Time Targets
- **ChatGPT**: ~2-4 seconds average
- **Claude**: ~3-5 seconds average
- **Routing Decision**: <10ms

### Cost Optimization
- Automatic cost tracking per interaction
- Model selection based on cost-effectiveness
- Usage analytics for budget planning

## 🔧 Troubleshooting

### Common Issues

#### "Model not available" error
- Check API keys in `.env.local`
- Verify API key permissions
- Check account billing status

#### Slow responses
- Check internet connection
- Verify API rate limits
- Monitor server performance

#### Incorrect routing
- Review message content for keywords
- Check routing confidence scores
- Use manual override if needed

### Debug Mode
Enable detailed logging:
```env
DEBUG_AI_ROUTING=true
DEBUG_MULTI_MODEL=true
```

## 🎉 Success Metrics

### Expected Performance
- **Routing Accuracy**: >85% correct model selection
- **Response Quality**: High relevance to task type
- **System Reliability**: >99% uptime
- **User Satisfaction**: Improved task completion

### Monitoring
- Real-time performance dashboards
- Usage analytics and trends
- Cost tracking and optimization
- Error monitoring and alerts

---

## 🚀 Ready to Use!

Your multi-model AI system is now configured and ready for intelligent task routing. The system will automatically select the best model for each task while providing full manual control when needed.

**Next Steps:**
1. Add your API keys to `.env.local`
2. Restart the development server
3. Open AI Dashboard → AI Chat
4. Start chatting with intelligent model routing!
