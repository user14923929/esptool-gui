import { create } from "zustand";

export type Tab = "flash" | "read" | "erase" | "chipinfo" | "monitor";
export type Chip =
  | "auto"
  | "esp8266"
  | "esp32"
  | "esp32s2"
  | "esp32s3"
  | "esp32c3"
  | "esp32c6"
  | "esp32h2";
export type FlashMode = "dio" | "dout" | "qio" | "qout";
export type LogLevel = "info" | "ok" | "warn" | "error" | "progress";

export interface LogLine {
  id: number;
  level: LogLevel;
  text: string;
  progress?: number;
  ts: number;
}

export interface FlashEntry {
  id: string;
  address: string;
  path: string;
}

export interface AppState {
  // Connection
  port: string;
  baud: string;
  chip: Chip;

  // Available ports (refreshed from backend)
  availablePorts: { name: string; description: string }[];

  // Navigation
  activeTab: Tab;

  // Flash tab
  flashMode: FlashMode;
  flashEntries: FlashEntry[];

  // Read tab
  readAddress: string;
  readSize: string;
  readOutput: string;

  // Running state
  running: boolean;
  progress: number; // 0-100

  // Log
  log: LogLine[];
  logCounter: number;

  // Actions
  setPort: (p: string) => void;
  setBaud: (b: string) => void;
  setChip: (c: Chip) => void;
  setAvailablePorts: (ports: { name: string; description: string }[]) => void;
  setActiveTab: (t: Tab) => void;
  setFlashMode: (m: FlashMode) => void;
  setFlashEntries: (entries: FlashEntry[]) => void;
  updateFlashEntry: (id: string, patch: Partial<FlashEntry>) => void;
  addFlashEntry: () => void;
  removeFlashEntry: (id: string) => void;
  setReadAddress: (v: string) => void;
  setReadSize: (v: string) => void;
  setReadOutput: (v: string) => void;
  setRunning: (v: boolean) => void;
  setProgress: (v: number) => void;
  appendLog: (line: Omit<LogLine, "id" | "ts">) => void;
  clearLog: () => void;
}

let _id = 0;

export const useStore = create<AppState>((set) => ({
  port: "",
  baud: "921600",
  chip: "auto",
  availablePorts: [],
  activeTab: "flash",
  flashMode: "dio",
  flashEntries: [{ id: "1", address: "0x0", path: "" }],
  readAddress: "0x0",
  readSize: "0x400000",
  readOutput: "",
  running: false,
  progress: 0,
  log: [],
  logCounter: 0,

  setPort: (port) => set({ port }),
  setBaud: (baud) => set({ baud }),
  setChip: (chip) => set({ chip }),
  setAvailablePorts: (availablePorts) => set({ availablePorts }),
  setActiveTab: (activeTab) => set({ activeTab }),
  setFlashMode: (flashMode) => set({ flashMode }),
  setFlashEntries: (flashEntries) => set({ flashEntries }),
  updateFlashEntry: (id, patch) =>
    set((s) => ({
      flashEntries: s.flashEntries.map((e) =>
        e.id === id ? { ...e, ...patch } : e
      ),
    })),
  addFlashEntry: () =>
    set((s) => ({
      flashEntries: [
        ...s.flashEntries,
        { id: String(++_id + Date.now()), address: "0x0", path: "" },
      ],
    })),
  removeFlashEntry: (id) =>
    set((s) => ({
      flashEntries: s.flashEntries.filter((e) => e.id !== id),
    })),
  setReadAddress: (readAddress) => set({ readAddress }),
  setReadSize: (readSize) => set({ readSize }),
  setReadOutput: (readOutput) => set({ readOutput }),
  setRunning: (running) => set({ running, progress: running ? 0 : 0 }),
  setProgress: (progress) => set({ progress }),
  appendLog: (line) =>
    set((s) => ({
      log: [
        ...s.log.slice(-499),
        { ...line, id: ++_id, ts: Date.now() },
      ],
    })),
  clearLog: () => set({ log: [] }),
}));
