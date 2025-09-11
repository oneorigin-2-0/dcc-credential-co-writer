"use client";

import LayerEditor from './LayerEditor';
import './DynamicForm.css';

const DynamicForm = ({ config, onChange }: { config: any; onChange: (config: any) => void }) => {
  const updateField = (path: string, value: any) => {
    const newConfig = JSON.parse(JSON.stringify(config)); // Deep clone
    const keys = path.split('.');
    let current = newConfig;
    
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (key.includes('[')) {
        // Handle array notation like layers[0]
        const arrayKey = key.substring(0, key.indexOf('['));
        const index = parseInt(key.substring(key.indexOf('[') + 1, key.indexOf(']')));
        current = current[arrayKey][index];
      } else {
        current = current[key];
      }
    }
    
    const lastKey = keys[keys.length - 1];
    current[lastKey] = value;
    
    onChange(newConfig);
  };

  return (
    <div className="dynamic-form">
      {/* Canvas Settings */}
      <div className="form-section">
        <h3>Canvas Settings</h3>
        <div className="form-group">
          <label>Width</label>
          <input
            type="number"
            value={config.canvas.width}
            onChange={(e) => updateField('canvas.width', parseInt(e.target.value))}
          />
        </div>
        <div className="form-group">
          <label>Height</label>
          <input
            type="number"
            value={config.canvas.height}
            onChange={(e) => updateField('canvas.height', parseInt(e.target.value))}
          />
        </div>
      </div>

      {/* Layers */}
      <div className="layers-section">
        <h3>Layers</h3>
        {config.layers.map((layer: any, index: number) => (
          <LayerEditor
            key={index}
            layer={layer}
            index={index}
            onChange={(updatedLayer: any) => {
              const newLayers = [...config.layers];
              newLayers[index] = updatedLayer;
              const newConfig = { ...config, layers: newLayers };
              onChange(newConfig);
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default DynamicForm;