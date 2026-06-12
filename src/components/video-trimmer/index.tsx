"use client";

import { useRef, type RefObject } from "react";
import { Button } from "@/components/ui/button";
import { formatTime } from "./lib/format-time";
import type { TrimmerStatus } from "./lib/use-video-trimmer";

export interface VideoTrimmerUIProps {
  videoRef?: React.RefObject<HTMLVideoElement | null>;
  timelineRef?: React.RefObject<HTMLDivElement | null>;
  fileInputRef?: React.RefObject<HTMLInputElement | null>;
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
  onFileSelect: (file: File) => void;
  onTogglePlay: () => void;
  onTimelineClick: (e: React.MouseEvent) => void;
  onDragStart: (type: "start" | "end") => void;
  onTrim: () => void;
  onSave: () => void;
  onBackToEditor: () => void;
}

export function VideoTrimmerUI({
  videoRef,
  timelineRef,
  fileInputRef,
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
  onFileSelect,
  onTogglePlay,
  onTimelineClick,
  onDragStart,
  onTrim,
  onSave,
  onBackToEditor,
}: VideoTrimmerUIProps) {
  const localFileInputRef = useRef<HTMLInputElement>(null);
  const localTimelineRef = useRef<HTMLDivElement>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);

  const inputRef = fileInputRef || localFileInputRef;
  const tlRef = timelineRef || localTimelineRef;
  const vidRef = videoRef || localVideoRef;

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
          onClick={() => inputRef.current?.click()}
          onDrop={(e) => {
            e.preventDefault();
            const file = e.dataTransfer.files[0];
            if (file && file.type.startsWith("video/")) {
              onFileSelect(file);
            }
          }}
          onDragOver={(e) => e.preventDefault()}
        >
          <input
            ref={inputRef}
            type="file"
            accept="video/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onFileSelect(file);
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
              ref={vidRef}
              src={videoUrl}
              className="w-full h-full"
              onClick={onTogglePlay}
              onEnded={() => {
                /* handled by parent hook */
              }}
            />
            <button
              onClick={onTogglePlay}
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
              ref={tlRef}
              className="relative h-20 bg-muted rounded-lg overflow-hidden cursor-pointer select-none"
              onClick={onTimelineClick}
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
                  onDragStart("start");
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
                  onDragStart("end");
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
            <Button onClick={onTrim} disabled={status === "trimming"} size="lg">
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
            <Button onClick={onSave} size="lg" variant="default">
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
            <Button onClick={onBackToEditor} size="lg" variant="outline">
              Back to Editor
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

import { useVideoTrimmer } from "./lib/use-video-trimmer";

export default function VideoTrimmer() {
  const {
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
    handleTimelineClick,
    handleDragStart,
    handleTrim,
    handleSave,
    handleBackToEditor,
  } = useVideoTrimmer();

  return (
    <VideoTrimmerUI
      videoUrl={videoUrl}
      duration={duration}
      currentTime={currentTime}
      isPlaying={isPlaying}
      startTime={startTime}
      endTime={endTime}
      thumbnails={thumbnails}
      status={status}
      trimmedUrl={trimmedUrl}
      error={error}
      onFileSelect={handleFileSelect}
      onTogglePlay={togglePlay}
      onTimelineClick={handleTimelineClick}
      onDragStart={handleDragStart}
      onTrim={handleTrim}
      onSave={handleSave}
      onBackToEditor={handleBackToEditor}
    />
  );
}
