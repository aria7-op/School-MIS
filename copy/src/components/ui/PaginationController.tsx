import React from 'react';
import {
  HStack,
  VStack,
  Button,
  Text,
  Select,
  CheckIcon,
  IconButton,
  useColorModeValue,
  Box,
  Divider,
} from 'native-base';
import { MaterialIcons } from '@expo/vector-icons';

interface PaginationControllerProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  loading?: boolean;
  showPageSizeSelector?: boolean;
  pageSizeOptions?: number[];
  showItemsInfo?: boolean;
  maxVisiblePages?: number;
}

const PaginationController: React.FC<PaginationControllerProps> = ({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  onPageSizeChange,
  loading = false,
  showPageSizeSelector = true,
  pageSizeOptions = [10, 20, 50, 100],
  showItemsInfo = true,
  maxVisiblePages = 5,
}) => {
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.700', 'gray.200');
  const mutedColor = useColorModeValue('gray.500', 'gray.400');
  const primaryColor = useColorModeValue('blue.500', 'blue.300');

  // Calculate visible page range
  const getVisiblePages = () => {
    const pages: (number | string)[] = [];
    const halfVisible = Math.floor(maxVisiblePages / 2);
    
    let startPage = Math.max(1, currentPage - halfVisible);
    let endPage = Math.min(totalPages, currentPage + halfVisible);
    
    // Adjust range if we're near the beginning or end
    if (endPage - startPage + 1 < maxVisiblePages) {
      if (startPage === 1) {
        endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
      } else {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
      }
    }
    
    // Add first page and ellipsis if needed
    if (startPage > 1) {
      pages.push(1);
      if (startPage > 2) {
        pages.push('...');
      }
    }
    
    // Add visible pages
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    // Add ellipsis and last page if needed
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pages.push('...');
      }
      pages.push(totalPages);
    }
    
    return pages;
  };

  const visiblePages = getVisiblePages();
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const handlePageClick = (page: number | string) => {
    if (typeof page === 'number' && page !== currentPage && !loading) {
      onPageChange(page);
    }
  };

  const handlePrevious = () => {
    if (currentPage > 1 && !loading) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages && !loading) {
      onPageChange(currentPage + 1);
    }
  };

  if (totalPages <= 1 && totalItems <= itemsPerPage) {
    return showItemsInfo ? (
      <Box p={2}>
        <Text fontSize="sm" color={mutedColor} textAlign="center">
          {totalItems} {totalItems === 1 ? 'item' : 'items'}
        </Text>
      </Box>
    ) : null;
  }

  return (
    <VStack space={3} p={3} bg="orange.100" borderRadius="lg" borderWidth={2} borderColor="orange.500">
      {/* Main Pagination Controls */}
      <HStack space={2} justifyContent="center" alignItems="center" flexWrap="wrap">
        {/* Previous Button */}
        <IconButton
          icon={<MaterialIcons name="chevron-left" size={20} color={currentPage > 1 ? primaryColor : mutedColor} />}
          onPress={handlePrevious}
          isDisabled={currentPage <= 1 || loading}
          variant="ghost"
          size="sm"
        />

        {/* Page Numbers */}
        <HStack space={1} alignItems="center">
          {visiblePages.map((page, index) => (
            <React.Fragment key={index}>
              {page === '...' ? (
                <Text color={mutedColor} px={2}>
                  ...
                </Text>
              ) : (
                <Button
                  size="sm"
                  variant={page === currentPage ? 'solid' : 'ghost'}
                  colorScheme={page === currentPage ? 'blue' : 'gray'}
                  onPress={() => handlePageClick(page)}
                  isDisabled={loading}
                  minW="40px"
                  _text={{
                    fontSize: 'sm',
                    fontWeight: page === currentPage ? 'bold' : 'medium',
                  }}
                >
                  {page}
                </Button>
              )}
            </React.Fragment>
          ))}
        </HStack>

        {/* Next Button */}
        <IconButton
          icon={<MaterialIcons name="chevron-right" size={20} color={currentPage < totalPages ? primaryColor : mutedColor} />}
          onPress={handleNext}
          isDisabled={currentPage >= totalPages || loading}
          variant="ghost"
          size="sm"
        />
      </HStack>

      {/* Bottom Info and Controls */}
      <HStack justifyContent="space-between" alignItems="center" flexWrap="wrap">
        {/* Items Info */}
        {showItemsInfo && (
          <Text fontSize="sm" color={textColor}>
            Showing {startItem}-{endItem} of {totalItems}
          </Text>
        )}

        {/* Page Size Selector */}
        {showPageSizeSelector && onPageSizeChange && (
          <HStack space={2} alignItems="center">
            <Text fontSize="sm" color={textColor}>
              Per page:
            </Text>
            <Select
              selectedValue={itemsPerPage.toString()}
              minWidth="80px"
              accessibilityLabel="Items per page"
              placeholder="Select"
              size="sm"
              variant="filled"
              _selectedItem={{
                bg: primaryColor,
                endIcon: <CheckIcon size="5" color="white" />,
              }}
              onValueChange={(value) => onPageSizeChange(parseInt(value))}
              isDisabled={loading}
            >
              {pageSizeOptions.map((size) => (
                <Select.Item key={size} label={size.toString()} value={size.toString()} />
              ))}
            </Select>
          </HStack>
        )}
      </HStack>

      {/* Quick Jump (for large datasets) */}
      {totalPages > 10 && (
        <>
          <Divider />
          <HStack space={2} alignItems="center" justifyContent="center">
            <Text fontSize="sm" color={textColor}>
              Go to page:
            </Text>
            <Select
              selectedValue={currentPage.toString()}
              minWidth="80px"
              accessibilityLabel="Go to page"
              placeholder="Page"
              size="sm"
              variant="filled"
              _selectedItem={{
                bg: primaryColor,
                endIcon: <CheckIcon size="5" color="white" />,
              }}
              onValueChange={(value) => handlePageClick(parseInt(value))}
              isDisabled={loading}
            >
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <Select.Item key={page} label={`Page ${page}`} value={page.toString()} />
              ))}
            </Select>
          </HStack>
        </>
      )}
    </VStack>
  );
};

export default PaginationController;