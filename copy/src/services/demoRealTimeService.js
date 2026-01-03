/**
 * Demo Real-time Service
 * Simulates real-time updates for demonstration purposes
 */
class DemoRealTimeService {
  constructor() {
    this.connected = false;
    this.listeners = new Map();
    this.demoInterval = null;
  }

  /**
   * Initialize demo service
   */
  initialize() {
    console.log('Initializing demo real-time service');
    this.connected = true;
    
    // Start demo updates
    this.startDemoUpdates();
    
    return true;
  }

  /**
   * Start demo updates
   */
  startDemoUpdates() {
    // Simulate periodic updates
    this.demoInterval = setInterval(() => {
      // Simulate random car entries
      if (Math.random() > 0.7) { // 30% chance every 5 seconds
        this.simulateCarUpdate();
      }
    }, 5000);
  }

  /**
   * Simulate car update
   */
  simulateCarUpdate() {
    const actions = ['created', 'updated'];
    const action = actions[Math.floor(Math.random() * actions.length)];
    
    const mockData = {
      action: action,
      car: {
        id: Date.now(),
        code: `DEMO${Date.now()}`,
        plate_number: `DEMO-${Math.floor(Math.random() * 1000)}`,
        status: Math.random() > 0.5 ? '1' : '2',
        fee: Math.floor(Math.random() * 50) + 10,
        car_type: ['Sedan', 'SUV', 'Truck', 'Motorcycle'][Math.floor(Math.random() * 4)],
        created_at: new Date().toISOString(),
        created_by: 'Demo User'
      },
      timestamp: new Date().toISOString()
    };

    // Trigger car update listeners
    const carListeners = this.listeners.get('car-details');
    if (carListeners && carListeners.callback) {
      carListeners.callback(mockData);
    }
  }

  /**
   * Listen to car updates
   */
  listenToCarUpdates(callback) {
    this.listeners.set('car-details', { callback });
    console.log('Demo: Listening to car updates');
    return { callback };
  }

  /**
   * Listen to parking updates
   */
  listenToParkingUpdates(callback) {
    this.listeners.set('parking-status', { callback });
    console.log('Demo: Listening to parking updates');
    return { callback };
  }

  /**
   * Listen to user activity updates
   */
  listenToUserActivityUpdates(callback) {
    this.listeners.set('user-activity', { callback });
    console.log('Demo: Listening to user activity updates');
    return { callback };
  }

  /**
   * Stop listening
   */
  stopListening(channelName) {
    this.listeners.delete(channelName);
    console.log(`Demo: Stopped listening to ${channelName}`);
  }

  /**
   * Stop all listeners
   */
  stopAllListeners() {
    this.listeners.clear();
  }

  /**
   * Disconnect
   */
  disconnect() {
    if (this.demoInterval) {
      clearInterval(this.demoInterval);
      this.demoInterval = null;
    }
    this.connected = false;
    this.stopAllListeners();
    console.log('Demo real-time service disconnected');
  }

  /**
   * Get connection status
   */
  isConnected() {
    return this.connected;
  }

  /**
   * Update auth token (no-op for demo)
   */
  updateAuthToken(token) {
    // No-op for demo
  }
}

// Create singleton instance
const demoRealTimeService = new DemoRealTimeService();

export default demoRealTimeService; 