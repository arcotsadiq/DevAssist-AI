
import { Router } from 'express';
import mongoose from 'mongoose';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Ticket from '../models/Ticket.js';
import { retrieveRelevantNotes } from '../services/retrieval.js';

const router = Router();

const ALLOWED_CATEGORIES = [
  'Bug',
  'Account',
  'API',
  'Performance',
  'Database',
  'Other'
];

const ALLOWED_PRIORITIES = [
  'Low',
  'Medium',
  'High',
  'Critical'
];

function createMockAnalysis(ticket) {
  const title = ticket.title || '';
  const description = ticket.description || '';
  const text = `${title} ${description}`.toLowerCase();

  let category = 'Other';
  let priority = 'Medium';

  // 1. Identify category.
  if (
    /\b(login|log in|password|sign in|sign-in|account|logout|authentication)\b/.test(text)
  ) {
    category = 'Account';
  } else if (
    /\b(database|mongodb|mongo|query|collection|schema|mongoose)\b/.test(text)
  ) {
    category = 'Database';
  } else if (
    /\b(api|endpoint|http request|rest api|request failed|response code)\b/.test(text)
  ) {
    category = 'API';
  } else if (
    /\b(slow|latency|performance|loading|timeout|timed out|lagging|takes too long)\b/.test(text)
  ) {
    category = 'Performance';
  } else if (
    /\b(bug|error|crash|exception|incorrect|not working|broken|fails unexpectedly)\b/.test(text)
  ) {
    category = 'Bug';
  }

  // 2. Assess priority.
  const criticalPattern =
    /\b(production outage|system outage|service down|system down|all users affected|entire system unavailable|data loss|data corruption|security breach)\b/;

  const highPattern =
    /\b(urgent|completely blocked|cannot access|unable to access|login blocked|payment failed|repeated crash|business critical|service unavailable|multiple users affected)\b/;

  const lowPattern =
    /\b(minor|cosmetic|typo|spelling|colour|color|suggestion|feature request|enhancement)\b/;

  if (criticalPattern.test(text)) {
    priority = 'Critical';
  } else if (highPattern.test(text)) {
    priority = 'High';
  } else if (lowPattern.test(text)) {
    priority = 'Low';
  }

  // 3. Suggested responses.
  const replies = {
    Account:
      'Our support team will investigate the account or login issue. Please confirm whether you see any error message and whether the issue occurs consistently.',

    Database:
      'Our technical team will investigate the database issue, including the relevant queries and data operations. We will review the reported behaviour and follow up with our findings.',

    API:
      'Our development team will review the API request and response behaviour. If available, please share the affected endpoint, response status code and approximate time of the issue.',

    Performance:
      'Our technical team will investigate the reported performance issue. Please let us know which page or operation is affected and whether the delay happens consistently.',

    Bug:
      'Our development team will investigate the reported behaviour. If possible, please share the steps to reproduce the issue and the expected result.',

    Other:
      'Our support team has received your request and will review the reported issue. We may contact you if additional information is required.'
  };

  // 4. Category explanation.
  const categoryReasons = {
    Account:
      'The ticket contains account, login or authentication-related terms.',
    Database:
      'The ticket contains database or data-query-related terms.',
    API:
      'The ticket contains API, endpoint or request-related terms.',
    Performance:
      'The ticket describes speed, loading or response-time concerns.',
    Bug:
      'The ticket describes unexpected application behaviour or an error.',
    Other:
      'The ticket does not contain enough specific information to identify a category.'
  };

  // 5. Priority explanation.
  let priorityReason =
    'The description does not indicate a clearly urgent or critical impact, so Medium priority is assigned.';

  if (priority === 'Critical') {
    priorityReason =
      'The description indicates a potentially severe outage, widespread impact, data loss or security incident. Immediate investigation is recommended.';
  } else if (priority === 'High') {
    priorityReason =
      'The description indicates a significant issue that may block an important user operation.';
  } else if (priority === 'Low') {
    priorityReason =
      'The description indicates a minor issue, cosmetic change or feature suggestion.';
  }

  // 6. Recommended next action.
  const recommendedActions = {
    Account:
      'Confirm the affected account, check authentication logs and review the login flow without requesting the user’s password.',
    Database:
      'Review database connectivity, relevant query logs and recent schema or data-operation changes.',
    API:
      'Check the affected endpoint, HTTP response status, backend logs and recent API changes.',
    Performance:
      'Identify the slow operation and review response times, server load and relevant performance logs.',
    Bug:
      'Reproduce the reported behaviour, compare expected and actual results, and inspect relevant application logs.',
    Other:
      'Review the ticket details and request additional information if the reported issue is unclear.'
  };

  return {
    summary: `${title}. ${description.slice(0, 250)}${description.length > 250 ? '...' : ''}`,

    category,
    priority,

    suggestedReply: `Hello,

Thank you for reporting this issue. ${replies[category]}

Our team will review the information and provide an update. Thank you for your patience.`,

    categoryReason: categoryReasons[category],
    priorityReason,
    recommendedAction: recommendedActions[category],

    // Keep the old field for backward compatibility.
    reasoning: `Category: ${categoryReasons[category]} Priority: ${priorityReason} This analysis uses local rule-based matching and is not generated by Gemini.`
  };
}

