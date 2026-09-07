import mongoose from 'mongoose';
import { User } from './models/User';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://admin:password123@database:27017/stress_tests?authSource=admin';

async function migrate() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');

        const users = await User.find({ 
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
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

migrate();
