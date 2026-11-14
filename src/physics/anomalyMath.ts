export type SpeciesId = 'human' | 'canine' | 'feline' | 'avian';

export interface SpeciesProfileMeta {
  id: SpeciesId;
  commonName: string;
  scientificName: string;
  auditoryRangeHz: string;
  ocularResonanceHz: number;
  magnetoreception: string;
  metabolicCoFactor: number;
  sensoryNotes: string;
}

export interface EnvironmentParams {
  frequencyHz: number; // 4 - 40 Hz infrasound/low-freq band
  splDb: number; // 60 - 130 dB SPL
  magneticMicroTesla: number; // 0.1 - 100 uT pulsed ELF anomaly above Earth baseline
  coPpm: number; // 0 - 200 ppm Carbon Monoxide
  visualSnr: number; // 0.05 - 1.00 illumination / visual signal-to-noise ratio
  priorPhysical: number; // 0.01 - 0.99 Bayesian prior P(H_physical)
}

export interface SensoryImpactProfile {
  species: SpeciesId;
  ocularResonancePct: number;
  vestibularDreadPct: number;
  emfTemporalPct: number;
  magnetoreceptionPct: number;
  hypoxicEncephalopathyPct: number;
  pareidoliaPct: number;
  compositeAnomalyIndex: number;
  estimatedCoHbPct: number;
  dominantTrigger: string;
}

export interface BayesianInferenceResult {
  priorPhysical: number;
  priorNonLocal: number;
  likelihoodPhysical: number;
  likelihoodNonLocal: number;
  likelihoodRatio: number;
  posteriorPhysical: number;
  posteriorNonLocal: number;
  verdictLabel: string;
}

