import { useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Map, Trash2, RefreshCw } from 'lucide-react';
import { fetchMapPins, deleteMapPin } from '../../services/mapPinService';
import { FLOORS, TIME_RANGES } from '../../utils/floorMaps';
import FloorMapViewer from './FloorMapViewer';
import PinPlacementModal from './PinPlacementModal';
import toast from 'react-hot-toast';

/**
 * FloorHeatmapPanel
 * Shared by AdminDashboardPage and user-facing view.
 *
 * Props
 *   isAdmin  – bool – if true, enables click-to-pin and delete controls
 */
export default function FloorHeatmapPanel({ isAdmin = false }) {
  const qc = useQueryClient();

  // ── Filters ────────────────────────────────────────────────────────────────
  const [activeFloor, setActiveFloor] = useState('1');
  const [range,       setRange]       = useState('all');
  const [typeFilter,  setTypeFilter]  = useState('both');
  const [showDots,    setShowDots]    = useState(true);

  // ── Admin pin-placement state ───────────────────────────────────────────────
  const [pendingPin, setPendingPin] = useState(null); // { x, y }

  // ── Data ───────────────────────────────────────────────────────────────────
  const queryKey = ['mappins', activeFloor, range, typeFilter];
  const { data, isLoading, refetch } = useQuery({
    queryKey,
    queryFn: () => fetchMapPins({ floor: activeFloor, range, type: typeFilter }),
    refetchInterval: 30_000,  // near-real-time: refresh every 30 s
  });

  const pins = data?.pins ?? [];

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleMapClick = useCallback((x, y) => {
    if (isAdmin) setPendingPin({ x, y });
  }, [isAdmin]);

  const handlePinSaved = useCallback(() => {
    qc.invalidateQueries({ queryKey: ['mappins'] });
  }, [qc]);

  const handleDeletePin = async (pinId) => {
    if (!window.confirm('Remove this pin from the map?')) return;
    try {
      await deleteMapPin(pinId);
      toast.success('Pin removed.');
      qc.invalidateQueries({ queryKey: ['mappins'] });
    } catch {/* axiosClient toasts */}
  };

  const floorMeta = FLOORS.find((f) => f.id === activeFloor);

  // ── Legend colours ─────────────────────────────────────────────────────────
  const legendStops = [
    { label: 'Low',    color: 'rgba(255,255,0,0.55)' },
    { label: 'Medium', color: 'rgba(255,140,0,0.75)' },
    { label: 'High',   color: 'rgba(255,0,0,0.85)'   },
  ];

  return (
    <div style={{ fontFamily: 'inherit' }}>
      {/* ── Panel header ───────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <Map size={22} style={{ color: '#4f46e5' }} />
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#111827' }}>
          Campus Item Heatmap
        </h2>
        <button
          onClick={() => refetch()}
          title="Refresh"
          style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}
        >
          <RefreshCw size={16} />
        </button>
      </div>

      {/* ── Controls row ───────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
        {/* Time range */}
        <div>
          <label style={labelStyle}>Time range</label>
          <select value={range} onChange={(e) => setRange(e.target.value)} style={selectStyle}>
            {TIME_RANGES.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </div>

        {/* Type filter */}
        <div>
          <label style={labelStyle}>Item type</label>
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} style={selectStyle}>
            <option value="both">Lost &amp; Found</option>
            <option value="lost">Lost only</option>
            <option value="found">Found only</option>
          </select>
        </div>

        {/* Show dots toggle */}
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
          <label style={{ ...labelStyle, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            <input
              type="checkbox"
              checked={showDots}
              onChange={(e) => setShowDots(e.target.checked)}
            />
            Show item dots
          </label>
        </div>

        {/* Pin count badge */}
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', marginLeft: 'auto' }}>
          <span style={{
            background: '#ede9fe', color: '#5b21b6',
            borderRadius: 20, padding: '4px 12px', fontSize: 13, fontWeight: 600,
          }}>
            {isLoading ? '…' : pins.length} pins
          </span>
        </div>
      </div>

      {/* ── Floor tabs ─────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
        {FLOORS.map((f) => (
          <button
            key={f.id}
            onClick={() => setActiveFloor(f.id)}
            style={{
              padding: '6px 14px', borderRadius: 20, border: 'none',
              background: activeFloor === f.id ? '#4f46e5' : '#e5e7eb',
              color: activeFloor === f.id ? '#fff' : '#374151',
              fontWeight: activeFloor === f.id ? 700 : 400,
              cursor: 'pointer', fontSize: 13,
              transition: 'background 0.15s',
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* ── Map + heatmap ──────────────────────────────────────────────────── */}
      <div style={{
        border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden',
        boxShadow: '0 2px 12px rgba(0,0,0,0.06)', background: '#f9fafb',
      }}>
        {isLoading ? (
          <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}>
            Loading heatmap…
          </div>
        ) : (
          <FloorMapViewer
            floorMeta={floorMeta}
            pins={pins}
            onMapClick={isAdmin ? handleMapClick : undefined}
            showDots={showDots}
            intensity={1.2}
          />
        )}
      </div>

      {/* ── Legend ─────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 10 }}>
        <span style={{ fontSize: 12, color: '#6b7280', fontWeight: 600 }}>Intensity:</span>
        {legendStops.map(({ label, color }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 16, height: 16, borderRadius: '50%', background: color, display: 'inline-block' }} />
            <span style={{ fontSize: 12, color: '#6b7280' }}>{label}</span>
          </div>
        ))}
        {showDots && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#ef4444', display: 'inline-block' }} />
              <span style={{ fontSize: 12, color: '#6b7280' }}>Lost</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
              <span style={{ fontSize: 12, color: '#6b7280' }}>Found</span>
            </div>
          </>
        )}
      </div>

      {/* ── Admin: list of pins on this floor ─────────────────────────────── */}
      {isAdmin && pins.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 10, color: '#374151' }}>
            Pins on {floorMeta?.label} ({pins.length})
          </h3>
          <div style={{ display: 'grid', gap: 8 }}>
            {pins.map((pin) => (
              <div
                key={pin._id}
                style={{
                  display: 'flex', alignItems: 'center',
                  background: '#fff', border: '1px solid #e5e7eb',
                  borderRadius: 8, padding: '10px 14px', gap: 12,
                }}
              >
                <span style={{
                  padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 700,
                  background: pin.postType === 'lost' ? '#fee2e2' : '#dcfce7',
                  color: pin.postType === 'lost' ? '#dc2626' : '#16a34a',
                }}>
                  {pin.postType?.toUpperCase()}
                </span>
                <span style={{ fontWeight: 600, fontSize: 14, flex: 1, color: '#111827' }}>
                  {pin.postId?.title ?? 'Untitled post'}
                </span>
                <span style={{ fontSize: 12, color: '#9ca3af' }}>
                  {pin.postId?.category}
                </span>
                <span style={{
                  fontSize: 11, padding: '2px 8px', borderRadius: 12,
                  background: '#f3f4f6', color: '#6b7280',
                }}>
                  {pin.postStatus}
                </span>
                <button
                  onClick={() => handleDeletePin(pin._id)}
                  title="Remove pin"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Admin pin-placement modal ──────────────────────────────────────── */}
      {isAdmin && pendingPin && (
        <PinPlacementModal
          floor={activeFloor}
          x={pendingPin.x}
          y={pendingPin.y}
          onClose={() => setPendingPin(null)}
          onSaved={handlePinSaved}
        />
      )}
    </div>
  );
}

// ── Tiny style helpers ──────────────────────────────────────────────────────
const labelStyle = {
  display: 'block', fontSize: 11, fontWeight: 600,
  color: '#6b7280', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em',
};

const selectStyle = {
  padding: '7px 12px', borderRadius: 8,
  border: '1px solid #d1d5db', fontSize: 13,
  background: '#fff', cursor: 'pointer',
};