import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../contexts/AuthContext';
import { getAllRooms, getSetting, getMonthlyConsumptionFiltered } from '../../services/database';
import GlassCard from '../../components/GlassCard';
import StatusBadge from '../../components/StatusBadge';
import { COLORS, FONT_SIZE, FONT_WEIGHT, RADIUS, SPACING, GRADIENTS } from '../../constants/theme';

export default function OverviewScreen() {
  const { user } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [rate, setRate] = useState(12.5);
  const [refreshing, setRefreshing] = useState(false);
  const [consumption, setConsumption] = useState({ total: 0, revenue: 0 });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const [r, rateVal] = await Promise.all([getAllRooms(), getSetting('rate_per_kwh')]);
    setRooms(r || []);
    const currentRate = rateVal ? parseFloat(rateVal) : 12.5;
    if (rateVal) setRate(currentRate);

    // Calculate real consumption for occupied rooms
    const now = new Date();
    let totalEnergy = 0;
    for (const room of (r || [])) {
      if (room.status === 'occupied') {
        const c = await getMonthlyConsumptionFiltered(room.room_id, now.getFullYear(), now.getMonth() + 1, room.tenant_start_date, room.move_out_date);
        totalEnergy += c.totalEnergy;
      }
    }
    setConsumption({ total: totalEnergy, revenue: totalEnergy * currentRate });
  };

  const onRefresh = async () => { setRefreshing(true); await loadData(); setRefreshing(false); };

  const occupiedRooms = rooms.filter(r => r.status === 'occupied');
  const onProcessRooms = rooms.filter(r => r.status === 'on_process');
  const vacantRooms = rooms.filter(r => r.status === 'vacant');

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
          <SummaryCard icon="home" label="Total Rooms" value={rooms.length} color={COLORS.primary} />
          <SummaryCard icon="flash" label="Occupied" value={occupiedRooms.length} color={COLORS.primary} />
          <SummaryCard icon="time-outline" label="On Process" value={onProcessRooms.length} color={COLORS.warning} />
          <SummaryCard icon="bed-outline" label="Vacant" value={vacantRooms.length} color={COLORS.textMuted} />
        </View>

        {/* Facility Stats */}
        <GlassCard gradient style={ss.facilityCard}>
          <Text style={ss.facilityTitle}>This Month's Facility Stats</Text>
          <View style={ss.facilityRow}>
            <View style={ss.facilityStat}>
              <Text style={ss.facilityValue}>{Number(consumption.total || 0).toFixed(2)}</Text>
              <Text style={ss.facilityLabel}>kWh Total</Text>
            </View>
            <View style={ss.divider} />
            <View style={ss.facilityStat}>
              <Text style={ss.facilityValue}>₱{Number(consumption.revenue || 0).toFixed(2)}</Text>
              <Text style={ss.facilityLabel}>Est. Revenue</Text>
            </View>
            <View style={ss.divider} />
            <View style={ss.facilityStat}>
              <Text style={ss.facilityValue}>₱{rate.toFixed(2)}</Text>
              <Text style={ss.facilityLabel}>Rate/kWh</Text>
            </View>
          </View>
        </GlassCard>

        {/* Room Quick List */}
        <Text style={ss.sectionTitle}>Room Status</Text>
        {rooms.map(room => (
          <GlassCard key={room.room_id} style={ss.roomItem}>
            <View style={ss.roomLeft}>
              <View style={[ss.roomDot, {
                backgroundColor: room.status === 'occupied' ? COLORS.primary
                  : room.status === 'on_process' ? COLORS.warning : COLORS.textMuted
              }]} />
              <View>
                <Text style={ss.roomId}>{room.room_id}</Text>
                <Text style={ss.roomTenant}>{room.tenant_name || 'No tenant'}</Text>
              </View>
            </View>
            <StatusBadge status={room.status} size="sm" />
          </GlassCard>
        ))}
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
});
