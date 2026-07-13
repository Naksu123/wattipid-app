import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated, Dimensions, ScrollView } from 'react-native';
import Svg, { Rect, Line, Text as SvgText, Defs, LinearGradient, Stop } from 'react-native-svg';
import { COLORS, SPACING, RADIUS } from '@/styles/theme';

const CHART_PADDING = { top: 30, right: 16, bottom: 40, left: 44 };
const MIN_BAR_WIDTH = 28;
const BAR_GAP_RATIO = 0.35;

/**
 * WattipidBarChart — Premium interactive bar chart
 * 
 * Props:
 * - labels: string[]
 * - data: number[]
 * - comparisonData?: number[] (previous period, rendered as outlined bars)
 * - unit?: string (e.g. 'kWh', 'Wh')
 * - height?: number
 * - onBarPress?: (index, value) => void
 * - currentIndex?: number (current hour/day/month to highlight green)
 * - lowlightIndex?: number (lowest bar)
 * - accentColor?: string
 */
export default function WattipidBarChart({
  labels = [],
  data = [],
  comparisonData = null,
  unit = 'kWh',
  height = 220,
  onBarPress,
  currentIndex = -1,
  lowlightIndex = -1,
  accentColor = COLORS.primary,
}) {
  const [selectedBar, setSelectedBar] = useState(-1);
  const animProgress = useRef(new Animated.Value(0)).current;
  const [animValue, setAnimValue] = useState(0);

  useEffect(() => {
    animProgress.setValue(0);
    Animated.timing(animProgress, {
      toValue: 1,
      duration: 600,
      useNativeDriver: false,
    }).start();

    const listener = animProgress.addListener(({ value }) => setAnimValue(value));
    return () => animProgress.removeListener(listener);
  }, [data.length, JSON.stringify(data)]);

  if (!data || data.length === 0) {
    return (
      <View style={{ height, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: COLORS.textMuted, fontSize: 14 }}>No data available</Text>
      </View>
    );
  }

  const screenWidth = Dimensions.get('window').width - SPACING.lg * 2 - 32;
  const barCount = data.length;
  const barSlotWidth = Math.max(MIN_BAR_WIDTH, (screenWidth - CHART_PADDING.left - CHART_PADDING.right) / barCount);
  const chartContentWidth = Math.max(screenWidth, barSlotWidth * barCount + CHART_PADDING.left + CHART_PADDING.right);
  const barWidth = barSlotWidth * (1 - BAR_GAP_RATIO);
  const compBarWidth = comparisonData ? barWidth * 0.4 : 0;
  const mainBarWidth = comparisonData ? barWidth * 0.55 : barWidth;

  const allValues = [...data];
  if (comparisonData) allValues.push(...comparisonData);
  const maxVal = Math.max(...allValues.filter(v => v > 0), 0.01);
  const niceMax = getNiceMax(maxVal);
  const gridLines = getGridLines(niceMax);

  const chartAreaHeight = height - CHART_PADDING.top - CHART_PADDING.bottom;

  const handleBarPress = (index) => {
    setSelectedBar(prev => prev === index ? -1 : index);
    if (onBarPress) onBarPress(index, data[index]);
  };

  return (
    <View>
      {/* Tooltip */}
      {selectedBar >= 0 && selectedBar < data.length && (
        <View style={styles.tooltip}>
          <View style={styles.tooltipRow}>
            <View style={[styles.tooltipDot, { backgroundColor: accentColor }]} />
            <Text style={styles.tooltipLabel}>{labels[selectedBar]}</Text>
          </View>
          <Text style={styles.tooltipValue}>{data[selectedBar].toFixed(3)} {unit}</Text>
          {comparisonData && comparisonData[selectedBar] > 0 && (
            <Text style={styles.tooltipComp}>Prev: {comparisonData[selectedBar].toFixed(3)} {unit}</Text>
          )}
        </View>
      )}

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: accentColor }]} />
          <Text style={styles.legendText}>Current</Text>
        </View>
        {comparisonData && (
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: COLORS.textMuted }]} />
            <Text style={styles.legendText}>Previous</Text>
          </View>
        )}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <Svg width={chartContentWidth} height={height}>
          <Defs>
            <LinearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={accentColor} stopOpacity="0.9" />
              <Stop offset="1" stopColor={accentColor} stopOpacity="0.5" />
            </LinearGradient>
            <LinearGradient id="mutedGradient" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={COLORS.surfaceLight} stopOpacity="0.9" />
              <Stop offset="1" stopColor={COLORS.surfaceLight} stopOpacity="0.5" />
            </LinearGradient>
          </Defs>

          {/* Horizontal Grid Lines + Y-axis labels */}
          {gridLines.map((val, i) => {
            const y = CHART_PADDING.top + chartAreaHeight - (val / niceMax) * chartAreaHeight;
            return (
              <React.Fragment key={`grid-${i}`}>
                <Line
                  x1={CHART_PADDING.left} y1={y}
                  x2={chartContentWidth - CHART_PADDING.right} y2={y}
                  stroke="rgba(255,255,255,0.06)" strokeWidth="1"
                />
                <SvgText
                  x={CHART_PADDING.left - 6} y={y + 4}
                  fill={COLORS.textMuted} fontSize="10" textAnchor="end"
                >
                  {formatAxisValue(val)}
                </SvgText>
              </React.Fragment>
            );
          })}

          {/* Zero baseline */}
          <Line
            x1={CHART_PADDING.left}
            y1={CHART_PADDING.top + chartAreaHeight}
            x2={chartContentWidth - CHART_PADDING.right}
            y2={CHART_PADDING.top + chartAreaHeight}
            stroke="rgba(255,255,255,0.1)" strokeWidth="1"
          />

          {/* Bars */}
          {data.map((val, i) => {
            const x = CHART_PADDING.left + i * barSlotWidth + (barSlotWidth - barWidth) / 2;
            const barH = (val / niceMax) * chartAreaHeight * animValue;
            const barY = CHART_PADDING.top + chartAreaHeight - barH;

            const isCurrent = i === currentIndex;
            const isLowlight = i === lowlightIndex;
            const isSelected = i === selectedBar;
            
            // If there's a current index in this view, mute the non-current ones
            const useMuted = currentIndex >= 0 && !isCurrent;

            // Comparison bar (previous period)
            let compBarH = 0;
            let compBarY = CHART_PADDING.top + chartAreaHeight;
            if (comparisonData && comparisonData[i] > 0) {
              compBarH = (comparisonData[i] / niceMax) * chartAreaHeight * animValue;
              compBarY = CHART_PADDING.top + chartAreaHeight - compBarH;
            }

            const mainBarX = comparisonData ? x : x;
            const compBarX = x + mainBarWidth + (barWidth - mainBarWidth - compBarWidth);

            return (
              <React.Fragment key={`bar-${i}`}>
                {/* Comparison bar (outlined/dashed) */}
                {comparisonData && comparisonData[i] > 0 && (
                  <Rect
                    x={compBarX}
                    y={compBarY}
                    width={compBarWidth}
                    height={Math.max(compBarH, 0)}
                    rx={3}
                    fill="transparent"
                    stroke={COLORS.textMuted}
                    strokeWidth={1.5}
                    strokeDasharray="4,3"
                    opacity={0.5}
                  />
                )}

                {/* Main bar */}
                <Rect
                  x={mainBarX}
                  y={barY}
                  width={mainBarWidth}
                  height={Math.max(barH, 0)}
                  rx={4}
                  fill={useMuted ? 'url(#mutedGradient)' : 'url(#barGradient)'}
                  opacity={isSelected ? 1 : (isLowlight ? 0.4 : 1)}
                />

                {/* Selection highlight */}
                {isSelected && (
                  <Rect
                    x={mainBarX - 2}
                    y={barY - 2}
                    width={mainBarWidth + 4}
                    height={Math.max(barH + 4, 0)}
                    rx={5}
                    fill="transparent"
                    stroke={accentColor}
                    strokeWidth={2}
                    opacity={0.6}
                  />
                )}

                {/* X-axis label */}
                <SvgText
                  x={x + barWidth / 2}
                  y={CHART_PADDING.top + chartAreaHeight + 16}
                  fill={isSelected ? COLORS.textPrimary : COLORS.textMuted}
                  fontSize={barCount > 16 ? 8 : 10}
                  textAnchor="middle"
                  fontWeight={isSelected ? 'bold' : 'normal'}
                >
                  {labels[i]}
                </SvgText>
              </React.Fragment>
            );
          })}
        </Svg>

        {/* Invisible touchable overlay for bar press */}
        <View style={{ position: 'absolute', top: 0, left: 0, width: chartContentWidth, height }}>
          {data.map((_, i) => {
            const x = CHART_PADDING.left + i * barSlotWidth;
            return (
              <TouchableOpacity
                key={`touch-${i}`}
                style={{
                  position: 'absolute',
                  left: x,
                  top: CHART_PADDING.top,
                  width: barSlotWidth,
                  height: chartAreaHeight + CHART_PADDING.bottom,
                }}
                onPress={() => handleBarPress(i)}
                activeOpacity={0.7}
              />
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

function getNiceMax(max) {
  if (max <= 0) return 1;
  const magnitude = Math.pow(10, Math.floor(Math.log10(max)));
  const normalized = max / magnitude;
  let nice;
  if (normalized <= 1) nice = 1;
  else if (normalized <= 2) nice = 2;
  else if (normalized <= 5) nice = 5;
  else nice = 10;
  return nice * magnitude;
}

function getGridLines(niceMax) {
  const steps = 5;
  const stepSize = niceMax / steps;
  const lines = [];
  for (let i = 1; i <= steps; i++) {
    lines.push(stepSize * i);
  }
  return lines;
}

function formatAxisValue(val) {
  if (val >= 1000) return (val / 1000).toFixed(1) + 'k';
  if (val >= 100) return val.toFixed(0);
  if (val >= 10) return val.toFixed(1);
  return val.toFixed(2);
}

const styles = {
  tooltip: {
    backgroundColor: 'rgba(31,41,55,0.95)',
    borderRadius: RADIUS.md,
    padding: SPACING.sm + 2,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignSelf: 'center',
  },
  tooltipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  tooltipDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  tooltipLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  tooltipValue: {
    fontSize: 16,
    color: COLORS.textPrimary,
    fontWeight: '700',
  },
  tooltipComp: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 16,
    marginBottom: SPACING.sm,
    paddingRight: 4,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 2,
  },
  legendText: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
};
