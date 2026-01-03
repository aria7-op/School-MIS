import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import realTimeService from '../../services/realTimeService';

/**
 * Real-time Demo Component
 * For testing real-time functionality
 */
const RealTimeDemo = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState(null);
  const [messageCount, setMessageCount] = useState(0);

  useEffect(() => {
    // Initialize real-time service
    realTimeService.initialize();
    
    // Listen to car updates
    const channel = realTimeService.listenToCarUpdates((data) => {
      console.log('Demo: Real-time car update received:', data);
      setLastMessage(data);
      setMessageCount(prev => prev + 1);
    });

    // Check connection status
    const checkConnection = () => {
      setIsConnected(realTimeService.isConnected());
    };

    checkConnection();
    const interval = setInterval(checkConnection, 1000);

    return () => {
      clearInterval(interval);
      if (channel) {
        realTimeService.stopListening('car-details');
      }
    };
  }, []);

  const simulateCarEntry = () => {
    // Simulate a car entry event
    const mockData = {
      action: 'created',
      car: {
        id: Date.now(),
        code: `PARK${Date.now()}`,
        plate_number: `DEMO-${Math.floor(Math.random() * 1000)}`,
        status: '1',
        fee: Math.floor(Math.random() * 50) + 10,
        car_type: 'Sedan',
        created_at: new Date().toISOString(),
        created_by: 'Demo User'
      },
      timestamp: new Date().toISOString()
    };

    // Trigger the callback manually for demo
    setLastMessage(mockData);
    setMessageCount(prev => prev + 1);
  };

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Real-time Demo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></div>
              <span className="text-sm font-medium">
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            <Button onClick={simulateCarEntry} variant="outline" size="sm">
              Simulate Car Entry
            </Button>
          </div>

          <div className="space-y-2">
            <div className="text-sm text-gray-600">
              Messages received: {messageCount}
            </div>
            {lastMessage && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Last Message:</h4>
                <pre className="text-xs overflow-auto">
                  {JSON.stringify(lastMessage, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RealTimeDemo; 