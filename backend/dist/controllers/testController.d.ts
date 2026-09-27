import { Request, Response } from 'express';
export declare const getStatus: (_req: Request, res: Response) => Promise<void>;
export declare const launchTest: (req: Request, res: Response) => Promise<void>;
export declare const saveTestResult: (req: Request, res: Response) => Promise<void>;
export declare const getTestsHistory: (req: Request, res: Response) => Promise<void>;
export declare const getResultsHistory: (req: Request, res: Response) => Promise<void>;
export declare const getLatestEndpointResults: (req: Request, res: Response) => Promise<void>;
export declare const checkCache: (req: Request, res: Response) => Promise<void>;
export declare const invalidateCache: (req: Request, res: Response) => Promise<void>;
export declare const pingServer: (req: Request, res: Response) => Promise<void>;
export declare const scanPorts: (req: Request, res: Response) => Promise<void>;
export declare const deleteResultsByCategory: (req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=testController.d.ts.map