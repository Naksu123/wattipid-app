import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/styles/theme';

export default function ArchiveModal({ 
  visible, 
  onClose, 
  onConfirm, 
  roomName, 
  isLoading, 
  isRestore = false 
}) {
  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          
          <View style={[styles.iconContainer, isRestore ? styles.iconRestore : styles.iconArchive]}>
            <Ionicons 
              name={isRestore ? "refresh-outline" : "archive-outline"} 
              size={32} 
              color={isRestore ? COLORS.primary : COLORS.danger} 
            />
          </View>
          
          <Text style={styles.title}>
            {isRestore ? "Restore Room" : "Archive Room"}
          </Text>
          
          <Text style={styles.message}>
            {isRestore 
              ? `Are you sure you want to restore ${roomName || 'this room'} to the active listings?` 
              : `Archiving ${roomName || 'this room'} will remove it from active listings while preserving historical tenant, billing, and payment records.`}
          </Text>

          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[styles.button, styles.cancelButton]} 
              onPress={onClose}
              disabled={isLoading}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.button, 
                isRestore ? styles.restoreButton : styles.archiveButton
              ]} 
              onPress={onConfirm}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color={COLORS.white} size="small" />
              ) : (
                <Text style={styles.confirmButtonText}>
                  {isRestore ? "Restore" : "Archive"}
                </Text>
              )}
            </TouchableOpacity>
          </View>

        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '85%',
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconArchive: {
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
  },
  iconRestore: {
    backgroundColor: 'rgba(46, 204, 113, 0.1)',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  button: {
    flex: 1,
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: COLORS.surfaceLight,
    marginRight: 8,
  },
  archiveButton: {
    backgroundColor: COLORS.danger,
    marginLeft: 8,
  },
  restoreButton: {
    backgroundColor: COLORS.primary,
    marginLeft: 8,
  },
  cancelButtonText: {
    color: COLORS.textPrimary,
    fontWeight: '600',
    fontSize: 16,
  },
  confirmButtonText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 16,
  },
});
