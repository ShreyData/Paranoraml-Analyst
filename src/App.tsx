import { useMemo, useState } from 'react';
import { TopBar, type WorkspaceView } from './components/TopBar';
import { ControlSidebar } from './components/ControlSidebar';
import { WaveResonanceViewport } from './components/WaveResonanceViewport';
import { HowToMeasureView } from './components/HowToMeasureView';
import { BayesianMatrixView } from './components/BayesianMatrixView';
import { GlobalCasesView } from './components/GlobalCasesView';
import { AgiInvestigatorView } from './components/AgiInvestigatorView';
import { SpeciesComparisonTray } from './components/SpeciesComparisonTray';
import { PHENOMENA_CASES, type PhenomenonCase } from './data/phenomenaCases';
import {
  calculateBayesianPosterior,
  computeAllSpeciesProfiles,
  type EnvironmentParams,
  type SpeciesId,
} from './physics/anomalyMath';

const DEFAULT_CASE = PHENOMENA_CASES[0];

export default function App() {
  const [activeView, setActiveView] = useState<WorkspaceView>('wave-lab');
  const [activeCaseId, setActiveCaseId] = useState<string>(DEFAULT_CASE.id);
  const [params, setParams] = useState<EnvironmentParams>(DEFAULT_CASE.defaultParams);
  const [selectedSpecies, setSelectedSpecies] = useState<SpeciesId>('human');
  const [investigatorQuery, setInvestigatorQuery] = useState<string>('');
  const [autoTriggerNonce, setAutoTriggerNonce] = useState<number>(0);

  const activeCase = useMemo(
    () => PHENOMENA_CASES.find((c) => c.id === activeCaseId) ?? DEFAULT_CASE,
    [activeCaseId]
  );

  const allProfiles = useMemo(() => computeAllSpeciesProfiles(params), [params]);
  const activeImpact = allProfiles[selectedSpecies];
  const bayesian = useMemo(
    () => calculateBayesianPosterior(params, selectedSpecies),
    [params, selectedSpecies]
  );

  const handleSelectCase = (caseItem: PhenomenonCase) => {
    setActiveCaseId(caseItem.id);
    setParams({ ...caseItem.defaultParams });
  };

  const handleLoadCaseAndSwitch = (caseItem: PhenomenonCase) => {
    handleSelectCase(caseItem);
    setActiveView('wave-lab');
  };

  const handleInvestigateCase = (caseItem: PhenomenonCase) => {
    handleSelectCase(caseItem);
    setInvestigatorQuery(
      `Investigate "${caseItem.title}" (${caseItem.location}, ${caseItem.year}): explain the exact physical, neurobiological, and cross-species mechanisms behind human symptoms (${caseItem.humanSymptoms}) and animal behavior (${caseItem.animalBehavior}).`
    );
    setAutoTriggerNonce((n) => n + 1);
    setActiveView('investigator');
  };

  const handleResetParams = () => {
    setParams({ ...activeCase.defaultParams });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#07090E] text-slate-100">
      <TopBar
        activeView={activeView}
        onSelectView={setActiveView}
        onOpenInvestigator={() => setActiveView('investigator')}
      />

      <div className="mx-auto flex w-full max-w-[1600px] flex-1 flex-col lg:flex-row">
        <ControlSidebar
          params={params}
          selectedSpecies={selectedSpecies}
          activeCaseId={activeCaseId}
          onChangeParams={setParams}
          onSelectSpecies={setSelectedSpecies}
          onSelectCase={handleSelectCase}
          onResetParams={handleResetParams}
        />

        <main className="flex-1 min-w-0 flex flex-col justify-between">
          <div>
            {activeView === 'wave-lab' && (
              <WaveResonanceViewport
                params={params}
                selectedSpecies={selectedSpecies}
                activeCase={activeCase}
                impact={activeImpact}
                allProfiles={allProfiles}
                bayesian={bayesian}
                onOpenInvestigatorWithCase={handleInvestigateCase}
                onOpenMeasureGuide={() => setActiveView('measure')}
              />
            )}

            {activeView === 'measure' && (
              <HowToMeasureView
                params={params}
                onApplyMeasuredAudio={(frequencyHz, splDb) => {
                  setParams((prev) => ({ ...prev, frequencyHz, splDb }));
                  setActiveView('wave-lab');
                }}
                onSelectEverydayScenario={(scenarioId) => {
                  const found = PHENOMENA_CASES.find((c) => c.id === scenarioId);
                  if (found) {
                    handleLoadCaseAndSwitch(found);
                  }
                }}
              />
            )}

            {activeView === 'bayesian' && (
              <BayesianMatrixView
                params={params}
                selectedSpecies={selectedSpecies}
                profiles={allProfiles}
                bayesian={bayesian}
                onChangePrior={(priorPhysical) =>
                  setParams((prev) => ({ ...prev, priorPhysical }))
                }
              />
            )}

            {activeView === 'cases' && (
              <GlobalCasesView
                activeCaseId={activeCaseId}
                onLoadCase={handleLoadCaseAndSwitch}
                onInvestigateCase={handleInvestigateCase}
              />
            )}

            {activeView === 'investigator' && (
              <AgiInvestigatorView
                initialQuery={investigatorQuery}
                autoTriggerNonce={autoTriggerNonce}
                params={params}
                selectedSpecies={selectedSpecies}
                bayesian={bayesian}
              />
            )}
          </div>

          <SpeciesComparisonTray
            profiles={allProfiles}
            selectedSpecies={selectedSpecies}
            onSelectSpecies={setSelectedSpecies}
          />
        </main>
      </div>
    </div>
  );
}
