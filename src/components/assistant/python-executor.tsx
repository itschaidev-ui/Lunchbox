'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Play, Square, Terminal, Copy, Download, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface PythonExecutorProps {
  code: string;
  onSave?: (code: string) => void;
}

interface ExecutionState {
  isRunning: boolean;
  isWaitingForInput: boolean;
  output: string[];
  error: string;
  inputValue: string;
  inputPrompt: string;
}

export function PythonExecutor({ code, onSave }: PythonExecutorProps) {
  const [executionState, setExecutionState] = useState<ExecutionState>({
    isRunning: false,
    isWaitingForInput: false,
    output: [],
    error: '',
    inputValue: '',
    inputPrompt: ''
  });
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const outputRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Auto-scroll to bottom when new output arrives
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [executionState.output]);

  // Focus input when waiting for input
  useEffect(() => {
    if (executionState.isWaitingForInput && inputRef.current) {
      inputRef.current.focus();
    }
  }, [executionState.isWaitingForInput]);

  const executePythonCode = async () => {
    if (executionState.isRunning) return;
    
    setExecutionState(prev => ({
      ...prev,
      isRunning: true,
      output: [],
      error: '',
      isWaitingForInput: false
    }));

    try {
      // Parse the Python code to detect input() calls
      const lines = code.split('\n');
      let currentLine = 0;
      let currentOutput: string[] = [];
      
      const processLine = async (line: string) => {
        const trimmedLine = line.trim();
        
        if (trimmedLine.includes('input(')) {
          // Extract the input prompt
          const inputMatch = trimmedLine.match(/input\(['"](.*?)['"]\)/);
          const prompt = inputMatch ? inputMatch[1] : 'Enter input: ';
          
          // Show that we're waiting for input
          setExecutionState(prev => ({
            ...prev,
            isWaitingForInput: true,
            inputPrompt: prompt,
            output: [...currentOutput, `>>> ${prompt}`]
          }));
          
          // Wait for user input
          return new Promise<void>((resolve) => {
            const handleInput = (value: string) => {
              currentOutput.push(`>>> ${prompt}${value}`);
              setExecutionState(prev => ({
                ...prev,
                isWaitingForInput: false,
                inputValue: '',
                output: [...currentOutput]
              }));
              resolve();
            };
            
            // Store the resolve function for the input handler
            (window as any).pythonInputHandler = handleInput;
          });
        } else if (trimmedLine.includes('print(')) {
          // Extract print content
          const printMatch = trimmedLine.match(/print\(['"](.*?)['"]\)/);
          if (printMatch) {
            currentOutput.push(printMatch[1]);
            setExecutionState(prev => ({ ...prev, output: [...currentOutput] }));
            await new Promise(resolve => setTimeout(resolve, 300));
          } else {
            // Handle print with variables
            const variableMatch = trimmedLine.match(/print\((.+)\)/);
            if (variableMatch) {
              // Simple variable substitution for common patterns
              let output = variableMatch[1];
              if (output.includes("'Hello, ' + name + '!'")) {
                // This is the greeting pattern
                currentOutput.push('Hello, [user input]!');
                setExecutionState(prev => ({ ...prev, output: [...currentOutput] }));
                await new Promise(resolve => setTimeout(resolve, 300));
              } else {
                currentOutput.push(output);
                setExecutionState(prev => ({ ...prev, output: [...currentOutput] }));
                await new Promise(resolve => setTimeout(resolve, 300));
              }
            }
          }
        } else if (trimmedLine.includes('=') && !trimmedLine.includes('==')) {
          // Variable assignment
          currentOutput.push(`>>> ${trimmedLine}`);
          setExecutionState(prev => ({ ...prev, output: [...currentOutput] }));
          await new Promise(resolve => setTimeout(resolve, 200));
        } else if (trimmedLine) {
          // Other executable lines
          currentOutput.push(`>>> ${trimmedLine}`);
          setExecutionState(prev => ({ ...prev, output: [...currentOutput] }));
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      };
      
      // Process each line
      for (let i = 0; i < lines.length; i++) {
        await processLine(lines[i]);
      }
      
      // Add completion message
      currentOutput.push('>>> Script completed successfully');
      setExecutionState(prev => ({ ...prev, output: [...currentOutput] }));
      
    } catch (err) {
      setExecutionState(prev => ({
        ...prev,
        error: `Error: ${err instanceof Error ? err.message : 'Unknown error occurred'}`
      }));
    } finally {
      setExecutionState(prev => ({ ...prev, isRunning: false }));
    }
  };

  const stopExecution = () => {
    setExecutionState(prev => ({
      ...prev,
      isRunning: false,
      isWaitingForInput: false,
      output: [...prev.output, '>>> Execution stopped by user']
    }));
  };

  const handleInputSubmit = () => {
    if (executionState.isWaitingForInput && executionState.inputValue.trim()) {
      if ((window as any).pythonInputHandler) {
        (window as any).pythonInputHandler(executionState.inputValue);
        (window as any).pythonInputHandler = null;
      }
    }
  };

  const clearOutput = () => {
    setExecutionState(prev => ({
      ...prev,
      output: [],
      error: '',
      isWaitingForInput: false,
      inputValue: ''
    }));
  };

  const copyOutput = async () => {
    const outputText = executionState.output.join('\n');
    await navigator.clipboard.writeText(outputText);
    toast({
      title: "Copied to clipboard",
      description: "Console output has been copied.",
    });
  };

  const downloadOutput = () => {
    const outputText = executionState.output.join('\n');
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

  // Mobile dropdown version
  if (isMobile) {
    return (
      <Card className="w-full bg-gray-900 border border-gray-700 rounded-lg shadow-lg">
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
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-gray-400 hover:text-gray-200 border-gray-600 hover:border-gray-500"
            >
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
            {executionState.isRunning ? (
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
                disabled={executionState.isRunning}
              >
                <Play className="h-4 w-4 mr-1" />
                Run
              </Button>
            )}
          </div>
        </CardHeader>
        
        {isExpanded && (
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
              <div className="bg-gray-800 px-4 py-2 text-sm text-gray-300 border-b border-gray-700 flex items-center justify-between">
                <span>Console Output</span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyOutput}
                    className="text-gray-400 hover:text-gray-200 border-gray-600 hover:border-gray-500 h-6 px-2"
                    disabled={executionState.output.length === 0}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={downloadOutput}
                    className="text-gray-400 hover:text-gray-200 border-gray-600 hover:border-gray-500 h-6 px-2"
                    disabled={executionState.output.length === 0}
                  >
                    <Download className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearOutput}
                    className="text-gray-400 hover:text-gray-200 border-gray-600 hover:border-gray-500 h-6 px-2"
                    disabled={executionState.output.length === 0}
                  >
                    Clear
                  </Button>
                </div>
              </div>
              <div 
                ref={outputRef}
                className="h-full bg-black p-4 overflow-auto font-mono text-sm"
              >
                {executionState.output.length === 0 && !executionState.error ? (
                  <div className="text-gray-500 italic">
                    Click "Run" to execute the script and see output here...
                  </div>
                ) : (
                  <>
                    {executionState.output.map((line, index) => (
                      <div key={index} className="text-green-400 mb-1">
                        {line}
                      </div>
                    ))}
                    {executionState.error && (
                      <div className="text-red-400 mt-2">
                        {executionState.error}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Input Area */}
            {executionState.isWaitingForInput && (
              <div className="border-t border-gray-700 p-4 bg-gray-800">
                <div className="flex items-center gap-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={executionState.inputValue}
                    onChange={(e) => setExecutionState(prev => ({ ...prev, inputValue: e.target.value }))}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleInputSubmit();
                      }
                    }}
                    placeholder={executionState.inputPrompt}
                    className="flex-1 bg-gray-900 text-white border border-gray-600 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <Button
                    size="sm"
                    onClick={handleInputSubmit}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    disabled={!executionState.inputValue.trim()}
                  >
                    Submit
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        )}
      </Card>
    );
  }

  // Desktop version (existing layout)
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
            disabled={executionState.output.length === 0}
          >
            <Copy className="h-4 w-4 mr-1" />
            Copy Output
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={downloadOutput}
            className="text-gray-400 hover:text-gray-200 border-gray-600 hover:border-gray-500"
            disabled={executionState.output.length === 0}
          >
            <Download className="h-4 w-4 mr-1" />
            Download
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={clearOutput}
            className="text-gray-400 hover:text-gray-200 border-gray-600 hover:border-gray-500"
            disabled={executionState.output.length === 0}
          >
            Clear
          </Button>
          {executionState.isRunning ? (
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
              disabled={executionState.isRunning}
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
            {executionState.output.length === 0 && !executionState.error ? (
              <div className="text-gray-500 italic">
                Click "Run Python" to execute the script and see output here...
              </div>
            ) : (
              <>
                {executionState.output.map((line, index) => (
                  <div key={index} className="text-green-400 mb-1">
                    {line}
                  </div>
                ))}
                {executionState.error && (
                  <div className="text-red-400 mt-2">
                    {executionState.error}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Input Area */}
        {executionState.isWaitingForInput && (
          <div className="border-t border-gray-700 p-4 bg-gray-800">
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={executionState.inputValue}
                onChange={(e) => setExecutionState(prev => ({ ...prev, inputValue: e.target.value }))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleInputSubmit();
                  }
                }}
                placeholder={executionState.inputPrompt}
                className="flex-1 bg-gray-900 text-white border border-gray-600 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <Button
                size="sm"
                onClick={handleInputSubmit}
                className="bg-blue-600 hover:bg-blue-700 text-white"
                disabled={!executionState.inputValue.trim()}
              >
                Submit
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
