import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateOcularResonance,
  calculateEmfImpacts,
  calculateHypoxicLoad,
  calculateBayesianPosterior,
  computeAllSpeciesProfiles,
  computeStandingWaveProfile,
  translateToRealWorldSummary,
  type EnvironmentParams,
} from './anomalyMath';

const TANDY_PARAMS: EnvironmentParams = {
  frequencyHz: 18.9,
  splDb: 112,
  magneticMicroTesla: 1.0,
  coPpm: 0,
  visualSnr: 0.4,
  priorPhysical: 0.8,
};

test('human ocular resonance peaks near 18 Hz infrasound', () => {
  const atPeak = calculateOcularResonance(18.0, 110, 'human');
  const offPeakLow = calculateOcularResonance(7.0, 110, 'human');
  const offPeakHigh = calculateOcularResonance(34.0, 110, 'human');

  assert.ok(atPeak > 75, `Expected peak human ocular resonance > 75%, got ${atPeak}`);
  assert.ok(atPeak > offPeakLow * 3, '18 Hz must strongly exceed 7 Hz ocular resonance');
  assert.ok(atPeak > offPeakHigh * 3, '18 Hz must strongly exceed 34 Hz ocular resonance');
});

test('avian magnetoreception disruption greatly exceeds human under ELF magnetic anomaly', () => {
  const avian = calculateEmfImpacts(65, 'avian');
  const human = calculateEmfImpacts(65, 'human');

  assert.ok(
    avian.magnetoreceptionPct > human.magnetoreceptionPct * 4,
    `Expected avian magnetoreception (${avian.magnetoreceptionPct}) >> human (${human.magnetoreceptionPct})`
  );
  assert.ok(
    human.temporalInductionPct > avian.temporalInductionPct,
    'Human temporal cortex induction should exceed avian under high ELF flux'
  );
});

test('carbon monoxide Haldane approximation scales with species metabolic factor', () => {
  const human = calculateHypoxicLoad(100, 'human');
  const feline = calculateHypoxicLoad(100, 'feline');
  const avian = calculateHypoxicLoad(100, 'avian');

  assert.ok(human.coHbPct > 10 && human.coHbPct < 25, `Unexpected human COHb: ${human.coHbPct}`);
  assert.ok(feline.coHbPct > human.coHbPct, 'Feline COHb saturation should exceed human at 100 ppm');
  assert.ok(avian.coHbPct > feline.coHbPct, 'Avian COHb saturation should exceed feline at 100 ppm');
});

test('Bayesian posterior favors physical mechanism strongly under strong empirical stimulus', () => {
  const result = calculateBayesianPosterior(TANDY_PARAMS, 'human');
  assert.ok(
    result.posteriorPhysical > 0.96,
    `Expected posteriorPhysical > 0.96, got ${result.posteriorPhysical}`
  );
  assert.ok(result.likelihoodRatio > 10, `Expected likelihoodRatio > 10, got ${result.likelihoodRatio}`);
  assert.equal(result.verdictLabel, 'Physical Mechanism Confirmed');
});

test('Bayesian posterior stays disciplined even with neutral 50/50 prior when CO is toxic', () => {
  const coParams: EnvironmentParams = {
    frequencyHz: 12,
    splDb: 70,
    magneticMicroTesla: 0.5,
    coPpm: 140,
    visualSnr: 0.5,
    priorPhysical: 0.5,
  };
  const result = calculateBayesianPosterior(coParams, 'human');
  assert.ok(
    result.posteriorPhysical > 0.9,
    `Expected > 0.90 physical posterior under 140 ppm CO, got ${result.posteriorPhysical}`
  );
});

test('computeAllSpeciesProfiles returns valid bounded metrics for all 4 species', () => {
  const profiles = computeAllSpeciesProfiles(TANDY_PARAMS);
  const speciesList = ['human', 'canine', 'feline', 'avian'] as const;
  for (const sp of speciesList) {
    const p = profiles[sp];
    assert.ok(p.compositeAnomalyIndex >= 0 && p.compositeAnomalyIndex <= 100);
    assert.ok(p.dominantTrigger.length > 0);
  }
});

test('standing wave calculation yields boundary antinode at x = 0', () => {
  const wave = computeStandingWaveProfile(18.9, 108, 9.05, 0, 32);
  assert.equal(wave.length, 33);
  assert.ok(wave[0].envelope > 0.5, 'Expected boundary antinode at x = 0');
});

test('translateToRealWorldSummary surfaces safety warning for elevated CO and clear guidance for infrasound', () => {
  const coParams: EnvironmentParams = {
    frequencyHz: 14,
    splDb: 72,
    magneticMicroTesla: 1.0,
    coPpm: 80,
    visualSnr: 0.5,
    priorPhysical: 0.85,
  };
  const coProfiles = computeAllSpeciesProfiles(coParams);
  const coSummary = translateToRealWorldSummary(coParams, coProfiles, 'human');
  assert.ok(coSummary.safetyAlert !== null, 'Expected safety alert when CO >= 35 ppm');
  assert.ok(coSummary.headline.includes('Carbon Monoxide'));

  const waveProfiles = computeAllSpeciesProfiles(TANDY_PARAMS);
  const waveSummary = translateToRealWorldSummary(TANDY_PARAMS, waveProfiles, 'human');
  assert.equal(waveSummary.safetyAlert, null);
  assert.ok(waveSummary.headline.includes('Vibration'));
});
