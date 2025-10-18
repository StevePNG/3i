import { NavigationContainer } from '@react-navigation/native';
import {
  createNativeStackNavigator,
  NativeStackNavigationProp
} from '@react-navigation/native-stack';
import HomeScreen from '../screens/HomeScreen';
import PlanningScreen from '../screens/PlanningScreen';
import RouteB8Screen from '../screens/RouteB8Screen';

export type AppStackParamList = {
  Home: undefined;
  Planning: undefined;
  RouteB8: undefined;
};

export type AppNavigationProp<T extends keyof AppStackParamList> =
  NativeStackNavigationProp<AppStackParamList, T>;

const Stack = createNativeStackNavigator<AppStackParamList>();

const AppNavigator = () => (
  <NavigationContainer>
    <Stack.Navigator
      initialRouteName="Home"
      screenOptions={{ headerShown: false, animation: 'fade_from_bottom' }}
    >
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="Planning" component={PlanningScreen} />
      <Stack.Screen name="RouteB8" component={RouteB8Screen} />
    </Stack.Navigator>
  </NavigationContainer>
);

export default AppNavigator;
