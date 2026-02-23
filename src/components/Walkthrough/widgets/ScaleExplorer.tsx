import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, TrendingUp, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ScaleExplorerWidgetConfig } from '@/types/walkthrough';

interface ScaleExplorerProps {
  config: ScaleExplorerWidgetConfig;
}

/**
 * ScaleExplorer - Interactive parameter scaling widget
 * Lets learners drag a slider and watch metrics change in real-time
 */
export function ScaleExplorer({ config }: ScaleExplorerProps) {
  const { title, parameter, metrics, insights } = config;

  // Initialize with minimum value
  const [value, setValue] = useState(parameter.min);

  // Compute slider position (0-100) based on scale type
  const getSliderPosition = (val: number): number => {
    if (parameter.scale === 'log') {
      const logMin = Math.log10(parameter.min);
      const logMax = Math.log10(parameter.max);
      const logVal = Math.log10(val);
      return ((logVal - logMin) / (logMax - logMin)) * 100;
    }
    return ((val - parameter.min) / (parameter.max - parameter.min)) * 100;
  };

  // Convert slider position (0-100) to value
  const getValueFromPosition = (pos: number): number => {
    if (parameter.scale === 'log') {
      const logMin = Math.log10(parameter.min);
      const logMax = Math.log10(parameter.max);
      const logVal = logMin + (pos / 100) * (logMax - logMin);
      return Math.pow(10, logVal);
    }
    return parameter.min + (pos / 100) * (parameter.max - parameter.min);
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const position = parseFloat(e.target.value);
    setValue(getValueFromPosition(position));
  };

  // Evaluate formula for a metric
  const evaluateMetric = (formula: string, n: number): number => {
    try {
      // Create a function that evaluates the formula
      // Safe because formulas come from content authors, not user input
      const fn = new Function('n', `return ${formula}`);
      return fn(n);
    } catch (error) {
      console.error('Error evaluating formula:', formula, error);
      return 0;
    }
  };

  // Format large numbers with K, M, B, T suffixes
  const formatNumber = (num: number): string => {
    if (num >= 1e12) return `${(num / 1e12).toFixed(1)}T`;
    if (num >= 1e9) return `${(num / 1e9).toFixed(1)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(1)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(1)}K`;
    return num.toFixed(1);
  };

  // Get metric color based on thresholds
  const getMetricColor = (metricValue: number, thresholds: { warning: number; critical: number }) => {
    if (metricValue >= thresholds.critical) {
      return {
        bg: 'bg-red-50 dark:bg-red-950/30',
        border: 'border-red-500',
        text: 'text-red-900 dark:text-red-100',
        icon: 'text-red-600 dark:text-red-400',
      };
    }
    if (metricValue >= thresholds.warning) {
      return {
        bg: 'bg-yellow-50 dark:bg-yellow-950/30',
        border: 'border-yellow-500',
        text: 'text-yellow-900 dark:text-yellow-100',
        icon: 'text-yellow-600 dark:text-yellow-400',
      };
    }
    return {
      bg: 'bg-green-50 dark:bg-green-950/30',
      border: 'border-green-500',
      text: 'text-green-900 dark:text-green-100',
      icon: 'text-green-600 dark:text-green-400',
    };
  };

  // Find active insight based on current value
  const activeInsight = useMemo(() => {
    // Find the insight with the highest trigger value that's <= current value
    const triggered = insights
      .filter(insight => value >= insight.triggerValue)
      .sort((a, b) => b.triggerValue - a.triggerValue);
    return triggered[0];
  }, [value, insights]);

  // Track previous insight for animation
  const [prevInsightMessage, setPrevInsightMessage] = useState<string | undefined>();

  useEffect(() => {
    if (activeInsight?.message !== prevInsightMessage) {
      setPrevInsightMessage(activeInsight?.message);
    }
  }, [activeInsight, prevInsightMessage]);

  return (
    <div className="rounded-lg border border-border bg-card p-6 space-y-6">
      {/* Title */}
      <div className="flex items-center gap-2">
        <TrendingUp className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">{title}</h3>
      </div>

      {/* Parameter Slider */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">
            {parameter.name}
          </span>
          <span className="text-lg font-bold">
            {formatNumber(value)} {parameter.unit}
          </span>
        </div>

        <div className="relative">
          <input
            type="range"
            min="0"
            max="100"
            step="0.1"
            value={getSliderPosition(value)}
            onChange={handleSliderChange}
            className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer slider"
            style={{
              background: `linear-gradient(to right, hsl(var(--primary)) 0%, hsl(var(--primary)) ${getSliderPosition(value)}%, hsl(var(--muted)) ${getSliderPosition(value)}%, hsl(var(--muted)) 100%)`,
            }}
          />
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{formatNumber(parameter.min)} {parameter.unit}</span>
          <span>{formatNumber(parameter.max)} {parameter.unit}</span>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 gap-3">
        {metrics.map((metric, idx) => {
          const metricValue = evaluateMetric(metric.compute, value);
          const colors = getMetricColor(metricValue, metric.thresholds);

          return (
            <motion.div
              key={idx}
              layout
              className={cn(
                'rounded-lg border-2 p-4 transition-colors duration-300',
                colors.bg,
                colors.border
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-muted-foreground mb-1">
                    {metric.name}
                  </div>
                  <div className={cn('text-2xl font-bold', colors.text)}>
                    {formatNumber(metricValue)} {metric.unit}
                  </div>
                </div>

                {metricValue >= metric.thresholds.warning && (
                  <AlertTriangle className={cn('h-5 w-5 shrink-0 mt-1', colors.icon)} />
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Insight Callout */}
      <AnimatePresence mode="wait">
        {activeInsight && (
          <motion.div
            key={activeInsight.message}
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="rounded-lg border border-blue-500 bg-blue-50 dark:bg-blue-950/30 p-4"
          >
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
              <div className="flex-1 text-sm text-blue-900 dark:text-blue-100">
                {activeInsight.message}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: hsl(var(--primary));
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }

        .slider::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: hsl(var(--primary));
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }

        .slider::-webkit-slider-thumb:hover {
          transform: scale(1.1);
        }

        .slider::-moz-range-thumb:hover {
          transform: scale(1.1);
        }
      `}</style>
    </div>
  );
}
