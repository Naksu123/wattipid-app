import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  card: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  unreadCard: {
    backgroundColor: '#1E293B',
    borderColor: 'rgba(59, 130, 246, 0.3)', // Subtle blue glow for unread
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    color: '#E2E8F0',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  unreadTitle: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  time: {
    color: '#64748B',
    fontSize: 12,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3B82F6', // Blue dot
    marginLeft: 8,
  },
  message: {
    color: '#94A3B8',
    fontSize: 14,
    lineHeight: 20,
  },
  unreadMessage: {
    color: '#E2E8F0',
  }
});
