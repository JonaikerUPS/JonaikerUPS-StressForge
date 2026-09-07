import { Request, Response } from 'express';
import { TestRun } from '../models/TestRun';
import { TestResult } from '../models/TestResult';
import { runStressTest } from '../services/executor';
import redisClient from '../services/redisService';
import { Parsers } from '../metrics';
import { execSync } from 'child_process';

// 6. Estado del servidor y herramientas disponibles
export const getStatus = async (_req: Request, res: Response): Promise<void> => {
    try {
        const toolCommands: Record<string, string> = {
            k6: 'k6',
            artillery: 'npx',
            autocannon: 'npx',
            hey: 'hey',
            bombardier: 'bombardier',
            vegeta: 'vegeta',
            locust: 'locust',
            taurus: 'bzt',
            jmeter: 'jmeter',
            gatling: 'gatling',
            nmap: 'nmap',
            masscan: 'masscan',
            nikto: 'nikto',
            hydra: 'hydra',
            sqlmap: 'sqlmap',
            gobuster: 'gobuster',
            wfuzz: 'wfuzz',
            ffuf: 'ffuf',
            hping3: 'hping3',
            siege: 'siege',
            ab: 'ab',
            slowloris: 'slowloris'
        };

        const toolsStatus: Record<string, boolean> = {};
        for (const tool of Object.keys(Parsers)) {
            if (tool === 'simulacion') {
                toolsStatus[tool] = true;
                continue;
            }
            try {
                const cmd = toolCommands[tool] || tool;
                // Usamos 'command -v' en lugar de 'which' para una comprobación más portable en entornos POSIX
                execSync(`command -v ${cmd}`);
                toolsStatus[tool] = true;
            } catch {
                toolsStatus[tool] = false;
            }
        }
        res.status(200).json({
            status: 'ok',
            tools: toolsStatus
        });
    } catch (error) {
        console.error("Error in getStatus:", error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const launchTest = async (req: Request, res: Response): Promise<void> => {
  console.log("DEBUG: launchTest received request body:", JSON.stringify(req.body));
  try {
    const { targetUrl, toolUsed, virtualUsers } = req.body;
    const { userId } = (req as any).user;
    
    // Si toolUsed es "all", convertimos a la lista completa
    const toolsToRun = toolUsed === 'all' 
        ? ['k6', 'artillery', 'jmeter', 'locust', 'taurus', 'hey', 'autocannon', 'simulacion'] 
        : [toolUsed];
    
    const newTest = await TestRun.create({
      targetUrl,
      toolUsed,
      virtualUsers,
      userId,
      status: 'pending',
      createdAt: new Date()
    });

    runStressTest(
      newTest._id.toString(),
      toolsToRun as any,
      targetUrl,
      virtualUsers || 10,
      req.body.durationMs || 10000,
      req.body.endpoints
    );

    res.status(201).json({
      message: 'Prueba de estrés aceptada y encolada en paralelo.',
      testId: newTest._id,
      currentStatus: newTest.status
    });

  } catch (error: any) {
    res.status(500).json({
      error: 'Error interno del servidor al procesar la prueba.',
      details: error.message
    });
  }
};

// 2. Guardar resultado manual o de módulo en MongoDB
export const saveTestResult = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = (req as any).user || {};
    const { toolName, category, endpoint, method, logContent, metrics } = req.body;

    const result = await TestResult.create({
      toolName: toolName || category?.toLowerCase() || 'system',
      category: (category || 'API').toUpperCase(),
      endpoint: endpoint || '',
      method: method || 'GET',
      logContent: logContent || `Test for ${category} completed`,
      metrics: metrics || {},
      userId: userId || null,
      createdAt: new Date(),
    });

    res.status(201).json(result);
  } catch (error: any) {
    res.status(500).json({ error: 'Error al guardar resultado en DB', details: error.message });
  }
};

// 2.1 Obtener el historial completo de pruebas (TestRuns)
export const getTestsHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = (req as any).user || {};
    const query = userId ? { $or: [{ userId }, { userId: null }, { userId: { $exists: false } }, { userId: "" }] } : {};
    const tests = await TestRun.find(query).sort({ createdAt: -1 });
    res.status(200).json(tests);
  } catch (error: any) {
    res.status(500).json({ error: 'No se pudo obtener el historial de la DB.', details: error.message });
  }
};

