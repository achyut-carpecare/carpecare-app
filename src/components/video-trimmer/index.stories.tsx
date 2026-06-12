import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { VideoTrimmerUI } from "./index";
import type { VideoTrimmerUIProps } from "./index";

const meta: Meta<typeof VideoTrimmerUI> = {
  title: "Components/VideoTrimmer",
  component: VideoTrimmerUI,
  parameters: {
    layout: "centered",
  },
  argTypes: {
    onFileSelect: { action: "fileSelected" },
    onTogglePlay: { action: "togglePlay" },
    onTimelineClick: { action: "timelineClick" },
    onDragStart: { action: "dragStart" },
    onTrim: { action: "trim" },
    onSave: { action: "save" },
    onBackToEditor: { action: "backToEditor" },
  },
};

export default meta;
type Story = StoryObj<typeof VideoTrimmerUI>;

const defaultHandlers: Pick<
  VideoTrimmerUIProps,
  | "onFileSelect"
  | "onTogglePlay"
  | "onTimelineClick"
  | "onDragStart"
  | "onTrim"
  | "onSave"
  | "onBackToEditor"
> = {
  onFileSelect: () => {},
  onTogglePlay: () => {},
  onTimelineClick: () => {},
  onDragStart: () => {},
  onTrim: () => {},
  onSave: () => {},
  onBackToEditor: () => {},
};

export const Idle: Story = {
  args: {
    videoUrl: "",
    duration: 0,
    currentTime: 0,
    isPlaying: false,
    startTime: 0,
    endTime: 0,
    thumbnails: [],
    status: "idle",
    trimmedUrl: "",
    error: "",
    ...defaultHandlers,
  },
};

export const LoadingFFmpeg: Story = {
  args: {
    videoUrl: "",
    duration: 0,
    currentTime: 0,
    isPlaying: false,
    startTime: 0,
    endTime: 0,
    thumbnails: [],
    status: "loading-ffmpeg",
    trimmedUrl: "",
    error: "",
    ...defaultHandlers,
  },
};

export const Ready: Story = {
  args: {
    videoUrl: "/video1.mp4",
    duration: 120,
    currentTime: 30,
    isPlaying: false,
    startTime: 10,
    endTime: 110,
    thumbnails: Array.from(
      { length: 20 },
      (_, i) =>
        `data:image/svg+xml;base64,${btoa(
          `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="90">
            <rect fill="hsl(${200 + i * 5}, 60%, ${30 + (i % 3) * 15}%)" width="160" height="90"/>
            <text fill="white" font-size="14" x="80" y="50" text-anchor="middle">${i + 1}</text>
          </svg>`,
        )}`,
    ),
    status: "ready",
    trimmedUrl: "",
    error: "",
    ...defaultHandlers,
  },
  parameters: {
    docs: {
      description: {
        story:
          "Shows the trimmer with a sample video and generated thumbnails. Uses `public/video1.mp4` for the video source.",
      },
    },
  },
};

export const Trimming: Story = {
  args: {
    videoUrl: "/video1.mp4",
    duration: 120,
    currentTime: 45,
    isPlaying: false,
    startTime: 20,
    endTime: 100,
    thumbnails: Array.from(
      { length: 20 },
      (_, i) =>
        `data:image/svg+xml;base64,${btoa(
          `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="90">
            <rect fill="hsl(${200 + i * 5}, 60%, ${30 + (i % 3) * 15}%)" width="160" height="90"/>
            <text fill="white" font-size="14" x="80" y="50" text-anchor="middle">${i + 1}</text>
          </svg>`,
        )}`,
    ),
    status: "trimming",
    trimmedUrl: "",
    error: "",
    ...defaultHandlers,
  },
};

export const WithError: Story = {
  args: {
    videoUrl: "/video1.mp4",
    duration: 120,
    currentTime: 30,
    isPlaying: false,
    startTime: 10,
    endTime: 110,
    thumbnails: Array.from(
      { length: 20 },
      (_, i) =>
        `data:image/svg+xml;base64,${btoa(
          `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="90">
            <rect fill="hsl(${200 + i * 5}, 60%, ${30 + (i % 3) * 15}%)" width="160" height="90"/>
            <text fill="white" font-size="14" x="80" y="50" text-anchor="middle">${i + 1}</text>
          </svg>`,
        )}`,
    ),
    status: "ready",
    trimmedUrl: "",
    error: "FFmpeg failed to trim video: Invalid time range",
    ...defaultHandlers,
  },
};

export const Preview: Story = {
  args: {
    videoUrl: "/video1.mp4",
    duration: 120,
    currentTime: 0,
    isPlaying: false,
    startTime: 20,
    endTime: 80,
    thumbnails: [],
    status: "preview",
    trimmedUrl: "/video1.mp4",
    error: "",
    ...defaultHandlers,
  },
  parameters: {
    docs: {
      description: {
        story:
          "Shows the preview state after trimming. The trimmed video URL is set to the same sample for demonstration.",
      },
    },
  },
};
