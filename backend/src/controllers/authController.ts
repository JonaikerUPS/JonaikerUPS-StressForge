import { Request, Response } from 'express';
import { User } from '../models/User';
import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';

function hashPassword(password: string): string {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
    return `${salt}:${hash}`;
}

function verifyPassword(password: string, stored: string): boolean {
    const [salt, hash] = stored.split(':');
    const computed = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
    return hash === computed;
}

function signToken(payload: Record<string, any>): string {
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const body = Buffer.from(JSON.stringify({ ...payload, iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 86400 })).toString('base64url');
    const signature = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64url');
    return `${header}.${body}.${signature}`;
}

export const register = async (req: Request, res: Response) => {
    try {
        const { email, password, username } = req.body;
        const newUser = await User.create({
            id: crypto.randomUUID(),
            email,
            username,
            passwordHash: hashPassword(password)
        });
        const token = signToken({ userId: newUser.id });
        res.status(201).json({ token, userId: newUser.id, username: newUser.username });
    } catch (error: any) {
        res.status(500).json({ error: 'Error al registrar', details: error.message });
    }
};

export const login = async (req: Request, res: Response) => {
    console.log("DEBUG: login request received:", JSON.stringify(req.body));
    try {
        const { identifier, password } = req.body;
        const user = await User.findOne({ 
            $or: [{ email: identifier }, { username: identifier }] 
        });
        
        if (!user) {
            console.log("DEBUG: login failed, user not found:", identifier);
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        // Verificar bloqueo
        if (user.lockUntil && user.lockUntil > new Date()) {
            console.log("DEBUG: login failed, user locked:", identifier);
            return res.status(403).json({ error: 'Cuenta bloqueada, intente de nuevo en 3 minutos' });
        }
        
        if (!verifyPassword(password, user.passwordHash as string)) {
            console.log("DEBUG: login failed, password incorrect for:", identifier);
            
            // Incrementar intentos fallidos
            user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
            
            if (user.failedLoginAttempts >= 5) {
                user.lockUntil = new Date(Date.now() + 3 * 60 * 1000); // 3 minutos
                console.log("DEBUG: user locked due to too many attempts:", identifier);
            }
            await user.save();
            
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }
        
        // Login exitoso: resetear intentos
        user.failedLoginAttempts = 0;
        user.lockUntil = null;
        await user.save();

        const token = signToken({ userId: user.id });
        console.log("DEBUG: login success for user:", user.username);
        res.status(200).json({ token, userId: user.id, username: user.username });
    } catch (error: any) {
        console.error("DEBUG: login error:", error);
        res.status(500).json({ error: 'Error al iniciar sesión', details: error.message });
    }
};

export const googleAuth = async (req: Request, res: Response) => {
    try {
        const { credential } = req.body;
        if (!credential) return res.status(400).json({ error: 'Credencial de Google requerida' });

        const verifyRes = await fetch(
            `https://www.googleapis.com/oauth2/v3/userinfo?access_token=${credential}`
        );
        const payload: any = await verifyRes.json();

        if (!payload || payload.error || !payload.email) {
            return res.status(401).json({ error: 'Token de Google inválido' });
        }

        const googleId = payload.sub;
        const email = payload.email;
        const username = payload.name || email.split('@')[0];

        let user = await User.findOne({ $or: [{ googleId }, { email }] });

        if (!user) {
            user = await User.create({
                id: crypto.randomUUID(),
                email,
                username,
                googleId
            });
        } else if (!user.googleId) {
            user.googleId = googleId;
            await user.save();
        }

        const token = signToken({ userId: user.id });
        res.status(200).json({ token, userId: user.id, username: user.username });
    } catch (error: any) {
        res.status(500).json({ error: 'Error al autenticar con Google', details: error.message });
    }
};
