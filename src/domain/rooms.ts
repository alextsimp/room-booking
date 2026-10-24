export interface Room {
  id: string;
  name: string;
  capacity: number;
  projector: boolean;
}

export const ROOMS: readonly Room[] = [
  { id: 'small', name: 'Small room', capacity: 4, projector: false },
  { id: 'medium', name: 'Medium room', capacity: 8, projector: false },
  { id: 'large', name: 'Large room', capacity: 14, projector: true },
];
