import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { COLORS, SPACING, FONTS } from '../../../theme';

interface AvatarProps {
  source?: string | null;
  size: number;
  name: string;
  isOnline?: boolean;
}

const Avatar: React.FC<AvatarProps> = ({ source, size, name, isOnline = false }) => {
  const getInitials = () => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const getBackgroundColor = () => {
    if (!name) return COLORS.secondary;
    
    // Generate consistent color based on name
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    const hue = Math.abs(hash) % 360;
    return `hsl(${hue}, 70%, 60%)`;
  };

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {source ? (
        <Image
          source={{ uri: source }}
          style={[styles.image, { width: size, height: size, borderRadius: size / 2 }]}
        />
      ) : (
        <View
          style={[
            styles.initialsContainer,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor: getBackgroundColor()
            }
          ]}
        >
          <Text
            style={[
              styles.initials,
              {
                fontSize: size * 0.4,
                color: 'white'
              }
            ]}
          >
            {getInitials()}
          </Text>
        </View>
      )}
      
      {isOnline && (
        <View
          style={[
            styles.onlineIndicator,
            {
              width: size * 0.3,
              height: size * 0.3,
              borderRadius: (size * 0.3) / 2,
              right: size * 0.05,
              bottom: size * 0.05
            }
          ]}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  image: {
    resizeMode: 'cover',
  },
  initialsContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  initials: {
    fontWeight: FONTS.weights.bold,
  },
  onlineIndicator: {
    position: 'absolute',
    backgroundColor: COLORS.success,
    borderWidth: 2,
    borderColor: 'white',
  },
});

export default Avatar; 
