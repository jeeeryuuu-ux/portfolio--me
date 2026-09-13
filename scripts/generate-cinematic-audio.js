const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const OUTPUT_DIR = path.join(__dirname, '..', 'portfolio', 'assets', 'audio');
const PUBLIC_DIR = path.join(__dirname, '..', 'public', 'assets', 'audio');

fs.mkdirSync(OUTPUT_DIR, { recursive: true });
fs.mkdirSync(PUBLIC_DIR, { recursive: true });

const SAMPLE_RATE = 44100;

function createWavBuffer(sampleRate, durationSec, generateSample) {
  const numSamples = Math.floor(sampleRate * durationSec);
  const numChannels = 2;
  const bytesPerSample = 2; // 16-bit
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = numSamples * blockAlign;
  const buffer = Buffer.alloc(44 + dataSize);

  // RIFF header
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);

  // fmt chunk
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16); // subchunk1 size
  buffer.writeUInt16LE(1, 20); // PCM
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(bytesPerSample * 8, 34);

  // data chunk
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const progress = i / numSamples;
    const [left, right] = generateSample(t, progress, durationSec);

    // Soft limiter / saturation
    const clampL = Math.max(-1, Math.min(1, Math.tanh(left)));
    const clampR = Math.max(-1, Math.min(1, Math.tanh(right)));

    const intL = Math.floor(clampL * 32767);
    const intR = Math.floor(clampR * 32767);

    buffer.writeInt16LE(intL, offset);
    buffer.writeInt16LE(intR, offset + 2);
    offset += 4;
  }

  return buffer;
}

// Lowpass helper
function makeBiquadLP(sampleRate, cutoff) {
  const w0 = 2 * Math.PI * cutoff / sampleRate;
  const alpha = Math.sin(w0) / (2 * 0.707);
  const cosw0 = Math.cos(w0);
  const b0 = (1 - cosw0) / 2;
  const b1 = 1 - cosw0;
  const b2 = (1 - cosw0) / 2;
  const a0 = 1 + alpha;
  const a1 = -2 * cosw0;
  const a2 = 1 - alpha;
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;

  return function process(x) {
    const y = (b0/a0)*x + (b1/a0)*x1 + (b2/a0)*x2 - (a1/a0)*y1 - (a2/a0)*y2;
    x2 = x1;
    x1 = x;
    y2 = y1;
    y1 = y;
    return y;
  };
}

// Simple delay line with feedback for reverb-like space
class StereoDelay {
  constructor(samplesL, samplesR, feedback = 0.45) {
    this.bufL = new Float32Array(samplesL);
    this.bufR = new Float32Array(samplesR);
    this.idxL = 0;
    this.idxR = 0;
    this.feedback = feedback;
  }
  process(inL, inR) {
    const outL = this.bufL[this.idxL];
    const outR = this.bufR[this.idxR];
    this.bufL[this.idxL] = inL + outL * this.feedback;
    this.bufR[this.idxR] = inR + outR * this.feedback;
    this.idxL = (this.idxL + 1) % this.bufL.length;
    this.idxR = (this.idxR + 1) % this.bufR.length;
    return [outL, outR];
  }
}

// Smooth loop envelope
function loopWindow(progress, fadePortion = 0.08) {
  if (progress < fadePortion) {
    return 0.5 * (1 - Math.cos(Math.PI * progress / fadePortion));
  } else if (progress > 1 - fadePortion) {
    return 0.5 * (1 - Math.cos(Math.PI * (1 - progress) / fadePortion));
  }
  return 1;
}

