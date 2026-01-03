import { StackNavigationProp } from '@react-navigation/stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';

export type RootStackParamList = {
  Customers: undefined;
  AddCustomer: undefined;
  EditCustomer: {
    customerId: number;
  };
  TakeAttendance: {
    classId: string;
    date: string;
    userId?: string;
    recordId?: string;
  };
};

export type RootStackNavigation = StackNavigationProp<RootStackParamList>;
export type RootTabNavigation = BottomTabNavigationProp<RootStackParamList>;
export type NavigationProp = StackNavigationProp<RootStackParamList>;

export type NavigationParams = {
  classId: string;
  date: string;
  userId?: string;
  recordId?: string;
};
