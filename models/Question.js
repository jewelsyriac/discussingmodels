import mongoose from 'mongoose';

const AnswerSchema = new mongoose.Schema({
  text: String,
  explanation: String,
  model: String,
  timestamp: { type: Date, default: Date.now },
});

const ArbitrationSchema = new mongoose.Schema({
  chosen: Number,
  reason: String,
  timestamp: { type: Date, default: Date.now },
});

const QuestionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  ambiguityFeedback: String,
  answers: [AnswerSchema],
  arbitration: ArbitrationSchema,
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Question || mongoose.model('Question', QuestionSchema); 