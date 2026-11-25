import { Router } from 'express';
import mongoose from 'mongoose';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Ticket from '../models/Ticket.js';
import { retrieveRelevantNotes } from '../services/retrieval.js';

const router = Router();

router.post('/analyze', async (req, res, next) => {
  try {
    const { ticketId } = req.body;
    if (!mongoose.isValidObjectId(ticketId)) return res.status(400).json({ message: 'A valid ticketId is required.' });
    if (!process.env.GEMINI_API_KEY) return res.status(503).json({ message: 'Gemini API key is not configured on the server.' });

    const ticket = await Ticket.findById(ticketId);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found.' });

    const notes = retrieveRelevantNotes(`${ticket.title} ${ticket.description}`);
    const context = notes.length
      ? notes.map((note, index) => `${index + 1}. ${note.title}: ${note.content}`).join('\n')
      : 'No matching internal knowledge-base notes were found. Do not invent company policies or technical facts.';

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-3.8-flash' });
    const prompt = `You are DevAssist AI, a careful technical support copilot.
Analyze the support ticket using the retrieved notes as optional context.
Do not claim that you performed actions. Do not invent facts. If information is missing, say what should be checked.
Return ONLY valid JSON with exactly these keys:
{"summary":"2 sentence summary","category":"Bug|Account|API|Performance|Database|Other","priority":"Low|Medium|High|Critical","suggestedReply":"Helpful concise reply to the requester","reasoning":"Brief reason for category and priority"}
Ticket title: ${ticket.title}
Ticket description: ${ticket.description}
Retrieved knowledge-base notes:
${context}`;

    const result = await model.generateContent(prompt);
    const raw = result.response.text().replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(raw);
    const allowedPriorities = ['Low', 'Medium', 'High', 'Critical'];
    if (!allowedPriorities.includes(parsed.priority)) parsed.priority = 'Medium';
    const analysis = {
      summary: String(parsed.summary || ''),
      category: String(parsed.category || 'Other'),
      priority: parsed.priority,
      suggestedReply: String(parsed.suggestedReply || ''),
      sources: notes.map(note => note.title)
    };
    ticket.aiAnalysis = analysis;
    await ticket.save();
    res.json({ analysis, reasoning: String(parsed.reasoning || ''), retrievedNotes: notes.map(note => note.title) });
  } catch (error) {
    if (error instanceof SyntaxError) return res.status(502).json({ message: 'AI returned an unreadable response. Please try again.' });
    next(error);
  }
});

export default router;
