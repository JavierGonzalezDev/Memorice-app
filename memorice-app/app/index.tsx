import { useState, useEffect } from 'react';
import { Text, View, TouchableOpacity, StyleSheet } from 'react-native';
import { Audio } from 'expo-av';
import Card from '../components/card';
import { Vibration } from 'react-native';

const allIcons = [
  "🍎","🍌","🍇","🍉","🍓","🍒",
  "🥝","🍍","🥥","🍑","🍋","🍈"
];

const playlist = [
  require('../assets/sounds/elton.mp3'),
  require('../assets/sounds/olivia.mp3'),
  require('../assets/sounds/gotye.mp3'),
  require('../assets/sounds/beat.mp3'),
  require('../assets/sounds/viva.mp3'),
  require('../assets/sounds/bon.mp3'),
  require('../assets/sounds/hey.mp3'),
  require('../assets/sounds/r.e.m.mp3'),
  require('../assets/sounds/sweet.mp3'),
  require('../assets/sounds/queen.mp3'),
  require('../assets/sounds/freak.mp3'),
];



interface Card {
  id: number;
  icon: string;
  flipped: boolean;
  matched: boolean;
}

export default function App() {

  
  // 🧠 Estados del juego
  const [cards, setCards] = useState<Card[]>([]);
  const [selected, setSelected] = useState<Card[]>([]);
  const [isChecking, setIsChecking] = useState(false);

  const [time, setTime] = useState(0);
  const [isGameActive, setIsGameActive] = useState(false);

  type Screen = 'menu' | 'difficulty' | 'game' | 'win';
  const [screen, setScreen] = useState<Screen>('menu');

  const [moves, setMoves] = useState(0);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy');

  const [isPaused, setIsPaused] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  const [currentTrack, setCurrentTrack] = useState(0);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  async function playTrack(index: number) {
  if (sound) {
    await sound.unloadAsync();
  }

  const { sound: newSound } = await Audio.Sound.createAsync(
    playlist[index],
    { shouldPlay: true }
  );

  setSound(newSound);
  setCurrentTrack(index);
  setIsPlaying(true);

  // cuando termine → siguiente canción
  newSound.setOnPlaybackStatusUpdate((status) => {
    if ((status as any).didJustFinish) {
      nextTrack();
    }
  });
}

async function togglePlay() {
  if (!sound) return;

  if (isPlaying) {
    await sound.pauseAsync();
    setIsPlaying(false);
  } else {
    await sound.playAsync();
    setIsPlaying(true);
  }
}

function nextTrack() {
  const next = (currentTrack + 1) % playlist.length;
  playTrack(next);
}

function prevTrack() {
  const prev = (currentTrack - 1 + playlist.length) % playlist.length;
  playTrack(prev);
}
useEffect(() => {
  playTrack(0);

  return () => {
    if (sound) sound.unloadAsync();
  };
}, []);


 // 🔊 FUNCIÓN DE SONIDO
  async function playSound(soundFile: any) {
    const { sound } = await Audio.Sound.createAsync(soundFile);
    await sound.playAsync();

    sound.setOnPlaybackStatusUpdate((status) => {
      if ((status as any).didJustFinish) {
        sound.unloadAsync();
      }
    });
  }

  // 🃏 Generar cartas
  function generateCards() {
  let pairs = 6;

  if (difficulty === 'medium') pairs = 8;
  if (difficulty === 'hard') pairs = 10;

  const selectedIcons = allIcons.slice(0, pairs);

  return [...selectedIcons, ...selectedIcons]
    .map((icon, index) => ({
      id: index,
      icon,
      flipped: false,
      matched: false
    }))
    .sort(() => Math.random() - 0.5);
}

  // 🔄 Iniciar / reiniciar juego
  function startGame() {
    setCards(generateCards());
    setSelected([]);
    setTime(0);
    setMoves(0);
    setIsGameActive(true);
    setScreen('game');
  }

  // ⏱️ TIMER BIEN CONTROLADO
  useEffect(() => {
    let interval: number;

    if (isGameActive) {
      interval = setInterval(() => {
        setTime(prev => prev + 1);
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isGameActive]);

  // 🧠 Lógica de comparación (sin estados desactualizados)
  useEffect(() => {
    if (selected.length === 2) {
      setIsChecking(true);

      const [first, second] = selected;
      setMoves(prev => prev + 1);
      setTimeout(() => {
        setCards(prevCards => {
          if (first.icon === second.icon) {
            playSound(require('../assets/sounds/match.mp3'));
            Vibration.vibrate(80);
            return prevCards.map(c =>
              c.icon === first.icon ? { ...c, matched: true } : c
            );
          } else {
            playSound(require('../assets/sounds/fail.mp3'));
            Vibration.vibrate(50);
            return prevCards.map(c =>
              c.id === first.id || c.id === second.id
                ? { ...c, flipped: false }
                : c
            );
          }
        });

        setSelected([]);
        setIsChecking(false);
      }, 800);
    }
  }, [selected]);

  // 🏆 DETECTAR FIN DEL JUEGO (forma correcta)
  useEffect(() => {
    if (cards.length > 0 && cards.every(c => c.matched)) {
      playSound(require('../assets/sounds/win.mp3'));
      Vibration.vibrate(200);
      setIsGameActive(false);
      setScreen('win');
    }
  }, [cards]);

  // 🖱️ Manejo de click
  function handleCardPress(card: Card) {
    if (!isGameActive) return;
    if (isChecking) return;
    if (selected.length === 2) return;
    if (card.flipped || card.matched) return;

    playSound(require('../assets/sounds/flip.mp3'));
    Vibration.vibrate(30);

    setCards(prev =>
      prev.map(c =>
        c.id === card.id ? { ...c, flipped: true } : c
      )
    );

    setSelected(prev => [...prev, card]);
  }

  // 💯 Cálculo de puntuación (simple pero efectivo)
  function calculateScore() {
  const pairs = cards.length / 2;
  return pairs * 100 - moves * 5 - time;
  }



  // 🏁 PANTALLA INICIO
  
  if (screen === 'menu') {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>🧠 Memorice</Text>
        <Text style={styles.title}> ❤️Con amor para EVA❤️</Text>

        <TouchableOpacity style={styles.button} onPress={() => setScreen('difficulty')}>
          <Text style={styles.buttonText}>Jugar</Text>
        </TouchableOpacity>
      </View>
    );
  }

// 🏆 PANTALLA VICTORIA
  if (screen === 'win') {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>🎉 ¡Ganaste!</Text>

        <Text style={styles.timer}>⏱️ Tiempo: {time}s</Text>
        <Text style={styles.timer}>🎯 Movimientos: {moves}</Text>
        <Text style={styles.timer}>⭐ Score: {calculateScore()}</Text>

        <TouchableOpacity style={styles.button} onPress={startGame}>
          <Text style={styles.buttonText}>Jugar de nuevo</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: "#444", marginTop: 10 }]}
          onPress={() => setScreen('menu')}
        >
          <Text style={styles.buttonText}>Menú principal</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ⚡ PANTALLA DE SELECCIÓN DE DIFICULTAD
  if (screen === 'difficulty') {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Selecciona dificultad</Text>

      <TouchableOpacity
        onPress={() => setDifficulty('easy')}
        style={[
          styles.button,
          difficulty === 'easy' && styles.selectedButton1
        ]}
      >
        <Text style={styles.buttonText}>Fácil</Text>
      </TouchableOpacity>

            <TouchableOpacity
        onPress={() => setDifficulty('medium')}
        style={[
          styles.button,
          difficulty === 'medium' && styles.selectedButton2
        ]}
      >
        <Text style={styles.buttonText}>Medio</Text>
      </TouchableOpacity>

            <TouchableOpacity
        onPress={() => setDifficulty('hard')}
        style={[
          styles.button,
          difficulty === 'hard' && styles.selectedButton3
        ]}
      >
        <Text style={styles.buttonText}>Difícil</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={startGame}>
        <Text style={styles.buttonText}>Comenzar</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => setScreen('menu')}>
        <Text style={{ color: 'white', marginTop: 10 }}>← Volver</Text>
      </TouchableOpacity>
    </View>
  );
}

