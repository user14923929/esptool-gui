import { Plus, X, FolderOpen, Copy, Play, Square } from "lucide-react";
import { useState } from "react";
import { useStore, FlashMode } from "../store";
import { useEsptool } from "../hooks/useEsptool";
import styles from "./Tab.module.css";

const MODES: FlashMode[] = ["dio", "dout", "qio", "qout"];

export function FlashTab() {
  const {
    flashEntries, flashMode, running,
    addFlashEntry, removeFlashEntry, updateFlashEntry, setFlashMode,
  } = useStore();
  const { runFlash, getBuildCmd, pickFile } = useEsptool();
  const [cmd, setCmd] = useState<string>("");

  const copyCmd = async () => {
    const c = await getBuildCmd();
    setCmd(c);
    navigator.clipboard.writeText(c);
  };

  const pickForEntry = async (id: string) => {
    const path = await pickFile();
    if (path) updateFlashEntry(id, { path });
  };

  return (
    <div className={styles.tab}>
      <div className={styles.section}>
        <span className={styles.sectionLabel}>Flash mode</span>
        <div className="chip-group">
          {MODES.map((m) => (
            <button
              key={m}
              className={`chip ${flashMode === m ? "active" : ""}`}
              onClick={() => setFlashMode(m)}
              disabled={running}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.section}>
        <span className={styles.sectionLabel}>Binaries</span>

        <div className={styles.entriesHeader}>
          <span className={styles.colAddr}>Address</span>
          <span className={styles.colFile}>File</span>
        </div>

        {flashEntries.map((entry) => (
          <div key={entry.id} className={styles.entryRow}>
            <input
              className={`${styles.addrInput} mono`}
              value={entry.address}
              onChange={(e) => updateFlashEntry(entry.id, { address: e.target.value })}
              disabled={running}
              placeholder="0x0"
              style={{ width: 100, fontFamily: "var(--font-mono)" }}
            />
            <div className={styles.fileInput}>
              <input
                value={entry.path}
                onChange={(e) => updateFlashEntry(entry.id, { path: e.target.value })}
                disabled={running}
                placeholder="/path/to/firmware.bin"
                style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}
              />
              <button className="btn-icon" onClick={() => pickForEntry(entry.id)} disabled={running}>
                <FolderOpen size={14} />
              </button>
            </div>
            <button
              className="btn-icon"
              onClick={() => removeFlashEntry(entry.id)}
              disabled={running || flashEntries.length === 1}
            >
              <X size={13} />
            </button>
          </div>
        ))}

        <button className="btn-ghost" style={{ marginTop: 6, fontSize: 12 }} onClick={addFlashEntry} disabled={running}>
          <Plus size={13} /> Add binary
        </button>
      </div>

      <div className={styles.section}>
        <span className={styles.sectionLabel}>CLI preview</span>
        <div className={styles.cliRow}>
          <div className={`${styles.cliBox} mono`}>
            {cmd || <span style={{ color: "var(--text-muted)" }}>Click ↗ to generate</span>}
          </div>
          <button className="btn-ghost btn-icon" onClick={copyCmd} title="Copy command" style={{ flexShrink: 0, width: 32, height: 32 }}>
            <Copy size={13} />
          </button>
        </div>
      </div>

      <div className={styles.actions}>
        {running ? (
          <button className="btn-danger" disabled>
            <Square size={13} /> Running…
          </button>
        ) : (
          <button className="btn-primary" onClick={runFlash}>
            <Play size={13} /> Write Flash
          </button>
        )}
      </div>
    </div>
  );
}
