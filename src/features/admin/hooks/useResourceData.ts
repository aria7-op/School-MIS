import { useState, useEffect } from 'react';
import { ResourceData } from '../types';

interface UseResourceDataReturn {
  resourceData: ResourceData | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

const useResourceData = (): UseResourceDataReturn => {
  const [resourceData, setResourceData] = useState<ResourceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchResourceData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Mock data for now - replace with actual API call
      const mockResourceData: ResourceData = {
        library: [
          {
            id: '1',
            title: 'Advanced Mathematics',
            author: 'John Smith',
            isbn: '978-1234567890',
            status: 'available',
            location: 'Shelf A1',
            category: 'Mathematics',
          },
          {
            id: '2',
            title: 'English Literature',
            author: 'Jane Doe',
            isbn: '978-0987654321',
            status: 'borrowed',
            location: 'Shelf B2',
            category: 'Literature',
          },
        ],
        hostel: [
          {
            id: '1',
            name: 'Student Hall A',
            capacity: 100,
            occupied: 85,
            available: 15,
            manager: 'Mike Johnson',
            status: 'active',
          },
          {
            id: '2',
            name: 'Student Hall B',
            capacity: 80,
            occupied: 75,
            available: 5,
            manager: 'Sarah Wilson',
            status: 'active',
          },
        ],
        transport: [
          {
            id: '1',
            route: 'Route 1 - Downtown',
            vehicle: 'Bus 001',
            driver: 'Tom Brown',
            capacity: 50,
            currentPassengers: 35,
            status: 'active',
            schedule: '7:00 AM, 3:00 PM',
          },
          {
            id: '2',
            route: 'Route 2 - Suburbs',
            vehicle: 'Bus 002',
            driver: 'Lisa Green',
            capacity: 40,
            currentPassengers: 28,
            status: 'active',
            schedule: '7:30 AM, 3:30 PM',
          },
        ],
        equipment: [
          {
            id: '1',
            name: 'Projector',
            type: 'Audio/Visual',
            status: 'available',
            location: 'Room 201',
            lastMaintenance: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
          },
          {
            id: '2',
            name: 'Computer Lab PC',
            type: 'Computer',
            status: 'in_use',
            location: 'Computer Lab 1',
            lastMaintenance: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15).toISOString(),
          },
        ],
        inventory: [
          {
            id: '1',
            item: 'Textbooks',
            category: 'Books',
            quantity: 500,
            minQuantity: 50,
            currentStock: 45,
            supplier: 'Book Supply Co.',
            lastRestock: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
          },
          {
            id: '2',
            item: 'Lab Equipment',
            category: 'Science',
            quantity: 100,
            minQuantity: 20,
            currentStock: 15,
            supplier: 'Science Supplies Inc.',
            lastRestock: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString(),
          },
        ],
        suppliers: [
          {
            id: '1',
            name: 'Book Supply Co.',
            contact: 'John Supplier',
            email: 'john@booksupply.com',
            phone: '+1-555-0123',
            rating: 4.5,
            status: 'active',
          },
          {
            id: '2',
            name: 'Science Supplies Inc.',
            contact: 'Jane Supplier',
            email: 'jane@sciencesupplies.com',
            phone: '+1-555-0456',
            rating: 4.2,
            status: 'active',
          },
        ],
        purchaseOrders: [
          {
            id: '1',
            supplier: 'Book Supply Co.',
            items: ['Textbooks', 'Notebooks'],
            totalAmount: 5000,
            status: 'pending',
            orderDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
            expectedDelivery: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString(),
          },
        ],
        lowStockItems: 5,
        resourceStats: {
          libraryBooks: 2500,
          hostelOccupancy: 85,
          transportRoutes: 8,
          equipmentStatus: {
            available: 45,
            in_use: 30,
            maintenance: 5,
            out_of_order: 2,
          },
        },
      };

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));

      setResourceData(mockResourceData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch resource data');
    } finally {
      setLoading(false);
    }
  };

  const refetch = async () => {
    await fetchResourceData();
  };

  useEffect(() => {
    fetchResourceData();
  }, []);

  return {
    resourceData,
    loading,
    error,
    refetch,
  };
};

export default useResourceData; 
