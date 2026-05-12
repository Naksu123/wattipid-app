import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, SafeAreaView, StatusBar, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { getBuildingSummary, getSetting } from '../../services/database';
import GlassCard from '../../components/ui/GlassCard';
import StatusBadge from '../../components/ui/StatusBadge';
import { COLORS, GRADIENTS, SPACING, RADIUS, FONT_SIZE, FONT_WEIGHT, SHADOWS } from '@/styles/theme';

export default function OverviewScreen() {
  const { user } = useAuth();
  const router = useRouter();
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
    return (now - last) > 60000; // Standardized to 1 minute
  };

  const SummaryCard = ({ icon, label, value, color, gradient: g }) => (
    <LinearGradient colors={g || ['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.02)']} style={styles.summaryCard}>
      <View style={[styles.summaryIcon, { backgroundColor: `${color}15` }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text style={styles.summaryValue}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </LinearGradient>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView 
        contentContainerStyle={styles.scroll} 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hello, {user?.name?.split(' ')[0] || 'Admin'} 👋</Text>
            <Text style={styles.subtitle}>Facility Management Overview</Text>
          </View>
          <TouchableOpacity style={styles.profileBtn} onPress={() => router.push('/(landlord)/settings')}>
            <Ionicons name="person-circle-outline" size={36} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        {/* Summary Grid */}
        <View style={styles.grid}>
          <SummaryCard icon="home" label="Total Rooms" value={stats.totalRooms} color={COLORS.primary} />
          <SummaryCard icon="flash" label="Occupied" value={stats.occupiedRooms} color={COLORS.success} />
          <SummaryCard icon="time" label="On Process" value={stats.onProcessRooms || 0} color={COLORS.warning} />
          <SummaryCard icon="cloud-offline" label="Offline" value={stats.offlineMeters} color={COLORS.danger} />
        </View>

        {/* Facility Stats */}
        <GlassCard gradient style={styles.facilityCard}>
          <View style={styles.facilityHeader}>
            <Ionicons name="analytics" size={20} color={COLORS.primary} />
            <Text style={styles.facilityTitle}>Monthly Facility Performance</Text>
          </View>
          <View style={styles.facilityRow}>
            <View style={styles.facilityStat}>
              <Text style={styles.facilityLabel}>TOTAL ENERGY</Text>
              <Text style={styles.facilityValue}>{Number(totals.totalEnergy || 0).toFixed(2)} <Text style={styles.unit}>kWh</Text></Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.facilityStat}>
              <Text style={styles.facilityLabel}>TOTAL REVENUE</Text>
              <Text style={styles.facilityValue}>₱{Number(totals.totalCost || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</Text>
            </View>
          </View>
        </GlassCard>

        {/* Room List Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Room Status & Usage</Text>
          <TouchableOpacity onPress={onRefresh}>
            <Text style={styles.refreshText}>Refresh</Text>
          </TouchableOpacity>
        </View>

        {rooms.length > 0 ? (
          rooms.map(room => {
            const offline = isOffline(room.last_seen);
            return (
              <GlassCard key={room.room_id} style={[styles.roomItem, offline && styles.offlineItem]}>
                <View style={styles.roomLeft}>
                  <View style={[styles.statusDot, { backgroundColor: offline ? COLORS.danger : COLORS.success }]} />
                  <View>
                    <Text style={styles.roomName}>{room.room_id}</Text>
                    <Text style={styles.tenantName} numberOfLines={1}>
                      {room.tenant_name || (room.status === 'on_process' ? 'Pending Tenant' : 'Vacant Room')}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.roomRight}>
                  <Text style={styles.energyVal}>{Number(room.currEnergy || 0).toFixed(1)} kWh</Text>
                  <View style={[styles.badge, { backgroundColor: room.status === 'occupied' ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.05)' }]}>
                    <Text style={[styles.badgeText, { color: room.status === 'occupied' ? COLORS.success : COLORS.textMuted }]}>
                      {room.status.toUpperCase()}
                    </Text>
                  </View>
                </View>
              </GlassCard>
            );
          })
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="home-outline" size={48} color={COLORS.textMuted} />
            <Text style={styles.emptyText}>No rooms found</Text>
          </View>
        )}
        
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: SPACING.lg },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    marginBottom: SPACING.xl,
    paddingTop: Platform.OS === 'android' ? 10 : 0
  },
  greeting: { fontSize: 24, fontWeight: FONT_WEIGHT.bold, color: COLORS.textPrimary },
  subtitle: { fontSize: 14, color: COLORS.textMuted, marginTop: 2 },
  profileBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: SPACING.xl },
  summaryCard: { 
    width: '48%', 
    padding: 16, 
    borderRadius: RADIUS.xl, 
    borderWidth: 1, 
    borderColor: COLORS.border,
    ...SHADOWS.small
  },
  summaryIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  summaryValue: { fontSize: 20, fontWeight: FONT_WEIGHT.bold, color: COLORS.textPrimary },
  summaryLabel: { fontSize: 11, color: COLORS.textMuted, marginTop: 2, fontWeight: FONT_WEIGHT.medium },

  facilityCard: { padding: 20, marginBottom: SPACING.xl, borderRadius: RADIUS.xxl },
  facilityHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  facilityTitle: { fontSize: 13, color: COLORS.textMuted, fontWeight: FONT_WEIGHT.heavy, letterSpacing: 0.5, textTransform: 'uppercase' },
  facilityRow: { flexDirection: 'row', alignItems: 'center' },
  facilityStat: { flex: 1, alignItems: 'center' },
  facilityLabel: { fontSize: 10, color: COLORS.textMuted, letterSpacing: 1, marginBottom: 6 },
  facilityValue: { fontSize: 22, fontWeight: FONT_WEIGHT.heavy, color: COLORS.textPrimary },
  unit: { fontSize: 12, color: COLORS.textMuted },
  divider: { width: 1, height: 40, backgroundColor: 'rgba(255,255,255,0.1)', marginHorizontal: 10 },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
  sectionTitle: { fontSize: 18, fontWeight: FONT_WEIGHT.bold, color: COLORS.textPrimary },
  refreshText: { fontSize: 13, color: COLORS.primary, fontWeight: FONT_WEIGHT.semibold },

  roomItem: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: 16, 
    marginBottom: 10, 
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)'
  },
  offlineItem: { opacity: 0.7 },
  roomLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  roomName: { fontSize: 16, fontWeight: FONT_WEIGHT.bold, color: COLORS.textPrimary },
  tenantName: { fontSize: 13, color: COLORS.textMuted, marginTop: 2 },
  roomRight: { alignItems: 'flex-end' },
  energyVal: { fontSize: 14, fontWeight: FONT_WEIGHT.semibold, color: COLORS.textSecondary, marginBottom: 4 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: RADIUS.sm },
  badgeText: { fontSize: 9, fontWeight: FONT_WEIGHT.heavy, letterSpacing: 0.5 },
  
  emptyState: { alignItems: 'center', padding: 40 },
  emptyText: { color: COLORS.textMuted, marginTop: 10 }
});
