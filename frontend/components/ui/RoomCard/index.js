import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/styles/theme';
import StatusBadge from '../StatusBadge';
import styles from './styles';

export default function RoomCard({ room, onPress }) {
  const isActive = room.status === 'occupied' || room.status === 'active';
  const borderColor = isActive ? COLORS.primary : COLORS.border;

  return (
    <TouchableOpacity
      style={[styles.card, { borderColor }]}
      onPress={() => onPress && onPress(room)}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={styles.roomInfo}>
          <View style={[styles.roomIcon, { backgroundColor: isActive ? 'rgba(34, 197, 94, 0.15)' : 'rgba(100, 116, 139, 0.15)' }]}>
            <Ionicons
              name={isActive ? 'flash' : 'flash-outline'}
              size={22}
              color={isActive ? COLORS.primary : COLORS.textMuted}
            />
          </View>
          <View>
            <Text style={styles.roomId}>{room.room_id}</Text>
            <Text style={styles.tenantName}>
              {room.tenant_name || 'No tenant assigned'}
            </Text>
          </View>
        </View>
        <StatusBadge status={room.status} size="sm" />
      </View>

      {isActive && room.consumption && (
        <View style={styles.stats}>
          <View style={styles.stat}>
            <Ionicons name="flash-outline" size={14} color={COLORS.accent} />
            <Text style={styles.statValue}>{Number(room.consumption.energy || 0).toFixed(2)} kWh</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>₱</Text>
            <Text style={styles.statValue}>{Number(room.consumption.cost || 0).toFixed(2)}</Text>
          </View>
        </View>
      )}

      <View style={styles.footer}>
        <Text style={styles.codeLabel}>Access Code:</Text>
        <Text style={styles.codeValue}>{room.tenant_code || '—'}</Text>
      </View>
    </TouchableOpacity>
  );
}
