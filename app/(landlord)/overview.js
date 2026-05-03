import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../contexts/AuthContext';
import { getBuildingSummary, getSetting } from '../../services/database';
import GlassCard from '../../components/GlassCard';
import StatusBadge from '../../components/StatusBadge';
import { COLORS, FONT_SIZE, FONT_WEIGHT, RADIUS, SPACING, GRADIENTS } from '../../constants/theme';

export default function OverviewScreen() {
  const { user } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [stats, setStats] = useState({ totalRooms: 0, occupiedRooms: 0, onProcessRooms: 0, offlineMeters: 0 });
  const [totals, setTotals] = useState({ totalEnergy: 0, totalCost: 0 });
  const [rate, setRate] = useState(12.5);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const [summary, rateVal] = await Promise.all([
      getBuildingSummary(),
      getSetting('rate_per_kwh')
    ]);
    
    if (summary) {
      setRooms(summary.rooms || []);
      setStats(summary.stats || { totalRooms: 0, occupiedRooms: 0, onProcessRooms: 0, offlineMeters: 0 });
      setTotals(summary.totals || { totalEnergy: 0, totalCost: 0 });
    }
    if (rateVal) setRate(parseFloat(rateVal));
  };

  const onRefresh = async () => { setRefreshing(true); await loadData(); setRefreshing(false); };

  const isOffline = (lastSeen) => {
    if (!lastSeen) return true;
    const last = new Date(lastSeen).getTime();
    const now = new Date().getTime();
    return (now - last) > 300000; // 5 minutes
  };

  const SummaryCard = ({ icon, label, value, color, gradient: g }) => (
    <LinearGradient colors={g || GRADIENTS.card} style={ss.summaryCard}>
      <View style={[ss.summaryIcon, { backgroundColor: `${color}20` }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <Text style={ss.summaryValue}>{value}</Text>
      <Text style={ss.summaryLabel}>{label}</Text>
    </LinearGradient>
  );

  return (
    <View style={ss.container}>
      <ScrollView contentContainerStyle={ss.scroll} showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}>

        <Text style={ss.greeting}>Welcome, {user?.name || 'Admin'} 👋</Text>
        <Text style={ss.subtitle}>Facility Overview</Text>

        {/* Summary Grid */}
        <View style={ss.grid}>
          <SummaryCard icon="home" label="Total" value={stats.totalRooms} color={COLORS.primary} />
          <SummaryCard icon="flash" label="Occupied" value={stats.occupiedRooms} color={COLORS.success} />
          <SummaryCard icon="time" label="Process" value={stats.onProcessRooms || 0} color={COLORS.warning} />
          <SummaryCard icon="cloud-offline-outline" label="Offline" value={stats.offlineMeters} color={COLORS.danger} />
        </View>

        {/* Facility Stats */}
        <GlassCard gradient style={ss.facilityCard}>
          <Text style={ss.facilityTitle}>This Month's Facility Stats</Text>
          <View style={ss.facilityRow}>
            <View style={ss.facilityStat}>
              <Text style={ss.facilityValue}>{Number(totals.totalEnergy || 0).toFixed(2)}</Text>
              <Text style={ss.facilityLabel}>kWh Building</Text>
            </View>
            <View style={ss.divider} />
            <View style={ss.facilityStat}>
              <Text style={ss.facilityValue}>₱{Number(totals.totalCost || 0).toFixed(2)}</Text>
              <Text style={ss.facilityLabel}>Total Revenue</Text>
            </View>
          </View>
        </GlassCard>

        {/* Room List with Health Status */}
        <Text style={ss.sectionTitle}>Room Connectivity & Usage</Text>
        {rooms.map(room => {
          const offline = isOffline(room.last_seen);
          return (
            <GlassCard key={room.room_id} style={[ss.roomItem, offline && { opacity: 0.8 }]}>
              <View style={ss.roomLeft}>
                <View style={[ss.roomDot, { backgroundColor: offline ? COLORS.danger : COLORS.success }]} />
                <View>
                  <Text style={ss.roomId}>{room.room_id} {offline && <Text style={{ color: COLORS.danger, fontSize: 10 }}>[OFFLINE]</Text>}</Text>
                  <Text style={ss.roomTenant}>{room.tenant_name || (room.status === 'on_process' ? 'On Process' : 'Vacant')}</Text>
                </View>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={ss.roomEnergy}>{Number(room.monthlyEnergy || 0).toFixed(2)} kWh</Text>
                <Text style={ss.roomStatusText}>{room.status}</Text>
              </View>
            </GlassCard>
          );
        })}
      </ScrollView>
    </View>
  );
}

const ss = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: SPACING.lg, paddingTop: SPACING.xxl + 10, paddingBottom: SPACING.xxl },
  greeting: { fontSize: FONT_SIZE.xxl, fontWeight: FONT_WEIGHT.bold, color: COLORS.textPrimary },
  subtitle: { fontSize: FONT_SIZE.md, color: COLORS.textSecondary, marginBottom: SPACING.lg },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginBottom: SPACING.lg },
  summaryCard: { width: '48%', flexGrow: 1, flexBasis: '47%', padding: SPACING.md, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border },
  summaryIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.sm },
  summaryValue: { fontSize: FONT_SIZE.xl, fontWeight: FONT_WEIGHT.bold, color: COLORS.textPrimary },
  summaryLabel: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted, marginTop: 2 },
  facilityCard: { marginBottom: SPACING.lg, paddingVertical: SPACING.xl },
  facilityTitle: { fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.semibold, color: COLORS.textPrimary, marginBottom: SPACING.lg, textAlign: 'center' },
  facilityRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
  facilityStat: { alignItems: 'center' },
  facilityValue: { fontSize: FONT_SIZE.lg, fontWeight: FONT_WEIGHT.bold, color: COLORS.primary },
  facilityLabel: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted, marginTop: 2 },
  divider: { width: 1, height: 40, backgroundColor: COLORS.border },
  sectionTitle: { fontSize: FONT_SIZE.lg, fontWeight: FONT_WEIGHT.bold, color: COLORS.textPrimary, marginBottom: SPACING.md },
  roomItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.sm, padding: SPACING.md },
  roomLeft: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  roomDot: { width: 10, height: 10, borderRadius: 5 },
  roomId: { fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.semibold, color: COLORS.textPrimary },
  roomTenant: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary },
  roomEnergy: { fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.bold, color: COLORS.primary },
  roomStatusText: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted, textTransform: 'capitalize' },
});