function validateAnalysis(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return false;
  }

  return (
    ALLOWED_CATEGORIES.includes(data.category) &&
    ALLOWED_PRIORITIES.includes(data.priority) &&
    typeof data.summary === 'string' &&
    data.summary.trim().length > 0 &&
    typeof data.suggestedReply === 'string' &&
    data.suggestedReply.trim().length > 0 &&
    typeof data.categoryReason === 'string' &&
    data.categoryReason.trim().length > 0 &&
    typeof data.priorityReason === 'string' &&
    data.priorityReason.trim().length > 0 &&
    typeof data.recommendedAction === 'string' &&
    data.recommendedAction.trim().length > 0
  );
}

router.post('/analyze', async (req, res, next) => {
  try {
    const { ticketId } = req.body || {};

    if (!mongoose.isValidObjectId(ticketId)) {
      return res.status(400).json({
        message: 'A valid ticketId is required.'
      });
    }

    const ticket = await Ticket.findById(ticketId);

    if (!ticket) {
      return res.status(404).json({
        message: 'Ticket not found.'
      });
    }

    const notes = retrieveRelevantNotes(
      `${ticket.title} ${ticket.description}`
    );

    let parsed;
    let source = 'Gemini';

    if (process.env.GEMINI_API_KEY) {
      try {
        const genAI = new GoogleGenerativeAI(
          process.env.GEMINI_API_KEY
        );

        const model = genAI.getGenerativeModel({
          model: 'gemini-3.8-flash'
        });

        const context = notes.length
          ? notes.map((note, index) =>
              `${index + 1}. ${note.title}: ${note.content}`
            ).join('\n')
          : 'No matching internal knowledge-base notes were found. Do not invent company policies or technical facts.';

        const prompt = `You are DevAssist AI, a careful technical support copilot.

Analyze the support ticket using the retrieved knowledge-base notes as optional context.

Instructions:
- Identify the most appropriate category.
- Assess priority based on actual impact and urgency.
- Do not classify every word such as "unable" or "error" as Critical.
- Give a useful summary.
- Write a context-aware and professional suggested response.
- Explain why the category was selected.
- Explain why the priority was selected.
- Recommend a practical next action for the support agent.
- Never claim that you have fixed or investigated the issue.
- Never invent facts or company policies.
- Use only the allowed category and priority values.

Return ONLY valid JSON with exactly these keys:
{
  "summary": "Brief ticket summary",
  "category": "Bug|Account|API|Performance|Database|Other",
  "priority": "Low|Medium|High|Critical",
  "suggestedReply": "Professional response to the requester",
  "categoryReason": "Explanation of category selection",
  "priorityReason": "Explanation of priority selection",
  "recommendedAction": "Practical next action for the support agent"
}

Ticket title: ${ticket.title}
Ticket description: ${ticket.description}

Retrieved knowledge-base notes:
${context}`;

        const result = await model.generateContent(prompt);

        const raw = result.response.text()
          .replace(/```json|```/g, '')
          .trim();

        parsed = JSON.parse(raw);

        if (!validateAnalysis(parsed)) {
          throw new Error('Gemini returned an invalid analysis format.');
        }

        parsed.reasoning =
          `Category: ${parsed.categoryReason} Priority: ${parsed.priorityReason}`;

      } catch (error) {
        console.warn(
          'Gemini unavailable. Using local demo analysis:',
          error.message
        );

        parsed = createMockAnalysis(ticket);
        source = 'Local Demo AI';
      }
    } else {
      parsed = createMockAnalysis(ticket);
      source = 'Local Demo AI';
    }

    const analysis = {
      summary: String(parsed.summary),
      category: parsed.category,
      priority: parsed.priority,
      suggestedReply: String(parsed.suggestedReply),

      categoryReason: String(parsed.categoryReason || ''),
      priorityReason: String(parsed.priorityReason || ''),
      recommendedAction: String(parsed.recommendedAction || ''),

      reasoning: String(parsed.reasoning || ''),
      sources: notes.map(note => note.title),
      source
    };

    ticket.aiAnalysis = analysis;
    await ticket.save();

    return res.json({
      analysis,
      reasoning: analysis.reasoning,
      retrievedNotes: notes.map(note => note.title),
      source
    });

  } catch (error) {
    next(error);
  }
});

export default router;
