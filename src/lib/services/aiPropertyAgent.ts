import { OPENAI_API_KEY } from '@/lib/env';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where, addDoc, orderBy, limit, doc, getDoc, updateDoc } from 'firebase/firestore';
import { Booking, Property, Profile, AIAnalysisResult, AILog } from '@/types';

interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OpenAIResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

export class AIPropertyAgent {
  private apiKey: string;
  private apiUrl = 'https://api.openai.com/v1/chat/completions';

  constructor() {
    this.apiKey = OPENAI_API_KEY || '';
    if (!this.apiKey) {
      console.warn('⚠️ OpenAI API key not configured. AI features will be disabled.');
    }
  }

  /**
   * System prompt for the AI agent
   */
  private getSystemPrompt(): string {
    return `You are an AI Property Management Agent for Sia Moon. Your job is to analyze booking data, find the correct property and owner profile, suggest required actions, and provide detailed analysis.

CORE RESPONSIBILITIES:
1. Analyze booking data and match it to the correct property
2. Suggest appropriate actions (cleaning, maintenance, communication)
3. Provide confidence scores and detailed reasoning
4. Flag any issues or mismatches for human review

ANALYSIS CRITERIA:
- Property matching based on name, address, guest information, and dates
- Cross-reference with existing bookings to avoid duplicates
- Consider property capacity, amenities, and location
- Evaluate guest information and booking patterns

RESPONSE FORMAT:
Return a JSON object with:
- matched_property_id: string or null
- confidence_score: number (0-100)
- suggested_actions: string array
- summary: string
- reasoning: string
- status: "success" | "error" | "needs_review"

ACTIONS TO SUGGEST:
- schedule_cleaning: Schedule cleaning before/after guest stay
- prepare_welcome_package: Prepare welcome materials
- notify_owner: Notify property owner of booking
- schedule_maintenance: Schedule maintenance if needed
- verify_guest_info: Verify guest information
- check_availability: Double-check property availability
- prepare_keys: Prepare key handover process

Be precise, professional, and always optimize for automation while flagging uncertain cases for human review.`;
  }

  /**
   * Analyze a booking using OpenAI
   */
  async analyzeBooking(booking: Booking): Promise<AIAnalysisResult> {
    try {
      if (!this.apiKey) {
        throw new Error('OpenAI API key not configured');
      }

      // Get all relevant data
      const properties = await this.getAllProperties();
      const profiles = await this.getAllProfiles();
      const recentBookings = await this.getRecentBookings(30);

      // Prepare the analysis prompt
      const userPrompt = this.createAnalysisPrompt(booking, properties, profiles, recentBookings);

      // Call OpenAI API
      const response = await this.callOpenAI(userPrompt);

      // Parse and validate response
      const result = this.parseAIResponse(response);
      
      // Save the analysis to logs
      await this.saveAnalysisLog(booking.id, result);

      return result;
    } catch (error) {
      console.error('❌ AI Analysis Error:', error);
      
      const errorResult: AIAnalysisResult = {
        matched_property_id: null,
        confidence_score: 0,
        suggested_actions: ['manual_review'],
        summary: 'AI analysis failed - manual review required',
        reasoning: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        status: 'error',
        error_message: error instanceof Error ? error.message : 'Unknown error'
      };

      // Save error log
      await this.saveAnalysisLog(booking.id, errorResult);
      
      return errorResult;
    }
  }

  /**
   * Get all properties for analysis
   */
  private async getAllProperties(): Promise<Property[]> {
    try {
      if (!db) {
        console.error('Database not initialized');
        return [];
      }
      
      const propertiesRef = collection(db, 'properties');
      const q = query(propertiesRef, where('is_active', '==', true));
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Property[];
    } catch (error) {
      console.error('Error fetching properties:', error);
      return [];
    }
  }

  /**
   * Get all user profiles for analysis
   */
  private async getAllProfiles(): Promise<Profile[]> {
    try {
      if (!db) {
        console.error('Database not initialized');
        return [];
      }
      
      const profilesRef = collection(db, 'profiles');
      const snapshot = await getDocs(profilesRef);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Profile[];
    } catch (error) {
      console.error('Error fetching profiles:', error);
      return [];
    }
  }

  /**
   * Get recent bookings for context
   */
  private async getRecentBookings(days: number): Promise<Booking[]> {
    try {
      if (!db) {
        console.error('Database not initialized');
        return [];
      }
      
      const bookingsRef = collection(db, 'bookings');
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      
      const q = query(
        bookingsRef,
        where('created_at', '>=', cutoffDate.toISOString()),
        orderBy('created_at', 'desc'),
        limit(50)
      );
      
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Booking[];
    } catch (error) {
      console.error('Error fetching recent bookings:', error);
      return [];
    }
  }

