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

interface CustomerSearchProps {
  onSearch: (results: any[]) => void;
  onClear: () => void;
  placeholder?: string;
  customers: any[]; // Add customers prop
  onCustomerSelect?: (customer: any) => void; // Add callback for customer selection
  onNavigateToCustomers?: () => void; // Add callback for navigation
  searchQuery?: string; // Add searchQuery prop from parent
  onSearchQueryChange?: (query: string) => void; // Add callback to update parent's searchQuery
}

interface SearchSuggestion {
  id: string;
  text: string;
  type: 'name' | 'email' | 'phone' | 'id';
}

const CustomerSearch: React.FC<CustomerSearchProps> = ({
  onSearch,
  onClear,
  placeholder = 'Search customers...',
  customers = [],
  onCustomerSelect,
  onNavigateToCustomers,
  searchQuery: externalSearchQuery,
  onSearchQueryChange
}) => {
  const [searchQuery, setSearchQuery] = useState(externalSearchQuery || '');
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  const inputRef = useRef<TextInput>(null);

  // Handle search query changes with debouncing
  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    
    // Update parent's searchQuery if callback provided
    if (onSearchQueryChange) {
      onSearchQueryChange(text);
    }
    
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
    
    // Filter customers based on search query
    const matchingCustomers = customers.filter(customer => {
      const name = (customer.name || `${customer.firstName || ''} ${customer.lastName || ''}`.trim()).toLowerCase();
      const email = (customer.email || '').toLowerCase();
      const phone = (customer.phone || customer.mobile || '').toLowerCase();
      const id = (customer.id || customer.customerId || '').toString().toLowerCase();
      
      return name.includes(lowerQuery) || 
             email.includes(lowerQuery) || 
             phone.includes(lowerQuery) || 
             id.includes(lowerQuery);
    });

    // Convert to suggestions format
    const newSuggestions: SearchSuggestion[] = matchingCustomers.slice(0, 8).map(customer => {
      const name = customer.name || `${customer.firstName || ''} ${customer.lastName || ''}`.trim();
      const email = customer.email || '';
      const phone = customer.phone || customer.mobile || '';
      const id = customer.id || customer.customerId || '';
      
      // Determine which field matches and set type accordingly
      if (name.toLowerCase().includes(lowerQuery)) {
        return { id: id.toString(), text: name, type: 'name' as const };
      } else if (email.toLowerCase().includes(lowerQuery)) {
        return { id: id.toString(), text: email, type: 'email' as const };
      } else if (phone.toLowerCase().includes(lowerQuery)) {
        return { id: id.toString(), text: phone, type: 'phone' as const };
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
    
    // Find the actual customer object
    const selectedCustomer = customers.find(customer => {
      const customerId = customer.id || customer.customerId;
      return customerId.toString() === suggestion.id;
    });
    
    if (selectedCustomer && onCustomerSelect) {
      onCustomerSelect(selectedCustomer);
    }
    
    // Navigate to customers tab if navigation callback is provided
    if (onNavigateToCustomers) {
      onNavigateToCustomers();
    }
    
    performSearch(suggestion.text);
  };

  const performSearch = (query?: string) => {
    const searchText = query || searchQuery;
    
    if (!searchText.trim()) {
      onClear();
      return;
    }

    // Filter customers locally with comprehensive search
    const lowerQuery = searchText.toLowerCase();
    const filteredCustomers = customers.filter(customer => {
      if (!customer) return false;
      
      const name = (customer.name || `${customer.firstName || ''} ${customer.lastName || ''}`.trim()).toLowerCase();
      const email = (customer.email || '').toLowerCase();
      const phone = (customer.phone || customer.mobile || '').toLowerCase();
      const id = (customer.id || customer.customerId || '').toString().toLowerCase();
      const company = (customer.company || '').toLowerCase();
      const serialNumber = (customer.serialNumber || '').toLowerCase();
      const source = (customer.source || '').toLowerCase();
      const city = (customer.city || '').toLowerCase();
      const country = (customer.country || '').toLowerCase();
      const type = (customer.type || '').toLowerCase();
      const purpose = (customer.purpose || '').toLowerCase();
      const department = (customer.department || '').toLowerCase();
      const address = (customer.address || '').toLowerCase();
      const street = (customer.street || '').toLowerCase();
      const postalCode = (customer.postal_code || '').toLowerCase();
      const occupation = (customer.occupation || '').toLowerCase();
      const website = (customer.website || '').toLowerCase();
      const remark = (customer.remark || '').toLowerCase();
      const stage = (customer.stage || '').toLowerCase();
      const status = (customer.status || '').toLowerCase();
      const assignedTo = (customer.assignedTo || '').toLowerCase();
      const notes = (customer.notes || '').toLowerCase();
      const referredTo = (customer.referredTo || customer.refered_to || '').toLowerCase();
      
      // Check if any field contains the search query
      return name.includes(lowerQuery) || 
             email.includes(lowerQuery) || 
             phone.includes(lowerQuery) || 
             id.includes(lowerQuery) ||
             company.includes(lowerQuery) ||
             serialNumber.includes(lowerQuery) ||
             source.includes(lowerQuery) ||
             city.includes(lowerQuery) ||
             country.includes(lowerQuery) ||
             type.includes(lowerQuery) ||
             purpose.includes(lowerQuery) ||
             department.includes(lowerQuery) ||
             address.includes(lowerQuery) ||
             street.includes(lowerQuery) ||
             postalCode.includes(lowerQuery) ||
             occupation.includes(lowerQuery) ||
             website.includes(lowerQuery) ||
             remark.includes(lowerQuery) ||
             stage.includes(lowerQuery) ||
             status.includes(lowerQuery) ||
             assignedTo.includes(lowerQuery) ||
             notes.includes(lowerQuery) ||
             referredTo.includes(lowerQuery);
    })
    .map(c => ({
        id: c.id,
        name: c.name || `${c.firstName || ''} ${c.lastName || ''}`.trim(),
        email: c.email
      }));

    onSearch(filteredCustomers);
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
          onSubmitEditing={() => {
          if (suggestions.length > 0) {
            // If there are suggestions, select the first one
            handleSuggestionSelect(suggestions[0]);
          } else {
            performSearch();
          }
        }}
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
                      suggestion.type === 'email' ? 'mail' :
                      suggestion.type === 'phone' ? 'call' :
                      suggestion.type === 'id' ? 'id-card' : 'person'
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

export default CustomerSearch; 
