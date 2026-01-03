import React from 'react';
import { render } from '@testing-library/react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import Header from '../Header';

describe('Header Component', () => {
  it('renders correctly', () => {
    const { getByText } = render(
      <NavigationContainer theme={DefaultTheme}>
        <Header />
      </NavigationContainer>
    );
    expect(getByText('Academic Dashboard')).toBeTruthy();
  });
});
