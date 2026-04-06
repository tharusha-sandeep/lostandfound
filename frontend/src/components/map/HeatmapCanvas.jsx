import { useEffect, useRef, useCallback } from 'react';

/**
 * HeatmapCanvas
 * Draws a radial-gradient heatmap on a <canvas> that is overlaid on top of a
 * floor-plan <img>.  Pins are stored as fractional (0–1) coordinates so they
 * are resolution-independent.
 *
 * Props
 *   pins        – array of { x, y, postType }  (x, y in [0,1])
 *   width       – canvas width  (px) – should match the img width
 *   height      – canvas height (px) – should match the img height
 *   intensity   – multiplier for blob radius (default 1)
 *   onClick     – optional (e, {x, y}) => void  called with fractional coords
 *   showDots    – show individual pin dots on top of the heat blobs
 */
export default function HeatmapCanvas({
  pins = [],
  width,
  height,
  intensity = 1,
  onClick,
  showDots = false,
}) {
  const canvasRef = useRef(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !width || !height) return;
    canvas.width  = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, width, height);

    if (pins.length === 0) return;

    // ── 1. Paint heat blobs onto an off-screen canvas ──────────────────────
    const offscreen = document.createElement('canvas');
    offscreen.width  = width;
    offscreen.height = height;
    const off = offscreen.getContext('2d');

    const radius = Math.min(width, height) * 0.07 * intensity;

    pins.forEach(({ x, y }) => {
      const cx = x * width;
      const cy = y * height;
      const grad = off.createRadialGradient(cx, cy, 0, cx, cy, radius);
      grad.addColorStop(0,   'rgba(255,0,0,0.35)');
      grad.addColorStop(0.4, 'rgba(255,140,0,0.18)');
      grad.addColorStop(1,   'rgba(255,255,0,0)');
      off.fillStyle = grad;
      off.beginPath();
      off.arc(cx, cy, radius, 0, Math.PI * 2);
      off.fill();
    });

    // ── 2. Colorise the greyscale alpha channel with a hot colour map ──────
    const imgData = off.getImageData(0, 0, width, height);
    const d = imgData.data;
    for (let i = 0; i < d.length; i += 4) {
      const alpha = d[i + 3];           // original alpha encodes heat intensity
      if (alpha === 0) continue;
      const t = alpha / 255;            // 0 → cool, 1 → hot
      // colour: yellow → orange → red → deep red
      d[i]     = 255;
      d[i + 1] = Math.round(255 * (1 - t));
      d[i + 2] = 0;
      d[i + 3] = Math.round(alpha * 0.82);
    }
    ctx.putImageData(imgData, 0, 0);

    // ── 3. Optionally draw individual dot markers ──────────────────────────
    if (showDots) {
      pins.forEach(({ x, y, postType }) => {
        const cx = x * width;
        const cy = y * height;
        ctx.beginPath();
        ctx.arc(cx, cy, 6, 0, Math.PI * 2);
        ctx.fillStyle = postType === 'lost' ? '#ef4444' : '#22c55e';
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      });
    }
  }, [pins, width, height, intensity, showDots]);

  useEffect(() => { draw(); }, [draw]);

  const handleClick = (e) => {
    if (!onClick || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left)  / rect.width;
    const y = (e.clientY - rect.top)   / rect.height;
    onClick(e, { x: Math.round(x * 10000) / 10000, y: Math.round(y * 10000) / 10000 });
  };

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      onClick={handleClick}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        cursor: onClick ? 'crosshair' : 'default',
        pointerEvents: onClick ? 'auto' : 'none',
      }}
    />
  );
}