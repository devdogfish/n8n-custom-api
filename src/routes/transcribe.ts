import { Router } from "express";
import multer from "multer";
import type { AutomaticSpeechRecognitionPipeline } from "@xenova/transformers";
import { OggOpusDecoder } from "ogg-opus-decoder";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Singleton transcriber instance
let transcriber: AutomaticSpeechRecognitionPipeline | null = null;

const getTranscriber = async (): Promise<AutomaticSpeechRecognitionPipeline> => {
  if (!transcriber) {
    // Dynamic import
    const { pipeline } = await import("@xenova/transformers");

    // 'Xenova/whisper-tiny.en' is faster. Use 'Xenova/whisper-base' for better accuracy.
    transcriber = await pipeline(
      "automatic-speech-recognition",
      "Xenova/whisper-tiny.en",
    );
  }
  return transcriber;
};

/**
 * Downsample audio from sourceRate to targetRate using linear interpolation.
 * For 48kHz → 16kHz, this is a 3:1 ratio.
 */
const downsample = (
  samples: Float32Array,
  sourceRate: number,
  targetRate: number
): Float32Array => {
  if (sourceRate === targetRate) {
    return samples;
  }

  const ratio = sourceRate / targetRate;
  const newLength = Math.floor(samples.length / ratio);
  const result = new Float32Array(newLength);

  for (let i = 0; i < newLength; i++) {
    // Linear interpolation for smoother downsampling
    const srcIndex = i * ratio;
    const srcIndexFloor = Math.floor(srcIndex);
    const srcIndexCeil = Math.min(srcIndexFloor + 1, samples.length - 1);
    const fraction = srcIndex - srcIndexFloor;

    result[i] =
      samples[srcIndexFloor] * (1 - fraction) +
      samples[srcIndexCeil] * fraction;
  }

  return result;
};

/**
 * Convert stereo to mono by averaging channels
 */
const toMono = (channelData: Float32Array[]): Float32Array => {
  if (channelData.length === 1) {
    return channelData[0];
  }

  // Average all channels
  const length = channelData[0].length;
  const mono = new Float32Array(length);
  const numChannels = channelData.length;

  for (let i = 0; i < length; i++) {
    let sum = 0;
    for (let ch = 0; ch < numChannels; ch++) {
      sum += channelData[ch][i];
    }
    mono[i] = sum / numChannels;
  }

  return mono;
};

/**
 * Decode OGG Opus file to 16kHz mono Float32Array for Whisper
 */
const decodeOggOpus = async (buffer: Buffer): Promise<Float32Array> => {
  const decoder = new OggOpusDecoder();
  await decoder.ready;

  try {
    const decoded = await decoder.decodeFile(new Uint8Array(buffer));

    if (decoded.errors.length > 0) {
      console.warn("Decode warnings:", decoded.errors);
    }

    // Convert to mono
    const mono = toMono(decoded.channelData);

    // Downsample from 48kHz to 16kHz
    const resampled = downsample(mono, decoded.sampleRate, 16000);

    return resampled;
  } finally {
    decoder.free();
  }
};

router.post("/transcribe-ogg", upload.single("file"), async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    console.log(
      `Transcribing: ${file.originalname} (${(file.buffer.length / 1024).toFixed(1)} KB)`
    );

    // Decode OGG Opus to 16kHz mono Float32Array
    const audioData = await decodeOggOpus(file.buffer);
    const duration = (audioData.length / 16000).toFixed(1);

    const pipe = await getTranscriber();
    const result = await pipe(audioData);

    console.log(`Transcribed ${duration}s of audio`);

    // Handle both single result and array result
    const output = Array.isArray(result) ? result[0] : result;

    res.json({
      text: output.text,
      model: "whisper-tiny.en",
    });
  } catch (error) {
    console.error("Transcription error:", error);
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
