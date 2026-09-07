import mongoose from 'mongoose';

const TestResultSchema = new mongoose.Schema({
  toolName: { type: String, required: true },
  category: { type: String, required: true }, // API, database, websocket, etc.
  endpoint: { type: String },
  method: { type: String },
  logContent: { type: String, required: true },
  metrics: { type: mongoose.Schema.Types.Mixed, default: {} },
  createdAt: { type: Date, default: Date.now, expires: '45d' },
  userId: { type: String } // Nuevo
});

export const TestResult = mongoose.model('TestResult', TestResultSchema);
