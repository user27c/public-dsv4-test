import { ReactNode } from 'react';
import styles from './Layout.module.css';

interface LayoutProps {
  left: ReactNode;
  center: ReactNode;
  right: ReactNode;
}

export default function Layout({ left, center, right }: LayoutProps) {
  return (
    <div className={styles.layout}>
      <div className={styles.leftPanel}>{left}</div>
      <div className={styles.centerPanel}>{center}</div>
      <div className={styles.rightPanel}>{right}</div>
    </div>
  );
}
