export interface Customer {
  id: number;
  name: string;
  serialNumber: string;
  email: string;
  phone: string;
  address: string;
  street: string;
  city: string;
  country: string;
  purpose: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER' | 'PREFER_NOT_TO_SAY';
  source: string;
  remark: string;
  department: string;
  postal_code: string;
  occupation: string;
  company: string;
  website: string;
  tags: string[];
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  stage: string;
  value: number;
  lead_score: number;
  refered_to: string;
  referredTo: string;
  referredById: number;
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  ownerId: number;
  schoolId: number;
  createdBy: number;
  updatedBy: number;
  userId: number;
  totalSpent: number;
  orderCount: number;
  type: 'STUDENT' | 'PARENT' | 'TEACHER' | 'STAFF' | 'PROSPECT' | 'ALUMNI';
  pipelineStageId?: number;
  // Legacy fields for backward compatibility
  firstName?: string;
  lastName?: string;
  status?: string;
  lastContact?: string;
  assignedTo?: string;
  notes?: string;
  lastActivity?: string;
}

export interface CustomerCategory {
  name: string;
  count: number;
  percentage: number;
  customers: Customer[];
}

export interface CustomerAnalytics {
  totalCustomers: number;
  categories: CustomerCategory[];
  totalValue: number;
  averageValue: number;
  conversionRate: number;
  topSources: Array<{ source: string; count: number; percentage: number }>;
  topCities: Array<{ city: string; count: number; percentage: number }>;
  priorityBreakdown: Array<{ priority: string; count: number; percentage: number }>;
  typeBreakdown: Array<{ type: string; count: number; percentage: number }>;
  genderBreakdown: Array<{ gender: string; count: number; percentage: number }>;
  purposeBreakdown: Array<{ purpose: string; count: number; percentage: number }>;
}

/**
 * Normalize customer data from API response
 */
export const decryptCustomerData = (payload: any): Customer[] => {
  if (!payload) {
    return [];
  }

  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload.data)) {
    return payload.data;
  }

  if (Array.isArray(payload.customers)) {
    return payload.customers;
  }

  return [];
};

/**
 * Process customer data and generate analytics
 */
