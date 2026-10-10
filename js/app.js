/* ==========================================================================
   KABEER AHMED PORTFOLIO — CINEMATIC INTERACTIVE ENGINE
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initBackgroundVideo();
  initScrollTracker();
  initNavigation();
  initScrollReveal();
  initProjectFilters();
  initVideoModal();
  initContactForm();
  initParallaxLight();
  initProjectHoverVideo();
});

/* --------------------------------------------------------------------------
   1. Background Video Continuity & Autoplay Resilience
   -------------------------------------------------------------------------- */
function initBackgroundVideo() {
  const video = document.getElementById('bg-video');
  if (!video) return;

  // Reduced motion preference check
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) {
    video.pause();
    return;
  }

  // Attempt autoplay with error recovery
  const playPromise = video.play();
  if (playPromise !== undefined) {
    playPromise.catch((error) => {
      console.warn('Background video autoplay hindered by browser policy:', error);
      // Ensure muted state is locked and retry on first user interaction
      video.muted = true;
      const onUserInteraction = () => {
        video.play().catch(() => {});
        window.removeEventListener('click', onUserInteraction);
        window.removeEventListener('scroll', onUserInteraction);
      };
      window.addEventListener('click', onUserInteraction, { once: true });
      window.addEventListener('scroll', onUserInteraction, { once: true });
    });
  }

  // Prevent video from pausing when tab changes unless page visibility changes drastically
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      video.pause();
    } else {
      video.play().catch(() => {});
    }
  });
}

/* --------------------------------------------------------------------------
   2. Scroll Progress Bar & Floating Nav State
   -------------------------------------------------------------------------- */
function initScrollTracker() {
  const progressBar = document.getElementById('scroll-progress-line');
  const nav = document.getElementById('main-nav');

  function onScroll() {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrollPercent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;

    // Progress bar width
    if (progressBar) {
      progressBar.style.width = `${Math.min(Math.max(scrollPercent, 0), 100)}%`;
    }

    // Nav opacity and styling on scroll
    if (nav) {
      if (scrollTop > 50) {
        nav.classList.add('scrolled');
      } else {
        nav.classList.remove('scrolled');
      }
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

/* --------------------------------------------------------------------------
   3. Navigation Spy & Mobile Hamburger Menu
   -------------------------------------------------------------------------- */
function initNavigation() {
  const menuToggle = document.getElementById('menu-toggle');
  const navMenu = document.getElementById('nav-menu');
  const navLinks = document.querySelectorAll('.nav-link');
  const sections = document.querySelectorAll('section[id]');

  // Mobile menu toggle
  if (menuToggle && navMenu) {
    menuToggle.addEventListener('click', () => {
      const isExpanded = menuToggle.getAttribute('aria-expanded') === 'true';
      menuToggle.setAttribute('aria-expanded', !isExpanded);
      navMenu.classList.toggle('open');
    });

    // Close mobile menu on clicking any link
    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        navMenu.classList.remove('open');
        menuToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // Active section indicator using IntersectionObserver
  const observerOptions = {
    root: null,
    rootMargin: '-30% 0px -50% 0px',
    threshold: 0
  };

  const navObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute('id');
        navLinks.forEach(link => {
          if (link.getAttribute('href') === `#${id}`) {
            link.classList.add('active');
          } else {
            link.classList.remove('active');
          }
        });
      }
    });
  }, observerOptions);

  sections.forEach(section => navObserver.observe(section));
}

/* --------------------------------------------------------------------------
   4. Scroll Reveal Animations
   -------------------------------------------------------------------------- */
function initScrollReveal() {
  const revealElements = document.querySelectorAll('.reveal-on-scroll');

  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        // Unobserve once revealed for performance
        observer.unobserve(entry.target);
      }
    });
  }, {
    root: null,
    rootMargin: '0px 0px -60px 0px',
    threshold: 0.1
  });

  revealElements.forEach(el => revealObserver.observe(el));
}

/* --------------------------------------------------------------------------
   5. Project Portfolio Filtering
   -------------------------------------------------------------------------- */
function initProjectFilters() {
  const filterButtons = document.querySelectorAll('.filter-btn');
  const projectCards = document.querySelectorAll('.project-card');

  filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const filter = btn.getAttribute('data-filter');

      // Active state on buttons
      filterButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      // Filter projects
      projectCards.forEach(card => {
        const category = card.getAttribute('data-category') || '';
        if (filter === 'all' || category.includes(filter)) {
          card.style.display = 'flex';
          setTimeout(() => {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
          }, 20);
        } else {
          card.style.opacity = '0';
          card.style.transform = 'translateY(12px)';
          setTimeout(() => {
            card.style.display = 'none';
          }, 250);
        }
      });
    });
  });
}

/* --------------------------------------------------------------------------
   6. Video Walkthrough Modal (For Projects)
   -------------------------------------------------------------------------- */
function initVideoModal() {
  const modal = document.getElementById('video-modal');
  const modalVideo = document.getElementById('modal-video-player');
  const modalImage = document.getElementById('modal-image-viewer');
  const modalTitle = document.getElementById('modal-title');
  const modalClose = document.getElementById('modal-close');
  const openButtons = document.querySelectorAll('.open-video-modal');

  if (!modal) return;

  function openModal(mediaSrc, title) {
    if (modalTitle) modalTitle.textContent = title;

    const isImage = /\.(png|jpg|jpeg|webp)$/i.test(mediaSrc);
    if (isImage) {
      if (modalVideo) {
        modalVideo.pause();
        modalVideo.style.display = 'none';
        modalVideo.src = '';
      }
      if (modalImage) {
        modalImage.src = mediaSrc;
        modalImage.style.display = 'block';
      }
    } else {
      if (modalImage) {
        modalImage.style.display = 'none';
        modalImage.src = '';
      }
      if (modalVideo) {
        modalVideo.style.display = 'block';
        modalVideo.src = mediaSrc;
        modalVideo.play().catch(() => {});
      }
    }

    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
  }

  function closeModal() {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    if (modalVideo) {
      modalVideo.pause();
      modalVideo.src = '';
    }
    if (modalImage) {
      modalImage.src = '';
    }
  }

  openButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const mediaSrc = btn.getAttribute('data-video');
      const title = btn.getAttribute('data-title') || 'Project Walkthrough';
      if (mediaSrc) openModal(mediaSrc, title);
    });
  });

  if (modalClose) {
    modalClose.addEventListener('click', closeModal);
  }

  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('open')) {
      closeModal();
    }
  });
}

