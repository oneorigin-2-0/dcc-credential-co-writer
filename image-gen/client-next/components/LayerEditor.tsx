"use client";


const LayerEditor = ({ layer, index, onChange }: { layer: any; index: number; onChange: (layer: any) => void }) => {
  const updateLayerField = (field: string, value: any) => {
    const updatedLayer = { ...layer };
    
    // Handle nested fields like 'fill.start_color'
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      updatedLayer[parent] = { ...updatedLayer[parent], [child]: value };
    } else {
      updatedLayer[field] = value;
    }
    
    onChange(updatedLayer);
  };

  const renderLayerControls = () => {
    switch (layer.type) {
      case 'ShapeLayer':
        return (
          <>
            <div className="flex items-center mb-3">
              <label className="flex-shrink-0 w-[120px] text-sm text-gray-600 mr-4">Shape</label>
              <select
                className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                value={layer.shape || 'hexagon'}
                onChange={(e) => {
                  const newShape = e.target.value;
                  const updatedLayer = { ...layer, shape: newShape };

                  //set default params when swithing to rounded_rect
                  if (newShape === 'rounded_rect') {
                    updatedLayer.params = { 
                      ...updatedLayer.params,
                      width: 450,
                      height: 450,
                      radius: 50
                    };
                  }
                  //set default params when switching to hexagon
                  else if (newShape === 'hexagon') {
                    updatedLayer.params = { 
                      ...updatedLayer.params,
                      radius: 250
                    };
                  }
                  //set default params when switching to circle
                  else if (newShape === 'circle') {
                    updatedLayer.params = { 
                      ...updatedLayer.params,
                      radius: 250
                    };
                  }

                  onChange(updatedLayer);
                }}
              >
                <option value="hexagon">Hexagon</option>
                <option value="circle">Circle</option>
                <option value="rounded_rect">Rounded Rectangle</option>
              </select>
            </div>
            
            {layer.fill && layer.fill.mode === 'gradient' && (
              <>
                <div className="flex items-center mb-3">
                  <label className="flex-shrink-0 w-[120px] text-sm text-gray-600 mr-4">Start Color</label>
                  <input
                    type="color"
                    className="w-16 h-8 border border-gray-300 rounded cursor-pointer mr-2"
                    value={layer.fill.start_color || '#000000'}
                    onChange={(e) => updateLayerField('fill.start_color', e.target.value)}
                  />
                  <input
                    type="text"
                    className="flex-1 w-24 px-2 py-1 border border-gray-300 rounded text-sm"
                    value={layer.fill.start_color || '#000000'}
                    onChange={(e) => updateLayerField('fill.start_color', e.target.value)}
                  />
                </div>
                <div className="flex items-center mb-3">
                  <label className="flex-shrink-0 w-[120px] text-sm text-gray-600 mr-4">End Color</label>
                  <input
                    type="color"
                    className="w-16 h-8 border border-gray-300 rounded cursor-pointer mr-2"
                    value={layer.fill.end_color || '#000000'}
                    onChange={(e) => updateLayerField('fill.end_color', e.target.value)}
                  />
                  <input
                    type="text"
                    className="flex-1 w-24 px-2 py-1 border border-gray-300 rounded text-sm"
                    value={layer.fill.end_color || '#000000'}
                    onChange={(e) => updateLayerField('fill.end_color', e.target.value)}
                  />
                </div>
                <div className="flex items-center mb-3">
                  <label className="flex-shrink-0 w-[120px] text-sm text-gray-600 mr-4">Vertical Gradient</label>
                  <input
                    type="checkbox"
                    className="w-4 h-4"
                    checked={layer.fill.vertical}
                    onChange={(e) => updateLayerField('fill.vertical', e.target.checked)}
                  />
                </div>
              </>
            )}

            {layer.fill && layer.fill.mode === 'solid' && (
              <div className="flex items-center mb-3">
                <label className="flex-shrink-0 w-[120px] text-sm text-gray-600 mr-4">Fill Color</label>
                <input
                  type="color"
                  className="w-16 h-8 border border-gray-300 rounded cursor-pointer mr-2"
                  value={layer.fill.color || '#000000'}
                  onChange={(e) => updateLayerField('fill.color', e.target.value)}
                />
                <input
                  type="text"
                  className="ml-2 px-2 py-1 border border-gray-300 rounded-md text-sm"
                  value={layer.fill.color || '#000000'}
                  onChange={(e) => updateLayerField('fill.color', e.target.value)}
                />
              </div>
            )}
            
            {/* Show Radius for hexagon, Margin for circle */}
            {layer.shape === 'hexagon' && layer.params && (
              <div className="flex items-center mb-3">
                <label className="flex-shrink-0 w-[120px] text-sm text-gray-600 mr-4">Radius</label>
                <input
                  type="number"
                  className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                  value={layer.params.radius || ''}
                  onChange={(e) => {
                    const value = e.target.value === '' ? 0 : parseInt(e.target.value);
                    const updatedLayer = {
                      ...layer,
                      params: { ...layer.params, radius: value }
                    };
                    onChange(updatedLayer);
                  }}
                />
              </div>
            )}
            
            {layer.shape === 'circle' && (
              <div className="flex items-center mb-3">
                <label className="flex-shrink-0 w-[120px] text-sm text-gray-600 mr-4">Radius</label>
                <input
                  type="number"
                  className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                  value={layer.params?.radius || 250}
                  onChange={(e) => {
                    const value = e.target.value === '' ? 250 : parseInt(e.target.value);
                    const updatedLayer = {
                      ...layer,
                      params: { ...layer.params, radius: value }
                    };
                    onChange(updatedLayer);
                  }}
                  min="0"
                  placeholder="Circle radius (default: 250)"
                />
              </div>
            )}
            
            {layer.shape === 'rounded_rect' && layer.params && (
              <>
                <div className="flex items-center mb-3">
                  <label className="flex-shrink-0 w-[120px] text-sm text-gray-600 mr-4">Width</label>
                  <input
                    type="number"
                    className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                    value={layer.params.width || 200}
                    onChange={(e) => {
                      const value = e.target.value === '' ? 200 : parseInt(e.target.value);
                      const updatedLayer = {
                        ...layer,
                        params: { ...layer.params, width: value }
                      };
                      onChange(updatedLayer);
                    }}
                  />
                </div>
                <div className="flex items-center mb-3">
                  <label className="flex-shrink-0 w-[120px] text-sm text-gray-600 mr-4">Height</label>
                  <input
                    type="number"
                    className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                    value={layer.params.height || 40}
                    onChange={(e) => {
                      const value = e.target.value === '' ? 40 : parseInt(e.target.value);
                      const updatedLayer = {
                        ...layer,
                        params: { ...layer.params, height: value }
                      };
                      onChange(updatedLayer);
                    }}
                  />
                </div>
                <div className="flex items-center mb-3">
                  <label className="flex-shrink-0 w-[120px] text-sm text-gray-600 mr-4">Corner Radius</label>
                  <input
                    type="number"
                    className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                    value={layer.params.radius || 20}
                    onChange={(e) => {
                      const value = e.target.value === '' ? 20 : parseInt(e.target.value);
                      const updatedLayer = {
                        ...layer,
                        params: { ...layer.params, radius: value }
                      };
                      onChange(updatedLayer);
                    }}
                  />
                </div>
              </>
            )}

            {layer.border && (
              <>
                <div className="flex items-center mb-3">
                  <label className="flex-shrink-0 w-[120px] text-sm text-gray-600 mr-4">Border Width</label>
                  <input
                    type="number"
                    className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                    value={layer.border.width || ''}
                    onChange={(e) => {
                      const value = e.target.value === '' ? 0 : parseInt(e.target.value);
                      const updatedLayer = {
                        ...layer,
                        border: { ...layer.border, width: value }
                      };
                      onChange(updatedLayer);
                    }}
                  />
                </div>
                {layer.border.color && (
                  <div className="flex items-center mb-3">
                    <label className="flex-shrink-0 w-[120px] text-sm text-gray-600 mr-4">Border Color</label>
                    <input
                      type="color"
                      className="w-16 h-8 border border-gray-300 rounded cursor-pointer mr-2"
                      value={layer.border.color || '#000000'}
                      onChange={(e) => {
                        const updatedLayer = {
                          ...layer,
                          border: { ...layer.border, color: e.target.value }
                        };
                        onChange(updatedLayer);
                      }}
                    />
                    <input
                      type="text"
                      className="w-24 px-2 py-1 border border-gray-300 rounded text-sm"
                      value={layer.border.color || '#000000'}
                      onChange={(e) => {
                        const updatedLayer = {
                          ...layer,
                          border: { ...layer.border, color: e.target.value }
                        };
                        onChange(updatedLayer);
                      }}
                    />
                  </div>
                )}
              </>
            )}
          </>
        );

      case 'TextLayer':
        return (
          <>
            <div className="flex items-center mb-3">
              <label className="flex-shrink-0 w-[120px] text-sm text-gray-600 mr-4">Text</label>
              <input
                type="text"
                className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                value={layer.text || ''}
                onChange={(e) => updateLayerField('text', e.target.value)}
              />
            </div>
            
            {layer.font && (
              <div className="flex items-center mb-3">
                <label className="flex-shrink-0 w-[120px] text-sm text-gray-600 mr-4">Font Size</label>
                <input
                  type="number"
                  className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                  value={layer.font.size || ''}
                  onChange={(e) => {
                    const value = e.target.value === '' ? 12 : parseInt(e.target.value);
                    const updatedLayer = {
                      ...layer,
                      font: { ...layer.font, size: value }
                    };
                    onChange(updatedLayer);
                  }}
                />
              </div>
            )}
            
            <div className="flex items-center mb-3">
              <label className="flex-shrink-0 w-[120px] text-sm text-gray-600 mr-4">Text Color</label>
              <input
                type="color"
                className="w-16 h-8 border border-gray-300 rounded cursor-pointer mr-2"
                value={layer.color || '#000000'}
                onChange={(e) => updateLayerField('color', e.target.value)}
              />
              <input
                type="text"
                className="w-24 px-2 py-1 border border-gray-300 rounded text-sm"
                value={layer.color || '#000000'}
                onChange={(e) => updateLayerField('color', e.target.value)}
              />
            </div>
            
            {layer.align && (
              <>
                {/* <div className="form-group">
                  <label>Horizontal Align</label>
                  <select
                    value={layer.align.x || 'center'}
                    onChange={(e) => {
                      const updatedLayer = {
                        ...layer,
                        align: { ...layer.align, x: e.target.value }
                      };
                      onChange(updatedLayer);
                    }}
                  >
                    <option value="left">Left</option>
                    <option value="center">Center</option>
                    <option value="right">Right</option>
                    <option value="dynamic">Dynamic</option>
                  </select>
                </div> */}
                <div className="flex items-center mb-3">
                  <label className="flex-shrink-0 w-[120px] text-sm text-gray-600 mr-4">Y Position: {typeof layer.align.y === 'number' ? layer.align.y : layer.align.y || 'center'}</label>
                  <input
                    type="range"
                    className="flex-1"
                    min="50"
                    max="550"
                    value={typeof layer.align.y === 'number' ? layer.align.y : 300}
                    onChange={(e) => {
                      const value = parseInt(e.target.value);
                      const updatedLayer = {
                        ...layer,
                        align: { ...layer.align, y: value }
                      };
                      onChange(updatedLayer);
                    }}
                  />
                </div>
              </>
            )}
          </>
        );

      case 'BackgroundLayer':
        return (
          <>
            <div className="flex items-center mb-3">
              <label className="flex-shrink-0 w-[120px] text-sm text-gray-600 mr-4">Mode</label>
              <select
                className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                value={layer.mode || 'solid'}
                onChange={(e) => updateLayerField('mode', e.target.value)}
              >
                <option value="solid">Solid</option>
                <option value="gradient">Gradient</option>
              </select>
            </div>
            
            <div className="flex items-center mb-3">
              <label className="flex-shrink-0 w-[120px] text-sm text-gray-600 mr-4">Color</label>
              <input
                type="color"
                className="w-16 h-8 border border-gray-300 rounded cursor-pointer mr-2"
                value={layer.color || '#FFFFFF'}
                onChange={(e) => updateLayerField('color', e.target.value)}
              />
              <input
                type="text"
                className="flex-1 w-24 px-2 py-1 border border-gray-300 rounded text-sm"
                value={layer.color || '#FFFFFF'}
                onChange={(e) => updateLayerField('color', e.target.value)}
              />
            </div>
          </>
        );

      case 'LogoLayer':
      case 'ImageLayer':
        // Extract current size value
        let currentSize: string | number = '';
        if (typeof layer.size === 'number') {
          currentSize = layer.size;
        } else if (layer.size && typeof layer.size === 'object') {
          // Check for various size properties
          if (layer.size.width) {
            currentSize = layer.size.width;
          } else if (layer.size.max_width) {
            currentSize = layer.size.max_width;
          } else if (layer.size.dynamic === true) {
            // For dynamic sizing, use a default value
            currentSize = 280; // Default max_width for dynamic sizing
          }
        }
        
        // Extract current y position
        let currentY: string | number = '';
        if (typeof layer.y === 'number') {
          currentY = layer.y;
        } else if (layer.position && typeof layer.position === 'object') {
          // Check if position.y is a number
          if (typeof layer.position.y === 'number') {
            currentY = layer.position.y;
          }
          // If position.y is "dynamic" or "center", leave empty
        }
        
        return (
          <>
            <div className="flex items-center mb-3">
              <label className="flex-shrink-0 w-[120px] text-sm text-gray-600 mr-4">Path</label>
              <input
                type="text"
                className="flex-1 px-3 py-1 border border-gray-300 rounded-md bg-gray-100 cursor-not-allowed"
                value={layer.path || ''}
                onChange={(e) => updateLayerField('path', e.target.value)}
                disabled
              />
            </div>
            
            <div className="flex items-center mb-3">
              <label className="flex-shrink-0 w-[120px] text-sm text-gray-600 mr-4">Size: {currentSize || 280}</label>
              <input
                type="range"
                className="flex-1"
                min="100"
                max="400"
                value={currentSize || 280}
                onChange={(e) => {
                  const value = parseInt(e.target.value);
                  updateLayerField('size', value);
                }}
              />
            </div>
            
            <div className="flex items-center mb-3">
              <label className="flex-shrink-0 w-[120px] text-sm text-gray-600 mr-4">Y Position: {typeof currentY === 'number' ? currentY : currentY || 'dynamic'}</label>
              <input
                type="range"
                className="flex-1"
                min="50"
                max="550"
                value={typeof currentY === 'number' ? currentY : 300}
                onChange={(e) => {
                  const value = parseInt(e.target.value);
                  updateLayerField('y', value);
                }}
              />
            </div>
            
            {layer.opacity !== undefined && (
              <div className="flex items-center mb-3">
                <label className="flex-shrink-0 w-[120px] text-sm text-gray-600 mr-4">Opacity</label>
                <input
                  type="number"
                  className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                  min="0"
                  max="1"
                  step="0.1"
                  value={layer.opacity}
                  onChange={(e) => updateLayerField('opacity', parseFloat(e.target.value))}
                />
              </div>
            )}
          </>
        );

      default:
        return <div className="text-red-500">Unknown layer type: {layer.type}</div>;
    }
  };

  return (
    <div className="mb-4 border border-gray-200 rounded overflow-hidden">
      <div className="bg-gray-100 px-3 py-2 border-b border-gray-200">
        <h4 className="text-sm text-gray-800">Layer {index + 1}: {layer.type}</h4>
      </div>
      <div className="p-4 bg-white">
        {renderLayerControls()}
      </div>
    </div>
  );
};

export default LayerEditor;