"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import {
  clearAudioDrivenMouth,
  tickAudioDrivenMouth,
  type MouthDriverHead,
} from "@/lib/avatar-mouth-driver";
import { buildLipsyncVisemePayload } from "@/lib/build-lipsync-payload";
import { buildWordTiming } from "@/lib/word-timing";
import { fetchOpenAiTtsArrayBuffer, speakWithBrowserTts } from "@/lib/openai-tts-audio";
import { speakableText } from "@/lib/safe-text";
import {
  attachEnglishLipsync,
  loadTalkingHeadClass,
  type LipsyncProcessor,
  type TalkingHeadInstance,
} from "@/lib/load-talkinghead";

export type TalkingHeadAvatarHandle = {
  speak: (text: string) => Promise<void>;
  stop: () => void;
  isReady: () => boolean;
};

type TalkingHeadAvatarProps = {
  onReady?: () => void;
  onSpeakingChange?: (speaking: boolean) => void;
  onError?: (message: string) => void;
  variant?: "card" | "tile";
  className?: string;
};

type TalkingHeadInternal = TalkingHeadInstance &
  MouthDriverHead & {
    audioCtx: AudioContext;
    isSpeaking?: boolean;
    isAudioPlaying?: boolean;
    lipsync?: Record<string, LipsyncProcessor>;
  };

const AVATAR_URL = "/avatars/interviewer.glb";

export const TalkingHeadAvatar = forwardRef<TalkingHeadAvatarHandle, TalkingHeadAvatarProps>(
  function TalkingHeadAvatar(
    { onReady, onSpeakingChange, onError, variant = "card", className = "" },
    ref
  ) {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const headRef = useRef<TalkingHeadInternal | null>(null);
    const readyRef = useRef(false);
    const onReadyRef = useRef(onReady);
    const onErrorRef = useRef(onError);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);

    onReadyRef.current = onReady;
    onErrorRef.current = onError;

    useEffect(() => {
      let cancelled = false;

      const init = async () => {
        if (!containerRef.current) return;

        try {
          const TalkingHead = await loadTalkingHeadClass();
          if (cancelled || !containerRef.current) return;

          const head = new TalkingHead(containerRef.current, {
            lipsyncModules: ["en"],
            lipsyncLang: "en",
            cameraView: "upper",
            cameraDistance: 0.15,
            cameraRotateEnable: false,
            cameraPanEnable: false,
            cameraZoomEnable: false,
            modelFPS: 30,
            avatarSpeakingEyeContact: 0.75,
            avatarIdleEyeContact: 0.35,
            mixerGainSpeech: 1,
            update: () => {
              const current = headRef.current;
              if (!current) return;
              if (current.isSpeaking || current.isAudioPlaying) {
                tickAudioDrivenMouth(current);
              } else {
                clearAudioDrivenMouth(current);
              }
            },
          }) as TalkingHeadInternal;

          headRef.current = head;

          await head.showAvatar({
            url: AVATAR_URL,
            body: "F",
            avatarMood: "neutral",
            lipsyncLang: "en",
          });

          await attachEnglishLipsync(head);
          head.setView("upper", { cameraDistance: 0.12, cameraY: 0.05 });

          readyRef.current = true;
          setLoading(false);
          onReadyRef.current?.();
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Failed to load 3D interviewer avatar.";
          setLoadError(message);
          setLoading(false);
          onErrorRef.current?.(message);
        }
      };

      void init();

      return () => {
        cancelled = true;
        readyRef.current = false;
        if (headRef.current) clearAudioDrivenMouth(headRef.current);
        try {
          headRef.current?.stopSpeaking();
        } catch {
          /* ignore */
        }
        headRef.current = null;
      };
    }, []);

    const speakWithAvatar = async (text: string) => {
      const head = headRef.current;
      if (!head || !readyRef.current) {
        throw new Error("Avatar is not ready yet.");
      }

      const plain = speakableText(text);
      onSpeakingChange?.(true);

      try {
        if (head.audioCtx.state === "suspended") {
          await head.audioCtx.resume();
        }

        const arrayBuffer = await fetchOpenAiTtsArrayBuffer(plain);
        const audioBuffer = await head.audioCtx.decodeAudioData(arrayBuffer.slice(0));
        const durationMs = Math.max(400, Math.round(audioBuffer.duration * 1000));
        const wordTiming = buildWordTiming(plain, durationMs);

        const lipsync = head.lipsync?.en;
        const visemePayload =
          lipsync && lipsync.wordsToVisemes
            ? buildLipsyncVisemePayload(plain, durationMs, lipsync)
            : { visemes: [] as string[], vtimes: [] as number[], vdurations: [] as number[] };

        head.stopSpeaking();

        await new Promise<void>((resolve) => {
          head.speakAudio(
            {
              audio: audioBuffer,
              words: wordTiming.words,
              wtimes: wordTiming.wtimes,
              wdurations: wordTiming.wdurations,
              ...(visemePayload.visemes.length
                ? {
                    visemes: visemePayload.visemes,
                    vtimes: visemePayload.vtimes,
                    vdurations: visemePayload.vdurations,
                  }
                : {}),
            },
            { lipsyncLang: "en" }
          );
          head.speakMarker(() => resolve());
        });
      } catch {
        head.stopSpeaking();
        clearAudioDrivenMouth(head);
        await speakWithBrowserTts(plain);
      } finally {
        clearAudioDrivenMouth(head);
        onSpeakingChange?.(false);
      }
    };

    useImperativeHandle(ref, () => ({
      speak: speakWithAvatar,
      stop: () => {
        try {
          headRef.current?.stopSpeaking();
        } catch {
          /* ignore */
        }
        if (headRef.current) clearAudioDrivenMouth(headRef.current);
        onSpeakingChange?.(false);
      },
      isReady: () => readyRef.current,
    }));

    const isTile = variant === "tile";
    const shellClass = isTile
      ? `relative h-full w-full ${className}`
      : `relative mx-auto w-full max-w-xl ${className}`;
    const canvasClass = isTile
      ? "h-full w-full overflow-hidden bg-[#161616]"
      : "h-[min(52vh,460px)] w-full overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-slate-900/80 to-slate-950/90 shadow-[0_24px_80px_rgba(8,47,73,0.35)]";

    return (
      <div className={`${shellClass}${isTile ? " overflow-hidden" : ""}`}>
        {isTile && <div className="presence-avatar-office-bg" aria-hidden />}
        <div
          ref={containerRef}
          className={
            isTile
              ? "relative z-0 h-full w-full overflow-hidden bg-transparent"
              : canvasClass
          }
          aria-label="3D AI interviewer avatar"
        />
        {loading && (
          <div
            className={`absolute inset-0 z-10 flex items-center justify-center bg-slate-950/70 text-sm text-slate-300 ${
              isTile ? "" : "rounded-3xl"
            }`}
          >
            Loading interviewer…
          </div>
        )}
        {loadError && (
          <div className="absolute inset-x-4 bottom-4 z-10 rounded-xl border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
            {loadError}
          </div>
        )}
      </div>
    );
  }
);
