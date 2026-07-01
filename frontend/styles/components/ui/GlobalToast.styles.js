import { StyleSheet } from 'react-native';
import { COLORS, FONT_SIZE } from '../../theme';

export default StyleSheet.create({
  container: {
    position: 'absolute',
    left: 20,
    right: 20,
    zIndex: 9999,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
  message: {
    color: COLORS.white,
    fontSize: FONT_SIZE.sm,
    fontWeight: '500',
    marginLeft: 8,
    flex: 1,
  }
});
