/**
 * Single source of truth for photos, videos and prices.
 * Used by both the main portal (App.tsx) and the standalone
 * subdomain sites (components/Resort.tsx, components/Village.tsx)
 * so a seasonal update only has to happen in one place.
 *
 * `video` fields take a normal YouTube or Vimeo watch/share URL
 * (e.g. "https://www.youtube.com/watch?v=XXXX" or "https://vimeo.com/XXXX") —
 * VideoModal.tsx converts it to an embeddable player URL.
 */

export interface AmenityDetail {
  icon: 'bed' | 'coffee' | 'star';
  label: string;
}

export interface AccommodationItem {
  id: number;
  title: string;
  desc: string;
  price: string;
  img: string;
  video?: string;
  guests?: string;
  amenities?: AmenityDetail[];
}

export const heroImages = {
  resort: 'https://picsum.photos/seed/resort-hero/1920/1080',
  village: 'https://picsum.photos/seed/village-hero/1920/1080',
  resortStandalone: 'https://picsum.photos/seed/resort-luxury/1920/1080',
  villageStandalone: 'https://picsum.photos/seed/village-life/1920/1080',
  home: 'https://picsum.photos/seed/chamtaburu-nature/1920/1080',
};

export const heroVideos: { resort?: string; village?: string } = {
  // Example: resort: 'https://www.youtube.com/watch?v=XXXXXXXXXXX',
};

export const storyImages = {
  resort: 'https://picsum.photos/seed/resort-story/800/600',
  village: 'https://picsum.photos/seed/village-story/800/600',
};

export const bannerImage = 'https://picsum.photos/seed/forest-footer/1920/600';

export const pageHeroImages = {
  accommodations: 'https://picsum.photos/seed/services-hero/1920/400',
  contact: 'https://picsum.photos/seed/contact-hero/1920/400',
};

export const contactMapImage = 'https://picsum.photos/seed/map/800/1000';

export const portalImages = {
  resort: 'https://picsum.photos/seed/resort-portal/800/600',
  village: 'https://picsum.photos/seed/village-portal/800/600',
  junction: 'https://picsum.photos/seed/junction-portal/800/600',
};

export const resortRooms: AccommodationItem[] = [
  {
    id: 1,
    title: 'Special Bamboo Cottage',
    desc: 'Experience the charm of bamboo living. Includes complimentary breakfast and attached bathroom with geyser.',
    price: '₹2,000 / night',
    img: 'https://picsum.photos/seed/bamboo-cottage/800/600',
    guests: '2 Adults + 1 Child (up to 5y)',
    amenities: [
      { icon: 'bed', label: '2 Adults + 1 Child (up to 5y)' },
      { icon: 'coffee', label: 'Breakfast Included' },
      { icon: 'star', label: 'Geyser Attached' },
    ],
  },
  {
    id: 2,
    title: 'Double Bed Cottage',
    desc: 'Comfortable and cozy cottages for a perfect getaway. Includes complimentary breakfast and attached bathroom with geyser.',
    price: '₹1,800 / night',
    img: 'https://picsum.photos/seed/double-cottage/800/600',
    amenities: [
      { icon: 'bed', label: '2 Adults + 1 Child' },
      { icon: 'coffee', label: 'Breakfast Included' },
      { icon: 'star', label: 'Geyser Attached' },
    ],
  },
  {
    id: 3,
    title: 'Quardruple Cottage',
    desc: 'Spacious cottage with 2 queen size beds, perfect for groups. Includes complimentary breakfast and attached bathroom with geyser.',
    price: '₹2,400 / night',
    img: 'https://picsum.photos/seed/quad-cottage/800/600',
    amenities: [
      { icon: 'bed', label: '4 Adults (2 Queen Beds)' },
      { icon: 'coffee', label: 'Breakfast Included' },
      { icon: 'star', label: 'Geyser Attached' },
    ],
  },
  {
    id: 4,
    title: 'Family Cottage',
    desc: 'Our largest cottage with 2 king size beds for the whole family. Includes complimentary breakfast and attached bathroom with geyser.',
    price: '₹3,599 / night',
    img: 'https://picsum.photos/seed/family-cottage/800/600',
    amenities: [
      { icon: 'bed', label: '6 Adults (2 King Beds)' },
      { icon: 'coffee', label: 'Breakfast Included' },
      { icon: 'star', label: 'Geyser Attached' },
    ],
  },
];

export const resortActivities: AccommodationItem[] = [
  {
    id: 7,
    title: 'Guided Nature Walk',
    desc: '3-hour guided tour with an expert naturalist. Binoculars provided.',
    price: '₹1,200 / person',
    img: 'https://picsum.photos/seed/walk/400/300',
  },
  {
    id: 8,
    title: 'Organic Farming Workshop',
    desc: 'Hands-on workshop on sustainable farming techniques. Farm-to-table lunch included.',
    price: '₹2,000 / person',
    img: 'https://picsum.photos/seed/farming/400/300',
  },
];

export const villageRooms: AccommodationItem[] = [
  {
    id: 1,
    title: 'Traditional Mud House',
    desc: 'Stay in a beautifully decorated traditional mud house. Cool in summer and warm in winter. Authentic village experience.',
    price: '₹1,200 / night',
    img: 'https://picsum.photos/seed/mud-house/800/600',
    amenities: [
      { icon: 'bed', label: '2 Adults' },
      { icon: 'coffee', label: 'Local Breakfast' },
      { icon: 'star', label: 'Cultural Immersion' },
    ],
  },
  {
    id: 2,
    title: 'Tree Top Cabin',
    desc: 'Elevated wooden cabin offering a unique perspective of the village and surrounding greenery. Perfect for nature lovers.',
    price: '₹1,500 / night',
    img: 'https://picsum.photos/seed/tree-cabin/800/600',
    amenities: [
      { icon: 'bed', label: '2 Adults' },
      { icon: 'coffee', label: 'Local Breakfast' },
      { icon: 'star', label: 'Panoramic View' },
    ],
  },
];

export const villageActivities: AccommodationItem[] = [
  {
    id: 3,
    title: 'Tribal Pottery Workshop',
    desc: 'Learn the ancient art of pottery from local masters. Take home your own creation.',
    price: '₹800 / person',
    img: 'https://picsum.photos/seed/pottery/400/300',
  },
  {
    id: 4,
    title: 'Traditional Weaving Class',
    desc: 'Discover the intricate patterns and techniques of tribal weaving. Materials included.',
    price: '₹1,000 / person',
    img: 'https://picsum.photos/seed/weaving/400/300',
  },
];
