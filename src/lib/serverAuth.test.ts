import { describe, it, expect } from 'vitest';
import { isAuthorizedAdmin } from './serverAuth';

describe('Server Admin Authorization (isAuthorizedAdmin)', () => {
  const env = { ADMIN_API_KEY: 'supersecret_admin_token_2026' };

  it('denies access if no admin key is configured in env', () => {
    const req = new Request('http://localhost/api/bookings', {
      headers: { Authorization: 'Bearer supersecret_admin_token_2026' }
    });
    expect(isAuthorizedAdmin(req, undefined)).toBe(false);
    expect(isAuthorizedAdmin(req, { ADMIN_API_KEY: '' })).toBe(false);
  });

  it('denies access when no auth header is provided', () => {
    const req = new Request('http://localhost/api/bookings');
    expect(isAuthorizedAdmin(req, env)).toBe(false);
  });

  it('denies access when invalid Bearer token is provided', () => {
    const req = new Request('http://localhost/api/bookings', {
      headers: { Authorization: 'Bearer wrong_token' }
    });
    expect(isAuthorizedAdmin(req, env)).toBe(false);
  });

  it('authorizes valid Bearer token', () => {
    const req = new Request('http://localhost/api/bookings', {
      headers: { Authorization: 'Bearer supersecret_admin_token_2026' }
    });
    expect(isAuthorizedAdmin(req, env)).toBe(true);
  });

  it('authorizes valid X-Admin-Key header', () => {
    const req = new Request('http://localhost/api/bookings', {
      headers: { 'x-admin-key': 'supersecret_admin_token_2026' }
    });
    expect(isAuthorizedAdmin(req, env)).toBe(true);
  });
});
