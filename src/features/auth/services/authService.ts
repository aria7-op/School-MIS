import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const BASE_URL = 'https://khwanzay.school/api';

export const login = async (email: string, password: string) => {
  const response = await fetch(`${BASE_URL}/users/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: email, password }),
  });
  if (!response.ok) throw new Error('Invalid credentials');
  const data = await response.json();
  if (data.data?.token) {
    await AsyncStorage.setItem('userToken', data.data.token);
    return data.data.token;
  }
  throw new Error('No token received');
};

export const logout = async () => {
  await AsyncStorage.removeItem('userToken');
};
