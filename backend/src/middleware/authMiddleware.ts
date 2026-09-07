import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { trackActiveUser } from '../services/sessionService';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token' });

    try {
        const parts = token.split('.');
        if (parts.length !== 3) throw new Error('Invalid token');

        const signature = crypto.createHmac('sha256', JWT_SECRET).update(`${parts[0]}.${parts[1]}`).digest('base64url');
        if (signature !== parts[2]) throw new Error('Invalid signature');

        const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
        if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) throw new Error('Token expired');

        (req as any).user = payload;
        
        // Track active user
        await trackActiveUser(payload.userId);

        next();
    } catch {
        res.status(401).json({ error: 'Token invalido' });
    }
};

export const optionalAuthenticate = async (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return next();

    try {
        const parts = token.split('.');
        if (parts.length === 3) {
            const signature = crypto.createHmac('sha256', JWT_SECRET).update(`${parts[0]}.${parts[1]}`).digest('base64url');
            if (signature === parts[2]) {
                const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
                if (!payload.exp || payload.exp >= Math.floor(Date.now() / 1000)) {
                    (req as any).user = payload;
                    await trackActiveUser(payload.userId);
                }
            }
        }
    } catch {}
    next();
};

