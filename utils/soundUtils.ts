// src/utils/soundUtils.ts

// AudioContextのシングルトン管理
let audioCtx: AudioContext | null = null;
let noiseBuffer: AudioBuffer | null = null;

const getAudioContext = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioCtx;
};

const getNoiseBuffer = () => {
  const ctx = getAudioContext();
  if (!noiseBuffer) {
    const bufferSize = ctx.sampleRate * 2.0;
    noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
  }
  return noiseBuffer;
};

export const playSound = (type: 'move' | 'alert' | 'timeout') => {
  const ctx = getAudioContext();
  if (ctx.state === 'suspended') ctx.resume();
  const now = ctx.currentTime;

  if (type === 'move') {
    const noise = ctx.createBufferSource();
    noise.buffer = getNoiseBuffer();
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(8000, now); 
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(1.0, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.015); 
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(600, now); 
    const oscGain = ctx.createGain();
    oscGain.gain.setValueAtTime(0.15, now);
    oscGain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    osc.connect(oscGain);
    oscGain.connect(ctx.destination);
    noise.start(now);
    noise.stop(now + 0.1);
    osc.start(now);
    osc.stop(now + 0.1);
  } else if (type === 'alert') {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.setValueAtTime(1000, now);
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.linearRampToValueAtTime(0.01, now + 0.1);
    osc.start(now);
    osc.stop(now + 0.1);
  } else if (type === 'timeout') {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.setValueAtTime(400, now);
    osc.frequency.linearRampToValueAtTime(100, now + 1.0);
    gain.gain.setValueAtTime(0.5, now);
    gain.gain.linearRampToValueAtTime(0.01, now + 1.0);
    osc.start(now);
    osc.stop(now + 1.0);
  }
};