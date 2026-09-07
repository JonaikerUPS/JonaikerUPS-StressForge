import { Request, Response } from 'express';
export declare const launchTest: (req: Request, res: Response) => Promise<void>;
export declare const getTestsHistory: (_req: Request, res: Response) => Promise<void>;
export declare const checkCache: (req: Request, res: Response) => Promise<void>;
export declare const invalidateCache: (req: Request, res: Response) => Promise<void>;
export declare const pingServer: (req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=testController.d.ts.map