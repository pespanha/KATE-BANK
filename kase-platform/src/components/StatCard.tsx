import styles from './StatCard.module.css';

interface StatCardProps {
  icon: string;
  label: string;
  value: string;
  subtitle?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
}

export default function StatCard({ icon, label, value, subtitle, trend, trendValue }: StatCardProps) {
  return (
    <div className={styles.card}>
      <div className={styles.iconWrap}>
        <span className={styles.icon}>{icon}</span>
      </div>
      <div className={styles.content}>
        <span className={styles.label}>{label}</span>
        <span className={styles.value}>{value}</span>
        {(subtitle || trendValue) && (
          <span className={`${styles.subtitle} ${trend ? styles[trend] : ''}`}>
            {trendValue && (
              <span className={styles.trendValue}>
                {trend === 'up' ? '▲' : trend === 'down' ? '▼' : '●'} {trendValue}
              </span>
            )}
            {subtitle && <span>{subtitle}</span>}
          </span>
        )}
      </div>
    </div>
  );
}
