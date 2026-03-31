import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search, RefreshCw } from 'lucide-react';
import PostCard from '../components/post/PostCard';
import { CATEGORIES, ZONES } from '../utils/constants';
import { usePosts } from '../hooks/postHooks';

export default function PostBrowsePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Track URL state
  const currentType = searchParams.get('type') || '';
  const currentCategory = searchParams.get('category') || '';
  const currentZone = searchParams.get('zone') || '';
  const currentQ = searchParams.get('q') || '';
  const currentPage = parseInt(searchParams.get('page') || '1', 10);

  const filters = {
    type:     currentType || undefined,
    category: currentCategory || undefined,
    zone:     currentZone || undefined,
    q:        currentQ || undefined,
    page:     currentPage,
    limit:    10
  };

  // Debounced search term
  const [inputQ, setInputQ] = useState(currentQ);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchParams(prev => {
        if (inputQ) prev.set('q', inputQ);
        else prev.delete('q');
        
        // Do not reset page if the query is practically the same
        if (inputQ !== currentQ) prev.set('page', '1');
        return prev;
      });
    }, 400);
    return () => clearTimeout(timer);
  }, [inputQ, setSearchParams, currentQ]);

  const updateFilter = (key, value) => {
    setSearchParams(prev => {
      if (value) prev.set(key, value);
      else prev.delete(key);
      if (key !== 'page') prev.set('page', '1');
      return prev;
    });
  };

  const clearAllFilters = () => {
    setSearchParams(new URLSearchParams());
    setInputQ('');
  };

  const activeFilterCount = Array.from(searchParams.keys()).filter(k => k !== 'page').length;

  const { data, isLoading, isError, refetch } = usePosts(filters);
  const posts = data?.posts ?? [];
  const pages = data?.pages ?? 1;

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Lost & Found Board</h1>
          <p className="text-gray-500 mt-1">Browse reported items or post your own</p>
        </div>
        <Link 
          to="/posts/new" 
          className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition shadow-sm whitespace-nowrap"
        >
          Report an Item
        </Link>
      </div>

      {/* FILTER BAR */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col gap-4 sticky top-16 z-40">
        
        {/* ROW 1 */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          
          <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg w-full md:w-auto">
            <button 
              onClick={() => updateFilter('type', '')}
              className={`flex-1 md:flex-none px-4 py-1.5 text-sm font-medium rounded-md transition ${!currentType ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
            >
              All
            </button>
            <button 
              data-testid="filter-type-lost"
              onClick={() => updateFilter('type', 'lost')}
              className={`flex-1 md:flex-none px-4 py-1.5 text-sm font-medium rounded-md transition ${currentType === 'lost' ? 'bg-red-500 shadow text-white' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Lost
            </button>
            <button 
              data-testid="filter-type-found"
              onClick={() => updateFilter('type', 'found')}
              className={`flex-1 md:flex-none px-4 py-1.5 text-sm font-medium rounded-md transition ${currentType === 'found' ? 'bg-blue-500 shadow text-white' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Found
            </button>
          </div>

          <div className="relative w-full md:max-w-xs xl:max-w-md">
            <input 
              data-testid="search-input"
              type="text" 
              placeholder="Search keyword..." 
              value={inputQ}
              onChange={(e) => setInputQ(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          </div>

          <div className="hidden md:flex items-center gap-2 relative">
            <span className="text-sm font-medium text-gray-700 relative">
              Filters
              {activeFilterCount > 0 && (
                <span className="absolute -top-1 -right-2 w-2 h-2 bg-blue-500 rounded-full"></span>
              )}
            </span>
            {activeFilterCount > 0 && (
              <button data-testid="clear-filters" onClick={clearAllFilters} className="text-xs text-red-600 hover:text-red-800 ml-2">
                Clear All
              </button>
            )}
          </div>
        </div>

        {/* ROW 2 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <select 
            value={currentCategory} 
            onChange={(e) => updateFilter('category', e.target.value)}
            className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-700"
          >
            <option value="">All Categories</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          
          <select 
            value={currentZone} 
            onChange={(e) => updateFilter('zone', e.target.value)}
            className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-700"
          >
            <option value="">All Zones</option>
            {ZONES.map(z => <option key={z} value={z}>{z}</option>)}
          </select>
        </div>
      </div>

      {/* ERROR STATE */}
      {isError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
          <p className="text-red-800 font-medium mb-4">Failed to load posts. Please try again.</p>
          <button 
            onClick={() => refetch()}
            className="inline-flex items-center gap-2 bg-red-100 text-red-700 px-4 py-2 rounded-lg font-medium hover:bg-red-200 transition"
          >
            <RefreshCw size={16} /> Retry
          </button>
        </div>
      )}

      {/* POST GRID */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="animate-pulse bg-gray-200 rounded-xl h-64"></div>
          ))}
        </div>
      ) : !isError && posts.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 text-center py-16">
           <p className="text-gray-500 text-lg font-medium">No items found.</p>
           <p className="text-gray-400 text-sm mt-1 mb-6">Try adjusting your filters or report a new item.</p>
           <Link to="/posts/new" className="inline-flex items-center justify-center bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition shadow-sm">
             Report an Item
           </Link>
        </div>
      ) : (
        <div data-testid="post-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map(post => (
            <PostCard key={post._id} post={post} />
          ))}
        </div>
      )}

      {/* PAGINATION */}
      {pages > 1 && !isLoading && !isError && (
        <div className="flex justify-center items-center gap-4 mt-8">
          <button 
            disabled={currentPage <= 1}
            onClick={() => updateFilter('page', (currentPage - 1).toString())}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Previous
          </button>
          <span className="text-sm font-medium text-gray-600">
            Page {currentPage} of {pages}
          </span>
          <button 
            disabled={currentPage >= pages}
            onClick={() => updateFilter('page', (currentPage + 1).toString())}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Next
          </button>
        </div>
      )}

    </div>
  );
}
