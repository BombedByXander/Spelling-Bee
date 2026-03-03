export interface SoundPack {
  id: string;
  name: string;
  description: string;
  cost: number;
  play: () => void;
  playBackspace: () => void;
  playEnter: () => void;
}

const audioCtx =
  typeof window !== "undefined"
    ? new (window.AudioContext || (window as any).webkitAudioContext)()
    : null;

function ensureAudioReady(onReady: () => void) {
  if (!audioCtx) return;
  if (audioCtx.state === "suspended") {
    audioCtx
      .resume()
      .then(() => onReady())
      .catch(() => {});
    return;
  }
  onReady();
}

function createNoiseBuffer(duration: number, strength: number) {
  if (!audioCtx) return null;
  const bufferSize = audioCtx.sampleRate * duration;
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let index = 0; index < bufferSize; index++) {
    data[index] = (Math.random() * 2 - 1) * strength;
  }
  return buffer;
}

function playTap(params: {
  duration: number;
  noiseFreq: number;
  noiseQ: number;
  noiseGain: number;
  toneFreq: number;
  toneGain: number;
  waveform?: OscillatorType;
  noiseStrength?: number;
}) {
  if (!audioCtx) return;
  ensureAudioReady(() => {
    const now = audioCtx.currentTime;
    const noiseBuffer = createNoiseBuffer(params.duration, params.noiseStrength ?? 0.1);
    if (!noiseBuffer) return;

    const noise = audioCtx.createBufferSource();
    noise.buffer = noiseBuffer;
    const filter = audioCtx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = params.noiseFreq;
    filter.Q.value = params.noiseQ;
    const noiseGain = audioCtx.createGain();
    noiseGain.gain.setValueAtTime(params.noiseGain, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + params.duration);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(audioCtx.destination);
    noise.start(now);
    noise.stop(now + params.duration);

    const osc = audioCtx.createOscillator();
    const oscGain = audioCtx.createGain();
    osc.type = params.waveform ?? "triangle";
    osc.frequency.setValueAtTime(params.toneFreq, now);
    oscGain.gain.setValueAtTime(params.toneGain, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + params.duration);
    osc.connect(oscGain);
    oscGain.connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + params.duration);
  });
}

function playWave(waveform: OscillatorType, frequency: number, duration = 0.08, gain = 0.08) {
  if (!audioCtx) return;
  ensureAudioReady(() => {
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const oscGain = audioCtx.createGain();
    osc.type = waveform;
    osc.frequency.setValueAtTime(frequency, now);
    oscGain.gain.setValueAtTime(gain, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    osc.connect(oscGain);
    oscGain.connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + duration);
  });
}

function pick<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)] as T;
}

