import React from 'react';
import {
  SPECIES_CATALOG,
  type BayesianInferenceResult,
  type EnvironmentParams,
  type SensoryImpactProfile,
  type SpeciesId,
} from '../physics/anomalyMath';

interface BayesianMatrixViewProps {
  params: EnvironmentParams;
  selectedSpecies: SpeciesId;
  profiles: Record<SpeciesId, SensoryImpactProfile>;
  bayesian: BayesianInferenceResult;
  onChangePrior: (priorPhysical: number) => void;
}

const RADAR_AXES: Array<{
  label: string;
  extract: (p: SensoryImpactProfile) => number;
}> = [
  { label: 'OCULAR RES.', extract: (p) => p.ocularResonancePct },
  { label: 'VESTIBULAR', extract: (p) => p.vestibularDreadPct },
  { label: 'ELF TEMPORAL', extract: (p) => p.emfTemporalPct },
  { label: 'MAGNETIC CRY4', extract: (p) => p.magnetoreceptionPct },
  { label: 'CO HYPOXIA', extract: (p) => p.hypoxicEncephalopathyPct },
  { label: 'PAREIDOLIA', extract: (p) => p.pareidoliaPct },
];

function buildRadarPolygon(
  profile: SensoryImpactProfile,
  cx: number,
  cy: number,
  radius: number
): string {
  return RADAR_AXES.map((axis, idx) => {
    const angle = (Math.PI * 2 * idx) / RADAR_AXES.length - Math.PI / 2;
    const val = Math.max(0.05, axis.extract(profile) / 100);
    const x = cx + Math.cos(angle) * radius * val;
    const y = cy + Math.sin(angle) * radius * val;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
}

export const BayesianMatrixView: React.FC<BayesianMatrixViewProps> = ({
  params,
  selectedSpecies,
  profiles,
  bayesian,
  onChangePrior,
}) => {
  const humanProfile = profiles.human;
  const compareSpecies: SpeciesId = selectedSpecies === 'human' ? 'canine' : selectedSpecies;
  const animalProfile = profiles[compareSpecies];

  const cx = 210;
  const cy = 185;
  const maxR = 122;

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* 6-Axis Sensory Vulnerability Spider/Radar Chart */}
        <section
          aria-label="Human versus Animal Sensory Vulnerability Radar"
          className="border border-slate-800 bg-[#0B0F17] p-5"
        >
          <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-slate-800 pb-3">
            <h2 className="text-sm font-semibold text-slate-100">
              Cross-Species Neuro-Sensory Vulnerability Radar
            </h2>
            <div className="flex items-center gap-4 font-mono text-xs">
              <span className="text-cyan-300">― Human</span>
              <span className="text-amber-300">
                ― {SPECIES_CATALOG[compareSpecies].commonName}
              </span>
            </div>
          </div>

          <div className="mt-4 flex justify-center">
            <svg
              viewBox="0 0 420 370"
              className="w-full max-w-[420px] h-auto"
              role="img"
              aria-label={`Radar chart comparing Human and ${SPECIES_CATALOG[compareSpecies].commonName} sensory susceptibility`}
            >
              {/* Concentric hexagonal grid rings */}
              {[0.25, 0.5, 0.75, 1.0].map((ring) => {
                const pts = RADAR_AXES.map((_, idx) => {
                  const angle = (Math.PI * 2 * idx) / RADAR_AXES.length - Math.PI / 2;
                  const x = cx + Math.cos(angle) * maxR * ring;
                  const y = cy + Math.sin(angle) * maxR * ring;
                  return `${x.toFixed(1)},${y.toFixed(1)}`;
                }).join(' ');
                return (
                  <polygon
                    key={ring}
                    points={pts}
                    fill="none"
                    stroke="#1E293B"
                    strokeWidth={1}
                  />
                );
              })}

              {/* Radial axis lines & labels */}
              {RADAR_AXES.map((axis, idx) => {
                const angle = (Math.PI * 2 * idx) / RADAR_AXES.length - Math.PI / 2;
                const x2 = cx + Math.cos(angle) * maxR;
                const y2 = cy + Math.sin(angle) * maxR;
                const lx = cx + Math.cos(angle) * (maxR + 24);
                const ly = cy + Math.sin(angle) * (maxR + 20);
                const anchor =
                  Math.abs(Math.cos(angle)) < 0.25
                    ? 'middle'
                    : Math.cos(angle) > 0
                      ? 'start'
                      : 'end';

                return (
                  <g key={axis.label}>
                    <line x1={cx} y1={cy} x2={x2} y2={y2} stroke="#1E293B" strokeWidth={1} />
                    <text
                      x={lx}
                      y={ly}
                      textAnchor={anchor}
                      dominantBaseline="middle"
                      fill="#94A3B8"
                      fontSize="10"
                      fontFamily="IBM Plex Mono, monospace"
                    >
                      {axis.label}
                    </text>
                  </g>
                );
              })}

              {/* Animal Polygon */}
              <polygon
                points={buildRadarPolygon(animalProfile, cx, cy, maxR)}
                fill="rgba(245, 158, 11, 0.16)"
                stroke="#F59E0B"
                strokeWidth={2}
              />

              {/* Human Polygon */}
              <polygon
                points={buildRadarPolygon(humanProfile, cx, cy, maxR)}
                fill="rgba(6, 182, 212, 0.2)"
                stroke="#06B6D4"
                strokeWidth={2}
              />
            </svg>
          </div>
        </section>

        {/* Live Bayesian Hypothesis Inference Calculator */}
        <section
          aria-label="Bayesian Hypothesis Inference Engine"
          className="border border-slate-800 bg-[#0B0F17] p-5 flex flex-col justify-between gap-5"
        >
          <div>
            <div className="flex items-baseline justify-between border-b border-slate-800 pb-3">
              <h2 className="text-sm font-semibold text-slate-100">
                Bayesian Hypothesis Inference ({SPECIES_CATALOG[selectedSpecies].commonName})
              </h2>
              <span className="font-mono text-xs text-cyan-300 tabular-nums">
                Λ = {bayesian.likelihoodRatio.toFixed(2)}
              </span>
            </div>

            <div className="mt-4 rounded border border-slate-800 bg-[#07090E] p-3.5 font-mono text-xs text-slate-300 leading-relaxed">
              P(H_phys | E) = [P(E | H_phys) · P(H_phys)] / [P(E | H_phys)·P(H_phys) + P(E |
              H_nonlocal)·P(H_nonlocal)]
            </div>

            <div className="mt-5">
              <div className="flex items-baseline justify-between mb-1.5">
                <label htmlFor="slider-prior" className="text-xs font-medium text-slate-300">
                  Prior Belief Weight P(H_physical)
                </label>
                <span className="font-mono text-xs font-semibold text-slate-100 tabular-nums">
                  {(params.priorPhysical * 100).toFixed(0)}% Physical /{' '}
                  {((1 - params.priorPhysical) * 100).toFixed(0)}% Non-Local
                </span>
              </div>
              <input
                id="slider-prior"
                type="range"
                min={0.05}
                max={0.99}
                step={0.01}
                value={params.priorPhysical}
                onChange={(e) => onChangePrior(Number(e.target.value))}
                className="lab-slider"
              />
              <p className="mt-1.5 text-xs text-slate-400">
                Adjust the starting prior even down to extreme skepticism (5%) to verify how
                measurable physical likelihood ratios dominate the posterior update.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 border-t border-slate-800 pt-4 font-mono text-xs">
            <div>
              <div className="text-slate-400">P(E | H_physical)</div>
              <div className="mt-1 text-lg font-semibold text-slate-100 tabular-nums">
                {(bayesian.likelihoodPhysical * 100).toFixed(2)}%
              </div>
            </div>
            <div>
              <div className="text-slate-400">P(E | H_non-local)</div>
              <div className="mt-1 text-lg font-semibold text-slate-300 tabular-nums">
                {(bayesian.likelihoodNonLocal * 100).toFixed(2)}%
              </div>
            </div>
            <div>
              <div className="text-slate-400">Posterior P(H_phys | E)</div>
              <div className="mt-1 text-2xl font-bold text-emerald-400 tabular-nums">
                {(bayesian.posteriorPhysical * 100).toFixed(2)}%
              </div>
            </div>
            <div>
              <div className="text-slate-400">Residual Unexplained</div>
              <div className="mt-1 text-2xl font-bold text-amber-300 tabular-nums">
                {(bayesian.posteriorNonLocal * 100).toFixed(2)}%
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Governing Mathematical & Physical Laws */}
      <section aria-label="Governing Physical Equations" className="border border-slate-800 bg-[#0B0F17]">
        <h2 className="text-sm font-semibold text-slate-100 border-b border-slate-800 px-5 py-3.5">
          Governing Mathematical & Physical Relations
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-800 text-xs">
          <div className="p-5 border-b border-slate-800">
            <div className="font-semibold text-slate-200">1. Acoustic Cavity Standing Wave</div>
            <div className="mt-1.5 font-mono text-cyan-300">
              f_n = (n · c) / (2 · L),  p(x, t) = 2P₀ cos(k_n x) cos(ω t)
            </div>
            <p className="mt-2 text-slate-400 leading-relaxed">
              In rigid corridors of length L ≈ 9.05 m (c = 343 m/s), the fundamental axial mode
              resonates at 18.95 Hz—matching the human eyeball resonant frequency (~18 Hz).
            </p>
          </div>

          <div className="p-5 border-b border-slate-800">
            <div className="font-semibold text-slate-200">2. Faraday ELF Temporal Induction</div>
            <div className="mt-1.5 font-mono text-amber-300">
              ℰ = -dΦ_B / dt,  E_ind ≈ (r / 2) · (dB / dt)
            </div>
            <p className="mt-2 text-slate-400 leading-relaxed">
              Rapidly pulsed geomagnetic or tectonic magnetic transients generate micro-currents
              across temporal cortex neurons and perturb avian Cryptochrome-4 spin states.
            </p>
          </div>

          <div className="p-5">
            <div className="font-semibold text-slate-200">3. Haldane Carbon Monoxide Equilibrium</div>
            <div className="mt-1.5 font-mono text-rose-300">
              [COHb] / [O₂Hb] = M · (P_CO / P_O₂),  M ≈ 210
            </div>
            <p className="mt-2 text-slate-400 leading-relaxed">
              Chronic 50–120 ppm CO exposure produces 7–18% COHb saturation in humans and higher
              kinetic uptake in small pets, causing visual scotomas, dread, and auditory artifacts.
            </p>
          </div>

          <div className="p-5">
            <div className="font-semibold text-slate-200">4. Predictive Coding Signal Detection</div>
            <div className="mt-1.5 font-mono text-slate-200">
              d&apos; = z(Hit Rate) - z(False Alarm),  P(Agent | Low SNR) ∝ Prior_Threat
            </div>
            <p className="mt-2 text-slate-400 leading-relaxed">
              Under low visual/acoustic SNR, human hyperactive agency detection trades false
              positives for survival speed—turning random noise into perceived faces or voices.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
