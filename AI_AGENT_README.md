# AI Property Management Agent

## 🤖 Overview

The AI Property Management Agent is an intelligent automation system that uses OpenAI's GPT-4 to analyze incoming booking data, match bookings to properties, and suggest automated actions. This system is designed to streamline property management workflows and reduce manual processing time.

## 🎯 Features

### Core Functionality
- **Intelligent Booking Analysis**: Analyzes booking data using AI to understand guest requirements
- **Property Matching**: Automatically matches bookings to the most suitable properties
- **Action Suggestions**: Recommends actions like cleaning, maintenance, and guest communication
- **Confidence Scoring**: Provides confidence levels for all AI decisions
- **Automated Logging**: Logs all AI decisions and reasoning for review

### Admin Interface
- **AI Log Dashboard**: Review all AI analysis results with filtering and search
- **Feedback System**: Provide thumbs up/down feedback on AI decisions
- **Test Interface**: Run AI analysis on test bookings for validation
- **Performance Analytics**: Track AI accuracy and performance over time

### Integration
- **HTTP API**: RESTful endpoints for triggering AI analysis
- **Firebase Integration**: Logs stored in Firestore for persistence
- **Real-time Updates**: Live updates of AI analysis results

## 🚀 Getting Started

### Prerequisites
- Node.js 20.18.0 or higher
- OpenAI API key
- Firebase project with Firestore enabled

### Environment Setup
1. Copy `.env.example` to `.env.local`
2. Add your OpenAI API key:
   ```bash
   OPENAI_API_KEY=your_openai_api_key_here
   ```
3. Configure Firebase settings (see main README for Firebase setup)

### Installation
```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

## 📊 API Endpoints

### POST /api/ai-booking-analysis
Analyzes a booking using AI and returns suggestions.

**Request Body:**
```json
{
  "booking_id": "booking_123",
  // OR
  "booking_data": {
    "guest_name": "John Doe",
    "guest_email": "john@example.com",
    "check_in": "2025-08-15",
    "check_out": "2025-08-20",
    "guests": 4,
    "total_amount": 2500,
    "currency": "USD",
    "source": "Airbnb",
    "notes": "Family vacation"
  }
}
```

**Response:**
```json
{
  "success": true,
  "analysis": {
    "matched_property_id": "property_456",
    "confidence_score": 85,
    "suggested_actions": [
      "schedule_cleaning",
      "prepare_welcome_package",
      "notify_owner"
    ],
    "summary": "High confidence match for Ocean View Villa",
    "reasoning": "Guest requirements match property amenities...",
    "status": "success"
  },
  "log_id": "log_789"
}
```

### GET /api/ai-logs
Retrieves AI analysis logs with optional filtering.

**Query Parameters:**
- `status`: Filter by status (success, error, needs_review)
- `limit`: Number of results to return
- `offset`: Pagination offset

## 🎛️ Admin Interface

### AI Log Dashboard
- **URL**: `/admin/ai-log`
- **Features**:
  - View all AI analysis results
  - Filter by status, date, confidence score
  - Search by guest name or property
  - Provide feedback on AI decisions
  - View detailed analysis reasoning

### AI Test Interface
- **URL**: `/admin/ai-booking-analysis-test`
- **Features**:
  - Run AI analysis on test bookings
  - Create custom test scenarios
  - View recent booking analysis
  - Test different booking data formats

## 🔧 Configuration

### AI Agent Settings
The AI agent can be configured through environment variables:

```bash
# Required
OPENAI_API_KEY=your_openai_api_key

