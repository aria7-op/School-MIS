import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, Animated } from 'react-native';

const ComingSoon = () => {
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleTranslateY = useRef(new Animated.Value(20)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;
  const subtitleTranslateY = useRef(new Animated.Value(20)).current;
  const progressOpacity = useRef(new Animated.Value(0)).current;
  const progressScale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animate title
    Animated.parallel([
      Animated.timing(titleOpacity, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(titleTranslateY, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();

    // Animate subtitle with delay
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(subtitleOpacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(subtitleTranslateY, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ]).start();
    }, 200);

    // Animate progress container with delay
    setTimeout(() => {
      Animated.timing(progressOpacity, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }).start();

      // Looping progress bar animation
      const animateProgress = () => {
        progressScale.setValue(0);
        Animated.sequence([
          Animated.timing(progressScale, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(progressScale, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ]).start(() => animateProgress()); // Loop the animation
      };

      animateProgress();
    }, 400);
  }, []);

  return (
    <View style={styles.container}>
      <Animated.Text
        style={[
          styles.title,
          {
            opacity: titleOpacity,
            transform: [{ translateY: titleTranslateY }],
          },
        ]}
      >
        Coming Soon
      </Animated.Text>
      
      <Animated.Text
        style={[
          styles.subtitle,
          {
            opacity: subtitleOpacity,
            transform: [{ translateY: subtitleTranslateY }],
          },
        ]}
      >
        We're working hard to bring you something amazing. Stay tuned for updates!
      </Animated.Text>
      
      <Animated.View
        style={[
          styles.progressContainer,
          {
            opacity: progressOpacity,
          },
        ]}
      >
        <Animated.View
          style={[
            styles.progressBar,
            {
              transform: [{ scaleX: progressScale }],
            },
          ]}
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  title: {
    fontSize: 48,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 24,
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 24,
    color: '#7f8c8d',
    maxWidth: 600,
    lineHeight: 24 * 1.6,
    marginBottom: 48,
    textAlign: 'center',
  },
  progressContainer: {
    width: 120,
    height: 4,
    backgroundColor: 'rgba(44, 62, 80, 0.2)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: '100%',
    backgroundColor: '#2c3e50',
    transformOrigin: 'left center',
  },
});

export default ComingSoon;
