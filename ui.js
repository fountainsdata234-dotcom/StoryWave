// ui.js - Shared UI components and logic for StoryWave

/**
 * Initializes the animated starfield background.
 */
export function initStarfield() {
  const canvas = document.getElementById('starfield');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let w = 0, h = 0, stars = [];
  function resize() { w = canvas.width = innerWidth; h = canvas.height = innerHeight; stars = []; const count = Math.round((w * h) / 20000); for (let i = 0; i < count; i++) { stars.push({ x: Math.random() * w, y: Math.random() * h, r: Math.random() * 1.6 + 0.2, vx: (Math.random() - 0.5) * 0.03, vy: (Math.random() - 0.5) * 0.03, alpha: 0.25 + Math.random() * 0.75 }) } }
  function frame() { if(!ctx) return; ctx.clearRect(0, 0, w, h); for (const s of stars) { s.x += s.vx; s.y += s.vy; if (s.x < 0) s.x = w; if (s.x > w) s.x = 0; if (s.y < 0) s.y = h; if (s.y > h) s.y = 0; ctx.beginPath(); ctx.globalAlpha = s.alpha; ctx.fillStyle = '#fff'; ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill(); } requestAnimationFrame(frame); }
  window.addEventListener('resize', resize);
  resize();
  frame();
}

/**
 * Initializes the floating background shapes.
 */
export function initFloatingShapes() {
  const box = document.getElementById('floating-shapes'); if (!box) return;
  const shapes = [];
  function makeShape(size, left, top, cls = '') { const d = document.createElement('div'); d.className = 'shape ' + cls; d.style.width = size + 'px'; d.style.height = size + 'px'; d.style.left = left; d.style.top = top; box.appendChild(d); shapes.push(d); }
  makeShape(160, '6%', '18%'); makeShape(120, '72%', '10%', 'small'); makeShape(100, '46%', '64%', 'small');
  let t = 0; function move() { t += 0.006; shapes.forEach((s, i) => { const dx = Math.sin(t * (0.6 + i * 0.4)) * 40; const dy = Math.cos(t * (0.8 + i * 0.3)) * 30; s.style.transform = `translate3d(${dx}px,${dy}px,0) rotate(${t * 20}deg)` }); requestAnimationFrame(move); } move();
  window.__hideFloatingShapes = (hide = true) => shapes.forEach(s => hide ? s.classList.add('hidden') : s.classList.remove('hidden'));
}

/**
 * Sets up the theme toggle button.
 */
export function initThemeToggle() {
    document.getElementById('themeToggle')?.addEventListener('click', () => {
        const cur = document.documentElement.getAttribute('data-theme') || 'dark';
        const next = cur === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        document.getElementById('meta-theme-color')?.setAttribute('content', next === 'dark' ? '#0b1220' : '#f6f9fb');
    });
}

/**
 * Updates the header controls based on user auth state.
 * @param {object|null} user - The Firebase user object.
 * @param {string} currentPage - Identifier for the current page (e.g., 'home', 'profile').
 */
export function updateHeader(user, currentPage = 'home', userData = {}) {
    const userProfileHeader = document.getElementById('userProfile');
    const desktopNav = document.querySelector('.desktop-nav');
    const mobileUser = document.getElementById('mobileUser');
    const mobileActions = document.getElementById('mobileActions');

    const navLinks = [
        { href: 'index.html', text: 'Home', page: 'home' },
        { href: 'download.html', text: 'My Library', page: 'library', requiresAuth: true },
        { href: 'about.html', text: 'About', page: 'about' },
        { href: 'contact.html', text: 'Contact', page: 'contact' },
        { href: 'profile.html', text: 'Profile', page: 'profile', requiresAuth: true },
    ];

    // 1. --- Desktop Navigation ---
    if (desktopNav) {
        desktopNav.innerHTML = navLinks
            .filter(link => !link.requiresAuth || user)
            .map(link => `<a class="nav-link ${link.page === currentPage ? 'active' : ''}" href="${link.href}">${link.text}</a>`)
            .join('');
    }

    if (user) {
        // --- LOGGED IN STATE ---
        const username = userData.username || user.displayName || 'Reader';
        const dp = user.photoURL || `https://api.dicebear.com/8.x/thumbs/svg?seed=${encodeURIComponent(username)}`;

        if (userProfileHeader) {
            userProfileHeader.innerHTML = `
                <a href="profile.html" style="display: flex; align-items: center; gap: 10px; text-decoration: none;">
                    <img src="${dp}" alt="Profile">
                </a>
                <button class="btn secondary" id="logoutBtn">Logout</button>
            `;
            // Add listener for logout. This needs access to the `auth` object.
            // We will handle this in the page-specific scripts.
        }
        if (mobileUser) mobileUser.innerHTML = `<img src="${dp}" alt="dp"><div><strong>${escapeHtml(username)}</strong><div class="muted small">${escapeHtml(user.email||'')}</div></div>`;
        if (mobileActions) {
            mobileActions.innerHTML = `<button class="btn secondary" id="mobileLogout">Logout</button>`;
            mobileActions.querySelector('#mobileLogout')?.addEventListener('click', () => auth.signOut());
        }
    } else {
        // --- GUEST STATE ---
        if (userProfileHeader) {
            userProfileHeader.innerHTML = `<button class="btn" id="openAuthDesktop">Login / Sign Up</button>`;
            userProfileHeader.querySelector('#openAuthDesktop')?.addEventListener('click', () => document.getElementById('authModal')?.classList.add('visible'));
        }
        if (mobileUser) mobileUser.innerHTML = `<img src="https://api.dicebear.com/8.x/thumbs/svg?seed=Guest" alt="Guest"><div><strong>Guest</strong><div class="muted small">Sign in to save reads</div></div>`;
        if (mobileActions) {
            mobileActions.innerHTML = `<button class="btn" id="openAuthMobile">Login / Sign Up</button>`;
            mobileActions.querySelector('#openAuthMobile')?.addEventListener('click', () => document.getElementById('authModal')?.classList.add('visible'));
        }
    }
}

/**
 * Manages a button's loading state with a spinner.
 * @param {HTMLElement} btn - The button element.
 * @param {boolean} loading - Whether to show the loading state.
 * @param {string|null} text - Optional text to show while loading.
 */
export function setBtnLoading(btn, loading = true, text = null) {
    if (!btn) return;
    if (loading) {
        btn.dataset.orig = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = `<span class="spinner"></span> ${text || 'Loading...'}`;
    } else {
        if (btn.dataset.orig) btn.innerHTML = btn.dataset.orig;
        btn.disabled = false;
        delete btn.dataset.orig;
    }
}

// Helper for escaping HTML, as it's a UI concern
export const escapeHtml = s => String(s||'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');