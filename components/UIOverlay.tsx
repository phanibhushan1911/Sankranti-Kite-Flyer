import React from 'react';
import { GameState, TutorialStep } from '../types';
import { PLAYER_KITE_OPTIONS, TUTORIAL_INSTRUCTIONS } from '../constants';

interface UIOverlayProps {
  gameState: GameState;
  score: number;
  highScore: number;
  onStart: () => void;
  onStartTutorial: () => void;
  isMuted: boolean;
  toggleMute: () => void;
  playerColor: string;
  setPlayerColor: (color: string) => void;
  tutorialStep: TutorialStep;
}

const UIOverlay: React.FC<UIOverlayProps> = ({ 
  gameState, 
  score, 
  highScore, 
  onStart, 
  onStartTutorial,
  isMuted, 
  toggleMute,
  playerColor,
  setPlayerColor,
  tutorialStep
}) => {
  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-between p-6">
      
      {/* Top Bar: Mute and Score HUD */}
      <div className="w-full flex justify-between items-start pointer-events-auto">
        <button 
          onClick={toggleMute}
          className="bg-white/80 p-3 rounded-full shadow-lg hover:bg-white transition-colors text-gray-700"
          title={isMuted ? "Unmute" : "Mute"}
        >
          {isMuted ? (
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
               <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 9.75L19.5 12m0 0l2.25 2.25M19.5 12l2.25-2.25M19.5 12l-2.25 2.25m-10.5-6l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
             </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
            </svg>
          )}
        </button>

        {gameState === GameState.TUTORIAL ? (
             <div className="flex flex-col items-end">
                 <button 
                  onClick={onStart}
                  className="bg-red-500 text-white font-bold py-2 px-6 rounded-full shadow-lg hover:bg-red-600 transition mb-4 game-font"
                 >
                     Skip Tutorial
                 </button>
             </div>
        ) : (
            <div className="flex flex-col items-end gap-2">
                <div className="bg-white/90 border-4 border-orange-500 rounded-xl px-6 py-2 shadow-lg transform rotate-1">
                <p className="game-font text-2xl text-orange-600">Score: {score}</p>
                </div>
                {highScore > 0 && (
                    <div className="bg-yellow-400/90 border-2 border-yellow-600 rounded-lg px-4 py-1 shadow-md transform -rotate-1">
                        <p className="game-font text-lg text-yellow-900">High Score: {highScore}</p>
                    </div>
                )}
            </div>
        )}
      </div>

      {/* Tutorial Overlay Text */}
      {gameState === GameState.TUTORIAL && (
          <div className="absolute top-24 left-0 w-full flex justify-center pointer-events-none">
              <div className="bg-black/60 backdrop-blur-md px-8 py-4 rounded-2xl border-2 border-white/50 text-center animate-pulse">
                  <p className="game-font text-white text-2xl md:text-3xl drop-shadow-lg">
                      {TUTORIAL_INSTRUCTIONS[tutorialStep]}
                  </p>
              </div>
          </div>
      )}

      {/* Start Screen */}
      {gameState === GameState.START && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm pointer-events-auto">
          <div className="bg-white p-8 rounded-3xl shadow-2xl text-center border-b-8 border-r-8 border-blue-600 max-w-md mx-4 transform transition-all duration-300 overflow-y-auto max-h-[90vh]">
            <h1 className="game-font text-5xl text-blue-600 mb-2 drop-shadow-md">Sankranti</h1>
            <h2 className="game-font text-4xl text-orange-500 mb-4 drop-shadow-md">Kite Flyer</h2>
            <p className="text-gray-600 mb-6 text-lg font-medium">
              Drag to fly your Patang. <br/>
              Cut enemy strings with your kite! <br/>
              <span className="text-red-500 font-bold">Avoid the Sky Lanterns!</span>
            </p>

            {/* Kite Customization Section */}
            <div className="mb-8">
              <p className="text-gray-500 mb-3 font-bold uppercase tracking-wide text-sm">Choose Your Kite</p>
              <div className="flex gap-4 justify-center flex-wrap px-4">
                {PLAYER_KITE_OPTIONS.map((opt) => (
                  <button
                    key={opt.color}
                    onClick={() => setPlayerColor(opt.color)}
                    className={`w-8 h-8 transform rotate-45 m-2 transition-all duration-200 outline-none
                      ${playerColor === opt.color 
                        ? 'scale-125 ring-4 ring-offset-2 ring-blue-500 z-10 shadow-lg' 
                        : 'scale-100 hover:scale-110 opacity-80 hover:opacity-100 shadow-sm'
                      }`}
                    style={{ backgroundColor: opt.color }}
                    title={opt.name}
                    aria-label={`Select ${opt.name}`}
                  />
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-3 w-full">
                <button 
                  onClick={onStart}
                  className="game-font bg-gradient-to-r from-orange-500 to-red-600 text-white text-3xl px-12 py-4 rounded-full shadow-lg hover:shadow-xl hover:from-orange-600 hover:to-red-700 transition-all active:scale-95 w-full"
                >
                  Start Flying
                </button>
                <button 
                  onClick={onStartTutorial}
                  className="game-font bg-blue-500 text-white text-xl px-12 py-3 rounded-full shadow-md hover:bg-blue-600 transition-all active:scale-95 w-full"
                >
                  How to Play?
                </button>
            </div>
          </div>
        </div>
      )}

      {/* Game Over Screen */}
      {gameState === GameState.GAME_OVER && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm pointer-events-auto">
          <div className="bg-white p-8 rounded-3xl shadow-2xl text-center border-b-8 border-r-8 border-red-600">
            <h2 className="game-font text-5xl text-red-600 mb-4">Game Over</h2>
            <p className="game-font text-3xl text-gray-800 mb-2">Score: {score}</p>
            <p className="game-font text-xl text-yellow-600 mb-8">Best: {Math.max(score, highScore)}</p>
            <button 
              onClick={onStart}
              className="game-font bg-blue-500 text-white text-2xl px-8 py-3 rounded-full hover:bg-blue-600 transition-colors shadow-lg"
            >
              Fly Again
            </button>
          </div>
        </div>
      )}

      {/* Controls Hint */}
      {gameState === GameState.PLAYING && score === 0 && (
         <div className="absolute bottom-10 animate-bounce bg-black/20 text-white px-4 py-2 rounded-full">
            <p className="font-bold">Use Mouse or Touch to move</p>
         </div>
      )}
    </div>
  );
};

export default UIOverlay;