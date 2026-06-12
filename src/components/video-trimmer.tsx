"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile } from "@ffmpeg/util";
import { Button } from "@/components/ui/button";

const THUMBNAIL_COUNT = 20;

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 100);
  return `${m}:${s.toString().padStart(2, "0")}.${ms.toString().padStart(2, "0")}`;
}

export default function VideoTrimmer() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const ffmpegRef = useRef<FFmpeg | null>(null);
  const dragStateRef = useRef<"start" | "end" | "playhead" | null>(null);

  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string>("");
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(0);
  const [thumbnails, setThumbnails] = useState<string[]>([]);
  const [status, setStatus] = useState<
    "idle" | "loading-ffmpeg" | "ready" | "trimming" | "preview"
  >("idle");
  const [trimmedUrl, setTrimmedUrl] = useState<string>("");
  const [error, setError] = useState<string>("");

  // Generate thumbnails from video
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

  // Handle file selection
  const handleFileSelect = useCallback(
    async (file: File) => {
      setError("");
      setStatus("loading-ffmpeg");
      setThumbnails([]);
      setTrimmedUrl("");
      setCurrentTime(0);
      setIsPlaying(false);

      // Load ffmpeg
      if (!ffmpegRef.current) {
        const ffmpeg = new FFmpeg();
        ffmpeg.on("log", ({ message }) => {
          console.log("ffmpeg:", message);
        });
        ffmpeg.on("progress", ({ progress }) => {
          console.log("ffmpeg progress:", progress);
        });
        await ffmpeg.load();
        ffmpegRef.current = ffmpeg;
      }

      const url = URL.createObjectURL(file);
      setVideoFile(file);
      setVideoUrl(url);
      setStatus("ready");

      // Wait for video metadata
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

      // Generate thumbnails
      await generateThumbnails(video, dur);
      video.remove();
    },
    [generateThumbnails],
  );

  // Update video current time
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handler = () => setCurrentTime(video.currentTime);
    video.addEventListener("timeupdate", handler);
    return () => video.removeEventListener("timeupdate", handler);
  }, [videoUrl]);

  // Play/pause
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

  // Seek to position
  const seekTo = useCallback(
    (time: number) => {
      const video = videoRef.current;
      if (!video) return;
      const clamped = Math.max(startTime, Math.min(endTime, time));
      video.currentTime = clamped;
      setCurrentTime(clamped);
    },
    [startTime, endTime],
  );

  // Timeline click
  const handleTimelineClick = useCallback(
    (e: React.MouseEvent) => {
      if (!timelineRef.current || duration === 0) return;
      const rect = timelineRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const ratio = Math.max(0, Math.min(1, x / rect.width));
      seekTo(ratio * duration);
    },
    [duration, seekTo],
  );

  // Drag handlers
  const handleDragStart = useCallback((type: "start" | "end") => {
    dragStateRef.current = type;
  }, []);

  const handleDragMove = useCallback(
    (e: MouseEvent) => {
      if (!dragStateRef.current || !timelineRef.current || duration === 0)
        return;
      const rect = timelineRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const ratio = Math.max(0, Math.min(1, x / rect.width));
      const time = ratio * duration;

      if (dragStateRef.current === "start") {
        setStartTime(Math.min(time, endTime - 0.5));
      } else if (dragStateRef.current === "end") {
        setEndTime(Math.max(time, startTime + 0.5));
      }
    },
    [duration, startTime, endTime],
  );

  const handleDragEnd = useCallback(() => {
    dragStateRef.current = null;
  }, []);

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

  // Trim video
  const handleTrim = useCallback(async () => {
    if (!videoFile || !ffmpegRef.current || duration === 0) return;

    setStatus("trimming");
    setError("");
    setTrimmedUrl("");

    try {
      const ffmpeg = ffmpegRef.current;
      const inputName =
        "input" + (videoFile.name.match(/\.[^.]+$/)?.[0] ?? ".mp4");
      const outputName = "trimmed.mp4";

      await ffmpeg.writeFile(inputName, await fetchFile(videoFile));

      const start = formatTime(startTime);
      const end = formatTime(endTime);

      await ffmpeg.exec([
        "-i",
        inputName,
        "-ss",
        start,
        "-to",
        end,
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
      const blob = new Blob([bytes.buffer as ArrayBuffer], {
        type: "video/mp4",
      });
      const url = URL.createObjectURL(blob);
      setTrimmedUrl(url);
      setStatus("preview");

      // Cleanup
      await ffmpeg.deleteFile(inputName);
      await ffmpeg.deleteFile(outputName);
    } catch (err) {
      console.error("Trim error:", err);
      setError(err instanceof Error ? err.message : "Failed to trim video");
      setStatus("ready");
    }
  }, [videoFile, duration, startTime, endTime]);

  // Save trimmed video
  const handleSave = useCallback(() => {
    if (!trimmedUrl) return;
    const a = document.createElement("a");
    a.href = trimmedUrl;
    a.download = "trimmed-video.mp4";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, [trimmedUrl]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (videoUrl) URL.revokeObjectURL(videoUrl);
      if (trimmedUrl) URL.revokeObjectURL(trimmedUrl);
    };
  }, [videoUrl, trimmedUrl]);

  const startPercent = duration > 0 ? (startTime / duration) * 100 : 0;
  const endPercent = duration > 0 ? (endTime / duration) * 100 : 0;
  const currentPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="w-full max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-heading font-bold">Video Trimmer</h1>
        <p className="text-muted-foreground">
          Upload a video, set trim points, and save
        </p>
      </div>

      {status === "idle" && (
        <div
          className="border-2 border-dashed border-border rounded-2xl p-12 text-center cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => fileInputRef.current?.click()}
          onDrop={(e) => {
            e.preventDefault();
            const file = e.dataTransfer.files[0];
            if (file && file.type.startsWith("video/")) {
              handleFileSelect(file);
            }
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
            <svg
              className="w-6 h-6 text-primary"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
          </div>
          <p className="font-medium">Click or drag video here</p>
          <p className="text-sm text-muted-foreground mt-1">
            Supports MP4, MOV, WebM
          </p>
        </div>
      )}

      {status === "loading-ffmpeg" && (
        <div className="text-center py-12 space-y-4">
          <div className="mx-auto w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground">Loading video processor...</p>
        </div>
      )}

      {(status === "ready" || status === "trimming") && (
        <div className="space-y-4">
          {/* Video Player */}
          <div className="relative rounded-xl overflow-hidden bg-black aspect-video">
            <video
              ref={videoRef}
              src={videoUrl}
              className="w-full h-full"
              onClick={togglePlay}
              onEnded={() => setIsPlaying(false)}
            />
            <button
              onClick={togglePlay}
              className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/30 transition-colors"
            >
              {!isPlaying && (
                <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                  <svg
                    className="w-8 h-8 text-black ml-1"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M8 5v14l11-7z" />
                  </svg>
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
              {/* Thumbnails */}
              <div className="absolute inset-0 flex">
                {thumbnails.map((thumb, i) => (
                  <div
                    key={i}
                    className="flex-1 h-full bg-cover bg-center"
                    style={{ backgroundImage: `url(${thumb})` }}
                  />
                ))}
              </div>

              {/* Darken outside trim region */}
              <div
                className="absolute top-0 bottom-0 bg-black/40"
                style={{ left: 0, width: `${startPercent}%` }}
              />
              <div
                className="absolute top-0 bottom-0 bg-black/40"
                style={{ left: `${endPercent}%`, right: 0 }}
              />

              {/* Trim region highlight */}
              <div
                className="absolute top-0 bottom-0 bg-primary/20 border-x-2 border-primary"
                style={{
                  left: `${startPercent}%`,
                  width: `${endPercent - startPercent}%`,
                }}
              />

              {/* Start handle */}
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

              {/* End handle */}
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

              {/* Playhead */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-white z-20 pointer-events-none"
                style={{ left: `${currentPercent}%` }}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-center">
            <Button
              onClick={handleTrim}
              disabled={status === "trimming"}
              size="lg"
            >
              {status === "trimming" ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                  Trimming...
                </>
              ) : (
                <>
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z"
                    />
                  </svg>
                  Trim Video
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
      )}

      {status === "preview" && trimmedUrl && (
        <div className="space-y-4">
          <div className="text-center">
            <h2 className="text-lg font-medium">Trimmed Preview</h2>
            <p className="text-sm text-muted-foreground">
              {formatTime(startTime)} — {formatTime(endTime)} (
              {formatTime(endTime - startTime)})
            </p>
          </div>

          <div className="rounded-xl overflow-hidden bg-black aspect-video">
            <video src={trimmedUrl} className="w-full h-full" controls />
          </div>

          <div className="flex gap-3 justify-center">
            <Button onClick={handleSave} size="lg" variant="default">
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              Save Video
            </Button>
            <Button
              onClick={() => {
                setStatus("ready");
                setTrimmedUrl("");
              }}
              size="lg"
              variant="outline"
            >
              Back to Editor
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
