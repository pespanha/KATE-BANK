import { AssetType } from '@/lib/mock-data';
import styles from './AssetBadge.module.css';

const assetConfig: Record<AssetType, { label: string; className: string }> = {
  ON: { label: 'Ação ON', className: styles.on },
  PN: { label: 'Ação PN', className: styles.pn },
  DEBT: { label: 'Dívida', className: styles.debt },
  CONV: { label: 'Conversível', className: styles.conv },
  REC: { label: 'Recebível', className: styles.rec },
};

interface AssetBadgeProps {
  type: AssetType;
  compact?: boolean;
}

export default function AssetBadge({ type, compact = false }: AssetBadgeProps) {
  const config = assetConfig[type];
  return (
    <span className={`${styles.badge} ${config.className} ${compact ? styles.compact : ''}`}>
      {compact ? type : config.label}
    </span>
  );
}
