'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

export default function TestGemini() {
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<any>(null);

  const testAPI = async () => {
    setTesting(true);
    setResult(null);

    try {
      const response = await fetch('/api/test-gemini');
      const data = await response.json();
      setResult(data);
    } catch (error: any) {
      setResult({
        error: error.message,
        success: false,
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="font-display text-4xl font-bold mb-4 glow-text">
            Gemini API Test
          </h1>
          <p className="text-parchment/70 mb-8">
            This page will test your Gemini API key and show available models
          </p>

          <button
            onClick={testAPI}
            disabled={testing}
            className="btn-primary mb-8"
          >
            {testing ? 'Testing...' : 'Test Gemini API'}
          </button>

          {result && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mystery-card"
            >
              <h2 className="font-display text-2xl font-semibold mb-4 text-gold">
                Results
              </h2>
              
              <div className="space-y-4">
                <div>
                  <strong>Status:</strong>{' '}
                  <span className={result.success ? 'text-green-400' : 'text-red-400'}>
                    {result.success ? '✅ Success' : '❌ Failed'}
                  </span>
                </div>

                {result.apiKeyExists !== undefined && (
                  <div>
                    <strong>API Key:</strong>{' '}
                    <span className="text-green-400">
                      {result.apiKeyExists ? '✅ Found' : '❌ Not Found'}
                    </span>
                    {result.apiKeyPrefix && (
                      <span className="text-parchment/50 ml-2">
                        ({result.apiKeyPrefix})
                      </span>
                    )}
                  </div>
                )}

                {result.error && (
                  <div className="p-4 bg-blood/20 border border-blood/50 rounded-lg">
                    <strong>Error:</strong>
                    <pre className="mt-2 text-sm overflow-auto">{result.error}</pre>
                  </div>
                )}

                {result.listModelsError && (
                  <div className="p-4 bg-blood/20 border border-blood/50 rounded-lg">
                    <strong>List Models Error:</strong>
                    <pre className="mt-2 text-sm overflow-auto">{result.listModelsError}</pre>
                  </div>
                )}

                {result.models && (
                  <div>
                    <h3 className="font-semibold text-xl mb-3">
                      Available Models ({result.totalModels})
                    </h3>
                    <div className="space-y-2">
                      {result.models.map((model: any, i: number) => (
                        <div key={i} className="p-3 bg-ink/40 rounded-lg">
                          <div className="font-semibold text-gold">{model.name}</div>
                          <div className="text-sm text-parchment/70">{model.displayName}</div>
                          {model.supportedMethods && (
                            <div className="text-xs text-parchment/50 mt-1">
                              Methods: {model.supportedMethods.join(', ')}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {result.testedModels && (
                  <div>
                    <h3 className="font-semibold text-xl mb-3">
                      Tested Models
                    </h3>
                    <div className="space-y-2">
                      {result.testedModels.map((test: any, i: number) => (
                        <div key={i} className="p-3 bg-ink/40 rounded-lg">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold">{test.model}</span>
                            <span className={test.status === 'working' ? 'text-green-400' : 'text-red-400'}>
                              {test.status === 'working' ? '✅ Working' : '❌ Failed'}
                            </span>
                          </div>
                          {test.error && (
                            <div className="text-sm text-parchment/50 mt-1">
                              {test.error}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-6 p-4 bg-gold/10 border border-gold/30 rounded-lg">
                  <h4 className="font-semibold mb-2">Recommendation:</h4>
                  {result.success ? (
                    <p className="text-sm">
                      ✅ Your API key is working! The app will automatically use the best available model.
                    </p>
                  ) : result.testedModels?.some((t: any) => t.status === 'working') ? (
                    <p className="text-sm">
                      ✅ Found working model(s)! The app will use:{' '}
                      <strong className="text-gold">
                        {result.testedModels.find((t: any) => t.status === 'working').model}
                      </strong>
                    </p>
                  ) : (
                    <p className="text-sm">
                      ❌ No working models found. Please check:
                      <ul className="list-disc ml-6 mt-2">
                        <li>Your API key is correct (starts with AIza)</li>
                        <li>The key is in .env.local file</li>
                        <li>You restarted the dev server</li>
                        <li>Your API key has proper permissions</li>
                      </ul>
                    </p>
                  )}
                </div>
              </div>

              <details className="mt-6">
                <summary className="cursor-pointer text-parchment/70 hover:text-parchment">
                  Show raw JSON response
                </summary>
                <pre className="mt-2 p-4 bg-ink/60 rounded-lg text-xs overflow-auto">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </details>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
