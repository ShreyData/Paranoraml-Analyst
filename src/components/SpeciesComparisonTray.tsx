import React from 'react';
import {
  SPECIES_CATALOG,
  type SensoryImpactProfile,
  type SpeciesId,
} from '../physics/anomalyMath';

interface SpeciesComparisonTrayProps {
  profiles: Record<SpeciesId, SensoryImpactProfile>;
  selectedSpecies: SpeciesId;
  onSelectSpecies: (species: SpeciesId) => void;
}

const SPECIES_KEYS: SpeciesId[] = ['human', 'canine', 'feline', 'avian'];

export const SpeciesComparisonTray: React.FC<SpeciesComparisonTrayProps> = ({
  profiles,
  selectedSpecies,
  onSelectSpecies,
}) => {
  return (
    <section
      aria-label="Cross-species sensory telemetry matrix"
      className="border-t border-slate-800 bg-[#090D14] px-4 sm:px-6 py-4"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2 mb-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
          Cross-Species Biological Sensitivity Matrix
        </h2>
        <span className="font-mono text-xs text-slate-400">
          Simultaneous neuro-physical response under active field calibration
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse text-left text-xs">
          <thead>
            <tr className="border-b border-slate-800 font-mono text-[11px] uppercase tracking-wider text-slate-400">
              <th className="py-2 pr-4 font-medium">Observer Species</th>
              <th className="py-2 px-3 font-medium text-right">Ocular Res.</th>
              <th className="py-2 px-3 font-medium text-right">Vestibular</th>
              <th className="py-2 px-3 font-medium text-right">ELF Temporal</th>
              <th className="py-2 px-3 font-medium text-right">Magnetorecep.</th>
              <th className="py-2 px-3 font-medium text-right">Est. COHb</th>
              <th className="py-2 px-3 font-medium text-right">Composite</th>
              <th className="py-2 pl-4 font-medium">Dominant Physical Trigger</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/70">
            {SPECIES_KEYS.map((key) => {
              const meta = SPECIES_CATALOG[key];
              const row = profiles[key];
              const isSelected = key === selectedSpecies;

              return (
                <tr
                  key={key}
                  className={
                    isSelected ? 'bg-slate-800/45 text-slate-100' : 'text-slate-300 hover:bg-slate-900/60'
                  }
                >
                  <td className="py-2.5 pr-4">
                    <button
                      type="button"
                      onClick={() => onSelectSpecies(key)}
                      className="text-left font-medium hover:text-cyan-300 focus-visible:outline-2 focus-visible:outline-cyan-400"
                    >
                      <span>{meta.commonName}</span>
                      <span className="ml-2 font-mono text-[11px] text-slate-400">
                        {meta.scientificName}
                      </span>
                    </button>
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                    {row.ocularResonancePct.toFixed(1)}%
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                    {row.vestibularDreadPct.toFixed(1)}%
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                    {row.emfTemporalPct.toFixed(1)}%
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono tabular-nums text-amber-300">
                    {row.magnetoreceptionPct.toFixed(1)}%
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                    {row.estimatedCoHbPct.toFixed(2)}%
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-semibold tabular-nums text-cyan-300">
                    {row.compositeAnomalyIndex.toFixed(1)}%
                  </td>
                  <td className="py-2.5 pl-4 text-slate-300">{row.dominantTrigger}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
};
