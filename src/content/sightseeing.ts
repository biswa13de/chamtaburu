/**
 * The 3-day Purulia sightseeing plan run from Chamtaburu Eco Resort —
 * rendered at resort.chamtaburu.in/sightseeing (src/components/pages/Sightseeing.tsx).
 *
 * Content is the owner's own itinerary (drafted as a standalone page,
 * 2026-11), moved here as typed data so the copy can be edited without
 * touching markup. Distances and drive times per stop
 * (docs/03-content-model.md §5) aren't known yet and are left out rather
 * than guessed.
 */

export interface SightseeingStop {
  name: string;
  description: string;
}

export interface SightseeingSlot {
  label: string; // 'Morning', 'After lunch', …
  stops: SightseeingStop[];
}

export interface SightseeingDay {
  title: string;
  intro: string;
  slots: SightseeingSlot[];
  note?: string;
}

export const sightseeingFacts: { value: string; label: string }[] = [
  { value: '3 days', label: 'Short drives, plenty of breaks' },
  { value: 'Oct – Mar', label: 'Most pleasant weather' },
  { value: 'Feb – Mar', label: 'Palash in full red bloom' },
  { value: 'Station drop', label: 'Included on your last day' },
];

export const sightseeingDays: SightseeingDay[] = [
  {
    title: 'Forests, bird hill & the mask village',
    intro:
      'Come straight from the train to your cottage, freshen up and have breakfast. The day stays light and close to home.',
    slots: [
      {
        label: 'Morning',
        stops: [
          {
            name: 'Matha Forest',
            description:
              'Sal and mahua woods with birdsong, and an easy first drive into the hills.',
          },
          {
            name: 'Pakhi Pahar',
            description:
              'A hillside carved with giant bird sculptures, a one-of-a-kind rock-art project.',
          },
          {
            name: 'Pardi Lake',
            description: 'A calm hill-ringed lake, good for a slow walk and photos.',
          },
          {
            name: 'Gorgaburu Pahar',
            description:
              'The highest point of the Ajodhya range, with wide views over the plateau.',
          },
        ],
      },
      {
        label: 'After lunch',
        stops: [
          {
            name: 'Khairabera Dam',
            description: 'A quiet reservoir framed by hills, at its best in golden-hour light.',
          },
          {
            name: 'Charida (Mukhosh Gram)',
            description:
              'The village of Chhau mask makers. Watch artisans at work and buy straight from them.',
          },
        ],
      },
    ],
  },
  {
    title: 'A full day on Ajodhya Pahar',
    intro:
      "Leave after breakfast for the plateau's lakes, dams and waterfalls. It's the big day, so wear comfortable shoes.",
    slots: [
      {
        label: 'Morning',
        stops: [
          { name: 'Lahoriya Shiv Mandir', description: 'A peaceful forest temple on the way up.' },
          {
            name: 'PPSP Lower Dam',
            description:
              'The lower reservoir of the Purulia Pumped Storage Project, set among the hills.',
          },
          {
            name: 'PPSP Upper Dam',
            description: 'The upper reservoir on top of the plateau, with sweeping views.',
          },
          { name: 'Mayur Pahar', description: 'A viewpoint looking out over the valley.' },
        ],
      },
      {
        label: 'Afternoon',
        stops: [
          {
            name: 'Marble Lake View Point',
            description: 'An emerald-green lake inside an old stone quarry, ringed by rock walls.',
          },
          {
            name: 'Bamni Falls',
            description: 'Tiered cascades deep in the forest, reached by a flight of steep steps.',
          },
          {
            name: 'Turga Falls',
            description: 'A forest waterfall, at its fullest in the months after the monsoon.',
          },
          {
            name: 'Turga Dam',
            description: 'A still reservoir to end the day before heading back to the resort.',
          },
        ],
      },
    ],
    note: "Bamni Falls has many steep steps. Let us know if anyone in your group would rather skip it and we'll plan around it.",
  },
  {
    title: 'Old forts, rock hills & Baranti',
    intro:
      "Check out after a hearty breakfast and drive north. We'll drop you at the station once the day is done.",
    slots: [
      {
        label: 'On the way',
        stops: [
          {
            name: 'Joychandi Pahar',
            description:
              'Dramatic rock hills with a hilltop temple, a favourite of climbers and filmmakers.',
          },
          {
            name: 'Garh Panchakot',
            description: 'Ruins of an old royal fort and temples at the foot of Panchet hill.',
          },
          { name: 'Panchet Dam', description: 'A large dam on the Damodar river.' },
          {
            name: 'Baranti Dam',
            description: 'A lakeside village with some of the best sunsets in Purulia.',
          },
        ],
      },
    ],
    note: "Station drop-off after the last stop. Tell us your train time when booking and we'll pace the day to match.",
  },
];

export const sightseeingTips: { title: string; body: string }[] = [
  {
    title: 'Best time to visit',
    body: 'October to March is cool and clear. Waterfalls run strongest from late monsoon into early winter.',
  },
  {
    title: 'What to carry',
    body: 'Comfortable walking shoes, a water bottle, a light jacket for winter evenings and some cash for village shops.',
  },
  {
    title: 'Phone network',
    body: 'Signal can be patchy up in the hills. Download your tickets and maps before you set out.',
  },
  {
    title: 'Your pace, your plan',
    body: 'Travelling with kids or elders? We can trim stops or split a day in two.',
  },
];
