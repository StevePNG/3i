export type Coordinates = {
  latitude: number;
  longitude: number;
};

export type LocationSuggestion = {
  id: string;
  label: string;
  coordinates: Coordinates;
  notes?: string;
};

export const SUGGESTED_LOCATIONS: LocationSuggestion[] = [
  {
    id: 'loc-warehouse',
    label: 'Warehouse – 145 Market St',
    coordinates: { latitude: 37.7936, longitude: -122.3965 },
    notes: 'Load-out hub'
  },
  {
    id: 'loc-embarcadero',
    label: 'Drop-off – 500 Embarcadero',
    coordinates: { latitude: 37.8011, longitude: -122.398 }
  },
  {
    id: 'loc-union',
    label: 'Drop-off – 2000 Union St',
    coordinates: { latitude: 37.7975, longitude: -122.4339 }
  },
  {
    id: 'loc-mission',
    label: 'Pickup – 24th & Mission',
    coordinates: { latitude: 37.7521, longitude: -122.4186 }
  },
  {
    id: 'loc-downtown',
    label: 'Drop-off – 1 Montgomery St',
    coordinates: { latitude: 37.7897, longitude: -122.4011 }
  },
  {
    id: 'loc-coit',
    label: 'Drop-off – Coit Tower Overlook',
    coordinates: { latitude: 37.8024, longitude: -122.4058 }
  }
];

export const findSuggestion = (query: string) => {
  const normalised = query.trim().toLowerCase();
  return (
    SUGGESTED_LOCATIONS.find((location) =>
      location.label.toLowerCase().includes(normalised)
    ) ?? null
  );
};
