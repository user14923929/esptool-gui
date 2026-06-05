import { FolderOpen, Play, Square, AlertTriangle, Cpu, Terminal } from "lucide-react";
import { useStore } from "../store";
import { useEsptool } from "../hooks/useEsptool";
import styles from "./Tab.module.css";

// ── Read Flash ─────────────────────────────────────────────────────────────

export function ReadTab() {
  const { readAddress, readSize, readOutput, running, setReadAddress, setReadSize, setReadOutput } = useStore();
  const { runReadFlash, pickSaveFile } = useEsptool();

  const pickOut = async () => {
    const p = await pickSaveFile();
    if (p) setReadOutput(p);
  };

  return (
    <div className={styles.tab}>
      <div className={styles.section}>
        <span className={styles.sectionLabel}>Region</span>
        <div className={styles.fieldRow}>
          <div className={styles.fieldGroup}>
            <span className="field-label">Start address</span>
            <input
              value={readAddress}
              onChange={(e) => setReadAddress(e.target.value)}
              disabled={running}
              placeholder="0x0"
              style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}
            />
          </div>
          <div className={styles.fieldGroup}>
            <span className="field-label">Size (bytes)</span>
            <input
              value={readSize}
              onChange={(e) => setReadSize(e.target.value)}
              disabled={running}
              placeholder="0x400000"
              style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}
            />
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <span className={styles.sectionLabel}>Output file</span>
        <div className={styles.fileInput}>
          <input
            value={readOutput}
            onChange={(e) => setReadOutput(e.target.value)}
            disabled={running}
            placeholder="/path/to/dump.bin"
            style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}
          />
          <button className="btn-icon" onClick={pickOut} disabled={running}>
            <FolderOpen size={14} />
          </button>
        </div>
      </div>

      <div className={styles.actions}>
        {running ? (
          <button className="btn-danger" disabled>
            <Square size={13} /> Reading…
          </button>
        ) : (
          <button className="btn-primary" onClick={runReadFlash}>
            <Play size={13} /> Read Flash
          </button>
        )}
      </div>
    </div>
  );
}

// ── Erase Flash ────────────────────────────────────────────────────────────

export function EraseTab() {
  const { running, port, chip } = useStore();
  const { runErase } = useEsptool();

  return (
    <div className={styles.tab}>
      <div className={styles.section}>
        <div className={styles.warningBox}>
          <AlertTriangle size={16} />
          <div>
            <strong>Destructive operation</strong>
            <p>This will erase the entire flash chip on <code>{port || "selected port"}</code>.
            All firmware, data, and NVS will be permanently lost.</p>
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <span className={styles.sectionLabel}>Target</span>
        <div className={styles.infoRow}>
          <span>Port</span><code className="mono">{port || "—"}</code>
        </div>
        <div className={styles.infoRow}>
          <span>Chip</span><code className="mono">{chip}</code>
        </div>
      </div>

      <div className={styles.actions}>
        {running ? (
          <button className="btn-danger" disabled>
            <Square size={13} /> Erasing…
          </button>
        ) : (
          <button className="btn-danger" onClick={runErase}>
            <AlertTriangle size={13} /> Erase Flash
          </button>
        )}
      </div>
    </div>
  );
}

// ── Chip Info ──────────────────────────────────────────────────────────────

export function ChipInfoTab() {
  const { running } = useStore();
  const { runChipInfo } = useEsptool();

  return (
    <div className={styles.tab}>
      <div className={styles.section}>
        <Cpu size={32} style={{ color: "var(--text-muted)", marginBottom: 10 }} />
        <p style={{ color: "var(--text-secondary)", fontSize: 13, lineHeight: 1.6, maxWidth: 360 }}>
          Reads chip ID, MAC address, flash size, crystal frequency, and security
          info from the connected device.
        </p>
      </div>

      <div className={styles.actions}>
        {running ? (
          <button className="btn-ghost" disabled>
            <Square size={13} /> Reading…
          </button>
        ) : (
          <button className="btn-primary" onClick={runChipInfo}>
            <Play size={13} /> Read Chip Info
          </button>
        )}
      </div>
    </div>
  );
}

// ── Port Monitor ───────────────────────────────────────────────────────────

export function MonitorTab() {
  return (
    <div className={styles.tab}>
      <div className={styles.section}>
        <Terminal size={32} style={{ color: "var(--text-muted)", marginBottom: 10 }} />
        <p style={{ color: "var(--text-secondary)", fontSize: 13, lineHeight: 1.6, maxWidth: 360 }}>
          Serial port monitor is coming in v0.2. For now, use your system's serial
          terminal — e.g. <code className="mono">minicom</code>, <code className="mono">tio</code>,
          or <code className="mono">screen</code>.
        </p>
        <div className={styles.cliBox} style={{ marginTop: 12 }}>
          <span className="mono" style={{ fontSize: 12 }}>tio /dev/ttyUSB0 -b 115200</span>
        </div>
      </div>
    </div>
  );
}
