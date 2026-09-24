import { StyleSheet, Platform } from 'react-native';
import { FONT_SIZE, FONT_WEIGHT } from '../../theme';

export default StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 99999,
    alignItems: 'center',
    pointerEvents: 'box-none',
  },
  touchable: {
    maxWidth: 420,
    width: 'auto',
    alignSelf: 'center',
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    // Minimal diffuse shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 12,
    elevation: 4,
  },
  blurContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    paddingHorizontal: 13,
    borderRadius: 20,
    backgroundColor: Platform.OS === 'android' ? 'rgba(15, 23, 42, 0.88)' : 'rgba(15, 23, 42, 0.72)',
  },
  iconBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    flexShrink: 0,
  },
  message: {
    color: '#F9FAFB',
    fontSize: FONT_SIZE.xs ? FONT_SIZE.xs + 1.5 : 13.5,
    fontWeight: FONT_WEIGHT.medium || '500',
    letterSpacing: 0.15,
    lineHeight: 18,
    flexShrink: 1,
  },
  closeButton: {
    marginLeft: 10,
    padding: 3,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
});
