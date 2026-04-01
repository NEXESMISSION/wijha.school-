// ============================================
// Wijha Analytics - Smart Tracking Library
// Tracks: sessions, page views, scroll depth,
// form interactions, time on page, visibility,
// clicks, engagement scoring, and more
// ============================================

const WijhaTracker = (() => {
  // Use stateless anon client for landing tracking to avoid role switching to "authenticated"
  const trackingClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
  let trackingEnabled = true;
  let sessionId = null;
  let sessionStartTime = Date.now();
  let scrollMilestones = { 25: false, 50: false, 75: false, 100: false };
  let formStarted = false;
  let formStartTime = null;
  let heartbeatInterval = null;
  let engagementScore = 0;
  let visibleSections = new Set();
  let totalActiveTime = 0;
  let lastActiveTimestamp = Date.now();
  let isPageVisible = true;
  let fieldInteractions = {};
  let mouseIdleTimer = null;
  let lastMouseMove = Date.now();

  function generateId() {
    return 'wxs_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 9);
  }

  function getSessionId() {
    let sid = sessionStorage.getItem('wijha_session_id');
    if (!sid) {
      sid = generateId();
      sessionStorage.setItem('wijha_session_id', sid);
    }
    return sid;
  }

  function getUTMParams() {
    const params = new URLSearchParams(window.location.search);
    return {
      utm_source: params.get('utm_source') || null,
      utm_medium: params.get('utm_medium') || null,
      utm_campaign: params.get('utm_campaign') || null,
      utm_term: params.get('utm_term') || null,
      utm_content: params.get('utm_content') || null,
    };
  }

  function getDeviceType() {
    const ua = navigator.userAgent;
    if (/tablet|ipad|playbook|silk/i.test(ua)) return 'tablet';
    if (/mobile|iphone|ipod|android|blackberry|opera mini|iemobile/i.test(ua)) return 'mobile';
    return 'desktop';
  }

  function getBrowser() {
    const ua = navigator.userAgent;
    if (ua.includes('Firefox/')) return 'Firefox';
    if (ua.includes('Edg/')) return 'Edge';
    if (ua.includes('Chrome/')) return 'Chrome';
    if (ua.includes('Safari/')) return 'Safari';
    if (ua.includes('Opera') || ua.includes('OPR/')) return 'Opera';
    return 'Other';
  }

  function getOS() {
    const ua = navigator.userAgent;
    if (ua.includes('Windows')) return 'Windows';
    if (ua.includes('Mac OS')) return 'macOS';
    if (ua.includes('Linux')) return 'Linux';
    if (ua.includes('Android')) return 'Android';
    if (/iPhone|iPad|iPod/.test(ua)) return 'iOS';
    return 'Other';
  }

  function getCountryFromTimezone() {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const tzCountryMap = {
        'Africa/Algiers': 'Algeria', 'Africa/Tunis': 'Tunisia',
        'Africa/Casablanca': 'Morocco', 'Africa/Cairo': 'Egypt',
        'Asia/Riyadh': 'Saudi Arabia', 'Asia/Dubai': 'UAE',
        'Asia/Kuwait': 'Kuwait', 'Asia/Qatar': 'Qatar',
        'Asia/Bahrain': 'Bahrain', 'Asia/Muscat': 'Oman',
        'Asia/Amman': 'Jordan', 'Asia/Beirut': 'Lebanon',
        'Asia/Damascus': 'Syria', 'Asia/Baghdad': 'Iraq',
        'Africa/Tripoli': 'Libya', 'Africa/Khartoum': 'Sudan',
        'Asia/Aden': 'Yemen', 'Asia/Gaza': 'Palestine',
        'Europe/Paris': 'France', 'Europe/London': 'UK',
        'America/New_York': 'USA', 'Asia/Kolkata': 'India',
        'Asia/Istanbul': 'Turkey', 'Europe/Berlin': 'Germany',
      };
      return tzCountryMap[tz] || tz.split('/')[0];
    } catch {
      return 'Unknown';
    }
  }

  function isReturningVisitor() {
    const visited = localStorage.getItem('wijha_visited');
    if (visited) return true;
    localStorage.setItem('wijha_visited', Date.now().toString());
    return false;
  }

  async function createSession() {
    sessionId = getSessionId();
    const utm = getUTMParams();
    const sessionData = {
      session_id: sessionId,
      started_at: new Date().toISOString(),
      last_seen_at: new Date().toISOString(),
      device_type: getDeviceType(),
      browser: getBrowser(),
      os: getOS(),
      screen_width: screen.width,
      screen_height: screen.height,
      language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      country: getCountryFromTimezone(),
      referrer: document.referrer || null,
      landing_page: window.location.href,
      is_returning: isReturningVisitor(),
      ...utm
    };

    try {
      const { error } = await trackingClient
        .from('sessions')
        .upsert(sessionData, { onConflict: 'session_id' });
      if (error) {
        console.warn('Session create error:', error.message);
        trackingEnabled = false;
        return false;
      }
      return true;
    } catch (e) {
      console.warn('Session tracking failed:', e);
      trackingEnabled = false;
      return false;
    }
  }

  async function trackEvent(eventType, eventData = {}) {
    if (!trackingEnabled || !sessionId) return;
    const payload = {
      session_id: sessionId,
      event_type: eventType,
      event_data: eventData,
      page_url: window.location.href,
      viewport_width: window.innerWidth,
      viewport_height: window.innerHeight,
      scroll_y: Math.round(window.scrollY),
    };

    try {
      const { error } = await trackingClient.from('events').insert(payload);
      if (error) {
        console.warn('Event tracking error:', error.message);
        // Prevent repeated failing requests (e.g. RLS 403)
        trackingEnabled = false;
        return;
      }
    } catch (e) {
      console.warn('Event tracking failed:', e);
      trackingEnabled = false;
      return;
    }

    engagementScore += getEventWeight(eventType);
  }

  function getEventWeight(eventType) {
    const weights = {
      page_view: 1, scroll_25: 2, scroll_50: 3, scroll_75: 4, scroll_100: 5,
      form_impression: 2, form_start: 5, form_submit_success: 20,
      cta_click: 3, section_visible: 1, time_on_page: 1,
    };
    return weights[eventType] || 1;
  }

  function setupScrollTracking() {
    let ticking = false;
    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const scrollPercent = Math.round(
            (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
          );
          for (const milestone of [25, 50, 75, 100]) {
            if (scrollPercent >= milestone && !scrollMilestones[milestone]) {
              scrollMilestones[milestone] = true;
              trackEvent(`scroll_${milestone}`, { percent: milestone });
            }
          }
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
  }

  function setupSectionTracking() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !visibleSections.has(entry.target.id)) {
          visibleSections.add(entry.target.id);
          trackEvent('section_visible', { section: entry.target.id });

          if (entry.target.id === 'registration-form') {
            trackEvent('form_impression');
          }
        }
      });
    }, { threshold: 0.3 });

    document.querySelectorAll('section[id]').forEach(section => {
      observer.observe(section);
    });
  }

  function setupFormTracking() {
    const form = document.getElementById('wijha-form');
    if (!form) return;

    form.addEventListener('focusin', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA') {
        const fieldName = e.target.name || e.target.id;

        if (!formStarted) {
          formStarted = true;
          formStartTime = Date.now();
          trackEvent('form_start', { first_field: fieldName });
        }

        if (!fieldInteractions[fieldName]) {
          fieldInteractions[fieldName] = { focus_count: 0, focus_time: 0 };
        }
        fieldInteractions[fieldName].focus_count++;
        fieldInteractions[fieldName].last_focus = Date.now();
        trackEvent('field_focus', { field: fieldName });
      }
    });

    form.addEventListener('focusout', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA') {
        const fieldName = e.target.name || e.target.id;
        const hasValue = e.target.value.trim().length > 0;

        if (fieldInteractions[fieldName]?.last_focus) {
          fieldInteractions[fieldName].focus_time += Date.now() - fieldInteractions[fieldName].last_focus;
        }

        if (hasValue) {
          trackEvent('field_complete', { field: fieldName, time_spent: fieldInteractions[fieldName]?.focus_time || 0 });
        }
      }
    });
  }

  function setupVisibilityTracking() {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        isPageVisible = false;
        totalActiveTime += Date.now() - lastActiveTimestamp;
        trackEvent('page_hidden', { active_time_so_far: totalActiveTime });
      } else {
        isPageVisible = true;
        lastActiveTimestamp = Date.now();
        trackEvent('page_visible');
      }
    });
  }

  function setupHeartbeat() {
    heartbeatInterval = setInterval(() => {
      if (trackingEnabled && isPageVisible) {
        const timeOnPage = Math.round((Date.now() - sessionStartTime) / 1000);
        trackEvent('time_on_page', { seconds: timeOnPage, engagement_score: engagementScore });

        trackingClient
          .from('sessions')
          .update({ last_seen_at: new Date().toISOString(), total_events: engagementScore })
          .eq('session_id', sessionId)
          .then(() => {});
      }
    }, 30000);
  }

  function setupClickTracking() {
    document.addEventListener('click', (e) => {
      const target = e.target.closest('a, button, [data-track]');
      if (!target) return;

      const trackData = {
        tag: target.tagName,
        text: target.textContent?.trim().substring(0, 50),
        class: target.className?.substring(0, 100),
        id: target.id || null,
        href: target.href || null,
        x: e.clientX,
        y: e.clientY,
      };

      if (target.classList.contains('cta-button') || target.dataset.track === 'cta') {
        trackEvent('cta_click', trackData);
      } else if (target.href && target.hostname !== window.location.hostname) {
        trackEvent('outbound_click', trackData);
      } else {
        trackEvent('element_click', trackData);
      }
    });
  }

  function setupExitTracking() {
    window.addEventListener('beforeunload', () => {
      if (!trackingEnabled || !sessionId) return;
      const timeOnPage = Math.round((Date.now() - sessionStartTime) / 1000);
      if (isPageVisible) {
        totalActiveTime += Date.now() - lastActiveTimestamp;
      }

      const exitData = {
        time_on_page: timeOnPage,
        active_time: Math.round(totalActiveTime / 1000),
        max_scroll: Math.max(...Object.entries(scrollMilestones).filter(([, v]) => v).map(([k]) => +k), 0),
        form_started: formStarted,
        engagement_score: engagementScore,
        field_interactions: fieldInteractions,
      };

      const payload = JSON.stringify({
        session_id: sessionId,
        event_type: 'page_leave',
        event_data: exitData,
        page_url: window.location.href,
        viewport_width: window.innerWidth,
        viewport_height: window.innerHeight,
        scroll_y: Math.round(window.scrollY),
      });

      try {
        fetch(`${SUPABASE_URL}/rest/v1/events`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Prefer': 'return=minimal',
          },
          body: payload,
          keepalive: true,
        });
      } catch (_) {}
    });
  }

  function setupRageClickDetection() {
    let clicks = [];
    document.addEventListener('click', (e) => {
      const now = Date.now();
      clicks.push({ time: now, x: e.clientX, y: e.clientY });
      clicks = clicks.filter(c => now - c.time < 2000);

      if (clicks.length >= 4) {
        const area = clicks.every(c =>
          Math.abs(c.x - clicks[0].x) < 50 && Math.abs(c.y - clicks[0].y) < 50
        );
        if (area) {
          trackEvent('rage_click', { x: e.clientX, y: e.clientY, count: clicks.length });
          clicks = [];
        }
      }
    });
  }

  async function init() {
    const sessionReady = await createSession();
    if (!sessionReady) return;

    trackEvent('page_view', {
      title: document.title,
      referrer: document.referrer,
      screen: `${screen.width}x${screen.height}`,
    });

    setupScrollTracking();
    setupSectionTracking();
    setupFormTracking();
    setupVisibilityTracking();
    setupHeartbeat();
    setupClickTracking();
    setupExitTracking();
    setupRageClickDetection();
  }

  return {
    init,
    trackEvent,
    getSessionId: () => sessionId,
    getUTMParams,
    getDeviceType,
    getBrowser,
    getOS,
    getCountryFromTimezone,
    getEngagementScore: () => engagementScore,
    getFieldInteractions: () => fieldInteractions,
  };
})();

document.addEventListener('DOMContentLoaded', () => WijhaTracker.init());
