'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Volume2, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface VoicePopupProps {
  isOpen: boolean;
  isListening: boolean;
  isSpeaking: boolean;
  isProcessing: boolean;
  userTranscript: string;
  aiResponse: string;
  onClose: () => void;
  onStopListening: () => void;
  onStopSpeaking: () => void;
}

export function VoicePopup({
  isOpen,
  isListening,
  isSpeaking,
  isProcessing,
  userTranscript,
  aiResponse,
  onClose,
  onStopListening,
  onStopSpeaking,
}: VoicePopupProps) {
  const [audioLevel, setAudioLevel] = useState(0);

  useEffect(() => {
    if (isListening || isSpeaking) {
      const interval = setInterval(() => {
        setAudioLevel(Math.random() * 100);
      }, 100);
      return () => clearInterval(interval);
    } else {
      setAudioLevel(0);
    }
  }, [isListening, isSpeaking]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[101] w-[90vw] max-w-md"
          >
            <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-3xl shadow-2xl border border-gray-700/50 overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-gray-700/50">
                <div className="flex items-center gap-2">
                  {isListening && (
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 bg-red-500 rounded-full animate-pulse" />
                      <span className="text-sm font-medium text-white">Listening...</span>
                    </div>
                  )}
                  {isSpeaking && (
                    <div className="flex items-center gap-2">
                      <Volume2 className="h-4 w-4 text-blue-500 animate-pulse" />
                      <span className="text-sm font-medium text-white">Speaking...</span>
                    </div>
                  )}
                  {isProcessing && (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 text-purple-500 animate-spin" />
                      <span className="text-sm font-medium text-white">Processing...</span>
                    </div>
                  )}
                  {!isListening && !isSpeaking && !isProcessing && (
                    <span className="text-sm font-medium text-gray-400">Voice Assistant</span>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="h-8 w-8 p-0 hover:bg-gray-700/50"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center justify-center py-12 px-6">
                <div className="relative">
                  {(isListening || isSpeaking) && (
                    <>
                      <motion.div
                        animate={{
                          scale: [1, 1.2, 1],
                          opacity: [0.3, 0.1, 0.3],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          easeInOut: true,
                        }}
                        className={cn(
                          "absolute inset-0 rounded-full blur-2xl",
                          isListening ? "bg-red-500/30" : "bg-blue-500/30"
                        )}
                        style={{
                          width: '200px',
                          height: '200px',
                          left: '50%',
                          top: '50%',
                          transform: 'translate(-50%, -50%)',
                        }}
                      />
                    </>
                  )}
                  <motion.div
                    animate={{
                      scale: isListening || isSpeaking ? [1, 1.05, 1] : 1,
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: isListening || isSpeaking ? Infinity : 0,
                    }}
                    className={cn(
                      "relative w-32 h-32 rounded-full flex items-center justify-center",
                      "bg-gradient-to-br shadow-2xl transition-all duration-300",
                      isListening && "from-red-500 via-pink-500 to-purple-500",
                      isSpeaking && "from-blue-500 via-cyan-500 to-teal-500",
                      isProcessing && "from-purple-500 via-pink-500 to-indigo-500",
                      !isListening && !isSpeaking && !isProcessing && "from-gray-600 via-gray-500 to-gray-600"
                    )}
                  >
                    {(isListening || isSpeaking) && (
                      <div className="flex items-center justify-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <motion.div
                            key={i}
                            animate={{
                              height: [
                                10 + audioLevel * 0.2,
                                20 + audioLevel * 0.3,
                                10 + audioLevel * 0.2,
                              ],
                            }}
                            transition={{
                              duration: 0.5,
                              repeat: Infinity,
                              delay: i * 0.1,
                            }}
                            className="w-1 bg-white rounded-full"
                            style={{ minHeight: '10px', maxHeight: '40px' }}
                          />
                        ))}
                      </div>
                    )}
                    {!isListening && !isSpeaking && !isProcessing && (
                      <Mic className="h-12 w-12 text-white" />
                    )}
                    {isProcessing && (
                      <Loader2 className="h-12 w-12 text-white animate-spin" />
                    )}
                  </motion.div>
                </div>
              </div>
              <div className="px-6 pb-6 space-y-4">
                {userTranscript && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gray-800/50 rounded-2xl p-4 border border-gray-700/30"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                        <span className="text-xs font-bold text-white">You</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-white leading-relaxed">{userTranscript}</p>
                      </div>
                    </div>
                  </motion.div>
                )}
                {aiResponse && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-br from-blue-900/30 to-cyan-900/30 rounded-2xl p-4 border border-blue-700/30"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                        <span className="text-xs font-bold text-white">AI</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-white leading-relaxed">{aiResponse}</p>
                      </div>
                    </div>
                  </motion.div>
                )}
                {!userTranscript && !aiResponse && !isListening && (
                  <div className="text-center py-4">
                    <p className="text-sm text-gray-400">
                      Click the microphone to start speaking
                    </p>
                  </div>
                )}
              </div>
              <div className="flex items-center justify-center gap-3 px-6 pb-6">
                {isListening && (
                  <Button
                    onClick={onStopListening}
                    className="bg-red-500 hover:bg-red-600 text-white"
                  >
                    <MicOff className="h-4 w-4 mr-2" />
                    Stop Recording
                  </Button>
                )}
                {isSpeaking && (
                  <Button
                    onClick={onStopSpeaking}
                    className="bg-blue-500 hover:bg-blue-600 text-white"
                  >
                    <Volume2 className="h-4 w-4 mr-2" />
                    Stop Speaking
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
