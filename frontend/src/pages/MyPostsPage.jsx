import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Inbox } from 'lucide-react';
import { useMyPosts } from '../hooks/postHooks';
import PostCard from '../components/post/PostCard';

export default function MyPostsPage() {
  const [activeTab, setActiveTab] = useState('Active');
  const { data, isLoading } = useMyPosts();
  const posts = data?.posts || [];

  const filteredPosts = posts.filter(post => {
    if (activeTab === 'Active') return !post.isDeleted && ['open', 'matched'].includes(post.status);
    if (activeTab === 'Resolved') return !post.isDeleted && post.status === 'resolved';
    if (activeTab === 'Removed') return post.isDeleted === true;
    return false;
  });

  return (
    <div className="max-w-6xl mx-auto py-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
           <h1 className="text-3xl font-bold text-gray-900 leading-tight">My Posts</h1>
           <p className="text-gray-500 mt-2 text-sm">Manage items you have reported lost or found</p>
        </div>
        <Link 
          to="/posts/new" 
          className="inline-flex items-center bg-blue-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition shadow-sm"
        >
          <Plus className="w-5 h-5 mr-1" /> Report New Item
        </Link>
      </div>

      {/* Tabs Row */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="flex space-x-10" aria-label="Tabs">
          {['Active', 'Resolved', 'Removed'].map((tab) => (
            <button
              key={tab}
              data-testid={`tab-${tab.toLowerCase()}`}
              onClick={() => setActiveTab(tab)}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-all shadow-sm ${
                activeTab === tab
                  ? 'border-blue-600 text-blue-700'
                  : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300 shadow-none'
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Post State Rendering */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
           {[...Array(3)].map((_, i) => (
             <div key={i} className="animate-pulse bg-gray-200 rounded-xl h-64 shadow-sm border border-gray-100"></div>
           ))}
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-16 text-center shadow-sm max-w-2xl mx-auto">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-blue-50/50 border border-blue-100 mb-5 shadow-sm">
            <Inbox className="w-10 h-10 text-blue-300" strokeWidth={1.5} />
          </div>
          {activeTab === 'Active' ? (
            <>
              <p className="text-gray-900 font-bold text-xl tracking-tight">You have no active posts.</p>
              <p className="text-gray-500 mt-2 mb-6 text-[15px] leading-relaxed max-w-sm mx-auto">Report any items you've lost or found around campus, and the smart system will pair them automatically.</p>
              <Link to="/posts/new" className="text-blue-600 font-medium hover:text-blue-700 underline underline-offset-4 decoration-2">Report an item</Link>
            </>
          ) : activeTab === 'Resolved' ? (
            <p className="text-gray-600 font-medium text-lg mt-2">No resolved posts yet.</p>
          ) : (
            <p className="text-gray-600 font-medium text-lg mt-2">No removed posts.</p>
          )}
        </div>
      ) : (
        <div data-testid="post-list" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPosts.map(post => (
            <PostCard key={post._id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}
