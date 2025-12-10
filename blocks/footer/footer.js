import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  // load footer as fragment
  const footerMeta = getMetadata('footer');
  let footerPath = footerMeta ? new URL(footerMeta, window.location).pathname : '/content/footer';

  // Try loading the fragment
  let fragment = await loadFragment(footerPath);

  // If fragment failed to load and we have a path starting with /content/, try without /content/
  if (!fragment && footerPath.startsWith('/content/')) {
    footerPath = footerPath.replace('/content/', '/');
    fragment = await loadFragment(footerPath);
  }

  // If still failed to load, try /footer as fallback
  if (!fragment && footerPath !== '/footer') {
    footerPath = '/footer';
    fragment = await loadFragment(footerPath);
  }

  // If fragment failed to load, exit gracefully
  if (!fragment) {
    // eslint-disable-next-line no-console
    console.warn('Footer fragment could not be loaded from:', footerPath);
    return;
  }

  // decorate footer DOM
  block.textContent = '';
  const footer = document.createElement('div');

  // Create navigation columns container
  const navContainer = document.createElement('div');
  navContainer.className = 'footer-nav';

  // Get all h2 sections (About CFC, Our Members, etc.)
  const sections = fragment.querySelectorAll('h2, h3');
  const hrs = fragment.querySelectorAll('hr');

  sections.forEach((heading) => {
    const column = document.createElement('div');
    column.className = 'footer-column';

    // Add the heading
    column.appendChild(heading.cloneNode(true));

    // Add the following elements (ul and p) until we hit another heading or hr
    let nextElement = heading.nextElementSibling;
    while (nextElement && nextElement.tagName !== 'H2' && nextElement.tagName !== 'H3' && nextElement.tagName !== 'HR') {
      if (nextElement.tagName === 'UL' || nextElement.tagName === 'P') {
        column.appendChild(nextElement.cloneNode(true));
      }
      nextElement = nextElement.nextElementSibling;
    }

    navContainer.appendChild(column);
  });

  footer.appendChild(navContainer);

  // Add legal section - find the last div.section that contains legal content
  const legalSection = document.createElement('div');
  legalSection.className = 'footer-legal';

  // Look for the section with Terms of Use, Privacy Policy, etc
  const allDivs = fragment.querySelectorAll('div.section');
  const lastSection = allDivs[allDivs.length - 1];

  if (lastSection) {
    const paragraphs = lastSection.querySelectorAll('p');
    paragraphs.forEach(p => {
      legalSection.appendChild(p.cloneNode(true));
    });
  }

  if (legalSection.children.length > 0) {
    footer.appendChild(legalSection);
  }

  block.append(footer);
}
