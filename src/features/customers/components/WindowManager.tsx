import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Animated, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type WindowState = 'normal' | 'minimized' | 'maximized';

interface Window {
  id: string;
  component: React.ReactNode;
  title: string;
  state: WindowState;
  position?: { x: number; y: number };
  size?: { width: number; height: number };
  minimizedOrder?: number;
}

interface WindowManagerContextType {
  openWindow: (window: Omit<Window, 'state'>) => string;
  closeWindow: (id: string) => void;
  minimizeWindow: (id: string) => void;
  maximizeWindow: (id: string) => void;
  restoreWindow: (id: string) => void;
  windows: Window[];
  minimizedWindows: Window[];
}

const WindowManagerContext = createContext<WindowManagerContextType | undefined>(undefined);

export const useWindowManager = () => {
  const context = useContext(WindowManagerContext);
  if (!context) {
    throw new Error('useWindowManager must be used within WindowManagerProvider');
  }
  return context;
};

export const WindowManagerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [windows, setWindows] = useState<Window[]>([]);
  const [minimizedOrder, setMinimizedOrder] = useState(0);

  const openWindow = useCallback((window: Omit<Window, 'state'>): string => {
    const id = window.id || `window-${Date.now()}-${Math.random()}`;
    setWindows((prev) => {
      // Check if window already exists
      const existingIndex = prev.findIndex((w) => w.id === id);
      if (existingIndex !== -1) {
        // Restore existing window
        const existing = prev[existingIndex];
        return prev.map((w) =>
          w.id === id
            ? { ...w, state: 'normal' as WindowState, minimizedOrder: undefined }
            : w
        );
      }
      return [
        ...prev,
        { ...window, id, state: 'normal' as WindowState },
      ];
    });
    return id;
  }, []);

  const closeWindow = useCallback((id: string) => {
    setWindows((prev) => prev.filter((w) => w.id !== id));
  }, []);

  const minimizeWindow = useCallback((id: string) => {
    setWindows((prev) =>
      prev.map((w) =>
        w.id === id
          ? { ...w, state: 'minimized' as WindowState, minimizedOrder: minimizedOrder + 1 }
          : w
      )
    );
    setMinimizedOrder((prev) => prev + 1);
  }, [minimizedOrder]);

  const maximizeWindow = useCallback((id: string) => {
    setWindows((prev) =>
      prev.map((w) => (w.id === id ? { ...w, state: 'maximized' as WindowState } : w))
    );
  }, []);

  const restoreWindow = useCallback((id: string) => {
    setWindows((prev) =>
      prev.map((w) =>
        w.id === id
          ? { ...w, state: 'normal' as WindowState, minimizedOrder: undefined }
          : w
      )
    );
  }, []);

  const minimizedWindows = windows.filter((w) => w.state === 'minimized').sort((a, b) => 
    (b.minimizedOrder || 0) - (a.minimizedOrder || 0)
  );

  return (
    <WindowManagerContext.Provider
      value={{
        openWindow,
        closeWindow,
        minimizeWindow,
        maximizeWindow,
        restoreWindow,
        windows,
        minimizedWindows,
      }}
    >
      {children}
      <WindowRenderer windows={windows} />
      {minimizedWindows.length > 0 && <MinimizedTray windows={minimizedWindows} />}
    </WindowManagerContext.Provider>
  );
};

const WindowRenderer: React.FC<{ windows: Window[] }> = ({ windows }) => {
  const activeWindows = windows.filter((w) => w.state !== 'minimized');

  return (
    <>
      {activeWindows.map((window) => (
        <WindowComponent key={window.id} window={window} />
      ))}
    </>
  );
};