// 🎮 JUEGO REAL
return (
  
  <>
    <View style={styles.player}>
      <TouchableOpacity onPress={prevTrack}>
        <Text style={styles.playerText}>⏮️</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={togglePlay}>
        <Text style={styles.playerText}>
          {isPlaying ? "⏸️" : "▶️"}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={nextTrack}>
        <Text style={styles.playerText}>⏭️</Text>
      </TouchableOpacity>
    </View>
    {isPaused && (
      <View style={styles.overlay}>
        {!showExitConfirm ? (
          <>
            <Text style={styles.title}>⏸️ Pausa</Text>

            <TouchableOpacity
              style={styles.button}
              onPress={() => {
                setIsPaused(false);
                setIsGameActive(true);
              }}
            >
              <Text style={styles.buttonText}>Continuar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.button}
              onPress={() => setShowExitConfirm(true)}
            >
              <Text style={styles.buttonText}>Salir</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.title}>¿Seguro que quieres salir?</Text>

            <TouchableOpacity
              style={styles.button}
              onPress={() => {
                setIsPaused(false);
                setShowExitConfirm(false);
                setScreen('menu');
              }}
            >
              <Text style={styles.buttonText}>Sí, salir</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.button}
              onPress={() => setShowExitConfirm(false)}
            >
              <Text style={styles.buttonText}>Cancelar</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    )}
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.pauseButton}
        onPress={() => {
          setIsPaused(true);
          setIsGameActive(false);
        }}
      >
        <Text style={{ color: "white" }}>⏸️</Text>
      </TouchableOpacity>
      <Text style={styles.timer}>⏱️ {time}s</Text>
      <Text style={styles.timer}>🎯 {moves} movimientos</Text>

      <View style={styles.grid}>
        {cards.map((card) => (
          <Card
            key={card.id}
            card={card}
            onPress={() => handleCardPress(card)}
          />
        ))}
      </View>
    </View>
  </>
);
  }

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 28,
    color: "white",
    marginBottom: 20
  },
  timer: {
    color: "white",
    fontSize: 20,
    marginBottom: 10
  },
  subtitle: {
    color: "white",
    fontSize: 18,
    marginBottom: 10
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    width: 320,
    justifyContent: "center"
  },
  card: {
    width: 70,
    height: 70,
    backgroundColor: "#333",
    margin: 5,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 10
  },
  cardText: {
    fontSize: 30
  },
  button: {
    backgroundColor: "#6200ee",
    padding: 15,
    borderRadius: 10
  },
  selectedButton1: {
    backgroundColor: "#00ff04"
  },
  selectedButton2: {
    backgroundColor: "#f2ff00"
  },
  selectedButton3: {
    backgroundColor: "#ff0000"
  },
  pauseButton: {
    position: "absolute",
    top: 40,
    right: 20,
    backgroundColor: "#6200ee",
    padding: 10,
    borderRadius: 8
  },
  buttonText: {
    color: "white",
    fontSize: 18
  },
  player: {
  position: "absolute",
  top: 40,
  width: "100%",
  flexDirection: "row",
  justifyContent: "center",
  gap: 20,
  backgroundColor: "#000",
  padding: 10,
  zIndex: 100
},

playerText: {
  color: "white",
  fontSize: 20
},
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10
  }
});