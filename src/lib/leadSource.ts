export type LeadSource =
  | 'Facebook'
  | 'Instagram'
  | 'Google'
  | 'WhatsApp'
  | 'Referral'
  | 'Direct/Unknown';

export const LEAD_SOURCES: readonly LeadSource[] = [
  'Facebook',
  'Instagram',
  'Google',
  'WhatsApp',
  'Referral',
  'Direct/Unknown',
] as const;

export const LEAD_SOURCE_STORAGE_KEY = 'gm_lead_source';

/**
 * Checks if a given value is one of the valid LeadSource strings.
 */
export function isValidLeadSource(val: any): val is LeadSource {
  return typeof val === 'string' && (LEAD_SOURCES as readonly string[]).includes(val);
}

/**
 * Parses query params and referrer to determine the lead source.
 * Allowed sources: Facebook, Instagram, Google, WhatsApp, Referral, or Direct/Unknown.
 * If the source cannot be identified, returns 'Direct/Unknown'.
 */
export function determineLeadSource(
  currentUrl?: string,
  referrer?: string,
  currentHost?: string
): LeadSource {
  let searchParams: URLSearchParams | null = null;
  if (currentUrl) {
    try {
      const parsedUrl = new URL(currentUrl, 'https://grandmotors.in');
      searchParams = parsedUrl.searchParams;
    } catch {
      // Ignore URL parsing errors
    }
  }

  // =========================================================================
  // PRIORITY 1: Explicit UTM parameters
  // =========================================================================
  if (searchParams) {
    const utmSource = (searchParams.get('utm_source') || '').trim().toLowerCase();
    const utmMedium = (searchParams.get('utm_medium') || '').trim().toLowerCase();
    const sourceParam = (searchParams.get('source') || '').trim().toLowerCase();
    const refParam = (searchParams.get('ref') || '').trim().toLowerCase();

    // Check primary utm_source parameter
    if (utmSource) {
      if (utmSource === 'google' || utmSource.includes('google') || utmSource.includes('adwords')) {
        return 'Google';
      }
      if (utmSource === 'facebook' || utmSource === 'fb' || utmSource.includes('facebook')) {
        return 'Facebook';
      }
      if (utmSource === 'instagram' || utmSource === 'ig' || utmSource.includes('instagram')) {
        return 'Instagram';
      }
      if (utmSource === 'whatsapp' || utmSource === 'wa' || utmSource.includes('whatsapp')) {
        return 'WhatsApp';
      }
      if (utmSource !== 'direct' && utmSource !== 'none') {
        return 'Referral';
      }
    }

    if (utmMedium === 'referral') {
      return 'Referral';
    }

    // Check explicit secondary source / ref query parameters if utm_source was absent
    const secondaryCandidates = [sourceParam, refParam].filter(Boolean);
    for (const val of secondaryCandidates) {
      if (val === 'google' || val.includes('google') || val.includes('adwords')) {
        return 'Google';
      }
      if (val === 'facebook' || val === 'fb' || val.includes('facebook')) {
        return 'Facebook';
      }
      if (val === 'instagram' || val === 'ig' || val.includes('instagram')) {
        return 'Instagram';
      }
      if (val === 'whatsapp' || val === 'wa' || val.includes('whatsapp')) {
        return 'WhatsApp';
      }
    }
  }

  // =========================================================================
  // PRIORITY 2: Reliable advertising click IDs
  // =========================================================================
  if (searchParams) {
    const hasGoogleClick =
      searchParams.has('gclid') ||
      searchParams.has('gbraid') ||
      searchParams.has('wbraid');
    if (hasGoogleClick) {
      return 'Google';
    }

    const hasMetaClick = searchParams.has('fbclid');
    if (hasMetaClick) {
      return 'Facebook';
    }

    const hasInstagramClick = searchParams.has('igshid') || searchParams.has('ig_rid');
    if (hasInstagramClick) {
      return 'Instagram';
    }
  }

  // =========================================================================
  // PRIORITY 3: Recognized external referrer
  // =========================================================================
  const cleanRef = (referrer || '').trim();
  if (cleanRef && cleanRef !== 'undefined' && cleanRef !== 'null') {
    // 3A. Android app deep-links (e.g. android-app://com.whatsapp)
    if (cleanRef.startsWith('android-app://')) {
      const appRef = cleanRef.toLowerCase();
      if (appRef.includes('com.google')) return 'Google';
      if (appRef.includes('com.whatsapp')) return 'WhatsApp';
      if (appRef.includes('com.instagram')) return 'Instagram';
      if (appRef.includes('com.facebook')) return 'Facebook';
      return 'Referral';
    }

    // 3B. Web referrer hostname
    let refHost = '';
    try {
      const refUrl = new URL(cleanRef.startsWith('http') ? cleanRef : `https://${cleanRef}`);
      refHost = refUrl.hostname.toLowerCase();
    } catch {
      const lower = cleanRef.toLowerCase();
      if (lower.includes('google.')) return 'Google';
      if (lower.includes('facebook.com') || lower.includes('fb.me')) return 'Facebook';
      if (lower.includes('instagram.com')) return 'Instagram';
      if (lower.includes('whatsapp') || lower.includes('wa.me')) return 'WhatsApp';
    }

    if (refHost) {
      // Check known platforms by hostname
      if (
        refHost === 'google.com' ||
        refHost.endsWith('.google.com') ||
        refHost.includes('google.')
      ) {
        return 'Google';
      }

      if (
        refHost === 'facebook.com' ||
        refHost.endsWith('.facebook.com') ||
        refHost === 'fb.me' ||
        refHost.endsWith('.fb.me')
      ) {
        return 'Facebook';
      }

      if (refHost === 'instagram.com' || refHost.endsWith('.instagram.com')) {
        return 'Instagram';
      }

      if (
        refHost === 'whatsapp.com' ||
        refHost.endsWith('.whatsapp.com') ||
        refHost === 'wa.me' ||
        refHost.endsWith('.wa.me')
      ) {
        return 'WhatsApp';
      }

      // Check internal navigation / self-referrals
      const hostLower = (currentHost || '').toLowerCase();
      const isInternal =
        (hostLower && (refHost === hostLower || refHost.endsWith(`.${hostLower}`))) ||
        refHost === 'grandmotors.in' ||
        refHost.endsWith('.grandmotors.in') ||
        refHost === 'localhost' ||
        refHost === '127.0.0.1';

      if (!isInternal && refHost.includes('.')) {
        return 'Referral';
      }
    }
  }

  // =========================================================================
  // PRIORITY 4: Direct/Unknown (Never guess when reliable evidence is unavailable)
  // =========================================================================
  return 'Direct/Unknown';
}

