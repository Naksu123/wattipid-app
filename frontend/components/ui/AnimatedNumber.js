import React, { useEffect, useRef } from 'react';
import { TextInput, Animated, Easing, StyleSheet } from 'react-native';

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

export default function AnimatedNumber({
  value = 0,
  formatter = (val) => val.toFixed(2),
  style,
  duration = 500,
}) {
  const animatedValue = useRef(new Animated.Value(value)).current;
  const inputRef = useRef(null);
  
  useEffect(() => {
    // Add listener to update the TextInput directly, bypassing React re-renders for maximum performance
    const listenerId = animatedValue.addListener(({ value: animVal }) => {
      if (inputRef.current) {
        inputRef.current.setNativeProps({
          text: formatter(animVal)
        });
      }
    });

    return () => {
      animatedValue.removeListener(listenerId);
    };
  }, [animatedValue, formatter]);

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: value,
      duration,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false, // Must be false to read value in JS listener
    }).start();
  }, [value, duration, animatedValue]);

  return (
    <AnimatedTextInput
      ref={inputRef}
      underlineColorAndroid="transparent"
      editable={false}
      defaultValue={formatter(value)}
      style={[styles.input, style]}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    padding: 0,
    margin: 0,
    color: 'inherit',
  },
});
