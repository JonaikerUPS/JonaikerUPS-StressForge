import { Schema } from 'mongoose';
export declare const User: import("mongoose").Model<{
    id: string;
    createdAt: NativeDate;
    email: string;
    username: string;
    failedLoginAttempts: number;
    passwordHash?: string;
    googleId?: string;
    lockUntil?: NativeDate;
}, {}, {}, {}, import("mongoose").Document<unknown, {}, {
    id: string;
    createdAt: NativeDate;
    email: string;
    username: string;
    failedLoginAttempts: number;
    passwordHash?: string;
    googleId?: string;
    lockUntil?: NativeDate;
}, {}, import("mongoose").DefaultSchemaOptions> & {
    id: string;
    createdAt: NativeDate;
    email: string;
    username: string;
    failedLoginAttempts: number;
    passwordHash?: string;
    googleId?: string;
    lockUntil?: NativeDate;
} & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, Schema<any, import("mongoose").Model<any, any, any, any, any, any, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, {
    id: string;
    createdAt: NativeDate;
    email: string;
    username: string;
    failedLoginAttempts: number;
    passwordHash?: string;
    googleId?: string;
    lockUntil?: NativeDate;
}, import("mongoose").Document<unknown, {}, {
    id: string;
    createdAt: NativeDate;
    email: string;
    username: string;
    failedLoginAttempts: number;
    passwordHash?: string;
    googleId?: string;
    lockUntil?: NativeDate;
}, {}, import("mongoose").DefaultSchemaOptions> & {
    id: string;
    createdAt: NativeDate;
    email: string;
    username: string;
    failedLoginAttempts: number;
    passwordHash?: string;
    googleId?: string;
    lockUntil?: NativeDate;
} & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, unknown, {
    id: string;
    createdAt: NativeDate;
    email: string;
    username: string;
    failedLoginAttempts: number;
    passwordHash?: string;
    googleId?: string;
    lockUntil?: NativeDate;
} & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>, {
    id: string;
    createdAt: NativeDate;
    email: string;
    username: string;
    failedLoginAttempts: number;
    passwordHash?: string;
    googleId?: string;
    lockUntil?: NativeDate;
} & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>;
//# sourceMappingURL=User.d.ts.map