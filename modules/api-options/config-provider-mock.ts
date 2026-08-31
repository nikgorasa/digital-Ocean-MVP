// Mock implementation of ConfigProvider for apiOptions
// Simulates reading/writing from a persistent store (in-memory + optional file snapshot for integration tests)

import fs from 'fs';
import path from 'path';

export interface ApiOptions {
  provider: string;
  affiliateUrl: string;
  bookingUrl: string;
  staticUrl: string;
  username: string;
  password: string;
  timeout: number;
  retries: number;
  [key: string]: any;
}

const MOCK_DB_PATH = path.join(__dirname, '.mock-config.json');

let store: Partial<ApiOptions> = {
  provider: 'TBO',
  affiliateUrl: 'https://affiliate.tektravels.com/HotelAPI',
  bookingUrl: 'https://HotelBE.tektravels.com/hotelservice.svc/rest',
  staticUrl: 'http://api.tbotechnology.in/TBOHolidays_HotelAPI',
  username: 'RasaT',
  password: 'RasaT@123',
  timeout: 30000,
  retries: 3,
  lastUpdated: new Date().toISOString(),
};

// Load from snapshot if exists (for test continuity)
try {
  if (fs.existsSync(MOCK_DB_PATH)) {
    const data = JSON.parse(fs.readFileSync(MOCK_DB_PATH, 'utf8'));
    store = { ...store, ...data };
  }
} catch (e) {
  console.warn('[ConfigProviderMock] Failed to load snapshot, using defaults');
}

function persist() {
  try {
    fs.writeFileSync(MOCK_DB_PATH, JSON.stringify(store, null, 2));
  } catch (e) {
    console.warn('[ConfigProviderMock] Snapshot persist failed (non-critical)');
  }
}

export async function getApiOptions(): Promise<ApiOptions> {
  // Simulate DB read latency + network jitter
  await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 30));
  console.log('[ConfigProviderMock] getApiOptions called - returning current config');
  return { ...store } as ApiOptions;
}

export async function saveApiOptions(options: Partial<ApiOptions>): Promise<void> {
  // Simulate write latency
  await new Promise(resolve => setTimeout(resolve, 80 + Math.random() * 40));
  
  const previous = { ...store };
  store = {
    ...store,
    ...options,
    lastUpdated: new Date().toISOString(),
  };
  
  persist();
  
  console.log('[ConfigProviderMock] saveApiOptions updated:', {
    changedKeys: Object.keys(options),
    previousProvider: previous.provider,
    newProvider: store.provider,
  });
}

export function resetMockStore(): void {
  store = {
    provider: 'TBO',
    affiliateUrl: 'https://affiliate.tektravels.com/HotelAPI',
    bookingUrl: 'https://HotelBE.tektravels.com/hotelservice.svc/rest',
    staticUrl: 'http://api.tbotechnology.in/TBOHolidays_HotelAPI',
    username: 'RasaT',
    password: 'RasaT@123',
    timeout: 30000,
    retries: 3,
    lastUpdated: new Date().toISOString(),
  };
  if (fs.existsSync(MOCK_DB_PATH)) fs.unlinkSync(MOCK_DB_PATH);
  console.log('[ConfigProviderMock] Store reset to defaults');
}
