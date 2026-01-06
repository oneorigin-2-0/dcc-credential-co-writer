'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Upload, Trash2, X, ChevronDown } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export interface BadgeImageConfigurationData {
  enable_image_generation?: boolean;
  shape?: 'hexagon' | 'circle' | 'rounded_rect' | null;
  fill_mode?: 'solid' | 'gradient' | null;
  fill_color?: string | null;
  start_color?: string | null;
  end_color?: string | null;
  gradient_direction?: 'vertical' | 'horizontal';
  width?: number;
  height?: number;
  logo_file?: File;
  logo_base64?: string;
  logo_file_name?: string;
}

interface BadgeImageConfigurationProps {
  onConfigurationChange?: (config: BadgeImageConfigurationData) => void;
  variant?: 'card' | 'inline';
  initialConfig?: BadgeImageConfigurationData;
}

// Helper functions for color conversion
const hexToHsl = (hex: string): [number, number, number] => {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
};

const hslToHex = (h: number, s: number, l: number): string => {
  s /= 100;
  l /= 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs((h / 60) % 2 - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;
  if (h < 60) { r = c; g = x; b = 0; }
  else if (h < 120) { r = x; g = c; b = 0; }
  else if (h < 180) { r = 0; g = c; b = x; }
  else if (h < 240) { r = 0; g = x; b = c; }
  else if (h < 300) { r = x; g = 0; b = c; }
  else { r = c; g = 0; b = x; }
  const toHex = (n: number) => {
    const hex = Math.round((n + m) * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

export function BadgeImageConfiguration({ onConfigurationChange, variant = 'card', initialConfig }: BadgeImageConfigurationProps) {
  // Selection state: 'none' | 'upload' | 'configure'
  const [selectedOption, setSelectedOption] = useState<'none' | 'upload' | 'configure'>('none');

  // Image generation toggle - defaults to FALSE
  const [enableImageGeneration, setEnableImageGeneration] = useState(initialConfig?.enable_image_generation ?? false);

  // Image configuration state - ALL DEFAULT TO NULL/UNSELECTED
  const [imageShape, setImageShape] = useState<'hexagon' | 'circle' | 'rounded_rect' | null>(initialConfig?.shape || null);
  const [fillMode, setFillMode] = useState<'solid' | 'gradient' | null>(initialConfig?.fill_mode || null);
  const [fillColor, setFillColor] = useState<string | null>(initialConfig?.fill_color || null);
  const [startColor, setStartColor] = useState<string | null>(initialConfig?.start_color || null);
  const [endColor, setEndColor] = useState<string | null>(initialConfig?.end_color || null);
  const [gradientDirection, setGradientDirection] = useState<'vertical' | 'horizontal'>(initialConfig?.gradient_direction || 'vertical');
  const [width, setWidth] = useState(initialConfig?.width || 450);
  const [height, setHeight] = useState(initialConfig?.height || 450);
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);

  // Badge image upload state
  const [badgeImageFile, setBadgeImageFile] = useState<File | null>(null);
  const [badgeImageBase64, setBadgeImageBase64] = useState<string>('');
  const [badgeImageFileName, setBadgeImageFileName] = useState<string>('');

  // Color picker state for solid color (defaults for picker UI only)
  const defaultPickerColor = '#00B4D8';
  const [currentColor, setCurrentColor] = useState(fillColor || defaultPickerColor);
  const [hue, setHue] = useState(() => hexToHsl(fillColor || defaultPickerColor)[0]);
  const [saturation, setSaturation] = useState(() => hexToHsl(fillColor || defaultPickerColor)[1]);
  const [lightness, setLightness] = useState(() => hexToHsl(fillColor || defaultPickerColor)[2]);
  const [opacity, setOpacity] = useState(100);

  // Color picker state for gradient start color
  const defaultStartColor = '#E76F51';
  const defaultEndColor = '#FF8C42';
  const [currentGradientColor, setCurrentGradientColor] = useState<'start' | 'end'>('start');
  const [startHue, setStartHue] = useState(() => hexToHsl(startColor || defaultStartColor)[0]);
  const [startSaturation, setStartSaturation] = useState(() => hexToHsl(startColor || defaultStartColor)[1]);
  const [startLightness, setStartLightness] = useState(() => hexToHsl(startColor || defaultStartColor)[2]);
  const [startOpacity, setStartOpacity] = useState(100);

  // Color picker state for gradient end color
  const [endHue, setEndHue] = useState(() => hexToHsl(endColor || defaultEndColor)[0]);
  const [endSaturation, setEndSaturation] = useState(() => hexToHsl(endColor || defaultEndColor)[1]);
  const [endLightness, setEndLightness] = useState(() => hexToHsl(endColor || defaultEndColor)[2]);
  const [endOpacity, setEndOpacity] = useState(100);

  const colorAreaRef = useRef<HTMLDivElement>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoFileName, setLogoFileName] = useState(initialConfig?.logo_file_name || '');

  // Store logo base64 when file is uploaded
  const [logoBase64, setLogoBase64] = useState<string | undefined>(initialConfig?.logo_base64);

  // Convert logo file to base64 when file changes
  useEffect(() => {
    if (logoFile) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoBase64(reader.result as string);
      };
      reader.readAsDataURL(logoFile);
    } else {
      setLogoBase64(undefined);
    }
  }, [logoFile]);

  // Handle logo upload
  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/png', 'image/svg+xml'];
    if (!validTypes.includes(file.type)) {
      alert('Please upload a PNG or SVG file only.');
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      alert('Please upload a file smaller than 5MB.');
      return;
    }

    setLogoFile(file);
    setLogoFileName(file.name);
    // The useEffect will handle converting to base64 and updating config
  };

  // Handle logo removal
  const handleRemoveLogo = () => {
    setLogoFile(null);
    setLogoFileName('');
    // The useEffect will handle updating config without logo
  };

  // Handle badge image upload
  const handleBadgeImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'];
    if (!validTypes.includes(file.type)) {
      alert('Please upload a PNG, JPG, or SVG file only.');
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      alert('Please upload a file smaller than 5MB.');
      return;
    }

    setBadgeImageFile(file);
    setBadgeImageFileName(file.name);

    // Convert to base64
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setBadgeImageBase64(base64);
    };
    reader.readAsDataURL(file);
  };

  // Handle badge image removal
  const handleRemoveBadgeImage = () => {
    setBadgeImageFile(null);
    setBadgeImageBase64('');
    setBadgeImageFileName('');
  };

  // Store previous config to prevent unnecessary updates
  const prevConfigRef = React.useRef<BadgeImageConfigurationData | null>(null);

  // Notify parent component when configuration changes
  useEffect(() => {
    if (onConfigurationChange) {
      // Only send config if an option is selected
      if (selectedOption === 'none') {
        // Send null/empty config when nothing is selected
        onConfigurationChange({});
        return;
      }

      if (selectedOption === 'upload') {
        // Send badge image upload data
        const config: BadgeImageConfigurationData = {
          enable_image_generation: false, // User uploaded their own badge image
          logo_base64: badgeImageBase64 || undefined,
          logo_file_name: badgeImageFileName || undefined,
        };
        onConfigurationChange(config);
        return;
      }

      if (selectedOption === 'configure') {
        // Send badge configuration data
        const config: BadgeImageConfigurationData = {
          enable_image_generation: enableImageGeneration, // ← Include toggle state
          shape: imageShape,
          fill_mode: fillMode,
          fill_color: fillColor,
          start_color: startColor,
          end_color: endColor,
          gradient_direction: gradientDirection,
          width: imageShape === 'rounded_rect' ? width : undefined,
          height: imageShape === 'rounded_rect' ? height : undefined,
          logo_file: logoFile || undefined,
          logo_base64: logoBase64,
          logo_file_name: logoFileName || undefined,
        };

        // Only call onConfigurationChange if config actually changed
        const configString = JSON.stringify(config);
        const prevConfigString = JSON.stringify(prevConfigRef.current);

        if (configString !== prevConfigString) {
          prevConfigRef.current = config;
          onConfigurationChange(config);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedOption, enableImageGeneration, badgeImageBase64, badgeImageFileName, imageShape, fillMode, fillColor, startColor, endColor, gradientDirection, width, height, logoFile, logoFileName, logoBase64]);

  const isInline = variant === 'inline';
  const borderClass = isInline ? 'border-gray-200 focus:border-secondary focus:ring-secondary/20' : 'border-secondary focus:border-primary focus:ring-primary';
  const labelClass = isInline ? 'text-gray-700 font-medium text-sm mb-2' : 'text-foreground font-subhead font-medium text-sm mb-2';

  const shapes = [
    { value: 'hexagon' as const, label: 'Hexagon' },
    { value: 'circle' as const, label: 'Circle' },
    { value: 'rounded_rect' as const, label: 'Rounded Rectangle' },
  ];

  const fillModes = [
    { value: 'solid' as const, label: 'Solid' },
    { value: 'gradient' as const, label: 'Gradient' },
  ];

  const gradientDirections = [
    { value: 'vertical' as const, label: 'Vertical' },
    { value: 'horizontal' as const, label: 'Horizontal' },
  ];

  const formContent = selectedOption === 'none' ? (
    // Initial selection screen
    <div className='h-full flex flex-col items-center justify-center '>
      <div className="text-center space-y-4 w-full">
        <p className="text-sm text-gray-600 mb-4">Choose how you want to add your badge image:</p>
        <button
          type="button"
          onClick={() => setSelectedOption('upload')}
          className="w-full px-6 py-4 text-left border-2 border-gray-200 rounded-lg hover:border-secondary hover:bg-secondary/5 active:scale-[0.98] active:shadow-sm transition-all duration-200 shadow-sm hover:shadow-md"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-secondary/10 rounded-lg transition-all duration-200">
              <Upload className="h-5 w-5 text-secondary" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Upload your own Badge Image</h3>
              <p className="text-xs text-gray-600 mt-1">Upload a pre-designed badge image file</p>
            </div>
          </div>
        </button>
      </div>

      <div className="flex items-center py-3">
        <span className="text-sm font-medium text-gray-500">OR</span>
      </div>

      <button
        type="button"
        onClick={() => setSelectedOption('configure')}
        className="w-full px-6 py-4 text-left border-2 border-gray-200 rounded-lg hover:border-secondary hover:bg-secondary/5 active:scale-[0.98] active:shadow-sm transition-all duration-200 shadow-sm hover:shadow-md"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-secondary/10 rounded-lg transition-all duration-200">
            <svg className="h-5 w-5 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Add your own badge configuration</h3>
            <p className="text-xs text-gray-600 mt-1">Customize shape, colors, and design elements</p>
          </div>
        </div>
      </button>
    </div>

  ) : selectedOption === 'upload' ? (
    // Badge image upload interface
    <div className='h-full animate-in fade-in slide-in-from-left-5 duration-300' >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-primary">Upload your own Badge Image</h3>
        <button
          type="button"
          onClick={() => {
            setSelectedOption('none');
            handleRemoveBadgeImage();
          }}
          className="text-xs text-gray-600 hover:text-gray-900"
        >
          ← Back
        </button>
      </div>

      <div className="h-full flex flex-col items-center justify-center">
        <input
          type="file"
          id="badge-image-upload"
          accept=".png,.jpg,.jpeg,.svg"
          onChange={handleBadgeImageUpload}
          className="hidden"
        />

        {!badgeImageFileName ? (
          <div
            onClick={() => document.getElementById('badge-image-upload')?.click()}
            className="border-2 border-dashed border-gray-300 rounded-lg text-center cursor-pointer hover:border-secondary hover:bg-secondary/5 transition-all flex flex-col items-center justify-center p-12"
          >
            <div className="flex flex-col items-center justify-center gap-2">
              <div className="w-16 h-16 bg-gradient-to-br from-secondary/20 to-primary/20 rounded-lg flex items-center justify-center">
                <svg className="w-10 h-10 text-secondary" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                </svg>
              </div>
              <p className="text-base text-gray-700 font-medium">
                Upload your image here, or{' '}
                <span className="text-secondary font-semibold">browse</span>
              </p>
              {!badgeImageFileName && (
                <p className="text-xs text-gray-500">Supported: PNG, JPG, SVG (max 5MB)</p>
              )}
            </div>
          </div>
        ) : (
          <div className="mt-1 space-y-3">
            {/* Badge Image Preview */}
            {badgeImageBase64 && (
              <div
                className="flex items-center justify-center p-4 border-2 border-gray-200 rounded-lg"
                style={{
                  backgroundImage: `
                  linear-gradient(45deg, hsl(var(--muted) / 0.3) 25%, transparent 25%), 
                  linear-gradient(-45deg, hsl(var(--muted) / 0.3) 25%, transparent 25%), 
                  linear-gradient(45deg, transparent 75%, hsl(var(--muted) / 0.3) 75%), 
                  linear-gradient(-45deg, transparent 75%, hsl(var(--muted) / 0.3) 75%)
                `,
                  backgroundSize: '20px 20px',
                  backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
                }}
              >
                <div className="relative flex items-center justify-center">
                  <img
                    src={badgeImageBase64}
                    alt="Badge preview"
                    className="max-w-full max-h-[200px] object-contain relative z-10"
                  />
                </div>
              </div>
            )}
            {/* File Info and Remove Button */}
            <div className="flex items-center gap-2">
              <div className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded bg-gray-50 text-gray-700 truncate">
                {badgeImageFileName}
              </div>
              <button
                type="button"
                onClick={handleRemoveBadgeImage}
                className="px-2 py-2 text-sm border border-red-300 text-red-600 rounded hover:bg-red-50 transition-colors"
                title="Remove badge image"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  ) : (
    // Badge configuration interface (existing form)
    <div className="space-y-4 animate-in fade-in slide-in-from-right-5 duration-300">
      <div className="flex items-center mb-4 relative">
        <h3 className="text-base font-semibold text-primary">Select your Image Configuration</h3>
        <button
          type="button"
          onClick={() => setSelectedOption('none')}
          className="text-xs text-gray-600 hover:text-gray-900 absolute right-0"
        >
          ← Back
        </button>
      </div>

      {/* Enable Image Generation Toggle */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-secondary/5 to-primary/5 rounded-lg border border-secondary/20 mb-4">
        <div className="flex flex-col">
          <Label htmlFor="enable-generation" className="text-sm font-semibold text-gray-900 mb-1">
            Enable Image Generation
          </Label>
          <p className="text-xs text-gray-600">
            Turn on to generate badge image with your configuration
          </p>
        </div>
        <Switch
          id="enable-generation"
          checked={enableImageGeneration}
          onCheckedChange={setEnableImageGeneration}
          className="data-[state=checked]:bg-secondary"
        />
      </div>

      {/* Shape Tiles */}
      <div>
        <Label className={labelClass}>Select Shape</Label>
        {!imageShape && (
          <p className="text-xs text-gray-400 italic mt-1 mb-2">No shape selected</p>
        )}
        <div className="flex flex-wrap gap-2">
          {shapes.map((shape) => (
            <button
              key={shape.value}
              type="button"
              onClick={() => setImageShape(shape.value)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md border-2 transition-all shadow-sm ${imageShape === shape.value
                ? 'bg-secondary text-white border-secondary shadow-md ring-2 ring-secondary/20'
                : 'bg-white text-gray-700 border-gray-200 hover:border-secondary hover:bg-secondary/5 hover:shadow-md'
                }`}
            >
              {shape.label}
            </button>
          ))}
        </div>
      </div>

      {/* Select Background Color */}
      <div>
        <Label className={labelClass}>Select Background Color</Label>
        <div className="flex items-center gap-3 mt-1">
          <Dialog open={isColorPickerOpen} onOpenChange={setIsColorPickerOpen}>
            <DialogTrigger asChild>
              <div
                className="w-8 h-8 rounded border-2 border-gray-300 shadow-sm cursor-pointer hover:border-secondary transition-all flex items-center justify-center"
                style={{
                  background: fillMode === 'gradient' && startColor && endColor
                    ? `linear-gradient(${gradientDirection === 'vertical' ? 'to bottom' : 'to right'}, ${startColor}, ${endColor})`
                    : fillMode === 'solid' && fillColor
                    ? fillColor
                    : 'hsl(var(--muted) / 0.2)'
                }}
              >
                {!fillColor && !startColor && (
                  <span className="text-xs text-gray-400 font-semibold">?</span>
                )}
              </div>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[400px] p-0 [&>button]:hidden">
              <DialogHeader className="px-6 pt-4 pb-4 border-b border-gray-200 flex flex-row items-center justify-between gap-4">
                <DialogTitle className="text-lg font-semibold text-primary">Select Background Color</DialogTitle>
                <button
                  onClick={() => setIsColorPickerOpen(false)}
                  className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
                >
                  <X className="h-4 w-4 text-gray-600" />
                  <span className="sr-only">Close</span>
                </button>
              </DialogHeader>

              <div className="px-6 pb-6 pt-0 space-y-4">
                {/* Mode Selection */}
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">Mode</Label>
                  <div className="flex gap-2">
                    {fillModes.map((mode) => (
                      <button
                        key={mode.value}
                        type="button"
                        onClick={() => setFillMode(mode.value)}
                        className={`px-3 py-1.5 text-sm font-medium rounded-md border-2 transition-all shadow-sm ${fillMode === mode.value
                          ? 'bg-secondary text-white border-secondary shadow-md ring-2 ring-secondary/20'
                          : 'bg-white text-gray-700 border-gray-200 hover:border-secondary hover:bg-secondary/5 hover:shadow-md'
                          }`}
                      >
                        {mode.label}
                      </button>
                    ))}
                  </div>
                </div>
                {/* Color Preview */}
                <div className="pb-2 border-b border-gray-200">
                  <div
                    className="w-full h-16 rounded-lg border-2 border-gray-300 shadow-sm relative overflow-hidden"
                    style={{
                      background: fillMode === 'gradient'
                        ? `linear-gradient(${gradientDirection === 'vertical' ? 'to bottom' : 'to right'}, ${startColor}${startOpacity < 100 ? Math.round(startOpacity * 2.55).toString(16).padStart(2, '0') : ''}, ${endColor}${endOpacity < 100 ? Math.round(endOpacity * 2.55).toString(16).padStart(2, '0') : ''})`
                        : `${fillColor}${opacity < 100 ? Math.round(opacity * 2.55).toString(16).padStart(2, '0') : ''}`
                    }}
                  >
                    <div
                      className="absolute inset-0 bg-[repeating-linear-gradient(45deg,#ccc_25%,transparent_25%,transparent_50%,#ccc_50%,#ccc_75%,transparent_75%,transparent)] opacity-20"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    {fillMode === 'gradient' && startColor && endColor
                      ? `Gradient: ${startColor.toUpperCase()} → ${endColor.toUpperCase()}`
                      : fillMode === 'solid' && fillColor
                      ? `Solid: ${fillColor.toUpperCase()}`
                      : 'No color selected'
                    }
                  </p>
                </div>
                {/* Color Selection Area */}
                {fillMode === 'gradient' && (
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex gap-2">
                      <button
                        onClick={() => setCurrentGradientColor('start')}
                        className={`px-3 py-1 text-xs rounded border ${currentGradientColor === 'start'
                          ? 'bg-secondary text-white border-secondary'
                          : 'bg-white text-gray-700 border-gray-300'
                          }`}
                      >
                        Start
                      </button>
                      <button
                        onClick={() => setCurrentGradientColor('end')}
                        className={`px-3 py-1 text-xs rounded border ${currentGradientColor === 'end'
                          ? 'bg-secondary text-white border-secondary'
                          : 'bg-white text-gray-700 border-gray-300'
                          }`}
                      >
                        End
                      </button>
                    </div>
                    <div className="flex items-center gap-2 ml-auto">
                      <Label className="text-xs text-gray-600">Direction:</Label>
                      <div className="flex gap-2">
                        {gradientDirections.map((direction) => (
                          <button
                            key={direction.value}
                            type="button"
                            onClick={() => setGradientDirection(direction.value)}
                            className={`px-2 py-1 text-xs font-medium rounded border transition-all ${gradientDirection === direction.value
                              ? 'bg-secondary text-white border-secondary'
                              : 'bg-white text-gray-700 border-gray-300 hover:border-secondary'
                              }`}
                          >
                            {direction.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Large Color Selection Area */}
                <div className="relative">
                  <div
                    ref={colorAreaRef}
                    className="w-full h-[200px] rounded border border-gray-300 cursor-crosshair relative overflow-hidden"
                    style={{
                      background: `linear-gradient(to bottom, transparent, black), linear-gradient(to right, white, hsl(${fillMode === 'gradient' ? (currentGradientColor === 'start' ? startHue : endHue) : hue}, 100%, 50%))`
                    }}
                    onMouseDown={(e) => {
                      if (!colorAreaRef.current) return;
                      const handleMouseMove = (moveEvent: MouseEvent) => {
                        const rect = colorAreaRef.current!.getBoundingClientRect();
                        const x = Math.max(0, Math.min(1, (moveEvent.clientX - rect.left) / rect.width));
                        const y = Math.max(0, Math.min(1, (moveEvent.clientY - rect.top) / rect.height));

                        if (fillMode === 'gradient') {
                          if (currentGradientColor === 'start') {
                            setStartSaturation(Math.round(x * 100));
                            setStartLightness(Math.round((1 - y) * 100));
                            const newHex = hslToHex(startHue, Math.round(x * 100), Math.round((1 - y) * 100));
                            setStartColor(newHex);
                          } else {
                            setEndSaturation(Math.round(x * 100));
                            setEndLightness(Math.round((1 - y) * 100));
                            const newHex = hslToHex(endHue, Math.round(x * 100), Math.round((1 - y) * 100));
                            setEndColor(newHex);
                          }
                        } else {
                          setSaturation(Math.round(x * 100));
                          setLightness(Math.round((1 - y) * 100));
                          const newHex = hslToHex(hue, Math.round(x * 100), Math.round((1 - y) * 100));
                          setFillColor(newHex);
                          setCurrentColor(newHex);
                        }
                      };

                      const handleMouseUp = () => {
                        document.removeEventListener('mousemove', handleMouseMove);
                        document.removeEventListener('mouseup', handleMouseUp);
                      };

                      document.addEventListener('mousemove', handleMouseMove);
                      document.addEventListener('mouseup', handleMouseUp);

                      handleMouseMove(e.nativeEvent);
                    }}
                  >
                    <div
                      className="absolute w-4 h-4 border-2 border-white rounded-full shadow-lg pointer-events-none"
                      style={{
                        left: `${(fillMode === 'gradient' ? (currentGradientColor === 'start' ? startSaturation : endSaturation) : saturation) / 100 * 100}%`,
                        top: `${(100 - (fillMode === 'gradient' ? (currentGradientColor === 'start' ? startLightness : endLightness) : lightness)) / 100 * 100}%`,
                        transform: 'translate(-50%, -50%)',
                      }}
                    />
                  </div>
                </div>

                {/* Hue Slider */}
                <div>
                  <div
                    className="w-full h-6 rounded border border-gray-300 cursor-pointer relative"
                    style={{
                      // Rainbow spectrum for hue selection - these colors represent the full visible spectrum
                      background: 'linear-gradient(to right, #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #4b0082, #9400d3, #ff0000)'
                    }}
                    onMouseDown={(e) => {
                      const handleMouseMove = (moveEvent: MouseEvent) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const hueValue = Math.max(0, Math.min(360, Math.round(((moveEvent.clientX - rect.left) / rect.width) * 360)));
                        if (fillMode === 'gradient') {
                          if (currentGradientColor === 'start') {
                            setStartHue(hueValue);
                            const newHex = hslToHex(hueValue, startSaturation, startLightness);
                            setStartColor(newHex);
                          } else {
                            setEndHue(hueValue);
                            const newHex = hslToHex(hueValue, endSaturation, endLightness);
                            setEndColor(newHex);
                          }
                        } else {
                          setHue(hueValue);
                          const newHex = hslToHex(hueValue, saturation, lightness);
                          setFillColor(newHex);
                          setCurrentColor(newHex);
                        }
                      };

                      const handleMouseUp = () => {
                        document.removeEventListener('mousemove', handleMouseMove);
                        document.removeEventListener('mouseup', handleMouseUp);
                      };

                      document.addEventListener('mousemove', handleMouseMove);
                      document.addEventListener('mouseup', handleMouseUp);

                      handleMouseMove(e.nativeEvent);
                    }}
                  >
                    <div
                      className="absolute top-0 w-1 h-full bg-white border border-gray-400 shadow-sm pointer-events-none"
                      style={{
                        left: `${(fillMode === 'gradient' ? (currentGradientColor === 'start' ? startHue : endHue) : hue) / 360 * 100}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Opacity Slider */}
                <div>
                  <div
                    className="w-full h-6 rounded border border-gray-300 cursor-pointer relative overflow-hidden"
                    style={{
                      background: `linear-gradient(to right, ${fillMode === 'gradient' ? (currentGradientColor === 'start' ? startColor : endColor) : fillColor}, transparent)`,
                    }}
                    onMouseDown={(e) => {
                      const handleMouseMove = (moveEvent: MouseEvent) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const opacityValue = Math.max(0, Math.min(100, Math.round(((moveEvent.clientX - rect.left) / rect.width) * 100)));
                        if (fillMode === 'gradient') {
                          if (currentGradientColor === 'start') {
                            setStartOpacity(opacityValue);
                          } else {
                            setEndOpacity(opacityValue);
                          }
                        } else {
                          setOpacity(opacityValue);
                        }
                      };

                      const handleMouseUp = () => {
                        document.removeEventListener('mousemove', handleMouseMove);
                        document.removeEventListener('mouseup', handleMouseUp);
                      };

                      document.addEventListener('mousemove', handleMouseMove);
                      document.addEventListener('mouseup', handleMouseUp);

                      handleMouseMove(e.nativeEvent);
                    }}
                  >
                    <div
                      className="absolute inset-0 bg-[repeating-linear-gradient(45deg,#ccc_25%,transparent_25%,transparent_50%,#ccc_50%,#ccc_75%,transparent_75%,transparent)] opacity-30"
                    />
                    <div
                      className="absolute top-0 w-1 h-full bg-white border border-gray-400 shadow-sm pointer-events-none"
                      style={{
                        left: `${(fillMode === 'gradient' ? (currentGradientColor === 'start' ? startOpacity : endOpacity) : opacity) / 100 * 100}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Color Value Inputs */}
                <div className="flex items-center gap-3 pt-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-600 font-medium">HEX</span>
                    <Input
                      type="text"
                      value={(fillMode === 'gradient' ? (currentGradientColor === 'start' ? startColor : endColor) : fillColor)?.toUpperCase().replace('#', '') || ''}
                      onChange={(e) => {
                        const val = e.target.value.startsWith('#') ? e.target.value : `#${e.target.value}`;
                        if (/^#[0-9A-Fa-f]{0,6}$/.test(val)) {
                          if (fillMode === 'gradient') {
                            if (currentGradientColor === 'start') {
                              setStartColor(val);
                              const [h, s, l] = hexToHsl(val);
                              setStartHue(h);
                              setStartSaturation(s);
                              setStartLightness(l);
                            } else {
                              setEndColor(val);
                              const [h, s, l] = hexToHsl(val);
                              setEndHue(h);
                              setEndSaturation(s);
                              setEndLightness(l);
                            }
                          } else {
                            setFillColor(val);
                            setCurrentColor(val);
                            const [h, s, l] = hexToHsl(val);
                            setHue(h);
                            setSaturation(s);
                            setLightness(l);
                          }
                        }
                      }}
                      className="w-20 h-8 text-xs font-mono border border-gray-300 rounded px-2"
                      placeholder="HEX"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="text"
                      value={`${fillMode === 'gradient' ? (currentGradientColor === 'start' ? startOpacity : endOpacity) : opacity}%`}
                      onChange={(e) => {
                        const val = parseInt(e.target.value.replace('%', '')) || 0;
                        const clampedVal = Math.max(0, Math.min(100, val));
                        if (fillMode === 'gradient') {
                          if (currentGradientColor === 'start') {
                            setStartOpacity(clampedVal);
                          } else {
                            setEndOpacity(clampedVal);
                          }
                        } else {
                          setOpacity(clampedVal);
                        }
                      }}
                      className="w-16 h-8 text-xs border border-gray-300 rounded px-2"
                      placeholder="100%"
                    />
                  </div>
                </div>

              </div>
            </DialogContent>
          </Dialog>
          <span className="text-sm font-medium text-gray-700">
            {!fillMode ? (
              <span className="text-gray-400 italic">Not selected</span>
            ) : fillMode === 'gradient' && startColor && endColor ? (
              `Gradient - ${startColor} → ${endColor}`
            ) : fillMode === 'solid' && fillColor ? (
              `Solid - ${fillColor}`
            ) : (
              <span className="text-gray-400 italic">Select a color</span>
            )}
          </span>
        </div>
      </div>

      {/* Logo Upload */}
      <div>
        <Label htmlFor="logo-upload" className={labelClass}>Select Logo</Label>
        <input
          type="file"
          id="logo-upload"
          accept=".png,.svg"
          onChange={handleLogoUpload}
          className="hidden"
        />
        
        {!logoFileName ? (
          <div
            onClick={() => document.getElementById('logo-upload')?.click()}
            className="border-2 border-dashed border-gray-300 rounded-lg text-center cursor-pointer hover:border-secondary hover:bg-secondary/5 transition-all flex flex-col items-center justify-center p-4 mt-1"
          >
            <div className="flex flex-col items-center justify-center gap-2">
              <div className="w-12 h-12 bg-gradient-to-br from-secondary/20 to-primary/20 rounded-lg flex items-center justify-center">
                <Upload className="h-6 w-6 text-secondary" />
              </div>
              <p className="text-sm text-gray-700 font-medium">
                Upload your logo here, or{' '}
                <span className="text-secondary font-semibold">browse</span>
              </p>
              <p className="text-xs text-gray-500">Supported: PNG, SVG (max 5MB)</p>
            </div>
          </div>
        ) : (
          <div className="mt-1 space-y-3">
            {/* Logo Preview */}
            {logoBase64 && (
              <div
                className="flex items-center justify-center p-4 border-2 border-gray-200 rounded-lg"
                style={{
                  backgroundImage: `
                    linear-gradient(45deg, hsl(var(--muted) / 0.3) 25%, transparent 25%), 
                    linear-gradient(-45deg, hsl(var(--muted) / 0.3) 25%, transparent 25%), 
                    linear-gradient(45deg, transparent 75%, hsl(var(--muted) / 0.3) 75%), 
                    linear-gradient(-45deg, transparent 75%, hsl(var(--muted) / 0.3) 75%)
                  `,
                  backgroundSize: '20px 20px',
                  backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
                }}
              >
                <div className="relative max-w-[300px] max-h-[300px] flex items-center justify-center">
                  <img
                    src={logoBase64}
                    alt="Logo preview"
                    className="max-w-full max-h-[200px] object-contain relative z-10"
                  />
                </div>
              </div>
            )}
            {/* File Info and Remove Button */}
            <div className="flex items-center gap-2">
              <div className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded bg-gray-50 text-gray-700 truncate">
                {logoFileName}
              </div>
              <button
                type="button"
                onClick={handleRemoveLogo}
                className="px-2 py-2 text-sm border border-red-300 text-red-600 rounded hover:bg-red-50 transition-colors"
                title="Remove logo"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );

  if (isInline) {
    return formContent;
  }

  return formContent;
}

