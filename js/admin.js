/* ==========================================================================
   KTH ADMIN CMS — MANAGEMENT ENGINE & GITHUB AUTO-PUBLISHER
   ========================================================================== */

(function () {
  'use strict';

  // --- Configuration & State ---
  const DEFAULT_PASSCODE = 'kabeer2026';
  const GH_REPO = 'kabeerahmed2/kabeerahmed';
  const GH_BRANCH = 'main';
  const GH_FILE_PATH = 'data/site-content.json';

  let siteData = null;
  let activeTab = 'tab-projects';

  // --- Toast Notification Helper ---
  function showToast(msg, icon = '✅') {
    const toast = document.getElementById('kth-toast');
    const toastMsg = document.getElementById('toast-msg');
    const toastIcon = document.getElementById('toast-icon');
    if (!toast) return;

    toastMsg.textContent = msg;
    toastIcon.textContent = icon;
    toast.style.display = 'flex';

    setTimeout(() => {
      toast.style.display = 'none';
    }, 4000);
  }

  // --- Modal Helpers ---
  function openModal(id) {
    const el = document.getElementById(id);
    if (el) el.classList.add('open');
  }

  function closeModal(id) {
    const el = document.getElementById(id);
    if (el) el.classList.remove('open');
  }

  // Setup modal close triggers
  document.querySelectorAll('[data-close]').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-close');
      closeModal(targetId);
    });
  });

  // Close modals on backdrop click
  document.querySelectorAll('.modal-backdrop').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('open');
      }
    });
  });

  // --- Authentication ---
  function checkAuth() {
    const isAuthed = sessionStorage.getItem('kth_admin_session') === 'true';
    const gate = document.getElementById('login-gate');
    const app = document.getElementById('admin-app');

    if (isAuthed) {
      if (gate) gate.style.display = 'none';
      if (app) app.style.display = 'flex';
      initApp();
    } else {
      if (gate) gate.style.display = 'flex';
      if (app) app.style.display = 'none';
    }
  }

  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = document.getElementById('passcode-input').value.trim();
      const currentPass = localStorage.getItem('kth_admin_master_pass') || DEFAULT_PASSCODE;
      const errorMsg = document.getElementById('login-error');

      if (input === currentPass) {
        sessionStorage.setItem('kth_admin_session', 'true');
        if (errorMsg) errorMsg.style.display = 'none';
        checkAuth();
      } else {
        if (errorMsg) errorMsg.style.display = 'block';
      }
    });
  }

  const logoutBtn = document.getElementById('btn-logout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      sessionStorage.removeItem('kth_admin_session');
      window.location.reload();
    });
  }

  // --- Data Loading & Draft Management ---
  async function loadData() {
    const override = localStorage.getItem('kth_site_content_override');
    if (override) {
      try {
        siteData = JSON.parse(override);
        renderAllTabs();
        showToast('Loaded local draft changes', '✏️');
        return;
      } catch (e) {
        console.warn('Failed to parse override, fetching JSON:', e);
      }
    }

    try {
      const res = await fetch('/data/site-content.json', { cache: 'no-cache' });
      if (res.ok) {
        siteData = await res.json();
        renderAllTabs();
      } else {
        throw new Error('Failed to load JSON');
      }
    } catch (err) {
      console.error(err);
      showToast('Error loading site content file', '❌');
    }
  }

  function saveDraft() {
    if (!siteData) return;
    siteData.lastUpdated = new Date().toISOString();
    localStorage.setItem('kth_site_content_override', JSON.stringify(siteData));
    showToast('Saved draft to local storage', '💾');
  }

  // --- Tab Navigation ---
  function initTabs() {
    const tabs = document.querySelectorAll('.tab-btn');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

        tab.classList.add('active');
        const targetId = tab.getAttribute('data-tab');
        const targetContent = document.getElementById(targetId);
        if (targetContent) targetContent.classList.add('active');
        activeTab = targetId;
      });
    });
  }

  // ============================================================
  // TAB 1: PROJECTS
  // ============================================================
  function renderProjectsTab() {
    const container = document.getElementById('projects-list-container');
    const countBadge = document.getElementById('count-projects');
    if (!container || !siteData || !Array.isArray(siteData.projects)) return;

    countBadge.textContent = siteData.projects.length;

    container.innerHTML = siteData.projects.map((proj, idx) => {
      const stackHtml = Array.isArray(proj.stack)
        ? proj.stack.map(s => `<span class="tag-pill">${s}</span>`).join('')
        : '';
      const badgeHtml = proj.badge ? `<span class="admin-card-badge">${proj.badge}</span>` : '';

      return `
        <div class="admin-card" data-id="${proj.id}">
          <div class="admin-card-media">
            <img src="${proj.thumbnail || 'assets/kth_logo.jpg'}" alt="${proj.title}" onerror="this.src='assets/kth_logo.jpg'">
            ${badgeHtml}
          </div>
          <div class="admin-card-body">
            <h3 class="admin-card-title">${proj.title}</h3>
            <p class="admin-card-desc">${proj.description || ''}</p>
            <div class="admin-card-tags">
              ${stackHtml}
            </div>
            <div class="admin-card-footer">
              <div class="card-actions">
                <button class="btn btn-glass btn-sm" onclick="KTHAdmin.moveProject(${idx}, -1)" ${idx === 0 ? 'disabled style="opacity:0.4"' : ''} title="Move Up">▲</button>
                <button class="btn btn-glass btn-sm" onclick="KTHAdmin.moveProject(${idx}, 1)" ${idx === siteData.projects.length - 1 ? 'disabled style="opacity:0.4"' : ''} title="Move Down">▼</button>
              </div>
              <div class="card-actions">
                <button class="btn btn-glass btn-sm" onclick="KTHAdmin.editProject('${proj.id}')">✏️ Edit</button>
                <button class="btn btn-danger btn-sm" onclick="KTHAdmin.deleteProject('${proj.id}')">🗑️</button>
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  const btnAddProject = document.getElementById('btn-add-project');
  if (btnAddProject) {
    btnAddProject.addEventListener('click', () => {
      document.getElementById('form-project').reset();
      document.getElementById('proj-edit-id').value = '';
      document.getElementById('modal-project-title').textContent = 'Add New Project';
      openModal('modal-project');
    });
  }

  const formProject = document.getElementById('form-project');
  if (formProject) {
    formProject.addEventListener('submit', (e) => {
      e.preventDefault();
      const editId = document.getElementById('proj-edit-id').value;

      const rawStack = document.getElementById('proj-stack').value;
      const stackArray = rawStack.split(',').map(s => s.trim()).filter(Boolean);

      const projectObj = {
        id: editId || `proj-${Date.now()}`,
        title: document.getElementById('proj-title').value.trim(),
        category: document.getElementById('proj-category').value.trim(),
        categoryTag: document.getElementById('proj-categoryTag').value.trim(),
        badge: document.getElementById('proj-badge').value.trim(),
        verifiedBadge: document.getElementById('proj-verifiedBadge').value.trim(),
        thumbnail: document.getElementById('proj-thumbnail').value.trim(),
        video: document.getElementById('proj-video').value.trim(),
        walkthroughTitle: document.getElementById('proj-walkthroughTitle').value.trim(),
        hasHoverVideo: document.getElementById('proj-hasHoverVideo').checked,
        liveUrl: document.getElementById('proj-liveUrl').value.trim(),
        description: document.getElementById('proj-description').value.trim(),
        stack: stackArray
      };

      if (!siteData.projects) siteData.projects = [];

      if (editId) {
        const idx = siteData.projects.findIndex(p => p.id === editId);
        if (idx !== -1) siteData.projects[idx] = projectObj;
      } else {
        siteData.projects.unshift(projectObj);
      }

      closeModal('modal-project');
      renderProjectsTab();
      saveDraft();
    });
  }

  // ============================================================
  // TAB 2: EDUCATION
  // ============================================================
  function renderEducationTab() {
    const container = document.getElementById('education-list-container');
    const countBadge = document.getElementById('count-education');
    if (!container || !siteData || !Array.isArray(siteData.education)) return;

    countBadge.textContent = siteData.education.length;

    container.innerHTML = siteData.education.map((edu, idx) => {
      const tagsHtml = Array.isArray(edu.tags)
        ? edu.tags.map(t => `<span class="tag-pill">${t}</span>`).join('')
        : '';
      const currentBadge = edu.isCurrent ? '<span class="admin-card-badge" style="background:#E6B96D; color:#12100C;">CURRENT</span>' : '';

      return `
        <div class="admin-card" data-id="${edu.id}">
          <div class="admin-card-body">
            <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px;">
              <span style="font-family:var(--font-mono); font-size:0.75rem; color:var(--gold-light);">${edu.period}</span>
              ${currentBadge}
            </div>
            <h3 class="admin-card-title">${edu.title}</h3>
            <h4 style="font-size:0.85rem; color:var(--text-muted); margin-bottom:12px;">${edu.institution} (${edu.location || 'Karachi, Pakistan'})</h4>
            <p class="admin-card-desc">${edu.description}</p>
            <div class="admin-card-tags">
              ${tagsHtml}
            </div>
            <div class="admin-card-footer">
              <div class="card-actions">
                <button class="btn btn-glass btn-sm" onclick="KTHAdmin.moveEducation(${idx}, -1)" ${idx === 0 ? 'disabled style="opacity:0.4"' : ''} title="Move Up">▲</button>
                <button class="btn btn-glass btn-sm" onclick="KTHAdmin.moveEducation(${idx}, 1)" ${idx === siteData.education.length - 1 ? 'disabled style="opacity:0.4"' : ''} title="Move Down">▼</button>
              </div>
              <div class="card-actions">
                <button class="btn btn-glass btn-sm" onclick="KTHAdmin.editEducation('${edu.id}')">✏️ Edit</button>
                <button class="btn btn-danger btn-sm" onclick="KTHAdmin.deleteEducation('${edu.id}')">🗑️</button>
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  const btnAddEducation = document.getElementById('btn-add-education');
  if (btnAddEducation) {
    btnAddEducation.addEventListener('click', () => {
      document.getElementById('form-education').reset();
      document.getElementById('edu-edit-id').value = '';
      document.getElementById('modal-education-title').textContent = 'Add Education Entry';
      openModal('modal-education');
    });
  }

  const formEducation = document.getElementById('form-education');
  if (formEducation) {
    formEducation.addEventListener('submit', (e) => {
      e.preventDefault();
      const editId = document.getElementById('edu-edit-id').value;

      const rawTags = document.getElementById('edu-tags').value;
      const tagsArray = rawTags.split(',').map(s => s.trim()).filter(Boolean);

      const eduObj = {
        id: editId || `edu-${Date.now()}`,
        title: document.getElementById('edu-title').value.trim(),
        institution: document.getElementById('edu-institution').value.trim(),
        period: document.getElementById('edu-period').value.trim(),
        location: document.getElementById('edu-location').value.trim(),
        isCurrent: document.getElementById('edu-isCurrent').checked,
        description: document.getElementById('edu-description').value.trim(),
        tags: tagsArray
      };

      if (!siteData.education) siteData.education = [];

      if (editId) {
        const idx = siteData.education.findIndex(e => e.id === editId);
        if (idx !== -1) siteData.education[idx] = eduObj;
      } else {
        siteData.education.push(eduObj);
      }

      closeModal('modal-education');
      renderEducationTab();
      saveDraft();
    });
  }

  // ============================================================
  // TAB 3: EXPERIENCE
  // ============================================================
  function renderExperienceTab() {
    const container = document.getElementById('experience-list-container');
    const countBadge = document.getElementById('count-experience');
    if (!container || !siteData || !Array.isArray(siteData.experience)) return;

    countBadge.textContent = siteData.experience.length;

    container.innerHTML = siteData.experience.map((exp, idx) => {
      const badgeHtml = exp.badge ? `<span class="admin-card-badge" style="position:static; margin-bottom:8px; display:inline-block;">${exp.badge}</span>` : '';
      const pointsHtml = Array.isArray(exp.points)
        ? `<ul style="font-size:0.8rem; color:var(--text-muted); margin-left:16px; margin-bottom:12px; line-height:1.5;">${exp.points.map(p => `<li>${p}</li>`).join('')}</ul>`
        : '';
      const tagsHtml = Array.isArray(exp.tags)
        ? exp.tags.map(t => `<span class="tag-pill">${t}</span>`).join('')
        : '';

      return `
        <div class="admin-card" data-id="${exp.id}" style="${exp.highlight ? 'border-color:var(--border-gold-bright);' : ''}">
          <div class="admin-card-body">
            <div>${badgeHtml}</div>
            <div style="display:flex; justify-content:space-between; align-items:flex-start;">
              <h3 class="admin-card-title">${exp.role}</h3>
              <span style="font-family:var(--font-mono); font-size:0.75rem; color:var(--gold-light);">${exp.period}</span>
            </div>
            <h4 style="font-size:0.85rem; color:var(--text-muted); margin-bottom:10px;">${exp.org}</h4>
            <p class="admin-card-desc" style="-webkit-line-clamp:2;">${exp.summary}</p>
            ${pointsHtml}
            <div class="admin-card-tags">
              ${tagsHtml}
            </div>
            <div class="admin-card-footer">
              <div class="card-actions">
                <button class="btn btn-glass btn-sm" onclick="KTHAdmin.moveExperience(${idx}, -1)" ${idx === 0 ? 'disabled style="opacity:0.4"' : ''} title="Move Up">▲</button>
                <button class="btn btn-glass btn-sm" onclick="KTHAdmin.moveExperience(${idx}, 1)" ${idx === siteData.experience.length - 1 ? 'disabled style="opacity:0.4"' : ''} title="Move Down">▼</button>
              </div>
              <div class="card-actions">
                <button class="btn btn-glass btn-sm" onclick="KTHAdmin.editExperience('${exp.id}')">✏️ Edit</button>
                <button class="btn btn-danger btn-sm" onclick="KTHAdmin.deleteExperience('${exp.id}')">🗑️</button>
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  const btnAddExperience = document.getElementById('btn-add-experience');
  if (btnAddExperience) {
    btnAddExperience.addEventListener('click', () => {
      document.getElementById('form-experience').reset();
      document.getElementById('exp-edit-id').value = '';
      document.getElementById('modal-experience-title').textContent = 'Add Experience Entry';
      openModal('modal-experience');
    });
  }

  const formExperience = document.getElementById('form-experience');
  if (formExperience) {
    formExperience.addEventListener('submit', (e) => {
      e.preventDefault();
      const editId = document.getElementById('exp-edit-id').value;

      const rawPoints = document.getElementById('exp-points').value;
      const pointsArray = rawPoints.split('\n').map(s => s.trim()).filter(Boolean);

      const rawTags = document.getElementById('exp-tags').value;
      const tagsArray = rawTags.split(',').map(s => s.trim()).filter(Boolean);

      const expObj = {
        id: editId || `exp-${Date.now()}`,
        role: document.getElementById('exp-role').value.trim(),
        org: document.getElementById('exp-org').value.trim(),
        period: document.getElementById('exp-period').value.trim(),
        badge: document.getElementById('exp-badge').value.trim(),
        highlight: document.getElementById('exp-highlight').checked,
        summary: document.getElementById('exp-summary').value.trim(),
        points: pointsArray,
        tags: tagsArray
      };

      if (!siteData.experience) siteData.experience = [];

      if (editId) {
        const idx = siteData.experience.findIndex(ex => ex.id === editId);
        if (idx !== -1) siteData.experience[idx] = expObj;
      } else {
        siteData.experience.push(expObj);
      }

      closeModal('modal-experience');
      renderExperienceTab();
      saveDraft();
    });
  }

  // ============================================================
  // TAB 4: SKILLS & TOOLKIT
  // ============================================================
  function renderSkillsTab() {
    const container = document.getElementById('skills-list-container');
    const countBadge = document.getElementById('count-skills');
    if (!container || !siteData || !Array.isArray(siteData.skills)) return;

    countBadge.textContent = siteData.skills.length;

    container.innerHTML = siteData.skills.map((skill, idx) => {
      const pillsHtml = Array.isArray(skill.items)
        ? skill.items.map(item => `<span class="tag-pill">${item}</span>`).join('')
        : '';

      return `
        <div class="admin-card" data-id="${skill.id}">
          <div class="admin-card-body">
            <div style="display:flex; align-items:center; gap:10px; margin-bottom:8px;">
              <span style="font-size:1.3rem;">${skill.icon || '⚡'}</span>
              <h3 class="admin-card-title" style="margin-bottom:0;">${skill.category}</h3>
            </div>
            <p class="admin-card-desc" style="-webkit-line-clamp:2;">${skill.description}</p>
            <div class="admin-card-tags">
              ${pillsHtml}
            </div>
            <div class="admin-card-footer">
              <div class="card-actions">
                <button class="btn btn-glass btn-sm" onclick="KTHAdmin.moveSkill(${idx}, -1)" ${idx === 0 ? 'disabled style="opacity:0.4"' : ''}>▲</button>
                <button class="btn btn-glass btn-sm" onclick="KTHAdmin.moveSkill(${idx}, 1)" ${idx === siteData.skills.length - 1 ? 'disabled style="opacity:0.4"' : ''}>▼</button>
              </div>
              <div class="card-actions">
                <button class="btn btn-glass btn-sm" onclick="KTHAdmin.editSkill('${skill.id}')">✏️ Edit</button>
                <button class="btn btn-danger btn-sm" onclick="KTHAdmin.deleteSkill('${skill.id}')">🗑️</button>
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  const btnAddSkill = document.getElementById('btn-add-skill-group');
  if (btnAddSkill) {
    btnAddSkill.addEventListener('click', () => {
      document.getElementById('form-skill').reset();
      document.getElementById('skill-edit-id').value = '';
      document.getElementById('modal-skill-title').textContent = 'Add Skill Category';
      openModal('modal-skill');
    });
  }

  const formSkill = document.getElementById('form-skill');
  if (formSkill) {
    formSkill.addEventListener('submit', (e) => {
      e.preventDefault();
      const editId = document.getElementById('skill-edit-id').value;

      const rawItems = document.getElementById('skill-items').value;
      const itemsArray = rawItems.split(',').map(s => s.trim()).filter(Boolean);

      const skillObj = {
        id: editId || `skill-${Date.now()}`,
        icon: document.getElementById('skill-icon').value.trim() || '⚡',
        category: document.getElementById('skill-category').value.trim(),
        description: document.getElementById('skill-description').value.trim(),
        items: itemsArray
      };

      if (!siteData.skills) siteData.skills = [];

      if (editId) {
        const idx = siteData.skills.findIndex(s => s.id === editId);
        if (idx !== -1) siteData.skills[idx] = skillObj;
      } else {
        siteData.skills.push(skillObj);
      }

      closeModal('modal-skill');
      renderSkillsTab();
      saveDraft();
    });
  }

  // ============================================================
  // TAB 5: GENERAL SITE CONTENT
  // ============================================================
  function loadGeneralContentTab() {
    if (!siteData) return;

    // Hero
    if (siteData.hero) {
      document.getElementById('gen-hero-status').value = siteData.hero.status || '';
      document.getElementById('gen-hero-desc').value = siteData.hero.description || '';
      if (Array.isArray(siteData.hero.metrics)) {
        if (siteData.hero.metrics[0]) {
          document.getElementById('gen-metric-1-num').value = siteData.hero.metrics[0].number || '';
          document.getElementById('gen-metric-1-lbl').value = siteData.hero.metrics[0].label || '';
        }
        if (siteData.hero.metrics[1]) {
          document.getElementById('gen-metric-2-num').value = siteData.hero.metrics[1].number || '';
          document.getElementById('gen-metric-2-lbl').value = siteData.hero.metrics[1].label || '';
        }
      }
    }

    // About
    if (siteData.about) {
      document.getElementById('gen-about-subtitle').value = siteData.about.subtitle || '';
      if (Array.isArray(siteData.about.credentials)) {
        document.getElementById('gen-about-creds').value = siteData.about.credentials.join('\n');
      }
    }

    // Startup
    if (siteData.startup) {
      document.getElementById('gen-startup-desc').value = siteData.startup.description || '';
      document.getElementById('gen-startup-quote').value = siteData.startup.quote || '';
    }

    // Contact
    if (siteData.contact) {
      document.getElementById('gen-contact-wa').value = siteData.contact.whatsapp || '';
      document.getElementById('gen-contact-email').value = siteData.contact.email || '';
    }
  }

  const btnSaveGeneral = document.getElementById('btn-save-general');
  if (btnSaveGeneral) {
    btnSaveGeneral.addEventListener('click', () => {
      if (!siteData) return;

      // Hero
      if (!siteData.hero) siteData.hero = {};
      siteData.hero.status = document.getElementById('gen-hero-status').value.trim();
      siteData.hero.description = document.getElementById('gen-hero-desc').value.trim();
      if (!siteData.hero.metrics) siteData.hero.metrics = [{}, {}, {}];
      siteData.hero.metrics[0] = {
        number: document.getElementById('gen-metric-1-num').value.trim(),
        label: document.getElementById('gen-metric-1-lbl').value.trim()
      };
      siteData.hero.metrics[1] = {
        number: document.getElementById('gen-metric-2-num').value.trim(),
        label: document.getElementById('gen-metric-2-lbl').value.trim()
      };

      // About
      if (!siteData.about) siteData.about = {};
      siteData.about.subtitle = document.getElementById('gen-about-subtitle').value.trim();
      siteData.about.credentials = document.getElementById('gen-about-creds').value.split('\n').map(s => s.trim()).filter(Boolean);

      // Startup
      if (!siteData.startup) siteData.startup = {};
      siteData.startup.description = document.getElementById('gen-startup-desc').value.trim();
      siteData.startup.quote = document.getElementById('gen-startup-quote').value.trim();

      // Contact
      if (!siteData.contact) siteData.contact = {};
      const wa = document.getElementById('gen-contact-wa').value.trim();
      siteData.contact.whatsapp = wa;
      siteData.contact.whatsappUrl = `https://wa.me/${wa.replace(/[^0-9]/g, '')}`;
      siteData.contact.email = document.getElementById('gen-contact-email').value.trim();

      saveDraft();
      showToast('General content saved to local draft');
    });
  }

  // ============================================================
  // TAB 6: SETTINGS, PASSCODE & GITHUB SYNC
  // ============================================================
  function loadSettingsTab() {
    const savedToken = localStorage.getItem('kth_gh_token');
    if (savedToken) {
      document.getElementById('gh-token-input').value = savedToken;
      updateGhStatusIndicator(true, 'Saved in browser');
    }
  }

  function updateGhStatusIndicator(connected, msg) {
    const el = document.getElementById('gh-status-indicator');
    if (!el) return;
    el.style.display = 'block';
    if (connected) {
      el.innerHTML = `<span style="color:#22c55e;">● Connected:</span> ${msg}`;
    } else {
      el.innerHTML = `<span style="color:#ef4444;">● Disconnected:</span> ${msg}`;
    }
  }

  const btnSaveGhToken = document.getElementById('btn-save-gh-token');
  if (btnSaveGhToken) {
    btnSaveGhToken.addEventListener('click', () => {
      const token = document.getElementById('gh-token-input').value.trim();
      if (!token) {
        localStorage.removeItem('kth_gh_token');
        updateGhStatusIndicator(false, 'Token cleared');
        showToast('GitHub token removed');
        return;
      }
      localStorage.setItem('kth_gh_token', token);
      updateGhStatusIndicator(true, 'Token saved locally');
      showToast('GitHub Personal Access Token saved');
    });
  }

  const btnTestGh = document.getElementById('btn-test-gh');
  if (btnTestGh) {
    btnTestGh.addEventListener('click', async () => {
      const token = document.getElementById('gh-token-input').value.trim() || localStorage.getItem('kth_gh_token');
      if (!token) {
        alert('Please enter a GitHub Personal Access Token first.');
        return;
      }
      updateGhStatusIndicator(true, 'Testing connection to api.github.com...');
      try {
        const res = await fetch(`https://api.github.com/repos/${GH_REPO}`, {
          headers: {
            'Authorization': `token ${token}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        });
        if (res.ok) {
          const repoData = await res.json();
          updateGhStatusIndicator(true, `Repository verified: ${repoData.full_name} (${repoData.default_branch})`);
          showToast('GitHub connection successful!');
        } else {
          const errData = await res.json().catch(() => ({}));
          updateGhStatusIndicator(false, errData.message || 'Access denied. Check token permissions.');
          showToast('GitHub connection failed', '❌');
        }
      } catch (err) {
        updateGhStatusIndicator(false, err.message);
        showToast('Network error testing GitHub', '❌');
      }
    });
  }

  const btnChangePasscode = document.getElementById('btn-change-passcode');
  if (btnChangePasscode) {
    btnChangePasscode.addEventListener('click', () => {
      const p1 = document.getElementById('new-passcode-input').value;
      const p2 = document.getElementById('confirm-passcode-input').value;

      if (!p1 || p1.length < 6) {
        alert('Passcode must be at least 6 characters.');
        return;
      }
      if (p1 !== p2) {
        alert('Passcodes do not match.');
        return;
      }

      localStorage.setItem('kth_admin_master_pass', p1);
      document.getElementById('new-passcode-input').value = '';
      document.getElementById('confirm-passcode-input').value = '';
      showToast('Master passcode updated successfully!');
    });
  }

  // Backup & Restore
  const btnExportJson = document.getElementById('btn-export-json');
  if (btnExportJson) {
    btnExportJson.addEventListener('click', () => {
      if (!siteData) return;
      const jsonStr = JSON.stringify(siteData, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `kth-site-content-backup-${new Date().toISOString().slice(0,10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('Backup JSON downloaded');
    });
  }

  const importJsonFile = document.getElementById('import-json-file');
  if (importJsonFile) {
    importJsonFile.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target.result);
          if (parsed && (parsed.projects || parsed.hero)) {
            siteData = parsed;
            saveDraft();
            renderAllTabs();
            showToast('Site content restored from JSON backup!');
          } else {
            alert('Invalid site content JSON format.');
          }
        } catch (err) {
          alert('Could not parse JSON file: ' + err.message);
        }
      };
      reader.readAsText(file);
    });
  }

  const btnResetDefaults = document.getElementById('btn-reset-defaults');
  if (btnResetDefaults) {
    btnResetDefaults.addEventListener('click', async () => {
      if (!confirm('Are you sure you want to discard local drafts and reset to the published version?')) return;
      localStorage.removeItem('kth_site_content_override');
      await loadData();
      showToast('Reset to published content');
    });
  }

  // ============================================================
  // PREVIEW & GITHUB PUBLISHING
  // ============================================================
  const btnPreviewSite = document.getElementById('btn-preview-site');
  if (btnPreviewSite) {
    btnPreviewSite.addEventListener('click', () => {
      if (!siteData) return;
      localStorage.setItem('kth_site_content_override', JSON.stringify(siteData));
      window.open('/', '_blank');
      showToast('Opening live preview in new tab...', '👁️');
    });
  }

  // Direct GitHub Commit & Push API
  const btnPublishGithub = document.getElementById('btn-publish-github');
  if (btnPublishGithub) {
    btnPublishGithub.addEventListener('click', async () => {
      const token = localStorage.getItem('kth_gh_token');
      if (!token) {
        alert('GitHub Token required: Please enter and save your GitHub Personal Access Token in the "⚙️ GitHub & Security" tab to publish directly to Netlify.');
        document.querySelector('[data-tab="tab-settings"]').click();
        return;
      }

      if (!confirm('Publish all current changes live to GitHub and trigger Netlify auto-deployment?')) {
        return;
      }

      btnPublishGithub.disabled = true;
      btnPublishGithub.innerHTML = `<span>⏳ Committing to GitHub...</span>`;

      try {
        // Step 1: Get latest file SHA
        const getUrl = `https://api.github.com/repos/${GH_REPO}/contents/${GH_FILE_PATH}?ref=${GH_BRANCH}`;
        const getRes = await fetch(getUrl, {
          headers: {
            'Authorization': `token ${token}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        });

        let fileSha = null;
        if (getRes.ok) {
          const fileData = await getRes.json();
          fileSha = fileData.sha;
        }

        // Step 2: Prepare base64 payload
        siteData.lastUpdated = new Date().toISOString();
        const jsonContent = JSON.stringify(siteData, null, 2);
        // UTF-8 safe base64
        const b64Content = btoa(unescape(encodeURIComponent(jsonContent)));

        const putBody = {
          message: `Update site content via KTH Admin CMS [${new Date().toLocaleDateString()}]`,
          content: b64Content,
          branch: GH_BRANCH
        };
        if (fileSha) putBody.sha = fileSha;

        // Step 3: PUT commit to GitHub
        const putUrl = `https://api.github.com/repos/${GH_REPO}/contents/${GH_FILE_PATH}`;
        const putRes = await fetch(putUrl, {
          method: 'PUT',
          headers: {
            'Authorization': `token ${token}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(putBody)
        });

        if (putRes.ok) {
          const putData = await putRes.json();
          localStorage.removeItem('kth_site_content_override'); // Clean draft
          showToast('Live commit published! Netlify deployment started (~30s).', '🚀');
          alert(`🎉 SUCCESS! Content successfully committed to GitHub (${putData.commit.sha.slice(0,7)}).\n\nNetlify is automatically building and deploying your live website right now. It will be live at https://kabeerahmed1.netlify.app in ~30 seconds!`);
        } else {
          const errData = await putRes.json().catch(() => ({}));
          throw new Error(errData.message || 'GitHub commit failed');
        }
      } catch (err) {
        console.error(err);
        alert('Publication error: ' + err.message);
        showToast('Failed to publish to GitHub', '❌');
      } finally {
        btnPublishGithub.disabled = false;
        btnPublishGithub.innerHTML = `<span>🚀 Publish Live to Netlify</span>`;
      }
    });
  }

  // Master Render Coordinator
  function renderAllTabs() {
    renderProjectsTab();
    renderEducationTab();
    renderExperienceTab();
    renderSkillsTab();
    loadGeneralContentTab();
    loadSettingsTab();
  }

  function initApp() {
    initTabs();
    loadData();
  }

  // --- Exposed Handlers for Inline Actions ---
  window.KTHAdmin = {
    // Projects
    moveProject: (idx, dir) => {
      const target = idx + dir;
      if (target < 0 || target >= siteData.projects.length) return;
      const temp = siteData.projects[idx];
      siteData.projects[idx] = siteData.projects[target];
      siteData.projects[target] = temp;
      renderProjectsTab();
      saveDraft();
    },
    editProject: (id) => {
      const proj = siteData.projects.find(p => p.id === id);
      if (!proj) return;
      document.getElementById('proj-edit-id').value = proj.id;
      document.getElementById('proj-title').value = proj.title || '';
      document.getElementById('proj-category').value = proj.category || 'ai-automation';
      document.getElementById('proj-categoryTag').value = proj.categoryTag || '';
      document.getElementById('proj-badge').value = proj.badge || '';
      document.getElementById('proj-verifiedBadge').value = proj.verifiedBadge || '';
      document.getElementById('proj-thumbnail').value = proj.thumbnail || '';
      document.getElementById('proj-video').value = proj.video || '';
      document.getElementById('proj-walkthroughTitle').value = proj.walkthroughTitle || '';
      document.getElementById('proj-hasHoverVideo').checked = !!proj.hasHoverVideo;
      document.getElementById('proj-liveUrl').value = proj.liveUrl || '';
      document.getElementById('proj-description').value = proj.description || '';
      document.getElementById('proj-stack').value = Array.isArray(proj.stack) ? proj.stack.join(', ') : (proj.stack || '');
      document.getElementById('modal-project-title').textContent = 'Edit Project';
      openModal('modal-project');
    },
    deleteProject: (id) => {
      if (!confirm('Are you sure you want to remove this project?')) return;
      siteData.projects = siteData.projects.filter(p => p.id !== id);
      renderProjectsTab();
      saveDraft();
    },

    // Education
    moveEducation: (idx, dir) => {
      const target = idx + dir;
      if (target < 0 || target >= siteData.education.length) return;
      const temp = siteData.education[idx];
      siteData.education[idx] = siteData.education[target];
      siteData.education[target] = temp;
      renderEducationTab();
      saveDraft();
    },
    editEducation: (id) => {
      const edu = siteData.education.find(e => e.id === id);
      if (!edu) return;
      document.getElementById('edu-edit-id').value = edu.id;
      document.getElementById('edu-title').value = edu.title || '';
      document.getElementById('edu-institution').value = edu.institution || '';
      document.getElementById('edu-period').value = edu.period || '';
      document.getElementById('edu-location').value = edu.location || '';
      document.getElementById('edu-isCurrent').checked = !!edu.isCurrent;
      document.getElementById('edu-description').value = edu.description || '';
      document.getElementById('edu-tags').value = Array.isArray(edu.tags) ? edu.tags.join(', ') : (edu.tags || '');
      document.getElementById('modal-education-title').textContent = 'Edit Education Entry';
      openModal('modal-education');
    },
    deleteEducation: (id) => {
      if (!confirm('Are you sure you want to remove this education entry?')) return;
      siteData.education = siteData.education.filter(e => e.id !== id);
      renderEducationTab();
      saveDraft();
    },

    // Experience
    moveExperience: (idx, dir) => {
      const target = idx + dir;
      if (target < 0 || target >= siteData.experience.length) return;
      const temp = siteData.experience[idx];
      siteData.experience[idx] = siteData.experience[target];
      siteData.experience[target] = temp;
      renderExperienceTab();
      saveDraft();
    },
    editExperience: (id) => {
      const exp = siteData.experience.find(e => e.id === id);
      if (!exp) return;
      document.getElementById('exp-edit-id').value = exp.id;
      document.getElementById('exp-role').value = exp.role || '';
      document.getElementById('exp-org').value = exp.org || '';
      document.getElementById('exp-period').value = exp.period || '';
      document.getElementById('exp-badge').value = exp.badge || '';
      document.getElementById('exp-highlight').checked = !!exp.highlight;
      document.getElementById('exp-summary').value = exp.summary || '';
      document.getElementById('exp-points').value = Array.isArray(exp.points) ? exp.points.join('\n') : '';
      document.getElementById('exp-tags').value = Array.isArray(exp.tags) ? exp.tags.join(', ') : (exp.tags || '');
      document.getElementById('modal-experience-title').textContent = 'Edit Experience Entry';
      openModal('modal-experience');
    },
    deleteExperience: (id) => {
      if (!confirm('Are you sure you want to remove this experience entry?')) return;
      siteData.experience = siteData.experience.filter(e => e.id !== id);
      renderExperienceTab();
      saveDraft();
    },

    // Skills
    moveSkill: (idx, dir) => {
      const target = idx + dir;
      if (target < 0 || target >= siteData.skills.length) return;
      const temp = siteData.skills[idx];
      siteData.skills[idx] = siteData.skills[target];
      siteData.skills[target] = temp;
      renderSkillsTab();
      saveDraft();
    },
    editSkill: (id) => {
      const skill = siteData.skills.find(s => s.id === id);
      if (!skill) return;
      document.getElementById('skill-edit-id').value = skill.id;
      document.getElementById('skill-icon').value = skill.icon || '⚡';
      document.getElementById('skill-category').value = skill.category || '';
      document.getElementById('skill-description').value = skill.description || '';
      document.getElementById('skill-items').value = Array.isArray(skill.items) ? skill.items.join(', ') : (skill.items || '');
      document.getElementById('modal-skill-title').textContent = 'Edit Skill Category';
      openModal('modal-skill');
    },
    deleteSkill: (id) => {
      if (!confirm('Are you sure you want to remove this skill category?')) return;
      siteData.skills = siteData.skills.filter(s => s.id !== id);
      renderSkillsTab();
      saveDraft();
    }
  };

  // Start Auth Check on load
  document.addEventListener('DOMContentLoaded', checkAuth);
})();
