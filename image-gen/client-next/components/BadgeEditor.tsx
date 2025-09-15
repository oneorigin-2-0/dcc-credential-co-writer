"use client";

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import DynamicForm from './DynamicForm';
import { generateBadge } from '@/lib/api';
import useDebounce from '@/lib/hooks/useDebounce';
import './BadgeEditor.css';

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
      <div className="badge-editor">
        <div className="waiting-message">
          <h2>Waiting for configuration...</h2>
          <p>Please provide a badge configuration JSON</p>
        </div>
      </div>
    );
  }

  return (
    <div className="badge-editor">
      <div className="control-panel">
        <div className="panel-header">
          <h2>Configuration</h2>
        </div>
        
        <DynamicForm 
          config={config} 
          onChange={handleConfigChange} 
        />
      </div>

      <div className="preview-panel">
        <div className="panel-header">
          <h2>Preview</h2>
          {loading && <span className="loading-text">Generating...</span>}
          {previewImage && !loading && (
            <button 
              onClick={handleDownload}
              className="download-button"
            >
              Download PNG
            </button>
          )}
        </div>
        
        {error && (
          <div className="error-message">
            Error: {error}
          </div>
        )}
        
        <div className="preview-container">
          {previewImage && !loading && (
            <img 
              src={previewImage} 
              alt="Badge Preview" 
              className="badge-preview"
            />
          )}
          {loading && (
            <div className="loading-spinner">
              <div className="spinner"></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BadgeEditor;