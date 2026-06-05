import { RefreshCw, Zap } from "lucide-react";
import { useEffect } from "react";
import { useStore, Chip } from "../store";
import { useEsptool } from "../hooks/useEsptool";
import styles from "./ConnectionBar.module.css";

const BAUDS = ["9600", "57600", "115200", "230400", "460800", "921600", "1500000"];
const CHIPS: Chip[] = ["auto", "esp8266", "esp32", "esp32s2", "esp32s3", "esp32c3", "esp32c6", "esp32h2"];

export function ConnectionBar() {
  const { port, baud, chip, availablePorts, running } = useStore();
  const { setPort, setBaud, setChip } = useStore();
  const { refreshPorts } = useEsptool();

  useEffect(() => { refreshPorts(); }, []);

  return (
    <header className={styles.bar}>
      <div className={styles.logo}>
        <Zap size={15} />
        <span>esptool-gui</span>
      </div>

      <div className={styles.fields}>
        <div className={styles.field}>
          <span className={styles.label}>Port</span>
          <div className={styles.portRow}>
            <select
              value={port}
              onChange={(e) => setPort(e.target.value)}
              disabled={running}
              className={styles.select}
            >
              {availablePorts.length === 0 && (
                <option value="">No ports found</option>
              )}
              {availablePorts.map((p) => (
                <option key={p.name} value={p.name}>
                  {p.name}{p.description ? ` · ${p.description}` : ""}
                </option>
              ))}
            </select>
            <button className="btn-icon" onClick={refreshPorts} title="Refresh ports">
              <RefreshCw size={13} />
            </button>
          </div>
        </div>

        <div className={styles.field}>
          <span className={styles.label}>Baud</span>
          <select
            value={baud}
            onChange={(e) => setBaud(e.target.value)}
            disabled={running}
            className={styles.select}
            style={{ width: 110 }}
          >
            {BAUDS.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </div>

        <div className={styles.field}>
          <span className={styles.label}>Chip</span>
          <div className={styles.chipRow}>
            {CHIPS.map((c) => (
              <button
                key={c}
                className={`chip ${chip === c ? "active" : ""}`}
                onClick={() => setChip(c)}
                disabled={running}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}
