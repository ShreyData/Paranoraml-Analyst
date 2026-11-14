import React, { useEffect, useRef, useState } from 'react';
import { Pause, Play } from 'lucide-react';
import {
  SPECIES_CATALOG,
  calculateOcularResonance,
  computeStandingWaveProfile,
  translateToRealWorldSummary,
  type BayesianInferenceResult,
  type EnvironmentParams,
  type SensoryImpactProfile,
  type SpeciesId,
} from '../physics/anomalyMath';
import type { PhenomenonCase } from '../data/phenomenaCases';

type CanvasMode = 'standing-wave' | 'frequency-spectrum' | 'stochastic-snr';

interface WaveResonanceViewportProps {
  params: EnvironmentParams;
  selectedSpecies: SpeciesId;
  activeCase: PhenomenonCase;
  impact: SensoryImpactProfile;
  allProfiles: Record<SpeciesId, SensoryImpactProfile>;
  bayesian: BayesianInferenceResult;
  onOpenInvestigatorWithCase: (caseItem: PhenomenonCase) => void;
  onOpenMeasureGuide: () => void;
}

export const WaveResonanceViewport: React.FC<WaveResonanceViewportProps> = ({
  params,
  selectedSpecies,
  activeCase,
  impact,
  allProfiles,
  bayesian,
  onOpenInvestigatorWithCase,
  onOpenMeasureGuide,
}) => {
  const realWorld = translateToRealWorldSummary(params, allProfiles, selectedSpecies);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [mode, setMode] = useState<CanvasMode>('standing-wave');
  const [isPlaying, setIsPlaying] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
    return true;
  });
  const [probeInfo, setProbeInfo] = useState<{ xLabel: string; yLabel: string } | null>(null);

  const latestRef = useRef({ params, selectedSpecies, mode, impact });
  latestRef.current = { params, selectedSpecies, mode, impact };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rafId = 0;
    const startTime = performance.now();

    const draw = (now: number) => {
      const { params: p, selectedSpecies: sp, mode: currentMode, impact: imp } = latestRef.current;
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      const width = Math.max(300, Math.floor(rect.width));
      const height = Math.max(240, Math.floor(rect.height));

      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
      }

      ctx.save();
      ctx.scale(dpr, dpr);

      // Clean dark lab canvas
      ctx.fillStyle = '#07090E';
      ctx.fillRect(0, 0, width, height);

      const padLeft = 56;
      const padRight = 24;
      const padTop = 28;
      const padBottom = 38;
      const plotW = width - padLeft - padRight;
      const plotH = height - padTop - padBottom;

      // Subtle coordinate grid
      ctx.strokeStyle = '#141B29';
      ctx.lineWidth = 1;
      for (let i = 0; i <= 8; i++) {
        const gx = padLeft + (plotW * i) / 8;
        ctx.beginPath();
        ctx.moveTo(gx, padTop);
        ctx.lineTo(gx, padTop + plotH);
        ctx.stroke();
      }
      for (let j = 0; j <= 4; j++) {
        const gy = padTop + (plotH * j) / 4;
        ctx.beginPath();
        ctx.moveTo(padLeft, gy);
        ctx.lineTo(padLeft + plotW, gy);
        ctx.stroke();
      }

      // Zero / baseline axis
      const midY = padTop + plotH / 2;
      ctx.strokeStyle = '#334155';
      ctx.beginPath();
      ctx.moveTo(padLeft, currentMode === 'standing-wave' ? midY : padTop + plotH);
      ctx.lineTo(padLeft + plotW, currentMode === 'standing-wave' ? midY : padTop + plotH);
      ctx.stroke();

      // Time-dilated visual phase so 18.9 Hz never strobes at a zero-crossing
      const elapsedSec = isPlaying ? ((now - startTime) / 1000) * 0.08 : 0.0;

      if (currentMode === 'standing-wave') {
        const roomLen = 9.05;
        const points = computeStandingWaveProfile(p.frequencyHz, p.splDb, roomLen, elapsedSec, 96);

        // Translucent standing-wave pressure field fill
        ctx.fillStyle = 'rgba(6, 182, 212, 0.08)';
        ctx.beginPath();
        points.forEach((pt, idx) => {
          const px = padLeft + (pt.x / roomLen) * plotW;
          const py = midY - pt.envelope * (plotH * 0.42);
          if (idx === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        });
        for (let i = points.length - 1; i >= 0; i--) {
          const pt = points[i];
          const px = padLeft + (pt.x / roomLen) * plotW;
          const py = midY + pt.envelope * (plotH * 0.42);
          ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();

        // Acoustic pressure envelope (amber dashed)
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.65)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        points.forEach((pt, idx) => {
          const px = padLeft + (pt.x / roomLen) * plotW;
          const py = midY - pt.envelope * (plotH * 0.42);
          if (idx === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        });
        ctx.stroke();

        ctx.beginPath();
        points.forEach((pt, idx) => {
          const px = padLeft + (pt.x / roomLen) * plotW;
          const py = midY + pt.envelope * (plotH * 0.42);
          if (idx === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        });
        ctx.stroke();
        ctx.setLineDash([]);

        // Instantaneous standing wave p(x, t)
        ctx.strokeStyle = '#06B6D4';
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        points.forEach((pt, idx) => {
          const px = padLeft + (pt.x / roomLen) * plotW;
          const py = midY - pt.instantaneous * (plotH * 0.42);
          if (idx === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        });
        ctx.stroke();

        // Legend & corridor labels
        ctx.fillStyle = '#06B6D4';
        ctx.font = '11px "IBM Plex Mono", monospace';
        ctx.fillText(`Instantaneous Wave p(x,t) · ${p.frequencyHz.toFixed(1)} Hz`, padLeft + 8, padTop + 14);
        ctx.fillStyle = '#F59E0B';
        ctx.fillText(`Pressure Envelope ±ΔP (${p.splDb.toFixed(0)} dB SPL)`, padLeft + 8, padTop + 30);

        ctx.fillStyle = '#94A3B8';
        ctx.fillText('0.0 m', padLeft, padTop + plotH + 20);
        ctx.fillText('4.5 m (Node)', padLeft + plotW * 0.43, padTop + plotH + 20);
        ctx.fillText('9.05 m', padLeft + plotW - 42, padTop + plotH + 20);
        ctx.fillText('+ΔP', 14, padTop + 14);
        ctx.fillText('0 Pa', 14, midY + 4);
        ctx.fillText('-ΔP', 14, padTop + plotH - 6);
      } else if (currentMode === 'frequency-spectrum') {
        const minF = 4;
        const maxF = 40;
        const steps = 120;

        // Plot Human curve (cyan) and Active Animal or Canine comparison (amber)
        const compareSpecies: SpeciesId = sp === 'human' ? 'canine' : sp;

        // Human curve
        ctx.strokeStyle = '#06B6D4';
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i = 0; i <= steps; i++) {
          const f = minF + (i / steps) * (maxF - minF);
          const r = calculateOcularResonance(f, p.splDb, 'human');
          const px = padLeft + (i / steps) * plotW;
          const py = padTop + plotH - (r / 100) * plotH * 0.92;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();

        // Comparison Animal curve
        ctx.strokeStyle = '#F59E0B';
        ctx.lineWidth = 1.8;
        ctx.setLineDash([5, 4]);
        ctx.beginPath();
        for (let i = 0; i <= steps; i++) {
          const f = minF + (i / steps) * (maxF - minF);
          const r = calculateOcularResonance(f, p.splDb, compareSpecies);
          const px = padLeft + (i / steps) * plotW;
          const py = padTop + plotH - (r / 100) * plotH * 0.92;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();
        ctx.setLineDash([]);

        // Active frequency vertical marker
        const activeX = padLeft + ((p.frequencyHz - minF) / (maxF - minF)) * plotW;
        ctx.strokeStyle = '#E2E8F0';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(activeX, padTop);
        ctx.lineTo(activeX, padTop + plotH);
        ctx.stroke();

        ctx.fillStyle = '#E2E8F0';
        ctx.font = '11px "IBM Plex Mono", monospace';
        ctx.fillText(`f = ${p.frequencyHz.toFixed(1)} Hz`, Math.min(activeX + 6, width - 100), padTop + 14);
        ctx.fillStyle = '#06B6D4';
        ctx.fillText('Human Orbit (18.0 Hz)', padLeft + 8, padTop + 16);
        ctx.fillStyle = '#F59E0B';
        ctx.fillText(
          `${SPECIES_CATALOG[compareSpecies].commonName} (${SPECIES_CATALOG[compareSpecies].ocularResonanceHz} Hz)`,
          padLeft + 8,
          padTop + 32
        );

        ctx.fillStyle = '#94A3B8';
        ctx.fillText('4 Hz', padLeft, padTop + plotH + 20);
        ctx.fillText('18 Hz', padLeft + ((18 - minF) / (maxF - minF)) * plotW - 14, padTop + plotH + 20);
        ctx.fillText('40 Hz', padLeft + plotW - 34, padTop + plotH + 20);
        ctx.fillText('100%', 12, padTop + 14);
        ctx.fillText('0%', 20, padTop + plotH);
      } else {
        // Stochastic Resonance & Predictive Pareidolia Threshold
        const samples = 140;
        const noiseAmp = (1 - p.visualSnr) * 0.48;
        const thresholdNorm = 0.68 - (imp.pareidoliaPct / 100) * 0.34;
        const thresholdY = padTop + plotH * (1 - thresholdNorm);

        // Draw deterministic + time-modulated broadband noise trace
        ctx.strokeStyle = '#64748B';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        for (let i = 0; i <= samples; i++) {
          const t = i / samples;
          const baseSignal = 0.25 + 0.14 * Math.sin(t * Math.PI * 4 + elapsedSec * 1.2);
          const pseudoNoise =
            Math.sin(i * 12.9898 + elapsedSec * 7.3) * 0.5 +
            Math.cos(i * 78.233 - elapsedSec * 4.1) * 0.5;
          const level = Math.max(0.03, Math.min(0.96, baseSignal + pseudoNoise * noiseAmp));
          const px = padLeft + t * plotW;
          const py = padTop + plotH * (1 - level);
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);

          // Highlight threshold crossings ("false positive agency triggers")
          if (level >= thresholdNorm) {
            ctx.fillStyle = 'rgba(245, 158, 11, 0.85)';
            ctx.fillRect(px - 1.5, py - 1.5, 3, 3);
          }
        }
        ctx.stroke();

        // Predictive coding decision threshold line
        ctx.strokeStyle = '#F59E0B';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([6, 4]);
        ctx.beginPath();
        ctx.moveTo(padLeft, thresholdY);
        ctx.lineTo(padLeft + plotW, thresholdY);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = '#F59E0B';
        ctx.font = '11px "IBM Plex Mono", monospace';
        ctx.fillText(
          `Predictive Detection Threshold (Pareidolia Bias: ${imp.pareidoliaPct.toFixed(1)}%)`,
          padLeft + 8,
          Math.max(padTop + 14, thresholdY - 8)
        );
        ctx.fillStyle = '#94A3B8';
        ctx.fillText('Sample Window (t)', padLeft + plotW / 2 - 50, padTop + plotH + 20);
        ctx.fillText('Signal', 10, padTop + 14);
      }

      ctx.restore();

      if (isPlaying) {
        rafId = requestAnimationFrame(draw);
      }
    };

    rafId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafId);
  }, [isPlaying, mode, params, selectedSpecies, impact]);

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const relX = Math.max(0, Math.min(1, (e.clientX - rect.left - 56) / Math.max(1, rect.width - 80)));
    const relY = Math.max(0, Math.min(1, 1 - (e.clientY - rect.top - 28) / Math.max(1, rect.height - 66)));

    if (mode === 'standing-wave') {
      setProbeInfo({
        xLabel: `x = ${(relX * 9.05).toFixed(2)} m`,
        yLabel: `Normalized ΔP = ${((relY - 0.5) * 2).toFixed(2)}`,
      });
    } else if (mode === 'frequency-spectrum') {
      setProbeInfo({
        xLabel: `f = ${(4 + relX * 36).toFixed(1)} Hz`,
        yLabel: `Coupling = ${(relY * 100).toFixed(1)}%`,
      });
    } else {
      setProbeInfo({
        xLabel: `Window = ${(relX * 100).toFixed(0)}%`,
        yLabel: `Amplitude = ${relY.toFixed(2)}`,
      });
    }
  };

  return (
    <div className="flex flex-col gap-5 p-4 sm:p-6">
      {/* Plain-English Real-World Translation */}
      <section
        aria-label="Plain-English Real-World Translation"
        className="border border-slate-800 bg-[#0B0F17] p-4 sm:p-5 space-y-3"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <div className="font-mono text-[11px] uppercase tracking-wider text-cyan-300">
              What These Numbers Mean in Real Life
            </div>
            <h1 className="mt-0.5 text-base sm:text-lg font-semibold text-slate-100">
              {realWorld.headline}
            </h1>
          </div>
          <button
            type="button"
            onClick={onOpenMeasureGuide}
            className="whitespace-nowrap rounded border border-cyan-500/50 bg-cyan-500/10 px-3 py-1.5 text-xs font-medium text-cyan-300 hover:bg-cyan-500/20"
          >
            How to Measure at Home
          </button>
        </div>

        {realWorld.safetyAlert && (
          <div
            role="alert"
            className="rounded border border-rose-500/60 bg-rose-950/40 px-3.5 py-2.5 text-xs leading-relaxed text-rose-200"
          >
            {realWorld.safetyAlert}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs leading-relaxed">
          <div>
            <div className="font-semibold text-slate-200 mb-1">What a Human Feels</div>
            <p className="text-slate-300">{realWorld.humanExperience}</p>
          </div>
          <div>
            <div className="font-semibold text-amber-300 mb-1">Why Pets React Differently</div>
            <p className="text-slate-300">{realWorld.animalExperience}</p>
          </div>
          <div>
            <div className="font-semibold text-emerald-300 mb-1">First Real-World Check</div>
            <p className="text-slate-300">{realWorld.firstCheckStep}</p>
          </div>
        </div>
      </section>

      {/* 4-Column Quantitative KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 border border-slate-800 bg-[#0B0F17] divide-y sm:divide-y-0 sm:divide-x divide-slate-800">
        <div className="p-4">
          <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
            Eye Vibration Risk
          </div>
          <div className="mt-1.5 flex items-baseline">
            <span className="font-mono text-2xl font-bold text-cyan-300 tabular-nums">
              {impact.ocularResonancePct.toFixed(1)}
            </span>
            <span className="ml-1.5 font-mono text-xs uppercase text-slate-400">%</span>
          </div>
          <div className="mt-1 font-mono text-xs text-slate-400 tabular-nums">
            Eye Peak: {SPECIES_CATALOG[selectedSpecies].ocularResonanceHz.toFixed(1)} Hz
          </div>
        </div>

        <div className="p-4">
          <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
            Overall Sensory Stress
          </div>
          <div className="mt-1.5 flex items-baseline">
            <span className="font-mono text-2xl font-bold text-slate-100 tabular-nums">
              {impact.compositeAnomalyIndex.toFixed(1)}
            </span>
            <span className="ml-1.5 font-mono text-xs uppercase text-slate-400">Idx</span>
          </div>
          <div className="mt-1 font-mono text-xs text-amber-300 truncate">
            {impact.dominantTrigger}
          </div>
        </div>

        <div className="p-4">
          <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
            Physical Cause Confidence
          </div>
          <div className="mt-1.5 flex items-baseline">
            <span className="font-mono text-2xl font-bold text-emerald-400 tabular-nums">
              {(bayesian.posteriorPhysical * 100).toFixed(2)}
            </span>
            <span className="ml-1.5 font-mono text-xs uppercase text-slate-400">%</span>
          </div>
          <div className="mt-1 font-mono text-xs text-slate-400 tabular-nums">
            Evidence Odds: {bayesian.likelihoodRatio.toFixed(1)}×
          </div>
        </div>

        <div className="p-4">
          <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
            Scientific Verdict
          </div>
          <div className="mt-2 text-sm font-semibold text-slate-100">
            {bayesian.posteriorPhysical >= 0.8 ? '● ' : '▲ '}
            {bayesian.verdictLabel}
          </div>
          <div className="mt-1 font-mono text-xs text-slate-400 tabular-nums">
            Blood COHb Est.: {impact.estimatedCoHbPct.toFixed(2)}%
          </div>
        </div>
      </div>

      {/* Interactive Physics Canvas & Mode Toolbar */}
      <section aria-label="Interactive Wave and Resonance Visualizer" className="border border-slate-800 bg-[#0B0F17]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 px-4 py-3">
          <div
            role="tablist"
            aria-label="Visualization mode"
            className="flex flex-wrap items-center gap-1 rounded bg-[#07090E] p-1 border border-slate-800"
          >
            {(
              [
                { id: 'standing-wave', label: 'Standing Wave Cavity' },
                { id: 'frequency-spectrum', label: 'Ocular Resonance Curve' },
                { id: 'stochastic-snr', label: 'Stochastic Pareidolia' },
              ] as const
            ).map((tab) => {
              const active = mode === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setMode(tab.id)}
                  className={`whitespace-nowrap rounded px-3 py-1.5 text-xs font-medium transition-colors ${
                    active
                      ? 'bg-slate-800 text-cyan-300'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-4">
            {probeInfo && (
              <span className="hidden sm:inline font-mono text-xs text-slate-300 tabular-nums">
                {probeInfo.xLabel} · {probeInfo.yLabel}
              </span>
            )}
            <button
              type="button"
              onClick={() => setIsPlaying((prev) => !prev)}
              aria-label={isPlaying ? 'Pause wave simulation' : 'Resume wave simulation'}
              className="flex items-center gap-1.5 whitespace-nowrap rounded border border-slate-700 bg-[#07090E] px-3 py-1.5 text-xs font-medium text-slate-200 hover:border-slate-500"
            >
              {isPlaying ? (
                <>
                  <Pause className="h-3.5 w-3.5" aria-hidden="true" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="h-3.5 w-3.5" aria-hidden="true" />
                  Resume
                </>
              )}
            </button>
          </div>
        </div>

        <div className="relative h-[300px] sm:h-[340px] w-full">
          <canvas
            ref={canvasRef}
            data-testid="wave-resonance-canvas"
            onMouseMove={handleCanvasMouseMove}
            onMouseLeave={() => setProbeInfo(null)}
            className="h-full w-full block cursor-crosshair"
          />
        </div>
      </section>

      {/* Active Dossier Scientific Reality Brief */}
      <section aria-label="Active Phenomenon Physical Reality Brief" className="border border-slate-800 bg-[#0B0F17] p-5">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <div className="text-xs font-mono text-slate-400">
              {activeCase.location} · {activeCase.year} · {activeCase.coordinates}
            </div>
            <h2 className="mt-1 text-lg font-semibold text-slate-100">{activeCase.title}</h2>
          </div>
          <button
            type="button"
            onClick={() => onOpenInvestigatorWithCase(activeCase)}
            className="whitespace-nowrap rounded border border-cyan-500/50 bg-cyan-500/10 px-3.5 py-2 text-xs font-semibold text-cyan-300 transition-colors hover:bg-cyan-500/20"
          >
            Deep-Investigate with Gemini 4
          </button>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-6 text-sm leading-relaxed">
          <div>
            <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">
              Physical Reality Mechanism
            </h3>
            <p className="text-slate-300">{activeCase.physicalSummary}</p>
          </div>

          <div>
            <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">
              Human Neuro-Sensory Effect
            </h3>
            <p className="text-slate-300">{activeCase.humanSymptoms}</p>
          </div>

          <div>
            <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">
              Animal Sensory Ecology
            </h3>
            <p className="text-slate-300">{activeCase.animalBehavior}</p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-800/80 pt-3 font-mono text-xs text-slate-400">
          <span>Governing Relation: {activeCase.governingFormula}</span>
          <span>Source: {activeCase.citation}</span>
        </div>
      </section>
    </div>
  );
};
