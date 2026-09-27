export declare const performAdvancedPing: (host: string, packets?: number) => Promise<{
    success: boolean;
    latency: number;
    packetLoss: number;
    jitter: number;
}>;
export declare const performNmapScan: (target: string) => Promise<string>;
//# sourceMappingURL=networkService.d.ts.map