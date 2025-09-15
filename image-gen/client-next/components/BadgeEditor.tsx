"use client";

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import DynamicForm from './DynamicForm';
import { generateBadge } from '@/lib/api';
import useDebounce from '@/lib/hooks/useDebounce';

const BadgeEditor = () => {
  const [config, setConfig] = useState<any>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();

  // Get config from URL params on mount
  useEffect(() => {
    const configParam = searchParams.get('config');
    if (configParam) {
      try {
        const parsedConfig = JSON.parse(decodeURIComponent(configParam));
        setConfig(parsedConfig);
      } catch (err) {
        console.error('Failed to parse config from URL:', err);
      }
    }
  }, [searchParams]);

  // Debounce config changes by 500ms
  const debouncedConfig = useDebounce(config, 500);

  // Generate badge whenever config changes (debounced)
  useEffect(() => {
    if (!debouncedConfig) return;

    const fetchBadge = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await generateBadge(debouncedConfig);
        setPreviewImage(response.data.base64);
      } catch (err: any) {
        setError(err.message || 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchBadge();
  }, [debouncedConfig]);

  const handleConfigChange = (newConfig: any) => {
    setConfig(newConfig);
  };

  const handleDownload = () => {
    if (!previewImage) return;
    
    // Convert base64 to blob
    const base64Data = previewImage.split(',')[1];
    const byteString = atob(base64Data);
    const mimeString = previewImage.split(',')[0].split(':')[1].split(';')[0];
    
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    
    const blob = new Blob([ab], { type: 'image/png' });
    
    // Create download link
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `badge-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  if (!config) {
    return (
      <div className="flex h-[calc(100vh-80px)] bg-gray-100">
        <div className="flex flex-col justify-center items-center h-full text-center p-8 w-full">
          <h2 className="text-gray-600 mb-2 text-xl">Waiting for configuration...</h2>
          <p className="text-gray-400">Please provide a badge configuration JSON</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-80px)] bg-gray-100">
      <div className="w-2/5 bg-white border-r border-gray-200 overflow-y-auto p-4">
        <div className="flex justify-between items-center mb-4 pb-2 border-b-2 border-gray-200">
          <h2 className="text-xl text-gray-800">Configuration</h2>
        </div>
        
        <DynamicForm 
          config={config} 
          onChange={handleConfigChange} 
        />
      </div>

      <div className="w-3/5 flex flex-col p-4">
        <div className="flex justify-between items-center mb-4 pb-2 border-b-2 border-gray-200">
          <h2 className="text-xl text-gray-800">Preview</h2>
          {loading && <span className="text-gray-600 text-sm">Generating...</span>}
          {previewImage && !loading && (
            <button
              onClick={handleDownload}
              className="ml-auto px-4 py-2 bg-gray-800 text-white border-none rounded cursor-pointer text-sm font-medium transition-colors hover:bg-gray-700 active:bg-gray-900"
            >
              Download PNG
            </button>
          )}
        </div>
        
        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded mb-4">
            Error: {error}
          </div>
        )}
        
        <div className="flex-1 flex justify-center items-center bg-gray-50 rounded-lg shadow-sm relative overflow-hidden min-h-[400px]">
          {previewImage && !loading && (
            <img
              src={previewImage}
              alt="Badge Preview"
              className="max-w-[calc(100%-4rem)] max-h-[calc(100%-4rem)] w-auto h-auto object-contain block"
            />
          )}
          {loading && (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <div className="border-4 border-gray-200 border-t-blue-500 rounded-full w-10 h-10 animate-spin"></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BadgeEditor;