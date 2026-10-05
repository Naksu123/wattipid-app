import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/styles/theme';
import s from './styles';

export function BaseModal({
  visible,
  onClose,
  children,
  animationType,
  centered = false,
}) {
  const animType = animationType || (centered ? 'fade' : 'slide');

  return (
    <Modal
      visible={visible}
      transparent
      animationType={animType}
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={[s.overlay, centered && s.overlayCentered]}>
        {/* Backdrop Touch Dismiss */}
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Dismiss modal backdrop"
        />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={centered ? s.keyboardViewCentered : s.keyboardView}
          pointerEvents="box-none"
        >
          <View 
            style={centered ? s.modalContainerCentered : s.modalContainer}
          >
            {!centered && <View style={s.dragHandle} />}
            {children}
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

export function ModalHeader({ title, icon, iconColor, onClose }) {
  return (
    <View style={s.headerContainer}>
      {icon && (
        <View style={[s.headerIconWrap, { backgroundColor: iconColor ? `${iconColor}18` : `${COLORS.primary}18`, borderColor: iconColor ? `${iconColor}35` : `${COLORS.primary}35`, borderWidth: 1 }]}>
          <Ionicons name={icon} size={22} color={iconColor || COLORS.primary} />
        </View>
      )}
      <Text style={s.headerTitle} numberOfLines={1}>
        {title}
      </Text>
      {onClose && (
        <TouchableOpacity style={s.closeBtn} onPress={onClose} activeOpacity={0.7} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="close" size={18} color="#94A3B8" />
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

export { default as SignOutModal } from '../SignOutModal';