/* --------------------------------------------------------------------------
   7. Contact Form Validation & Submission
   -------------------------------------------------------------------------- */
function initContactForm() {
  const form = document.getElementById('portfolio-contact-form');
  const alertBox = document.getElementById('form-alert');
  const submitBtn = document.getElementById('submit-btn');

  if (!form) return;

  const nameInput = document.getElementById('contact-name');
  const emailInput = document.getElementById('contact-email');
  const typeSelect = document.getElementById('contact-project-type');
  const messageInput = document.getElementById('contact-message');

  const errorName = document.getElementById('error-name');
  const errorEmail = document.getElementById('error-email');
  const errorType = document.getElementById('error-type');
  const errorMessage = document.getElementById('error-message');

  function clearErrors() {
    [errorName, errorEmail, errorType, errorMessage].forEach(el => {
      if (el) el.textContent = '';
    });
    if (alertBox) alertBox.style.display = 'none';
  }

  function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    clearErrors();

    let isValid = true;

    // Validate Name
    if (!nameInput.value.trim()) {
      errorName.textContent = 'Please enter your name.';
      isValid = false;
    }

    // Validate Email
    if (!emailInput.value.trim()) {
      errorEmail.textContent = 'Please provide an email address.';
      isValid = false;
    } else if (!validateEmail(emailInput.value.trim())) {
      errorEmail.textContent = 'Please enter a valid email address.';
      isValid = false;
    }

    // Validate Project Type
    if (!typeSelect.value) {
      errorType.textContent = 'Please select a project category.';
      isValid = false;
    }

    // Validate Message
    if (!messageInput.value.trim() || messageInput.value.trim().length < 10) {
      errorMessage.textContent = 'Please enter at least 10 characters describing your project.';
      isValid = false;
    }

    if (!isValid) return;

    // Submission UI State
    const originalBtnText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<span>Sending Inquiry...</span>';
    submitBtn.disabled = true;

    // Netlify Forms AJAX Payload
    const formData = new FormData(form);
    const encodedBody = new URLSearchParams(formData).toString();

    fetch("/", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: encodedBody
    })
      .then(() => {
        submitBtn.innerHTML = originalBtnText;
        submitBtn.disabled = false;

        // Success Display
        if (alertBox) {
          alertBox.className = 'form-alert success';
          alertBox.innerHTML = `
            <strong>Thank you, ${escapeHtml(nameInput.value.trim())}!</strong><br>
            Your inquiry for <em>${escapeHtml(typeSelect.value)}</em> has been successfully sent to Kabeer Ahmed.
            I will review your project details and respond to <strong>${escapeHtml(emailInput.value.trim())}</strong> promptly.
            <br><br>
            <a href="mailto:kb57goodplayer@gmail.com?subject=Project%20Inquiry%20from%20${encodeURIComponent(nameInput.value.trim())}&body=${encodeURIComponent(messageInput.value.trim())}" 
               style="color: #D6B477; text-decoration: underline; font-weight: 600;">
              Want to send a direct email too? Click here →
            </a>
          `;
          alertBox.style.display = 'block';
        }

        form.reset();
      })
      .catch((error) => {
        console.warn('Netlify form submission notice:', error);
        submitBtn.innerHTML = originalBtnText;
        submitBtn.disabled = false;

        if (alertBox) {
          alertBox.className = 'form-alert success';
          alertBox.innerHTML = `
            <strong>Thank you, ${escapeHtml(nameInput.value.trim())}!</strong><br>
            Your inquiry has been recorded.
            <br><br>
            <a href="mailto:kb57goodplayer@gmail.com?subject=Project%20Inquiry%20from%20${encodeURIComponent(nameInput.value.trim())}&body=${encodeURIComponent(messageInput.value.trim())}" 
               style="color: #D6B477; text-decoration: underline; font-weight: 600;">
              Click here to open in default email client →
            </a>
          `;
          alertBox.style.display = 'block';
        }

        form.reset();
      });
  });
}

function escapeHtml(string) {
  const div = document.createElement('div');
  div.textContent = string;
  return div.innerHTML;
}

/* --------------------------------------------------------------------------
   8. Parallax Light & Cursor Illumination on Glass Cards
   -------------------------------------------------------------------------- */
function initParallaxLight() {
  const cards = document.querySelectorAll('.glass-panel, .project-card, .metric-glass, .pillar-card');
  cards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      card.style.setProperty('--mouse-x', `${x}px`);
      card.style.setProperty('--mouse-y', `${y}px`);
    });
  });
}

/* --------------------------------------------------------------------------
   9. Hover Video & Walkthrough Playback Interaction
   -------------------------------------------------------------------------- */
function initProjectHoverVideo() {
  const cards = document.querySelectorAll('.project-card');
  cards.forEach(card => {
    const video = card.querySelector('.card-hover-video');
    if (!video) return;

    card.addEventListener('mouseenter', () => {
      video.currentTime = 0;
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {});
      }
    });

    card.addEventListener('mouseleave', () => {
      video.pause();
    });
  });
}

