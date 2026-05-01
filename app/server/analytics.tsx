import { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Card } from '../../src/components/ui/Card';
import { Button } from '../../src/components/ui/Button';
import { theme } from '../../src/lib/theme';
import { useAnalyticsStore } from '../../src/stores/analyticsStore';
import {
  loadPlayerSessions,
  loadServerSessions,
  computeDailyStats,
  getTopPlayers,
  getTotalUptimeMinutes,
  getAverageSessionLength,
  saveDailyStats,
} from '../../src/services/analyticsService';

export default function AnalyticsScreen() {
  const playerSessions = useAnalyticsStore((s) => s.playerSessions);
  const serverSessions = useAnalyticsStore((s) => s.serverSessions);
  const dailyStats = useAnalyticsStore((s) => s.dailyStats);
  const setPlayerSessions = useAnalyticsStore((s) => s.setPlayerSessions);
  const setServerSessions = useAnalyticsStore((s) => s.setServerSessions);
  const setDailyStats = useAnalyticsStore((s) => s.setDailyStats);

  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const ps = await loadPlayerSessions();
    const ss = await loadServerSessions();
    setPlayerSessions(ps);
    setServerSessions(ss);
    const ds = await computeDailyStats();
    setDailyStats(ds);
    await saveDailyStats(ds);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const topPlayers = getTopPlayers(playerSessions, 10);
  const totalUptime = getTotalUptimeMinutes(serverSessions);
  const avgSession = getAverageSessionLength(serverSessions);
  const totalSessions = serverSessions.length;
  const uniquePlayers = new Set(playerSessions.map((s) => s.username)).size;

  return (
    <ScrollView style={theme.screen} contentContainerStyle={{ paddingBottom: 40 }}>
      <Text style={theme.heading}>Analytics</Text>
      <Text style={theme.subtext}>Player statistics and server usage insights</Text>

      {/* Overview Cards */}
      <View style={styles.overviewGrid}>
        <Card style={styles.overviewCard}>
          <Text style={styles.overviewValue}>{totalUptime}</Text>
          <Text style={styles.overviewLabel}>Total Uptime (min)</Text>
        </Card>
        <Card style={styles.overviewCard}>
          <Text style={styles.overviewValue}>{totalSessions}</Text>
          <Text style={styles.overviewLabel}>Sessions</Text>
        </Card>
        <Card style={styles.overviewCard}>
          <Text style={styles.overviewValue}>{uniquePlayers}</Text>
          <Text style={styles.overviewLabel}>Unique Players</Text>
        </Card>
        <Card style={styles.overviewCard}>
          <Text style={styles.overviewValue}>{avgSession}</Text>
          <Text style={styles.overviewLabel}>Avg Session (min)</Text>
        </Card>
      </View>

      {/* Top Players */}
      <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Top Players by Playtime</Text>
      <Card style={styles.tableCard}>
        {topPlayers.length === 0 ? (
          <Text style={styles.emptyText}>No player data yet</Text>
        ) : (
          topPlayers.map((p, i) => (
            <View key={p.username} style={styles.tableRow}>
              <Text style={styles.tableRank}>#{i + 1}</Text>
              <Text style={styles.tableName}>{p.username}</Text>
              <Text style={styles.tableValue}>{p.totalMinutes} min</Text>
            </View>
          ))
        )}
      </Card>

      {/* Daily Stats */}
      <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Daily Activity</Text>
      <Card style={styles.tableCard}>
        {dailyStats.length === 0 ? (
          <Text style={styles.emptyText}>No daily data yet</Text>
        ) : (
          dailyStats.slice(-7).map((d) => (
            <View key={d.date} style={styles.dailyRow}>
              <Text style={styles.dailyDate}>{d.date}</Text>
              <View style={styles.dailyMetrics}>
                <Text style={styles.dailyMetric}>{d.peakPlayers} peak</Text>
                <Text style={styles.dailyMetric}>{d.totalPlaytimeMinutes} min</Text>
                <Text style={styles.dailyMetric}>{d.uniquePlayers.length} players</Text>
              </View>
            </View>
          ))
        )}
      </Card>

      <Button title="Refresh Data" variant="secondary" onPress={handleRefresh} style={{ marginTop: 16 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  overviewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 16,
  },
  overviewCard: {
    width: '47%',
    padding: 14,
    alignItems: 'center',
  },
  overviewValue: {
    color: theme.colors.primary,
    fontSize: 22,
    fontWeight: '700',
  },
  overviewLabel: {
    color: theme.colors.textMuted,
    fontSize: 12,
    marginTop: 4,
  },
  sectionTitle: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 10,
  },
  tableCard: {
    padding: 12,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  tableRank: {
    color: theme.colors.textMuted,
    fontSize: 13,
    width: 32,
  },
  tableName: {
    color: theme.colors.text,
    fontSize: 14,
    flex: 1,
    fontWeight: '600',
  },
  tableValue: {
    color: theme.colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  emptyText: {
    color: theme.colors.textMuted,
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 12,
  },
  dailyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  dailyDate: {
    color: theme.colors.text,
    fontSize: 13,
    fontWeight: '600',
  },
  dailyMetrics: {
    flexDirection: 'row',
    gap: 12,
  },
  dailyMetric: {
    color: theme.colors.textMuted,
    fontSize: 12,
  },
});
