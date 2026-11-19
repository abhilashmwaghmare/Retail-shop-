/**
 * SRE Telemetry & Observability Bar
 */

import React, { useState, useEffect } from 'react';
import { checkLiveness, checkReadiness, triggerCpuLoad, triggerSimulatedError } from '../services/api';
import { HealthStatus } from '../types';

export const TelemetryBar: React.FC = () => {
  const [health, setHealth] = useState<HealthStatus>({
    liveness: 'CHECKING',
    readiness: 'CHECKING',
    latencyMs: 0,
    version: '1.0.0'
  });
  const [feedback, setFeedback] = useState<string>('');
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);

  async function pollHealth() {
    try {
      const live = await checkLiveness();
      const ready = await checkReadiness();

      setHealth({
        liveness: live.ok ? 'OK' : 'FAIL',
        readiness: ready.ok && ready.data?.database?.healthy ? 'CONNECTED' : 'DISCONNECTED',
        latencyMs: Math.max(live.latency, ready.latency),
        version: live.data?.version || '1.0.0',
        rawHealthz: live.data,
        rawReady: ready.data
      });
    } catch (e) {
      setHealth((prev) => ({ ...prev, liveness: 'FAIL', readiness: 'DISCONNECTED' }));
    }
  }

  useEffect(() => {
    pollHealth();
    const timer = setInterval(pollHealth, 5000);
    return () => clearInterval(timer);
  }, []);

  const handleBurnCpu = async () => {
    setFeedback('⏳ Burning CPU cycles on backend...');
    try {
      const res = await triggerCpuLoad(1500);
      setFeedback(`🔥 ${res.message}`);
      pollHealth();
    } catch (e: any) {
      setFeedback(`❌ Error: ${e.message}`);
    }
  };

  const handleSimulateError = async () => {
    setFeedback('⏳ Simulating 500 Error for Alertmanager...');
    try {
      await triggerSimulatedError();
    } catch (e: any) {
      setFeedback(`⚠️ Emitted HTTP 500: ${e.message}`);
      pollHealth();
    }
  };

  return (
    <div className="bg-slate-900 text-slate-300 text-xs px-4 py-2 border-b border-slate-800">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-1.5">
            <span
              className={`w-2 h-2 rounded-full ${
                health.liveness === 'OK' ? 'bg-emerald-400' : 'bg-rose-500 animate-pulse'
              }`}
            />
            <span className="text-slate-400">K8s Liveness:</span>
            <span className="font-mono font-medium text-white">{health.liveness}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span
              className={`w-2 h-2 rounded-full ${
                health.readiness === 'CONNECTED' ? 'bg-emerald-400' : 'bg-rose-500 animate-pulse'
              }`}
            />
            <span className="text-slate-400">K8s Readiness (DB):</span>
            <span className="font-mono font-medium text-white">{health.readiness}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">API Latency:</span>
            <span className="font-mono font-medium text-sky-400">{health.latencyMs} ms</span>
          </div>

          <div className="hidden sm:flex items-center gap-1.5">
            <span className="text-slate-400">Release:</span>
            <span className="font-mono bg-slate-800 px-1.5 py-0.5 rounded text-slate-300">v{health.version}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {feedback && <span className="text-sky-300 mr-2 font-mono">{feedback}</span>}
          <button
            onClick={handleBurnCpu}
            className="bg-amber-600/80 hover:bg-amber-600 text-white px-2 py-1 rounded transition text-[11px]"
            title="Burn CPU on backend container to test HPA autoscaling"
          >
            🔥 Burn CPU
          </button>
          <button
            onClick={handleSimulateError}
            className="bg-rose-600/80 hover:bg-rose-600 text-white px-2 py-1 rounded transition text-[11px]"
            title="Trigger 500 error to test Prometheus 5xx error alert"
          >
            💥 500 Alert
          </button>
          <button
            onClick={() => setIsDrawerOpen(!isDrawerOpen)}
            className="text-sky-400 hover:text-sky-300 underline font-medium ml-2"
          >
            {isDrawerOpen ? 'Hide Diagnostics' : '⚡ Telemetry'}
          </button>
        </div>
      </div>

      {isDrawerOpen && (
        <div className="max-w-7xl mx-auto mt-3 pt-3 border-t border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-950 p-3 rounded font-mono text-[11px] overflow-auto max-h-40">
            <div className="text-sky-400 font-bold mb-1">GET /healthz (Liveness Probe):</div>
            <pre className="text-emerald-300">{JSON.stringify(health.rawHealthz, null, 2)}</pre>
          </div>
          <div className="bg-slate-950 p-3 rounded font-mono text-[11px] overflow-auto max-h-40">
            <div className="text-sky-400 font-bold mb-1">GET /ready (Readiness Probe):</div>
            <pre className="text-emerald-300">{JSON.stringify(health.rawReady, null, 2)}</pre>
          </div>
        </div>
      )}
    </div>
  );
};