# Optional - AI behavior tuning
AI_CONFIDENCE_THRESHOLD=70
AI_MAX_RETRIES=3
AI_TIMEOUT_SECONDS=30
```

### System Prompt Customization
The AI system prompt can be customized in `src/lib/services/aiPropertyAgent.ts`:

```typescript
private getSystemPrompt(): string {
  return `You are an AI Property Management Agent for [Your Company].
  Your job is to analyze booking data and provide intelligent recommendations...`;
}
```

## 📈 Performance Monitoring

### Key Metrics
- **Response Time**: Average AI analysis time
- **Accuracy**: Feedback-based accuracy scoring
- **Confidence Distribution**: Distribution of confidence scores
- **Action Effectiveness**: Success rate of suggested actions

### Monitoring Tools
- **Admin Dashboard**: Real-time performance metrics
- **AI Logs**: Detailed analysis history
- **Feedback Analytics**: User satisfaction tracking

## 🔄 Workflow Integration

### Automatic Booking Processing
1. New booking received via webhook
2. AI agent analyzes booking data
3. Property matching and action suggestions generated
4. Results logged to Firebase
5. Automated actions triggered (optional)
6. Admin notified of results

### Manual Processing
1. Admin accesses test interface
2. Inputs booking data or selects existing booking
3. AI analysis runs in real-time
4. Results displayed with confidence scores
5. Admin can provide feedback
6. Actions can be manually triggered

## 🚨 Error Handling

### Common Issues
- **API Key Missing**: Check environment variable configuration
- **Low Confidence**: AI requires more data for accurate matching
- **Network Errors**: Retry mechanism handles temporary failures
- **Invalid Data**: Validation ensures data integrity

### Debugging
- **Development Mode**: Detailed logging in development
- **Test Interface**: Validate AI responses with test data
- **Error Logs**: Comprehensive error tracking in Firebase

## 🔐 Security

### Data Protection
- **API Keys**: Stored as environment variables
- **Data Encryption**: All data encrypted in transit and at rest
- **Access Control**: Admin-only access to AI interfaces
- **Audit Logging**: All AI decisions logged for compliance

### Privacy
- **Guest Data**: Handled according to privacy policy
- **Data Retention**: Logs automatically purged after retention period
- **Anonymization**: Personal data anonymized in logs

## 📚 Best Practices

### AI Prompt Engineering
- **Clear Instructions**: Specific, actionable prompts
- **Context Provision**: Include relevant property and booking data
- **Output Formatting**: Structured JSON responses
- **Error Handling**: Graceful degradation for edge cases

### Performance Optimization
- **Caching**: Cache frequently accessed data
- **Batching**: Process multiple bookings efficiently
- **Async Processing**: Non-blocking AI analysis
- **Resource Management**: Monitor API usage and costs

### Quality Assurance
- **Regular Testing**: Use test interface for validation
- **Feedback Loop**: Incorporate admin feedback
- **Continuous Improvement**: Monitor and adjust prompts
- **A/B Testing**: Test different AI configurations

## 🛠️ Development

### Testing
```bash
# Run AI agent tests
node scripts/test-ai-agent.js

# Run unit tests
npm test

# Run integration tests
npm run test:integration
```

### Code Structure
```
src/
├── lib/services/
│   └── aiPropertyAgent.ts    # Main AI agent service
├── app/api/
│   └── ai-booking-analysis/  # API endpoints
├── app/admin/
│   ├── ai-log/              # Admin log interface
│   └── ai-booking-analysis-test/  # Test interface
└── types/
    └── index.ts             # Type definitions
```

### Key Files
- `aiPropertyAgent.ts`: Core AI service implementation
- `route.ts`: API endpoint handlers
- `ai-log/page.tsx`: Admin log dashboard
- `ai-booking-analysis-test/page.tsx`: Test interface

## 🚀 Deployment

### Production Checklist
- [ ] OpenAI API key configured
- [ ] Firebase project set up
- [ ] Environment variables configured
- [ ] AI agent tested with real data
- [ ] Admin access configured
- [ ] Monitoring set up
- [ ] Error handling tested
- [ ] Security review completed

### Monitoring
- Monitor OpenAI API usage and costs
- Track AI accuracy through feedback
- Monitor response times and errors
- Set up alerts for failures

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create feature branch
3. Implement changes
4. Add tests
5. Update documentation
6. Submit pull request

### Code Standards
- TypeScript strict mode
- ESLint configuration
- Prettier formatting
- Jest testing framework

## 📞 Support

### Documentation
- [OpenAI API Documentation](https://platform.openai.com/docs)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)

### Common Issues
- **AI Not Responding**: Check OpenAI API key and network
- **Low Accuracy**: Review and improve system prompts
- **Performance Issues**: Monitor API usage and optimize
- **Integration Issues**: Check Firebase configuration

### Getting Help
- Review logs in admin interface
- Check console for error messages
- Test with known good data
- Contact development team

---

## 📄 License

This AI Property Management Agent is part of the Villa Management System and is subject to the same licensing terms.
