import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

export default function decorate(block) {
  /* change to ul, li */
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    moveInstrumentation(row, li);
    while (row.firstElementChild) li.append(row.firstElementChild);

    // Split image and text into separate divs
    [...li.children].forEach((div) => {
      const picture = div.querySelector('picture');
      const strong = div.querySelector('strong');

      if (picture && strong) {
        // Create separate divs for image and body
        const imageDiv = document.createElement('div');
        imageDiv.className = 'cards-icon-card-image';
        imageDiv.append(picture);

        const bodyDiv = document.createElement('div');
        bodyDiv.className = 'cards-icon-card-body';
        bodyDiv.append(strong);

        // Replace original div with new structure
        div.replaceWith(imageDiv, bodyDiv);
      } else if (picture) {
        div.className = 'cards-icon-card-image';
      } else {
        div.className = 'cards-icon-card-body';
      }
    });

    ul.append(li);
  });
  ul.querySelectorAll('picture > img').forEach((img) => {
    const optimizedPic = createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]);
    moveInstrumentation(img, optimizedPic.querySelector('img'));
    img.closest('picture').replaceWith(optimizedPic);
  });
  block.textContent = '';
  block.append(ul);
}
