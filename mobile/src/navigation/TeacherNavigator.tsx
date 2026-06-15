import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import { colors } from '../constants/colors';
import TeacherHomeScreen from '../screens/teacher/TeacherHomeScreen';
import TeacherTimetableScreen from '../screens/teacher/TeacherTimetableScreen';
import TeacherAttendanceScreen from '../screens/teacher/TeacherAttendanceScreen';
import TeacherHomeworkScreen from '../screens/teacher/TeacherHomeworkScreen';
import TeacherNoticesScreen from '../screens/teacher/TeacherNoticesScreen';

const Tab = createBottomTabNavigator();

const tabBarIcon = (emoji: string, focused: boolean) => (
  <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.5 }}>{emoji}</Text>
);

export const TeacherNavigator: React.FC = () => (
  <Tab.Navigator
    screenOptions={{
      headerShown: false,
      tabBarStyle: {
        backgroundColor: colors.surface,
        borderTopColor: colors.border,
        borderTopWidth: 1,
        paddingBottom: 8,
        paddingTop: 6,
        height: 64,
      },
      tabBarActiveTintColor: colors.teacher,
      tabBarInactiveTintColor: colors.mutedText,
      tabBarLabelStyle: { fontSize: 11, fontWeight: '700', marginTop: 2 },
    }}
  >
    <Tab.Screen
      name="TeacherHome"
      component={TeacherHomeScreen}
      options={{
        tabBarLabel: 'Home',
        tabBarIcon: ({ focused }) => tabBarIcon('🏠', focused),
      }}
    />
    <Tab.Screen
      name="TeacherTimetable"
      component={TeacherTimetableScreen}
      options={{
        tabBarLabel: 'Timetable',
        tabBarIcon: ({ focused }) => tabBarIcon('🗓', focused),
      }}
    />
    <Tab.Screen
      name="TeacherAttendance"
      component={TeacherAttendanceScreen}
      options={{
        tabBarLabel: 'Attendance',
        tabBarIcon: ({ focused }) => tabBarIcon('✅', focused),
      }}
    />
    <Tab.Screen
      name="TeacherHomework"
      component={TeacherHomeworkScreen}
      options={{
        tabBarLabel: 'Homework',
        tabBarIcon: ({ focused }) => tabBarIcon('📚', focused),
      }}
    />
    <Tab.Screen
      name="TeacherNotices"
      component={TeacherNoticesScreen}
      options={{
        tabBarLabel: 'Notices',
        tabBarIcon: ({ focused }) => tabBarIcon('📢', focused),
      }}
    />
  </Tab.Navigator>
);


export default TeacherNavigator;
