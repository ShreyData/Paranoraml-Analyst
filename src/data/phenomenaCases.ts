import type { EnvironmentParams, SpeciesId } from '../physics/anomalyMath';

export type PhenomenonCategory =
  | 'Acoustic'
  | 'Electromagnetic'
  | 'Neurological'
  | 'Atmospheric'
  | 'Toxicological';

export interface PhenomenonCase {
  id: string;
  title: string;
  location: string;
  year: string;
  category: PhenomenonCategory;
  coordinates: string;
  empiricalStatus: 'Resolved Physical Mechanism' | 'Multi-Factor Neuro-Physical' | 'Partially Resolved';
  primarySpeciesAffected: SpeciesId[];
  humanSymptoms: string;
  animalBehavior: string;
  physicalSummary: string;
  governingFormula: string;
  citation: string;
  defaultParams: EnvironmentParams;
}

export const PHENOMENA_CASES: PhenomenonCase[] = [
  {
    id: 'tandy-infrasound',
    title: 'Coventry 18.9 Hz Standing Wave ("Ghost in the Machine")',
    location: 'Coventry, United Kingdom',
    year: '1998',
    category: 'Acoustic',
    coordinates: '52.4068° N, 1.5197° W',
    empiricalStatus: 'Resolved Physical Mechanism',
    primarySpeciesAffected: ['human', 'canine', 'avian'],
    humanSymptoms:
      'Acute dread, cold chills, peripheral gray visual apparitions moving across the edge of vision without direct focus.',
    animalBehavior:
      'Working dogs and horses abruptly refuse entry into enclosed corridors, pace restlessly, or exhibit unprovoked flight responses.',
    physicalSummary:
      'Vic Tandy identified a newly installed extractor fan generating an 18.98 Hz standing wave across a 9.05 m laboratory corridor. Because the human eyeball resonates mechanically near 18 Hz (NASA Technical Report 19770013810), standing-wave pressure nodes vibrated the vitreous humor and triggered peripheral rod-cell illusions.',
    governingFormula: 'f_n = (n · c) / (2 · L) ≈ 18.98 Hz at L = 9.05 m',
    citation: 'Tandy, V. & Lawrence, T. R. (1998). Journal of the Society for Psychical Research, 62(851), 360–364.',
    defaultParams: {
      frequencyHz: 18.9,
      splDb: 108,
      magneticMicroTesla: 1.2,
      coPpm: 2,
      visualSnr: 0.38,
      priorPhysical: 0.85,
    },
  },
  {
    id: 'persinger-elf',
    title: 'Pulsed ELF Geomagnetic Induction & "Sensed Presence"',
    location: 'Laurentian Basin / Hessdalen Valley',
    year: '1983–2014',
    category: 'Electromagnetic',
    coordinates: '62.8167° N, 11.1833° E',
    empiricalStatus: 'Multi-Factor Neuro-Physical',
    primarySpeciesAffected: ['human', 'avian', 'canine'],
    humanSymptoms:
      'Unmistakable feeling of an invisible sentient presence behind or beside the observer, sudden temporal disorientation, and emotional awe.',
    animalBehavior:
      'Migratory birds disorient and break formation; dogs stare fixedly along geomagnetic alignment vectors or exhibit sudden agitation before seismic transients.',
    physicalSummary:
      'Tectonic stress in quartz-bearing rock generates piezoelectric ELF magnetic pulses (1–50 µT). In humans, asymmetric complex pulsed magnetic fields induce weak currents across the temporoparietal junction, disrupting self-other body-schema integration. In birds, the same fields perturb radical-pair Cryptochrome-4 magnetoreception.',
    governingFormula: 'ℰ = -N · (dΦ_B / dt),  J_induced = σ · |E|',
    citation: 'Persinger, M. A. et al. (2000). Perceptual and Motor Skills; Hiscock et al. (2016). PNAS.',
    defaultParams: {
      frequencyHz: 11.4,
      splDb: 74,
      magneticMicroTesla: 62.0,
      coPpm: 1,
      visualSnr: 0.3,
      priorPhysical: 0.85,
    },
  },
  {
    id: 'rem-sleep-paralysis',
    title: 'Hypnagogic REM Intrusion ("The Night Shadow Entity")',
    location: 'Global Clinical Cohorts',
    year: 'Documented 1664–2026',
    category: 'Neurological',
    coordinates: 'Global · Cross-Cultural',
    empiricalStatus: 'Resolved Physical Mechanism',
    primarySpeciesAffected: ['human'],
    humanSymptoms:
      'Complete skeletal muscle paralysis upon waking, crushing chest pressure, vivid dark humanoid figure near the bed, and auditory footsteps.',
    animalBehavior:
      'Domestic pets sleeping nearby often remain completely calm—providing an empirical external control confirming the stimulus is endogenous to the human sleeper.',
    physicalSummary:
      'Dissociated state where cortical consciousness reactivates while pontine GABA/glycine motor-neuron inhibition (REM atonia) persists. Hyper-activation of the amygdala and superior temporal gyrus projects an evolved hyperactive agency-detection threat schema onto low-SNR bedroom shadows.',
    governingFormula: 'P(Threat | Low SNR) ∝ P(Noise | Threat) · P(Threat)',
    citation: 'Jalal, B. & Ramachandran, V. S. (2014). Medical Hypotheses; Cheyne, J. A. (2003). Consciousness & Cognition.',
    defaultParams: {
      frequencyHz: 8.5,
      splDb: 66,
      magneticMicroTesla: 4.5,
      coPpm: 3,
      visualSnr: 0.12,
      priorPhysical: 0.85,
    },
  },
  {
    id: 'silicon-ball-lightning',
    title: 'Atmospheric Plasma Solitons & Ball Lightning',
    location: 'Qinghai Plateau & Global Storm Belts',
    year: '2012 Spectral Capture',
    category: 'Atmospheric',
    coordinates: '36.6171° N, 101.7782° E',
    empiricalStatus: 'Partially Resolved',
    primarySpeciesAffected: ['human', 'canine', 'feline', 'avian'],
    humanSymptoms:
      'Luminous 15–40 cm floating sphere persisting 1–5 seconds, hissing sound, ozone odor, and occasional magnetophosphene flashes.',
    animalBehavior:
      'Piloerection in cats and dogs, agitated whining, and mass avian flock dispersal seconds before luminous formation due to rapid local electrostatic field gradients (>10 kV/m).',
    physicalSummary:
      '2012 optical spectroscopy captured silicon, iron, and calcium emission lines during a natural ball lightning event, supporting Abrahamson & Dinniss (2000): cloud-to-ground lightning vaporizes soil silicates into a buoyant filamentary aerosol oxidizing slowly in atmospheric oxygen.',
    governingFormula: 'SiO₂ + 2C → Si + 2CO;  τ_burn ∝ r₀² / D_O₂',
    citation: 'Cen, J., Yuan, P., & Xue, S. (2014). Physical Review Letters, 112(3), 035001.',
    defaultParams: {
      frequencyHz: 24.0,
      splDb: 96,
      magneticMicroTesla: 88.0,
      coPpm: 14,
      visualSnr: 0.55,
      priorPhysical: 0.85,
    },
  },
  {
    id: 'stochastic-evp',
    title: 'Acoustic Shadowing & Stochastic Resonance ("EVP Voices")',
    location: 'Historic Stone & Vaulted Structures',
    year: 'Controlled Lab Trials',
    category: 'Acoustic',
    coordinates: '48.8566° N, 2.3522° E',
    empiricalStatus: 'Resolved Physical Mechanism',
    primarySpeciesAffected: ['human', 'feline', 'canine'],
    humanSymptoms:
      'Perceiving faint whispered words, names, or rhythmic footsteps inside broadband white noise, ventilation hum, or distant radio carrier bleed.',
    animalBehavior:
      'Cats and dogs orient pinnae toward walls emitting 25–60 kHz plumbing cavitation or electrical transformer harmonics completely above human hearing.',
    physicalSummary:
      'When speech-expectation priors are high and acoustic SNR is below -6 dB, human Wernicke auditory predictive coding coerces broadband noise fluctuations into phoneme templates (auditory pareidolia). Meanwhile, animals react directly to real ultrasonic plumbing/electrical transients.',
    governingFormula: "d' = z(Hit Rate) - z(False Alarm),  SNR_eff = 10 log₁₀(P_signal / P_noise)",
    citation: 'Nees, M. A. & Phillips, C. (2015). Applied Cognitive Psychology, 29(1), 129–135.',
    defaultParams: {
      frequencyHz: 29.5,
      splDb: 84,
      magneticMicroTesla: 3.0,
      coPpm: 2,
      visualSnr: 0.22,
      priorPhysical: 0.85,
    },
  },
  {
    id: 'co-hypoxia-haunting',
    title: 'Sub-Lethal Carbon Monoxide & Mycotoxin Encephalopathy',
    location: 'Wilmer Case (1921) & Unventilated Residences',
    year: '1921–2024',
    category: 'Toxicological',
    coordinates: '41.8781° N, 87.6298° W',
    empiricalStatus: 'Resolved Physical Mechanism',
    primarySpeciesAffected: ['human', 'feline', 'canine', 'avian'],
    humanSymptoms:
      'Auditory footsteps, chest tightness, sensation of being watched or choked at night, peripheral visual scotomas, and chronic morning fatigue.',
    animalBehavior:
      'Smaller animals (birds, cats, small dogs) show ataxia, vomiting, vocal distress, or lethargy earlier than humans due to higher minute ventilation per kg.',
    physicalSummary:
      'Classic 1921 ophthalmology case documented by Dr. William H. Wilmer: a family experienced full "haunting" hallucinations caused by a defective furnace leaking CO. Carbon monoxide binds hemoglobin with ~210× the affinity of O₂, inducing basal ganglia and occipital-cortex hypoxia.',
    governingFormula: '[COHb] / [O₂Hb] = M · (P_CO / P_O₂),  M ≈ 210',
    citation: 'Wilmer, W. H. (1921). American Journal of Ophthalmology, 4(2), 73–90.',
    defaultParams: {
      frequencyHz: 14.0,
      splDb: 78,
      magneticMicroTesla: 1.5,
      coPpm: 95,
      visualSnr: 0.34,
      priorPhysical: 0.85,
    },
  },
];
