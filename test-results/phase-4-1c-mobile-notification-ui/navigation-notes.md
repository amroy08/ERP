# Navigation Integration Notes: Mobile Stack Route

This document outlines the routing mechanism for mobile notifications.

## Stack Registration (`mobile/src/navigation/RootNavigator.tsx`)

To make notifications accessible globally to all roles without duplicating screens or logic inside individual tabs, `Notifications` was registered directly under the Root Native Stack Navigator:

```typescript
const Stack = createNativeStackNavigator();

export const RootNavigator: React.FC = () => {
  const { isAuthenticated, role, isLoading } = useAuth();
  
  // ... loading check ...

  const Component = getNavigatorComponent();

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainFlow" component={Component} />
      <Stack.Screen name="Notifications" component={NotificationListScreen} />
    </Stack.Navigator>
  );
};
```

## Router Mechanics

1. **Global Accessibility**:
   - Because `Notifications` is registered at the root, any screen nested inside the `MainFlow` (e.g. nested tab screens under `TeacherNavigator`, `StudentNavigator`, or `ParentNavigator`) can execute `navigation.navigate('Notifications')` without knowing which role tab structure they are currently in.
2. **Back Button Safety**:
   - Native navigation stack management ensures that when the user presses back (via the navigation header's `onBack` callback executing `navigation.goBack()`), the stack pops correct and redirects the user back to the exact screen they came from (e.g. Teacher Home, Student Home, or Parent Home).
3. **Transition Animation**:
   - Leverages standard OS-native transition animations for stack screens, providing a premium, fluid page movement effect.
