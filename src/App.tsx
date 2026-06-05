import "./styles/global.css";
import { useStore } from "./store";
import { ConnectionBar } from "./components/ConnectionBar";
import { Sidebar } from "./components/Sidebar";
import { LogPanel } from "./components/LogPanel";
import { StatusBar } from "./components/StatusBar";
import { FlashTab } from "./components/FlashTab";
import { ReadTab, EraseTab, ChipInfoTab, MonitorTab } from "./components/OtherTabs";
import styles from "./App.module.css";

function TabContent() {
  const { activeTab } = useStore();
  switch (activeTab) {
    case "flash":    return <FlashTab />;
    case "read":     return <ReadTab />;
    case "erase":    return <EraseTab />;
    case "chipinfo": return <ChipInfoTab />;
    case "monitor":  return <MonitorTab />;
  }
}

export default function App() {
  return (
    <div className={styles.app}>
      <ConnectionBar />
      <div className={styles.body}>
        <Sidebar />
        <div className={styles.main}>
          <TabContent />
          <LogPanel />
        </div>
      </div>
      <StatusBar />
    </div>
  );
}
