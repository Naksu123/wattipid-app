import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import GlassCard from '../../ui/GlassCard';
import { COLORS, RADIUS, FONT_WEIGHT, SPACING } from '@/styles/theme';

export default function ActivityTimelineWidget({ activities = [] }) {
  const getIconForType = (type) => {
    if (type.includes('payment')) return 'cash-outline';
    if (type.includes('room')) return 'bed-outline';
    if (type.includes('tenant')) return 'person-outline';
    if (type.includes('billing')) return 'document-text-outline';
    return 'information-circle-outline';
  };

  const getColorForType = (type) => {
    if (type.includes('payment')) return COLORS.success;
    if (type.includes('room') || type.includes('tenant')) return COLORS.primary;
    if (type.includes('alert')) return COLORS.danger;
    return COLORS.info;
  };

  const timeAgo = (dateStr) => {
    const d = new Date(dateStr);
    const now = new Date();
    const seconds = Math.floor((now - d) / 1000);
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  return (
    <GlassCard style={styles.card}>
      <View style={styles.header}>
        <Ionicons name="time" size={20} color={COLORS.textPrimary} />
        <Text style={styles.title}>Live Activity Feed</Text>
      </View>

      {activities.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No recent activity</Text>
        </View>
      ) : (
        <View style={styles.timeline}>
          {activities.map((act, index) => {
            const isLast = index === activities.length - 1;
            const color = getColorForType(act.action_type);
            return (
              <View key={act.id || index} style={styles.itemRow}>
                <View style={styles.nodeCol}>
                  <View style={[styles.node, { borderColor: color }]}>
                    <View style={[styles.nodeInner, { backgroundColor: color }]} />
                  </View>
                  {!isLast && <View style={styles.line} />}
                </View>
                
                <View style={[styles.contentCol, isLast && { paddingBottom: 0 }]}>
                  <View style={styles.actHeader}>
                    <View style={styles.actTypeRow}>
                      <Ionicons name={getIconForType(act.action_type)} size={14} color={color} />
                      <Text style={[styles.actType, { color }]}>{act.action_type.replace('_', ' ').toUpperCase()}</Text>
                    </View>
                    <Text style={styles.time}>{timeAgo(act.created_at)}</Text>
                  </View>
                  <Text style={styles.desc}>{act.description}</Text>
                </View>
              </View>
            );
          })}
        </View>
      )}
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: SPACING.lg,
    marginBottom: SPACING.xl,
    borderRadius: RADIUS.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  title: {
    fontSize: 16,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
  },
  empty: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    color: COLORS.textMuted,
  },
  timeline: {
    paddingLeft: 4,
  },
  itemRow: {
    flexDirection: 'row',
  },
  nodeCol: {
    width: 24,
    alignItems: 'center',
  },
  node: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surfaceGlass,
    zIndex: 2,
  },
  nodeInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  line: {
    width: 2,
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginVertical: 4,
  },
  contentCol: {
    flex: 1,
    paddingLeft: 12,
    paddingBottom: 24,
  },
  actHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  actTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  actType: {
    fontSize: 10,
    fontWeight: FONT_WEIGHT.heavy,
    letterSpacing: 0.5,
  },
  time: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  desc: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
  }
});
