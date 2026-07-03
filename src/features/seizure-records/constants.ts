export const SEIZURE_TYPES = [
  "Tonic-clonic",
  "Focal aware",
  "Focal impaired awareness",
  "Absence",
  "Myoclonic",
  "Atonic",
  "Clonic",
  "Tonic",
  "Unknown",
  "Other",
] as const;

export type SeizureType = (typeof SEIZURE_TYPES)[number];