// 1. MAIN CINEMATIC THEME (45s)
function renderMainTrack() {
  console.log('Rendering ambient-main.mp3...');
  const duration = 48;
  const delay = new StereoDelay(Math.floor(SAMPLE_RATE * 0.375), Math.floor(SAMPLE_RATE * 0.5), 0.55);
  const lpL = makeBiquadLP(SAMPLE_RATE, 1600);
  const lpR = makeBiquadLP(SAMPLE_RATE, 1600);

  // Chords progression (Dm9 -> Bbmaj7 -> Fadd9 -> Cadd9)
  const chords = [
    [73.42, 110.0, 146.83, 174.61, 220.0, 261.63, 329.63], // Dm9
    [58.27, 116.54, 146.83, 174.61, 233.08, 293.66, 349.23], // Bbmaj7
    [87.31, 130.81, 174.61, 220.0, 261.63, 349.23, 392.0],  // Fadd9
    [65.41, 130.81, 164.81, 196.0, 246.94, 293.66, 392.0]   // Cadd9
  ];

  return createWavBuffer(SAMPLE_RATE, duration, (t, prog) => {
    const chordIdx = Math.floor((prog * chords.length) % chords.length);
    const chordTime = (prog * chords.length) % 1;
    const chord = chords[chordIdx];

    // Swell envelope for chord
    const chordEnv = Math.sin(Math.PI * chordTime);

    let dryL = 0;
    let dryR = 0;

    // Sub bass
    const subFreq = chord[0];
    const sub = Math.sin(2 * Math.PI * subFreq * t) * 0.28;
    dryL += sub;
    dryR += sub;

    // Rich pads with slight detuning for stereo shimmer
    chord.slice(1).forEach((freq, idx) => {
      const detuneL = 1 + (idx * 0.0012) - 0.003;
      const detuneR = 1 - (idx * 0.0014) + 0.003;
      const trem = 0.85 + 0.15 * Math.sin(2 * Math.PI * (0.2 + idx * 0.07) * t);
      const amp = (0.12 / Math.sqrt(idx + 1)) * trem * chordEnv;

      const vL = Math.sin(2 * Math.PI * freq * detuneL * t) + 0.3 * Math.sin(4 * Math.PI * freq * detuneL * t);
      const vR = Math.sin(2 * Math.PI * freq * detuneR * t) + 0.3 * Math.sin(4 * Math.PI * freq * detuneR * t);

      dryL += vL * amp;
      dryR += vR * amp;
    });

    // Gentle filtered breath/air
    const noise = (Math.random() * 2 - 1) * 0.02 * (0.7 + 0.3 * Math.sin(2 * Math.PI * 0.1 * t));
    dryL += noise;
    dryR += noise;

    const [echoL, echoR] = delay.process(dryL, dryR);
    const mixL = lpL(dryL * 0.65 + echoL * 0.45);
    const mixR = lpR(dryR * 0.65 + echoR * 0.45);

    const win = loopWindow(prog, 0.06);
    return [mixL * win * 0.75, mixR * win * 0.75];
  });
}

// 2. HERO: CALM ATMOSPHERIC HORIZON
function renderHeroTrack() {
  console.log('Rendering ambient-hero.mp3...');
  const duration = 40;
  const delay = new StereoDelay(Math.floor(SAMPLE_RATE * 0.48), Math.floor(SAMPLE_RATE * 0.64), 0.6);
  const lpL = makeBiquadLP(SAMPLE_RATE, 1200);
  const lpR = makeBiquadLP(SAMPLE_RATE, 1200);

  const freqs = [55, 110, 165, 220, 277.18, 330, 440, 659.25]; // A modal drone

  return createWavBuffer(SAMPLE_RATE, duration, (t, prog) => {
    let dryL = 0;
    let dryR = 0;

    // Deep subterranean pedal tone
    const sub = Math.sin(2 * Math.PI * 55 * t) * 0.32 + Math.sin(2 * Math.PI * 110 * t) * 0.2;
    dryL += sub;
    dryR += sub;

    // Slow celestial harmonics
    freqs.slice(2).forEach((f, i) => {
      const slowSwell = 0.5 + 0.5 * Math.sin(2 * Math.PI * (0.05 + i * 0.03) * t + i * 1.2);
      const pan = (i % 2 === 0) ? 0.7 : 0.3;
      const v = Math.sin(2 * Math.PI * f * t) * (0.1 / (i + 1)) * slowSwell;
      dryL += v * (1 - pan);
      dryR += v * pan;
    });

    const [eL, eR] = delay.process(dryL, dryR);
    const outL = lpL(dryL * 0.7 + eL * 0.4);
    const outR = lpR(dryR * 0.7 + eR * 0.4);

    const win = loopWindow(prog, 0.07);
    return [outL * win * 0.75, outR * win * 0.75];
  });
}