export const SPECIES_CATALOG: Record<SpeciesId, SpeciesProfileMeta> = {
  human: {
    id: 'human',
    commonName: 'Human',
    scientificName: 'Homo sapiens',
    auditoryRangeHz: '20 – 20,000 Hz',
    ocularResonanceHz: 18.0,
    magnetoreception: 'Vestigial / Weak Cryptochrome-2',
    metabolicCoFactor: 1.0,
    sensoryNotes:
      'Orbital globe resonates near 18.0 Hz (Tandy, 1998), causing peripheral rod-cell mechanical smear perceived as gray apparitions. Temporal lobe responds to complex pulsed magnetic fields.',
  },
  canine: {
    id: 'canine',
    commonName: 'Domestic Dog',
    scientificName: 'Canis lupus familiaris',
    auditoryRangeHz: '67 – 45,000 Hz',
    ocularResonanceHz: 22.5,
    magnetoreception: 'Moderate (Retinal Cryptochrome Alignment)',
    metabolicCoFactor: 1.35,
    sensoryNotes:
      'Heightened baroreceptor and paw-pad Pacinian corpuscle sensitivity to structural infrasound (10–30 Hz) plus ultrasonic harmonics (>20 kHz) inaudible to humans, triggering directional barking at empty corners.',
  },
  feline: {
    id: 'feline',
    commonName: 'Domestic Cat',
    scientificName: 'Felis catus',
    auditoryRangeHz: '48 – 85,000 Hz',
    ocularResonanceHz: 26.0,
    magnetoreception: 'Weak–Moderate (Trigeminal / Retinal)',
    metabolicCoFactor: 1.6,
    sensoryNotes:
      'Extreme acoustic sensitivity across 45–64 kHz detects electrical coil whine, HVAC cavitation, and rodent/structural micro-fractures, combined with tapetum lucidum low-light motion hyper-tracking.',
  },
  avian: {
    id: 'avian',
    commonName: 'Homing Pigeon',
    scientificName: 'Columba livia',
    auditoryRangeHz: '0.05 – 10,000 Hz',
    ocularResonanceHz: 31.0,
    magnetoreception: 'High (Radical-Pair Cry4a & Beak Magnetite)',
    metabolicCoFactor: 2.1,
    sensoryNotes:
      'True biological infrasound hearing down to 0.05 Hz and quantum radical-pair magnetoreception (Cryptochrome 4) make avians acute biological sensors for micro-barometric and ELF geomagnetic perturbations.',
  },
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Lorentzian resonance curve modeling mechanical Q-factor excitation of the eyeball
 * and orbital cavity under acoustic standing-wave pressure.
 */
export function calculateOcularResonance(
  frequencyHz: number,
  splDb: number,
  species: SpeciesId
): number {
  const f0 = SPECIES_CATALOG[species].ocularResonanceHz;
  const gamma = species === 'human' ? 2.4 : 3.0; // Half-width at half-maximum (Hz)
  const lorentzian = (gamma * gamma) / (Math.pow(frequencyHz - f0, 2) + gamma * gamma);
  // Acoustic pressure factor: noticeable mechanical coupling above 82 dB SPL
  const pressureFactor = clamp((splDb - 76) / 42, 0, 1.15);
  return clamp(lorentzian * pressureFactor * 100, 0, 100);
}

/**
 * Models sub-audible cochlear, baroreceptor, and vestibular distress across species.
 */
export function calculateVestibularDread(
  frequencyHz: number,
  splDb: number,
  species: SpeciesId
): number {
  const splWeight = clamp((splDb - 70) / 48, 0, 1);
  let bandSensitivity = 0;

  if (species === 'avian') {
    // Avians directly hear infrasound down to 0.05 Hz with peak sensitivity 1-20 Hz
    bandSensitivity = clamp(1 - Math.abs(frequencyHz - 10) / 35, 0.4, 1.0);
  } else if (species === 'canine') {
    // Canines detect low-frequency structural vibration via Pacinian corpuscles & middle ear
    bandSensitivity = clamp(1 - Math.abs(frequencyHz - 16) / 28, 0.25, 0.95);
  } else if (species === 'feline') {
    bandSensitivity = clamp(1 - Math.abs(frequencyHz - 19) / 26, 0.2, 0.88);
  } else {
    // Human vestibular/vagus resonance peaks around 7-19 Hz ("fear frequency")
    bandSensitivity = Math.exp(-Math.pow((frequencyHz - 14.5) / 7.5, 2));
  }

  return clamp(splWeight * bandSensitivity * 100, 0, 100);
}

/**
 * Models Faraday electromagnetic induction in temporal cortex and cryptochrome radical-pair
 * magnetoreception disruption by pulsed ELF magnetic fields (uT).
 */
export function calculateEmfImpacts(
  magneticMicroTesla: number,
  species: SpeciesId
): { temporalInductionPct: number; magnetoreceptionPct: number } {
  // Normalized logarithmic saturation over 0.1 - 100 uT
  const logField = clamp(Math.log10(1 + magneticMicroTesla) / Math.log10(101), 0, 1);

  const temporalWeight: Record<SpeciesId, number> = {
    human: 0.92,
    canine: 0.72,
    feline: 0.68,
    avian: 0.55,
  };

  const magnetoWeight: Record<SpeciesId, number> = {
    human: 0.14,
    canine: 0.64,
    feline: 0.45,
    avian: 1.0,
  };

  return {
    temporalInductionPct: clamp(logField * temporalWeight[species] * 100, 0, 100),
    magnetoreceptionPct: clamp(logField * magnetoWeight[species] * 100, 0, 100),
  };
}

/**
 * Approximates steady-state Carboxyhemoglobin (%COHb) via linearized Haldane equilibrium
 * and derives neuro-hypoxic encephalopathy risk.
 */
export function calculateHypoxicLoad(
  coPpm: number,
  species: SpeciesId
): { coHbPct: number; encephalopathyPct: number } {
  const factor = SPECIES_CATALOG[species].metabolicCoFactor;
  // Ambient baseline ~0.8% COHb; at 100 ppm human steady-state approaches ~14-16% COHb
  const coHbPct = clamp(0.8 + coPpm * 0.145 * Math.pow(factor, 0.65), 0.8, 45);
  // Neurological hallucination / disorientation onset typically > 6% COHb
  const encephalopathyPct = clamp(((coHbPct - 2.5) / 18) * 100, 0, 100);
  return {
    coHbPct: Number(coHbPct.toFixed(2)),
    encephalopathyPct,
  };
}

/**
 * Models Bayesian predictive-coding pareidolia (false positive detection in low-SNR environments)
 * amplified by stochastic resonance and neuro-physiological arousal.
 */
export function calculatePareidoliaIndex(
  visualSnr: number,
  splDb: number,
  magneticMicroTesla: number,
  species: SpeciesId
): number {
  const ambiguity = clamp(1 - visualSnr, 0, 0.95);
  const arousalBoost =
    0.35 * clamp((splDb - 75) / 50, 0, 1) +
    0.25 * clamp(magneticMicroTesla / 80, 0, 1);
  // Humans have high neocortical pattern-completion bias (agency detection)
  const speciesCognitiveBias: Record<SpeciesId, number> = {
    human: 1.0,
    canine: 0.55,
    feline: 0.62,
    avian: 0.32,
  };
  return clamp((ambiguity * 0.72 + arousalBoost) * speciesCognitiveBias[species] * 100, 0, 100);
}

export function computeSpeciesImpact(
  params: EnvironmentParams,
  species: SpeciesId
): SensoryImpactProfile {
  const ocularResonancePct = calculateOcularResonance(params.frequencyHz, params.splDb, species);
  const vestibularDreadPct = calculateVestibularDread(params.frequencyHz, params.splDb, species);
  const emf = calculateEmfImpacts(params.magneticMicroTesla, species);
  const hypoxia = calculateHypoxicLoad(params.coPpm, species);
  const pareidoliaPct = calculatePareidoliaIndex(
    params.visualSnr,
    params.splDb,
    params.magneticMicroTesla,
    species
  );

  const axes: Array<[string, number]> = [
    ['Ocular Cavity Resonance', ocularResonancePct],
    ['Infrasonic Vestibular Stress', vestibularDreadPct],
    ['ELF Temporal Induction', emf.temporalInductionPct],
    ['Magnetoreception Disruption', emf.magnetoreceptionPct],
    ['CO Hypoxic Encephalopathy', hypoxia.encephalopathyPct],
    ['Low-SNR Predictive Pareidolia', pareidoliaPct],
  ];

  axes.sort((a, b) => b[1] - a[1]);
  const dominantTrigger = axes[0][1] >= 12 ? axes[0][0] : 'Baseline Sensory Equilibrium';

  // Root-mean-square weighted composite anomaly index
  const compositeAnomalyIndex = clamp(
    Math.sqrt(
      (ocularResonancePct ** 2 +
        vestibularDreadPct ** 2 +
        emf.temporalInductionPct ** 2 +
        emf.magnetoreceptionPct ** 2 +
        hypoxia.encephalopathyPct ** 2 +
        pareidoliaPct ** 2) /
        4.2
    ),
    0,
    100
  );

  return {
    species,
    ocularResonancePct: Number(ocularResonancePct.toFixed(1)),
    vestibularDreadPct: Number(vestibularDreadPct.toFixed(1)),
    emfTemporalPct: Number(emf.temporalInductionPct.toFixed(1)),
    magnetoreceptionPct: Number(emf.magnetoreceptionPct.toFixed(1)),
    hypoxicEncephalopathyPct: Number(hypoxia.encephalopathyPct.toFixed(1)),
    pareidoliaPct: Number(pareidoliaPct.toFixed(1)),
    compositeAnomalyIndex: Number(compositeAnomalyIndex.toFixed(1)),
    estimatedCoHbPct: hypoxia.coHbPct,
    dominantTrigger,
  };
}

export function computeAllSpeciesProfiles(
  params: EnvironmentParams
): Record<SpeciesId, SensoryImpactProfile> {
  return {
    human: computeSpeciesImpact(params, 'human'),
    canine: computeSpeciesImpact(params, 'canine'),
    feline: computeSpeciesImpact(params, 'feline'),
    avian: computeSpeciesImpact(params, 'avian'),
  };
}

/**
 * Bayesian Hypothesis Evaluator:
 * Compares H_physical (known neuro-physical mechanisms) vs H_non_local (unexplained/non-physical cause).
 * As measurable physical drivers (infrasound, ELF, CO, low SNR) increase, P(E | H_physical) rises sharply.
 */
export function calculateBayesianPosterior(
  params: EnvironmentParams,
  species: SpeciesId
): BayesianInferenceResult {
  const impact = computeSpeciesImpact(params, species);
  const priorPhysical = clamp(params.priorPhysical, 0.01, 0.99);
  const priorNonLocal = 1 - priorPhysical;

  // Evidence strength (0..1) from measurable physical anomalies
  const maxDriver = Math.max(
    impact.ocularResonancePct,
    impact.vestibularDreadPct,
    impact.emfTemporalPct,
    impact.magnetoreceptionPct,
    impact.hypoxicEncephalopathyPct,
    impact.pareidoliaPct
  ) / 100;

  // P(E | H_physical): probability of observing the reported perceptual anomaly given physical conditions
  const likelihoodPhysical = clamp(0.08 + 0.91 * Math.pow(maxDriver, 0.78), 0.05, 0.995);

  // P(E | H_non_local): auxiliary baseline likelihood assigned to non-physical hypotheses
  // Remains bounded and non-zero for mathematical falsifiability
  const likelihoodNonLocal = clamp(0.12 - 0.105 * Math.pow(maxDriver, 0.9), 0.008, 0.25);

  const likelihoodRatio = likelihoodPhysical / likelihoodNonLocal;
  const evidenceMarginal =
    likelihoodPhysical * priorPhysical + likelihoodNonLocal * priorNonLocal;

  const posteriorPhysical = (likelihoodPhysical * priorPhysical) / evidenceMarginal;
  const posteriorNonLocal = 1 - posteriorPhysical;

  let verdictLabel = 'Inconclusive — Baseline Noise';
  if (posteriorPhysical >= 0.95 && maxDriver >= 0.35) {
    verdictLabel = 'Physical Mechanism Confirmed';
  } else if (posteriorPhysical >= 0.8) {
    verdictLabel = 'Probable Neuro-Physical Origin';
  } else if (maxDriver < 0.18) {
    verdictLabel = 'Insufficient Physical Stimulus';
  } else {
    verdictLabel = 'Competing Hypotheses Active';
  }

  return {
    priorPhysical: Number(priorPhysical.toFixed(4)),
    priorNonLocal: Number(priorNonLocal.toFixed(4)),
    likelihoodPhysical: Number(likelihoodPhysical.toFixed(4)),
    likelihoodNonLocal: Number(likelihoodNonLocal.toFixed(4)),
    likelihoodRatio: Number(likelihoodRatio.toFixed(2)),
    posteriorPhysical: Number(posteriorPhysical.toFixed(4)),
    posteriorNonLocal: Number(posteriorNonLocal.toFixed(4)),
    verdictLabel,
  };
}

/**
 * Computes spatial standing wave pressure envelope p(x, t) across a corridor/chamber of length L (meters).
 * Uses speed of sound c = 343 m/s.
 */
export function computeStandingWaveProfile(
  frequencyHz: number,
  splDb: number,
  roomLengthM: number,
  timeSec: number,
  samples = 64
): Array<{ x: number; envelope: number; instantaneous: number }> {
  const c = 343;
  const k = (2 * Math.PI * frequencyHz) / c;
  const omega = 2 * Math.PI * frequencyHz;
  const amp = clamp((splDb - 55) / 75, 0.05, 1.0);
  const result: Array<{ x: number; envelope: number; instantaneous: number }> = [];

  for (let i = 0; i <= samples; i++) {
    const x = (i / samples) * roomLengthM;
    const spatial = Math.cos(k * x);
    const envelope = Math.abs(spatial) * amp;
    const instantaneous = spatial * Math.cos(omega * timeSec) * amp;
    result.push({
      x: Number(x.toFixed(2)),
      envelope: Number(envelope.toFixed(4)),
      instantaneous: Number(instantaneous.toFixed(4)),
    });
  }

  return result;
}

export interface RealWorldSummary {
  headline: string;
  humanExperience: string;
  animalExperience: string;
  firstCheckStep: string;
  safetyAlert: string | null;
}

/**
 * Translates raw physical parameters and computed neuro-sensory indices into
 * plain-English real-world symptoms and practical first steps anyone can check at home.
 */
export function translateToRealWorldSummary(
  params: EnvironmentParams,
  profiles: Record<SpeciesId, SensoryImpactProfile>,
  selectedSpecies: SpeciesId
): RealWorldSummary {
  const human = profiles.human;
  const active = profiles[selectedSpecies];

  const safetyAlert =
    params.coPpm >= 35
      ? `Safety Notice: ${params.coPpm.toFixed(0)} ppm Carbon Monoxide is above safe indoor limits (WHO 8-hr limit ~9 ppm; US NIOSH ceiling 35 ppm). Ventilate immediately and check fuel-burning appliances with a digital CO detector.`
      : null;

  if (params.coPpm >= 35) {
    return {
      headline: 'Likely Carbon Monoxide Exposure (Check Air Quality First)',
      humanExperience:
        'Unexplained dread, chest pressure, morning headaches, muffled footsteps, or shadowy peripheral vision caused by reduced oxygen delivery to the brain.',
      animalExperience:
        'Pets (especially birds, cats, and small dogs) often show sudden restlessness, lethargy, vomiting, or distress earlier than humans because of their faster breathing rate.',
      firstCheckStep:
        'Open windows and test the room with a digital low-level CO detector (displays 1–10+ ppm) near floor/bed level—do not rely on alarms that only sound above 70 ppm.',
      safetyAlert,
    };
  }

  if (human.ocularResonancePct >= 45 || active.vestibularDreadPct >= 55) {
    return {
      headline: 'Low-Frequency Sound / Fan Vibration Resonance',
      humanExperience:
        'A "heavy" or eerie room feeling, sudden chills, or faint gray shapes at the edge of vision when standing near a pressure zone—even though the room sounds quiet.',
      animalExperience:
        'Dogs and cats feel floor/air vibrations in their paws and inner ears, while birds actually hear sub-20 Hz sound—causing them to avoid a hallway or stare at walls.',
      firstCheckStep:
        'Switch off HVAC fans, bathroom extractors, refrigerators, or subwoofers one by one and use a phone spectrum app (e.g., Phyphox or Spectroid) to check for a 15–30 Hz spike.',
      safetyAlert,
    };
  }

  if (params.magneticMicroTesla >= 25) {
    return {
      headline: 'Strong Changing Magnetic Field Near Wiring or Motors',
      humanExperience:
        'Brief dizziness, disorientation, or the sudden feeling that someone is standing just behind you—especially near breaker panels, old ungrounded wiring, or bed headboards.',
      animalExperience:
        'Homing birds and dogs possess magnetic-sensing proteins (cryptochrome) and may pace, refuse to settle, or orient strangely near strong fluctuating electromagnetic sources.',
      firstCheckStep:
        'Open a magnetometer app (like Phyphox) and slowly move your phone along bedroom walls, outlets, and appliances to see if the magnetic reading jumps abruptly above ~60 µT.',
      safetyAlert,
    };
  }

  if (params.visualSnr <= 0.28) {
    return {
      headline: 'Low-Light Brain Pattern-Completion (Pareidolia)',
      humanExperience:
        'In very dim rooms, your visual and auditory cortex tries to guess missing details—turning coat racks, shadows, or fan white noise into human silhouettes or faint whispers.',
      animalExperience:
        'Cats and dogs see much better in dim light and hear high-pitched plumbing or rodent sounds (>25 kHz) that humans cannot hear, making them stare at walls that look empty to you.',
      firstCheckStep:
        'Turn on a lamp and verify whether the shape vanishes immediately; for pets staring at a wall, listen closely or record audio near pipes and electrical outlets.',
      safetyAlert,
    };
  }

  return {
    headline: 'Normal Baseline Room Conditions',
    humanExperience:
      'All modeled physical triggers (vibration, magnetic spikes, toxic gas, and darkness) are within normal everyday ranges.',
    animalExperience:
      'If a pet still reacts here, check ordinary localized cues like outdoor ultrasonic sounds, insects/rodents inside walls, or reflections.',
    firstCheckStep:
      'Adjust the sliders on the left—or choose a real-life scenario above—to see how specific room conditions affect humans and animals.',
    safetyAlert,
  };
}
