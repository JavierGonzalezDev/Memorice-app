import { useEffect, useRef } from 'react';
import { TouchableOpacity, Text, StyleSheet, Animated } from 'react-native';

interface CardProps {
  card: {
    id: number;
    icon: string;
    flipped: boolean;
    matched: boolean;
  };
  onPress: () => void;
}

export default function Card({ card, onPress }: CardProps) {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: card.flipped || card.matched ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [card.flipped, card.matched]);

  const rotateY = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const frontOpacity = animatedValue.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 0, 0],
  });

  const backOpacity = animatedValue.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0, 1],
  });

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.9}>
      <Animated.View
        style={[
          styles.card,
          {
            transform: [{ rotateY }],
          },
        ]}
      >
        {/* Parte frontal */}
        <Animated.View style={[styles.face, { opacity: frontOpacity }]}>
          <Text style={styles.text}>❓</Text>
        </Animated.View>

        {/* Parte trasera */}
        <Animated.View style={[styles.face, styles.back, { opacity: backOpacity }]}>
          <Text style={styles.text}>{card.icon}</Text>
        </Animated.View>
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 70,
    height: 70,
    margin: 5,
    borderRadius: 10,
    backgroundColor: "#333",
    justifyContent: "center",
    alignItems: "center",
  },
  face: {
    position: "absolute",
    justifyContent: "center",
    alignItems: "center",
  },
  back: {
    transform: [{ rotateY: '180deg' }],
  },
  text: {
    fontSize: 30,
  },
});