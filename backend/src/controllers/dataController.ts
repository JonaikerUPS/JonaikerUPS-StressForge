import { Request, Response } from 'express';
import { TestRun } from '../models/TestRun';
import { TestResult } from '../models/TestResult';

export const clearUserData = async (req: Request, res: Response) => {
  try {
    const { userId } = (req as any).user; // Asumiremos un middleware de auth en el futuro
    await TestRun.deleteMany({ userId });
    await TestResult.deleteMany({ userId });
    res.status(200).json({ message: 'Datos borrados correctamente' });
  } catch (error: any) {
    res.status(500).json({ error: 'Error al limpiar datos' });
  }
};
