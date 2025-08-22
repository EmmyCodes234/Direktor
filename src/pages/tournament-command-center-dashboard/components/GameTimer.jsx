import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const GameTimer = ({ matchId, player1Name, player2Name, timeLimit = 25, onTimeExpired }) => {
  const [timeRemaining, setTimeRemaining] = useState({
    player1: timeLimit * 60, // Convert to seconds
    player2: timeLimit * 60
  });
  const [isActive, setIsActive] = useState(false);
  const [currentPlayer, setCurrentPlayer] = useState(null); // 'player1' or 'player2'
  const [gameStatus, setGameStatus] = useState('waiting'); // waiting, active, paused, completed
  const [warnings, setWarnings] = useState({
    player1: { warning: false, critical: false },
    player2: { warning: false, critical: false }
  });
  
  const intervalRef = useRef(null);
  const lastSwitchTime = useRef(Date.now());

  // Warning thresholds (in seconds)
  const WARNING_THRESHOLD = 300; // 5 minutes
  const CRITICAL_THRESHOLD = 60; // 1 minute

  useEffect(() => {
    if (isActive && currentPlayer) {
      intervalRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          const newTime = { ...prev };
          newTime[currentPlayer] = Math.max(0, newTime[currentPlayer] - 1);
          
          // Check for warnings
          if (newTime[currentPlayer] <= CRITICAL_THRESHOLD && !warnings[currentPlayer].critical) {
            setWarnings(prev => ({
              ...prev,
              [currentPlayer]: { ...prev[currentPlayer], critical: true }
            }));
            toast.error(`${currentPlayer === 'player1' ? player1Name : player2Name} has less than 1 minute remaining!`);
          } else if (newTime[currentPlayer] <= WARNING_THRESHOLD && !warnings[currentPlayer].warning) {
            setWarnings(prev => ({
              ...prev,
              [currentPlayer]: { ...prev[currentPlayer], warning: true }
            }));
            toast.warning(`${currentPlayer === 'player1' ? player1Name : player2Name} has less than 5 minutes remaining!`);
          }
          
          // Check for time expiration
          if (newTime[currentPlayer] === 0) {
            handleTimeExpired(currentPlayer);
          }
          
          return newTime;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive, currentPlayer, warnings, player1Name, player2Name]);

  const handleTimeExpired = (player) => {
    setIsActive(false);
    setGameStatus('completed');
    toast.error(`Time expired for ${player === 'player1' ? player1Name : player2Name}!`);
    onTimeExpired?.(player);
  };

  const startGame = () => {
    setIsActive(true);
    setCurrentPlayer('player1');
    setGameStatus('active');
    lastSwitchTime.current = Date.now();
  };

  const pauseGame = () => {
    setIsActive(false);
    setGameStatus('paused');
  };

  const resumeGame = () => {
    setIsActive(true);
    setGameStatus('active');
  };

  const switchPlayer = () => {
    if (!isActive) return;
    
    const now = Date.now();
    const timeSinceLastSwitch = now - lastSwitchTime.current;
    
    // Minimum 10 seconds between switches to prevent abuse
    if (timeSinceLastSwitch < 10000) {
      toast.error('Please wait at least 10 seconds between player switches');
      return;
    }
    
    setCurrentPlayer(prev => prev === 'player1' ? 'player2' : 'player1');
    lastSwitchTime.current = now;
  };

  const resetTimer = () => {
    setTimeRemaining({
      player1: timeLimit * 60,
      player2: timeLimit * 60
    });
    setWarnings({
      player1: { warning: false, critical: false },
      player2: { warning: false, critical: false }
    });
    setIsActive(false);
    setCurrentPlayer(null);
    setGameStatus('waiting');
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getPlayerStatus = (player) => {
    if (gameStatus === 'waiting') return 'waiting';
    if (gameStatus === 'completed') return 'completed';
    if (currentPlayer === player) return 'active';
    return 'waiting';
  };

  const getTimeColor = (player) => {
    const time = timeRemaining[player];
    if (time === 0) return 'text-destructive';
    if (time <= CRITICAL_THRESHOLD) return 'text-destructive';
    if (time <= WARNING_THRESHOLD) return 'text-warning';
    return 'text-foreground';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-background border border-border rounded-lg p-6 shadow-lg"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">Game Timer</h3>
        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            gameStatus === 'active' ? 'bg-success/20 text-success' :
            gameStatus === 'paused' ? 'bg-warning/20 text-warning' :
            gameStatus === 'completed' ? 'bg-destructive/20 text-destructive' :
            'bg-muted text-muted-foreground'
          }`}>
            {gameStatus.charAt(0).toUpperCase() + gameStatus.slice(1)}
          </span>
        </div>
      </div>

      {/* Player Timers */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* Player 1 Timer */}
        <div className={`p-4 rounded-lg border-2 transition-all ${
          getPlayerStatus('player1') === 'active' ? 'border-primary bg-primary/5' :
          getPlayerStatus('player1') === 'completed' ? 'border-destructive bg-destructive/5' :
          'border-border bg-muted/20'
        }`}>
          <div className="text-center">
            <p className="text-sm font-medium text-muted-foreground mb-2">{player1Name}</p>
            <p className={`text-3xl font-mono font-bold ${getTimeColor('player1')}`}>
              {formatTime(timeRemaining.player1)}
            </p>
            <div className="flex justify-center mt-2">
              {warnings.player1.warning && (
                <Icon name="AlertTriangle" size={16} className="text-warning" />
              )}
              {warnings.player1.critical && (
                <Icon name="AlertCircle" size={16} className="text-destructive" />
              )}
            </div>
          </div>
        </div>

        {/* Player 2 Timer */}
        <div className={`p-4 rounded-lg border-2 transition-all ${
          getPlayerStatus('player2') === 'active' ? 'border-primary bg-primary/5' :
          getPlayerStatus('player2') === 'completed' ? 'border-destructive bg-destructive/5' :
          'border-border bg-muted/20'
        }`}>
          <div className="text-center">
            <p className="text-sm font-medium text-muted-foreground mb-2">{player2Name}</p>
            <p className={`text-3xl font-mono font-bold ${getTimeColor('player2')}`}>
              {formatTime(timeRemaining.player2)}
            </p>
            <div className="flex justify-center mt-2">
              {warnings.player2.warning && (
                <Icon name="AlertTriangle" size={16} className="text-warning" />
              )}
              {warnings.player2.critical && (
                <Icon name="AlertCircle" size={16} className="text-destructive" />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-2 justify-center">
        {gameStatus === 'waiting' && (
          <Button onClick={startGame} className="bg-success hover:bg-success/90">
            <Icon name="Play" size={16} className="mr-2" />
            Start Game
          </Button>
        )}
        
        {gameStatus === 'active' && (
          <>
            <Button onClick={pauseGame} variant="outline">
              <Icon name="Pause" size={16} className="mr-2" />
              Pause
            </Button>
            <Button onClick={switchPlayer} className="bg-primary hover:bg-primary/90">
              <Icon name="RefreshCw" size={16} className="mr-2" />
              Switch Player
            </Button>
          </>
        )}
        
        {gameStatus === 'paused' && (
          <Button onClick={resumeGame} className="bg-success hover:bg-success/90">
            <Icon name="Play" size={16} className="mr-2" />
            Resume
          </Button>
        )}
        
        <Button onClick={resetTimer} variant="outline">
          <Icon name="RotateCcw" size={16} className="mr-2" />
          Reset
        </Button>
      </div>

      {/* Current Player Indicator */}
      {currentPlayer && gameStatus === 'active' && (
        <div className="mt-4 p-3 bg-primary/10 border border-primary/20 rounded-lg">
          <p className="text-sm text-center text-primary font-medium">
            <Icon name="Clock" size={14} className="mr-2" />
            {currentPlayer === 'player1' ? player1Name : player2Name} is currently playing
          </p>
        </div>
      )}
    </motion.div>
  );
};

export default GameTimer;
