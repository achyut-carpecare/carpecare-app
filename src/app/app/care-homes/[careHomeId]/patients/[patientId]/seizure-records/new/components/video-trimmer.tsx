"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile } from "@ffmpeg/util";
import { createFile } from "mp4box";
import {
  Play,
  Pause,
  Scissors,
  Upload,
  RotateCcw,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const THUMBNAIL_COUNT = 20;

// NOTE: MP4/QuickTime stores timestamps as seconds since 1904-01-01, while JS Date
// uses milliseconds since the Unix epoch (1970-01-01). This offset bridges the two.
const MP4_EPOCH_OFFSET_SECONDS = 2082844800;

type Status =
  | "idle"
  | "loading-ffmpeg"
  | "ready"
  | "trimming"
  | "preview"
  | "error";

interface VideoTrimmerProps {
  onTrimComplete?: (
    file: File,
    durationSeconds: number,
    videoStartDate: Date | null,
    trimStartSeconds: number,
  ) => void;
}

function formatTimeForFfmpeg(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  return `${h.toString().padStart(2, "0")}:${m
    .toString()
    .padStart(2, "0")}:${s.toString().padStart(2, "0")}.${ms
    .toString()
    .padStart(3, "0")}`;
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

async function extractMp4CreationTime(file: File): Promise<Date | null> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const buffer = reader.result as ArrayBuffer;
      (buffer as unknown as { fileStart: number }).fileStart = 0;

      const mp4boxFile = createFile();
      let resolved = false;

      mp4boxFile.onReady = (info) => {
        if (resolved) return;
        resolved = true;

        const mvhd = info.mvhd ?? info.mvhds?.[0];
        if (!mvhd?.creation_time) {
          resolve(null);
          return;
        }

        const unixSeconds =
          Number(mvhd.creation_time) - MP4_EPOCH_OFFSET_SECONDS;
        resolve(new Date(unixSeconds * 1000));
      };

      mp4boxFile.onError = () => {
        if (!resolved) {
          resolved = true;
          resolve(null);
        }
      };

      try {
        mp4boxFile.appendBuffer(buffer);
        mp4boxFile.flush();
      } catch {
        if (!resolved) {
          resolved = true;
          resolve(null);
        }
      }
    };

    reader.onerror = () => resolve(null);
    reader.readAsArrayBuffer(file);
  });
}

