import mongoose from 'mongoose';
export declare const TestResult: mongoose.Model<{
    createdAt: NativeDate;
    toolName: string;
    logContent: string;
    metrics?: {
        errors?: number;
        rps?: number;
        latency?: number;
    };
}, {}, {}, {
    id: string;
}, mongoose.Document<unknown, {}, {
    createdAt: NativeDate;
    toolName: string;
    logContent: string;
    metrics?: {
        errors?: number;
        rps?: number;
        latency?: number;
    };
}, {
    id: string;
}, mongoose.DefaultSchemaOptions> & Omit<{
    createdAt: NativeDate;
    toolName: string;
    logContent: string;
    metrics?: {
        errors?: number;
        rps?: number;
        latency?: number;
    };
} & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any, any>, {}, {}, {}, {}, mongoose.DefaultSchemaOptions, {
    createdAt: NativeDate;
    toolName: string;
    logContent: string;
    metrics?: {
        errors?: number;
        rps?: number;
        latency?: number;
    };
}, mongoose.Document<unknown, {}, {
    createdAt: NativeDate;
    toolName: string;
    logContent: string;
    metrics?: {
        errors?: number;
        rps?: number;
        latency?: number;
    };
}, {
    id: string;
}, mongoose.DefaultSchemaOptions> & Omit<{
    createdAt: NativeDate;
    toolName: string;
    logContent: string;
    metrics?: {
        errors?: number;
        rps?: number;
        latency?: number;
    };
} & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, unknown, {
    createdAt: NativeDate;
    toolName: string;
    logContent: string;
    metrics?: {
        errors?: number;
        rps?: number;
        latency?: number;
    };
} & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>, {
    createdAt: NativeDate;
    toolName: string;
    logContent: string;
    metrics?: {
        errors?: number;
        rps?: number;
        latency?: number;
    };
} & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>;
//# sourceMappingURL=TestResult.d.ts.map