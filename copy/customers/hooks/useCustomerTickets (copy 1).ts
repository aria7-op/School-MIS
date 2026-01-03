import { useState, useCallback } from 'react';
import { customerTicketsApi } from '../../../services/api/client';

const useCustomerTickets = (customerId?: string) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tickets, setTickets] = useState<any[]>([]);
  const [ticket, setTicket] = useState<any | null>(null);
  const [dashboard, setDashboard] = useState<any | null>(null);
  const [analytics, setAnalytics] = useState<any | null>(null);
  const [slaAnalytics, setSlaAnalytics] = useState<any | null>(null);

  // Get customer tickets
  const getCustomerTickets = useCallback(async (id?: string) => {
    const targetId = id || customerId;
    if (!targetId) {
      setError('Customer ID is required');
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      const response = await customerTicketsApi.getCustomerTickets(targetId);
      setTickets(response.data || response);
      return response.data || response;
    } catch (err: any) {
      setError(err.message || 'Failed to fetch tickets');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  // Create ticket
  const createTicket = useCallback(async (data: any, id?: string) => {
    const targetId = id || customerId;
    if (!targetId) {
      setError('Customer ID is required');
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      const response = await customerTicketsApi.createTicket(targetId, data);
      await getCustomerTickets(targetId);
      return response.data || response;
    } catch (err: any) {
      setError(err.message || 'Failed to create ticket');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [customerId, getCustomerTickets]);

  // Get specific ticket
  const getTicketById = useCallback(async (ticketId: string, id?: string) => {
    const targetId = id || customerId;
    if (!targetId) {
      setError('Customer ID is required');
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      const response = await customerTicketsApi.getTicketById(targetId, ticketId);
      setTicket(response.data || response);
      return response.data || response;
    } catch (err: any) {
      setError(err.message || 'Failed to fetch ticket');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  // Update ticket
  const updateTicket = useCallback(async (ticketId: string, data: any, id?: string) => {
    const targetId = id || customerId;
    if (!targetId) {
      setError('Customer ID is required');
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      const response = await customerTicketsApi.updateTicket(targetId, ticketId, data);
      await getCustomerTickets(targetId);
      return response.data || response;
    } catch (err: any) {
      setError(err.message || 'Failed to update ticket');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [customerId, getCustomerTickets]);

  // Delete ticket
  const deleteTicket = useCallback(async (ticketId: string, id?: string) => {
    const targetId = id || customerId;
    if (!targetId) {
      setError('Customer ID is required');
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      const response = await customerTicketsApi.deleteTicket(targetId, ticketId);
      await getCustomerTickets(targetId);
      return response.data || response;
    } catch (err: any) {
      setError(err.message || 'Failed to delete ticket');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [customerId, getCustomerTickets]);

  // Assign ticket
  const assignTicket = useCallback(async (ticketId: string, data: any, id?: string) => {
    const targetId = id || customerId;
    if (!targetId) {
      setError('Customer ID is required');
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      const response = await customerTicketsApi.assignTicket(targetId, ticketId, data);
      await getCustomerTickets(targetId);
      return response.data || response;
    } catch (err: any) {
      setError(err.message || 'Failed to assign ticket');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [customerId, getCustomerTickets]);

  // Resolve ticket
  const resolveTicket = useCallback(async (ticketId: string, id?: string) => {
    const targetId = id || customerId;
    if (!targetId) {
      setError('Customer ID is required');
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      const response = await customerTicketsApi.resolveTicket(targetId, ticketId);
      await getCustomerTickets(targetId);
      return response.data || response;
    } catch (err: any) {
      setError(err.message || 'Failed to resolve ticket');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [customerId, getCustomerTickets]);

  // Escalate ticket
  const escalateTicket = useCallback(async (ticketId: string, id?: string) => {
    const targetId = id || customerId;
    if (!targetId) {
      setError('Customer ID is required');
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      const response = await customerTicketsApi.escalateTicket(targetId, ticketId);
      await getCustomerTickets(targetId);
      return response.data || response;
    } catch (err: any) {
      setError(err.message || 'Failed to escalate ticket');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [customerId, getCustomerTickets]);

  // Get ticket dashboard
  const getTicketDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await customerTicketsApi.getTicketDashboard();
      setDashboard(response.data || response);
      return response.data || response;
    } catch (err: any) {
      setError(err.message || 'Failed to fetch ticket dashboard');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get ticket analytics
  const getTicketAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await customerTicketsApi.getTicketAnalytics();
      setAnalytics(response.data || response);
      return response.data || response;
    } catch (err: any) {
      setError(err.message || 'Failed to fetch ticket analytics');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get SLA analytics
  const getSLAAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await customerTicketsApi.getSLAAnalytics();
      setSlaAnalytics(response.data || response);
      return response.data || response;
    } catch (err: any) {
      setError(err.message || 'Failed to fetch SLA analytics');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    tickets,
    ticket,
    dashboard,
    analytics,
    slaAnalytics,
    getCustomerTickets,
    createTicket,
    getTicketById,
    updateTicket,
    deleteTicket,
    assignTicket,
    resolveTicket,
    escalateTicket,
    getTicketDashboard,
    getTicketAnalytics,
    getSLAAnalytics,
  };
};

export default useCustomerTickets; 
