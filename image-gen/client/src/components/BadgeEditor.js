import React, { useState, useEffect } from 'react';
import DynamicForm from './DynamicForm';
import { generateBadge } from '../services/api';
import useDebounce from '../hooks/useDebounce';
import './BadgeEditor.css';

const BadgeEditor = () => {
  const [config, setConfig] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Listen for config from parent app
  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data && event.data.type === 'SET_CONFIG') {
        setConfig(event.data.config);
      }
    };

    window.addEventListener('message', handleMessage);
    
    // Check URL params for initial config
    const urlParams = new URLSearchParams(window.location.search);
    const configParam = urlParams.get('config');
    if (configParam) {
      try {
        const parsedConfig = JSON.parse(decodeURIComponent(configParam));
        setConfig(parsedConfig);
      } catch (err) {
        console.error('Failed to parse config from URL:', err);
      }
    }

    return () => window.removeEventListener('message', handleMessage);
  }, []);

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
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchBadge();
  }, [debouncedConfig]);

  const handleConfigChange = (newConfig) => {
    setConfig(newConfig);
    
    // Notify parent app of config changes
    if (window.parent !== window) {
      window.parent.postMessage({
        type: 'CONFIG_UPDATED',
        config: newConfig
      }, '*');
    }
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