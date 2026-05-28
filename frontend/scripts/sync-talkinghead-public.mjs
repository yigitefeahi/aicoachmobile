import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const modulesSrc = join(root, "node_modules/@met4citizen/talkinghead/modules");
const dest = join(root, "public/talkinghead");

if (!existsSync(modulesSrc)) {
  console.warn("[sync-talkinghead] @met4citizen/talkinghead not installed; skipping.");
  process.exit(0);
}

if (existsSync(dest)) {
  rmSync(dest, { recursive: true, force: true });
}
mkdirSync(dest, { recursive: true });
cpSync(modulesSrc, dest, { recursive: true });

const talkingHeadPath = join(dest, "talkinghead.mjs");
let talkingHeadSource = readFileSync(talkingHeadPath, "utf8");

talkingHeadSource = talkingHeadSource.replace(
  "this.volumeFrequencyData = new Uint8Array(16);",
  "this.volumeFrequencyData = new Uint8Array(this.audioAnalyzerNode.frequencyBinCount);"
);

talkingHeadSource = talkingHeadSource.replace(
  "['viseme_'+viseme]: [null,(viseme === 'PP' || viseme === 'FF') ? 0.9 : 0.6, 0]",
  "['viseme_'+viseme]: [null,(viseme === 'PP' || viseme === 'FF') ? 1 : 0.92, 0]"
);

talkingHeadSource = talkingHeadSource.replace(
  "['viseme_'+val.visemes[j]]: [null,(val.visemes[j] === 'PP' || val.visemes[j] === 'FF') ? 0.9 : level, 0]",
  "['viseme_'+val.visemes[j]]: [null,(val.visemes[j] === 'PP' || val.visemes[j] === 'FF') ? 1 : Math.min(1, level + 0.3), 0]"
);

talkingHeadSource = talkingHeadSource.replace(
  "['viseme_'+val.visemes[j]]: [null,(val.visemes[j] === 'PP' || val.visemes[j] === 'FF') ? 0.9 : 0.6,0]",
  "['viseme_'+val.visemes[j]]: [null,(val.visemes[j] === 'PP' || val.visemes[j] === 'FF') ? 1 : 0.92,0]"
);

talkingHeadSource = talkingHeadSource.replace(
  `    // Speaking
    if ( this.isSpeaking ) {
      vol = 0;
      this.audioAnalyzerNode.getByteFrequencyData(this.volumeFrequencyData);
      for (i=2, l=10; i<l; i++) {
        if (this.volumeFrequencyData[i] > vol) {
          vol = this.volumeFrequencyData[i];
        }
      }
    }`,
  `    // Speaking — wider band + audio-driven jaw for external TTS
    if ( this.isSpeaking ) {
      vol = 0;
      this.audioAnalyzerNode.getByteFrequencyData(this.volumeFrequencyData);
      for (i=2, l=Math.min(32, this.volumeFrequencyData.length); i<l; i++) {
        if (this.volumeFrequencyData[i] > vol) {
          vol = this.volumeFrequencyData[i];
        }
      }
      if ( this.isAudioPlaying && this.mtAvatar ) {
        const mouthOpenAmt = Math.max(0.06, Math.min(1, Math.pow(Math.max(vol, 8) / 90, 0.58) * 1.15));
        for ( const mk of ['mouthOpen','jawOpen'] ) {
          const m = this.mtAvatar[mk];
          if ( m ) { m.realtime = mouthOpenAmt; m.needsUpdate = true; }
        }
      }
    } else if ( this.mtAvatar ) {
      for ( const mk of ['mouthOpen','jawOpen'] ) {
        const m = this.mtAvatar[mk];
        if ( m && m.realtime !== null ) { m.realtime = null; m.needsUpdate = true; }
      }
    }`
);

writeFileSync(talkingHeadPath, talkingHeadSource, "utf8");
console.log("[sync-talkinghead] Copied TalkingHead modules to public/talkinghead");
