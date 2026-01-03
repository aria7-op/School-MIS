import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface DropdownMenuProps {
  title: string;
  icon: string;
  items: {
    name: string;
    screen: string;
    icon: string;
  }[];
  navigation: any;
  isActive: boolean;
}

const DropdownMenu: React.FC<DropdownMenuProps> = ({ 
  title, 
  icon, 
  items, 
  navigation,
  isActive 
}) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <View>
      <TouchableOpacity
        style={[
          styles.dropdownHeader,
          isActive && styles.menuItemActive
        ]}
        onPress={() => setExpanded(!expanded)}
      >
        <MaterialCommunityIcons 
          name={icon} 
          size={17} 
          color={isActive ? '#6366f1' : '#4b5563'} 
          style={styles.menuIcon} 
        />
        <Text style={[
          styles.menuText,
          isActive && styles.menuTextActive
        ]}>
          {title}
        </Text>
        <MaterialCommunityIcons 
          name={expanded ? 'chevron-up' : 'chevron-down'} 
          size={20} 
          color={isActive ? '#6366f1' : '#4b5563'}
        />
        {isActive && <View style={styles.activeIndicator} />}
      </TouchableOpacity>

      {expanded && (
        <View style={styles.dropdownItems}>
          {items.map((item) => (
            <TouchableOpacity
              key={item.name}
              style={styles.dropdownItem}
              onPress={() => navigation.navigate(item.screen)}
            >
              <MaterialCommunityIcons 
                name={item.icon} 
                size={14} 
                color="#4b5563" 
                style={styles.dropdownIcon} 
              />
              <Text style={styles.dropdownText}>{item.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
    dropdownContainer: {
      marginBottom: 4,
    },
    dropdownHeader: {
      flex:1,
      flexDirection: 'row',
      alignItems: 'center',
      gap:20,
      paddingVertical: 8,
      marginHorizontal:10,
      paddingHorizontal:10,
      borderRadius: 12,
      position: 'relative',
    },
    dropdownItems: {
      overflow: 'hidden',
    },
    menuText:{
      flex:1,
      fontSize:15,
      fontWeight:500,
      color: '#4b5563',
    },
    menuItemActive:{
      color: '#6366f1',
      fontWeight: '600',
    },
    dropdownItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical:2,
      paddingLeft: 45, 
      paddingRight: 16,
    },
    dropdownIcon: {
      marginRight: 12,
      width: 22,
    },
    dropdownText: {
      color: '#4b5563',
      fontSize: 13,
      fontWeight:600
    },
    activeIndicator: {
      position: 'absolute',
      left: 0,
      height: 20,
      width: 4,
      backgroundColor: '#6366f1',
      borderTopRightRadius: 4,
      borderBottomRightRadius: 4
    },
   
});

export default DropdownMenu;
