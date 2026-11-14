import React, { useState } from 'react';
import { PHENOMENA_CASES, type PhenomenonCase, type PhenomenonCategory } from '../data/phenomenaCases';
import { SPECIES_CATALOG } from '../physics/anomalyMath';

interface GlobalCasesViewProps {
  activeCaseId: string;
  onLoadCase: (caseItem: PhenomenonCase) => void;
  onInvestigateCase: (caseItem: PhenomenonCase) => void;
}

const CATEGORIES: Array<'All' | PhenomenonCategory> = [
  'All',
  'Acoustic',
  'Electromagnetic',
  'Neurological',
  'Atmospheric',
  'Toxicological',
];

export const GlobalCasesView: React.FC<GlobalCasesViewProps> = ({
  activeCaseId,
  onLoadCase,
  onInvestigateCase,
}) => {
  const [filter, setFilter] = useState<'All' | PhenomenonCategory>('All');

  const filteredCases =
    filter === 'All'
      ? PHENOMENA_CASES
      : PHENOMENA_CASES.filter((c) => c.category === filter);

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-100">
            Global Documented Anomaly Registry
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Peer-reviewed physical, neurobiological, and environmental explanations for worldwide
            phenomena affecting human and animal perception.
          </p>
        </div>

        <div
          role="group"
          aria-label="Filter phenomena by physical domain"
          className="flex flex-wrap items-center gap-1 rounded border border-slate-800 bg-[#0B0F17] p-1"
        >
          {CATEGORIES.map((cat) => {
            const active = filter === cat;
            return (
              <button
                key={cat}
                type="button"
                aria-pressed={active}
                onClick={() => setFilter(cat)}
                className={`whitespace-nowrap rounded px-3 py-1.5 text-xs font-medium transition-colors ${
                  active
                    ? 'bg-slate-800 text-cyan-300'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      <div className="divide-y divide-slate-800 border border-slate-800 bg-[#0B0F17]">
        {filteredCases.map((item) => {
          const isActive = item.id === activeCaseId;
          const speciesNames = item.primarySpeciesAffected
            .map((sp) => SPECIES_CATALOG[sp].commonName)
            .join(', ');

          return (
            <article key={item.id} className="p-5 transition-colors hover:bg-slate-900/40">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="max-w-3xl">
                  <div className="font-mono text-xs text-slate-400">
                    {item.category} · {item.location} · {item.year} · {item.coordinates}
                  </div>
                  <h2 className="mt-1 text-base font-semibold text-slate-100">
                    {item.title}
                    {isActive && (
                      <span className="ml-2.5 font-mono text-xs font-normal text-cyan-300">
                        (Loaded in Simulator)
                      </span>
                    )}
                  </h2>
                  <div className="mt-1 font-mono text-xs text-amber-300">
                    Status: {item.empiricalStatus} · Affected: {speciesNames}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => onLoadCase(item)}
                    className="whitespace-nowrap rounded border border-slate-700 bg-[#07090E] px-3 py-1.5 text-xs font-medium text-slate-200 hover:border-slate-500"
                  >
                    Load in Simulator
                  </button>
                  <button
                    type="button"
                    onClick={() => onInvestigateCase(item)}
                    className="whitespace-nowrap rounded bg-cyan-500 px-3 py-1.5 text-xs font-semibold text-slate-950 hover:bg-cyan-400"
                  >
                    Investigate with Gemini 4
                  </button>
                </div>
              </div>

              <p className="mt-3 text-sm leading-relaxed text-slate-300 max-w-4xl">
                {item.physicalSummary}
              </p>

              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-800/80 pt-3 text-xs leading-relaxed">
                <div>
                  <span className="font-mono uppercase text-slate-400">Human Response: </span>
                  <span className="text-slate-300">{item.humanSymptoms}</span>
                </div>
                <div>
                  <span className="font-mono uppercase text-slate-400">Animal Behavior: </span>
                  <span className="text-slate-300">{item.animalBehavior}</span>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 font-mono text-[11px] text-slate-400">
                <span>Equation: {item.governingFormula}</span>
                <span>Citation: {item.citation}</span>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
};
