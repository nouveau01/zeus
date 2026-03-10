// Phone audio utilities using Web Audio API
// No external audio files needed - all tones are generated programmatically

let audioContext: AudioContext | null = null;
let ringTimer: ReturnType<typeof setInterval> | null = null;

function getAudioContext(): AudioContext {
  if (!audioContext || audioContext.state === "closed") {
    audioContext = new AudioContext();
  }
  if (audioContext.state === "suspended") {
    audioContext.resume();
  }
  return audioContext;
}

// North American ringtone: 440 + 480 Hz, 1.5s on, 1.5s off
export function startRingtone() {
  stopRingtone();

  const playRingBurst = () => {
    try {
      const ctx = getAudioContext();
      const gain = ctx.createGain();
      gain.connect(ctx.destination);

      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      osc1.type = "sine";
      osc2.type = "sine";
      osc1.frequency.value = 440;
      osc2.frequency.value = 480;
      osc1.connect(gain);
      osc2.connect(gain);

      const now = ctx.currentTime;
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.12, now + 0.04);
      gain.gain.setValueAtTime(0.12, now + 1.46);
      gain.gain.linearRampToValueAtTime(0, now + 1.5);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 1.6);
      osc2.stop(now + 1.6);
    } catch {}
  };

  playRingBurst();
  ringTimer = setInterval(playRingBurst, 3000);
}

export function stopRingtone() {
  if (ringTimer) {
    clearInterval(ringTimer);
    ringTimer = null;
  }
}

// Standard DTMF frequency pairs
const DTMF_FREQ: Record<string, [number, number]> = {
  "1": [697, 1209], "2": [697, 1336], "3": [697, 1477],
  "4": [770, 1209], "5": [770, 1336], "6": [770, 1477],
  "7": [852, 1209], "8": [852, 1336], "9": [852, 1477],
  "*": [941, 1209], "0": [941, 1336], "#": [941, 1477],
};

export function playDTMFTone(digit: string) {
  const freqs = DTMF_FREQ[digit];
  if (!freqs) return;

  try {
    const ctx = getAudioContext();
    const gain = ctx.createGain();
    gain.connect(ctx.destination);

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    osc1.type = "sine";
    osc2.type = "sine";
    osc1.frequency.value = freqs[0];
    osc2.frequency.value = freqs[1];
    osc1.connect(gain);
    osc2.connect(gain);

    const now = ctx.currentTime;
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.setValueAtTime(0.08, now + 0.12);
    gain.gain.linearRampToValueAtTime(0, now + 0.15);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.16);
    osc2.stop(now + 0.16);
  } catch {}
}

// Ringback tone (what the caller hears while waiting for answer)
// North American: 440 + 480 Hz, 2s on, 4s off
let ringbackTimer: ReturnType<typeof setInterval> | null = null;

export function startRingback() {
  stopRingback();

  const playBurst = () => {
    try {
      const ctx = getAudioContext();
      const gain = ctx.createGain();
      gain.connect(ctx.destination);

      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      osc1.frequency.value = 440;
      osc2.frequency.value = 480;
      osc1.connect(gain);
      osc2.connect(gain);

      const now = ctx.currentTime;
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.05, now + 0.04);
      gain.gain.setValueAtTime(0.05, now + 1.96);
      gain.gain.linearRampToValueAtTime(0, now + 2.0);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 2.1);
      osc2.stop(now + 2.1);
    } catch {}
  };

  playBurst();
  ringbackTimer = setInterval(playBurst, 6000);
}

export function stopRingback() {
  if (ringbackTimer) {
    clearInterval(ringbackTimer);
    ringbackTimer = null;
  }
}

// Three short beeps for call failed/busy
export function playBusyTone() {
  try {
    const ctx = getAudioContext();
    const gain = ctx.createGain();
    gain.connect(ctx.destination);

    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = 480;
    osc.connect(gain);

    const now = ctx.currentTime;
    for (let i = 0; i < 3; i++) {
      gain.gain.setValueAtTime(0.1, now + i * 0.4);
      gain.gain.setValueAtTime(0, now + i * 0.4 + 0.25);
    }

    osc.start(now);
    osc.stop(now + 1.5);
  } catch {}
}
