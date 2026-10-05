import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../styles/theme';
import s from '../../styles/landlord/rooms.styles';

const ROOM_TYPES = ['Standard', 'Studio Unit', 'Deluxe Studio', 'Shared Room'];
const STATUS_OPTIONS = [
  { key: 'vacant', label: 'Available' },
  { key: 'occupied', label: 'Occupied' },
  { key: 'under_maintenance', label: 'Maintenance' },
  { key: 'not_available', label: 'Unavailable' },
];

export default function RoomFormModal({
  visible,
  isEditMode,
  initialData,
  defaultUtilityRate = 12.50,
  onClose,
  onSubmit,
  loading = false,
}) {
  const [formData, setFormData] = useState({
    room_id: '',
    room_name: '',
    room_type: 'Standard',
    monthly_rent: '',
    utility_rate: '',
    description: '',
    max_occupancy: '1',
    status: 'vacant',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (visible) {
      if (isEditMode && initialData) {
        setFormData({
          room_id: initialData.room_id || '',
          room_name: initialData.room_name || '',
          room_type: initialData.room_type || 'Standard',
          monthly_rent: initialData.monthly_rent ? String(initialData.monthly_rent) : '',
          utility_rate: initialData.utility_rate && parseFloat(initialData.utility_rate) > 0 ? String(initialData.utility_rate) : '',
          description: initialData.description || '',
          max_occupancy: initialData.max_occupancy ? String(initialData.max_occupancy) : '1',
          status: initialData.status || 'vacant',
        });
      } else {
        setFormData({
          room_id: '',
          room_name: '',
          room_type: 'Standard',
          monthly_rent: '',
          utility_rate: '',
          description: '',
          max_occupancy: '1',
          status: 'vacant',
        });
      }
      setErrors({});
    }
  }, [visible, isEditMode, initialData]);

  const validate = () => {
    const errs = {};
    if (!formData.room_id.trim()) {
      errs.room_id = 'Room number is required';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    onSubmit?.({
      ...formData,
      room_id: formData.room_id.trim(),
      monthly_rent: parseFloat(formData.monthly_rent || 0),
      utility_rate: parseFloat(formData.utility_rate || 0),
      max_occupancy: parseInt(formData.max_occupancy || 1, 10),
    });
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={s.centerModalOverlay}>
            <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
              <View style={[s.saasModalCard, { maxWidth: 360 }]}>
                {/* Header */}
                <View style={s.saasModalHeaderRow}>
                  <View style={s.saasModalHeaderLeft}>
                    <View style={[s.saasModalIconBadge, { backgroundColor: isEditMode ? 'rgba(56, 189, 248, 0.12)' : 'rgba(16, 185, 129, 0.12)' }]}>
                      <Ionicons name={isEditMode ? 'create-outline' : 'add-circle-outline'} size={17} color={isEditMode ? '#38BDF8' : '#10B981'} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.saasModalTitle} numberOfLines={1}>
                        {isEditMode ? 'Edit Room Info' : 'Add New Room'}
                      </Text>
                      <Text style={[s.saasModalSubtitle, isEditMode && { color: '#38BDF8' }]} numberOfLines={1}>
                        {isEditMode && initialData?.room_id ? `Room ${initialData.room_id}` : 'Configure unit parameters'}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={s.saasModalCloseBtn}
                    onPress={onClose}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    accessibilityRole="button"
                    accessibilityLabel="Close Form"
                  >
                    <Ionicons name="close" size={16} color="#94A3B8" />
                  </TouchableOpacity>
                </View>

                <View style={s.saasModalDivider} />

                {/* Form Fields */}
                <ScrollView
                  style={s.formScrollView}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={{ paddingBottom: 10 }}
                  keyboardShouldPersistTaps="handled"
                >
                  {/* Room Name / Number */}
                  <Text style={s.formFieldLabel}>
                    ROOM NUMBER <Text style={{ color: COLORS.danger }}>*</Text>
                  </Text>
                  <View style={[s.formInputBox, errors.room_id && s.formInputBoxError, isEditMode && { opacity: 0.75 }]}>
                    <Ionicons name="home-outline" size={15} color={COLORS.textMuted} style={{ marginRight: 8 }} />
                    <TextInput
                      style={s.formTextInput}
                      placeholder="e.g. Room 101"
                      placeholderTextColor={COLORS.textMuted}
                      value={formData.room_id}
                      onChangeText={(val) => {
                        setFormData((prev) => ({ ...prev, room_id: val }));
                        if (errors.room_id) setErrors((prev) => ({ ...prev, room_id: null }));
                      }}
                      editable={!isEditMode}
                    />
                    {isEditMode && (
                      <Ionicons name="lock-closed-outline" size={14} color="#64748B" />
                    )}
                  </View>
                  {errors.room_id && <Text style={s.formErrorText}>{errors.room_id}</Text>}

                  {/* Room Type */}
                  <Text style={[s.formFieldLabel, { marginTop: 10 }]}>ROOM TYPE</Text>
                  <View style={s.typeChipsRow}>
                    {ROOM_TYPES.map((type) => {
                      const isSelected = formData.room_type === type;
                      return (
                        <TouchableOpacity
                          key={type}
                          style={[s.typeChipItem, isSelected && s.typeChipItemActive]}
                          onPress={() => setFormData((prev) => ({ ...prev, room_type: type }))}
                          activeOpacity={0.7}
                        >
                          <Text style={[s.typeChipText, isSelected && s.typeChipTextActive]}>
                            {type}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {/* Base Monthly Rent */}
                  <Text style={[s.formFieldLabel, { marginTop: 10 }]}>BASE MONTHLY RENT (₱)</Text>
                  <View style={s.formInputBox}>
                    <Text style={s.currencyPrefix}>₱</Text>
                    <TextInput
                      style={s.formTextInput}
                      placeholder="0.00"
                      placeholderTextColor={COLORS.textMuted}
                      value={formData.monthly_rent}
                      onChangeText={(val) => setFormData((prev) => ({ ...prev, monthly_rent: val }))}
                      keyboardType="numeric"
                    />
                  </View>

                  {/* Custom Utility Rate */}
                  <Text style={[s.formFieldLabel, { marginTop: 10 }]}>CUSTOM UTILITY RATE (₱/kWh)</Text>
                  <View style={s.formInputBox}>
                    <Text style={s.currencyPrefix}>₱</Text>
                    <TextInput
                      style={s.formTextInput}
                      placeholder={`Default rate: ₱${defaultUtilityRate.toFixed(2)}`}
                      placeholderTextColor={COLORS.textMuted}
                      value={formData.utility_rate}
                      onChangeText={(val) => setFormData((prev) => ({ ...prev, utility_rate: val }))}
                      keyboardType="numeric"
                    />
                  </View>

                  {/* Max Occupancy */}
                  <Text style={[s.formFieldLabel, { marginTop: 10 }]}>MAX OCCUPANCY</Text>
                  <View style={s.formInputBox}>
                    <Ionicons name="people-outline" size={15} color={COLORS.textMuted} style={{ marginRight: 8 }} />
                    <TextInput
                      style={s.formTextInput}
                      placeholder="1"
                      placeholderTextColor={COLORS.textMuted}
                      value={formData.max_occupancy}
                      onChangeText={(val) => setFormData((prev) => ({ ...prev, max_occupancy: val }))}
                      keyboardType="number-pad"
                    />
                  </View>

                  {/* Description */}
                  <Text style={[s.formFieldLabel, { marginTop: 10 }]}>DESCRIPTION (OPTIONAL)</Text>
                  <View style={[s.formInputBox, { height: 64, alignItems: 'flex-start', paddingTop: 8 }]}>
                    <TextInput
                      style={[s.formTextInput, { height: '100%', textAlignVertical: 'top' }]}
                      placeholder="Enter room details or features..."
                      placeholderTextColor={COLORS.textMuted}
                      value={formData.description}
                      onChangeText={(val) => setFormData((prev) => ({ ...prev, description: val }))}
                      multiline
                      numberOfLines={2}
                    />
                  </View>

                  {/* Status Selection (Edit Mode) */}
                  {isEditMode && (
                    <>
                      <Text style={[s.formFieldLabel, { marginTop: 10 }]}>ROOM STATUS</Text>
                      <View style={s.statusChipsWrap}>
                        {STATUS_OPTIONS.map((opt) => {
                          const isSelected = formData.status === opt.key;
                          return (
                            <TouchableOpacity
                              key={opt.key}
                              style={[s.statusChipBtn, isSelected && s.statusChipBtnActive]}
                              onPress={() => setFormData((prev) => ({ ...prev, status: opt.key }))}
                              activeOpacity={0.7}
                            >
                              <Text style={[s.statusChipBtnText, isSelected && s.statusChipBtnTextActive]}>
                                {opt.label}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </>
                  )}
                </ScrollView>

                {/* Footer Buttons */}
                <View style={s.saasActionRow}>
                  <TouchableOpacity
                    style={s.saasBtnSecondary}
                    onPress={onClose}
                    disabled={loading}
                    activeOpacity={0.75}
                  >
                    <Text style={s.saasBtnSecondaryText}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[s.saasBtnPrimary, { backgroundColor: isEditMode ? '#38BDF8' : '#10B981' }, loading && { opacity: 0.7 }]}
                    onPress={handleSave}
                    disabled={loading}
                    activeOpacity={0.8}
                  >
                    {loading ? (
                      <ActivityIndicator color={isEditMode ? '#082F49' : '#042F2E'} size="small" />
                    ) : (
                      <>
                        <Ionicons name="checkmark-circle-outline" size={16} color={isEditMode ? '#082F49' : '#042F2E'} />
                        <Text style={[s.saasBtnPrimaryText, { color: isEditMode ? '#082F49' : '#042F2E' }]}>
                          {isEditMode ? 'Save Changes' : 'Save Room'}
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Modal>
  );
}
