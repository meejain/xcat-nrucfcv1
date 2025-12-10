import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

// media query match that indicates mobile/tablet width
const isDesktop = window.matchMedia('(min-width: 900px)');

function closeOnEscape(e) {
  if (e.code === 'Escape') {
    const nav = document.getElementById('nav');
    const navSections = nav.querySelector('.nav-sections');
    const navSectionExpanded = navSections.querySelector('[aria-expanded="true"]');
    if (navSectionExpanded && isDesktop.matches) {
      // eslint-disable-next-line no-use-before-define
      toggleAllNavSections(navSections);
      navSectionExpanded.focus();
    } else if (!isDesktop.matches) {
      // eslint-disable-next-line no-use-before-define
      toggleMenu(nav, navSections);
      nav.querySelector('button').focus();
    }
  }
}

function closeOnFocusLost(e) {
  const nav = e.currentTarget;
  if (!nav.contains(e.relatedTarget)) {
    const navSections = nav.querySelector('.nav-sections');
    const navSectionExpanded = navSections.querySelector('[aria-expanded="true"]');
    if (navSectionExpanded && isDesktop.matches) {
      // eslint-disable-next-line no-use-before-define
      toggleAllNavSections(navSections, false);
    } else if (!isDesktop.matches) {
      // eslint-disable-next-line no-use-before-define
      toggleMenu(nav, navSections, false);
    }
  }
}

function openOnKeydown(e) {
  const focused = document.activeElement;
  const isNavDrop = focused.className === 'nav-drop';
  if (isNavDrop && (e.code === 'Enter' || e.code === 'Space')) {
    const dropExpanded = focused.getAttribute('aria-expanded') === 'true';
    // eslint-disable-next-line no-use-before-define
    toggleAllNavSections(focused.closest('.nav-sections'));
    focused.setAttribute('aria-expanded', dropExpanded ? 'false' : 'true');
  }
}

function focusNavSection() {
  document.activeElement.addEventListener('keydown', openOnKeydown);
}

/**
 * Toggles all nav sections
 * @param {Element} sections The container element
 * @param {Boolean} expanded Whether the element should be expanded or collapsed
 */
function toggleAllNavSections(sections, expanded = false) {
  sections.querySelectorAll('.nav-sections .default-content-wrapper > ul > li').forEach((section) => {
    section.setAttribute('aria-expanded', expanded);
  });
}

/**
 * Toggles the entire nav
 * @param {Element} nav The container element
 * @param {Element} navSections The nav sections within the container element
 * @param {*} forceExpanded Optional param to force nav expand behavior when not null
 */
function toggleMenu(nav, navSections, forceExpanded = null) {
  const expanded = forceExpanded !== null ? !forceExpanded : nav.getAttribute('aria-expanded') === 'true';
  const button = nav.querySelector('.nav-hamburger button');
  document.body.style.overflowY = (expanded || isDesktop.matches) ? '' : 'hidden';
  nav.setAttribute('aria-expanded', expanded ? 'false' : 'true');
  toggleAllNavSections(navSections, expanded || isDesktop.matches ? 'false' : 'true');
  button.setAttribute('aria-label', expanded ? 'Open navigation' : 'Close navigation');
  // enable nav dropdown keyboard accessibility
  const navDrops = navSections.querySelectorAll('.nav-drop');
  if (isDesktop.matches) {
    navDrops.forEach((drop) => {
      if (!drop.hasAttribute('tabindex')) {
        drop.setAttribute('tabindex', 0);
        drop.addEventListener('focus', focusNavSection);
      }
    });
  } else {
    navDrops.forEach((drop) => {
      drop.removeAttribute('tabindex');
      drop.removeEventListener('focus', focusNavSection);
    });
  }

  // enable menu collapse on escape keypress
  if (!expanded || isDesktop.matches) {
    // collapse menu on escape press
    window.addEventListener('keydown', closeOnEscape);
    // collapse menu on focus lost
    nav.addEventListener('focusout', closeOnFocusLost);
  } else {
    window.removeEventListener('keydown', closeOnEscape);
    nav.removeEventListener('focusout', closeOnFocusLost);
  }
}

