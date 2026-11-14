import React, { useEffect, useRef, useState } from 'react';
import { Mic, MicOff } from 'lucide-react';
import type { EnvironmentParams } from '../physics/anomalyMath';

interface HowToMeasureViewProps {
  params: EnvironmentParams;
  onApplyMeasuredAudio: (frequencyHz: number, splDb: number) => void;
  onSelectEverydayScenario: (scenarioId: string) => void;
}

const MEASUREMENT_GUIDE_STEPS = [
  {
    parameter: '1. Room Vibration & Low Sound (Hz & dB)',
    whatItIs:
      'Low-frequency air pressure waves from HVAC ducts, bathroom exhaust fans, wind across chimneys, or subwoofers—often felt as chest heaviness or "eerie silence" rather than heard.',
    toolsNeeded: 'Free app: Phyphox (Audio Spectrum / Pressure) or Spectroid (Android) · Optional: Digital dB meter (~$25)',
    howToMeasure: [
      'Stand in the exact spot in the room or hallway that feels uncomfortable and hold the phone steady for 15 seconds.',
      'Look at the bottom of the frequency graph (10–40 Hz) for a tall, narrow spike instead of a flat line.',
      'Run the Breaker Isolation Test: turn off air conditioning, exhaust fans, and refrigerators one by one and watch whether that exact frequency spike disappears.',
    ],
  },
  {
    parameter: '2. Magnetic Field Spikes (µT)',
    whatItIs:
      'Invisible magnetic pulses created by old ungrounded home wiring, high-current breaker boxes, faulty transformers, or motors running behind a bedroom wall.',
    toolsNeeded: 'Your phone’s built-in compass sensor via the free Phyphox app ("Magnetometer") or a 3-axis Gauss/EMF meter',
    howToMeasure: [
      'In a normal room, Earth’s steady magnetic field reads around 25–65 µT and barely changes as you hold the phone still.',
      'Slowly sweep your phone along the bed headboard, pillows, wall outlets, and behind heavy appliances.',
      'Watch for sudden jumps (+20 µT or more) or rapid pulsing oscillation—not the steady baseline.',
    ],
  },
  {
    parameter: '3. Carbon Monoxide Gas (ppm)',
    whatItIs:
      'Colorless, odorless gas from cracked furnace heat exchangers, blocked water-heater flues, or attached garages. Even mild leaks cause dread, headaches, footsteps, and shadow hallucinations.',
    toolsNeeded: 'A digital low-level Carbon Monoxide monitor (must have an LCD screen showing 1–10+ ppm; standard alarms only beep at 70+ ppm)',
    howToMeasure: [
      'Note: Smartphones do NOT have gas sensors—no phone app can measure carbon monoxide.',
      'Place a digital low-level CO display near sleeping height in the bedroom and near utility rooms overnight.',
      'Any sustained reading above 9 ppm warrants ventilation and appliance inspection; 35+ ppm requires immediate fresh air and professional service.',
    ],
  },
  {
    parameter: '4. Darkness, Reflections & Ultrasonic Pet Triggers',
    whatItIs:
      'Dim lighting forces the human brain to guess shapes out of shadows (pareidolia), while dogs and cats hear 25–65 kHz pipe cavitation, electrical whine, or rodents behind drywall.',
    toolsNeeded: 'Room lamp, smartphone audio spectrogram (20–48 kHz check), and a 2-angle video check',
    howToMeasure: [
      'Light Control Test: When you see a shadow figure, turn on a bright lamp without moving your head—if it vanishes into a coat, curtain, or shadow edge, it was low-SNR pattern completion.',
      'Pet Corner Test: If a dog or cat stares at an empty wall, record 30 seconds of audio right against the baseboard and inspect high frequencies or tap softly to check for hollow voids/pests.',
      'Always log time, light level, and whether a second person or pet reacts independently before concluding anything is unexplained.',
    ],
  },
];

