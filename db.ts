import { init, id, lookup } from '@instantdb/react';
import { Schema } from './types';

// Using a demo app ID. In production, this would be a real ID.
const APP_ID = 'ed1b6088-dccd-476b-8805-6673861b49a3';

export const db = init<Schema>({ appId: APP_ID });

// Helper to generate IDs (InstantDB requires UUIDs)
export const generateId = id;

// Helper to lookup entities by ID (useful for legacy/non-UUID ids)
export const lookupId = lookup;