export function VideoTrimmer({ onTrimComplete }: VideoTrimmerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const timelineRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const ffmpegRef = useRef<FFmpeg | null>(null);
  const dragTypeRef = useRef<"start" | "end" | null>(null);

  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string>("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string>("");
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(0);
  const [thumbnails, setThumbnails] = useState<string[]>([]);
  const [trimmedUrl, setTrimmedUrl] = useState<string>("");
  const [videoStartDate, setVideoStartDate] = useState<Date | null>(null);

  // Load FFmpeg once.
  const loadFfmpeg = useCallback(async () => {
    if (ffmpegRef.current) return;
    const ffmpeg = new FFmpeg();
    ffmpeg.on("log", ({ message }) => {
      console.log("ffmpeg:", message);
    });
    ffmpeg.on("progress", ({ progress }) => {
      console.log("ffmpeg progress:", progress);
    });
    await ffmpeg.load();
    ffmpegRef.current = ffmpeg;
  }, []);

  // Generate thumbnails by seeking through an off-screen video.
  const generateThumbnails = useCallback(
    async (video: HTMLVideoElement, dur: number) => {
      const thumbs: string[] = [];
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      canvas.width = 160;
      canvas.height = 90;

      for (let i = 0; i < THUMBNAIL_COUNT; i++) {
        const time = (dur / THUMBNAIL_COUNT) * i;
        video.currentTime = time;
        await new Promise<void>((resolve) => {
          const handler = () => {
            ctx.drawImage(video, 0, 0, 160, 90);
            thumbs.push(canvas.toDataURL("image/jpeg", 0.5));
            video.removeEventListener("seeked", handler);
            resolve();
          };
          video.addEventListener("seeked", handler);
        });
      }

      setThumbnails(thumbs);
    },
    [],
  );

  const reset = useCallback(() => {
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    if (trimmedUrl) URL.revokeObjectURL(trimmedUrl);
    setVideoFile(null);
    setVideoUrl("");
    setDuration(0);
    setCurrentTime(0);
    setIsPlaying(false);
    setStartTime(0);
    setEndTime(0);
    setThumbnails([]);
    setTrimmedUrl("");
    setVideoStartDate(null);
    setError("");
    setStatus("idle");
  }, [videoUrl, trimmedUrl]);

  const handleFileSelect = useCallback(
    async (file: File) => {
      setError("");
      setStatus("loading-ffmpeg");
      setThumbnails([]);
      setTrimmedUrl("");

      await loadFfmpeg();

      const url = URL.createObjectURL(file);
      setVideoFile(file);
      setVideoUrl(url);

      const video = document.createElement("video");
      video.src = url;
      video.preload = "metadata";
      video.muted = true;

      await new Promise<void>((resolve, reject) => {
        video.onloadedmetadata = () => resolve();
        video.onerror = () => reject(new Error("Failed to load video"));
      });

      const dur = video.duration;
      setDuration(dur);
      setStartTime(0);
      setEndTime(dur);

      const [startDate] = await Promise.all([
        extractMp4CreationTime(file),
        generateThumbnails(video, dur),
      ]);
      setVideoStartDate(startDate);

      setStatus("ready");
      video.remove();
    },
    [loadFfmpeg, generateThumbnails],
  );

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play();
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  }, []);

  const seekTo = useCallback(
    (time: number) => {
      const video = videoRef.current;
      if (!video) return;
      const clamped = Math.max(0, Math.min(duration, time));
      video.currentTime = clamped;
      setCurrentTime(clamped);
    },
    [duration],
  );

  const handleTimelineClick = useCallback(
    (e: React.MouseEvent) => {
      if (!timelineRef.current || duration === 0) return;
      const rect = timelineRef.current.getBoundingClientRect();
      const ratio = Math.max(
        0,
        Math.min(1, (e.clientX - rect.left) / rect.width),
      );
      seekTo(ratio * duration);
    },
    [duration, seekTo],
  );

  const handleDragStart = useCallback((type: "start" | "end") => {
    dragTypeRef.current = type;
  }, []);

  const handleDragMove = useCallback(
    (e: MouseEvent) => {
      if (!dragTypeRef.current || !timelineRef.current || duration === 0)
        return;
      const rect = timelineRef.current.getBoundingClientRect();
      const ratio = Math.max(
        0,
        Math.min(1, (e.clientX - rect.left) / rect.width),
      );
      const time = ratio * duration;

      if (dragTypeRef.current === "start") {
        setStartTime(Math.min(time, endTime - 0.5));
      } else {
        setEndTime(Math.max(time, startTime + 0.5));
      }
    },
    [duration, startTime, endTime],
  );

  const handleDragEnd = useCallback(() => {
    dragTypeRef.current = null;
  }, []);

  const handleTrim = useCallback(async () => {
    if (!videoFile || !ffmpegRef.current || duration === 0) return;

    setStatus("trimming");
    setError("");
    if (trimmedUrl) URL.revokeObjectURL(trimmedUrl);
    setTrimmedUrl("");

    try {
      const ffmpeg = ffmpegRef.current;
      const ext = videoFile.name.match(/\.[^.]+$/)?.[0] ?? ".mp4";
      const inputName = `input${ext}`;
      const outputName = "trimmed.mp4";

      await ffmpeg.writeFile(inputName, await fetchFile(videoFile));

      await ffmpeg.exec([
        "-i",
        inputName,
        "-ss",
        formatTimeForFfmpeg(startTime),
        "-to",
        formatTimeForFfmpeg(endTime),
        "-c:v",
        "libx264",
        "-c:a",
        "aac",
        "-movflags",
        "+faststart",
        "-y",
        outputName,
      ]);

      const data = await ffmpeg.readFile(outputName);
      const bytes = data as Uint8Array;
      const trimmedBuffer = bytes.buffer.slice(
        bytes.byteOffset,
        bytes.byteOffset + bytes.byteLength,
      ) as ArrayBuffer;
      const blob = new Blob([trimmedBuffer], { type: "video/mp4" });
      const url = URL.createObjectURL(blob);
      setTrimmedUrl(url);
      setStatus("preview");

      if (onTrimComplete) {
        const trimmedFile = new File([blob], "trimmed-video.mp4", {
          type: "video/mp4",
        });
        onTrimComplete(
          trimmedFile,
          endTime - startTime,
          videoStartDate,
          startTime,
        );
      }

      await ffmpeg.deleteFile(inputName);
      await ffmpeg.deleteFile(outputName);
    } catch (err) {
      console.error("Trim error:", err);
      setError(err instanceof Error ? err.message : "Failed to trim video");
      setStatus("error");
    }
  }, [
    videoFile,
    duration,
    startTime,
    endTime,
    trimmedUrl,
    videoStartDate,
    onTrimComplete,
  ]);

  const handleBackToEditor = useCallback(() => {
    if (trimmedUrl) URL.revokeObjectURL(trimmedUrl);
    setTrimmedUrl("");
    setError("");
    setStatus("ready");
  }, [trimmedUrl]);

  // Keep playhead in sync with video playback.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const handler = () => setCurrentTime(video.currentTime);
    video.addEventListener("timeupdate", handler);
    return () => video.removeEventListener("timeupdate", handler);
  }, [videoUrl]);

  // Global drag listeners.
  useEffect(() => {
    const move = (e: MouseEvent) => handleDragMove(e);
    const up = () => handleDragEnd();
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
    };
  }, [handleDragMove, handleDragEnd]);

  // Cleanup object URLs on unmount.
  useEffect(() => {
    return () => {
      if (videoUrl) URL.revokeObjectURL(videoUrl);
      if (trimmedUrl) URL.revokeObjectURL(trimmedUrl);
    };
  }, [videoUrl, trimmedUrl]);

  const startPercent = duration > 0 ? (startTime / duration) * 100 : 0;
  const endPercent = duration > 0 ? (endTime / duration) * 100 : 0;
  const currentPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  if (status === "idle" || status === "loading-ffmpeg") {
    return (
      <div className="space-y-4">
        <div
          className="border-2 border-dashed border-border rounded-2xl p-12 text-center cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => fileInputRef.current?.click()}
          onDrop={(e) => {
            e.preventDefault();
            const file = e.dataTransfer.files[0];
            if (file?.type.startsWith("video/")) handleFileSelect(file);
          }}
          onDragOver={(e) => e.preventDefault()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileSelect(file);
            }}
          />
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            {status === "loading-ffmpeg" ? (
              <Loader2 className="w-6 h-6 text-primary animate-spin" />
            ) : (
              <Upload className="w-6 h-6 text-primary" />
            )}
          </div>
          <p className="font-medium">
            {status === "loading-ffmpeg"
              ? "Loading video processor..."
              : "Click or drag video here"}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Supports MP4, MOV, WebM
          </p>
        </div>
        {status === "idle" && error && (
          <p className="text-sm text-destructive text-center">{error}</p>
        )}
      </div>
    );
  }

  if (status === "preview") {
    return (
      <div className="space-y-4">
        <div className="rounded-xl overflow-hidden bg-black aspect-video">
          <video src={trimmedUrl} className="w-full h-full" controls />
        </div>
        <div className="flex items-center justify-center gap-3">
          <Button onClick={handleBackToEditor} variant="outline">
            <RotateCcw className="w-4 h-4 mr-2" />
            Back to editor
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Video player */}
      <div className="relative rounded-xl overflow-hidden bg-black aspect-video">
        <video
          ref={videoRef}
          src={videoUrl}
          className="w-full h-full"
          onClick={togglePlay}
        />
        <button
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/30 transition-colors"
        >
          {!isPlaying && (
            <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
              <Play className="w-8 h-8 text-black ml-1" />
            </div>
          )}
          {isPlaying && (
            <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
              <Pause className="w-8 h-8 text-black" />
            </div>
          )}
        </button>
        <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-white text-sm drop-shadow-md">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Timeline */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Start: {formatTime(startTime)}
          </span>
          <span className="text-muted-foreground">
            End: {formatTime(endTime)}
          </span>
        </div>

        <div
          ref={timelineRef}
          className="relative h-20 bg-muted rounded-lg overflow-hidden cursor-pointer select-none"
          onClick={handleTimelineClick}
        >
          <div className="absolute inset-0 flex">
            {thumbnails.map((thumb, i) => (
              <div
                key={i}
                className="flex-1 h-full bg-cover bg-center"
                style={{ backgroundImage: `url(${thumb})` }}
              />
            ))}
          </div>

          <div
            className="absolute top-0 bottom-0 bg-black/40"
            style={{ left: 0, width: `${startPercent}%` }}
          />
          <div
            className="absolute top-0 bottom-0 bg-black/40"
            style={{ left: `${endPercent}%`, right: 0 }}
          />

          <div
            className="absolute top-0 bottom-0 bg-primary/20 border-x-2 border-primary"
            style={{
              left: `${startPercent}%`,
              width: `${endPercent - startPercent}%`,
            }}
          />

          <div
            className="absolute top-0 bottom-0 w-4 -ml-2 cursor-ew-resize z-10"
            style={{ left: `${startPercent}%` }}
            onMouseDown={(e) => {
              e.stopPropagation();
              handleDragStart("start");
            }}
          >
            <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-1 bg-primary" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-6 bg-primary rounded-sm shadow-md" />
          </div>

          <div
            className="absolute top-0 bottom-0 w-4 -ml-2 cursor-ew-resize z-10"
            style={{ left: `${endPercent}%` }}
            onMouseDown={(e) => {
              e.stopPropagation();
              handleDragStart("end");
            }}
          >
            <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-1 bg-primary" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-6 bg-primary rounded-sm shadow-md" />
          </div>

          <div
            className="absolute top-0 bottom-0 w-0.5 bg-white z-20 pointer-events-none"
            style={{ left: `${currentPercent}%` }}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button onClick={reset} variant="outline">
          Choose different video
        </Button>
        <Button onClick={handleTrim} disabled={status === "trimming"}>
          {status === "trimming" ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Trimming...
            </>
          ) : (
            <>
              <Scissors className="w-4 h-4 mr-2" />
              Trim video
            </>
          )}
        </Button>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm text-center">
          {error}
        </div>
      )}
    </div>
  );
}
