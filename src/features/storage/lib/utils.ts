export function generateVideoPath(file: File, prefix = "videos") {
  const ext = getVideoExtension(file.name);
  const timestamp = Date.now();
  const random = Math.random().toString(36).slice(2, 10);
  return `${prefix}/${timestamp}-${random}${ext}`;
}

export function getVideoExtension(filename: string) {
  const match = filename.match(/\.[^.]+$/);
  if (match) return match[0];
  return ".mp4";
}

export function isVideoFile(file: File) {
  return file.type.startsWith("video/");
}
