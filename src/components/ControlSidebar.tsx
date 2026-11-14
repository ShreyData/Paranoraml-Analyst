import React from 'react';
import { RotateCcw } from 'lucide-react';
import {
  SPECIES_CATALOG,
  type EnvironmentParams,
  type SpeciesId,
} from '../physics/anomalyMath';
import { PHENOMENA_CASES, type PhenomenonCase } from '../data/phenomenaCases';

interface ControlSidebarProps {
  params: EnvironmentParams;
  selectedSpecies: SpeciesId;
  activeCaseId: string;
  onChangeParams: (next: EnvironmentParams) => void;
  onSelectSpecies: (species: SpeciesId) => void;
  onSelectCase: (caseItem: PhenomenonCase) => void;
  onResetParams: () => void;
}

const SPECIES_ORDER: SpeciesId[] = ['human', 'canine', 'feline', 'avian'];

export const ControlSidebar: React.FC<ControlSidebarProps> = ({
  params,
  selectedSpecies,
  activeCaseId,
  onChangeParams,
  onSelectSpecies,
  onSelectCase,
  onResetParams,
}) => {
  const updateField = <K extends keyof EnvironmentParams>(key: K, value: number) => {
    onChangeParams({ ...params, [key]: value });
  };

  const speciesMeta = SPECIES_CATALOG[selectedSpecies];

  return (
    <aside
      aria-label="Physical Environment Calibration"
      className="w-full lg:w-[340px] shrink-0 border-b lg:border-b-0 lg:border-r border-slate-800 bg-[#0B0F17] p-4 flex flex-col gap-4"
    >
      <div>
        <label
          htmlFor="case-preset-select"
          className="block text-xs font-medium uppercase tracking-wider text-slate-400 mb-1.5"
        >
          Documented Anomaly Calibration
        </label>
        <select
          id="case-preset-select"
          title={PHENOMENA_CASES.find((c) => c.id === activeCaseId)?.title}
          value={activeCaseId}
          onChange={(e) => {
            const found = PHENOMENA_CASES.find((c) => c.id === e.target.value);
            if (found) onSelectCase(found);
          }}
          className="w-full rounded border border-slate-700 bg-[#07090E] px-3 py-2 text-sm text-slate-100 focus:border-cyan-400 focus:outline-none"
        >
          {PHENOMENA_CASES.map((c) => (
            <option key={c.id} value={c.id}>
              {c.title}
            </option>
          ))}
        </select>
      </div>

      <div>
        <span className="block text-xs font-medium uppercase tracking-wider text-slate-400 mb-1.5">
          Biological Observer Model
        </span>
        <div
          role="group"
          aria-label="Select biological observer species"
          className="grid grid-cols-2 gap-1.5 rounded border border-slate-800 bg-[#07090E] p-1"
        >
          {SPECIES_ORDER.map((sp) => {
            const meta = SPECIES_CATALOG[sp];
            const active = selectedSpecies === sp;
            return (
              <button
                key={sp}
                type="button"
                aria-pressed={active}
                onClick={() => onSelectSpecies(sp)}
                className={`whitespace-nowrap rounded px-2.5 py-1.5 text-xs font-medium transition-colors text-left focus-visible:outline-2 focus-visible:outline-cyan-400 ${
                  active
                    ? 'bg-slate-800 text-cyan-300 border border-slate-700'
                    : 'text-slate-400 hover:text-slate-200 border border-transparent'
                }`}
              >
                {meta.commonName}
              </button>
            );
          })}
        </div>
        <div className="mt-2 border-t border-slate-800/80 pt-2 text-xs leading-relaxed text-slate-400">
          <div className="font-mono text-slate-300 tabular-nums">
            {speciesMeta.scientificName} · {speciesMeta.auditoryRangeHz}
          </div>
          <p className="mt-1">{speciesMeta.sensoryNotes}</p>
        </div>
      </div>

      <div className="space-y-3.5 border-t border-slate-800 pt-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-medium uppercase tracking-wider text-slate-400">
            Room Conditions
          </h2>
          <span className="font-mono text-[11px] text-slate-400">Adjust to test</span>
        </div>

        <div>
          <div className="flex items-baseline justify-between mb-1">
            <label htmlFor="slider-freq" className="text-xs font-medium text-slate-200">
              Low Sound / Vibration Pitch
            </label>
            <span className="font-mono text-xs font-semibold text-cyan-300 tabular-nums">
              {params.frequencyHz.toFixed(1)} <span className="text-slate-400 font-normal">Hz</span>
            </span>
          </div>
          <input
            id="slider-freq"
            type="range"
            min={4}
            max={40}
            step={0.1}
            value={params.frequencyHz}
            onChange={(e) => updateField('frequencyHz', Number(e.target.value))}
            className="lab-slider"
          />
          <p className="mt-1 text-[11px] text-slate-400">
            ~18 Hz = fan/duct hum that vibrates the human eye
          </p>
        </div>

        <div>
          <div className="flex items-baseline justify-between mb-1">
            <label htmlFor="slider-spl" className="text-xs font-medium text-slate-200">
              Vibration Loudness
            </label>
            <span className="font-mono text-xs font-semibold text-cyan-300 tabular-nums">
              {params.splDb.toFixed(0)} <span className="text-slate-400 font-normal">dB</span>
            </span>
          </div>
          <input
            id="slider-spl"
            type="range"
            min={60}
            max={130}
            step={1}
            value={params.splDb}
            onChange={(e) => updateField('splDb', Number(e.target.value))}
            className="lab-slider"
          />
          <p className="mt-1 text-[11px] text-slate-400">
            65 dB = quiet room · 100+ dB = heavy motor/wind pressure
          </p>
        </div>

        <div>
          <div className="flex items-baseline justify-between mb-1">
            <label htmlFor="slider-emf" className="text-xs font-medium text-slate-200">
              Magnetic Field Spike
            </label>
            <span className="font-mono text-xs font-semibold text-amber-300 tabular-nums">
              {params.magneticMicroTesla.toFixed(1)}{' '}
              <span className="text-slate-400 font-normal">µT</span>
            </span>
          </div>
          <input
            id="slider-emf"
            type="range"
            min={0.1}
            max={100}
            step={0.5}
            value={params.magneticMicroTesla}
            onChange={(e) => updateField('magneticMicroTesla', Number(e.target.value))}
            className="lab-slider"
          />
          <p className="mt-1 text-[11px] text-slate-400">
            1 µT = normal · 40+ µT = faulty wiring or transformer spike
          </p>
        </div>

        <div>
          <div className="flex items-baseline justify-between mb-1">
            <label htmlFor="slider-co" className="text-xs font-medium text-slate-200">
              Carbon Monoxide Gas
            </label>
            <span className="font-mono text-xs font-semibold text-rose-300 tabular-nums">
              {params.coPpm.toFixed(0)} <span className="text-slate-400 font-normal">ppm</span>
            </span>
          </div>
          <input
            id="slider-co"
            type="range"
            min={0}
            max={200}
            step={1}
            value={params.coPpm}
            onChange={(e) => updateField('coPpm', Number(e.target.value))}
            className="lab-slider"
          />
          <p className="mt-1 text-[11px] text-slate-400">
            0–9 safe · 35+ headaches/dread · 90+ hallucinations
          </p>
        </div>

        <div>
          <div className="flex items-baseline justify-between mb-1">
            <label htmlFor="slider-snr" className="text-xs font-medium text-slate-200">
              Room Light &amp; Clarity
            </label>
            <span className="font-mono text-xs font-semibold text-slate-200 tabular-nums">
              {params.visualSnr.toFixed(2)}
            </span>
          </div>
          <input
            id="slider-snr"
            type="range"
            min={0.05}
            max={1.0}
            step={0.01}
            value={params.visualSnr}
            onChange={(e) => updateField('visualSnr', Number(e.target.value))}
            className="lab-slider"
          />
          <p className="mt-1 text-[11px] text-slate-400">
            0.15 = dark bedroom · 0.50 = dim lamp · 0.90 = daylight
          </p>
        </div>
      </div>

      <div className="mt-auto border-t border-slate-800 pt-4">
        <button
          type="button"
          onClick={onResetParams}
          className="flex w-full items-center justify-center gap-2 rounded border border-slate-700 bg-[#07090E] px-4 py-2 text-xs font-medium text-slate-200 transition-colors hover:border-slate-500 hover:bg-slate-900 focus-visible:outline-2 focus-visible:outline-cyan-400"
        >
          <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
          Reset Parameters
        </button>
      </div>
    </aside>
  );
};
