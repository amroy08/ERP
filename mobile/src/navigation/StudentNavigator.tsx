import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import { colors } from '../constants/colors';
import StudentHomeScreen from '../screens/student/StudentHomeScreen';
import StudentTimetableScreen from '../screens/student/StudentTimetableScreen';
import StudentHomeworkScreen from '../screens/student/StudentHomeworkScreen';
import StudentExamsScreen from '../screens/student/StudentExamsScreen';

const Tab = createBottomTabNavigator();

const tabBarIcon = (emoji: string, focused: boolean) => (
  <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.5 }}>{emoji}</Text>
);

export const StudentNavigator: React.FC = () => (
  <Tab.Navigator
    screenOptions={{
      headerShown: false,
      tabBarStyle: {
        backgroundColor: colors.surface,
        borderTopColor: colors.borderSoft,
        borderTopWidth: 1,
        paddingBottom: 8,
        paddingTop: 6,
        height: 64,
      },
      tabBarActiveTintColor: colors.student,
      tabBarInactiveTintColor: colors.mutedText,
      tabBarLabelStyle: { fontSize: 11, fontWeight: '700', marginTop: 2 },
    }}
  >
    <Tab.Screen
      name="StudentHome"
      component={StudentHomeScreen}
      options={{
        tabBarLabel: 'Home',
        tabBarIcon: ({ focused }) => tabBarIcon('🏠', focused),
      }}
    />
    <Tab.Screen
      name="StudentTimetable"
      component={StudentTimetableScreen}
      options={{
        tabBarLabel: 'Timetable',
        tabBarIcon: ({ focused }) => tabBarIcon('🗓', focused),
      }}
    />
    <Tab.Screen
      name="StudentHomework"
      component={StudentHomeworkScreen}
      options={{
        tabBarLabel: 'Homework',
        tabBarIcon: ({ focused }) => tabBarIcon('📚', focused),
      }}
    />
    <Tab.Screen
      name="StudentExams"
      component={StudentExamsScreen}
      options={{
        tabBarLabel: 'Exams',
        tabBarIcon: ({ focused }) => tabBarIcon('📝', focused),
      }}
    />
  </Tab.Navigator>
);

export default StudentNavigator;
