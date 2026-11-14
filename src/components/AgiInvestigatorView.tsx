import React, { useEffect, useRef, useState } from 'react';
import { Download, ExternalLink, Loader2, Search } from 'lucide-react';
import {
  SPECIES_CATALOG,
  type BayesianInferenceResult,
  type EnvironmentParams,
  type SpeciesId,
} from '../physics/anomalyMath';

interface MathematicalModelItem {
  name: string;
  equation: string;
  quantitativeBounds: string;
}

interface GeminiInvestigationAnalysis {
  phenomenonTitle: string;
  empiricalClassification: string;
  realityVerdict: string;
  humanNeurobiology: string;
  animalSensoryEcology: string;
  mathematicalModels: MathematicalModelItem[];
  bayesianComparison: {
    physicalHypothesisProbability: number;
    unresolvedAnomalyProbability: number;
    likelihoodRatioNote: string;
  };
  falsifiableExperiment: string[];
  peerReviewedReferences: string[];
}

interface WebSourceLink {
  title: string;
  uri: string;
}

interface InvestigationPayload {
  analysis: GeminiInvestigationAnalysis;
  webSources: WebSourceLink[];
  model: string;
  analyzedAt: string;
}

interface AgiInvestigatorViewProps {
  initialQuery: string;
  autoTriggerNonce: number;
  params: EnvironmentParams;
  selectedSpecies: SpeciesId;
  bayesian: BayesianInferenceResult;
}

const PRESET_INQUIRIES = [
  'Why do dogs bark or stare intently at empty corners in older houses at night?',
  'Analyze the Hessdalen Lights and Persinger temporal-lobe magnetic induction hypothesis mathematically.',
  'Why do humans see shadow figures and feel chest pressure during sleep paralysis while pets nearby stay calm?',
  'Analyze global reports of mass bird disorientation and canine panic prior to earthquakes.',
];

