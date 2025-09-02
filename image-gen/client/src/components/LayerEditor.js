import React from 'react';
import './LayerEditor.css';

const LayerEditor = ({ layer, index, onChange }) => {
  const updateLayerField = (field, value) => {
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
                value={layer.shape}
                onChange={(e) => updateLayerField('shape', e.target.value)}
              >
                <option value="hexagon">Hexagon</option>
                <option value="circle">Circle</option>
                <option value="star">Star</option>
                <option value="shield">Shield</option>
              </select>
            </div>
            
            {layer.fill && layer.fill.mode === 'gradient' && (
              <>
                <div className="form-group">
                  <label>Start Color</label>
                  <input
                    type="color"
                    value={layer.fill.start_color}
                    onChange={(e) => updateLayerField('fill.start_color', e.target.value)}
                  />
                  <input
                    type="text"
                    value={layer.fill.start_color}
                    onChange={(e) => updateLayerField('fill.start_color', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>End Color</label>
                  <input
                    type="color"
                    value={layer.fill.end_color}
                    onChange={(e) => updateLayerField('fill.end_color', e.target.value)}
                  />
                  <input
                    type="text"
                    value={layer.fill.end_color}
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
            
            {layer.params && layer.params.radius && (
              <div className="form-group">
                <label>Radius</label>
                <input
                  type="number"
                  value={layer.params.radius}
                  onChange={(e) => {
                    const updatedLayer = {
                      ...layer,
                      params: { ...layer.params, radius: parseInt(e.target.value) }
                    };
                    onChange(updatedLayer);
                  }}
                />
              </div>
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
                value={layer.text}
                onChange={(e) => updateLayerField('text', e.target.value)}
              />
            </div>
            
            {layer.font && (
              <div className="form-group">
                <label>Font Size</label>
                <input
                  type="number"
                  value={layer.font.size}
                  onChange={(e) => {
                    const updatedLayer = {
                      ...layer,
                      font: { ...layer.font, size: parseInt(e.target.value) }
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
                value={layer.color}
                onChange={(e) => updateLayerField('color', e.target.value)}
              />
              <input
                type="text"
                value={layer.color}
                onChange={(e) => updateLayerField('color', e.target.value)}
              />
            </div>
            
            {layer.align && (
              <>
                <div className="form-group">
                  <label>Horizontal Align</label>
                  <select
                    value={layer.align.x}
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
                  </select>
                </div>
                <div className="form-group">
                  <label>Vertical Align</label>
                  <select
                    value={layer.align.y}
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
                value={layer.mode}
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
                value={layer.color}
                onChange={(e) => updateLayerField('color', e.target.value)}
              />
              <input
                type="text"
                value={layer.color}
                onChange={(e) => updateLayerField('color', e.target.value)}
              />
            </div>
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
        <div className="form-group">
          <label>Z-Index</label>
          <input
            type="number"
            value={layer.z}
            onChange={(e) => updateLayerField('z', parseInt(e.target.value))}
          />
        </div>
      </div>
    </div>
  );
};

export default LayerEditor;