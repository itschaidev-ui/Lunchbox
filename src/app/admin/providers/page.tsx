'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, RefreshCw, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

interface ProviderStatus {
  [key: string]: boolean;
}

interface TestResponse {
  success: boolean;
  response?: string;
  provider?: string;
  usage?: any;
  error?: string;
}

export default function ProvidersPage() {
  const [providerStatus, setProviderStatus] = useState<ProviderStatus>({});
  const [currentProvider, setCurrentProvider] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [testMessage, setTestMessage] = useState('Hello, how are you?');
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
        body: JSON.stringify({ message: testMessage }),
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

  const resetProviders = async () => {
    try {
      // This would call a reset endpoint if we had one
      await fetchStatus();
    } catch (error) {
      console.error('Failed to reset providers:', error);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

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

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">AI Provider Status</h1>
          <p className="text-muted-foreground">
            Monitor and test your AI providers with automatic failover
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchStatus} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={resetProviders} variant="outline" size="sm">
            Reset All
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="ml-2">Loading provider status...</span>
        </div>
      ) : (
        <>
          {/* Current Provider */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Current Provider
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

          {/* Provider Status */}
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

          {/* Test Provider */}
          <Card>
            <CardHeader>
              <CardTitle>Test Provider</CardTitle>
              <CardDescription>
                Send a test message to verify provider functionality
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
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
