import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Backend settings come from env vars (see .env.example). With none set, events
// are only queued on the device and logged in dev.
const URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';
export const APP_VERSION = '0.1.0';

export type EventType =
  | 'app_open'
  | 'consent_set'
  | 'run_start'
  | 'choice'
  | 'episode_result'
  | 'run_end'
  | 'run_abandon'
  | 'settings_change'
  | 'report_tap';

type Ev = {
  anon_id: string;
  session_id: string;
  run_id: string | null;
  event_type: EventType;
  props: Record<string, unknown>;
  app_version: string;
  platform: string;
  client_ts: string;
};

const QUEUE_KEY = 'ls_queue';
const ID_KEY = 'ls_anon_id';
const CONSENT_KEY = 'ls_consent';
const MAX_QUEUE = 500;

const rid = () =>
  'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (ch) => {
    const r = (Math.random() * 16) | 0;
    return (ch === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });

let anonId = '';
let consent: boolean | null = null; // null = not asked yet
const sessionId = rid();
let runId: string | null = null;
let queue: Ev[] = [];
let ready: Promise<void> | null = null;
let flushing = false;

export function init(): Promise<void> {
  if (!ready) {
    ready = (async () => {
      try {
        let id = await AsyncStorage.getItem(ID_KEY);
        if (!id) {
          id = rid();
          await AsyncStorage.setItem(ID_KEY, id);
        }
        anonId = id;
        const c = await AsyncStorage.getItem(CONSENT_KEY);
        consent = c === null ? null : c === '1';
        const q = await AsyncStorage.getItem(QUEUE_KEY);
        queue = q ? JSON.parse(q) : [];
      } catch {
        anonId = rid();
      }
    })();
  }
  return ready;
}

export const getConsent = () => consent;

export async function setConsent(on: boolean) {
  await init();
  consent = on;
  AsyncStorage.setItem(CONSENT_KEY, on ? '1' : '0').catch(() => {});
  if (!on) {
    queue = [];
    AsyncStorage.removeItem(QUEUE_KEY).catch(() => {});
  } else {
    track('consent_set', { on: true });
  }
}

export function newRun(): string {
  runId = rid();
  return runId;
}
export const currentRunId = () => runId;

export function track(event_type: EventType, props: Record<string, unknown> = {}) {
  if (consent !== true) return;
  const ev: Ev = {
    anon_id: anonId,
    session_id: sessionId,
    run_id: runId,
    event_type,
    props,
    app_version: APP_VERSION,
    platform: Platform.OS,
    client_ts: new Date().toISOString(),
  };
  queue.push(ev);
  if (queue.length > MAX_QUEUE) queue = queue.slice(-MAX_QUEUE);
  AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue)).catch(() => {});
  if (!URL && __DEV__) console.log('[analytics]', event_type, props);
  flush();
}

async function post(path: string, rows: unknown[]): Promise<boolean> {
  if (!URL || !KEY) return false;
  try {
    const res = await fetch(`${URL}/rest/v1/${path}`, {
      method: 'POST',
      headers: {
        apikey: KEY,
        Authorization: `Bearer ${KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify(rows),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function flush() {
  if (flushing || !queue.length) return;
  flushing = true;
  const batch = queue.slice(0, 50);
  const ok = await post('events', batch);
  if (ok) {
    queue = queue.slice(batch.length);
    AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue)).catch(() => {});
  }
  flushing = false;
  if (ok && queue.length) flush();
}

// Feedback is an explicit, user-written submission, so it is sent regardless of the
// analytics toggle. The player sees what they are sending.
export async function sendFeedback(rating: number, comment: string, ctx: Record<string, unknown>) {
  await init();
  return post('feedback', [
    {
      anon_id: anonId,
      run_id: runId,
      rating,
      comment: comment.trim().slice(0, 1000),
      context: ctx,
      app_version: APP_VERSION,
      platform: Platform.OS,
    },
  ]);
}
