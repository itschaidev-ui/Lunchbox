'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Play, Square, Terminal, Copy, Download } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface PythonConsoleProps {
  code: string;
  onSave?: (code: string) => void;
}

export function PythonConsole({ code, onSave }: PythonConsoleProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [output, setOutput] = useState<string[]>([]);
  const [error, setError] = useState<string>('');
  const [isExecuting, setIsExecuting] = useState(false);
  const outputRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new output arrives
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [output]);

  const executePythonCode = async () => {
    if (isExecuting) return;
    
    setIsExecuting(true);
    setIsRunning(true);
    setOutput([]);
    setError('');

    try {
      // Simulate Python execution with streaming output
      const lines = code.split('\n');
      let currentOutput: string[] = [];
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        // Simulate different types of output
        if (line.includes('print(')) {
          // Extract print content
          const printMatch = line.match(/print\(['"](.*?)['"]\)/);
          if (printMatch) {
            currentOutput.push(printMatch[1]);
            setOutput([...currentOutput]);
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        } else if (line.includes('for ') || line.includes('while ')) {
          // Simulate loop output
          currentOutput.push(`Executing: ${line}`);
          setOutput([...currentOutput]);
          await new Promise(resolve => setTimeout(resolve, 300));
        } else if (line.includes('=') && !line.includes('==')) {
          // Variable assignment
          currentOutput.push(`Variable assigned: ${line}`);
          setOutput([...currentOutput]);
          await new Promise(resolve => setTimeout(resolve, 200));
        } else if (line.trim()) {
          // Other executable lines
          currentOutput.push(`Executing: ${line}`);
          setOutput([...currentOutput]);
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }
      
      // Add completion message
      currentOutput.push('>>> Script completed successfully');
      setOutput([...currentOutput]);
      
    } catch (err) {
      setError(`Error: ${err instanceof Error ? err.message : 'Unknown error occurred'}`);
    } finally {
      setIsExecuting(false);
      setIsRunning(false);
    }
  };

  const stopExecution = () => {
    setIsExecuting(false);
    setIsRunning(false);
    setOutput(prev => [...prev, '>>> Execution stopped by user']);
  };

  const clearOutput = () => {
    setOutput([]);
    setError('');
  };

  const copyOutput = async () => {
    const outputText = output.join('\n');
    await navigator.clipboard.writeText(outputText);
    toast({
      title: "Copied to clipboard",
      description: "Console output has been copied.",
    });
  };

  const downloadOutput = () => {
    const outputText = output.join('\n');
    const blob = new Blob([outputText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'python_output.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Downloaded",
      description: "Console output has been downloaded.",
    });
  };

  return (
    <Card className="w-full max-w-4xl mx-auto bg-gray-900 border border-gray-700 rounded-lg shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 bg-gray-800 rounded-t-lg">
        <div className="flex items-center gap-2">
          <CardTitle className="text-sm font-medium text-gray-300 flex items-center gap-2">
            <Terminal className="h-4 w-4" />
            Python Console
          </CardTitle>
          <span className="text-xs text-gray-500">·</span>
          <span className="text-xs text-gray-500">python</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={copyOutput}
            className="text-gray-400 hover:text-gray-200 border-gray-600 hover:border-gray-500"
            disabled={output.length === 0}
          >
            <Copy className="h-4 w-4 mr-1" />
            Copy Output
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={downloadOutput}
            className="text-gray-400 hover:text-gray-200 border-gray-600 hover:border-gray-500"
            disabled={output.length === 0}
          >
            <Download className="h-4 w-4 mr-1" />
            Download
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={clearOutput}
            className="text-gray-400 hover:text-gray-200 border-gray-600 hover:border-gray-500"
            disabled={output.length === 0}
          >
            Clear
          </Button>
          {isRunning ? (
            <Button
              size="sm"
              onClick={stopExecution}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              <Square className="h-4 w-4 mr-1" />
              Stop
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={executePythonCode}
              className="bg-green-600 hover:bg-green-700 text-white"
              disabled={isExecuting}
            >
              <Play className="h-4 w-4 mr-1" />
              Run Python
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {/* Code Display */}
        <div className="border-b border-gray-700">
          <div className="bg-gray-800 px-4 py-2 text-sm text-gray-300 border-b border-gray-700">
            Python Code
          </div>
          <pre className="p-4 text-sm text-gray-100 font-mono overflow-x-auto">
            <code className="text-gray-100">{code}</code>
          </pre>
        </div>

        {/* Console Output */}
        <div className="h-64">
          <div className="bg-gray-800 px-4 py-2 text-sm text-gray-300 border-b border-gray-700">
            Console Output
          </div>
          <div 
            ref={outputRef}
            className="h-full bg-black p-4 overflow-auto font-mono text-sm"
          >
            {output.length === 0 && !error ? (
              <div className="text-gray-500 italic">
                Click "Run Python" to execute the script and see output here...
              </div>
            ) : (
              <>
                {output.map((line, index) => (
                  <div key={index} className="text-green-400 mb-1">
                    {line}
                  </div>
                ))}
                {error && (
                  <div className="text-red-400 mt-2">
                    {error}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
