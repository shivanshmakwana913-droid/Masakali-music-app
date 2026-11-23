// AS Music - Native OfflineAudioContext Ringtone & Status Clipper
// Renders selected audio segments with user EQ, speed & reverb into standard WAV files (0 external dependencies)

import { EQ_FREQUENCIES } from '../hooks/useAudioEngine';

/**
 * Encode an AudioBuffer into standard 16-bit stereo PCM WAV blob
 */
export function encodeWAV(audioBuffer) {
  const numChannels = audioBuffer.numberOfChannels;
  const sampleRate = audioBuffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;

  // Interleave channels
  const numSamples = audioBuffer.length * numChannels;
  const buffer = new ArrayBuffer(44 + numSamples * 2);
  const view = new DataView(buffer);

  // Helper to write ASCII strings
  const writeString = (offset, string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  /* RIFF identifier */
  writeString(0, 'RIFF');
  /* file length */
  view.setUint32(4, 36 + numSamples * 2, true);
  /* RIFF type & format */
  writeString(8, 'WAVE');
  /* format chunk identifier */
  writeString(12, 'fmt ');
  /* format chunk length */
  view.setUint32(16, 16, true);
  /* sample format (raw PCM) */
  view.setUint16(20, format, true);
  /* channel count */
  view.setUint16(22, numChannels, true);
  /* sample rate */
  view.setUint32(24, sampleRate, true);
  /* byte rate (sampleRate * blockAlign) */
  view.setUint32(28, sampleRate * numChannels * (bitDepth / 8), true);
  /* block align (numChannels * bitDepth / 8) */
  view.setUint16(32, numChannels * (bitDepth / 8), true);
  /* bits per sample */
  view.setUint16(34, bitDepth, true);
  /* data chunk identifier */
  writeString(36, 'data');
  /* data chunk length */
  view.setUint32(40, numSamples * 2, true);

  // Write PCM audio samples
  let offset = 44;
  const channels = [];
  for (let c = 0; c < numChannels; c++) {
    channels.push(audioBuffer.getChannelData(c));
  }

  for (let i = 0; i < audioBuffer.length; i++) {
    for (let c = 0; c < numChannels; c++) {
      let sample = channels[c][i];
      // Clamp between -1.0 and 1.0
      sample = Math.max(-1, Math.min(1, sample));
      // Convert float32 to int16
      const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
      view.setInt16(offset, intSample, true);
      offset += 2;
    }
  }

  return new Blob([buffer], { type: 'audio/wav' });
}

/**
 * Render an audio clip using OfflineAudioContext with live EQ, speed, and reverb
 */
export async function renderClippedAudio({
  audioUrl,
  startTime = 0,
  duration = 30,
  eqGains = [],
  playbackSpeed = 1.0,
  isSlowedReverb = false
}) {
  // 1. Fetch raw audio bytes
  const response = await fetch(audioUrl, { mode: 'cors' });
  if (!response.ok) {
    throw new Error(`Failed to fetch audio stream: ${response.status}`);
  }
  const arrayBuffer = await response.arrayBuffer();

  // 2. Decode in a temporary AudioContext
  const tempCtx = new (window.AudioContext || window.webkitAudioContext)();
  const decodedBuffer = await tempCtx.decodeAudioData(arrayBuffer);
  tempCtx.close();

  // 3. Compute frame ranges
  const sampleRate = decodedBuffer.sampleRate;
  const targetDuration = Math.min(duration, decodedBuffer.duration - startTime);
  const totalFrames = Math.max(1, Math.floor(sampleRate * targetDuration));

  // 4. Create OfflineAudioContext
  const offlineCtx = new (window.OfflineAudioContext || window.webkitOfflineAudioContext)(
    2,
    totalFrames,
    sampleRate
  );

  // Create Source Node with slice
  const source = offlineCtx.createBufferSource();
  source.buffer = decodedBuffer;
  source.playbackRate.value = isSlowedReverb ? 0.85 * playbackSpeed : playbackSpeed;

  let lastNode = source;

  // Apply 10-Band EQ if gains provided
  if (Array.isArray(eqGains) && eqGains.length === EQ_FREQUENCIES.length) {
    const filters = EQ_FREQUENCIES.map((freq, i) => {
      const filter = offlineCtx.createBiquadFilter();
      if (i === 0) filter.type = 'lowshelf';
      else if (i === EQ_FREQUENCIES.length - 1) filter.type = 'highshelf';
      else {
        filter.type = 'peaking';
        filter.Q.value = 1.4;
      }
      filter.frequency.value = freq;
      filter.gain.value = eqGains[i] || 0;
      return filter;
    });

    lastNode.connect(filters[0]);
    for (let i = 0; i < filters.length - 1; i++) {
      filters[i].connect(filters[i + 1]);
    }
    lastNode = filters[filters.length - 1];
  }

  // Apply Slowed + Reverb delay feedback loop if active
  if (isSlowedReverb) {
    const delay = offlineCtx.createDelay();
    delay.delayTime.value = 0.22;
    const feedback = offlineCtx.createGain();
    feedback.gain.value = 0.38;
    const reverbGain = offlineCtx.createGain();
    reverbGain.gain.value = 0.55;

    delay.connect(feedback);
    feedback.connect(delay);
    delay.connect(reverbGain);

    lastNode.connect(delay);
    reverbGain.connect(offlineCtx.destination);
  }

  lastNode.connect(offlineCtx.destination);

  // Start rendering slice
  source.start(0, startTime, targetDuration);
  const renderedBuffer = await offlineCtx.startRendering();

  // Encode to standard WAV
  return encodeWAV(renderedBuffer);
}
