import { StackScreenProps } from '@react-navigation/stack';

export type RootStackParamList = {
  Home: undefined;
  Login: undefined;
  MainTabs: undefined;
  Attendance: undefined;
  TakeAttendance: {
    classId: string;
    date: string;
    userId?: string;
    recordId?: string;
  };
  // Owners screens
  OwnersList: undefined;
  AddOwner: undefined;
  OwnerDetails: {
    ownerId: string;
  };
  EditOwner: {
    ownerId: string;
  };
  OwnerProfile: undefined;
  // Add other screens here as needed
};

export type RootStackScreenProps<T extends keyof RootStackParamList> = StackScreenProps<RootStackParamList, T>;