export const HowToMeasureView: React.FC<HowToMeasureViewProps> = ({
  params,
  onApplyMeasuredAudio,
  onSelectEverydayScenario,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  const [measuredDb, setMeasuredDb] = useState<number | null>(null);
  const [measuredPeakHz, setMeasuredPeakHz] = useState<number | null>(null);
  const [appliedNotice, setAppliedNotice] = useState(false);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);

  const stopListening = () => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (audioCtxRef.current) {
      void audioCtxRef.current.close();
      audioCtxRef.current = null;
    }
    setIsListening(false);
  };

  useEffect(() => {
    return () => stopListening();
  }, []);

  const startListening = async () => {
    setMicError(null);
    setAppliedNotice(false);

    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setMicError(
        'Microphone access is not available in this browser environment. You can still follow the step-by-step phone & meter guide below.'
      );
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });
      streamRef.current = stream;

      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      audioCtxRef.current = ctx;

      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 8192;
      analyser.smoothingTimeConstant = 0.75;
      source.connect(analyser);

      const timeData = new Float32Array(analyser.fftSize);
      const freqData = new Uint8Array(analyser.frequencyBinCount);
      const hzPerBin = ctx.sampleRate / analyser.fftSize;

      setIsListening(true);

      const sampleLoop = () => {
        analyser.getFloatTimeDomainData(timeData);
        let sumSq = 0;
        for (let i = 0; i < timeData.length; i++) {
          sumSq += timeData[i] * timeData[i];
        }
        const rms = Math.sqrt(sumSq / timeData.length);
        // Approximate uncalibrated room SPL mapping (-60 dBFS quiet room ~ 42 dB, -10 dBFS ~ 92 dB)
        const dbfs = 20 * Math.log10(Math.max(rms, 1e-5));
        const approxSpl = Math.max(35, Math.min(120, 102 + dbfs));

        analyser.getByteFrequencyData(freqData);
        const minBin = Math.max(1, Math.floor(8 / hzPerBin));
        const maxBin = Math.min(freqData.length - 1, Math.ceil(120 / hzPerBin));
        let bestBin = minBin;
        let bestVal = -1;
        for (let b = minBin; b <= maxBin; b++) {
          if (freqData[b] > bestVal) {
            bestVal = freqData[b];
            bestBin = b;
          }
        }

        setMeasuredDb(Number(approxSpl.toFixed(1)));
        setMeasuredPeakHz(Number((bestBin * hzPerBin).toFixed(1)));
        rafRef.current = requestAnimationFrame(sampleLoop);
      };

      rafRef.current = requestAnimationFrame(sampleLoop);
    } catch (err) {
      stopListening();
      setMicError(
        err instanceof Error
          ? `Could not access microphone (${err.message}). Allow microphone access or use a mobile app like Phyphox as explained below.`
          : 'Microphone permission was denied.'
      );
    }
  };

  const handleApplyToSimulator = () => {
    if (measuredDb === null || measuredPeakHz === null) return;
    const clampedHz = Math.max(4, Math.min(40, measuredPeakHz));
    const clampedDb = Math.max(60, Math.min(130, Math.round(measuredDb)));
    onApplyMeasuredAudio(clampedHz, clampedDb);
    setAppliedNotice(true);
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header + Quick Everyday Scenarios */}
      <section className="border border-slate-800 bg-[#0B0F17] p-5">
        <h1 className="text-xl font-semibold text-slate-100">
          How to Measure Real-World Room Conditions Yourself
        </h1>
        <p className="mt-1.5 text-sm leading-relaxed text-slate-300 max-w-3xl">
          You do not need expensive ghost-hunting gadgets—most "paranormal" room sensations can be
          measured with your smartphone, a $25 digital CO detector, and simple elimination tests.
          Pick what you are noticing below, or follow the measurement steps.
        </p>

        <div className="mt-4 pt-4 border-t border-slate-800">
          <div className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-2.5">
            Quick Real-Life Symptom Presets (Loads Simulator Automatically)
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2.5">
            <button
              type="button"
              onClick={() => onSelectEverydayScenario('tandy-infrasound')}
              className="rounded border border-slate-800 bg-[#07090E] p-3 text-left text-xs text-slate-200 hover:border-cyan-500/60"
            >
              <div className="font-semibold text-cyan-300">Uneasy Hallway / Peripheral Shadows</div>
              <div className="mt-1 text-slate-400">Tests 18.9 Hz fan or duct vibration</div>
            </button>

            <button
              type="button"
              onClick={() => onSelectEverydayScenario('stochastic-evp')}
              className="rounded border border-slate-800 bg-[#07090E] p-3 text-left text-xs text-slate-200 hover:border-cyan-500/60"
            >
              <div className="font-semibold text-cyan-300">Pet Staring / Barking at Empty Wall</div>
              <div className="mt-1 text-slate-400">Tests acoustic corner echoes & dim light</div>
            </button>

            <button
              type="button"
              onClick={() => onSelectEverydayScenario('rem-sleep-paralysis')}
              className="rounded border border-slate-800 bg-[#07090E] p-3 text-left text-xs text-slate-200 hover:border-cyan-500/60"
            >
              <div className="font-semibold text-cyan-300">Dark Figure While Paralyzed in Bed</div>
              <div className="mt-1 text-slate-400">Tests REM sleep intrusion & low light</div>
            </button>

            <button
              type="button"
              onClick={() => onSelectEverydayScenario('co-hypoxia-haunting')}
              className="rounded border border-slate-800 bg-[#07090E] p-3 text-left text-xs text-slate-200 hover:border-cyan-500/60"
            >
              <div className="font-semibold text-rose-300">Headaches, Chest Weight & Footsteps</div>
              <div className="mt-1 text-slate-400">Tests hidden carbon monoxide leak</div>
            </button>
          </div>
        </div>
      </section>

      {/* Live Browser Microphone Acoustic Scanner */}
      <section
        aria-label="Live Room Sound Check"
        className="border border-slate-800 bg-[#0B0F17] p-5 space-y-4"
      >
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-base font-semibold text-slate-100">
              Live Room Sound & Low-Frequency Check (Uses Your Microphone)
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-slate-400 max-w-2xl">
              Measures real-time room sound directly in your browser—nothing is recorded or uploaded.
              Note: standard device microphones weaken sounds below ~25 Hz, so they best detect
              25–120 Hz fan hums; use a barometer app for true &lt;20 Hz infrasound.
            </p>
          </div>

          <button
            type="button"
            onClick={() => (isListening ? stopListening() : void startListening())}
            className={`inline-flex items-center gap-2 whitespace-nowrap rounded px-4 py-2 text-xs font-semibold transition-colors ${
              isListening
                ? 'bg-rose-500 text-slate-950 hover:bg-rose-400'
                : 'bg-cyan-500 text-slate-950 hover:bg-cyan-400'
            }`}
          >
            {isListening ? (
              <>
                <MicOff className="h-4 w-4" aria-hidden="true" />
                Stop Sound Check
              </>
            ) : (
              <>
                <Mic className="h-4 w-4" aria-hidden="true" />
                Start Room Sound Check
              </>
            )}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
          <div className="border border-slate-800 bg-[#07090E] p-3.5">
            <div className="font-mono text-[11px] uppercase text-slate-400">
              Estimated Room Loudness
            </div>
            <div className="mt-1 font-mono text-2xl font-bold text-slate-100 tabular-nums">
              {measuredDb !== null ? `${measuredDb.toFixed(1)} dB` : '—'}
            </div>
            <div className="mt-0.5 text-[11px] text-slate-400">
              Simulator currently at {params.splDb.toFixed(0)} dB
            </div>
          </div>

          <div className="border border-slate-800 bg-[#07090E] p-3.5">
            <div className="font-mono text-[11px] uppercase text-slate-400">
              Dominant Low-Band Peak
            </div>
            <div className="mt-1 font-mono text-2xl font-bold text-cyan-300 tabular-nums">
              {measuredPeakHz !== null ? `${measuredPeakHz.toFixed(1)} Hz` : '—'}
            </div>
            <div className="mt-0.5 text-[11px] text-slate-400">
              Scanning 8 – 120 Hz mechanical band
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <button
              type="button"
              disabled={measuredDb === null || measuredPeakHz === null}
              onClick={handleApplyToSimulator}
              className="whitespace-nowrap rounded border border-slate-700 bg-[#07090E] px-4 py-2.5 text-xs font-medium text-slate-100 hover:border-cyan-400 disabled:opacity-45 disabled:cursor-not-allowed"
            >
              Apply Measured Sound to Lab
            </button>
            {appliedNotice && (
              <span className="font-mono text-xs text-emerald-400">
                ● Applied reading to Wave Lab simulator
              </span>
            )}
          </div>
        </div>

        {micError && (
          <div
            role="alert"
            className="rounded border border-amber-500/50 bg-amber-950/30 p-3 text-xs text-amber-200"
          >
            {micError}
          </div>
        )}
      </section>

      {/* Step-by-step measurement guide for all 5 parameters */}
      <section aria-label="Field Measurement Checklist" className="border border-slate-800 bg-[#0B0F17]">
        <div className="border-b border-slate-800 px-5 py-3.5">
          <h2 className="text-sm font-semibold text-slate-100">
            Step-by-Step Guide: How to Measure Each Parameter at Home
          </h2>
        </div>

        <div className="divide-y divide-slate-800">
          {MEASUREMENT_GUIDE_STEPS.map((item) => (
            <article key={item.parameter} className="p-5 space-y-2.5">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="text-base font-semibold text-cyan-300">{item.parameter}</h3>
                <span className="font-mono text-xs text-amber-300">{item.toolsNeeded}</span>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed">{item.whatItIs}</p>
              <ol className="list-decimal list-inside space-y-1 text-xs text-slate-300 leading-relaxed pt-1">
                {item.howToMeasure.map((step, i) => (
                  <li key={i}>{step}</li>
                ))}
              </ol>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
};
