'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, RefreshCw, CheckCircle, XCircle, Brain, Zap, Sparkles } from 'lucide-react';
import { HUGGINGFACE_MODELS } from '../../../lib/ai/huggingface-provider';

interface ProviderStatus {
  [key: string]: boolean;
}

interface TestResponse {
  success: boolean;
  response?: string;
  provider?: string;
  model?: string;
  usage?: any;
  error?: string;
}

export default function ModelsPage() {
  const [providerStatus, setProviderStatus] = useState<ProviderStatus>({});
  const [currentProvider, setCurrentProvider] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [testMessage, setTestMessage] = useState('Hello, how are you today?');
  const [selectedModel, setSelectedModel] = useState('microsoft/DialoGPT-large');
  const [testResult, setTestResult] = useState<TestResponse | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/test-providers');
      const data = await response.json();
      
      if (data.success) {
        setProviderStatus(data.providerStatus);
        setCurrentProvider(data.currentProvider);
      }
    } catch (error) {
      console.error('Failed to fetch provider status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const testProvider = async () => {
    setIsTesting(true);
    setTestResult(null);
    
    try {
      const response = await fetch('/api/test-providers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message: testMessage,
          model: selectedModel 
        }),
      });
      
      const data = await response.json();
      setTestResult(data);
    } catch (error: any) {
      setTestResult({
        success: false,
        error: error.message
      });
    } finally {
      setIsTesting(false);
    }
  };

  const getStatusIcon = (status: boolean) => {
    return status ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <XCircle className="h-4 w-4 text-red-500" />
    );
  };

  const getStatusBadge = (status: boolean) => {
    return status ? (
      <Badge variant="default" className="bg-green-500">
        Available
      </Badge>
    ) : (
      <Badge variant="destructive">
        Unavailable
      </Badge>
    );
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'chat':
        return <Brain className="h-4 w-4 text-blue-500" />;
      case 'text-generation':
        return <Zap className="h-4 w-4 text-purple-500" />;
      case 'summarization':
        return <Sparkles className="h-4 w-4 text-green-500" />;
      default:
        return <Brain className="h-4 w-4 text-gray-500" />;
    }
  };

  const getCategoryBadge = (category: string) => {
    const colors = {
      'chat': 'bg-blue-500',
      'text-generation': 'bg-purple-500',
      'summarization': 'bg-green-500',
      'translation': 'bg-yellow-500',
      'question-answering': 'bg-red-500'
    };
    
    return (
      <Badge variant="default" className={colors[category as keyof typeof colors] || 'bg-gray-500'}>
        {category.replace('-', ' ')}
      </Badge>
    );
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">AI Models & Providers</h1>
          <p className="text-muted-foreground">
            Test and manage your AI providers with automatic failover
          </p>
        </div>
        <Button onClick={fetchStatus} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh Status
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="ml-2">Loading provider status...</span>
        </div>
      ) : (
        <>
          {/* Current Provider Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Active Provider
              </CardTitle>
              <CardDescription>
                The provider currently being used for AI requests
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                {getStatusIcon(!!currentProvider)}
                <span className="font-medium">
                  {currentProvider || 'None'}
                </span>
                {currentProvider && getStatusBadge(!!currentProvider)}
              </div>
            </CardContent>
          </Card>

          {/* Provider Status Grid */}
          <Card>
            <CardHeader>
              <CardTitle>Provider Status</CardTitle>
              <CardDescription>
                Status of all configured AI providers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {Object.entries(providerStatus).map(([provider, status]) => (
                  <div key={provider} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(status)}
                      <span className="font-medium capitalize">{provider}</span>
                    </div>
                    {getStatusBadge(status)}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Hugging Face Models */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Available Hugging Face Models
              </CardTitle>
              <CardDescription>
                Choose from a variety of specialized AI models
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {HUGGINGFACE_MODELS.map((model) => (
                  <div key={model.name} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getCategoryIcon(model.category)}
                        <span className="font-medium text-sm">{model.displayName}</span>
                      </div>
                      {getCategoryBadge(model.category)}
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">{model.description}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>Max: {model.maxLength}</span>
                      <span>•</span>
                      <span>Temp: {model.temperature}</span>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full mt-2"
                      onClick={() => setSelectedModel(model.name)}
                    >
                      {selectedModel === model.name ? 'Selected' : 'Select'}
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Test Interface */}
          <Card>
            <CardHeader>
              <CardTitle>Test AI Provider</CardTitle>
              <CardDescription>
                Send a test message to verify provider functionality
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Test Message</label>
                  <textarea
                    value={testMessage}
                    onChange={(e) => setTestMessage(e.target.value)}
                    className="w-full mt-1 p-2 border rounded-md"
                    rows={3}
                    placeholder="Enter a test message..."
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">Select Model</label>
                  <Select value={selectedModel} onValueChange={setSelectedModel}>
                    <SelectTrigger className="w-full mt-1">
                      <SelectValue placeholder="Select a model" />
                    </SelectTrigger>
                    <SelectContent>
                      {HUGGINGFACE_MODELS.map((model) => (
                        <SelectItem key={model.name} value={model.name}>
                          <div className="flex items-center gap-2">
                            {getCategoryIcon(model.category)}
                            <span>{model.displayName}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <Button 
                onClick={testProvider} 
                disabled={isTesting || !testMessage.trim()}
                className="w-full"
              >
                {isTesting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Testing...
                  </>
                ) : (
                  'Test Provider'
                )}
              </Button>

              {testResult && (
                <Alert className={testResult.success ? 'border-green-500' : 'border-red-500'}>
                  <AlertDescription>
                    {testResult.success ? (
                      <div>
                        <p className="font-medium text-green-700">
                          ✅ Test successful with {testResult.provider}
                        </p>
                        {testResult.model && (
                          <p className="text-sm text-green-600 mt-1">
                            Model: {testResult.model}
                          </p>
                        )}
                        <p className="text-sm text-green-600 mt-1">
                          Response: {testResult.response}
                        </p>
                        {testResult.usage && (
                          <p className="text-xs text-gray-500 mt-1">
                            Tokens: {testResult.usage.total_tokens || 'N/A'}
                          </p>
                        )}
                      </div>
                    ) : (
                      <div>
                        <p className="font-medium text-red-700">
                          ❌ Test failed
                        </p>
                        <p className="text-sm text-red-600 mt-1">
                          Error: {testResult.error}
                        </p>
                      </div>
                    )}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
