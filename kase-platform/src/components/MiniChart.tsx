import styles from './MiniChart.module.css';

interface MiniChartProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  positive?: boolean;
}

export default function MiniChart({
  data,
  width = 100,
  height = 32,
  positive = true,
}: MiniChartProps) {
  if (data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const padding = 2;

  const points = data.map((value, index) => {
    const x = padding + (index / (data.length - 1)) * (width - padding * 2);
    const y = padding + (1 - (value - min) / range) * (height - padding * 2);
    return `${x},${y}`;
  });

  const linePath = `M${points.join(' L')}`;

  /* area fill path */
  const areaPath = `${linePath} L${width - padding},${height} L${padding},${height} Z`;

  const gradientId = `mc-${Math.random().toString(36).slice(2, 8)}`;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={styles.chart}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop
            offset="0%"
            stopColor={positive ? 'var(--success)' : 'var(--error)'}
            stopOpacity="0.3"
          />
          <stop
            offset="100%"
            stopColor={positive ? 'var(--success)' : 'var(--error)'}
            stopOpacity="0"
          />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${gradientId})`} />
      <path
        d={linePath}
        fill="none"
        stroke={positive ? 'var(--success)' : 'var(--error)'}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