export const AgiInvestigatorView: React.FC<AgiInvestigatorViewProps> = ({
  initialQuery,
  autoTriggerNonce,
  params,
  selectedSpecies,
  bayesian,
}) => {
  const [query, setQuery] = useState<string>(initialQuery || PRESET_INQUIRIES[0]);
  const [includeTelemetry, setIncludeTelemetry] = useState<boolean>(true);
  const [includeWebGrounding, setIncludeWebGrounding] = useState<boolean>(true);
  const [reasoningDepth, setReasoningDepth] = useState<'standard' | 'deep'>('standard');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [result, setResult] = useState<InvestigationPayload | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const runInvestigation = async (targetQuery: string) => {
    const trimmed = targetQuery.trim();
    if (trimmed.length < 4) {
      setErrorMsg('Please enter at least 4 characters describing the phenomenon to analyze.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const response = await fetch('/api/investigate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: trimmed,
          includeTelemetry,
          includeWebGrounding,
          reasoningDepth,
          telemetrySnapshot: {
            species: SPECIES_CATALOG[selectedSpecies].scientificName,
            frequencyHz: params.frequencyHz,
            splDb: params.splDb,
            magneticMicroTesla: params.magneticMicroTesla,
            coPpm: params.coPpm,
            visualSnr: params.visualSnr,
            posteriorPhysical: bayesian.posteriorPhysical,
          },
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || `Request failed with status ${response.status}`);
      }

      setResult(data as InvestigationPayload);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to complete scientific inquiry.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (autoTriggerNonce > 0 && initialQuery) {
      setQuery(initialQuery);
      void runInvestigation(initialQuery);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoTriggerNonce]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void runInvestigation(query);
  };

  const handleExportMarkdown = () => {
    if (!result) return;
    const { analysis } = result;
    const lines = [
      `# ${analysis.phenomenonTitle}`,
      `Classification: ${analysis.empiricalClassification}`,
      `Analyzed by: ${result.model} · ${result.analyzedAt}`,
      '',
      '## Evidence-Based Reality Verdict',
      analysis.realityVerdict,
      '',
      '## Human Neurobiology',
      analysis.humanNeurobiology,
      '',
      '## Animal Sensory Ecology',
      analysis.animalSensoryEcology,
      '',
      '## Mathematical Models',
      ...analysis.mathematicalModels.map(
        (m) => `- **${m.name}**: \`${m.equation}\` (${m.quantitativeBounds})`
      ),
      '',
      '## Bayesian Hypothesis Comparison',
      `- P(Physical | Evidence): ${(analysis.bayesianComparison.physicalHypothesisProbability * 100).toFixed(1)}%`,
      `- P(Unresolved | Evidence): ${(analysis.bayesianComparison.unresolvedAnomalyProbability * 100).toFixed(1)}%`,
      `- Likelihood Note: ${analysis.bayesianComparison.likelihoodRatioNote}`,
      '',
      '## Falsifiable Field Protocol',
      ...analysis.falsifiableExperiment.map((step, i) => `${i + 1}. ${step}`),
      '',
      '## Peer-Reviewed References',
      ...analysis.peerReviewedReferences.map((r) => `- ${r}`),
    ];

    const blob = new Blob([lines.join('\n')], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nullhypothesis-dossier-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <section aria-label="Gemini 4 Scientific Phenomenon Inquiry" className="border border-slate-800 bg-[#0B0F17] p-5">
        <div className="border-b border-slate-800 pb-4">
          <div className="font-mono text-xs text-cyan-300">
            Server-Side Reasoning Engine · Gemini 4 (Deep Thinking Mode)
          </div>
          <h1 className="mt-1 text-xl font-semibold text-slate-100">
            Unbiased Scientific & Mathematical Phenomenon Investigator
          </h1>
          <p className="mt-1 text-sm text-slate-400 max-w-3xl">
            Submit any paranormal claim, unexplained environmental event, or anomalous human/animal
            behavior. Analysis is constrained strictly to physics, neurobiology, toxicology, and
            Bayesian probability—free from fear or bias.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label
              htmlFor="phenomenon-query-input"
              className="block text-xs font-medium uppercase tracking-wider text-slate-300 mb-2"
            >
              Phenomenon or Observation to Investigate
            </label>
            <textarea
              ref={textareaRef}
              id="phenomenon-query-input"
              rows={3}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Describe the phenomenon, environment, human symptoms, or animal behavior..."
              className="w-full rounded border border-slate-700 bg-[#07090E] p-3 text-sm text-slate-100 placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {PRESET_INQUIRIES.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => {
                  setQuery(preset);
                  textareaRef.current?.focus();
                }}
                className="rounded border border-slate-800 bg-[#07090E] px-3 py-2 text-left text-xs text-slate-300 transition-colors hover:border-slate-600 hover:text-slate-100"
              >
                {preset}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-800 pt-4">
            <div className="flex flex-wrap items-center gap-5 text-xs text-slate-300">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeTelemetry}
                  onChange={(e) => setIncludeTelemetry(e.target.checked)}
                  className="h-4 w-4 accent-cyan-400"
                />
                <span>Include Active Simulator Telemetry</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeWebGrounding}
                  onChange={(e) => setIncludeWebGrounding(e.target.checked)}
                  className="h-4 w-4 accent-cyan-400"
                />
                <span>Include Web Literature Grounding</span>
              </label>

              <div className="flex items-center gap-2">
                <label htmlFor="reasoning-depth-select" className="text-slate-400">
                  Depth:
                </label>
                <select
                  id="reasoning-depth-select"
                  value={reasoningDepth}
                  onChange={(e) => setReasoningDepth(e.target.value as 'standard' | 'deep')}
                  className="rounded border border-slate-700 bg-[#07090E] px-2 py-1 text-xs text-slate-200 focus:border-cyan-400 focus:outline-none"
                >
                  <option value="standard">Standard (Balanced)</option>
                  <option value="deep">Deep (Extended Reasoning)</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center gap-2 whitespace-nowrap rounded bg-cyan-500 px-4 py-2 text-xs font-semibold text-slate-950 transition-colors hover:bg-cyan-400 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  Running Deep Analysis...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4" aria-hidden="true" />
                  Analyze Phenomenon
                </>
              )}
            </button>
          </div>
        </form>

        {errorMsg && (
          <div
            role="alert"
            className="mt-4 rounded border border-rose-500/50 bg-rose-950/30 p-3.5 text-xs text-rose-200"
          >
            {errorMsg}
          </div>
        )}
      </section>

      {isLoading && (
        <section
          aria-live="polite"
          className="border border-slate-800 bg-[#0B0F17] p-6 text-sm text-slate-300"
        >
          <div className="flex items-center gap-3 font-mono text-xs text-cyan-300">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            Evaluating physical mechanisms, neurobiological pathways, and Bayesian likelihoods...
          </div>
        </section>
      )}

      {result && !isLoading && (
        <section
          aria-label="Scientific Investigation Dossier"
          className="border border-slate-800 bg-[#0B0F17] p-5 space-y-6"
        >
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <div className="font-mono text-xs text-amber-300">
                Classification: {result.analysis.empiricalClassification} · Model: {result.model}
              </div>
              <h2 className="mt-1 text-xl font-semibold text-slate-100">
                {result.analysis.phenomenonTitle}
              </h2>
            </div>

            <button
              type="button"
              onClick={handleExportMarkdown}
              className="inline-flex items-center gap-1.5 whitespace-nowrap rounded border border-slate-700 bg-[#07090E] px-3 py-1.5 text-xs font-medium text-slate-200 hover:border-slate-500"
            >
              <Download className="h-3.5 w-3.5" aria-hidden="true" />
              Export Markdown
            </button>
          </div>

          <div>
            <h3 className="font-mono text-xs uppercase tracking-wider text-slate-400 mb-2">
              Evidence-Based Reality Verdict
            </h3>
            <p className="text-sm leading-relaxed text-slate-200 max-w-4xl">
              {result.analysis.realityVerdict}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-slate-800 pt-5">
            <div>
              <h3 className="font-mono text-xs uppercase tracking-wider text-cyan-300 mb-2">
                Human Neurobiology & Perception
              </h3>
              <p className="text-sm leading-relaxed text-slate-300">
                {result.analysis.humanNeurobiology}
              </p>
            </div>
            <div>
              <h3 className="font-mono text-xs uppercase tracking-wider text-amber-300 mb-2">
                Animal Sensory Ecology
              </h3>
              <p className="text-sm leading-relaxed text-slate-300">
                {result.analysis.animalSensoryEcology}
              </p>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-5">
            <h3 className="font-mono text-xs uppercase tracking-wider text-slate-400 mb-3">
              Mathematical Models & Quantitative Bounds
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 border border-slate-800 divide-y md:divide-y-0 md:divide-x divide-slate-800 bg-[#07090E]">
              {result.analysis.mathematicalModels.map((mod, idx) => (
                <div key={idx} className="p-4 border-b border-slate-800 last:border-b-0">
                  <div className="text-xs font-semibold text-slate-200">{mod.name}</div>
                  <div className="mt-1.5 font-mono text-xs text-cyan-300 break-words">
                    {mod.equation}
                  </div>
                  <div className="mt-2 text-xs text-slate-400">{mod.quantitativeBounds}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-slate-800 pt-5">
            <div>
              <h3 className="font-mono text-xs uppercase tracking-wider text-slate-400 mb-3">
                Bayesian Hypothesis Posterior
              </h3>
              <div className="grid grid-cols-2 gap-4 border border-slate-800 bg-[#07090E] p-4 font-mono">
                <div>
                  <div className="text-[11px] text-slate-400">P(Physical | Data)</div>
                  <div className="mt-1 text-2xl font-bold text-emerald-400 tabular-nums">
                    {(result.analysis.bayesianComparison.physicalHypothesisProbability * 100).toFixed(
                      1
                    )}
                    %
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-slate-400">P(Unresolved | Data)</div>
                  <div className="mt-1 text-2xl font-bold text-amber-300 tabular-nums">
                    {(
                      result.analysis.bayesianComparison.unresolvedAnomalyProbability * 100
                    ).toFixed(1)}
                    %
                  </div>
                </div>
              </div>
              <p className="mt-2.5 text-xs leading-relaxed text-slate-300">
                {result.analysis.bayesianComparison.likelihoodRatioNote}
              </p>
            </div>

            <div>
              <h3 className="font-mono text-xs uppercase tracking-wider text-slate-400 mb-3">
                Falsifiable Field Verification Protocol
              </h3>
              <ol className="space-y-2 text-xs leading-relaxed text-slate-300 list-decimal list-inside">
                {result.analysis.falsifiableExperiment.map((step, idx) => (
                  <li key={idx}>{step}</li>
                ))}
              </ol>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-5 grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            <div>
              <h3 className="font-mono uppercase tracking-wider text-slate-400 mb-2">
                Peer-Reviewed Literature
              </h3>
              <ul className="space-y-1.5 text-slate-300 list-disc list-inside">
                {result.analysis.peerReviewedReferences.map((ref, idx) => (
                  <li key={idx}>{ref}</li>
                ))}
              </ul>
            </div>

            {result.webSources.length > 0 && (
              <div>
                <h3 className="font-mono uppercase tracking-wider text-slate-400 mb-2">
                  Grounded Web Sources
                </h3>
                <ul className="space-y-1.5">
                  {result.webSources.map((src, idx) => (
                    <li key={idx}>
                      <a
                        href={src.uri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-cyan-300 hover:underline"
                      >
                        <span>{src.title}</span>
                        <ExternalLink className="h-3 w-3 shrink-0" aria-hidden="true" />
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
};
