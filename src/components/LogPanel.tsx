import { useRef, useEffect } from "react";
import { Trash2 } from "lucide-react";
import { useStore } from "../store";
import styles from "./LogPanel.module.css";

export function LogPanel() {
  const { log, progress, running, clearLog } = useStore();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [log.length]);

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <span className={styles.title}>Output</span>
        <div className={styles.actions}>
          <button className="btn-icon" onClick={clearLog} title="Clear log">
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {running && (
        <div className={styles.progressWrap}>
          <div
            className={styles.progressFill}
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
          <span className={styles.progressLabel}>
            {Math.round(progress)}%
          </span>
        </div>
      )}

      <div className={styles.log}>
        {log.length === 0 && (
          <div className={styles.empty}>No output yet — run a command to start.</div>
        )}
        {log.map((line) => (
          <div key={line.id} className={`${styles.line} ${styles[line.level]}`}>
            <span className={styles.ts}>
              {new Date(line.ts).toLocaleTimeString("en-US", { hour12: false })}
            </span>
            <span className={styles.text}>{line.text}</span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