  /**
   * Create analysis prompt with all relevant data
   */
  private createAnalysisPrompt(
    booking: Booking,
    properties: Property[],
    profiles: Profile[],
    recentBookings: Booking[]
  ): string {
    return `ANALYZE THIS BOOKING:

BOOKING DETAILS:
- ID: ${booking.id}
- Guest: ${booking.guest_name} (${booking.guest_email})
- Phone: ${booking.guest_phone || 'N/A'}
- Check-in: ${booking.check_in}
- Check-out: ${booking.check_out}
- Guests: ${booking.guests}
- Status: ${booking.status}
- Source: ${booking.source || 'Unknown'}
- Notes: ${booking.notes || 'None'}

AVAILABLE PROPERTIES:
${properties.map(p => `
- ID: ${p.id}
- Name: ${p.name}
- Address: ${p.address || 'N/A'}
- City: ${p.city || 'N/A'}
- Bedrooms: ${p.bedrooms}, Bathrooms: ${p.bathrooms}
- Max Guests: ${p.max_guests}
- Owner: ${p.owner_id}
`).join('')}

OWNER PROFILES:
${profiles.map(p => `
- ID: ${p.id}
- Name: ${p.full_name || 'N/A'}
- Email: ${p.email}
- Role: ${p.role}
`).join('')}

RECENT BOOKINGS (for duplicate check):
${recentBookings.slice(0, 10).map(b => `
- Guest: ${b.guest_name} (${b.guest_email})
- Property: ${b.property_id}
- Dates: ${b.check_in} to ${b.check_out}
- Status: ${b.status}
`).join('')}

TASK: Analyze this booking and return a JSON response with your analysis.`;
  }

  /**
   * Call OpenAI API
   */
  private async callOpenAI(userPrompt: string): Promise<string> {
    const messages: OpenAIMessage[] = [
      { role: 'system', content: this.getSystemPrompt() },
      { role: 'user', content: userPrompt }
    ];

    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4-turbo',
        messages: messages,
        max_tokens: 2000,
        temperature: 0.3
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const data: OpenAIResponse = await response.json();
    return data.choices[0]?.message?.content || '';
  }

  /**
   * Parse AI response and validate
   */
  private parseAIResponse(response: string): AIAnalysisResult {
    try {
      // Try to extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in AI response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      // Validate required fields
      const result: AIAnalysisResult = {
        matched_property_id: parsed.matched_property_id || null,
        confidence_score: Math.min(Math.max(parsed.confidence_score || 0, 0), 100),
        suggested_actions: Array.isArray(parsed.suggested_actions) ? parsed.suggested_actions : [],
        summary: parsed.summary || 'No summary provided',
        reasoning: parsed.reasoning || 'No reasoning provided',
        status: ['success', 'error', 'needs_review'].includes(parsed.status) ? parsed.status : 'needs_review'
      };

      // Add review flag for low confidence
      if (result.confidence_score < 70) {
        result.status = 'needs_review';
      }

      return result;
    } catch (error) {
      console.error('Error parsing AI response:', error);
      return {
        matched_property_id: null,
        confidence_score: 0,
        suggested_actions: ['manual_review'],
        summary: 'Failed to parse AI response - manual review required',
        reasoning: `Parse error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        status: 'error'
      };
    }
  }

  /**
   * Save analysis log to Firebase
   */
  private async saveAnalysisLog(bookingId: string, result: AIAnalysisResult): Promise<void> {
    try {
      if (!db) {
        console.error('Database not initialized');
        return;
      }
      
      const logData: Omit<AILog, 'id'> = {
        booking_id: bookingId,
        property_id: result.matched_property_id,
        confidence_score: result.confidence_score,
        ai_summary: result.summary,
        suggested_actions: result.suggested_actions,
        status: result.status,
        ai_reasoning: result.reasoning,
        feedback: null,
        feedback_comment: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const logsRef = collection(db, 'ai_logs');
      await addDoc(logsRef, logData);
      
      console.log('✅ AI analysis log saved successfully');
    } catch (error) {
      console.error('❌ Error saving AI analysis log:', error);
      // Don't throw here - we don't want to fail the entire analysis if logging fails
    }
  }

  /**
   * Get AI logs with pagination and filtering
   */
  async getAILogs(
    filters: {
      status?: 'success' | 'error' | 'needs_review';
      limit?: number;
      startAfter?: string;
    } = {}
  ): Promise<AILog[]> {
    try {
      if (!db) {
        console.error('Database not initialized');
        return [];
      }
      
      const logsRef = collection(db, 'ai_logs');
      let q = query(logsRef, orderBy('created_at', 'desc'));

      if (filters.status) {
        q = query(q, where('status', '==', filters.status));
      }

      if (filters.limit) {
        q = query(q, limit(filters.limit));
      }

      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as AILog[];
    } catch (error) {
      console.error('Error fetching AI logs:', error);
      return [];
    }
  }

  /**
   * Update AI log feedback
   */
  async updateLogFeedback(
    logId: string,
    feedback: 'positive' | 'negative',
    comment?: string
  ): Promise<void> {
    try {
      if (!db) {
        console.error('Database not initialized');
        return;
      }
      
      const logRef = doc(db, 'ai_logs', logId);
      await updateDoc(logRef, {
        feedback,
        feedback_comment: comment || null,
        updated_at: new Date().toISOString()
      });
      
      console.log('✅ AI log feedback updated successfully');
    } catch (error) {
      console.error('❌ Error updating AI log feedback:', error);
      throw error;
    }
  }

  /**
   * Get AI log by ID
   */
  async getAILogById(logId: string): Promise<AILog | null> {
    try {
      if (!db) {
        console.error('Database not initialized');
        return null;
      }
      
      const logRef = doc(db, 'ai_logs', logId);
      const docSnap = await getDoc(logRef);
      
      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data()
        } as AILog;
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching AI log:', error);
      return null;
    }
  }
}

// Export singleton instance
export const aiPropertyAgent = new AIPropertyAgent();
