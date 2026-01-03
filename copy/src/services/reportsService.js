import { API_ENDPOINTS } from '../constants';
import api from './api';

/**
 * Reports Service
 * Handles all report-related API calls
 */
class ReportsService {
  // Remove backend health check logic
  // constructor() {
  //   this.backendAvailable = true;
  //   this.checkBackendHealth();
  // }

  // async checkBackendHealth() {
  //   try {
  //     await api.get('/health');
  //     this.backendAvailable = true;
  //     console.log('Backend is available');
  //   } catch (error) {
  //     this.backendAvailable = false;
  //     console.warn('Backend is not available, using mock data:', error.message);
  //   }
  // }

  /**
   * Get total parking status with bill status true
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Report data
   */
  async getTotalParkingStatusTrue(params = {}) {
    try {
      console.log('Calling getTotalParkingStatusTrue with params:', params);
      const response = await api.post(API_ENDPOINTS.REPORT_TOTAL_PARKING_STATUS_TRUE, params);
      console.log('getTotalParkingStatusTrue response:', response);
      return response;
    } catch (error) {
      console.error('Error fetching total parking status true:', error);
      // Return mock data for development
      return {
        total_cars_in_parking: 107,
        total_cars_entered: 813,
        total_cars_exited: 706,
        total_cars_rejected: 0
      };
    }
  }

  /**
   * Get total parking status with bill status false
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Report data
   */
  async getTotalParkingStatusFalse(params = {}) {
    try {
      console.log('Calling getTotalParkingStatusFalse with params:', params);
      const response = await api.post(API_ENDPOINTS.REPORT_TOTAL_PARKING_STATUS_FALSE, params);
      console.log('getTotalParkingStatusFalse response:', response);
      return response;
    } catch (error) {
      console.error('Error fetching total parking status false:', error);
      // Return mock data for development
      return {
        total_cars_in_parking: 0,
        total_cars_entered: 0,
        total_cars_exited: 0,
        total_cars_rejected: 0
      };
    }
  }

  /**
   * Get parking status for described cars (with bill status true)
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Report data
   */
  async getParkingStatusDescribedCars(params = {}) {
    try {
      console.log('Calling getParkingStatusDescribedCars with params:', params);
      console.log('API endpoint:', API_ENDPOINTS.REPORT_TOTAL_PARKING_STATUS_TRUE);
      const response = await api.post(API_ENDPOINTS.REPORT_TOTAL_PARKING_STATUS_TRUE, params);
      console.log('API raw response (described):', response);
      // Map API response to UI state
      const data = response.data || {};
      const mapped = {
        total_cars_in_parking: data.totalCarIn ?? 0,
        total_cars_entered: data.totalCarOut ?? 0,
        total_cars_exited: data.totalCarExsit ?? 0,
        total_cars_rejected: data.totalCarReject ?? 0
      };
      console.log('Mapped described data:', mapped);
      return mapped;
    } catch (error) {
      console.error('Error fetching parking status described cars:', error);
      // Return mock data for development
      return {
        total_cars_in_parking: 107,
        total_cars_entered: 813,
        total_cars_exited: 706,
        total_cars_rejected: 0
      };
    }
  }

  /**
   * Get parking status for undescribed cars (with bill status false)
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Report data
   */
  async getParkingStatusUndescribedCars(params = {}) {
    try {
      console.log('Calling getParkingStatusUndescribedCars with params:', params);
      console.log('API endpoint:', API_ENDPOINTS.REPORT_TOTAL_PARKING_STATUS_FALSE);
      const response = await api.post(API_ENDPOINTS.REPORT_TOTAL_PARKING_STATUS_FALSE, params);
      console.log('API raw response (undescribed):', response);
      // Map API response to UI state
      const data = response.data || {};
      const mapped = {
        total_cars_in_parking: data.totalCarIn ?? 0,
        total_cars_entered: data.totalCarOut ?? 0,
        total_cars_exited: data.totalCarExsit ?? 0,
        total_cars_rejected: data.totalCarReject ?? 0
      };
      console.log('Mapped undescribed data:', mapped);
      return mapped;
    } catch (error) {
      console.error('Error fetching parking status undescribed cars:', error);
      // Return mock data for development
      return {
        total_cars_in_parking: 0,
        total_cars_entered: 0,
        total_cars_exited: 0,
        total_cars_rejected: 0
      };
    }
  }
}

export default new ReportsService(); 