import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAllClaims, reviewClaim } from '../services/claimService';
import { getMatchesForPost } from '../services/postService';
import { ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

const STATUS_STYLES = {
  pending:  'bg-yellow-100 text-yellow-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
};

function MatchScoreBadge({ score }) {
  const color = score >= 80 ? 'bg-green-100 text-green-700'
    : score >= 60 ? 'bg-yellow-100 text-yellow-700'
    : 'bg-red-100 text-red-700';
  return (
    <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${color}`}>
      {score}% match
    </span>
  );
}

export default function AdminClaimsPage() {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [actionLoading, setActionLoading] = useState(null);
  const [adminNote, setAdminNote] = useState({});
  const [matchScores, setMatchScores] = useState({});

  useEffect(() => {
    fetchClaims();
  }, [filter]);

  const fetchClaims = async () => {
    setLoading(true);
    try {
      const data = await getAllClaims(filter);
      setClaims(data.claims);
      // fetch match scores for each claim's post
      fetchMatchScores(data.claims);
    } catch {
      toast.error('Failed to load claims');
    } finally {
      setLoading(false);
    }
  };

  const fetchMatchScores = async (claims) => {
    const scores = {};
    await Promise.all(
      claims.map(async (claim) => {
        if (!claim.postId?._id) return;
        try {
          const matches = await getMatchesForPost(claim.postId._id);
          // find if claimant has a matching post
          const claimantMatch = matches.find(
            m => m.matchedPostSnapshot?.authorId?.toString() === claim.claimantId?._id?.toString()
          );
          scores[claim._id] = claimantMatch ? claimantMatch.score : null;
        } catch {
          scores[claim._id] = null;
        }
      })
    );
    setMatchScores(scores);
  };

  const handleReview = async (claimId, status) => {
    const note = adminNote[claimId] || '';
    if (!confirm(`Are you sure you want to ${status} this claim?`)) return;
    setActionLoading(claimId);
    try {
      await reviewClaim(claimId, status, note);
      toast.success(`Claim ${status} successfully. Emails sent to both parties.`);
      setClaims(claims.filter(c => c._id !== claimId));
    } catch {
      toast.error('Action failed');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link to="/admin" className="text-gray-500 hover:text-gray-700">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Manage Claims</h1>
        <span className="ml-auto bg-indigo-100 text-indigo-700 text-sm font-medium px-3 py-1 rounded-full">
          {claims.length} claims
        </span>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6">
        {['pending', 'approved', 'rejected'].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              filter === s
                ? 'bg-indigo-600 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
        </div>
      ) : claims.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200 text-gray-500">
          No {filter} claims.
        </div>
      ) : (
        <div className="space-y-6">
          {claims.map((claim) => (
            <div key={claim._id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              
              {/* Header row */}
              <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <div className="flex items-center gap-3">
                  <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${STATUS_STYLES[claim.status]}`}>
                    {claim.status.charAt(0).toUpperCase() + claim.status.slice(1)}
                  </span>
                  {matchScores[claim._id] != null && (
                    <MatchScoreBadge score={matchScores[claim._id]} />
                  )}
                  {matchScores[claim._id] === null && (
                    <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-500">
                      No system match found
                    </span>
                  )}
                </div>
                <span className="text-xs text-gray-400">
                  Submitted {new Date(claim.createdAt).toLocaleDateString('en-GB')}
                </span>
              </div>

              {/* Side by side comparison */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                
                {/* Post Details — left */}
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                  <h3 className="text-xs font-bold text-blue-600 uppercase mb-3">
                    📋 Reported Post
                  </h3>
                  <Link
                    to={`/posts/${claim.postId?._id}`}
                    className="font-semibold text-gray-900 hover:text-indigo-600 transition block mb-2"
                  >
                    {claim.postId?.title}
                  </Link>
                  <div className="space-y-1.5 text-sm text-gray-600">
                    <div className="flex justify-between">
                      <span className="font-medium">Type</span>
                      <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                        claim.postId?.type === 'lost' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                      }`}>{claim.postId?.type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Category</span>
                      <span>{claim.postId?.category}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Zone</span>
                      <span>{claim.postId?.zone}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Status</span>
                      <span>{claim.postId?.status}</span>
                    </div>
                  </div>
                </div>

                {/* Claimant Details — right */}
                <div className="bg-purple-50 border border-purple-100 rounded-lg p-4">
                  <h3 className="text-xs font-bold text-purple-600 uppercase mb-3">
                    👤 Claimant
                  </h3>
                  <p className="font-semibold text-gray-900 mb-2">{claim.claimantId?.name}</p>
                  <div className="space-y-1.5 text-sm text-gray-600">
                    <div className="flex justify-between">
                      <span className="font-medium">Email</span>
                      <span className="text-xs">{claim.claimantId?.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Faculty</span>
                      <span>{claim.claimantId?.faculty}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Identifying Detail */}
              <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-lg mb-4">
                <h3 className="text-xs font-bold text-indigo-700 uppercase mb-2">
                  🔒 Private Identifying Detail
                </h3>
                <p className="text-sm text-gray-800">{claim.identifyingDetail}</p>
              </div>

              {/* Match score explanation */}
              {matchScores[claim._id] != null && (
                <div className="p-3 bg-yellow-50 border border-yellow-100 rounded-lg mb-4 text-xs text-yellow-800">
                  ⚡ The system found a <strong>{matchScores[claim._id]}%</strong> match between this post and a post by the claimant — based on category, zone, and date proximity.
                </div>
              )}

              {/* Admin Actions */}
              {claim.status === 'pending' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Note to both parties (optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Please come to the admin office with your student ID..."
                      value={adminNote[claim._id] || ''}
                      onChange={(e) => setAdminNote({ ...adminNote, [claim._id]: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleReview(claim._id, 'approved')}
                      disabled={actionLoading === claim._id}
                      className="flex-1 py-2.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition disabled:opacity-50"
                    >
                      ✓ Approve — Email both parties
                    </button>
                    <button
                      onClick={() => handleReview(claim._id, 'rejected')}
                      disabled={actionLoading === claim._id}
                      className="flex-1 py-2.5 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition disabled:opacity-50"
                    >
                      ✗ Reject — Email claimant
                    </button>
                  </div>
                </div>
              )}

              {/* Show admin note if already reviewed */}
              {claim.status !== 'pending' && claim.adminNote && (
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600">
                  <span className="font-medium">Admin note: </span>{claim.adminNote}
                </div>
              )}

            </div>
          ))}
        </div>
      )}
    </div>
  );
}