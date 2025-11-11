// Generate a random HEX color
export function generateRandomHexColor(): string {
  // Generate vibrant colors by ensuring RGB values are not too dark
  const r = Math.floor(Math.random() * 156) + 100; // 100-255
  const g = Math.floor(Math.random() * 156) + 100;
  const b = Math.floor(Math.random() * 156) + 100;
  
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

// Convert HEX to RGB
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

// Get inline styles for a tag with HEX color
export function getTagStyles(hexColor: string): {
  backgroundColor: string;
  color: string;
  borderColor: string;
} {
  const rgb = hexToRgb(hexColor);
  if (!rgb) {
    return {
      backgroundColor: 'rgba(59, 130, 246, 0.2)',
      color: 'rgb(147, 197, 253)',
      borderColor: 'rgba(59, 130, 246, 0.3)',
    };
  }

  return {
    backgroundColor: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.2)`,
    color: `rgb(${Math.min(rgb.r + 50, 255)}, ${Math.min(rgb.g + 50, 255)}, ${Math.min(rgb.b + 50, 255)})`,
    borderColor: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.4)`,
  };
}

// Get or assign a HEX color for a tag
export function getTagColor(tag: string, existingColors?: Record<string, string>): string {
  if (existingColors && existingColors[tag]) {
    return existingColors[tag];
  }
  return generateRandomHexColor();
}

// Create a persistent color mapping for all tags in a task
export function assignTagColors(tags: string[], existingColors?: Record<string, string>): Record<string, string> {
  const colors: Record<string, string> = { ...existingColors };
  
  tags.forEach(tag => {
    if (!colors[tag]) {
      colors[tag] = generateRandomHexColor();
    }
  });
  
  return colors;
}

