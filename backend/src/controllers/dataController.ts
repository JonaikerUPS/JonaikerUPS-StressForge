import { Request, Response } from 'express';
import { TestRun } from '../models/TestRun';
import { TestResult } from '../models/TestResult';

export const clearUserData = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    if (userId) {
      await TestRun.deleteMany({ userId });
      await TestResult.deleteMany({ userId });
    }
    await TestRun.deleteMany({});
    await TestResult.deleteMany({});
    res.status(200).json({ message: 'Historial, pruebas y datos de IA eliminados correctamente' });
  } catch (error: any) {
    res.status(500).json({ error: 'Error al limpiar datos' });
  }
};
