export const mockProducts = [
  {
    id: '1',
    name: 'DSLR Camera Kit',
    category: 'Cameras',
    price: 800,
    rating: 4.9,
    reviewCount: 47,
    location: 'Your Area',
    distance: '1.2 km',
    availability: 'Available',
    image: null,
    tags: ['Popular'],
  },
  {
    id: '2',
    name: 'Cordless Drill Set',
    category: 'Tools',
    price: 350,
    rating: 4.7,
    reviewCount: 32,
    location: 'Nearby',
    distance: '2.3 km',
    availability: 'Available',
    image: null,
    tags: [],
  },
  {
    id: '3',
    name: 'Bluetooth Speaker',
    category: 'Electronics',
    price: 200,
    rating: 4.6,
    reviewCount: 28,
    location: 'Your Area',
    distance: '0.8 km',
    availability: 'Available',
    image: null,
    tags: ['New'],
  },
  {
    id: '4',
    name: 'Projector & Screen',
    category: 'Events & Party',
    price: 600,
    rating: 4.8,
    reviewCount: 19,
    location: 'Nearby',
    distance: '3.1 km',
    availability: 'Available',
    image: null,
    tags: [],
  },
  {
    id: '5',
    name: 'Gaming Console',
    category: 'Gaming',
    price: 500,
    rating: 4.9,
    reviewCount: 41,
    location: 'Your Area',
    distance: '1.5 km',
    availability: 'Available',
    image: null,
    tags: ['Popular'],
  },
  {
    id: '6',
    name: '4-Person Tent',
    category: 'Outdoor',
    price: 400,
    rating: 4.5,
    reviewCount: 22,
    location: 'Nearby',
    distance: '4.2 km',
    availability: 'Available',
    image: null,
    tags: [],
  },
  {
    id: '7',
    name: 'Road Bicycle',
    category: 'Sports',
    price: 300,
    rating: 4.7,
    reviewCount: 15,
    location: 'Your Area',
    distance: '0.5 km',
    availability: 'Available',
    image: null,
    tags: [],
  },
  {
    id: '8',
    name: 'Rotary Hammer Drill',
    category: 'Tools',
    price: 450,
    rating: 4.6,
    reviewCount: 18,
    location: 'Nearby',
    distance: '2.8 km',
    availability: 'Available',
    image: null,
    tags: [],
  },
]

export const mockCategories = [
  {
    id: 'electronics',
    name: 'Electronics',
    icon: 'electronics',
    count: 234,
    gradient: 'from-blue-500 to-blue-600',
  },
  {
    id: 'cameras',
    name: 'Cameras',
    icon: 'camera',
    count: 89,
    gradient: 'from-purple-500 to-pink-500',
  },
  {
    id: 'tools',
    name: 'Tools',
    icon: 'tools',
    count: 156,
    gradient: 'from-amber-500 to-orange-500',
  },
  {
    id: 'gaming',
    name: 'Gaming',
    icon: 'gaming',
    count: 67,
    gradient: 'from-green-500 to-teal-500',
  },
  {
    id: 'outdoor',
    name: 'Outdoor',
    icon: 'outdoor',
    count: 112,
    gradient: 'from-emerald-500 to-green-600',
  },
  {
    id: 'events',
    name: 'Events & Party',
    icon: 'events',
    count: 43,
    gradient: 'from-rose-500 to-pink-500',
  },
  {
    id: 'sports',
    name: 'Sports',
    icon: 'sports',
    count: 78,
    gradient: 'from-indigo-500 to-blue-500',
  },
  {
    id: 'home',
    name: 'Home & Utility',
    icon: 'home',
    count: 198,
    gradient: 'from-slate-500 to-gray-600',
  },
]

export const categoryIcons = {
  electronics: (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
  camera: (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  tools: (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  gaming: (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  outdoor: (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  events: (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  sports: (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
    </svg>
  ),
  home: (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  ),
}