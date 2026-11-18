// Original procedural score and Foley. No recordings, trackers or network requests.
// Constructing this object is silent: AudioContext is created only by unlock().
export function createAudio({ contextFactory = null, offline = false } = {}) {
  let context = null;
  let master = null;
  let musicBus = null;
  let effectsBus = null;
  let ambienceGain = null;
  let windFilter = null;
  let musicVolume = 0.45;
  let effectsVolume = 0.65;
  let muted = false;
  let paused = false;
  let destroyed = false;
  let elapsed = 0;
  let noteClock = 0;
  let stepClock = 0;
  let lastX = null;
  let lastActor = null;
  let lastRoom = -1;
  let tension = 0;
  let finaleStarted = false;
  const continuous = new Set();
  const transient = new Set();
  const pads = [];
  let noiseBuffer = null;
  const clamp = value => Math.max(0, Math.min(1, Number.isFinite(Number(value)) ? Number(value) : 0));
  const active = () => context && (offline || context.state === 'running') && !paused && !destroyed;
  function smooth(param, value, time = 0.08) {
    if (!param || !context) return;
    if (value === 0) {
      param.cancelScheduledValues(context.currentTime);
      param.setValueAtTime(0, context.currentTime);
    } else param.setTargetAtTime(value, context.currentTime, time);
  }
  function levels() {
    if (!context) return;
    smooth(master.gain, muted || paused ? 0 : 0.5);
    smooth(musicBus.gain, musicVolume * 0.38);
    smooth(effectsBus.gain, effectsVolume * 0.58);
  }
  function track(source, nodes) {
    transient.add(source);
    source.onended = () => {
      transient.delete(source);
      for (const node of nodes) { try { node.disconnect(); } catch {} }
    };
  }
  function tone(frequency, duration = 0.3, volume = 0.1, type = 'sine', bus = effectsBus, delay = 0, endFrequency = frequency) {
    if (!active()) return;
    const osc = context.createOscillator();
    const envelope = context.createGain();
    const start = context.currentTime + delay;
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, start);
    osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFrequency), start + duration);
    envelope.gain.setValueAtTime(0, start);
    envelope.gain.linearRampToValueAtTime(volume, start + Math.min(0.025, duration * 0.15));
    envelope.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    osc.connect(envelope).connect(bus);
    track(osc, [osc, envelope]);
    osc.start(start);
    osc.stop(start + duration + 0.01);
  }
  function noise(duration, volume, frequency, delay = 0) {
    if (!active() || !noiseBuffer) return;
    const source = context.createBufferSource();
    const filter = context.createBiquadFilter();
    const gain = context.createGain();
    const start = context.currentTime + delay;
    source.buffer = noiseBuffer;
    filter.type = 'bandpass';
    filter.frequency.value = frequency;
    filter.Q.value = 0.6;
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(volume, start + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    source.connect(filter).connect(gain).connect(effectsBus);
    track(source, [source, filter, gain]);
    source.start(start);
    source.stop(start + duration + 0.01);
  }
  function initialize() {
    const AudioContextClass = globalThis.AudioContext || globalThis.webkitAudioContext;
    if (!AudioContextClass && !contextFactory) return false;
    context = contextFactory ? contextFactory() : new AudioContextClass();
    master = context.createGain();
    musicBus = context.createGain();
    effectsBus = context.createGain();
    musicBus.gain.value = musicVolume * 0.38;
    effectsBus.gain.value = effectsVolume * 0.58;
    master.gain.value = 0;
    const compressor = context.createDynamicsCompressor();
    compressor.threshold.value = -18;
    compressor.knee.value = 14;
    compressor.ratio.value = 3;
    master.connect(compressor).connect(context.destination);
    musicBus.connect(master);
    effectsBus.connect(master);
    noiseBuffer = context.createBuffer(1, context.sampleRate * 4, context.sampleRate);
    const channel = noiseBuffer.getChannelData(0);
    let seed = 8713;
    let previous = 0;
    for (let i = 0; i < channel.length; i++) {
      seed = (seed * 16807) % 2147483647;
      const white = seed / 2147483647 * 2 - 1;
      previous = (previous + 0.024 * white) / 1.024;
      channel[i] = previous * 3.5;
    }
    const wind = context.createBufferSource();
    wind.buffer = noiseBuffer;
    wind.loop = true;
    windFilter = context.createBiquadFilter();
    windFilter.type = 'lowpass';
    windFilter.frequency.value = 600;
    ambienceGain = context.createGain();
    ambienceGain.gain.value = 0.4;
    wind.connect(windFilter).connect(ambienceGain).connect(effectsBus);
    continuous.add(wind);
    wind.start();
    // A low open fifth, softly beating partials and a high suspended note.
    for (const [frequency, amplitude] of [[65.406, 0.12], [98, 0.07], [130.95, 0.045], [196.0, 0.025]]) {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.value = frequency;
      gain.gain.value = amplitude;
      oscillator.connect(gain).connect(musicBus);
      oscillator.start();
      continuous.add(oscillator);
      pads.push({ oscillator, gain, frequency, amplitude });
    }
    return true;
  }
  async function unlock() {
    if (destroyed) return false;
    try {
      if (!context && !initialize()) return false;
      if (!offline && context.state === 'suspended') await context.resume();
      paused = false;
      levels();
      return offline || context.state === 'running';
    } catch {
      return false;
    }
  }
  // Two invented animal calls: a bright, rising reed and a lower, breathy reply.
  // Pitch glides and a slow modulation give them life without sampled speech.
  function creatureVoice(voice, delay = 0) {
    if (!active()) return;
    const start = context.currentTime + delay;
    const phrases = voice === 0
      ? [[0, 0.48, 690, 1030, 830], [0.56, 0.36, 830, 1130, 930]]
      : [[0, 0.34, 390, 540, 480], [0.42, 0.64, 480, 620, 350]];
    for (const [offset, duration, from, crest, to] of phrases) {
      const at = start + offset;
      const vibrato = context.createOscillator();
      const depth = context.createGain();
      vibrato.frequency.value = voice === 0 ? 7.1 : 4.8;
      depth.gain.value = voice === 0 ? 12 : 8;
      vibrato.connect(depth);
      for (const [partial, level] of [[1, 0.18], [2, 0.045], [3.01, 0.014]]) {
        const source = context.createOscillator();
        const gain = context.createGain();
        source.type = 'sine';
        source.frequency.setValueAtTime(from * partial, at);
        source.frequency.exponentialRampToValueAtTime(crest * partial, at + duration * 0.35);
        source.frequency.exponentialRampToValueAtTime(to * partial, at + duration);
        depth.connect(source.frequency);
        gain.gain.setValueAtTime(0, at);
        gain.gain.linearRampToValueAtTime(level, at + 0.045);
        gain.gain.setTargetAtTime(level * 0.55, at + duration * 0.45, 0.08);
        gain.gain.linearRampToValueAtTime(0, at + duration);
        source.connect(gain).connect(effectsBus);
        track(source, [source, gain]);
        source.start(at);
        source.stop(at + duration + 0.02);
      }
      track(vibrato, [vibrato, depth]);
      vibrato.start(at);
      vibrato.stop(at + duration + 0.03);
      noise(duration, 0.045, voice === 0 ? 1900 : 1100, delay + offset);
    }
  }
  function finale(count = 0) {
    if (finaleStarted) return;
    finaleStarted = true;
    const rescued = Math.max(0, Math.min(2, Math.trunc(Number(count) || 0)));
    // The station chord falls away as an inharmonic bronze bell opens the hatch.
    for (const pad of pads) smooth(pad.gain.gain, 0.006, 0.8);
    [293.66, 591.3, 806.4, 1267].forEach((frequency, index) =>
      tone(frequency, 2.8 - index * 0.4, 0.15 / (index + 1), 'sine', effectsBus));
    smooth(windFilter.frequency, 1150, 1.4);
    smooth(ambienceGain.gain, 0.16, 1.2);
    // Nim tests the hull with one fingernail, then listens.
    tone(1420, 0.09, 0.16, 'triangle', effectsBus, 2.15);
    noise(0.11, 0.12, 1900, 2.15);
    if (rescued >= 1) creatureVoice(0, 3.0);
    if (rescued >= 2) creatureVoice(1, 4.45);
    // A warm coastal resolution after the responses, also for the quiet ending.
    [130.81, 196, 261.63, 329.63, 392].forEach((frequency, index) =>
      tone(frequency, 4.3, 0.065, 'sine', musicBus, 5.8 + index * 0.12));
  }
  function event(type, details = {}) {
    if (!active()) return;
    switch (type) {
      case 'possessionStart':
        tone(1340, 0.12, 0.15, 'triangle');
        tone(2680, 0.065, 0.05, 'sine', effectsBus, 0.015);
        break;
      case 'possession':
      case 'possessed':
        tone(196, 0.62, 0.11, 'sine', effectsBus, 0, 392);
        tone(293.66, 0.5, 0.06, 'sine', effectsBus, 0.12, 440);
        break;
      case 'possessionCancel':
        tone(220, 0.25, 0.055, 'sine', effectsBus, 0, 110);
        break;
      case 'return':
      case 'returned':
        tone(440, 0.3, 0.07, 'sine', effectsBus, 0, 196);
        break;
      case 'gate':
      case 'gateOpened':
        noise(0.22, 0.24, 550);
        tone(146.83, 0.5, 0.09, 'triangle', effectsBus, 0.09);
        tone(587.3, 0.25, 0.04, 'sine', effectsBus, 0.22);
        break;
      case 'mechanism':
        noise(0.9, 0.2, 280);
        tone(73.41, 1.1, 0.1, 'triangle');
        break;
      case 'rescue':
      case 'rescued':
        noise(0.3, 0.1, 1600);
        [392, 523.25, 587.33].forEach((frequency, index) => tone(frequency, 0.5, 0.07, 'sine', effectsBus, index * 0.15));
        break;
      case 'alarm':
      case 'detected':
        tone(233, 0.18, 0.06, 'triangle');
        tone(220, 0.28, 0.04, 'sine', effectsBus, 0.2);
        break;
      case 'lost':
        tone(146.83, 1.2, 0.1, 'sine', musicBus, 0, 65.4);
        noise(0.4, 0.1, 390);
        break;
      case 'won':
        finale(details.count ?? details.ending ?? 0);
        break;
      case 'creatureVoice':
        creatureVoice(details.voice === 1 ? 1 : 0);
        break;
      case 'room':
        tone(392, 1.6, 0.025, 'sine', musicBus);
        break;
      default:
        break;
    }
  }
  function update(state, dt = 0) {
    if (!active() || !state) return;
    const delta = Math.max(0, Math.min(Number(dt) || 0, 0.1));
    elapsed += delta;
    if (finaleStarted && state.phase !== 'playing') return;
    if (finaleStarted && state.phase === 'playing') {
      finaleStarted = false;
      // A replay should not inherit the held coastal resolution.
      for (const source of transient) { try { source.stop(); } catch {} }
    }
    const room = state.rooms?.[state.room];
    const guards = room?.guards || [];
    const danger = guards.reduce((value, guard) => Math.max(value, Number(guard.alert) || 0), 0);
    tension += (Math.min(1, danger / 2) - tension) * Math.min(1, delta * 2);
    smooth(windFilter.frequency, 460 + Math.sin(elapsed * 0.17) * 190 + (state.room === 3 ? 380 : 0), 0.4);
    smooth(ambienceGain.gain, 0.27 + Math.sin(elapsed * 0.31) * 0.08, 0.4);
    for (let index = 0; index < pads.length; index++) {
      const pad = pads[index];
      const shift = state.phase === 'won' ? (index === 1 ? 1.12246 : 1) : (index === 3 ? 1 + tension * 0.035 : 1);
      smooth(pad.oscillator.frequency, pad.frequency * shift, 1.2);
      smooth(pad.gain.gain, pad.amplitude * (1 + tension * (index === 3 ? 1.5 : 0.1)), 0.5);
    }
    if (lastRoom !== state.room) {
      lastRoom = state.room;
      noteClock = 1;
      lastX = null;
    }
    noteClock -= delta;
    if (noteClock <= 0 && state.phase === 'playing') {
      const melody = [293.66, 392, 349.23, 261.63, 196, 293.66, 440, 392];
      const index = (Math.floor(elapsed / 4) + state.room * 2) % melody.length;
      tone(melody[index], 2.2, 0.06, 'sine', musicBus);
      noteClock = 4.6 - tension * 1.7;
    }
    const actor = state.controlled ? guards.find(guard => guard.id === state.controlled) : state.nim;
    const actorId = state.controlled || 'nim';
    if (actor && lastActor === actorId && lastX !== null && Math.abs(actor.x - lastX) > 0.002 && state.phase === 'playing') {
      stepClock -= delta;
      if (stepClock <= 0) {
        const worker = Boolean(state.controlled);
        noise(worker ? 0.11 : 0.06, worker ? 0.10 : 0.045, worker ? 220 : 780);
        if (worker) tone(72, 0.08, 0.025, 'sine');
        stepClock = worker ? 0.45 : 0.31;
      }
    } else stepClock = Math.min(stepClock, 0.08);
    lastX = actor?.x ?? null;
    lastActor = actorId;
  }
  function setVolumes(music, effects) {
    musicVolume = clamp(music);
    effectsVolume = clamp(effects);
    levels();
  }
  function setMuted(value) { muted = Boolean(value); levels(); }
  function pause() {
    paused = true;
    levels();
    if (!offline && context?.state === 'running') context.suspend().catch(() => {});
  }
  function resume() {
    if (destroyed) return;
    paused = false;
    if (!offline && context?.state === 'suspended') context.resume().then(levels).catch(() => {});
    else levels();
  }
  function destroy() {
    destroyed = true;
    for (const source of [...continuous, ...transient]) {
      try { source.stop(); } catch {}
      try { source.disconnect(); } catch {}
    }
    continuous.clear();
    transient.clear();
    pads.length = 0;
    if (context && typeof context.close === 'function' && context.state !== 'closed') context.close().catch(() => {});
    context = null;
    noiseBuffer = null;
  }
  return { unlock, update, event, setVolumes, setMuted, pause, resume, destroy };
}


/** Render the same production graph without a speaker for signal QA / WAV audition. */
export async function renderAudioPreview({ endingCount = 2, duration = 11, sampleRate = 24000, muted = false, music = 0.45, effects = 0.65, events = null } = {}) {
  const OfflineClass = globalThis.OfflineAudioContext || globalThis.webkitOfflineAudioContext;
  if (!OfflineClass) throw new Error('OfflineAudioContext is unavailable');
  const context = new OfflineClass(1, Math.ceil(sampleRate * duration), sampleRate);
  const audio = createAudio({ contextFactory: () => context, offline: true });
  await audio.unlock();
  audio.setVolumes(music, effects);
  audio.setMuted(muted);
  if (events) for (const item of events) audio.event(item.type, item);
  else audio.event('won', { count: endingCount });
  const buffer = await context.startRendering();
  audio.destroy();
  return buffer;
}