function randomBetween(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function playAlienChirp(params: {
  duration: number;
  gain: number;
  minFreq: number;
  maxFreq: number;
  noiseGain: number;
}) {
  if (!audioCtx) return;
  ensureAudioReady(() => {
    const now = audioCtx.currentTime;

    const baseFrequency = randomBetween(params.minFreq, params.maxFreq);
    const driftFrequency = baseFrequency * randomBetween(0.74, 1.34);

    const carrier = audioCtx.createOscillator();
    carrier.type = pick(["triangle", "sawtooth"]);
    carrier.frequency.setValueAtTime(baseFrequency, now);
    carrier.frequency.exponentialRampToValueAtTime(Math.max(80, driftFrequency), now + params.duration * 0.7);
    carrier.frequency.exponentialRampToValueAtTime(Math.max(80, baseFrequency * randomBetween(0.82, 1.18)), now + params.duration);

    const modulator = audioCtx.createOscillator();
    modulator.type = "sine";
    modulator.frequency.setValueAtTime(randomBetween(16, 44), now);

    const modGain = audioCtx.createGain();
    modGain.gain.setValueAtTime(randomBetween(26, 86), now);
    modGain.gain.exponentialRampToValueAtTime(1.8, now + params.duration);
    modulator.connect(modGain);
    modGain.connect(carrier.frequency);

    const sub = audioCtx.createOscillator();
    sub.type = "square";
    sub.frequency.setValueAtTime(baseFrequency * randomBetween(0.46, 0.62), now);

    const subGain = audioCtx.createGain();
    subGain.gain.setValueAtTime(params.gain * 0.28, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + params.duration);

    const filter = audioCtx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(randomBetween(900, 2200), now);
    filter.Q.setValueAtTime(randomBetween(2, 5.6), now);

    const masterGain = audioCtx.createGain();
    masterGain.gain.setValueAtTime(params.gain, now);
    masterGain.gain.exponentialRampToValueAtTime(0.001, now + params.duration);

    const noiseBuffer = createNoiseBuffer(params.duration, 0.12);
    if (noiseBuffer) {
      const noise = audioCtx.createBufferSource();
      noise.buffer = noiseBuffer;
      const noiseFilter = audioCtx.createBiquadFilter();
      noiseFilter.type = "highpass";
      noiseFilter.frequency.value = randomBetween(1400, 2600);
      const noiseGainNode = audioCtx.createGain();
      noiseGainNode.gain.setValueAtTime(params.noiseGain, now);
      noiseGainNode.gain.exponentialRampToValueAtTime(0.001, now + params.duration * 0.75);
      noise.connect(noiseFilter);
      noiseFilter.connect(noiseGainNode);
      noiseGainNode.connect(masterGain);
      noise.start(now);
      noise.stop(now + params.duration);
    }

    carrier.connect(filter);
    sub.connect(subGain);
    subGain.connect(filter);
    filter.connect(masterGain);
    masterGain.connect(audioCtx.destination);

    carrier.start(now);
    sub.start(now);
    modulator.start(now);

    carrier.stop(now + params.duration);
    sub.stop(now + params.duration);
    modulator.stop(now + params.duration);
  });
}

const pentatonicFrequencies = [261.63, 293.66, 329.63, 392.0, 440.0];
const wholetoneFrequencies = [261.63, 293.66, 329.63, 369.99, 415.3, 466.16];

const monkeytypeSoundPacks: SoundPack[] = [
  {
    id: "mt-click",
    name: "click",
    description: "Monkeytype click",
    cost: 0,
    play: () => playTap({ duration: 0.018, noiseFreq: 4200, noiseQ: 0.9, noiseGain: 0.13, toneFreq: 180, toneGain: 0.02 }),
    playBackspace: () => playTap({ duration: 0.02, noiseFreq: 3800, noiseQ: 0.8, noiseGain: 0.14, toneFreq: 160, toneGain: 0.022 }),
    playEnter: () => playTap({ duration: 0.024, noiseFreq: 3400, noiseQ: 0.7, noiseGain: 0.16, toneFreq: 140, toneGain: 0.026 }),
  },
  {
    id: "mt-beep",
    name: "beep",
    description: "Short electronic beep",
    cost: 150,
    play: () => playWave("sine", 880, 0.05, 0.07),
    playBackspace: () => playWave("sine", 740, 0.055, 0.07),
    playEnter: () => playWave("sine", 660, 0.06, 0.08),
  },
  {
    id: "mt-pop",
    name: "pop",
    description: "Soft popper sound",
    cost: 150,
    play: () => playTap({ duration: 0.012, noiseFreq: 2600, noiseQ: 0.45, noiseGain: 0.11, toneFreq: 110, toneGain: 0.04, waveform: "sine" }),
    playBackspace: () => playTap({ duration: 0.014, noiseFreq: 2400, noiseQ: 0.45, noiseGain: 0.12, toneFreq: 100, toneGain: 0.045, waveform: "sine" }),
    playEnter: () => playTap({ duration: 0.016, noiseFreq: 2200, noiseQ: 0.4, noiseGain: 0.13, toneFreq: 90, toneGain: 0.05, waveform: "sine" }),
  },
  {
    id: "mt-nk-creams",
    name: "nk creams",
    description: "Creamy linear thock",
    cost: 400,
    play: () => playTap({ duration: 0.022, noiseFreq: 3000, noiseQ: 0.5, noiseGain: 0.1, toneFreq: 90, toneGain: 0.1, waveform: "sine" }),
    playBackspace: () => playTap({ duration: 0.024, noiseFreq: 2800, noiseQ: 0.45, noiseGain: 0.12, toneFreq: 80, toneGain: 0.11, waveform: "sine" }),
    playEnter: () => playTap({ duration: 0.028, noiseFreq: 2500, noiseQ: 0.4, noiseGain: 0.13, toneFreq: 70, toneGain: 0.12, waveform: "sine" }),
  },
  {
    id: "mt-typewriter",
    name: "typewriter",
    description: "Classic typewriter clack",
    cost: 450,
    play: () => playTap({ duration: 0.032, noiseFreq: 5600, noiseQ: 1.3, noiseGain: 0.22, toneFreq: 240, toneGain: 0.05 }),
    playBackspace: () => playTap({ duration: 0.036, noiseFreq: 5200, noiseQ: 1.2, noiseGain: 0.24, toneFreq: 220, toneGain: 0.055 }),
    playEnter: () => playTap({ duration: 0.04, noiseFreq: 4600, noiseQ: 1.1, noiseGain: 0.26, toneFreq: 200, toneGain: 0.06 }),
  },
  {
    id: "mt-osu",
    name: "osu",
    description: "Sharp rhythm-game tap",
    cost: 350,
    play: () => playTap({ duration: 0.012, noiseFreq: 5000, noiseQ: 0.9, noiseGain: 0.15, toneFreq: 320, toneGain: 0.03 }),
    playBackspace: () => playTap({ duration: 0.014, noiseFreq: 4700, noiseQ: 0.85, noiseGain: 0.16, toneFreq: 300, toneGain: 0.032 }),
    playEnter: () => playTap({ duration: 0.017, noiseFreq: 4400, noiseQ: 0.8, noiseGain: 0.17, toneFreq: 280, toneGain: 0.035 }),
  },
  {
    id: "mt-hitmarker",
    name: "hitmarker",
    description: "Arcade-style impact tick",
    cost: 420,
    play: () => playTap({ duration: 0.016, noiseFreq: 6200, noiseQ: 1.6, noiseGain: 0.18, toneFreq: 420, toneGain: 0.02 }),
    playBackspace: () => playTap({ duration: 0.018, noiseFreq: 5800, noiseQ: 1.5, noiseGain: 0.2, toneFreq: 390, toneGain: 0.022 }),
    playEnter: () => playTap({ duration: 0.02, noiseFreq: 5400, noiseQ: 1.4, noiseGain: 0.22, toneFreq: 360, toneGain: 0.024 }),
  },
  {
    id: "mt-sine",
    name: "sine",
    description: "Pure sine tone",
    cost: 180,
    play: () => playWave("sine", pick([261.63, 293.66, 329.63, 392.0]), 0.07, 0.08),
    playBackspace: () => playWave("sine", 220, 0.08, 0.08),
    playEnter: () => playWave("sine", 196, 0.09, 0.09),
  },
  {
    id: "mt-sawtooth",
    name: "sawtooth",
    description: "Bright sawtooth synth",
    cost: 220,
    play: () => playWave("sawtooth", pick([261.63, 293.66, 329.63, 392.0]), 0.07, 0.06),
    playBackspace: () => playWave("sawtooth", 220, 0.08, 0.06),
    playEnter: () => playWave("sawtooth", 196, 0.09, 0.07),
  },
  {
    id: "mt-square",
    name: "square",
    description: "Retro square wave",
    cost: 220,
    play: () => playWave("square", pick([261.63, 293.66, 329.63, 392.0]), 0.07, 0.06),
    playBackspace: () => playWave("square", 220, 0.08, 0.06),
    playEnter: () => playWave("square", 196, 0.09, 0.07),
  },
  {
    id: "mt-triangle",
    name: "triangle",
    description: "Soft triangle synth",
    cost: 220,
    play: () => playWave("triangle", pick([261.63, 293.66, 329.63, 392.0]), 0.07, 0.08),
    playBackspace: () => playWave("triangle", 220, 0.08, 0.08),
    playEnter: () => playWave("triangle", 196, 0.09, 0.09),
  },
  {
    id: "mt-pentatonic",
    name: "pentatonic",
    description: "Pentatonic scale keys",
    cost: 300,
    play: () => playWave("triangle", pick(pentatonicFrequencies), 0.08, 0.08),
    playBackspace: () => playWave("triangle", pentatonicFrequencies[0], 0.085, 0.08),
    playEnter: () => playWave("triangle", pentatonicFrequencies[2], 0.09, 0.09),
  },
  {
    id: "mt-wholetone",
    name: "wholetone",
    description: "Whole-tone scale keys",
    cost: 300,
    play: () => playWave("triangle", pick(wholetoneFrequencies), 0.08, 0.08),
    playBackspace: () => playWave("triangle", wholetoneFrequencies[0], 0.085, 0.08),
    playEnter: () => playWave("triangle", wholetoneFrequencies[3], 0.09, 0.09),
  },
  {
    id: "mt-fist-fight",
    name: "fist fight",
    description: "Heavy impact hit",
    cost: 500,
    play: () => playTap({ duration: 0.03, noiseFreq: 900, noiseQ: 0.25, noiseGain: 0.2, toneFreq: 70, toneGain: 0.15, waveform: "sawtooth", noiseStrength: 0.22 }),
    playBackspace: () => playTap({ duration: 0.034, noiseFreq: 800, noiseQ: 0.25, noiseGain: 0.22, toneFreq: 60, toneGain: 0.16, waveform: "sawtooth", noiseStrength: 0.24 }),
    playEnter: () => playTap({ duration: 0.038, noiseFreq: 700, noiseQ: 0.2, noiseGain: 0.24, toneFreq: 50, toneGain: 0.18, waveform: "sawtooth", noiseStrength: 0.26 }),
  },
  {
    id: "mt-rubber-keys",
    name: "rubber keys",
    description: "Mushy membrane press",
    cost: 260,
    play: () => playTap({ duration: 0.02, noiseFreq: 1500, noiseQ: 0.25, noiseGain: 0.08, toneFreq: 95, toneGain: 0.04, waveform: "sine" }),
    playBackspace: () => playTap({ duration: 0.022, noiseFreq: 1350, noiseQ: 0.22, noiseGain: 0.09, toneFreq: 85, toneGain: 0.045, waveform: "sine" }),
    playEnter: () => playTap({ duration: 0.025, noiseFreq: 1200, noiseQ: 0.2, noiseGain: 0.1, toneFreq: 75, toneGain: 0.05, waveform: "sine" }),
  },
  {
    id: "mt-red-switches",
    name: "red switches",
    description: "Smooth linear key sound with no click bump.",
    cost: 480,
    play: () => playTap({ duration: 0.024, noiseFreq: 1900, noiseQ: 0.3, noiseGain: 0.065, toneFreq: 86, toneGain: 0.09, waveform: "sine", noiseStrength: 0.05 }),
    playBackspace: () => playTap({ duration: 0.027, noiseFreq: 1750, noiseQ: 0.28, noiseGain: 0.07, toneFreq: 80, toneGain: 0.095, waveform: "sine", noiseStrength: 0.055 }),
    playEnter: () => playTap({ duration: 0.03, noiseFreq: 1600, noiseQ: 0.25, noiseGain: 0.075, toneFreq: 74, toneGain: 0.1, waveform: "sine", noiseStrength: 0.06 }),
  },
  {
    id: "mt-kailh-box-jade",
    name: "kailh box jade",
    description: "Very loud click with a deep thonk finish.",
    cost: 620,
    play: () => playTap({ duration: 0.036, noiseFreq: 5200, noiseQ: 1.65, noiseGain: 0.26, toneFreq: 118, toneGain: 0.14, waveform: "square", noiseStrength: 0.22 }),
    playBackspace: () => playTap({ duration: 0.04, noiseFreq: 5000, noiseQ: 1.58, noiseGain: 0.28, toneFreq: 104, toneGain: 0.15, waveform: "square", noiseStrength: 0.24 }),
    playEnter: () => playTap({ duration: 0.045, noiseFreq: 4700, noiseQ: 1.5, noiseGain: 0.3, toneFreq: 94, toneGain: 0.16, waveform: "square", noiseStrength: 0.26 }),
  },
  {
    id: "mt-alien-invasion",
    name: "alien invasion",
    description: "Random extraterrestrial chirps and warbles on each keystroke.",
    cost: 700,
    play: () => playAlienChirp({ duration: 0.075, gain: 0.09, minFreq: 360, maxFreq: 1200, noiseGain: 0.02 }),
    playBackspace: () => playAlienChirp({ duration: 0.088, gain: 0.1, minFreq: 250, maxFreq: 920, noiseGain: 0.028 }),
    playEnter: () => playAlienChirp({ duration: 0.11, gain: 0.12, minFreq: 180, maxFreq: 780, noiseGain: 0.034 }),
  },
  {
    id: "mt-fart",
    name: "fart",
    description: "Comic low-blast effect",
    cost: 600,
    play: () => playTap({ duration: 0.08, noiseFreq: 120, noiseQ: 0.2, noiseGain: 0.2, toneFreq: 55, toneGain: 0.18, waveform: "sawtooth", noiseStrength: 0.3 }),
    playBackspace: () => playTap({ duration: 0.09, noiseFreq: 100, noiseQ: 0.2, noiseGain: 0.22, toneFreq: 45, toneGain: 0.19, waveform: "sawtooth", noiseStrength: 0.32 }),
    playEnter: () => playTap({ duration: 0.1, noiseFreq: 90, noiseQ: 0.18, noiseGain: 0.24, toneFreq: 40, toneGain: 0.2, waveform: "sawtooth", noiseStrength: 0.34 }),
  },
];

export const ALL_SOUNDS: SoundPack[] = monkeytypeSoundPacks;

export function getSoundPack(id: string): SoundPack {
  return ALL_SOUNDS.find((sound) => sound.id === id) ?? ALL_SOUNDS[0]!;
}
