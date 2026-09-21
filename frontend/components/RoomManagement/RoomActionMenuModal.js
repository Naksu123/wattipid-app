import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../styles/theme';
import s from '../../styles/landlord/rooms.styles';

export default function RoomActionMenuModal({
  visible,
  onClose,
  room,
  onGenerateReport,
  onViewHistory,
  onLogCashPayment,
  onTransferTenant,
  onRemoveTenant,
  onSendInvitation,
  onResetToVacant,
  onRegenCode,
  onArchiveRoom,
  onRestoreRoom,
  onEditRoom,
}) {
  if (!room) return null;

  const isOccupied = room.status === 'occupied';
  const subtitle = isOccupied
    ? (room.tenant_name || 'Active Tenant')
    : (room.status || 'Vacant').replace('_', ' ').toUpperCase();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={s.bottomSheetOverlay}>
          <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
            <View style={s.bottomSheetContainer}>
              {/* Drag Handle */}
              <View style={s.bottomSheetHandle} />

              {/* Header */}
              <View style={s.menuHeaderRow}>
                <View style={s.menuHeaderTitleWrap}>
                  <Text style={s.menuHeaderTitle}>Manage {room.room_id}</Text>
                  <Text style={s.menuHeaderSubtitle} numberOfLines={1}>
                    {subtitle}
                  </Text>
                </View>
                <TouchableOpacity
                  style={s.menuCloseBtn}
                  onPress={onClose}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  accessibilityLabel="Close Menu"
                >
                  <Ionicons name="close-circle" size={28} color="rgba(255, 255, 255, 0.4)" />
                </TouchableOpacity>
              </View>

              <View style={s.menuDivider} />

              {/* Action List */}
              <ScrollView style={s.menuScrollList} showsVerticalScrollIndicator={false}>
                {isOccupied ? (
                  <>
                    <TouchableOpacity
                      style={s.actionRowItem}
                      onPress={() => { onClose(); onGenerateReport?.(room); }}
                      activeOpacity={0.7}
                    >
                      <View style={[s.actionIconBadge, { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}>
                        <Ionicons name="document-text" size={20} color="#3B82F6" />
                      </View>
                      <Text style={s.actionRowLabel}>Generate Report</Text>
                      <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={s.actionRowItem}
                      onPress={() => { onClose(); onViewHistory?.(room); }}
                      activeOpacity={0.7}
                    >
                      <View style={[s.actionIconBadge, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                        <Ionicons name="time" size={20} color="#10B981" />
                      </View>
                      <Text style={s.actionRowLabel}>View History</Text>
                      <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={s.actionRowItem}
                      onPress={() => { onClose(); onLogCashPayment?.(room); }}
                      activeOpacity={0.7}
                    >
                      <View style={[s.actionIconBadge, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
                        <Ionicons name="card" size={20} color="#F59E0B" />
                      </View>
                      <Text style={s.actionRowLabel}>Log Cash Payment</Text>
                      <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={s.actionRowItem}
                      onPress={() => { onClose(); onTransferTenant?.(room); }}
                      activeOpacity={0.7}
                    >
                      <View style={[s.actionIconBadge, { backgroundColor: 'rgba(20, 184, 166, 0.15)' }]}>
                        <Ionicons name="swap-horizontal" size={20} color="#14B8A6" />
                      </View>
                      <Text style={s.actionRowLabel}>Transfer Tenant</Text>
                      <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={s.actionRowItem}
                      onPress={() => { onClose(); onRemoveTenant?.(room); }}
                      activeOpacity={0.7}
                    >
                      <View style={[s.actionIconBadge, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
                        <Ionicons name="log-out" size={20} color="#EF4444" />
                      </View>
                      <Text style={[s.actionRowLabel, { color: '#EF4444' }]}>Remove Tenant</Text>
                      <Ionicons name="chevron-forward" size={18} color="rgba(239, 68, 68, 0.6)" />
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    {(room.status === 'vacant' || room.status === 'on_process') && (
                      <TouchableOpacity
                        style={s.actionRowItem}
                        onPress={() => { onClose(); onSendInvitation?.(room); }}
                        activeOpacity={0.7}
                      >
                        <View style={[s.actionIconBadge, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                          <Ionicons name="mail" size={20} color="#10B981" />
                        </View>
                        <Text style={s.actionRowLabel}>Send Invitation</Text>
                        <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
                      </TouchableOpacity>
                    )}

                    {room.status === 'on_process' && (
                      <TouchableOpacity
                        style={s.actionRowItem}
                        onPress={() => { onClose(); onResetToVacant?.(room); }}
                        activeOpacity={0.7}
                      >
                        <View style={[s.actionIconBadge, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
                          <Ionicons name="refresh" size={20} color="#F59E0B" />
                        </View>
                        <Text style={s.actionRowLabel}>Reset to Vacant</Text>
                        <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
                      </TouchableOpacity>
                    )}

                    <TouchableOpacity
                      style={s.actionRowItem}
                      onPress={() => { onClose(); onRegenCode?.(room); }}
                      activeOpacity={0.7}
                    >
                      <View style={[s.actionIconBadge, { backgroundColor: 'rgba(56, 189, 248, 0.15)' }]}>
                        <Ionicons name="key" size={20} color="#38BDF8" />
                      </View>
                      <Text style={s.actionRowLabel}>Regenerate Access Code</Text>
                      <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
                    </TouchableOpacity>

                    {room.status === 'archived' ? (
                      <TouchableOpacity
                        style={s.actionRowItem}
                        onPress={() => { onClose(); onRestoreRoom?.(room); }}
                        activeOpacity={0.7}
                      >
                        <View style={[s.actionIconBadge, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                          <Ionicons name="refresh" size={20} color="#10B981" />
                        </View>
                        <Text style={s.actionRowLabel}>Restore Room</Text>
                        <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity
                        style={s.actionRowItem}
                        onPress={() => { onClose(); onArchiveRoom?.(room); }}
                        activeOpacity={0.7}
                      >
                        <View style={[s.actionIconBadge, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
                          <Ionicons name="archive" size={20} color="#EF4444" />
                        </View>
                        <Text style={[s.actionRowLabel, { color: '#EF4444' }]}>Archive Room</Text>
                        <Ionicons name="chevron-forward" size={18} color="rgba(239, 68, 68, 0.6)" />
                      </TouchableOpacity>
                    )}
                  </>
                )}

                {/* Edit Room Info is always available */}
                <TouchableOpacity
                  style={s.actionRowItem}
                  onPress={() => { onClose(); onEditRoom?.(room); }}
                  activeOpacity={0.7}
                >
                  <View style={[s.actionIconBadge, { backgroundColor: 'rgba(255, 255, 255, 0.08)' }]}>
                    <Ionicons name="create-outline" size={20} color={COLORS.textPrimary} />
                  </View>
                  <Text style={s.actionRowLabel}>Edit Room Info</Text>
                  <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
                </TouchableOpacity>
              </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}
