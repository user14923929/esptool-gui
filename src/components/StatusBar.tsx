import { useStore } from "../store";
import styles from "./StatusBar.module.css";

export function StatusBar() {
  const { port, baud, chip, running, progress } = useStore();

  return (
    <footer className={styles.bar}>
      <div className={`${styles.dot} ${running ? styles.active : ""}`} />
      <span className={`${styles.info} mono`}>
        {port ? `${port}  ·  ${baud} baud  ·  ${chip}` : "No port selected"}
      </span>
      {running && (
        <span className={`${styles.status} mono`}>
          Running…  {Math.round(progress)}%
        </span>
      )}
    </footer>
  );
}
