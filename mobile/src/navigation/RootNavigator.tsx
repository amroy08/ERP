import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../store/AuthContext';
import { colors } from '../constants/colors';

// Navigators
import AuthNavigator from './AuthNavigator';
import ParentNavigator from './ParentNavigator';
import StudentNavigator from './StudentNavigator';
import TeacherNavigator from './TeacherNavigator';

const Stack = createNativeStackNavigator();

export const RootNavigator: React.FC = () => {
  const { isAuthenticated, role, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.border} />
      </View>
    );
  }

  const getNavigatorComponent = () => {
    if (!isAuthenticated) {
      return AuthNavigator;
    }
    switch (role) {
      case 'parent':
        return ParentNavigator;
      case 'student':
        return StudentNavigator;
      case 'teacher':
        return TeacherNavigator;
      default:
        return AuthNavigator;
    }
  };

  const Component = getNavigatorComponent();

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainFlow" component={Component} />
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
export default RootNavigator;
