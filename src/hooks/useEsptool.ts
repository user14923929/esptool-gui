import { invoke } from "@tauri-apps/api/core";
import { listen, UnlistenFn } from "@tauri-apps/api/event";
import { open as openDialog, save as saveDialog } from "@tauri-apps/plugin-dialog";
import { useEffect, useRef, useCallback } from "react";
import { useStore } from "../store";

interface LogLine {
  level: string;
  text: string;
  progress?: number;
}

export function useEsptool() {
  const store = useStore();
  const unlistenRef = useRef<UnlistenFn[]>([]);

  // Wire up event listeners once
  useEffect(() => {
    const setup = async () => {
      const unLog = await listen<LogLine>("esptool-log", (e) => {
        store.appendLog({
          level: e.payload.level as any,
          text: e.payload.text,
          progress: e.payload.progress,
        });
        if (e.payload.progress != null) {
          store.setProgress(e.payload.progress);
        }
      });

      const unDone = await listen<boolean>("esptool-done", () => {
        store.setRunning(false);
      });

      unlistenRef.current = [unLog, unDone];
    };
    setup();
    return () => {
      unlistenRef.current.forEach((u) => u());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refreshPorts = useCallback(async () => {
    const ports = await invoke<{ name: string; description: string }[]>(
      "list_ports"
    );
    store.setAvailablePorts(ports);
    if (ports.length > 0 && !store.port) {
      store.setPort(ports[0].name);
    }
  }, [store]);

  const runFlash = useCallback(async () => {
    store.clearLog();
    store.setRunning(true);
    store.setProgress(0);
    try {
      await invoke("flash", {
        args: {
          port: store.port,
          baud: store.baud,
          chip: store.chip,
          flash_mode: store.flashMode,
          entries: store.flashEntries.map((e) => ({
            address: e.address,
            path: e.path,
          })),
        },
      });
    } catch (e) {
      store.appendLog({ level: "error", text: String(e) });
      store.setRunning(false);
    }
  }, [store]);

  const runReadFlash = useCallback(async () => {
    store.clearLog();
    store.setRunning(true);
    store.setProgress(0);
    try {
      await invoke("read_flash", {
        args: {
          port: store.port,
          baud: store.baud,
          chip: store.chip,
          address: store.readAddress,
          size: store.readSize,
          output: store.readOutput,
        },
      });
    } catch (e) {
      store.appendLog({ level: "error", text: String(e) });
      store.setRunning(false);
    }
  }, [store]);

  const runErase = useCallback(async () => {
    store.clearLog();
    store.setRunning(true);
    try {
      await invoke("erase_flash", {
        port: store.port,
        baud: store.baud,
        chip: store.chip,
      });
    } catch (e) {
      store.appendLog({ level: "error", text: String(e) });
      store.setRunning(false);
    }
  }, [store]);

  const runChipInfo = useCallback(async () => {
    store.clearLog();
    store.setRunning(true);
    try {
      await invoke("chip_info", {
        port: store.port,
        baud: store.baud,
        chip: store.chip,
      });
    } catch (e) {
      store.appendLog({ level: "error", text: String(e) });
      store.setRunning(false);
    }
  }, [store]);

  const getBuildCmd = useCallback(async (): Promise<string> => {
    return invoke<string>("build_flash_cmd", {
      args: {
        port: store.port,
        baud: store.baud,
        chip: store.chip,
        flash_mode: store.flashMode,
        entries: store.flashEntries.map((e) => ({
          address: e.address,
          path: e.path,
        })),
      },
    });
  }, [store]);

  const pickFile = useCallback(async (): Promise<string | null> => {
    const result = await openDialog({
      multiple: false,
      filters: [{ name: "Firmware", extensions: ["bin"] }, { name: "All", extensions: ["*"] }],
    });
    if (typeof result === "string") return result;
    return null;
  }, []);

  const pickSaveFile = useCallback(async (): Promise<string | null> => {
    const result = await saveDialog({
      filters: [{ name: "Binary", extensions: ["bin"] }],
      defaultPath: "flash_dump.bin",
    });
    return result ?? null;
  }, []);

  return {
    refreshPorts,
    runFlash,
    runReadFlash,
    runErase,
    runChipInfo,
    getBuildCmd,
    pickFile,
    pickSaveFile,
  };
}
