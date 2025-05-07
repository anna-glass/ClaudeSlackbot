'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

export default function OnboardingPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  useEffect(() => {
    // Get the workspace ID from the URL params
    const id = searchParams.get('workspace_id');
    setWorkspaceId(id);
  }, [searchParams]);

  const startIngestion = async () => {
    if (!workspaceId) return;
    
    setIsLoading(true);
    try {
      const response = await fetch('/api/slack/ingest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ workspaceId }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to start ingestion');
      }
      
      // Redirect to success page or dashboard after successful ingestion
      router.push('/onboarding/success');
    } catch (error) {
      console.error('Ingestion error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Welcome to AI Slackbot
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Your Slack integration was successful! Let's set up your workspace.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Workspace Setup</h3>
              <p className="mt-1 text-sm text-gray-500">
                We'll need to index your Slack workspace to provide intelligent AI responses.
              </p>
            </div>

            <div className="flex flex-col space-y-4">
              <div className="flex items-center">
                <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="ml-2 text-sm text-gray-700">Slack integration authorized</span>
              </div>
              <div className="flex items-center">
                <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="ml-2 text-sm text-gray-700">Index workspace messages</span>
              </div>
            </div>

            <div>
              <button
                type="button"
                onClick={startIngestion}
                disabled={isLoading || !workspaceId}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {isLoading ? 'Processing...' : 'Start Indexing'}
              </button>
              <p className="mt-2 text-xs text-gray-500 text-center">
                This may take a few minutes depending on your workspace size
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 