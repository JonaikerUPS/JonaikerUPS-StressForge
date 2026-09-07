"use client";

import { NewLoadTestDashboard } from "@/components/dashboard/NewLoadTestDashboard";

export default function LoadTestPage() {
  return (
    <div className="min-h-[calc(100vh-4rem)]">
      <NewLoadTestDashboard liveMetrics={null} testEndpoints={[]} isRunning={false} />
    </div>
  );
}
