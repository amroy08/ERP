import React from 'react';
import { StyleSheet, View } from 'react-native';
import { EmptyState } from '../EmptyState';
import { colors } from '../../constants/colors';

interface NotificationEmptyStateProps {
  roleTheme: 'teacher' | 'student' | 'parent';
}

export const NotificationEmptyState: React.FC<NotificationEmptyStateProps> = ({ roleTheme }) => {
  const themeColor =
    roleTheme === 'student' ? colors.student
    : roleTheme === 'teacher' ? colors.teacher
    : colors.parent;

  return (
    <View style={styles.container}>
      <EmptyState
        icon="notifications-off-outline"
        title="All Caught Up!"
        subtitle="You have no notifications at this time."
        accentColor={themeColor}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
});

export default NotificationEmptyState;