/**
 * Retrieves the saved lead source from browser storage.
 * Checks sessionStorage first (active tab session), then localStorage (persisted first visit).
 */
export function getSavedLeadSource(): LeadSource | null {
  if (typeof window === 'undefined') return null;
  try {
    const val =
      sessionStorage.getItem(LEAD_SOURCE_STORAGE_KEY) ||
      localStorage.getItem(LEAD_SOURCE_STORAGE_KEY);
    if (val && isValidLeadSource(val)) {
      return val;
    }
  } catch {}
  return null;
}

/**
 * Initializes and preserves the lead source on the customer's first website visit.
 * If a valid source is already stored from a previous page in this session/visit, it is preserved.
 * Otherwise, determines the source from the current URL and referrer, and stores it in both
 * sessionStorage and localStorage.
 */
export function initLeadSource(): LeadSource {
  if (typeof window === 'undefined') return 'Direct/Unknown';
  try {
    const existing = getSavedLeadSource();
    if (existing) {
      // Re-sync across both storages
      try {
        sessionStorage.setItem(LEAD_SOURCE_STORAGE_KEY, existing);
        localStorage.setItem(LEAD_SOURCE_STORAGE_KEY, existing);
      } catch {}
      return existing;
    }

    const currentUrl = window.location.href;
    const referrer = typeof document !== 'undefined' ? document.referrer : '';
    const currentHost = window.location.hostname;

    const detected = determineLeadSource(currentUrl, referrer, currentHost);

    try {
      sessionStorage.setItem(LEAD_SOURCE_STORAGE_KEY, detected);
      localStorage.setItem(LEAD_SOURCE_STORAGE_KEY, detected);
    } catch {}

    return detected;
  } catch {
    return 'Direct/Unknown';
  }
}

/**
 * Returns the active lead source for this visitor:
 * First checks saved storage, then falls back to live detection, then 'Direct/Unknown'.
 */
export function getLeadSource(): LeadSource {
  if (typeof window === 'undefined') return 'Direct/Unknown';
  const saved = getSavedLeadSource();
  if (saved) return saved;
  return initLeadSource();
}
