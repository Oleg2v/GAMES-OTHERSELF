import {test, expect} from '@playwright/test';
import {mkdir, writeFile} from 'node:fs/promises';

test('production audio graph renders three distinct unclipped endings, separate buses and mute', async ({page}) => {
  // Do not boot WebGL: this test exercises the actual Web Audio graph in isolation.
  await page.route('**/audio-check', route => route.fulfill({contentType:'text/html',body:'<!doctype html><title>Audio signal validation</title>'}));
  await page.goto('/audio-check');
  const result = await page.evaluate(async () => {
    const {renderAudioPreview} = await import('/src/audio.js');
    const buffers = [];
    const measure = (data, sampleRate, from=0, to=data.length/sampleRate) => {
      const samples=data.slice(Math.round(from*sampleRate), Math.round(to*sampleRate));
      let peak=0, energy=0, nonFinite=0, clipped=0;
      for (const value of samples) {
        if(!Number.isFinite(value)) nonFinite++;
        peak=Math.max(peak,Math.abs(value)); energy+=value*value;
        if(Math.abs(value)>=0.999)clipped++;
      }
      return {peak,rms:Math.sqrt(energy/samples.length),nonFinite,clipped,samples:samples.length};
    };
    const variants=[];
    for(let endingCount=0;endingCount<=2;endingCount++) {
      const buffer=await renderAudioPreview({endingCount});
      const data=buffer.getChannelData(0); buffers.push(data.slice());
      variants.push({endingCount,sampleRate:buffer.sampleRate,...measure(data,buffer.sampleRate)});
    }
    const sampleRate=24000;
    const delta=(a,b,from,to)=>measure(a.map((value,index)=>value-b[index]),sampleRate,from,to);
    const muted=await renderAudioPreview({muted:true});
    const silent=await renderAudioPreview({music:0,effects:0});
    const music=await renderAudioPreview({music:1,effects:0});
    const effects=await renderAudioPreview({music:0,effects:1});
    const loud=await renderAudioPreview({music:1,effects:1,events:['possessionStart','gate','mechanism','rescue','alarm','won'].map(type=>({type,count:2}))});
    return {
      browser:navigator.userAgent,
      variants,
      identicalBeforeReply:delta(buffers[0],buffers[1],0,2.8),
      firstVoice:delta(buffers[0],buffers[1],3,4.2),
      identicalBeforeSecondReply:delta(buffers[1],buffers[2],0,4.3),
      secondVoice:delta(buffers[1],buffers[2],4.45,5.65),
      muted:measure(muted.getChannelData(0),muted.sampleRate),
      busesOff:measure(silent.getChannelData(0),silent.sampleRate),
      musicOnly:measure(music.getChannelData(0),music.sampleRate),
      effectsOnly:measure(effects.getChannelData(0),effects.sampleRate),
      stressed:measure(loud.getChannelData(0),loud.sampleRate),
      // PCM kept for a concrete audition artifact, not used as a substitute for listening.
      pcm:Array.from(buffers[2],value=>Math.round(Math.max(-1,Math.min(1,value))*32767)),
    };
  });
  for(const variant of result.variants) {
    expect(variant.nonFinite).toBe(0);
    expect(variant.clipped).toBe(0);
    expect(variant.rms).toBeGreaterThan(0.001);
    expect(variant.peak).toBeLessThan(0.85);
  }
  expect(result.identicalBeforeReply.rms).toBeLessThan(1e-8);
  expect(result.firstVoice.rms).toBeGreaterThan(0.001);
  expect(result.identicalBeforeSecondReply.rms).toBeLessThan(1e-8);
  expect(result.secondVoice.rms).toBeGreaterThan(0.001);
  expect(result.muted.peak).toBeLessThan(1e-7);
  expect(result.busesOff.peak).toBeLessThan(1e-7);
  expect(result.musicOnly.rms).toBeGreaterThan(0.0005);
  expect(result.effectsOnly.rms).toBeGreaterThan(0.001);
  expect(result.stressed.clipped).toBe(0);
  expect(result.stressed.peak).toBeLessThan(0.85);
  const {pcm,...metrics}=result;
  await mkdir('test-results/audio',{recursive:true});
  await writeFile('test-results/audio/metrics.json',JSON.stringify(metrics,null,2));
  const wave=Buffer.alloc(44+pcm.length*2);
  wave.write('RIFF',0);wave.writeUInt32LE(wave.length-8,4);wave.write('WAVEfmt ',8);
  wave.writeUInt32LE(16,16);wave.writeUInt16LE(1,20);wave.writeUInt16LE(1,22);
  wave.writeUInt32LE(24000,24);wave.writeUInt32LE(48000,28);wave.writeUInt16LE(2,32);wave.writeUInt16LE(16,34);
  wave.write('data',36);wave.writeUInt32LE(pcm.length*2,40);
  pcm.forEach((value,index)=>wave.writeInt16LE(value,44+index*2));
  await writeFile('test-results/audio/ending-two-voices.wav',wave);
});
