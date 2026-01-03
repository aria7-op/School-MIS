import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../constants/colors';

interface ClassSearchProps {
  onSearch: (results: any[]) => void;
  onClear: () => void;
  placeholder?: string;
  classes: any[]; // Add classes prop
}

interface SearchSuggestion {
  id: string;
  text: string;
  type: 'name' | 'code' | 'teacher' | 'level' | 'id';
}

const ClassSearch: React.FC<ClassSearchProps> = ({
  onSearch,
  onClear,
  placeholder = 'Search classes...',
  classes = []
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<TextInput>(null);

  // Handle search query changes with debouncing
  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (text.trim().length >= 2) {
      searchTimeoutRef.current = setTimeout(() => {
        generateSuggestions(text);
      }, 300);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const generateSuggestions = (query: string) => {
    const lowerQuery = query.toLowerCase();
    
    // Filter classes based on search query
    const matchingClasses = classes.filter(classItem => {
      const name = (classItem.name || '').toLowerCase();
      const code = (classItem.code || '').toLowerCase();
      const teacher = (classItem.teacher || classItem.teacherName || '').toLowerCase();
      const level = (classItem.level || '').toString().toLowerCase();
      const id = (classItem.id || '').toString().toLowerCase();
      
      return name.includes(lowerQuery) || 
             code.includes(lowerQuery) || 
             teacher.includes(lowerQuery) || 
             level.includes(lowerQuery) ||
             id.includes(lowerQuery);
    });

    // Convert to suggestions format
    const newSuggestions: SearchSuggestion[] = matchingClasses.slice(0, 8).map(classItem => {
      const name = classItem.name || '';
      const code = classItem.code || '';
      const teacher = classItem.teacher || classItem.teacherName || '';
      const level = classItem.level || '';
      const id = classItem.id || '';
      
      // Determine which field matches and set type accordingly
      if (name.toLowerCase().includes(lowerQuery)) {
        return { id: id.toString(), text: name, type: 'name' as const };
      } else if (code.toLowerCase().includes(lowerQuery)) {
        return { id: id.toString(), text: code, type: 'code' as const };
      } else if (teacher.toLowerCase().includes(lowerQuery)) {
        return { id: id.toString(), text: teacher, type: 'teacher' as const };
      } else if (level.toString().toLowerCase().includes(lowerQuery)) {
        return { id: id.toString(), text: `Level ${level}`, type: 'level' as const };
      } else {
        return { id: id.toString(), text: id.toString(), type: 'id' as const };
      }
    });

    // Remove duplicates
    const uniqueSuggestions = newSuggestions.filter(
      (suggestion, index, self) => 
        index === self.findIndex(s => s.id === suggestion.id)
    );

    setSuggestions(uniqueSuggestions);
    setShowSuggestions(uniqueSuggestions.length > 0);
  };

  const handleSuggestionSelect = (suggestion: SearchSuggestion) => {
    setSearchQuery(suggestion.text);
    setShowSuggestions(false);
    performSearch(suggestion.text);
  };

  const performSearch = (query?: string) => {
    const searchText = query || searchQuery;
    
    if (!searchText.trim()) {
      onClear();
      return;
    }

    // Filter classes locally
    const lowerQuery = searchText.toLowerCase();
    const filteredClasses = classes.filter(classItem => {
      const name = (classItem.name || '').toLowerCase();
      const code = (classItem.code || '').toLowerCase();
      const teacher = (classItem.teacher || classItem.teacherName || '').toLowerCase();
      const level = (classItem.level || '').toString().toLowerCase();
      const id = (classItem.id || '').toString().toLowerCase();
      
      return name.includes(lowerQuery) || 
             code.includes(lowerQuery) || 
             teacher.includes(lowerQuery) || 
             level.includes(lowerQuery) ||
             id.includes(lowerQuery);
    });

    onSearch(filteredClasses);
    setShowSuggestions(false);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSuggestions([]);
    setShowSuggestions(false);
    onClear();
  };

  return (
    <View style={{ position: 'relative', zIndex: 1000 }}>
      {/* Main Search Bar */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.white,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 8,
        marginHorizontal: 16,
        marginVertical: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
      }}>
        <Ionicons name="search" size={16} color="#888" />
        
        <TextInput
          ref={inputRef}
          style={{
            flex: 1,
            marginLeft: 12,
            fontSize: 12,
            color: "#888",
          }}
          placeholder={placeholder}
          placeholderTextColor="#888"
          value={searchQuery}
          onChangeText={handleSearchChange}
          onFocus={() => {
            if (suggestions.length > 0) {
              setShowSuggestions(true);
            }
          }}
          onSubmitEditing={() => performSearch()}
        />

        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={clearSearch} style={{ marginLeft: 8 }}>
            <Ionicons name="close-circle" size={20} color={colors.gray[400]} />
          </TouchableOpacity>
        )}
      </View>

      {/* Search Suggestions */}
      {showSuggestions && suggestions.length > 0 && (
        <View style={{
          position: 'absolute',
          top: 60,
          left: 16,
          right: 16,
          backgroundColor: colors.white,
          borderRadius: 12,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.15,
          shadowRadius: 8,
          elevation: 8,
          maxHeight: 200,
          zIndex: 1001,
        }}>
          <ScrollView>
            {suggestions.map((suggestion) => (
              <TouchableOpacity
                key={suggestion.id}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  borderBottomWidth: 1,
                  borderBottomColor: colors.gray[100],
                }}
                onPress={() => handleSuggestionSelect(suggestion)}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons
                    name={
                      suggestion.type === 'code' ? 'code' :
                      suggestion.type === 'teacher' ? 'person' :
                      suggestion.type === 'level' ? 'school' :
                      suggestion.type === 'id' ? 'id-card' : 'book'
                    }
                    size={16}
                    color={colors.gray[500]}
                    style={{ marginRight: 8 }}
                  />
                  <Text style={{ fontSize: 14, color: colors.gray[800] }}>
                    {suggestion.text}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

export default ClassSearch; 