// 3. WORK: TECHNOLOGICAL / FOCUSED PULSE
function renderWorkTrack() {
  console.log('Rendering ambient-work.mp3...');
  const duration = 40;
  const delay = new StereoDelay(Math.floor(SAMPLE_RATE * 0.25), Math.floor(SAMPLE_RATE * 0.375), 0.4);
  const lpL = makeBiquadLP(SAMPLE_RATE, 2200);
  const lpR = makeBiquadLP(SAMPLE_RATE, 2200);

  // 110 BPM = 1.833 Hz beat, 0.545 sec per beat
  const beatPeriod = 60 / 110;

  return createWavBuffer(SAMPLE_RATE, duration, (t, prog) => {
    let dryL = 0;
    let dryR = 0;

    const beatPos = (t % beatPeriod) / beatPeriod;
    const beatDecay = Math.exp(-beatPos * 8);

    // Subtle technological kick / sub pulse
    const subPulse = Math.sin(2 * Math.PI * (60 - 20 * beatPos) * t) * beatDecay * 0.26;
    dryL += subPulse;
    dryR += subPulse;

    // 16th note synth arpeggiator / texture
    const sixteenth = (t % (beatPeriod / 4)) / (beatPeriod / 4);
    const sixteenthIdx = Math.floor(t / (beatPeriod / 4)) % 8;
    const arpNotes = [220, 261.63, 293.66, 329.63, 392, 440, 523.25, 659.25];
    const arpFreq = arpNotes[sixteenthIdx];
    const arpDecay = Math.exp(-sixteenth * 14);
    const arpL = Math.sin(2 * Math.PI * arpFreq * 1.002 * t) * arpDecay * 0.08;
    const arpR = Math.sin(2 * Math.PI * arpFreq * 0.998 * t) * arpDecay * 0.08;

    dryL += arpL;
    dryR += arpR;

    // Modern studio warm pad backing
    const padFreqs = [110, 164.81, 220, 329.63];
    padFreqs.forEach((f, i) => {
      const wave = Math.sin(2 * Math.PI * f * t);
      dryL += wave * 0.05;
      dryR += wave * 0.05;
    });

    const [eL, eR] = delay.process(dryL, dryR);
    const outL = lpL(dryL * 0.8 + eL * 0.3);
    const outR = lpR(dryR * 0.8 + eR * 0.3);

    const win = loopWindow(prog, 0.05);
    return [outL * win * 0.72, outR * win * 0.72];
  });
}

// 4. THE LAB: EXPERIMENTAL / MYSTERIOUS
function renderLabTrack() {
  console.log('Rendering ambient-lab.mp3...');
  const duration = 42;
  const delay = new StereoDelay(Math.floor(SAMPLE_RATE * 0.42), Math.floor(SAMPLE_RATE * 0.63), 0.65);
  const lpL = makeBiquadLP(SAMPLE_RATE, 2800);
  const lpR = makeBiquadLP(SAMPLE_RATE, 2800);

  return createWavBuffer(SAMPLE_RATE, duration, (t, prog) => {
    let dryL = 0;
    let dryR = 0;

    // Deep resonance
    const drone = Math.sin(2 * Math.PI * 65.41 * t) * 0.25;
    dryL += drone;
    dryR += drone;

    // Granular shimmer tones (528Hz, 792Hz, 1056Hz, 1584Hz)
    const shimmerFreqs = [528, 792, 1056, 1584];
    shimmerFreqs.forEach((f, idx) => {
      const ringMod = Math.sin(2 * Math.PI * (0.15 + idx * 0.08) * t);
      const bell = Math.sin(2 * Math.PI * f * t) * 0.04 * (0.5 + 0.5 * ringMod);
      const pan = (idx % 2 === 0) ? 0.8 : 0.2;
      dryL += bell * pan;
      dryR += bell * (1 - pan);
    });

    // Cosmic whisper noise with phaser feel
    const lfo = 0.5 + 0.5 * Math.sin(2 * Math.PI * 0.12 * t);
    const whisper = (Math.random() * 2 - 1) * 0.015 * lfo;
    dryL += whisper;
    dryR += whisper;

    const [eL, eR] = delay.process(dryL, dryR);
    const outL = lpL(dryL * 0.65 + eL * 0.45);
    const outR = lpR(dryR * 0.65 + eR * 0.45);

    const win = loopWindow(prog, 0.06);
    return [outL * win * 0.72, outR * win * 0.72];
  });
}

