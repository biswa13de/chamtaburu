/**
 * Extras a guest can ask for with a booking request (src/components/pages/Book.tsx).
 * Each `id` is the add-on's id in public/package/rates.js, so the Package
 * Generator ticks that add-on when a manager makes the package; `meals` picks
 * the package plan with all meals instead. firestore.rules lists the same ids,
 * so a new extra needs adding there too. No prices here: the package has them.
 */
export interface Extra {
  id: string;
  label: string;
  detail?: string;
}

export const extraGroups: { title: string; note?: string; items: Extra[] }[] = [
  {
    title: 'Car pickup & drop',
    note: 'A car with driver, sized for your group.',
    items: [
      { id: 'pickup-purulia', label: 'Pickup from Purulia' },
      { id: 'pickup-barabhum', label: 'Pickup from Barabhum' },
      { id: 'drop-purulia', label: 'Drop to Purulia' },
      { id: 'drop-barabhum', label: 'Drop to Barabhum' },
    ],
  },
  {
    title: 'Sightseeing by car',
    note: 'A full day out with a driver who knows the way.',
    items: [
      {
        id: 'day1',
        label: 'Purulia local sightseeing',
        detail: 'Pakhi Pahar, Matha Forest, Pardi Lake, Charida mask village…',
      },
      {
        id: 'day2',
        label: 'Ajodhya Hill tour',
        detail: 'Bamni Falls, Upper & Lower Dam, Marble Lake, Turga Falls…',
      },
      {
        id: 'day3',
        label: 'Baranti tour',
        detail: 'Garh Panchakot, Panchet Dam, Joychandi Pahar, Baranti Dam',
      },
    ],
  },
  {
    title: 'Food & evenings',
    items: [
      {
        id: 'meals',
        label: 'All meals included',
        detail: 'Breakfast, lunch, evening snacks and dinner',
      },
      { id: 'bonfire', label: 'Bonfire' },
      { id: 'decor', label: 'Room decoration', detail: 'For a birthday or anniversary' },
    ],
  },
];

export const extraLabel = (id: string): string =>
  extraGroups.flatMap((g) => g.items).find((x) => x.id === id)?.label ?? id;
