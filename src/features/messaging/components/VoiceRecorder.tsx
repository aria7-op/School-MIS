import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  PanGestureHandler,
  State
} from 'react-native';
import { useTheme } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONTS } from '../../../theme';

interface VoiceRecorderProps {
  onRecordingComplete: (audioData: any) => void;
  onCancel: () => void;
  maxDuration?: number; // in seconds
}

const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
  onRecordingComplete,
  onCancel,
  maxDuration = 60
}) => {
  const { colors } = useTheme();
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  
  const recordingTimer = useRef<NodeJS.Timeout | null>(null);
  const waveformAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isRecording && !isPaused) {
      recordingTimer.current = setInterval(() => {
        setRecordingTime(prev => {
          if (prev >= maxDuration) {
            stopRecording();
            return prev;
          }
          return prev + 0.1;
        });
      }, 100);
    } else {
      if (recordingTimer.current) {
        clearInterval(recordingTimer.current);
      }
    }

    return () => {
      if (recordingTimer.current) {
        clearInterval(recordingTimer.current);
      }
    };
  }, [isRecording, isPaused, maxDuration]);

  useEffect(() => {
    if (isRecording) {
      // Simulate audio level changes
      const audioInterval = setInterval(() => {
        setAudioLevel(Math.random() * 100);
      }, 100);

      return () => clearInterval(audioInterval);
    }
  }, [isRecording]);

  const startRecording = () => {
    setIsRecording(true);
    setRecordingTime(0);
    setIsPaused(false);
    
    // Start waveform animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(waveformAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(waveformAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const stopRecording = () => {
    setIsRecording(false);
    setIsPaused(false);
    
    // Simulate audio data
    const audioData = {
      duration: recordingTime,
      timestamp: new Date().toISOString(),
      data: 'mock-audio-data',
      size: Math.floor(recordingTime * 16000) // Approximate size
    };
    
    onRecordingComplete(audioData);
  };

  const pauseRecording = () => {
    setIsPaused(!isPaused);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSlideToCancel = (event: any) => {
    const { translationX } = event.nativeEvent;
    slideAnim.setValue(translationX);
    
    if (translationX < -100) {
      onCancel();
    }
  };

  const handleSlideEnd = () => {
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
    }).start();
  };

  const renderWaveform = () => {
    const bars = Array.from({ length: 20 }, (_, i) => i);
    
    return (
      <View style={styles.waveformContainer}>
        {bars.map((_, index) => (
          <Animated.View
            key={index}
            style={[
              styles.waveformBar,
              {
                backgroundColor: COLORS.primary,
                height: waveformAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [4, audioLevel * 0.3 + 4],
                }),
              },
            ]}
          />
        ))}
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
          <Text style={[styles.cancelText, { color: colors.text }]}>Cancel</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Voice Message
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Recording Interface */}
      <View style={styles.recordingContainer}>
        {!isRecording ? (
          <TouchableOpacity
            style={[styles.recordButton, { backgroundColor: COLORS.primary }]}
            onPress={startRecording}
          >
            <Ionicons name="mic" size={32} color="white" />
            <Text style={styles.recordButtonText}>Tap to Record</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.recordingInterface}>
            {/* Waveform */}
            {renderWaveform()}
            
            {/* Time Display */}
            <Text style={[styles.timeDisplay, { color: colors.text }]}>
              {formatTime(recordingTime)}
            </Text>
            
            {/* Recording Status */}
            <View style={styles.statusContainer}>
              <View style={[styles.recordingIndicator, { backgroundColor: COLORS.error }]} />
              <Text style={[styles.statusText, { color: colors.textSecondary }]}>
                {isPaused ? 'Paused' : 'Recording...'}
              </Text>
            </View>
            
            {/* Controls */}
            <View style={styles.controlsContainer}>
              <TouchableOpacity
                style={[styles.controlButton, { backgroundColor: colors.card }]}
                onPress={pauseRecording}
              >
                <Ionicons 
                  name={isPaused ? 'play' : 'pause'} 
                  size={24} 
                  color={colors.text} 
                />
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.stopButton, { backgroundColor: COLORS.error }]}
                onPress={stopRecording}
              >
                <Ionicons name="stop" size={24} color="white" />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      {/* Slide to Cancel */}
      {isRecording && (
        <PanGestureHandler
          onGestureEvent={handleSlideToCancel}
          onHandlerStateChange={({ nativeEvent }) => {
            if (nativeEvent.state === State.END) {
              handleSlideEnd();
            }
          }}
        >
          <Animated.View
            style={[
              styles.slideContainer,
              {
                transform: [{ translateX: slideAnim }],
              },
            ]}
          >
            <Text style={[styles.slideText, { color: colors.textSecondary }]}>
              Slide to cancel
            </Text>
          </Animated.View>
        </PanGestureHandler>
      )}

      {/* Info */}
      <View style={styles.infoContainer}>
        <Text style={[styles.infoText, { color: colors.textSecondary }]}>
          Maximum recording time: {maxDuration}s
        </Text>
        <Text style={[styles.infoText, { color: colors.textSecondary }]}>
          Tap and hold to record, release to send
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
  },
  cancelButton: {
    padding: SPACING.sm,
  },
  cancelText: {
    fontSize: FONTS.sizes.md,
  },
  headerTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: FONTS.weights.bold,
  },
  headerSpacer: {
    width: 48,
  },
  recordingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  recordButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
  },
  recordButtonText: {
    color: 'white',
    fontSize: FONTS.sizes.sm,
    fontWeight: FONTS.weights.medium,
    marginTop: SPACING.sm,
  },
  recordingInterface: {
    alignItems: 'center',
    width: '100%',
  },
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 60,
    marginBottom: SPACING.md,
  },
  waveformBar: {
    width: 3,
    marginHorizontal: 1,
    borderRadius: 2,
  },
  timeDisplay: {
    fontSize: FONTS.sizes.xl,
    fontWeight: FONTS.weights.bold,
    marginBottom: SPACING.sm,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  recordingIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: SPACING.sm,
  },
  statusText: {
    fontSize: FONTS.sizes.sm,
  },
  controlsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  controlButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: SPACING.sm,
  },
  stopButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: SPACING.sm,
  },
  slideContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.md,
  },
  slideText: {
    fontSize: FONTS.sizes.sm,
    fontStyle: 'italic',
  },
  infoContainer: {
    padding: SPACING.md,
    alignItems: 'center',
  },
  infoText: {
    fontSize: FONTS.sizes.xs,
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
});

export default VoiceRecorder; 
