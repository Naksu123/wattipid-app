import React, { memo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import s from '../../styles/landlord/rooms.styles';

const getStatusConfig = (status, tenantName) => {
  switch (status) {
    case 'occupied':
      return {
        label: tenantName || 'Occupied',
        color: '#10B981',
        bg: 'rgba(16, 185, 129, 0.15)',
        border: 'rgba(16, 185, 129, 0.3)',
      };
    case 'vacant':
      return {
        label: 'Vacant',
        color: '#F59E0B',
        bg: 'rgba(245, 158, 11, 0.15)',
        border: 'rgba(245, 158, 11, 0.3)',
      };
    case 'on_process':
      return {
        label: 'Processing',
        color: '#38BDF8',
        bg: 'rgba(56, 189, 248, 0.15)',
        border: 'rgba(56, 189, 248, 0.3)',
      };
    case 'under_maintenance':
      return {
        label: 'Maintenance',
        color: '#F97316',
        bg: 'rgba(249, 115, 22, 0.15)',
        border: 'rgba(249, 115, 22, 0.3)',
      };
    case 'not_available':
      return {
        label: 'Unavailable',
        color: '#EF4444',
        bg: 'rgba(239, 68, 68, 0.15)',
        border: 'rgba(239, 68, 68, 0.3)',
      };
    case 'archived':
      return {
        label: 'Archived',
        color: '#94A3B8',
        bg: 'rgba(148, 163, 184, 0.15)',
        border: 'rgba(148, 163, 184, 0.3)',
      };
    default:
      return {
        label: status || 'Unknown',
        color: '#10B981',
        bg: 'rgba(16, 185, 129, 0.15)',
        border: 'rgba(16, 185, 129, 0.3)',
      };
  }
};

const formatMoveInDate = (dateStr) => {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

/**
 * Calculates the recurring billing and due date based on the tenant's move-in date (tenant_start_date).
 * Instead of a fixed day-1 date (e.g. Oct 1), it uses the exact day of the month the tenant moved in.
 * - If tenant moved in on April 17, recurring due date is the 17th of every month.
 * - If tenant moved in on Sept 15, recurring due date is the 15th of every month.
 * - If the recurring day has already passed for the current month, it advances to next month on the same day.
 * - Month-end dates (e.g., 31st) are safely clamped to the last day of the target month (e.g., Feb 28, Apr 30).
 */
const formatDueDate = (room) => {
  // 1. If explicit due_date from active cycle exists, use it
  if (room.due_date) {
    const d = new Date(room.due_date);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
  }

  // 2. If tenant lease end date is explicitly specified, use it
  if (room.tenant_end_date) {
    const d = new Date(room.tenant_end_date);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
  }

  // 3. Dynamic recurring calculation based on the tenant's move-in date
  const moveInRaw = room.tenant_start_date || room.move_in_date || room.start_date;
  if (!moveInRaw) return '-';

  const moveInDate = new Date(moveInRaw);
  if (isNaN(moveInDate.getTime())) return '-';

  const moveInDay = moveInDate.getDate(); // The recurring day of the month (e.g. 17 for Room 1, 15 for Room 2)
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const todayDate = now.getDate();

  // If today has already reached or passed the recurring move-in day this month, the upcoming due date is next month
  let targetYear = currentYear;
  let targetMonth = currentMonth;

  if (todayDate >= moveInDay) {
    targetMonth += 1;
    if (targetMonth > 11) {
      targetMonth = 0;
      targetYear += 1;
    }
  }

  // Clamping for months with fewer days (e.g. Feb 28/29, Apr 30)
  const daysInTargetMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
  const targetDay = Math.min(moveInDay, daysInTargetMonth);

  const calculatedDueDate = new Date(targetYear, targetMonth, targetDay);
  return calculatedDueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const RoomCard = memo(({ room, consumption, onManage, onMore }) => {
  const isOccupied = room.status === 'occupied';
  const statusCfg = getStatusConfig(room.status, room.tenant_name);

  // Month accumulation calculation
  const energyValue = consumption?.current?.totalEnergy !== undefined
    ? Number(consumption.current.totalEnergy).toFixed(1)
    : (room.consumption?.energy ? Number(room.consumption.energy).toFixed(1) : '0.0');

  const costValue = consumption?.current?.totalCost !== undefined
    ? Number(consumption.current.totalCost).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : (room.consumption?.cost ? Number(room.consumption.cost).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00');

  const moveInDate = formatMoveInDate(room.tenant_start_date);
  const dueDate = isOccupied ? formatDueDate(room) : '-';

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={() => onManage?.(room)}
      accessibilityRole="button"
      accessibilityLabel={`Room ${room.room_id}`}
    >
      <View style={[s.roomCard, isOccupied && s.roomCardOccupied]}>
        {/* ── 1. Card Header Row ── */}
        <View style={s.cardHeaderRow}>
          <View style={s.cardHeaderTitleWrap}>
            <Text style={s.cardRoomNumber} numberOfLines={1}>
              {room.room_id}
            </Text>
            <Text style={s.cardRoomType} numberOfLines={1}>
              {room.room_name || room.room_type || 'Standard Unit'}
            </Text>
          </View>

          <View style={s.cardHeaderRightWrap}>
            <View
              style={[
                s.statusBadgePill,
                { backgroundColor: statusCfg.bg, borderColor: statusCfg.border },
              ]}
            >
              <Text style={[s.statusBadgeText, { color: statusCfg.color }]} numberOfLines={1}>
                {statusCfg.label}
              </Text>
            </View>

            <TouchableOpacity
              style={s.moreIconButton}
              onPress={() => onMore?.(room)}
              accessibilityLabel={`Actions for ${room.room_id}`}
              accessibilityRole="button"
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Ionicons name="ellipsis-horizontal" size={20} color="#94A3B8" />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── 2. Card Info Section (Spacious, Clean, No Inner Borders) ── */}
        <View style={s.cardInfoSection}>
          <View style={s.cardInfoColumnsRow}>
            <View style={s.cardInfoCol}>
              <Text style={s.cardInfoLabel}>Move-in</Text>
              <Text style={s.cardInfoValue}>{moveInDate}</Text>
            </View>
            <View style={s.cardInfoCol}>
              <Text style={s.cardInfoLabel}>Due</Text>
              <Text style={[s.cardInfoValue, isOccupied && { color: '#F59E0B' }]}>
                {dueDate}
              </Text>
            </View>
          </View>

          {!isOccupied && (
            <View style={s.cardTenantRow}>
              <Text style={s.cardInfoLabel}>Tenant</Text>
              <Text style={s.cardTenantMutedValue}>
                {room.status === 'vacant'
                  ? 'No Tenant Assigned'
                  : room.status === 'under_maintenance'
                  ? 'Under Maintenance'
                  : room.status === 'not_available'
                  ? 'Unit Unavailable'
                  : 'Archived Unit'}
              </Text>
            </View>
          )}
        </View>

        {/* ── 3. Month Accumulation (Clean Dual Tiles) ── */}
        <View style={s.accumulationSection}>
          <Text style={s.accumulationHeading}>Month Accumulation</Text>
          <View style={s.accumulationBoxesRow}>
            <View style={s.accumulateBox}>
              <Text style={s.accumulateLabel}>Usage</Text>
              <Text style={s.accumulateValue}>{energyValue} kWh</Text>
            </View>
            <View style={s.accumulateBox}>
              <Text style={s.accumulateLabel}>Cost</Text>
              <Text style={s.accumulateValue}>₱{costValue}</Text>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
});

RoomCard.displayName = 'RoomCard';

export default RoomCard;
