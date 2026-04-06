import { useState, useEffect } from 'react';
import { X, Search } from 'lucide-react';
import axiosClient from '../../services/axiosClient';
import { createMapPin } from '../../services/mapPinService';
import toast from 'react-hot-toast';

/**
 * PinPlacementModal
 * Shown when an admin clicks on a floor map.
 * Lets the admin choose an existing post and save the pin.
 *
 * Props
 *   floor      – floor id  e.g. '3' | 'b'
 *   x, y       – fractional coordinates clicked
 *   onClose    – () => void
 *   onSaved    – () => void  (invalidates query cache)
 */
export default function PinPlacementModal({ floor, x, y, onClose, onSaved }) {
  const [query, setQuery]       = useState('');
  const [posts, setPosts]       = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading]   = useState(false);
  const [saving, setSaving]     = useState(false);

  // Search posts as the user types
  useEffect(() => {
    if (query.trim().length < 2) { setPosts([]); return; }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const { data } = await axiosClient.get('/posts', {
          params: { search: query, limit: 20, isDeleted: false },
        });
        // API returns { posts: [...] }
        setPosts(data.posts ?? data ?? []);
      } catch {
        /* silent */
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const handleSave = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await createMapPin({ postId: selected._id, floor, x, y });
      toast.success('Pin saved on map!');
      onSaved();
      onClose();
    } catch {
      /* axiosClient already toasts error */
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 50,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        background: '#fff', borderRadius: 12, padding: 24,
        width: '100%', maxWidth: 480,
        boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Tag Item on Map</h2>
            <p style={{ margin: '4px 0 0', fontSize: 12, color: '#6b7280' }}>
              Floor {floor.toUpperCase()} · Position ({(x * 100).toFixed(1)}%, {(y * 100).toFixed(1)}%)
            </p>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Search */}
        <div style={{ position: 'relative', marginBottom: 12 }}>
          <Search size={16} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
          <input
            autoFocus
            type="text"
            placeholder="Search posts by title…"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelected(null); }}
            style={{
              width: '100%', padding: '8px 12px 8px 34px',
              border: '1px solid #d1d5db', borderRadius: 8,
              fontSize: 14, outline: 'none', boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Results list */}
        <div style={{
          border: '1px solid #e5e7eb', borderRadius: 8,
          maxHeight: 240, overflowY: 'auto', marginBottom: 16,
        }}>
          {loading && (
            <p style={{ textAlign: 'center', color: '#9ca3af', padding: 16, fontSize: 13 }}>Searching…</p>
          )}
          {!loading && posts.length === 0 && query.length >= 2 && (
            <p style={{ textAlign: 'center', color: '#9ca3af', padding: 16, fontSize: 13 }}>No posts found.</p>
          )}
          {!loading && query.length < 2 && (
            <p style={{ textAlign: 'center', color: '#9ca3af', padding: 16, fontSize: 13 }}>Type at least 2 characters to search.</p>
          )}
          {posts.map((post) => (
            <button
              key={post._id}
              onClick={() => setSelected(post)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
                width: '100%', padding: '10px 14px', border: 'none',
                borderBottom: '1px solid #f3f4f6',
                background: selected?._id === post._id ? '#eff6ff' : '#fff',
                cursor: 'pointer', textAlign: 'left',
              }}
            >
              <span style={{ fontWeight: 600, fontSize: 14, color: '#111827' }}>{post.title}</span>
              <span style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
                {post.type?.toUpperCase()} · {post.category} · {post.status}
              </span>
            </button>
          ))}
        </div>

        {selected && (
          <div style={{
            background: '#f0fdf4', border: '1px solid #86efac',
            borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13,
          }}>
            <strong>Selected:</strong> {selected.title}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 18px', borderRadius: 8,
              border: '1px solid #d1d5db', background: '#fff',
              cursor: 'pointer', fontSize: 14,
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!selected || saving}
            style={{
              padding: '8px 18px', borderRadius: 8, border: 'none',
              background: selected && !saving ? '#4f46e5' : '#c7d2fe',
              color: '#fff', cursor: selected && !saving ? 'pointer' : 'not-allowed',
              fontSize: 14, fontWeight: 600,
            }}
          >
            {saving ? 'Saving…' : 'Save Pin'}
          </button>
        </div>
      </div>
    </div>
  );
}