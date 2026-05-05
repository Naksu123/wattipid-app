import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../contexts/AuthContext';
import { getBuildingSummary, getSetting } from '../../services/database';
import GlassCard from '../../components/ui/GlassCard';
import StatusBadge from '../../components/ui/StatusBadge';
import { COLORS, GRADIENTS } from '@/styles/theme';
import ss from '@/styles/landlord/overview.styles';

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
