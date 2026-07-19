import { Sidebar } from "@/components/Sidebar";
import styles from "./dashboardLayout.module.css";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={styles.layout}>
      <Sidebar />
      <main className={styles.mainContent}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", width: "100%", display: "flex", flexDirection: "column", gap: "2rem" }}>
          {children}
        </div>
      </main>
    </div>
  );
}
