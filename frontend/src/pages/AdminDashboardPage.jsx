import { Link } from 'react-router-dom';
import { Users, FileText, ClipboardList, ShieldCheck, MapPin, BarChart2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function AdminDashboardPage() {
  const { user } = useAuth();

  const cards = [
    {
      title: 'Manage Users',
      description: 'View all registered students, ban or remove accounts.',
      icon: Users,
      link: '/admin/users',
      color: 'bg-blue-500',
    },
    {
      title: 'Manage Posts',
      description: 'View all lost and found posts, update their status.',
      icon: FileText,
      link: '/admin/posts',
      color: 'bg-green-500',
    },
    {
      title: 'Manage Claims',
      description: 'Review pending claims, approve or reject with email notification to both parties.',
      icon: ClipboardList,
      link: '/admin/claims',
      color: 'bg-purple-500',
    },
    {
      title: 'Campus Heatmap',
      description: 'Tag lost & found posts on floor maps. View density heatmaps showing item hotspots across all floors.',
      icon: MapPin,
      link: '/admin/heatmap',
      color: 'bg-orange-500',
    },
    {
      title: 'Analytics',
      description: 'Trends over time, zone hotspots, category recovery rates, user engagement and data quality alerts.',
      icon: BarChart2,
      link: '/admin/analytics',
      color: 'bg-rose-500',
    },
  ];

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex items-center gap-3">
        <ShieldCheck className="w-8 h-8 text-indigo-600" />
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Welcome, {user?.name}</p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {cards.map((card) => (
          <Link
            key={card.title}
            to={card.link}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition group"
          >
            <div className={`inline-flex p-3 rounded-lg ${card.color} mb-4`}>
              <card.icon className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 group-hover:text-indigo-600 transition">
              {card.title}
            </h2>
            <p className="text-gray-500 mt-1 text-sm">{card.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