// 2.2 Obtener el historial de resultados (TestResults)
export const getResultsHistory = async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId } = (req as any).user || {};
      const query = userId ? { $or: [{ userId }, { userId: null }, { userId: { $exists: false } }, { userId: "" }] } : {};
      const results = await TestResult.find(query).sort({ createdAt: -1 });
      res.status(200).json(results);
    } catch (error: any) {
      res.status(500).json({ error: 'No se pudo obtener el historial de resultados.', details: error.message });
    }
  };

// 2.3 Obtener los últimos resultados con datos de endpoints
export const getLatestEndpointResults = async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId } = (req as any).user || {};
      const query = userId ? { $or: [{ userId }, { userId: null }, { userId: { $exists: false } }, { userId: "" }] } : {};
      // Retornar los resultados recientes para este usuario o globales
      const results = await TestResult.find(query)
        .sort({ createdAt: -1 })
        .limit(100);
      res.status(200).json(results);
    } catch (error: any) {
      res.status(500).json({ error: 'No se pudo obtener los resultados.', details: error.message });
    }
  };

// 3. Verificación de caché REAL con Redis
export const checkCache = async (req: Request, res: Response): Promise<void> => {
  try {
    const key = req.query.key as string;
    
    // Intentar obtener de Redis
    const cachedValue = await redisClient.get(key);
    
    if (cachedValue) {
        // HIT: Se encontró en caché
        res.status(200).json({ key, cached: true, duration: 5 }); 
    } else {
        // MISS: No se encontró, simulamos guardarlo
        await redisClient.set(key, "data", { EX: 60 }); // Cache por 60s
        res.status(200).json({ key, cached: false, duration: 100 }); 
    }
  } catch (error: any) {
    res.status(500).json({ error: 'Error al consultar caché', details: error.message });
  }
};

// 4. Invalidación de caché
export const invalidateCache = async (req: Request, res: Response): Promise<void> => {
  try {
    const key = req.params.key;
    if (!key) {
        res.status(400).json({ error: 'Key is required' });
        return;
    }
    
    await redisClient.del(key);
    
    res.status(200).json({ message: `Cache for key ${key} invalidated` });
  } catch (error: any) {
    res.status(500).json({ error: 'Error al invalidar caché', details: error.message });
  }
};

import { performAdvancedPing, performNmapScan } from '../services/networkService';

// 5. Prueba de red REAL (Ping Avanzado)
export const pingServer = async (req: Request, res: Response): Promise<void> => {
    try {
        const target = req.query.target as string;
        const packets = parseInt(req.query.packets as string) || 4;
        
        if (!target) {
            res.status(400).json({ error: 'Target host is required' });
            return;
        }
        
        const result = await performAdvancedPing(target, packets);
        
        res.status(200).json({
            server: target,
            latency: result.latency,
            packetLoss: result.packetLoss,
            jitter: result.jitter,
            status: result.success ? "success" : (result.packetLoss < 50 ? "warning" : "error")
        });
    } catch (error: any) {
        res.status(500).json({ error: 'Error al realizar ping', details: error.message });
    }
};

// 6. Escaneo de puertos
export const scanPorts = async (req: Request, res: Response): Promise<void> => {
    try {
        const target = (req.query.target as string) || 'localhost';
        const results = await performNmapScan(target);
        res.status(200).json({ target, results });
    } catch (error: any) {
        res.status(500).json({ error: 'Error al escanear puertos', details: error.message });
    }
};

// 7. Borrado específico por categoría
export const deleteResultsByCategory = async (req: Request, res: Response): Promise<void> => {
    try {
        const { userId } = (req as any).user;
        const category = String(req.params.category).toUpperCase();
        
        await TestResult.deleteMany({ userId, category: category === 'API' ? { $in: ['API', 'STRESS'] } : category });
        
        res.status(200).json({ message: `Datos de ${category} borrados correctamente` });
    } catch (error: any) {
        res.status(500).json({ error: 'Error al limpiar datos por categoría', details: error.message });
    }
};



