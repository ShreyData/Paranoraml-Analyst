import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 3000);
const isProduction = process.env.NODE_ENV === 'production';

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in the server environment.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

const INVESTIGATION_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    phenomenonTitle: {
      type: Type.STRING,
      description: 'Concise scientific title for the investigated phenomenon.',
    },
    empiricalClassification: {
      type: Type.STRING,
      description:
        'Must be one of: Confirmed Physical Mechanism, Neuro-Cognitive Artifact, Multi-Factor Convergence, or Unresolved Anomaly (Insufficient Data).',
    },
    realityVerdict: {
      type: Type.STRING,
      description:
        'Direct, unbiased, fear-free scientific summary stating what reality is occurring based on current physics, neuroscience, and statistics.',
    },
    humanNeurobiology: {
      type: Type.STRING,
      description:
        'How the human brain, sensory organs, or neurochemistry process or misinterpret this stimulus.',
    },
    animalSensoryEcology: {
      type: Type.STRING,
      description:
        'How non-human animals (e.g., dogs, cats, birds, rodents) perceive this stimulus differently due to auditory bandwidth, magnetoreception, olfaction, or baroreception.',
    },
    mathematicalModels: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          equation: { type: Type.STRING },
          quantitativeBounds: { type: Type.STRING },
        },
        required: ['name', 'equation', 'quantitativeBounds'],
      },
      description: '2 to 4 concrete physical or statistical equations governing the phenomenon.',
    },
    bayesianComparison: {
      type: Type.OBJECT,
      properties: {
        physicalHypothesisProbability: {
          type: Type.NUMBER,
          description: 'Estimated posterior probability between 0 and 1 for physical/neurological mechanisms.',
        },
        unresolvedAnomalyProbability: {
          type: Type.NUMBER,
          description: 'Residual probability between 0 and 1 for unknown/unmeasured physical variables.',
        },
        likelihoodRatioNote: {
          type: Type.STRING,
          description: 'Brief mathematical explanation of the Bayes factor / likelihood ratio.',
        },
      },
      required: [
        'physicalHypothesisProbability',
        'unresolvedAnomalyProbability',
        'likelihoodRatioNote',
      ],
    },
    falsifiableExperiment: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description:
        '3 to 5 concrete, falsifiable field or laboratory steps with instruments, control conditions, and rejection thresholds.',
    },
    peerReviewedReferences: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'Relevant real scientific papers, textbooks, or empirical studies.',
    },
  },
  required: [
    'phenomenonTitle',
    'empiricalClassification',
    'realityVerdict',
    'humanNeurobiology',
    'animalSensoryEcology',
    'mathematicalModels',
    'bayesianComparison',
    'falsifiableExperiment',
    'peerReviewedReferences',
  ],
};

interface InvestigateRequestBody {
  query?: string;
  includeTelemetry?: boolean;
  includeWebGrounding?: boolean;
  reasoningDepth?: 'standard' | 'deep';
  telemetrySnapshot?: {
    species: string;
    frequencyHz: number;
    splDb: number;
    magneticMicroTesla: number;
    coPpm: number;
    visualSnr: number;
    posteriorPhysical: number;
  };
}

function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms)),
  ]);
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, model: 'gemini-4-hydrogen' });
  });

  app.post('/api/investigate', async (req, res) => {
    try {
      const body = (req.body || {}) as InvestigateRequestBody;
      const query = (body.query || '').trim();

      if (!query || query.length < 4) {
        res.status(400).json({
          error: 'Please enter a specific phenomenon, case, or observation to investigate (at least 4 characters).',
        });
        return;
      }

      const ai = getGeminiClient();

      const telemetryContext =
        body.includeTelemetry && body.telemetrySnapshot
          ? `\n\nMeasured/Simulated Local Environmental Context:\n` +
            `- Target Observer Species: ${body.telemetrySnapshot.species}\n` +
            `- Infrasound Frequency: ${body.telemetrySnapshot.frequencyHz} Hz at ${body.telemetrySnapshot.splDb} dB SPL\n` +
            `- ELF Magnetic Flux Anomaly: ${body.telemetrySnapshot.magneticMicroTesla} µT\n` +
            `- Carbon Monoxide Concentration: ${body.telemetrySnapshot.coPpm} ppm\n` +
            `- Visual Signal-to-Noise Ratio: ${body.telemetrySnapshot.visualSnr}\n` +
            `- Baseline Bayesian Physical Posterior: ${(body.telemetrySnapshot.posteriorPhysical * 100).toFixed(2)}%`
          : '';

      const systemInstruction =
        'You are an unbiased, fear-free scientific, neurobiological, and mathematical research engine. ' +
        'Analyze reported paranormal, unexplained, or anomalous phenomena affecting human and animal minds strictly through ' +
        'physics, acoustics, electromagnetism, atmospheric chemistry, toxicology, evolutionary neuroscience, and Bayesian probability. ' +
        'Never sensationalize, never validate superstition without evidence, and never dismiss genuinely unexplained physical data without noting remaining uncertainty bounds. ' +
        'Be rigorous, concise, quantitative, and clear.';

      const prompt =
        `Conduct an evidence-based scientific and mathematical investigation of the following phenomenon:\n\n"${query}"` +
        telemetryContext +
        `\n\nProvide concrete physical equations, human vs. animal sensory mechanisms, Bayesian likelihood reasoning, and a falsifiable measurement protocol.`;

      const thinkingLevel =
        body.reasoningDepth === 'deep' ? ThinkingLevel.HIGH : ThinkingLevel.MEDIUM;

      const structuredPromise = ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: prompt,
        config: {
          systemInstruction,
          thinkingConfig: {
            thinkingLevel,
          },
          responseMimeType: 'application/json',
          responseSchema: INVESTIGATION_SCHEMA,
        },
      });

      const groundingPromise: Promise<Array<{ title: string; uri: string }>> =
        body.includeWebGrounding
          ? withTimeout(
              ai.models
                .generateContent({
                  model: 'gemini-4-hydrogen',
                  contents: `Identify 3-5 peer-reviewed scientific studies or authoritative physics/neuroscience sources explaining: "${query}".`,
                  config: {
                    thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
                    tools: [{ googleSearch: {} }],
                  },
                })
                .then((searchResp) => {
                  const chunks =
                    searchResp.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];
                  return chunks
                    .map((chunk) => chunk.web)
                    .filter((w): w is { uri: string; title: string } => Boolean(w?.uri && w?.title))
                    .slice(0, 6);
                })
                .catch(() => []),
              15000,
              []
            )
          : Promise.resolve([]);

      const [structuredResponse, webSources] = await Promise.all([
        structuredPromise,
        groundingPromise,
      ]);

      const rawText = (structuredResponse.text ?? '{}').trim();
      let analysis: Record<string, unknown>;
      try {
        analysis = JSON.parse(rawText);
      } catch {
        res.status(502).json({
          error: 'The scientific analysis engine returned malformed JSON. Please retry the inquiry.',
        });
        return;
      }

      res.json({
        analysis,
        webSources,
        model: 'gemini-4-hydrogen',
        analyzedAt: new Date().toISOString(),
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unexpected server error during investigation.';
      const status =
        message.includes('GEMINI_API_KEY') || message.includes('API_KEY_INVALID')
          ? 500
          : message.includes('429') || message.includes('RESOURCE_EXHAUSTED')
            ? 429
            : 500;
      res.status(status).json({ error: message });
    }
  });

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('/{*splat}', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`NullHypothesis Lab server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