// 5. ABOUT: WARM / REFLECTIVE
function renderAboutTrack() {
  console.log('Rendering ambient-about.mp3...');
  const duration = 44;
  const delay = new StereoDelay(Math.floor(SAMPLE_RATE * 0.5), Math.floor(SAMPLE_RATE * 0.75), 0.5);
  const lpL = makeBiquadLP(SAMPLE_RATE, 1800);
  const lpR = makeBiquadLP(SAMPLE_RATE, 1800);

  // Warm Fmaj9 / Cmaj9 acoustic presence
  const chords = [
    [87.31, 130.81, 174.61, 220.0, 261.63, 329.63, 392.0], // Fmaj9
    [65.41, 130.81, 164.81, 196.0, 246.94, 293.66, 392.0]  // Cmaj9
  ];

  return createWavBuffer(SAMPLE_RATE, duration, (t, prog) => {
    const chordIdx = Math.floor((prog * chords.length) % chords.length);
    const chord = chords[chordIdx];
    const chordProg = (prog * chords.length) % 1;
    const chordEnv = Math.sin(Math.PI * chordProg);

    let dryL = 0;
    let dryR = 0;

    // Warm sub bass
    dryL += Math.sin(2 * Math.PI * chord[0] * t) * 0.25;
    dryR += Math.sin(2 * Math.PI * chord[0] * t) * 0.25;

    // Lush acoustic analog resonance
    chord.slice(1).forEach((f, idx) => {
      const vibrato = 1 + 0.002 * Math.sin(2 * Math.PI * 4 * t);
      const tone = (Math.sin(2 * Math.PI * f * vibrato * t) + 0.25 * Math.sin(4 * Math.PI * f * t)) * (0.09 / (idx + 1)) * chordEnv;
      dryL += tone;
      dryR += tone * 0.95;
    });

    const [eL, eR] = delay.process(dryL, dryR);
    const outL = lpL(dryL * 0.7 + eL * 0.4);
    const outR = lpR(dryR * 0.7 + eR * 0.4);

    const win = loopWindow(prog, 0.06);
    return [outL * win * 0.75, outR * win * 0.75];
  });
}

// 6. CONTACT: CINEMATIC / MINIMAL
function renderContactTrack() {
  console.log('Rendering ambient-contact.mp3...');
  const duration = 40;
  const delay = new StereoDelay(Math.floor(SAMPLE_RATE * 0.6), Math.floor(SAMPLE_RATE * 0.9), 0.6);
  const lpL = makeBiquadLP(SAMPLE_RATE, 1400);
  const lpR = makeBiquadLP(SAMPLE_RATE, 1400);

  return createWavBuffer(SAMPLE_RATE, duration, (t, prog) => {
    let dryL = 0;
    let dryR = 0;

    // Subterranean quiet pulse
    const bass = Math.sin(2 * Math.PI * 48 * t) * 0.3;
    dryL += bass;
    dryR += bass;

    // Occasional gentle bell ping every 8 seconds
    const pingPeriod = 8;
    const pingPhase = (t % pingPeriod) / pingPeriod;
    const pingDecay = Math.exp(-pingPhase * 10);
    const pingFreq = 432 * (1 + (Math.floor(t / pingPeriod) % 3) * 0.5);
    const bellL = Math.sin(2 * Math.PI * pingFreq * t) * pingDecay * 0.07;
    const bellR = Math.sin(2 * Math.PI * pingFreq * 1.002 * t) * pingDecay * 0.07;

    dryL += bellL;
    dryR += bellR;

    const [eL, eR] = delay.process(dryL, dryR);
    const outL = lpL(dryL * 0.7 + eL * 0.45);
    const outR = lpR(dryR * 0.7 + eR * 0.45);

    const win = loopWindow(prog, 0.07);
    return [outL * win * 0.72, outR * win * 0.72];
  });
}

function convertWavToMp3(wavBuffer, outputFileName) {
  const tempWav = path.join('/tmp', `${outputFileName}.wav`);
  const finalPortfolioMp3 = path.join(OUTPUT_DIR, outputFileName);
  const finalPublicMp3 = path.join(PUBLIC_DIR, outputFileName);

  fs.writeFileSync(tempWav, wavBuffer);

  const res = spawnSync('ffmpeg', [
    '-y',
    '-i', tempWav,
    '-c:a', 'libmp3lame',
    '-b:a', '192k',
    finalPortfolioMp3
  ], { stdio: 'inherit' });

  if (res.status !== 0) {
    console.error(`Failed to convert ${outputFileName}`);
    return false;
  }

  // Also copy to public directory
  fs.copyFileSync(finalPortfolioMp3, finalPublicMp3);
  try { fs.unlinkSync(tempWav); } catch (e) {}
  console.log(`Saved ${outputFileName} successfully (${fs.statSync(finalPortfolioMp3).size} bytes)`);
  return true;
}

function main() {
  const tracks = [
    { name: 'ambient-main.mp3', fn: renderMainTrack },
    { name: 'ambient-hero.mp3', fn: renderHeroTrack },
    { name: 'ambient-work.mp3', fn: renderWorkTrack },
    { name: 'ambient-lab.mp3', fn: renderLabTrack },
    { name: 'ambient-about.mp3', fn: renderAboutTrack },
    { name: 'ambient-contact.mp3', fn: renderContactTrack }
  ];

  for (const track of tracks) {
    const wav = track.fn();
    convertWavToMp3(wav, track.name);
  }

  console.log('All 6 cinematic ambient tracks rendered successfully!');
}

main();
