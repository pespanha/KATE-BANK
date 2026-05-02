import { Activity } from '@/lib/mock-data';
import styles from './ActivityTimeline.module.css';

const typeIcons: Record<Activity['type'], string> = {
  investment: '📈',
  dividend: '💰',
  order_created: '📋',
  order_filled: '✅',
  kyc_approved: '🛡️',
  deposit: '📥',
  withdrawal: '📤',
};

const statusColors: Record<Activity['status'], string> = {
  success: styles.statusSuccess ?? '',
  pending: styles.statusPending ?? '',
  info: styles.statusInfo ?? '',
};

interface ActivityTimelineProps {
  activities: Activity[];
  maxItems?: number;
}

export default function ActivityTimeline({ activities, maxItems = 6 }: ActivityTimelineProps) {
  const items = activities.slice(0, maxItems);

  return (
    <div className={styles.timeline}>
      {items.map((activity, index) => (
        <div key={activity.id} className={styles.item} style={{ animationDelay: `${index * 0.08}s` }}>
          <div className={styles.connector}>
            <div className={`${styles.dot} ${statusColors[activity.status]}`} />
            {index < items.length - 1 && <div className={styles.line} />}
          </div>
          <div className={styles.content}>
            <div className={styles.header}>
              <span className={styles.icon}>{typeIcons[activity.type]}</span>
              <span className={styles.title}>{activity.title}</span>
              <span className={styles.date}>{activity.date}</span>
            </div>
            <p className={styles.description}>{activity.description}</p>
            {activity.amount !== undefined && (
              <span className={`${styles.amount} ${activity.type === 'withdrawal' ? styles.negative : ''}`}>
                {activity.type === 'withdrawal' ? '-' : '+'}R$ {activity.amount.toLocaleString('pt-BR')}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
