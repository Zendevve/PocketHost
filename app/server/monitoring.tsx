import { View, Text, ScrollView, StyleSheet, Dimensions } from 'react-native';
import { useEffect, useState } from 'react';
import { Card } from '../../src/components/ui/Card';
import { Button } from '../../src/components/ui/Button';
import { theme } from '../../src/lib/theme';
import { useMetricsStore } from '../../src/stores/metricsStore';
import { usePlayerStore } from '../../src/stores/playerStore';
import {
  loadMetricsHistory,
  clearMetricsHistory,
  calculateAverageTPS,
  calculateAverageMemory,
  calculatePeakPlayers,
  calculateUptimeMinutes,
} from '../../src/services/metricsService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

function SimpleBarChart({
  data,
  maxValue,
  color,
  label,
}: {
  data: number[];
  maxValue: number;
  color: string;
  label: string;
}) {
  if (data.length === 0) {
    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartLabel}>{label}</Text>
        <Text style={styles.noDataText}>No data yet</Text>
      </View>
    );
  }

  const barWidth = Math.max(4, (SCREEN_WIDTH - 64) / Math.max(data.length, 1));

  return (
    <View style={styles.chartContainer}>
      <Text style={styles.chartLabel}>{label}</Text>
      <View style={styles.barsRow}>
        {data.map((value, i) => {
          const heightPercent = maxValue > 0 ? (value / maxValue) * 100 : 0;
          return (
            <View
              key={i}
              style={[
                styles.bar,
                {
                  width: barWidth - 2,
                  height: `${Math.max(heightPercent, 2)}%`,
                  backgroundColor: color,
                },
              ]}
            />
          );
        })}
      </View>
      <View style={styles.chartLegend}>
        <Text style={styles.legendText}>0</Text>
        <Text style={styles.legendText}>{maxValue}</Text>
      </View>
    </View>
  );
}

export default function MonitoringScreen() {
  const history = useMetricsStore((s) => s.history);
  const latest = useMetricsStore((s) => s.latest);
  const setHistory = useMetricsStore((s) => s.setHistory);
  const players = usePlayerStore((s) => s.players);
  const onlineCount = players.filter((p) => p.online).length;

  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    loadMetricsHistory().then((h) => {
      setHistory(h);
      setLoaded(true);
    });
  }, []);

  const tpsData = history.map((m) => m.tps);
  const memData = history.map((m) => m.memoryUsedMB);
  const playerData = history.map((m) => m.playerCount);

  const avgTPS = calculateAverageTPS(history);
  const avgMem = calculateAverageMemory(history);
  const peakPlayers = calculatePeakPlayers(history);
  const uptimeMin = calculateUptimeMinutes(history);

  const handleClear = () => {
    clearMetricsHistory();
    setHistory([]);
  };

  return (
    <ScrollView style={theme.screen} contentContainerStyle={{ paddingBottom: 40 }}>
      <Text style={theme.heading}>Server Monitoring</Text>
      <Text style={theme.subtext}>Real-time and historical performance metrics</Text>

      {/* Live Stats */}
      <Card style={styles.liveCard}>
        <Text style={styles.sectionTitle}>Live Stats</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{latest?.tps.toFixed(1) ?? '—'}</Text>
            <Text style={styles.statLabel}>TPS</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{latest?.memoryUsedMB ?? '—'}</Text>
            <Text style={styles.statLabel}>Memory MB</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{onlineCount}</Text>
            <Text style={styles.statLabel}>Players</Text>
          </View>
        </View>
      </Card>

      {/* Historical Charts */}
      <Text style={[styles.sectionTitle, { marginTop: 20, marginBottom: 8 }]}>History (24h)</Text>

      <Card style={styles.chartCard}>
        <SimpleBarChart
          data={tpsData}
          maxValue={20}
          color={theme.colors.primary}
          label="TPS (Ticks Per Second)"
        />
      </Card>

      <Card style={styles.chartCard}>
        <SimpleBarChart
          data={memData}
          maxValue={Math.max(...memData, 1024)}
          color="#60a5fa"
          label="Memory Usage (MB)"
        />
      </Card>

      <Card style={styles.chartCard}>
        <SimpleBarChart
          data={playerData}
          maxValue={Math.max(...playerData, 10)}
          color="#f59e0b"
          label="Player Count"
        />
      </Card>

      {/* Summary */}
      <Card style={styles.summaryCard}>
        <Text style={styles.sectionTitle}>24h Summary</Text>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Average TPS</Text>
          <Text style={styles.summaryValue}>{avgTPS}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Average Memory</Text>
          <Text style={styles.summaryValue}>{avgMem} MB</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Peak Players</Text>
          <Text style={styles.summaryValue}>{peakPlayers}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Tracked Uptime</Text>
          <Text style={styles.summaryValue}>{uptimeMin} min</Text>
        </View>
      </Card>

      <Button title="Clear History" variant="secondary" onPress={handleClear} style={{ marginTop: 12 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  liveCard: {
    marginTop: 16,
    padding: 16,
  },
  sectionTitle: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statBox: {
    alignItems: 'center',
  },
  statValue: {
    color: theme.colors.primary,
    fontSize: 24,
    fontWeight: '700',
  },
  statLabel: {
    color: theme.colors.textMuted,
    fontSize: 12,
    marginTop: 4,
  },
  chartCard: {
    marginBottom: 12,
    padding: 12,
    height: 180,
  },
  chartContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  chartLabel: {
    color: theme.colors.textMuted,
    fontSize: 12,
    marginBottom: 8,
  },
  noDataText: {
    color: theme.colors.textMuted,
    fontSize: 14,
    textAlign: 'center',
  },
  barsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 100,
    gap: 1,
  },
  bar: {
    borderRadius: 2,
    minHeight: 2,
  },
  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  legendText: {
    color: theme.colors.textMuted,
    fontSize: 11,
  },
  summaryCard: {
    marginTop: 4,
    padding: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  summaryLabel: {
    color: theme.colors.textMuted,
    fontSize: 14,
  },
  summaryValue: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
});