/**
 * loads and decorates the header, mainly the nav
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  // load nav as fragment
  const navMeta = getMetadata('nav');
  let navPath = navMeta ? new URL(navMeta, window.location).pathname : '/content/nav';

  // Try loading the fragment
  let fragment = await loadFragment(navPath);

  // If fragment failed to load and we have a path starting with /content/, try without /content/
  if (!fragment && navPath.startsWith('/content/')) {
    navPath = navPath.replace('/content/', '/');
    fragment = await loadFragment(navPath);
  }

  // If still failed to load, try /nav as fallback
  if (!fragment && navPath !== '/nav') {
    navPath = '/nav';
    fragment = await loadFragment(navPath);
  }

  // If fragment failed to load, exit gracefully
  if (!fragment) {
    // eslint-disable-next-line no-console
    console.warn('Nav fragment could not be loaded from:', navPath);
    return;
  }

  // decorate nav DOM
  block.textContent = '';
  const nav = document.createElement('nav');
  nav.id = 'nav';
  while (fragment.firstElementChild) nav.append(fragment.firstElementChild);

  const classes = ['brand', 'sections', 'tools'];
  classes.forEach((c, i) => {
    const section = nav.children[i];
    if (section) section.classList.add(`nav-${c}`);
  });

  const navBrand = nav.querySelector('.nav-brand');
  const brandLink = navBrand.querySelector('.button');
  if (brandLink) {
    brandLink.className = '';
    brandLink.closest('.button-container').className = '';
  }

  const navSections = nav.querySelector('.nav-sections');
  if (navSections) {
    // Transform h2 + ul structure into proper nav list items
    const contentWrapper = navSections.querySelector('.default-content-wrapper');
    if (contentWrapper) {
      const newList = document.createElement('ul');
      let currentH2 = null;

      // Process all children
      Array.from(contentWrapper.children).forEach((element) => {
        if (element.tagName === 'H2') {
          // Create list item for h2
          const li = document.createElement('li');
          li.textContent = element.textContent;
          currentH2 = li;
          newList.appendChild(li);
        } else if (element.tagName === 'UL' && currentH2) {
          // Attach ul to the previous h2's li
          currentH2.appendChild(element.cloneNode(true));
          currentH2.classList.add('nav-drop');
          currentH2.setAttribute('aria-expanded', 'false');
        }
      });

      contentWrapper.textContent = '';
      contentWrapper.appendChild(newList);
    }

    navSections.querySelectorAll(':scope .default-content-wrapper > ul > li').forEach((navSection) => {
      if (navSection.querySelector('ul')) navSection.classList.add('nav-drop');
      navSection.addEventListener('click', () => {
        if (isDesktop.matches) {
          const expanded = navSection.getAttribute('aria-expanded') === 'true';
          toggleAllNavSections(navSections);
          navSection.setAttribute('aria-expanded', expanded ? 'false' : 'true');
        }
      });
    });
  }

  // hamburger for mobile
  const hamburger = document.createElement('div');
  hamburger.classList.add('nav-hamburger');
  hamburger.innerHTML = `<button type="button" aria-controls="nav" aria-label="Open navigation">
      <span class="nav-hamburger-icon"></span>
    </button>`;
  hamburger.addEventListener('click', () => toggleMenu(nav, navSections));
  nav.prepend(hamburger);
  nav.setAttribute('aria-expanded', 'false');
  // prevent mobile nav behavior on window resize
  toggleMenu(nav, navSections, isDesktop.matches);
  isDesktop.addEventListener('change', () => toggleMenu(nav, navSections, isDesktop.matches));

  const navWrapper = document.createElement('div');
  navWrapper.className = 'nav-wrapper';

  // Move nav-tools outside of nav for two-tier design
  const navTools = nav.querySelector('.nav-tools');
  if (navTools) {
    navWrapper.append(navTools);
  }

  navWrapper.append(nav);
  block.append(navWrapper);

  // Add search modal
  const searchModal = document.createElement('div');
  searchModal.className = 'search-modal';
  searchModal.innerHTML = `
    <div class="search-modal-overlay"></div>
    <div class="search-modal-content">
      <button class="search-modal-close" aria-label="Close search">×</button>
      <h2>What are you looking for?</h2>
      <form class="search-form" role="search">
        <input type="search" placeholder="Search..." aria-label="Search">
        <button type="submit" aria-label="Submit search">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20">
            <path d="M16.9,15.5c2.4-3.2,2.2-7.7-0.7-10.6c-3.1-3.1-8.1-3.1-11.3,0c-3.1,3.2-3.1,8.3,0,11.4
              c2.9,2.9,7.5,3.1,10.6,0.6c0,0.1,0,0.1,0,0.1l4.2,4.2c0.5,0.4,1.1,0.4,1.5,0c0.4-0.4,0.4-1,0-1.4L16.9,15.5
              C16.9,15.5,16.9,15.5,16.9,15.5L16.9,15.5z M14.8,6.3c2.3,2.3,2.3,6.1,0,8.5c-2.3,2.3-6.1,2.3-8.5,0C4,12.5,4,8.7,6.3,6.3
              C8.7,4,12.5,4,14.8,6.3z"/>
          </svg>
        </button>
      </form>
    </div>
  `;
  block.append(searchModal);

  // Search modal functionality
  const searchLink = navTools?.querySelector('a[href="#search"]');
  const closeBtn = searchModal.querySelector('.search-modal-close');
  const overlay = searchModal.querySelector('.search-modal-overlay');

  function openSearchModal() {
    searchModal.classList.add('active');
    document.body.style.overflow = 'hidden';
    searchModal.querySelector('input').focus();
  }

  function closeSearchModal() {
    searchModal.classList.remove('active');
    document.body.style.overflow = '';
  }

  if (searchLink) {
    searchLink.addEventListener('click', (e) => {
      e.preventDefault();
      openSearchModal();
    });
  }

  closeBtn.addEventListener('click', closeSearchModal);
  overlay.addEventListener('click', closeSearchModal);

  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && searchModal.classList.contains('active')) {
      closeSearchModal();
    }
  });

  // Handle search form submission
  searchModal.querySelector('.search-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const searchTerm = searchModal.querySelector('input').value;
    if (searchTerm.trim()) {
      // TODO: Implement actual search functionality
      // eslint-disable-next-line no-console
      console.log('Search for:', searchTerm);
    }
  });
}
