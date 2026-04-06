import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { MapPin, Tag, Calendar, Edit2, Trash2, ArrowLeft, Camera } from 'lucide-react';
import toast from 'react-hot-toast';

import { useAuth } from '../contexts/AuthContext';
import { usePost, useDeletePost } from '../hooks/postHooks';
import PostStatusBadge from '../components/post/PostStatusBadge';
import MatchSuggestionsPanel from '../components/match/MatchSuggestionsPanel';
import ConfirmModal from '../components/ui/ConfirmModal';
import { SkeletonDetail } from '../components/ui/Skeleton';
import { TYPE_COLORS } from '../utils/constants';
import { submitClaim } from '../services/claimService';

export default function PostDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const { data: post, isLoading, isError } = usePost(id);
  const { mutateAsync: deletePost, isPending: isDeleting } = useDeletePost();
  
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [claimDetail, setClaimDetail] = useState('');
  const [claimLoading, setClaimLoading] = useState(false);
  const [claimSubmitted, setClaimSubmitted] = useState(false);

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <SkeletonDetail />
      </div>
    );
  }

  if (isError || !post) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">This post no longer exists.</h2>
        <Link to="/posts" className="text-blue-600 font-medium hover:underline inline-flex items-center mt-2">
          &larr; Back to Browse
        </Link>
      </div>
    );
  }

  const userId = user?.id || user?._id;
  const isOwner = post.authorId === userId;
  const isAdmin = user?.role === 'admin';
  const isStudent = user && !isAdmin;
  const canClaim = isStudent && !isOwner && post.status !== 'resolved';

  // button text depends on post type
  // lost post = someone lost it = finder clicks "I Found This Item"
  // found post = someone found it = owner clicks "Claim This Item"
  const claimButtonText = post.type === 'lost' ? 'I Found This Item' : 'Claim This Item';

  const formattedDate = new Date(post.incidentDate).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric'
  });

  const formattedCreated = new Date(post.createdAt || Date.now()).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric'
  });

  const handleDeleteCallback = async () => {
    try {
      await deletePost(id);
      toast.success('Post removed successfully');
      navigate('/posts');
    } catch {
      toast.error('Failed to remove post');
    }
  };

  const handleClaimSubmit = async (e) => {
    e.preventDefault();
    if (claimDetail.trim().length < 10) {
      toast.error('Please provide more detail (minimum 10 characters)');
      return;
    }
    setClaimLoading(true);
    try {
      await submitClaim(id, claimDetail.trim());
      setClaimSubmitted(true);
      setShowClaimModal(false);
      toast.success('Submitted! Admin will review and contact you.');
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to submit claim';
      toast.error(msg);
    } finally {
      setClaimLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <Link to="/posts" className="inline-flex items-center text-gray-500 hover:text-gray-900 font-medium transition-colors">
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Browse
      </Link>
      
      <div className="flex flex-col lg:grid lg:grid-cols-3 gap-8 items-start">
        
        {/* LEFT COLUMN */}
        <div className="lg:col-span-2 w-full order-1">
          {/* Image Gallery */}
          <div className="mb-6">
            {post.imageUrls && post.imageUrls.length > 0 ? (
              <img src={post.imageUrls[0]} alt="Post Cover" className="w-full h-56 md:h-72 object-cover rounded-xl shadow-sm border border-gray-100" />
            ) : (
              <div className="w-full h-56 md:h-72 bg-gray-100 rounded-xl flex items-center justify-center border border-gray-200">
                <Camera className="w-16 h-16 text-gray-300" />
              </div>
            )}
          </div>

          {/* Post Header */}
          <div className="flex items-center gap-3 mb-3">
            <span className={`px-2.5 py-1 text-xs font-bold uppercase tracking-wide rounded-md capitalize ${TYPE_COLORS[post.type] || 'bg-gray-100 text-gray-800'}`}>
              {post.type}
            </span>
            <span data-testid="post-status">
              <PostStatusBadge status={post.status} size="md" />
            </span>
          </div>
          
          <h1 data-testid="post-title" className="text-2xl md:text-3xl font-bold text-gray-900 mb-4 leading-tight">
            {post.title}
          </h1>
          
          <div className="flex flex-wrap items-center gap-5 text-sm font-medium text-gray-600 border-b border-gray-100 pb-6">
            <div className="flex items-center gap-2"><Tag size={16} className="text-gray-400"/> <span>{post.category}</span></div>
            <div className="flex items-center gap-2"><MapPin size={16} className="text-gray-400"/> <span>{post.zone}</span></div>
            <div className="flex items-center gap-2"><Calendar size={16} className="text-gray-400"/> <span>{formattedDate}</span></div>
          </div>

          {/* Description — only visible to owner and admin */}
          {(isOwner || isAdmin) && (
            <div className="pt-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Description</h2>
              <p className="text-gray-700 whitespace-pre-wrap leading-relaxed text-[15px]">
                {post.description}
              </p>
            </div>
          )}

          {/* Message for non-owners viewing the post */}
          {!isOwner && !isAdmin && (
            <div className="pt-6">
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm text-gray-500">
                🔒 Full description is only visible to the post owner and admin.
                If this is your item, submit a claim with identifying details below.
              </div>
            </div>
          )}

          {/* Claim Button */}
          {canClaim && (
            <div className="mt-8 pt-6 border-t border-gray-100">
              {claimSubmitted ? (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-green-800 text-sm font-medium">
                  ✅ Your submission has been sent. Admin will review and contact you via email.
                </div>
              ) : (
                <button
                  onClick={() => setShowClaimModal(true)}
                  className="w-full sm:w-auto px-6 py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition"
                >
                  {claimButtonText}
                </button>
              )}
            </div>
          )}

          {/* Not logged in prompt */}
          {!user && post.status !== 'resolved' && (
            <div className="mt-8 pt-6 border-t border-gray-100">
              <p className="text-gray-600 text-sm">
                <Link to="/login" className="text-indigo-600 font-medium hover:underline">Login</Link> to claim this item.
              </p>
            </div>
          )}

          {/* Owner Actions */}
          {isOwner && post.status !== 'resolved' && (
            <div className="mt-10 pt-6 border-t border-gray-100 flex flex-col sm:flex-row items-center gap-3">
              <Link 
                data-testid="edit-button"
                to={`/posts/${id}/edit`} 
                className="inline-flex justify-center items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition w-full sm:w-auto"
              >
                <Edit2 className="w-4 h-4 mr-2" /> Edit Details
              </Link>
              <button 
                data-testid="delete-button"
                onClick={() => setShowDeleteModal(true)}
                className="inline-flex justify-center items-center px-4 py-2 border border-red-200 rounded-lg text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 transition w-full sm:w-auto"
              >
                <Trash2 className="w-4 h-4 mr-2" /> Remove Post
              </button>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN */}
        <div className="lg:col-span-1 mt-8 lg:mt-0 w-full order-3 lg:order-2">
          <div className="lg:sticky lg:top-24 space-y-6">
            
            {/* Metadata Card */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <div className="flex justify-between items-center mb-5 pb-5 border-b border-gray-100">
                <span className="text-sm text-gray-500 font-medium">Date Posted</span>
                <span className="text-sm font-semibold text-gray-900">{formattedCreated}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500 font-medium">Current Status</span>
                <PostStatusBadge status={post.status} size="sm" />
              </div>

              {post.status === 'matched' && (
                <div className="mt-5 bg-amber-50 border border-amber-200 text-amber-800 text-sm p-4 rounded-xl flex items-start gap-3 shadow-sm">
                  <span className="text-lg leading-none">⚡</span>
                  <span className="font-medium leading-relaxed">A potential match has been found.</span>
                </div>
              )}
              
              {post.status === 'resolved' && (
                <div className="mt-5 bg-green-50 border border-green-200 text-green-800 text-sm p-4 rounded-xl flex items-start gap-3 shadow-sm">
                  <span className="text-lg leading-none">✅</span>
                  <span className="font-medium leading-relaxed">This item has been successfully recovered.</span>
                </div>
              )}
            </div>
            
            {/* Match Panel — owner and admin only */}
            <div className="hidden lg:block">
              {(isOwner || isAdmin) && (
                <div data-testid="match-panel">
                  <MatchSuggestionsPanel postId={id} />
                </div>
              )}
            </div>

          </div>
        </div>
        
        <div className="w-full order-2 lg:hidden">
          {(isOwner || isAdmin) && (
            <div data-testid="match-panel">
              <MatchSuggestionsPanel postId={id} />
            </div>
          )}
        </div>

      </div>

      {/* Delete Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        title="Remove permanently?"
        message="Are you sure you want to remove this post? This action cannot be undone."
        confirmLabel="Yes, Remove"
        confirmClassName="bg-red-600 hover:bg-red-700 text-white"
        confirmTestId="delete-confirm"
        onConfirm={handleDeleteCallback}
        onCancel={() => setShowDeleteModal(false)}
        isLoading={isDeleting}
      />

      {/* Claim Modal */}
      {showClaimModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-2">{claimButtonText}</h2>
            <p className="text-gray-500 text-sm mb-6">
              Provide a private identifying detail to verify your claim. 
              This will only be visible to the admin — not to the public.
            </p>
            <form onSubmit={handleClaimSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Identifying Detail <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={claimDetail}
                  onChange={(e) => setClaimDetail(e.target.value)}
                  rows={4}
                  required
                  placeholder={
                    post.type === 'lost'
                      ? 'e.g. I found this near the library entrance on Monday morning, it was next to a bench...'
                      : 'e.g. The watch has my initials R.S. engraved on the back and a scratch on the left strap...'
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm resize-none"
                />
                <p className="text-xs text-gray-400 mt-1">{claimDetail.length}/500 characters (min 10)</p>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowClaimModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={claimLoading || claimDetail.trim().length < 10}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition disabled:opacity-50"
                >
                  {claimLoading ? 'Submitting...' : 'Submit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}