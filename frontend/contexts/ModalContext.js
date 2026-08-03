import React, { createContext, useContext, useState, useRef, useCallback } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/styles/theme';

const ModalContext = createContext();

export function useModal() {
  return useContext(ModalContext);
}

export function ModalProvider({ children }) {
  const [modalState, setModalState] = useState({
    visible: false,
    type: 'info', // 'success', 'error', 'warning', 'info', 'confirm'
    title: '',
    message: '',
    primaryButtonText: 'OK',
    onPrimaryPress: null,
    secondaryButtonText: null,
    onSecondaryPress: null,
  });

  const scaleValue = useRef(new Animated.Value(0.8)).current;
  const opacityValue = useRef(new Animated.Value(0)).current;

  const showModal = useCallback((options) => {
    setModalState({
      visible: true,
      type: options.type || 'info',
      title: options.title || '',
      message: options.message || '',
      primaryButtonText: options.primaryButtonText || 'OK',
      onPrimaryPress: options.onPrimaryPress || null,
      secondaryButtonText: options.secondaryButtonText || null,
      onSecondaryPress: options.onSecondaryPress || null,
    });

    Animated.parallel([
      Animated.timing(opacityValue, { toValue: 1, duration: 250, useNativeDriver: true }),
      Animated.spring(scaleValue, { toValue: 1, friction: 7, tension: 40, useNativeDriver: true })
    ]).start();
  }, [opacityValue, scaleValue]);

  const hideModal = useCallback(() => {
    Animated.parallel([
      Animated.timing(opacityValue, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(scaleValue, { toValue: 0.9, duration: 200, useNativeDriver: true })
    ]).start(() => {
      setModalState(prev => ({ ...prev, visible: false }));
    });
  }, [opacityValue, scaleValue]);

  const handlePrimaryPress = () => {
    if (modalState.onPrimaryPress) {
      modalState.onPrimaryPress();
    }
    hideModal();
  };

  const handleSecondaryPress = () => {
    if (modalState.onSecondaryPress) {
      modalState.onSecondaryPress();
    }
    hideModal();
  };

  const getIcon = () => {
    switch (modalState.type) {
      case 'success': return { name: 'checkmark-circle-outline', color: COLORS.success, bg: 'rgba(34, 197, 94, 0.15)' };
      case 'error': return { name: 'error-outline', color: COLORS.danger, bg: 'rgba(239, 68, 68, 0.15)' };
      case 'warning': return { name: 'warning-outline', color: COLORS.warning, bg: 'rgba(245, 158, 11, 0.15)' };
      case 'confirm': return { name: 'help-circle-outline', color: COLORS.primary, bg: 'rgba(37, 99, 235, 0.15)' };
      case 'info':
      default: return { name: 'information-circle-outline', color: COLORS.info, bg: 'rgba(59, 130, 246, 0.15)' };
    }
  };

  const iconConfig = getIcon();

  return (
    <ModalContext.Provider value={{ showModal, hideModal }}>
      {children}
      <Modal visible={modalState.visible} transparent animationType="none" onRequestClose={hideModal}>
        <View style={styles.overlay}>
          <Animated.View style={[styles.card, { opacity: opacityValue, transform: [{ scale: scaleValue }] }]}>
            <View style={[styles.iconWrap, { backgroundColor: iconConfig.bg }]}>
              <Ionicons name={iconConfig.name} size={42} color={iconConfig.color} />
            </View>
            <Text style={styles.title}>{modalState.title}</Text>
            {modalState.message ? <Text style={styles.message}>{modalState.message}</Text> : null}
            
            <TouchableOpacity 
              onPress={handlePrimaryPress} 
              style={[styles.primaryBtn, modalState.type === 'error' && { backgroundColor: COLORS.danger }]} 
              activeOpacity={0.8}
            >
              <Text style={styles.primaryBtnText}>{modalState.primaryButtonText}</Text>
            </TouchableOpacity>

            {modalState.secondaryButtonText && (
              <TouchableOpacity onPress={handleSecondaryPress} style={styles.secondaryBtn} activeOpacity={0.7}>
                <Text style={styles.secondaryBtnText}>{modalState.secondaryButtonText}</Text>
              </TouchableOpacity>
            )}
          </Animated.View>
        </View>
      </Modal>
    </ModalContext.Provider>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(17, 24, 39, 0.8)', // #111827
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: '#1F2937',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#374151',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    color: '#D1D5DB',
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 28,
  },
  primaryBtn: {
    backgroundColor: '#22C55E', // App Green default, overridden if error
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryBtn: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#374151',
    backgroundColor: 'transparent',
  },
  secondaryBtnText: {
    color: '#D1D5DB',
    fontSize: 16,
    fontWeight: '600',
  }
});
