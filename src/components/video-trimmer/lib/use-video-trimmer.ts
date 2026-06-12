"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile } from "@ffmpeg/util";
import { formatTime } from "./format-time";

const THUMBNAIL_COUNT = 20;

export type TrimmerStatus =
  | "idle"
  | "loading-ffmpeg"
  | "ready"
  | "trimming"
  | "preview";

export interface UseVideoTrimmerReturn {
  videoFile: File | null;
  videoUrl: string;
  duration: number;
  currentTime: number;
  isPlaying: boolean;
  startTime: number;
  endTime: number;
  thumbnails: string[];
  status: TrimmerStatus;
  trimmedUrl: string;
  error: string;
  handleFileSelect: (file: File) => Promise<void>;
  togglePlay: () => void;
  seekTo: (time: number) => void;
  handleTimelineClick: (e: React.MouseEvent) => void;
  handleDragStart: (type: "start" | "end") => void;
  handleTrim: () => Promise<void>;
  handleSave: () => void;
  handleBackToEditor: () => void;
}

export function useVideoTrimmer(): UseVideoTrimmerReturn {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const timelineRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const ffmpegRef = useRef<FFmpeg | null>(null);
  const dragStateRef = useRef<"start" | "end" | null>(null);

  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string>("");
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(0);
  const [thumbnails, setThumbnails] = useState<string[]>([]);
  const [status, setStatus] = useState<TrimmerStatus>("idle");
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

  // Toggle play/pause
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

  // Update video current time
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handler = () => setCurrentTime(video.currentTime);
    video.addEventListener("timeupdate", handler);
    return () => video.removeEventListener("timeupdate", handler);
  }, [videoUrl]);

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

  // Back to editor
  const handleBackToEditor = useCallback(() => {
    setStatus("ready");
    setTrimmedUrl("");
    setError("");
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (videoUrl) URL.revokeObjectURL(videoUrl);
      if (trimmedUrl) URL.revokeObjectURL(trimmedUrl);
    };
  }, [videoUrl, trimmedUrl]);

  return {
    videoFile,
    videoUrl,
    duration,
    currentTime,
    isPlaying,
    startTime,
    endTime,
    thumbnails,
    status,
    trimmedUrl,
    error,
    handleFileSelect,
    togglePlay,
    seekTo,
    handleTimelineClick,
    handleDragStart,
    handleTrim,
    handleSave,
    handleBackToEditor,
  };
}