const WindowComponent: React.FC<{ window: Window }> = ({ window }) => {
  const context = useContext(WindowManagerContext);
  if (!context) return null;
  const { closeWindow, minimizeWindow, maximizeWindow, restoreWindow } = context;
  const [slideAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, []);

  const isMaximized = window.state === 'maximized';
  const windowStyle = isMaximized
    ? styles.maximizedWindow
    : styles.normalWindow;

  return (
    <View style={styles.windowContainer}>
      <Animated.View
        style={[
          windowStyle,
          {
            opacity: slideAnim,
            transform: [
              {
                translateY: slideAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [50, 0],
                }),
              },
            ],
          },
        ]}
      >
        <WindowHeader
          title={window.title}
          state={window.state}
          onClose={() => closeWindow(window.id)}
          onMinimize={() => minimizeWindow(window.id)}
          onMaximize={() => maximizeWindow(window.id)}
          onRestore={() => restoreWindow(window.id)}
        />
        <View style={styles.windowContent}>{window.component}</View>
      </Animated.View>
    </View>
  );
};

const WindowHeader: React.FC<{
  title: string;
  state: WindowState;
  onClose: () => void;
  onMinimize: () => void;
  onMaximize: () => void;
  onRestore: () => void;
}> = ({ title, state, onClose, onMinimize, onMaximize, onRestore }) => {
  return (
    <View style={styles.windowHeader}>
      <Text style={styles.windowTitle} numberOfLines={1}>
        {title}
      </Text>
      <View style={styles.windowControls}>
        <TouchableOpacity
          style={styles.controlButton}
          onPress={state === 'maximized' ? onRestore : onMinimize}
        >
          <Ionicons
            name={state === 'maximized' ? 'resize-outline' : 'remove-outline'}
            size={18}
            color="#666"
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.controlButton}
          onPress={state === 'maximized' ? onRestore : onMaximize}
        >
          <Ionicons
            name={state === 'maximized' ? 'expand-outline' : 'expand-outline'}
            size={18}
            color="#666"
          />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.controlButton, styles.closeButton]} onPress={onClose}>
          <Ionicons name="close" size={18} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const MinimizedTray: React.FC<{ windows: Window[] }> = ({ windows }) => {
  const context = useContext(WindowManagerContext);
  if (!context) return null;
  const { restoreWindow, closeWindow } = context;
  const [slideUp] = useState(new Animated.Value(0));

  useEffect(() => {
    Animated.spring(slideUp, {
      toValue: 1,
      useNativeDriver: false,
      tension: 50,
      friction: 8,
    }).start();
  }, []);

  if (windows.length === 0) return null;

  return (
    <Animated.View
      style={[
        styles.minimizedTray,
        {
          transform: [
            {
              translateY: slideUp.interpolate({
                inputRange: [0, 1],
                outputRange: [100, 0],
              }),
            },
          ],
        },
      ]}
    >
      {windows.map((window) => (
        <TouchableOpacity
          key={window.id}
          style={styles.minimizedWindowItem}
          onPress={() => restoreWindow(window.id)}
          activeOpacity={0.7}
        >
          <Text style={styles.minimizedWindowTitle} numberOfLines={1}>
            {window.title}
          </Text>
          <TouchableOpacity
            style={styles.minimizedCloseButton}
            onPress={(e) => {
              e.stopPropagation();
              closeWindow(window.id);
            }}
          >
            <Ionicons name="close" size={14} color="#666" />
          </TouchableOpacity>
        </TouchableOpacity>
      ))}
    </Animated.View>
  );
};

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  windowContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
    pointerEvents: 'box-none',
  },
  normalWindow: {
    width: width * 0.9,
    maxWidth: 1200,
    height: height * 0.85,
    maxHeight: 800,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
    alignSelf: 'center',
    marginTop: height * 0.05,
  },
  maximizedWindow: {
    width: width,
    height: height,
    backgroundColor: '#fff',
    borderRadius: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  windowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  windowTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    flex: 1,
    marginRight: 12,
  },
  windowControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  controlButton: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    backgroundColor: '#ef4444',
  },
  windowContent: {
    flex: 1,
    overflow: 'hidden',
  },
  minimizedTray: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
    zIndex: 999,
    maxHeight: 80,
  },
  minimizedWindowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginHorizontal: 4,
    minWidth: 150,
    maxWidth: 250,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  minimizedWindowTitle: {
    fontSize: 13,
    fontWeight: '500',
    color: '#475569',
    flex: 1,
    marginRight: 8,
  },
  minimizedCloseButton: {
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

