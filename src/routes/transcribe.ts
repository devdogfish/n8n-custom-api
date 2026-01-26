import { Router } from "express";
import multer from "multer";
import { spawn } from "child_process";
import type { AutomaticSpeechRecognitionPipeline } from "@xenova/transformers";
import wavefile from "wavefile";

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

// Convert any audio format to WAV using ffmpeg
const convertToWav = (inputBuffer: Buffer): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    const ffmpeg = spawn("ffmpeg", [
      "-i", "pipe:0",           // Read from stdin
      "-ar", "16000",           // Sample rate 16kHz (Whisper requirement)
      "-ac", "1",               // Mono
      "-f", "wav",              // Output format WAV
      "-acodec", "pcm_s16le",   // 16-bit PCM
      "pipe:1",                 // Write to stdout
    ]);

    let outputBuffer = Buffer.alloc(0);

    ffmpeg.stdout.on("data", (chunk) => {
      outputBuffer = Buffer.concat([outputBuffer, chunk]);
    });
    ffmpeg.stderr.on("data", (data) => {
      // ffmpeg outputs progress to stderr, only log errors
      const msg = data.toString();
      if (msg.includes("Error") || msg.includes("Invalid")) {
        console.error("ffmpeg:", msg);
      }
    });

    ffmpeg.on("close", (code) => {
      if (code === 0) {
        resolve(outputBuffer);
      } else {
        reject(new Error(`ffmpeg exited with code ${code}`));
      }
    });

    ffmpeg.on("error", (err) => reject(err));

    // Write input buffer to ffmpeg stdin
    ffmpeg.stdin.write(inputBuffer);
    ffmpeg.stdin.end();
  });
};

// Convert WAV buffer to Float32Array for Whisper (normalized -1 to 1)
const wavToFloat32 = (wavBuffer: Buffer): Float32Array => {
  const wav = new wavefile.WaveFile();
  wav.fromBuffer(new Uint8Array(wavBuffer));

  // Convert to 32-bit float which normalizes samples to -1.0 to 1.0
  wav.toBitDepth("32f");

  // getSamples returns Float64Array after 32f conversion
  const samples = wav.getSamples(false);
  return new Float32Array(samples);
};

router.post("/transcribe", upload.single("file"), async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    console.log(`Transcribing: ${file.originalname} (${(file.buffer.length / 1024).toFixed(1)} KB)`);

    // Convert any audio format to WAV via ffmpeg
    const wavBuffer = await convertToWav(file.buffer);

    // Convert WAV to Float32Array for Whisper
    const audioData = wavToFloat32(wavBuffer);
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
