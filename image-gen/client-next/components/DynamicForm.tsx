"use client";

import LayerEditor from './LayerEditor';

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
    <div className="p-2">
      {/* Canvas Settings */}
      <div className="mb-6 p-4 bg-gray-50 rounded">
        <h3 className="text-sm font-semibold text-gray-600 mb-4 uppercase tracking-wide">Canvas Settings</h3>
        <div className="flex items-center mb-3">
          <label className="flex-shrink-0 w-[120px] text-sm text-gray-600 mr-4">Width</label>
          <input
            type="number"
            className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
            value={config.canvas.width}
            onChange={(e) => updateField('canvas.width', parseInt(e.target.value))}
          />
        </div>
        <div className="flex items-center mb-3">
          <label className="flex-shrink-0 w-[120px] text-sm text-gray-600 mr-4">Height</label>
          <input
            type="number"
            className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
            value={config.canvas.height}
            onChange={(e) => updateField('canvas.height', parseInt(e.target.value))}
          />
        </div>
      </div>

      {/* Layers */}
      <div className="mt-4">
        <h3 className="text-sm font-semibold text-gray-600 mb-4 uppercase tracking-wide">Layers</h3>
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