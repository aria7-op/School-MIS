import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ImageSourcePropType
} from 'react-native';
import { useTheme } from '@react-navigation/native';
import { COLORS, FONTS } from '../../theme';

interface AvatarProps {
  source?: ImageSourcePropType | null;
  name: string;
  size?: number;
  isOnline?: boolean;
  showOnlineStatus?: boolean;
}

const Avatar: React.FC<AvatarProps> = ({
  source,
  name,
  size = 40,
  isOnline = false,
  showOnlineStatus = true
}) => {
  const { colors } = useTheme();

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getBackgroundColor = (name: string) => {
    const colors = [
      COLORS.primary,
      COLORS.secondary,
      COLORS.success,
      COLORS.warning,
      COLORS.error,
      COLORS.info
    ];
    const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  const containerStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
  };

  const textStyle = {
    fontSize: size * 0.4,
    fontWeight: FONTS.weights.bold,
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {source ? (
        <Image
          source={source}
          style={[styles.image, containerStyle]}
          resizeMode="cover"
        />
      ) : (
        <View
          style={[
            styles.initialsContainer,
            containerStyle,
            { backgroundColor: getBackgroundColor(name) }
          ]}
        >
          <Text style={[styles.initials, textStyle, { color: 'white' }]}>
            {getInitials(name)}
          </Text>
        </View>
      )}
      
      {showOnlineStatus && isOnline && (
        <View style={[styles.onlineIndicator, { backgroundColor: COLORS.success }]} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  initialsContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  initials: {
    textAlign: 'center',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: 'white',
  },
});

export default Avatar; 
