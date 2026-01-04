import React, { useState, useRef, useEffect } from 'react';
import GameCanvas from './components/GameCanvas';
import UIOverlay from './components/UIOverlay';
import { GameState, TutorialStep } from './types';
import { AUDIO_URLS, PLAYER_KITE_OPTIONS } from './constants';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.START);
  const [score, setScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [playerColor, setPlayerColor] = useState<string>(PLAYER_KITE_OPTIONS[0].color);
  const [tutorialStep, setTutorialStep] = useState<TutorialStep>(TutorialStep.MOVEMENT);
  
  const bgmRef = useRef<HTMLAudioElement | null>(null);

  // Initialize High Score
  useEffect(() => {
    const saved = localStorage.getItem('kite_flyer_highscore');
    if (saved) {
      setHighScore(parseInt(saved, 10));
    }
  }, []);

  // Initialize Audio
  useEffect(() => {
    bgmRef.current = new Audio(AUDIO_URLS.BGM);
    bgmRef.current.loop = true;
    bgmRef.current.volume = 0.4;
    
    return () => {
      if (bgmRef.current) {
        bgmRef.current.pause();
        bgmRef.current = null;
      }
    };
  }, []);

  // Update High Score
  useEffect(() => {
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem('kite_flyer_highscore', score.toString());
    }
  }, [score, highScore]);

  useEffect(() => {
    // Play BGM in Playing and Tutorial modes
    if (bgmRef.current) {
        if ((gameState === GameState.PLAYING || gameState === GameState.TUTORIAL) && !isMuted) {
            bgmRef.current.play().catch(e => console.log("Music play failed:", e));
        } else {
            bgmRef.current.pause();
        }
    }
  }, [gameState, isMuted]);

  const handleStart = () => {
    setScore(0);
    setGameState(GameState.PLAYING);
  };

  const handleStartTutorial = () => {
    setScore(0);
    setTutorialStep(TutorialStep.MOVEMENT);
    setGameState(GameState.TUTORIAL);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-sky-300">
      {/* Background container to ensure full coverage */}
      <GameCanvas 
        gameState={gameState} 
        setGameState={setGameState} 
        score={score} 
        setScore={setScore} 
        isMuted={isMuted}
        playerColor={playerColor}
        setTutorialStep={setTutorialStep}
      />
      
      <UIOverlay 
        gameState={gameState} 
        score={score} 
        highScore={highScore}
        onStart={handleStart}
        onStartTutorial={handleStartTutorial}
        isMuted={isMuted}
        toggleMute={toggleMute}
        playerColor={playerColor}
        setPlayerColor={setPlayerColor}
        tutorialStep={tutorialStep}
      />
    </div>
  );
};

export default App;