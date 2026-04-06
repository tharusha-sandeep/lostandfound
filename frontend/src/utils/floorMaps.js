/**
 * Ordered list of campus floors with metadata.
 * Images are served from /public/floormaps/ — copy the WhatsApp screenshots
 * there and rename them as listed in imagePath.
 */
export const FLOORS = [
  { id: 'b', label: 'Basement', imagePath: '/floormaps/floor-b.jpg' },
  { id: '1', label: 'Floor 1',  imagePath: '/floormaps/floor-1.jpg' },
  { id: '2', label: 'Floor 2',  imagePath: '/floormaps/floor-2.jpg' },
  { id: '3', label: 'Floor 3',  imagePath: '/floormaps/floor-3.jpg' },
  { id: '4', label: 'Floor 4',  imagePath: '/floormaps/floor-4.jpg' },
  { id: '5', label: 'Floor 5',  imagePath: '/floormaps/floor-5.jpg' },
  { id: '6', label: 'Floor 6',  imagePath: '/floormaps/floor-6.jpg' },
  { id: '7', label: 'Floor 7',  imagePath: '/floormaps/floor-7.jpg' },
];

export const TIME_RANGES = [
  { value: 'all',  label: 'All time'  },
  { value: '1',    label: 'Today'     },
  { value: '7',    label: 'Past week' },
  { value: '30',   label: 'Past month'},
  { value: '90',   label: 'Past 3 months' },
  { value: '180',  label: 'Past 6 months' },
  { value: '365',  label: 'Past year' },
];