export const processCustomerAnalytics = (customers: Customer[]): CustomerAnalytics => {
  const totalCustomers = customers.length;
  
  if (totalCustomers === 0) {
    return {
      totalCustomers: 0,
      categories: [],
      totalValue: 0,
      averageValue: 0,
      conversionRate: 0,
      topSources: [],
      topCities: [],
      priorityBreakdown: [],
      typeBreakdown: [],
      genderBreakdown: [],
      purposeBreakdown: []
    };
  }

  // Calculate total value
  const totalValue = customers.reduce((sum, customer) => sum + (customer.value || 0), 0);
  const averageValue = totalValue / totalCustomers;

  // Group by source
  const sourceCounts: Record<string, number> = {};
  customers.forEach(customer => {
    const source = customer.source || 'Unknown';
    sourceCounts[source] = (sourceCounts[source] || 0) + 1;
  });

  const topSources = Object.entries(sourceCounts)
    .map(([source, count]) => ({
      source,
      count,
      percentage: (count / totalCustomers) * 100
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Group by city
  const cityCounts: Record<string, number> = {};
  customers.forEach(customer => {
    const city = customer.city || 'Unknown';
    cityCounts[city] = (cityCounts[city] || 0) + 1;
  });

  const topCities = Object.entries(cityCounts)
    .map(([city, count]) => ({
      city,
      count,
      percentage: (count / totalCustomers) * 100
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Priority breakdown
  const priorityCounts: Record<string, number> = {};
  customers.forEach(customer => {
    const priority = customer.priority || 'MEDIUM';
    priorityCounts[priority] = (priorityCounts[priority] || 0) + 1;
  });

  const priorityBreakdown = Object.entries(priorityCounts)
    .map(([priority, count]) => ({
      priority,
      count,
      percentage: (count / totalCustomers) * 100
    }))
    .sort((a, b) => b.count - a.count);

  // Type breakdown
  const typeCounts: Record<string, number> = {};
  customers.forEach(customer => {
    const type = customer.type || 'PROSPECT';
    typeCounts[type] = (typeCounts[type] || 0) + 1;
  });

  const typeBreakdown = Object.entries(typeCounts)
    .map(([type, count]) => ({
      type,
      count,
      percentage: (count / totalCustomers) * 100
    }))
    .sort((a, b) => b.count - a.count);

  // Gender breakdown
  const genderCounts: Record<string, number> = {};
  customers.forEach(customer => {
    const gender = customer.gender || 'PREFER_NOT_TO_SAY';
    genderCounts[gender] = (genderCounts[gender] || 0) + 1;
  });

  const genderBreakdown = Object.entries(genderCounts)
    .map(([gender, count]) => ({
      gender,
      count,
      percentage: (count / totalCustomers) * 100
    }))
    .sort((a, b) => b.count - a.count);

  // Purpose breakdown
  const purposeCounts: Record<string, number> = {};
  customers.forEach(customer => {
    const purpose = customer.purpose || 'Unknown';
    purposeCounts[purpose] = (purposeCounts[purpose] || 0) + 1;
  });

  const purposeBreakdown = Object.entries(purposeCounts)
    .map(([purpose, count]) => ({
      purpose,
      count,
      percentage: (count / totalCustomers) * 100
    }))
    .sort((a, b) => b.count - a.count);

  // Create categories based on type
  const categories: CustomerCategory[] = typeBreakdown.map(({ type, count, percentage }) => ({
    name: type,
    count,
    percentage,
    customers: customers.filter(customer => customer.type === type)
  }));

  // Calculate conversion rate (customers with value > 0)
  const convertedCustomers = customers.filter(customer => (customer.value || 0) > 0).length;
  const conversionRate = (convertedCustomers / totalCustomers) * 100;

  return {
    totalCustomers,
    categories,
    totalValue,
    averageValue,
    conversionRate,
    topSources,
    topCities,
    priorityBreakdown,
    typeBreakdown,
    genderBreakdown,
    purposeBreakdown
  };
};

/**
 * Get customer statistics
 */
export const getCustomerStats = (customers: Customer[]) => {
  const total = customers.length;
  const active = customers.filter(c => !c.deletedAt).length;
  const inactive = total - active;
  const highValue = customers.filter(c => (c.value || 0) > 1000).length;
  const converted = customers.filter(c => (c.value || 0) > 0).length;

  return {
    total,
    active,
    inactive,
    highValue,
    converted,
    conversionRate: total > 0 ? (converted / total) * 100 : 0
  };
};

/**
 * Filter customers by various criteria
 */
export const filterCustomers = (
  customers: Customer[],
  filters: {
    search?: string;
    type?: string;
    priority?: string;
    source?: string;
    city?: string;
    purpose?: string;
    gender?: string;
    minValue?: number;
    maxValue?: number;
  }
) => {
  return customers.filter(customer => {
    // Search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      const searchableFields = [
        customer.name,
        customer.email,
        customer.phone,
        customer.company,
        customer.city,
        customer.country,
        customer.purpose,
        customer.source
      ].join(' ').toLowerCase();
      
      if (!searchableFields.includes(searchTerm)) {
        return false;
      }
    }

    // Type filter
    if (filters.type && customer.type !== filters.type) {
      return false;
    }

    // Priority filter
    if (filters.priority && customer.priority !== filters.priority) {
      return false;
    }

    // Source filter
    if (filters.source && customer.source !== filters.source) {
      return false;
    }

    // City filter
    if (filters.city && customer.city !== filters.city) {
      return false;
    }

    // Purpose filter
    if (filters.purpose && customer.purpose !== filters.purpose) {
      return false;
    }

    // Gender filter
    if (filters.gender && customer.gender !== filters.gender) {
      return false;
    }

    // Value range filter
    const customerValue = customer.value || 0;
    if (filters.minValue && customerValue < filters.minValue) {
      return false;
    }
    if (filters.maxValue && customerValue > filters.maxValue) {
      return false;
    }

    return true;
  });
};

/**
 * Sort customers by various criteria
 */
export const sortCustomers = (
  customers: Customer[],
  sortBy: string = 'createdAt',
  sortOrder: 'asc' | 'desc' = 'desc'
) => {
  return [...customers].sort((a, b) => {
    let aValue: any = a[sortBy as keyof Customer];
    let bValue: any = b[sortBy as keyof Customer];

    // Handle null/undefined values
    if (aValue === null || aValue === undefined) aValue = '';
    if (bValue === null || bValue === undefined) bValue = '';

    // Handle string comparison
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      aValue = aValue.toLowerCase();
      bValue = bValue.toLowerCase();
    }

    // Handle date comparison
    if (sortBy === 'createdAt' || sortBy === 'updatedAt') {
      aValue = new Date(aValue).getTime();
      bValue = new Date(bValue).getTime();
    }

    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
    } else {
      return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
    }
  });
}; 