import { MapPin } from 'lucide-react';
import FloorHeatmapPanel from '../components/map/FloorHeatmapPanel';

export default function AdminHeatmapPage() {
  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6 flex items-center gap-3">
        <MapPin className="w-7 h-7 text-indigo-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Campus Heatmap</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Click anywhere on a floor map to tag a lost or found post at that location.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <FloorHeatmapPanel isAdmin={true} />
      </div>
    </div>
  );
}