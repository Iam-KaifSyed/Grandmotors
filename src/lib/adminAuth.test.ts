import { describe, it, expect } from 'vitest';
import {
  verifyAdminPassword,
  isValidAdminSession,
  getConfiguredAdminKey,
  timingSafeEqual,
  ADMIN_SESSION_MAX_AGE_MS,
} from './serverAuth';

const KEY = 'super_secret_admin_key_2026';

describe('getConfiguredAdminKey', () => {
  it('returns null when no key configured', () => {
    expect(getConfiguredAdminKey(undefined)).toBeNull();
    expect(getConfiguredAdminKey({})).toBeNull();
    expect(getConfiguredAdminKey({ ADMIN_API_KEY: '   ' })).toBeNull();
  });

  it('prefers ADMIN_API_KEY, falls back to ADMIN_SECRET', () => {
    expect(getConfiguredAdminKey({ ADMIN_API_KEY: 'a' })).toBe('a');
    expect(getConfiguredAdminKey({ ADMIN_SECRET: 'b' })).toBe('b');
  });
});

describe('timingSafeEqual', () => {
  it('matches equal strings and rejects unequal/length-mismatched', () => {
    expect(timingSafeEqual('abc', 'abc')).toBe(true);
    expect(timingSafeEqual('abc', 'abd')).toBe(false);
    expect(timingSafeEqual('abc', 'abcd')).toBe(false);
    expect(timingSafeEqual('', '')).toBe(true);
  });
});

describe('verifyAdminPassword', () => {
  const env = { ADMIN_API_KEY: KEY };

  it('rejects when no key configured', () => {
    expect(verifyAdminPassword(KEY, undefined)).toBe(false);
    expect(verifyAdminPassword(KEY, {})).toBe(false);
  });

  it('rejects empty / non-string / wrong password', () => {
    expect(verifyAdminPassword('', env)).toBe(false);
    expect(verifyAdminPassword(undefined, env)).toBe(false);
    expect(verifyAdminPassword(12345 as any, env)).toBe(false);
    expect(verifyAdminPassword('wrong', env)).toBe(false);
  });

  it('accepts the correct password', () => {
    expect(verifyAdminPassword(KEY, env)).toBe(true);
  });
});

describe('isValidAdminSession', () => {
  const now = 1_000_000_000_000;

  it('rejects missing / non-admin sessions', () => {
    expect(isValidAdminSession(null, now)).toBe(false);
    expect(isValidAdminSession(undefined, now)).toBe(false);
    expect(isValidAdminSession({}, now)).toBe(false);
    expect(isValidAdminSession({ admin: false, adminSince: now }, now)).toBe(false);
  });

  it('rejects sessions without a timestamp', () => {
    expect(isValidAdminSession({ admin: true }, now)).toBe(false);
    expect(isValidAdminSession({ admin: true, adminSince: 0 }, now)).toBe(false);
  });

  it('accepts a fresh admin session', () => {
    expect(isValidAdminSession({ admin: true, adminSince: now }, now)).toBe(true);
    expect(isValidAdminSession({ admin: true, adminSince: now - 1000 }, now)).toBe(true);
  });

  it('rejects an expired admin session', () => {
    const expired = now - ADMIN_SESSION_MAX_AGE_MS - 1;
    expect(isValidAdminSession({ admin: true, adminSince: expired }, now)).toBe(false);
  });
});
