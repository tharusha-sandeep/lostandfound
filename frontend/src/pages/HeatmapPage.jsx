import { Map } from 'lucide-react';
import FloorHeatmapPanel from '../components/map/FloorHeatmapPanel';

export default function HeatmapPage() {
  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6 flex items-center gap-3">
        <Map className="w-7 h-7 text-indigo-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Campus Lost &amp; Found Heatmap</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            See where items are most frequently lost or found around campus.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <FloorHeatmapPanel isAdmin={false} />
      </div>
    </div>
  );
}