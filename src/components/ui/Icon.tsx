import React from 'react';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

interface IconProps {
  name: string;
  size?: number;
  color?: string;
  style?: any;
}

export const Icon: React.FC<IconProps> = ({
  name,
  size = 24,
  color = '#000',
  style
}) => {
  return (
    <MaterialIcons
      name={name as any}
      size={size}
      color={color}
      style={style}
    />
  );
}; 
