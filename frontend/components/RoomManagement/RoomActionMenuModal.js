import React, { useRef } from 'react';
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
  const lastRoomRef = useRef(room);
  if (room) {
    lastRoomRef.current = room;
  }
  const displayRoom = room || lastRoomRef.current;

  if (!visible && !displayRoom) return null;

  const isOccupied = displayRoom?.status === 'occupied';
  const subtitle = isOccupied
    ? (displayRoom?.tenant_name || 'Active Tenant')
    : (displayRoom?.status || 'Vacant').replace('_', ' ').toUpperCase();

  const handleAction = (callback) => {
    if (!displayRoom) return;
    const targetRoom = displayRoom;
    onClose?.();
    callback?.(targetRoom);
  };

  return (
    <Modal
      visible={Boolean(visible && displayRoom)}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={s.bottomSheetOverlay}>
          <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
            <View style={s.bottomSheetContainer}>
              {/* Compact Header */}
              <View style={s.menuHeaderRow}>
                <View style={s.menuHeaderTitleWrap}>
                  <Text style={s.menuHeaderTitle} numberOfLines={1}>
                    Manage {displayRoom?.room_id}
                  </Text>
                  <Text 
                    style={[
                      s.menuHeaderSubtitle, 
                      !isOccupied && { color: '#94A3B8' }
                    ]} 
                    numberOfLines={1}
                  >
                    {subtitle}
                  </Text>
                </View>
                <TouchableOpacity
                  style={s.menuCloseBtn}
                  onPress={onClose}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  accessibilityRole="button"
                  accessibilityLabel="Close Menu"
                >
                  <Ionicons name="close" size={16} color="#94A3B8" />
                </TouchableOpacity>
              </View>

              <View style={s.menuDivider} />

              {/* Action List (Compact SaaS Rows) */}
              <ScrollView 
                style={s.menuScrollList} 
                contentContainerStyle={{ paddingBottom: 2 }}
                showsVerticalScrollIndicator={false}
                bounces={false}
              >
                {isOccupied ? (
                  <>
                    <TouchableOpacity
                      style={s.actionRowItem}
                      onPress={() => handleAction(onGenerateReport)}
                      activeOpacity={0.7}
                    >
                      <View style={[s.actionIconBadge, { backgroundColor: 'rgba(59, 130, 246, 0.12)' }]}>
                        <Ionicons name="document-text" size={17} color="#3B82F6" />
                      </View>
                      <Text style={s.actionRowLabel}>Generate Report</Text>
                      <Ionicons name="chevron-forward" size={16} color="#64748B" />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={s.actionRowItem}
                      onPress={() => handleAction(onViewHistory)}
                      activeOpacity={0.7}
                    >
                      <View style={[s.actionIconBadge, { backgroundColor: 'rgba(16, 185, 129, 0.12)' }]}>
                        <Ionicons name="time" size={17} color="#10B981" />
                      </View>
                      <Text style={s.actionRowLabel}>View History</Text>
                      <Ionicons name="chevron-forward" size={16} color="#64748B" />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={s.actionRowItem}
                      onPress={() => handleAction(onLogCashPayment)}
                      activeOpacity={0.7}
                    >
                      <View style={[s.actionIconBadge, { backgroundColor: 'rgba(245, 158, 11, 0.12)' }]}>
                        <Ionicons name="card" size={17} color="#F59E0B" />
                      </View>
                      <Text style={s.actionRowLabel}>Log Cash Payment</Text>
                      <Ionicons name="chevron-forward" size={16} color="#64748B" />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={s.actionRowItem}
                      onPress={() => handleAction(onTransferTenant)}
                      activeOpacity={0.7}
                    >
                      <View style={[s.actionIconBadge, { backgroundColor: 'rgba(20, 184, 166, 0.12)' }]}>
                        <Ionicons name="swap-horizontal" size={17} color="#14B8A6" />
                      </View>
                      <Text style={s.actionRowLabel}>Transfer Tenant</Text>
                      <Ionicons name="chevron-forward" size={16} color="#64748B" />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={s.actionRowItem}
                      onPress={() => handleAction(onRemoveTenant)}
                      activeOpacity={0.7}
                    >
                      <View style={[s.actionIconBadge, { backgroundColor: 'rgba(239, 68, 68, 0.12)' }]}>
                        <Ionicons name="log-out" size={17} color="#EF4444" />
                      </View>
                      <Text style={[s.actionRowLabel, { color: '#EF4444' }]}>Remove Tenant</Text>
                      <Ionicons name="chevron-forward" size={16} color="rgba(239, 68, 68, 0.5)" />
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    {(displayRoom?.status === 'vacant' || displayRoom?.status === 'on_process') && (
                      <TouchableOpacity
                        style={s.actionRowItem}
                        onPress={() => handleAction(onSendInvitation)}
                        activeOpacity={0.7}
                      >
                        <View style={[s.actionIconBadge, { backgroundColor: 'rgba(16, 185, 129, 0.12)' }]}>
                          <Ionicons name="mail" size={17} color="#10B981" />
                        </View>
                        <Text style={s.actionRowLabel}>Send Invitation</Text>
                        <Ionicons name="chevron-forward" size={16} color="#64748B" />
                      </TouchableOpacity>
                    )}

                    {displayRoom?.status === 'on_process' && (
                      <TouchableOpacity
                        style={s.actionRowItem}
                        onPress={() => handleAction(onResetToVacant)}
                        activeOpacity={0.7}
                      >
                        <View style={[s.actionIconBadge, { backgroundColor: 'rgba(245, 158, 11, 0.12)' }]}>
                          <Ionicons name="refresh" size={17} color="#F59E0B" />
                        </View>
                        <Text style={s.actionRowLabel}>Reset to Vacant</Text>
                        <Ionicons name="chevron-forward" size={16} color="#64748B" />
                      </TouchableOpacity>
                    )}

                    <TouchableOpacity
                      style={s.actionRowItem}
                      onPress={() => handleAction(onRegenCode)}
                      activeOpacity={0.7}
                    >
                      <View style={[s.actionIconBadge, { backgroundColor: 'rgba(56, 189, 248, 0.12)' }]}>
                        <Ionicons name="key" size={17} color="#38BDF8" />
                      </View>
                      <Text style={s.actionRowLabel}>Regenerate Access Code</Text>
                      <Ionicons name="chevron-forward" size={16} color="#64748B" />
                    </TouchableOpacity>

                    {displayRoom?.status === 'archived' ? (
                      <TouchableOpacity
                        style={s.actionRowItem}
                        onPress={() => handleAction(onRestoreRoom)}
                        activeOpacity={0.7}
                      >
                        <View style={[s.actionIconBadge, { backgroundColor: 'rgba(16, 185, 129, 0.12)' }]}>
                          <Ionicons name="refresh" size={17} color="#10B981" />
                        </View>
                        <Text style={s.actionRowLabel}>Restore Room</Text>
                        <Ionicons name="chevron-forward" size={16} color="#64748B" />
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity
                        style={s.actionRowItem}
                        onPress={() => handleAction(onArchiveRoom)}
                        activeOpacity={0.7}
                      >
                        <View style={[s.actionIconBadge, { backgroundColor: 'rgba(239, 68, 68, 0.12)' }]}>
                          <Ionicons name="archive" size={17} color="#EF4444" />
                        </View>
                        <Text style={[s.actionRowLabel, { color: '#EF4444' }]}>Archive Room</Text>
                        <Ionicons name="chevron-forward" size={16} color="rgba(239, 68, 68, 0.5)" />
                      </TouchableOpacity>
                    )}
                  </>
                )}

                {/* Edit Room Info is always available */}
                <TouchableOpacity
                  style={[s.actionRowItem, { borderBottomWidth: 0 }]}
                  onPress={() => handleAction(onEditRoom)}
                  activeOpacity={0.7}
                >
                  <View style={[s.actionIconBadge, { backgroundColor: 'rgba(255, 255, 255, 0.06)' }]}>
                    <Ionicons name="create-outline" size={17} color="#94A3B8" />
                  </View>
                  <Text style={s.actionRowLabel}>Edit Room Info</Text>
                  <Ionicons name="chevron-forward" size={16} color="#64748B" />
                </TouchableOpacity>
              </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

