/* ==========================================================================
   KABEER TECH HUB — DYNAMIC CONTENT HYDRATION ENGINE
   Loads and renders site-content.json (or local preview override)
   ========================================================================== */

(function () {
  'use strict';

  // Check for local preview override from Admin panel
  function getPreviewOverride() {
    try {
      const stored = localStorage.getItem('kth_site_content_override');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Could not read kth_site_content_override:', e);
    }
    return null;
  }

  // Inject preview banner if local override is active
  function showPreviewBanner() {
    if (document.getElementById('kth-preview-banner')) return;
    const banner = document.createElement('div');
    banner.id = 'kth-preview-banner';
    banner.style.cssText = `
      position: fixed;
      bottom: 24px;
      left: 24px;
      z-index: 99999;
      background: rgba(18, 16, 12, 0.94);
      border: 1px solid #E6B96D;
      box-shadow: 0 10px 30px rgba(0,0,0,0.8), 0 0 20px rgba(230,185,109,0.3);
      backdrop-filter: blur(12px);
      border-radius: 50px;
      padding: 10px 18px;
      display: flex;
      align-items: center;
      gap: 12px;
      font-family: 'Space Grotesk', sans-serif;
      font-size: 0.85rem;
      color: #FBF9F5;
      animation: kthFadeIn 0.4s ease;
    `;
    banner.innerHTML = `
      <span style="display:inline-flex; width:8px; height:8px; border-radius:50%; background:#22c55e; box-shadow:0 0 8px #22c55e;"></span>
      <span><strong>Preview Active:</strong> Local Admin Draft</span>
      <a href="/admin" style="color:#E6B96D; text-decoration:none; font-weight:600; padding:4px 10px; background:rgba(230,185,109,0.12); border-radius:20px; border:1px solid rgba(230,185,109,0.3);">Admin Panel</a>
      <button id="kth-clear-preview-btn" style="background:transparent; border:none; color:#a1a1aa; cursor:pointer; font-size:1.1rem; padding:0 4px; display:flex; align-items:center;">&times;</button>
    `;
    document.body.appendChild(banner);

    const clearBtn = document.getElementById('kth-clear-preview-btn');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        localStorage.removeItem('kth_site_content_override');
        window.location.reload();
      });
    }
  }

  // Helper: escape HTML safely
  function esc(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // 1. Render Projects
  function renderProjects(projects) {
    const grid = document.getElementById('projects-grid');
    if (!grid || !Array.isArray(projects)) return;

    grid.innerHTML = projects.map(proj => {
      const badgeHtml = proj.badge ? `<span class="badge-prototype-pill">${esc(proj.badge)}</span> ` : '';
      const catTagHtml = proj.categoryTag ? `<div class="project-category-tag">${badgeHtml}${esc(proj.categoryTag)}</div>` : '';
      
      let hoverVideoHtml = '';
      let playCueText = 'WORKFLOW GRAPH';
      if (proj.hasHoverVideo && proj.video && /\.(mp4|webm|mov)$/i.test(proj.video)) {
        hoverVideoHtml = `
          <video class="card-hover-video" muted loop playsinline preload="none">
            <source src="${esc(proj.video)}" type="video/mp4">
          </video>
        `;
        playCueText = 'HOVER TO PLAY';
      } else if (proj.badge) {
        playCueText = 'PROTOTYPE PREVIEW';
      }

      const stackHtml = Array.isArray(proj.stack)
        ? proj.stack.map(s => `<span>${esc(s)}</span>`).join(' • ')
        : esc(proj.stack || '');

      let liveLinkHtml = '';
      if (proj.liveUrl) {
        liveLinkHtml = `
          <a href="${esc(proj.liveUrl)}" target="_blank" rel="noopener noreferrer" class="btn-visit-site">
            <span>View Project ↗</span>
          </a>
        `;
      }

      let walkthroughBtnHtml = '';
      if (proj.video) {
        walkthroughBtnHtml = `
          <button class="project-link open-video-modal" data-video="${esc(proj.video)}" data-title="${esc(proj.walkthroughTitle || proj.title)}">
            <span>Walkthrough</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          </button>
        `;
      }

      let verifiedBadgeHtml = '';
      if (proj.verifiedBadge) {
        verifiedBadgeHtml = `<span class="status-verified">${esc(proj.verifiedBadge)}</span>`;
      }

      return `
        <div class="glass-panel project-card" data-category="${esc(proj.category || 'all')}">
          <div class="project-media">
            <img src="${esc(proj.thumbnail)}" alt="${esc(proj.title)}" class="project-thumb-img" loading="lazy">
            ${hoverVideoHtml}
            <div class="hover-play-cue">
              <span class="play-cue-dot"></span>
              <span>${playCueText}</span>
            </div>
            ${catTagHtml}
          </div>
          <div class="project-body">
            <h3 class="project-title">${esc(proj.title)}</h3>
            <p class="project-desc">${esc(proj.description)}</p>
            <div class="project-stack">
              ${stackHtml}
            </div>
            <div class="project-footer">
              ${liveLinkHtml}
              ${walkthroughBtnHtml}
              ${verifiedBadgeHtml}
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  // 2. Render Education
  function renderEducation(education) {
    const container = document.querySelector('#education .timeline-container');
    if (!container || !Array.isArray(education)) return;

    const itemsHtml = education.map(edu => {
      const dotClass = edu.isCurrent ? 'timeline-dot current-dot' : 'timeline-dot';
      const badgeClass = edu.isCurrent ? 'timeline-period current-badge' : 'timeline-period';
      const tagsHtml = Array.isArray(edu.tags) && edu.tags.length > 0
        ? `<div class="tag-row">${edu.tags.map(t => `<span class="tag-pill">${esc(t)}</span>`).join('')}</div>`
        : '';

      return `
        <div class="timeline-item">
          <div class="timeline-dot-wrap">
            <div class="${dotClass}"></div>
          </div>
          <div class="timeline-content">
            <div class="timeline-meta-row">
              <span class="${badgeClass}">${esc(edu.period)}</span>
              <span class="timeline-location">${esc(edu.location)}</span>
            </div>
            <h3 class="timeline-title">${esc(edu.title)}</h3>
            <h4 class="timeline-institution">${esc(edu.institution)}</h4>
            <p class="timeline-desc">${esc(edu.description)}</p>
            ${tagsHtml}
          </div>
        </div>
      `;
    }).join('');

    container.innerHTML = `
      <div class="timeline-line" aria-hidden="true"></div>
      ${itemsHtml}
    `;
  }

  // 3. Render Experience
  function renderExperience(experience) {
    const grid = document.querySelector('#experience .experience-grid');
    if (!grid || !Array.isArray(experience)) return;

    grid.innerHTML = experience.map(exp => {
      const cardClass = exp.highlight ? 'glass-panel exp-card highlight-card' : 'glass-panel exp-card';
      const badgeHtml = exp.badge ? `<div class="exp-badge">${esc(exp.badge)}</div>` : '';
      const pointsHtml = Array.isArray(exp.points) && exp.points.length > 0
        ? `<ul class="exp-points">${exp.points.map(p => `<li>${esc(p)}</li>`).join('')}</ul>`
        : '';
      const tagsHtml = Array.isArray(exp.tags) && exp.tags.length > 0
        ? `<div class="tag-row">${exp.tags.map(t => `<span class="tag-pill">${esc(t)}</span>`).join('')}</div>`
        : '';

      return `
        <div class="${cardClass}">
          ${badgeHtml}
          <div class="exp-header">
            <div>
              <h3 class="exp-role">${esc(exp.role)}</h3>
              <h4 class="exp-org">${esc(exp.org)}</h4>
            </div>
            <span class="exp-dates">${esc(exp.period)}</span>
          </div>
          <p class="exp-summary">${esc(exp.summary)}</p>
          ${pointsHtml}
          ${tagsHtml}
        </div>
      `;
    }).join('');
  }

  // 4. Render Skills
  function renderSkills(skills) {
    const grid = document.querySelector('#skills .skills-grid');
    if (!grid || !Array.isArray(skills)) return;

    grid.innerHTML = skills.map(skill => {
      const pillsHtml = Array.isArray(skill.items)
        ? skill.items.map(item => `<span class="skill-pill">${esc(item)}</span>`).join('')
        : '';

      return `
        <div class="glass-panel skill-group-card">
          <div class="skill-group-header">
            <span class="skill-icon">${esc(skill.icon || '⚡')}</span>
            <h3>${esc(skill.category)}</h3>
          </div>
          <p class="skill-group-desc">${esc(skill.description)}</p>
          <div class="skill-pills">
            ${pillsHtml}
          </div>
        </div>
      `;
    }).join('');
  }

  // 5. Render Hero & General Content
  function renderHero(hero) {
    if (!hero) return;
    const statusText = document.querySelector('.hero-left .status-text');
    if (statusText && hero.status) statusText.textContent = hero.status;

    const eyebrow = document.querySelector('.hero-left .eyebrow-tag');
    if (eyebrow && Array.isArray(hero.eyebrow)) {
      eyebrow.innerHTML = hero.eyebrow.map((item, idx) => `<span>${esc(item)}</span>${idx < hero.eyebrow.length - 1 ? '<span class="sep">•</span>' : ''}`).join('');
    }

    const desc = document.querySelector('.hero-left .hero-description');
    if (desc && hero.description) desc.innerHTML = hero.description;

    const metaBar = document.querySelector('.hero-meta-bar');
    if (metaBar && Array.isArray(hero.metrics)) {
      metaBar.innerHTML = hero.metrics.map((m, idx) => `
        <div class="meta-item">
          <span class="meta-num">${esc(m.number)}</span>
          <span class="meta-lbl">${esc(m.label)}</span>
        </div>
        ${idx < hero.metrics.length - 1 ? '<div class="meta-divider"></div>' : ''}
      `).join('');
    }
  }

  // 6. Render About
  function renderAbout(about) {
    if (!about) return;
    const sub = document.querySelector('#about .section-subtitle');
    if (sub && about.subtitle) sub.textContent = about.subtitle;

    const certsList = document.querySelector('.about-certs-strip .certs-list');
    if (certsList && Array.isArray(about.credentials)) {
      certsList.innerHTML = about.credentials.map(c => `<span class="cert-pill">${esc(c)}</span>`).join('');
    }
  }

  // 7. Render Startup
  function renderStartup(startup) {
    if (!startup) return;
    const desc = document.querySelector('.startup-info .startup-desc');
    if (desc && startup.description) desc.innerHTML = startup.description;

    const quote = document.querySelector('.startup-info .startup-quote');
    if (quote && startup.quote) quote.innerHTML = startup.quote;
  }

  // 8. Render Contact Channels
  function renderContact(contact) {
    if (!contact) return;
    const whatsappLink = document.querySelector('.direct-channels a[href*="wa.me"]');
    if (whatsappLink && contact.whatsapp) {
      whatsappLink.href = contact.whatsappUrl || `https://wa.me/${contact.whatsapp.replace(/[^0-9]/g, '')}`;
      const span = whatsappLink.querySelector('span');
      if (span) span.textContent = `WhatsApp: ${contact.whatsapp}`;
    }

    const emailLink = document.querySelector('.direct-channels a[href*="mailto:"]');
    if (emailLink && contact.email) {
      emailLink.href = `mailto:${contact.email}`;
      const span = emailLink.querySelector('span');
      if (span) span.textContent = contact.email;
    }
  }

  function safeRun(fn, name) {
    try {
      fn();
    } catch (e) {
      console.warn('Hydration notice (' + name + '):', e);
    }
  }

  // Master Hydration Coordinator
  function hydrate(content) {
    if (!content) return;
    if (content.projects) safeRun(() => renderProjects(content.projects), 'projects');
    if (content.education) safeRun(() => renderEducation(content.education), 'education');
    if (content.experience) safeRun(() => renderExperience(content.experience), 'experience');
    if (content.skills) safeRun(() => renderSkills(content.skills), 'skills');
    if (content.hero) safeRun(() => renderHero(content.hero), 'hero');
    if (content.about) safeRun(() => renderAbout(content.about), 'about');
    if (content.startup) safeRun(() => renderStartup(content.startup), 'startup');
    if (content.contact) safeRun(() => renderContact(content.contact), 'contact');

    // Re-initialize interactive elements from app.js if loaded
    if (typeof window.initProjectFilters === 'function') window.initProjectFilters();
    if (typeof window.initVideoModal === 'function') window.initVideoModal();
    if (typeof window.initProjectHoverVideo === 'function') window.initProjectHoverVideo();
    if (typeof window.initScrollReveal === 'function') window.initScrollReveal();

    // Dispatch event for other integrations
    window.dispatchEvent(new CustomEvent('kth:contentHydrated', { detail: content }));
  }

  // Init sequence
  async function init() {
    const override = getPreviewOverride();
    if (override) {
      console.log('⚡ KTH: Rendering from Local Preview Override');
      hydrate(override);
      showPreviewBanner();
      return;
    }

    try {
      const res = await fetch('/data/site-content.json', { cache: 'no-cache' });
      if (res.ok) {
        const data = await res.json();
        hydrate(data);
      }
    } catch (err) {
      console.log('KTH: Static fallback markup active.', err);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Export helper for window
  window.KTHContentLoader = {
    hydrate,
    reload: init
  };
})();
