import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT_SIZE, FONT_WEIGHT, RADIUS, SPACING, SHADOWS } from '../constants/theme';

export function BaseModal({
  visible,
  onClose,
  children,
  animationType = 'slide',
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType={animationType}
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={s.overlay}>
          <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={s.keyboardView}
            >
              <View style={s.modalContainer}>
                <View style={s.dragHandle} />
                {children}
              </View>
            </KeyboardAvoidingView>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

export function ModalHeader({ title, icon, iconColor, onClose }) {
  return (
    <View style={s.headerContainer}>
      {icon && (
        <View style={[s.headerIconWrap, { backgroundColor: iconColor ? `${iconColor}15` : `${COLORS.primary}15` }]}>
          <Ionicons name={icon} size={24} color={iconColor || COLORS.primary} />
        </View>
      )}
      <Text style={s.headerTitle} numberOfLines={1}>
        {title}
      </Text>
      {onClose && (
        <TouchableOpacity style={s.closeBtn} onPress={onClose} activeOpacity={0.7} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="close" size={24} color={COLORS.textSecondary} />
        </TouchableOpacity>
      )}
    </View>
  );
}

export function ModalBody({ children, scrollable = true }) {
  if (scrollable) {
    return (
      <ScrollView
        style={s.bodyScroll}
        contentContainerStyle={s.bodyScrollContent}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    );
  }
  return <View style={s.bodyView}>{children}</View>;
}

export function ModalFooter({
  primaryLabel,
  onPrimaryPress,
  primaryDisabled = false,
  primaryLoading = false,
  primaryDanger = false,
  secondaryLabel,
  onSecondaryPress,
  stacked = false, // If true, buttons are stacked vertically instead of horizontally
}) {
  const primaryBgColor = primaryDanger ? COLORS.danger : COLORS.primary;

  return (
    <View style={[s.footerContainer, stacked && s.footerStacked]}>
      {secondaryLabel && (
        <TouchableOpacity
          style={[s.footerBtn, s.secondaryBtn, stacked && s.stackedBtn]}
          onPress={onSecondaryPress}
          activeOpacity={0.7}
        >
          <Text style={s.secondaryBtnText}>{secondaryLabel}</Text>
        </TouchableOpacity>
      )}
      {primaryLabel && (
        <TouchableOpacity
          style={[s.footerBtn, s.primaryBtn, { backgroundColor: primaryBgColor }, (primaryDisabled || primaryLoading) && s.disabledBtn, stacked && s.stackedBtn]}
          onPress={onPrimaryPress}
          disabled={primaryDisabled || primaryLoading}
          activeOpacity={0.8}
        >
          {primaryLoading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={s.primaryBtnText}>{primaryLabel}</Text>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'flex-end', // Bottom sheet style
  },
  keyboardView: {
    width: '100%',
    maxHeight: '90%', // 90% of screen height
  },
  modalContainer: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: SPACING.lg,
    paddingBottom: Platform.OS === 'ios' ? 34 : SPACING.lg, // Safe area padding
    width: '100%',
    ...SHADOWS.lg,
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  headerIconWrap: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  headerTitle: {
    flex: 1,
    fontSize: FONT_SIZE.xl,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
  },
  closeBtn: {
    padding: SPACING.xs,
  },
  bodyScroll: {
    maxHeight: 500, // Reasonable max height before scrolling
  },
  bodyScrollContent: {
    paddingBottom: SPACING.lg,
  },
  bodyView: {
    paddingBottom: SPACING.lg,
  },
  footerContainer: {
    flexDirection: 'row',
    gap: SPACING.sm,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  footerStacked: {
    flexDirection: 'column-reverse', // Secondary below primary
    gap: SPACING.md,
  },
  footerBtn: {
    flex: 1,
    height: 48, // Touch-friendly height
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  stackedBtn: {
    width: '100%',
  },
  primaryBtn: {
    backgroundColor: COLORS.primary,
  },
  primaryBtnText: {
    fontSize: FONT_SIZE.md,
    color: '#fff',
    fontWeight: FONT_WEIGHT.semibold,
  },
  secondaryBtn: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  secondaryBtnText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
    fontWeight: FONT_WEIGHT.medium,
  },
  disabledBtn: {
    opacity: 0.6,
  },
});
