import { useState, useEffect } from 'react';

export const useTypewriter = (text: string, speed: number = 20) => {
  const [displayText, setDisplayText] = useState('');

  useEffect(() => {
    setDisplayText('');
    if (!text) return;

    const lines = text.split('\n');
    let currentLine = 0;
    let timeout: NodeJS.Timeout;

    const typeLine = () => {
      if (currentLine < lines.length) {
        setDisplayText(prev => prev + lines[currentLine] + '\n');
        currentLine++;
        timeout = setTimeout(typeLine, speed);
      }
    };

    timeout = setTimeout(typeLine, speed);

    return () => clearTimeout(timeout);
  }, [text, speed]);

  return displayText;
};
