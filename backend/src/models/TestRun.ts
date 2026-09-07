import { Schema, model } from 'mongoose';

export interface ITestRun {
  targetUrl: string;
  toolUsed: string;
  virtualUsers: number;
  durationMs?: number;
  status: 'pending' | 'running' | 'completed' | 'failed';
  results?: string;
  summary?: {
    totalRequests: number;
    successful: number;
    failed: number;
    avgLatency: number;
    minLatency: number;
    maxLatency: number;
    p95: number;
    p99: number;
    throughput: number;
    durationMs: number;
    cpuUsage?: number;    // NUEVO
    ramUsage?: number;    // NUEVO
    concurrency?: number; // NUEVO
  };
  rawOutput?: string;
  createdAt: Date;
  userId?: string; // Nuevo
}

const testRunSchema = new Schema<ITestRun>({
  targetUrl: { type: String, required: true },
  toolUsed: { type: String, required: true },
  userId: { type: String }, // Nuevo
  virtualUsers: { type: Number, default: 10 },
  durationMs: { type: Number },
  status: {
    type: String,
    enum: ['pending', 'running', 'completed', 'failed'],
    default: 'pending',
  },
  results: { type: String },
  summary: {
    type: Schema.Types.Mixed,
    default: undefined,
  },
  rawOutput: { type: String },
  createdAt: { type: Date, default: Date.now },
});

// Índice TTL: Los documentos se borran automáticamente tras 30 días
testRunSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

export const TestRun = model<ITestRun>('TestRun', testRunSchema);