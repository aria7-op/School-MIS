import Echo from 'laravel-echo';
import io from 'socket.io-client';
import { API_BASE_URL } from '../constants';

// Make Socket.io available globally for Laravel Echo
window.io = io;

/**
 * Real-time Service for WebSocket connections
 * Handles car data updates and other real-time events
 */
class RealTimeService {
  constructor() {
    this.echo = null;
    this.connected = false;
    this.listeners = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  /**
   * Initialize Echo connection
   */
  initialize() {
    try {
      // Check if Echo is available
      if (typeof Echo === 'undefined') {
        console.error('Laravel Echo is not available');
        this.connected = false;
        return false;
      }

      // Check if Socket.io is available
      if (typeof io === 'undefined') {
        console.error('Socket.io client is not available');
        this.connected = false;
        return false;
      }

      // Extract host from API_BASE_URL
      const host = API_BASE_URL.replace('/api', '').replace('http://', '').replace('https://', '');
      
      console.log('Initializing Echo with host:', `http://${host}:6001`);
      
      // Follow the exact guide configuration
      this.echo = new Echo({
        broadcaster: 'socket.io',
        host: `http://${host}:6001` // Match your Echo server config
      });

      this.setupConnectionHandlers();
      this.connected = true;
      console.log('Real-time service initialized successfully');
      
      // Add immediate error detection
      setTimeout(() => {
        if (!this.connected) {
          console.log('Connection failed immediately, switching to demo mode');
        }
      }, 2000);
      
      return true;
    } catch (error) {
      console.error('Failed to initialize real-time service:', error);
      this.connected = false;
      return false;
    }
  }

  /**
   * Setup connection event handlers
   */
  setupConnectionHandlers() {
    if (!this.echo) return;

    // Connection events
    this.echo.connector.socket.on('connect', () => {
      console.log('Real-time connection established');
      this.connected = true;
      this.reconnectAttempts = 0;
    });

    this.echo.connector.socket.on('disconnect', () => {
      console.log('Real-time connection lost');
      this.connected = false;
      this.handleReconnect();
    });

    this.echo.connector.socket.on('connect_error', (error) => {
      console.error('Real-time connection error:', error);
      this.connected = false;
      
      // Check for specific error types that indicate server is not available
      const errorMessage = error.message || '';
      const isServerUnavailable = 
        errorMessage.includes('connection refused') ||
        errorMessage.includes('xhr poll error') ||
        errorMessage.includes('404') ||
        errorMessage.includes('CORS');
      
      if (isServerUnavailable) {
        console.log('WebSocket server not available (CORS/404 error), switching to demo mode');
        return;
      }
      
      this.handleReconnect();
    });

    // Add timeout for connection
    setTimeout(() => {
      if (!this.connected) {
        console.log('Connection timeout, switching to demo mode');
        this.connected = false;
      }
    }, 3000); // Reduced to 3 second timeout for faster fallback
  }

  /**
   * Handle reconnection attempts
   */
  handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        this.initialize();
      }, 2000 * this.reconnectAttempts); // Exponential backoff
    } else {
      console.error('Max reconnection attempts reached');
    }
  }

  /**
   * Listen to car details updates
   * @param {Function} callback - Callback function to handle updates
   * @returns {Object} Channel subscription
   */
  listenToCarUpdates(callback) {
    if (!this.echo) {
      console.error('Echo not initialized');
      return null;
    }

    // Follow the exact guide pattern
    const channel = this.echo.channel('car-details');
    
    channel.listen('car-details-updated', (data) => {
      console.log('Real-time car update:', data);
      // Update your UI here (add, update, or remove car in your state)
      callback(data);
    });

    // Store listener for cleanup
    this.listeners.set('car-details', channel);
    
    // Expose callback globally for fallback mode
    window.realTimeUpdateCallback = callback;
    
    return channel;
  }

  /**
   * Listen to parking status updates
   * @param {Function} callback - Callback function to handle updates
   * @returns {Object} Channel subscription
   */
  listenToParkingUpdates(callback) {
    if (!this.echo) {
      console.error('Echo not initialized');
      return null;
    }

    const channel = this.echo.channel('parking-status');
    
    channel.listen('parking-status-updated', (data) => {
      console.log('Real-time parking update received:', data);
      callback(data);
    });

    // Store listener for cleanup
    this.listeners.set('parking-status', channel);
    
    return channel;
  }

  /**
   * Listen to user activity updates
   * @param {Function} callback - Callback function to handle updates
   * @returns {Object} Channel subscription
   */
  listenToUserActivityUpdates(callback) {
    if (!this.echo) {
      console.error('Echo not initialized');
      return null;
    }

    const channel = this.echo.channel('user-activity');
    
    channel.listen('user-activity-updated', (data) => {
      console.log('Real-time user activity update received:', data);
      callback(data);
    });

    // Store listener for cleanup
    this.listeners.set('user-activity', channel);
    
    return channel;
  }

  /**
   * Stop listening to a specific channel
   * @param {string} channelName - Name of the channel to stop listening
   */
  stopListening(channelName) {
    const channel = this.listeners.get(channelName);
    if (channel) {
      channel.stopListening('car-details-updated');
      channel.stopListening('parking-status-updated');
      channel.stopListening('user-activity-updated');
      this.listeners.delete(channelName);
      console.log(`Stopped listening to ${channelName}`);
    }
  }

  /**
   * Stop listening to all channels
   */
  stopAllListeners() {
    this.listeners.forEach((channel, channelName) => {
      this.stopListening(channelName);
    });
  }

  /**
   * Disconnect from Echo server
   */
  disconnect() {
    if (this.echo) {
      this.stopAllListeners();
      this.echo.disconnect();
      this.echo = null;
      this.connected = false;
      console.log('Real-time service disconnected');
    }
  }

  /**
   * Get connection status
   * @returns {boolean} Connection status
   */
  isConnected() {
    return this.connected;
  }

  /**
   * Update authentication token
   * @param {string} token - New authentication token
   */
  updateAuthToken(token) {
    if (this.echo && this.echo.connector.socket) {
      this.echo.connector.socket.auth = {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        }
      };
    }
  }
}

// Create singleton instance
const realTimeService = new RealTimeService();

export default realTimeService; 