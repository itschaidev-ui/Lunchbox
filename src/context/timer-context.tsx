
'use client';

import { createContext, useContext, useState, useEffect, ReactNode, Dispatch, SetStateAction } from 'react';
import { addMinutes, differenceInSeconds } from 'date-fns';

const formatTime = (totalSeconds: number) => {
    if (totalSeconds < 0) totalSeconds = 0;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

type TimerState = {
    endTime: string | null;
    isActive: boolean;
    isMinimized: boolean;
    position: { x: number; y: number };
};

type TimerContextType = {
    isActive: boolean;
    isMinimized: boolean;
    displayTime: string;
    position: { x: number; y: number };
    startTimer: (minutes: number) => void;
    closeTimer: () => void;
    toggleMinimized: () => void;
    setPosition: Dispatch<SetStateAction<{ x: number, y: number }>>;
};

const TimerContext = createContext<TimerContextType | undefined>(undefined);

const getInitialState = (): TimerState => ({
  endTime: null,
  isActive: false,
  isMinimized: false,
  position: { x: 0, y: 0 },
});


export function TimerProvider({ children }: { children: ReactNode }) {
    const [timerState, setTimerState] = useState<TimerState>(getInitialState);
    const [displayTime, setDisplayTime] = useState('00:00');
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
        try {
            const savedStateString = localStorage.getItem('timerState');
            if (savedStateString) {
                const savedState = JSON.parse(savedStateString);
                if (savedState.isActive && savedState.endTime && new Date(savedState.endTime) < new Date()) {
                    setTimerState({ ...savedState, isActive: false, endTime: null });
                } else {
                    setTimerState(savedState);
                }
            } else {
                 setTimerState(prevState => ({
                    ...prevState,
                    position: {
                        x: window.innerWidth - 300,
                        y: window.innerHeight - 200,
                    }
                }));
            }
        } catch (error) {
            console.error('Failed to parse timer state from localStorage', error);
            localStorage.removeItem('timerState');
        }
    }, []);

    useEffect(() => {
        if(isClient) {
            localStorage.setItem('timerState', JSON.stringify(timerState));
        }
    }, [timerState, isClient]);

    useEffect(() => {
        let interval: NodeJS.Timeout | undefined;

        if (timerState.isActive && timerState.endTime) {
            interval = setInterval(() => {
                const now = new Date();
                const end = new Date(timerState.endTime!);
                const secondsLeft = differenceInSeconds(end, now);

                if (secondsLeft <= 0) {
                    setDisplayTime('00:00');
                    setTimerState(prev => ({ ...prev, isActive: false, endTime: null }));
                    new Audio('https://freesound.org/data/previews/391/391539_5121236-lq.mp3').play();
                    clearInterval(interval);
                } else {
                    setDisplayTime(formatTime(secondsLeft));
                }
            }, 1000);
        }

        return () => clearInterval(interval);
    }, [timerState.isActive, timerState.endTime]);
    
    useEffect(() => {
        if (timerState.isActive && timerState.endTime) {
            const secondsLeft = differenceInSeconds(new Date(timerState.endTime), new Date());
            setDisplayTime(formatTime(secondsLeft > 0 ? secondsLeft : 0));
        } else if (!timerState.isActive) {
            setDisplayTime('00:00');
        }
    }, [timerState.isActive, timerState.endTime]);

    const startTimer = (minutes: number) => {
        const endTime = addMinutes(new Date(), minutes);
        setTimerState(prev => ({
            ...prev,
            endTime: endTime.toISOString(),
            isActive: true,
            isMinimized: false,
        }));
    };

    const closeTimer = () => {
        setTimerState(prev => ({ ...prev, isActive: false, endTime: null }));
    };
    
    const toggleMinimized = () => {
        setTimerState(prev => ({ ...prev, isMinimized: !prev.isMinimized }));
    };

    const setPosition = (newPosition: { x: number; y: number; } | ((prevState: { x: number; y: number; }) => { x: number; y: number; })) => {
        setTimerState(prev => ({
            ...prev,
            position: typeof newPosition === 'function' ? newPosition(prev.position) : newPosition
        }));
    }
    

    const contextValue = {
         isActive: isClient ? timerState.isActive : false, 
         isMinimized: timerState.isMinimized, 
         displayTime, 
         position: timerState.position,
         startTimer, 
         closeTimer, 
         toggleMinimized, 
         setPosition
    };

    return (
        <TimerContext.Provider value={contextValue}>
            {children}
        </TimerContext.Provider>
    );
}

export function useTimer() {
    const context = useContext(TimerContext);
    if (context === undefined) {
        throw new Error('useTimer must be used within a TimerProvider');
    }
    return context;
}
