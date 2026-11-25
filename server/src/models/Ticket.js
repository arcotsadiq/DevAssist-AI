
import mongoose from 'mongoose';

const ticketSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 120
  },

  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 5000
  },

  requester: {
    type: String,
    trim: true,
    maxlength: 100,
    default: 'Demo user'
  },

  status: {
    type: String,
    enum: ['Open', 'In Progress', 'Resolved'],
    default: 'Open'
  },

  aiAnalysis: {
    summary: String,
    category: String,
    priority: String,
    suggestedReply: String,

    // Structured AI reasoning
    categoryReason: String,
    priorityReason: String,
    recommendedAction: String,

    // Backward compatibility
    reasoning: String,

    sources: {
      type: [String],
      default: []
    },

    source: String
  }

}, { timestamps: true });

export default mongoose.model('Ticket', ticketSchema);
