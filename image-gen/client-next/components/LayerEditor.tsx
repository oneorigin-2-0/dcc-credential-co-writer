"use client";

import './LayerEditor.css';

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
            <div className="form-group">
              <label>Shape</label>
              <select
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
                <div className="form-group">
                  <label>Start Color</label>
                  <input
                    type="color"
                    value={layer.fill.start_color || '#000000'}
                    onChange={(e) => updateLayerField('fill.start_color', e.target.value)}
                  />
                  <input
                    type="text"
                    value={layer.fill.start_color || '#000000'}
                    onChange={(e) => updateLayerField('fill.start_color', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>End Color</label>
                  <input
                    type="color"
                    value={layer.fill.end_color || '#000000'}
                    onChange={(e) => updateLayerField('fill.end_color', e.target.value)}
                  />
                  <input
                    type="text"
                    value={layer.fill.end_color || '#000000'}
                    onChange={(e) => updateLayerField('fill.end_color', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Vertical Gradient</label>
                  <input
                    type="checkbox"
                    checked={layer.fill.vertical}
                    onChange={(e) => updateLayerField('fill.vertical', e.target.checked)}
                  />
                </div>
              </>
            )}

            {layer.fill && layer.fill.mode === 'solid' && (
              <div className="form-group">
                <label>Fill Color</label>
                <input
                  type="color"
                  value={layer.fill.color || '#000000'}
                  onChange={(e) => updateLayerField('fill.color', e.target.value)}
                />
                <input
                  type="text"
                  value={layer.fill.color || '#000000'}
                  onChange={(e) => updateLayerField('fill.color', e.target.value)}
                />
              </div>
            )}
            
            {/* Show Radius for hexagon, Margin for circle */}
            {layer.shape === 'hexagon' && layer.params && (
              <div className="form-group">
                <label>Radius</label>
                <input
                  type="number"
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
              <div className="form-group">
                <label>Radius</label>
                <input
                  type="number"
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
                <div className="form-group">
                  <label>Width</label>
                  <input
                    type="number"
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
                <div className="form-group">
                  <label>Height</label>
                  <input
                    type="number"
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
                <div className="form-group">
                  <label>Corner Radius</label>
                  <input
                    type="number"
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
                <div className="form-group">
                  <label>Border Width</label>
                  <input
                    type="number"
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
                  <div className="form-group">
                    <label>Border Color</label>
                    <input
                      type="color"
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
            <div className="form-group">
              <label>Text</label>
              <input
                type="text"
                value={layer.text || ''}
                onChange={(e) => updateLayerField('text', e.target.value)}
              />
            </div>
            
            {layer.font && (
              <div className="form-group">
                <label>Font Size</label>
                <input
                  type="number"
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
            
            <div className="form-group">
              <label>Text Color</label>
              <input
                type="color"
                value={layer.color || '#000000'}
                onChange={(e) => updateLayerField('color', e.target.value)}
              />
              <input
                type="text"
                value={layer.color || '#000000'}
                onChange={(e) => updateLayerField('color', e.target.value)}
              />
            </div>
            
            {layer.align && (
              <>
                <div className="form-group">
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
                </div>
                <div className="form-group">
                  <label>Vertical Align</label>
                  <select
                    value={layer.align.y || 'center'}
                    onChange={(e) => {
                      const updatedLayer = {
                        ...layer,
                        align: { ...layer.align, y: e.target.value }
                      };
                      onChange(updatedLayer);
                    }}
                  >
                    <option value="top">Top</option>
                    <option value="center">Center</option>
                    <option value="bottom">Bottom</option>
                    <option value="dynamic">Dynamic</option>
                  </select>
                </div>
              </>
            )}
          </>
        );

      case 'BackgroundLayer':
        return (
          <>
            <div className="form-group">
              <label>Mode</label>
              <select
                value={layer.mode || 'solid'}
                onChange={(e) => updateLayerField('mode', e.target.value)}
              >
                <option value="solid">Solid</option>
                <option value="gradient">Gradient</option>
              </select>
            </div>
            
            <div className="form-group">
              <label>Color</label>
              <input
                type="color"
                value={layer.color || '#FFFFFF'}
                onChange={(e) => updateLayerField('color', e.target.value)}
              />
              <input
                type="text"
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
            <div className="form-group">
              <label>Path</label>
              <input
                type="text"
                value={layer.path || ''}
                onChange={(e) => updateLayerField('path', e.target.value)}
                disabled
              />
            </div>
            
            <div className="form-group">
              <label>Size</label>
              <input
                type="number"
                value={currentSize === '' ? '' : currentSize}
                onChange={(e) => {
                  const value = e.target.value === '' ? 100 : parseInt(e.target.value);
                  updateLayerField('size', value);
                }}
                placeholder="Size (maintains aspect ratio)"
              />
            </div>
            
            <div className="form-group">
              <label>Y Position</label>
              <input
                type="number"
                value={currentY === '' ? '' : currentY}
                onChange={(e) => {
                  const value = e.target.value === '' ? 0 : parseInt(e.target.value);
                  updateLayerField('y', value);
                }}
                placeholder="Y position (center if empty)"
              />
            </div>
            
            {layer.opacity !== undefined && (
              <div className="form-group">
                <label>Opacity</label>
                <input
                  type="number"
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
        return <div>Unknown layer type: {layer.type}</div>;
    }
  };

  return (
    <div className="layer-editor">
      <div className="layer-header">
        <h4>Layer {index + 1}: {layer.type}</h4>
      </div>
      <div className="layer-controls">
        {renderLayerControls()}
      </div>
    </div>
  );
};

export default LayerEditor;