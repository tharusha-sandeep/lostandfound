import { useState, useRef, useEffect } from 'react';
import HeatmapCanvas from './HeatmapCanvas';

/**
 * FloorMapViewer
 * Renders a floor-plan image with a heatmap overlay.
 *
 * Props
 *   floorMeta   – { id, label, imagePath }
 *   pins        – MapPin documents for this floor
 *   onMapClick  – (x, y) => void  (admin only, fractional coords)
 *   showDots    – bool
 *   intensity   – heat blob intensity multiplier
 */
export default function FloorMapViewer({
  floorMeta,
  pins = [],
  onMapClick,
  showDots = false,
  intensity = 1,
}) {
  const containerRef = useRef(null);
  const [dims, setDims] = useState({ width: 0, height: 0 });
  const [imgLoaded, setImgLoaded] = useState(false);

  // Re-measure container whenever the image loads or window resizes
  useEffect(() => {
    const measure = () => {
      if (containerRef.current) {
        const { offsetWidth, offsetHeight } = containerRef.current;
        setDims({ width: offsetWidth, height: offsetHeight });
      }
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [imgLoaded]);

  const handleCanvasClick = onMapClick
    ? (e, coords) => onMapClick(coords.x, coords.y)
    : undefined;

  return (
    <div
      ref={containerRef}
      style={{ position: 'relative', width: '100%', userSelect: 'none' }}
    >
      <img
        src={floorMeta.imagePath}
        alt={`${floorMeta.label} floor map`}
        style={{ width: '100%', display: 'block' }}
        onLoad={() => setImgLoaded(true)}
        draggable={false}
      />

      {imgLoaded && (
        <HeatmapCanvas
          pins={pins}
          width={dims.width}
          height={dims.height}
          intensity={intensity}
          onClick={handleCanvasClick}
          showDots={showDots}
        />
      )}

      {/* Click-target hint for admin */}
      {onMapClick && imgLoaded && (
        <div
          style={{
            position: 'absolute',
            bottom: 8,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(0,0,0,0.55)',
            color: '#fff',
            fontSize: 11,
            padding: '3px 10px',
            borderRadius: 20,
            pointerEvents: 'none',
          }}
        >
          Click on the map to place a pin
        </div>
      )}
    </div>
  );
}