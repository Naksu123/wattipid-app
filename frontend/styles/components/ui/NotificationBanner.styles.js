import { StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

export default StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
    alignItems: 'center',
  },
  banner: {
    width: width - 32,
    backgroundColor: '#202124',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  appIconWrapper: {
    width: 18,
    height: 18,
    borderRadius: 4,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  appName: {
    color: '#D1D5DB',
    fontSize: 12,
    fontWeight: '400',
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#6B7280',
    marginHorizontal: 6,
  },
  timestamp: {
    color: '#9CA3AF',
    fontSize: 12,
  },
  body: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  typeIconContainer: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    marginTop: 0,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    color: '#F9FAFB',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
    letterSpacing: 0.2,
  },
  message: {
    color: '#9CA3AF',
    fontSize: 14,
    lineHeight: 20,
  },
});
