"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const User_1 = require("./models/User");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const MONGO_URI = process.env.MONGO_URI || 'mongodb://admin:password123@database:27017/stress_tests?authSource=admin';
async function migrate() {
    try {
        await mongoose_1.default.connect(MONGO_URI);
        console.log('Connected to MongoDB');
        const users = await User_1.User.find({
            $or: [
                { failedLoginAttempts: { $exists: false } },
                { lockUntil: { $exists: false } }
            ]
        });
        console.log(`Found ${users.length} users to migrate.`);
        for (const user of users) {
            user.failedLoginAttempts = user.failedLoginAttempts || 0;
            user.lockUntil = user.lockUntil || null;
            await user.save();
            console.log(`Updated user: ${user.username}`);
        }
        console.log('Migration completed.');
        process.exit(0);
    }
    catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}
migrate();
//# sourceMappingURL=migrate.js.map