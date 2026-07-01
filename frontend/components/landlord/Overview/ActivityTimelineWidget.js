import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import GlassCard from '../../ui/GlassCard';
import { COLORS } from '@/styles/theme';
import styles from '../../../styles/components/landlord/Overview/ActivityTimelineWidget.styles';

export default function ActivityTimelineWidget({ activities = [] }) {
  const getIconForType = (type) => {
    const safeType = type || '';
    if (safeType.includes('payment')) return 'cash-outline';
    if (safeType.includes('room')) return 'bed-outline';
    if (safeType.includes('tenant')) return 'person-outline';
    if (safeType.includes('billing')) return 'document-text-outline';
    return 'information-circle-outline';
  };

  const getColorForType = (type) => {
    const safeType = type || '';
    if (safeType.includes('payment')) return COLORS.success;
    if (safeType.includes('room') || safeType.includes('tenant')) return COLORS.primary;
    if (safeType.includes('alert')) return COLORS.danger;
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
            const safeType = act.action_type || 'activity';
            const color = getColorForType(safeType);
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
                      <Ionicons name={getIconForType(safeType)} size={14} color={color} />
                      <Text style={[styles.actType, { color }]}>{safeType.replace('_', ' ').toUpperCase()}</Text>
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


