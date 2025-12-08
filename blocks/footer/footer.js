import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  // load footer as fragment
  const footerMeta = getMetadata('footer');
  const footerPath = footerMeta ? new URL(footerMeta, window.location).pathname : '/content/footer';
  const fragment = await loadFragment(footerPath);

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

    // Add the following ul if exists
    let nextElement = heading.nextElementSibling;
    while (nextElement && nextElement.tagName === 'UL') {
      column.appendChild(nextElement.cloneNode(true));
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
