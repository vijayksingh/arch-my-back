import { memo, useId, useMemo } from 'react';

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color: string;
  fillOpacity?: number;
  strokeWidth?: number;
  showCurrentValue?: boolean;
  className?: string;
}

const SparklineComponent = ({
  data,
  width = 200,
  height = 40,
  color,
  fillOpacity = 0.15,
  strokeWidth = 1.5,
  showCurrentValue = false,
  className,
}: SparklineProps) => {
  const gradientId = useId();

  // Handle empty data
  if (data.length === 0) {
    return (
      <svg width={width} height={height} className={className} viewBox={`0 0 ${width} ${height}`} overflow="hidden">
        <line x1="0" y1={height / 2} x2={width} y2={height / 2} stroke={color} strokeWidth={strokeWidth} opacity={0.3} />
      </svg>
    );
  }

  // Handle single point
  if (data.length === 1) {
    const cx = width / 2;
    const cy = height / 2;
    return (
      <svg width={width} height={height} className={className} viewBox={`0 0 ${width} ${height}`} overflow="hidden">
        <circle cx={cx} cy={cy} r={2} fill={color} />
        {showCurrentValue && (
          <text x={width - 5} y={height - 5} fontSize="10" fill={color} textAnchor="end">
            {data[0].toFixed(1)}
          </text>
        )}
      </svg>
    );
  }

  // PERF #8: Find min/max using a loop instead of spread operator
  const { yMin, yMax } = useMemo(() => {
    let min = Infinity;
    let max = -Infinity;
    for (const v of data) {
      if (v < min) min = v;
      if (v > max) max = v;
    }
    return { yMin: min, yMax: max };
  }, [data]);

  // Add 10% padding, handle case where all values are the same
  const range = yMax - yMin;
  const padding = range === 0 ? 1 : range * 0.1;
  const scaledMin = yMin - padding;
  const scaledMax = yMax + padding;
  const scaledRange = scaledMax - scaledMin;

  // Convert data points to SVG coordinates
  const points = data.map((value, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((value - scaledMin) / scaledRange) * height;
    return `${x},${y}`;
  }).join(' ');

  // Create fill polygon points (includes baseline)
  const fillPoints = [
    ...data.map((value, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((value - scaledMin) / scaledRange) * height;
      return `${x},${y}`;
    }),
    `${width},${height}`, // bottom-right corner
    `0,${height}`,        // bottom-left corner
  ].map(point => point.split(',').join(',')).join(' ');

  const currentValue = data[data.length - 1];

  return (
    <svg width={width} height={height} className={className} viewBox={`0 0 ${width} ${height}`} overflow="hidden">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={fillOpacity} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      {/* Fill area */}
      <polygon points={fillPoints} fill={`url(#${gradientId})`} />
      {/* Line */}
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {/* Current value display */}
      {showCurrentValue && (
        <text
          x={width - 5}
          y={height - 5}
          fontSize="10"
          fill={color}
          textAnchor="end"
          fontFamily="monospace"
        >
          {currentValue.toFixed(1)}
        </text>
      )}
    </svg>
  );
};

export const Sparkline = memo(SparklineComponent);
