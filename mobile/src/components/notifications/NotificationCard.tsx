import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Notification } from '../../services/notificationService';
import { colors } from '../../constants/colors';
import { spacing, radii } from '../../constants/layout';
import { typography } from '../../constants/typography';
import { shadows } from '../../constants/shadows';

interface NotificationCardProps {
  notification: Notification;
  onPress: (id: string) => void;
  roleTheme: 'teacher' | 'student' | 'parent';
}

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'HOMEWORK_POSTED':
      return { name: 'book-outline' as const, color: colors.info };
    case 'EXAM_POSTED':
      return { name: 'calendar-outline' as const, color: colors.warningDark || '#b8860b' };
    case 'MARKS_POSTED':
      return { name: 'ribbon-outline' as const, color: colors.success };
    case 'NOTICE_POSTED':
      return { name: 'megaphone-outline' as const, color: colors.primary || '#6200ee' };
    case 'FEES_OVERDUE':
    case 'FEES_REMINDER':
      return { name: 'wallet-outline' as const, color: colors.danger };
    case 'ATTENDANCE_ABSENCE_ALERT':
      return { name: 'alert-circle-outline' as const, color: colors.danger };
    default:
      return { name: 'notifications-outline' as const, color: colors.textSecondary };
  }
};

export const NotificationCard: React.FC<NotificationCardProps> = ({
  notification,
  onPress,
  roleTheme,
}) => {
  const { name: iconName, color: iconColor } = getNotificationIcon(notification.type);
  const themeColor =
    roleTheme === 'student' ? colors.student
    : roleTheme === 'teacher' ? colors.teacher
    : colors.parent;

  const formatTimestamp = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  return (
    <TouchableOpacity
      onPress={() => !notification.isRead && onPress(notification.id)}
      activeOpacity={notification.isRead ? 1 : 0.7}
      style={[
        styles.card,
        !notification.isRead && { borderColor: themeColor + '30', borderWidth: 1 },
        notification.isRead ? styles.cardRead : styles.cardUnread,
      ]}
    >
      <View style={styles.container}>
        {!notification.isRead && (
          <View style={[styles.unreadDot, { backgroundColor: themeColor }]} />
        )}

        <View style={[styles.iconContainer, { backgroundColor: iconColor + '10' }]}>
          <Ionicons name={iconName} size={22} color={iconColor} />
        </View>

        <View style={styles.textContainer}>
          <View style={styles.headerRow}>
            <Text style={styles.title} numberOfLines={1}>
              {notification.title || 'Notification'}
            </Text>
            {notification.priority === 'HIGH' || notification.priority === 'URGENT' ? (
              <View style={styles.urgentBadge}>
                <Text style={styles.urgentBadgeText}>URGENT</Text>
              </View>
            ) : null}
          </View>
          
          <Text style={styles.message}>
            {notification.message}
          </Text>

          <Text style={styles.time}>
            {formatTimestamp(notification.createdAt)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.sm,
    backgroundColor: colors.surface,
  },
  cardUnread: {
    backgroundColor: colors.surface,
  },
  cardRead: {
    backgroundColor: colors.surface,
    opacity: 0.75,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    position: 'relative',
  },
  unreadDot: {
    position: 'absolute',
    top: 0,
    left: -spacing.xs,
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: radii.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  textContainer: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xxs,
  },
  title: {
    ...typography.label,
    fontWeight: '700',
    color: colors.text,
    flex: 1,
    marginRight: spacing.sm,
  },
  urgentBadge: {
    backgroundColor: colors.dangerSoft,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: radii.xs,
  },
  urgentBadgeText: {
    color: colors.danger,
    ...typography.labelSmall,
    fontSize: 8,
    fontWeight: '800',
  },
  message: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: spacing.xs,
  },
  time: {
    ...typography.captionSmall,
    color: colors.mutedText,
  },
});

export default NotificationCard;
