import { Upload, Download, Trash2, Cpu, Terminal } from "lucide-react";
import { useStore, Tab } from "../store";
import styles from "./Sidebar.module.css";

const TABS: { id: Tab; icon: React.ReactNode; label: string }[] = [
  { id: "flash",    icon: <Upload size={15} />,    label: "Write Flash" },
  { id: "read",     icon: <Download size={15} />,  label: "Read Flash" },
  { id: "erase",    icon: <Trash2 size={15} />,    label: "Erase Flash" },
  { id: "chipinfo", icon: <Cpu size={15} />,       label: "Chip Info" },
  { id: "monitor",  icon: <Terminal size={15} />,  label: "Port Monitor" },
];

export function Sidebar() {
  const { activeTab, setActiveTab, running } = useStore();

  return (
    <nav className={styles.sidebar}>
      <div className={styles.section}>Operations</div>
      {TABS.map((t) => (
        <button
          key={t.id}
          className={`${styles.item} ${activeTab === t.id ? styles.active : ""}`}
          onClick={() => setActiveTab(t.id)}
          disabled={running && activeTab !== t.id}
        >
          <span className={styles.icon}>{t.icon}</span>
          <span className={styles.label}>{t.label}</span>
        </button>
      ))}
    </nav>
  );
}
