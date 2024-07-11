'use strict';

/**
 * Utils functions
 */
const utils = {
  /**
   * Function to call with a matching strategy
   * When this one is true, the onCallback function will be called with the event as this
   * @param {function(Event): boolean} matchingStrategy
   * @param {function(Event): void} onCallback
   * @return {function(Event): void}
   */
  delegatedEventListener: function (matchingStrategy, onCallback) {
    return evt =>
      matchingStrategy(evt) ? onCallback.call(evt.target, evt) : null;
  },
  /**
   * Matching strategy on the event target
   * Is true when the event target matches with the given selector
   * @param {string} selector
   * @return {function(Event): boolean}
   */
  selectorMatchingStrategy: function (selector) {
    return evt =>
      evt.target.matches(selector) || !!evt.target.closest(selector);
  },
  /**
   * Shortcut in case of selectorMatchingStrategy is often used
   * @param {string} selector selector
   * @param {function(Event): void} onCallback
   * @return {function(Event): void}
   */
  delegatedTargetSelectorEventListener: function (selector, onCallback) {
    return this.delegatedEventListener(
      this.selectorMatchingStrategy(selector),
      onCallback
    );
  },
  /**
   * Add or remove a class from the element classList depending on isPresent
   * @param {Element} element
   * @param {string} className
   * @param {boolean|(function(): boolean)} isPresent
   */
  toggleClass: function (element, className, isPresent) {
    const toAdd = typeof isPresent === 'boolean' ? isPresent : isPresent();
    if (toAdd) element.classList.add(className);
    else element.classList.remove(className);
  },
};

/**
 * Modal window management
 */
(() => {
  const modal = document.querySelector('.modal');
  const overlay = document.querySelector('.overlay');
  const btnCloseModal = document.querySelector('.btn--close-modal');
  const btnsOpenModal = document.querySelectorAll('.btn--show-modal');

  function openModal() {
    modal.classList.remove('hidden');
    overlay.classList.remove('hidden');
  }

  function closeModal() {
    modal.classList.add('hidden');
    overlay.classList.add('hidden');
  }

  btnsOpenModal.forEach(btn => btn.addEventListener('click', openModal));
  btnCloseModal.addEventListener('click', closeModal);
  overlay.addEventListener('click', closeModal);

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
      closeModal();
    }
  });
})();

/**
 * Header management
 */
(() => {
  const navLinkSel = '.nav__link';
  const nav = document.querySelector('nav.nav');

  /**
   * Using delegatedEventListener to avoid putting an if statement in the callback function
   * Thanks to that, the callback function is cleaner
   */
  document.querySelector('.nav__links').addEventListener(
    'click',
    utils.delegatedTargetSelectorEventListener(navLinkSel, evt => {
      evt.preventDefault();
      document
        .querySelector(evt.target.getAttribute('href'))
        .scrollIntoView({ behavior: 'smooth' });
    })
  );

  /**
   * Handle the mouse over / out and return a function depending on the opacity
   * @param {number} opacity
   * @return {(function(Event): void)}
   */
  function handleHover(opacity) {
    return function (evt) {
      nav
        .querySelectorAll(navLinkSel)
        .forEach(el =>
          el !== evt.target ? (el.style.opacity = `${opacity}`) : null
        );
      nav.querySelector('img').style.opacity = `${opacity}`;
    };
  }

  nav.addEventListener(
    'mouseover',
    utils.delegatedTargetSelectorEventListener(navLinkSel, handleHover(0.5))
  );
  nav.addEventListener(
    'mouseout',
    utils.delegatedTargetSelectorEventListener(navLinkSel, handleHover(1))
  );

  // Sticky header manager
  const header = document.querySelector('.header');
  const headerObs = new IntersectionObserver(
    entries => utils.toggleClass(nav, 'sticky', !entries[0].isIntersecting),
    { root: null, threshold: 0, rootMargin: `-${nav.offsetHeight}px` }
  );
  headerObs.observe(header);
})();

/**
 * Tab manager
 */
(() => {
  const operationsZone = document.querySelector('.operations');
  const tabContainer = operationsZone.querySelector(
    '.operations__tab-container'
  );
  const tabBtnSelector = '.btn.operations__tab';
  const tabButtons = tabContainer.querySelectorAll(tabBtnSelector);
  const tabs = operationsZone.querySelectorAll('.operations__content');
  tabContainer.addEventListener(
    'click',
    utils.delegatedTargetSelectorEventListener(tabBtnSelector, function () {
      const clickedBtn = this.closest(tabBtnSelector);

      tabButtons.forEach(btn =>
        btn.classList.remove('operations__tab--active')
      );
      tabs.forEach(zone =>
        zone.classList.remove('operations__content--active')
      );

      clickedBtn.classList.add('operations__tab--active');
      operationsZone
        .querySelector(`.operations__content--${clickedBtn.dataset.tab}`)
        .classList.add('operations__content--active');
    })
  );
})();

/**
 * Sections management
 */
(() => {
  // Display sections
  const sectionObs = new IntersectionObserver(
    entries => {
      const [entry] = entries;
      utils.toggleClass(entry.target, 'section--hidden', !entry.isIntersecting);
    },
    { root: null, threshold: 0.15 }
  );
  document.querySelectorAll('.section').forEach(section => {
    section.classList.add('section--hidden');
    sectionObs.observe(section);
  });
})();

/**
 * Image lazy loading
 */
(() => {
  const lazyLodaderObs = new IntersectionObserver(
    entries => {
      const [entry] = entries;
      const imageElt = entry.target;
      if (entry.isIntersecting) {
        lazyLodaderObs.unobserve(imageElt);
        imageElt.src = imageElt.dataset.src;
        imageElt.addEventListener('load', () =>
          imageElt.classList.remove('lazy-img')
        );
      }
    },
    { root: null, threshold: 0, rootMargin: '100px' }
  );
  document
    .querySelectorAll('img[data-src].lazy-img')
    .forEach(image => lazyLodaderObs.observe(image));
})();

/**
 * Slider management
 */
(() => {
  const slider = document.querySelector('.slider');
  const slides = slider.querySelectorAll('.slide');
  const dots = slider.querySelector('.dots');
  const dotClassName = 'dots__dot';
  let selectedSlide;

  /**
   * Reposition all slides depending on which one is currently selected
   * @param selected
   */
  function goTo(selected) {
    // 1 - Change the actual selected slide
    selectedSlide = selected;
    // 2 - Translate to the selected slide
    slides.forEach(
      (slide, index) =>
        (slide.style.transform = `translateX(${(index - selected) * 100}%)`)
    );
    // 3 - Update the dots active class
    dots
      .querySelectorAll(`.${dotClassName}`)
      .forEach((dot, index) =>
        utils.toggleClass(dot, 'dots__dot--active', index === selected)
      );
  }

  /**
   * Go to the next slide
   */
  function next() {
    goTo((selectedSlide + 1) % slides.length);
  }

  /**
   * Go to the previous slide
   */
  function previous() {
    goTo((selectedSlide === 0 ? slides.length : selectedSlide) - 1);
  }

  /**
   * Add the dots to the HTML page
   */
  function addDots() {
    dots.innerHTML = Array.from(slides.values()).reduce(
      (html, _, index) =>
        html + `<div class='${dotClassName}' data-slide='${index}'></div>`,
      ''
    );
  }

  // Init
  addDots();
  goTo(0);

  // Navigation events
  // By prev / next buttons
  slider
    .querySelector('.slider__btn--left')
    .addEventListener('click', previous);
  slider.querySelector('.slider__btn--right').addEventListener('click', next);
  // By arrow keyboard
  document.addEventListener('keyup', evt => {
    if (evt.key === 'ArrowLeft') previous();
    else if (evt.key === 'ArrowRight') next();
  });
  // By dots button
  slider.addEventListener(
    'click',
    utils.delegatedTargetSelectorEventListener(`.${dotClassName}`, evt =>
      goTo(parseInt(evt.target.dataset.slide))
    )
  );
})();

document.addEventListener('DOMContentLoaded', function () {
  const logo = document.querySelector('.nav__logo');
  const navLinks = document.querySelector('.nav__links');

  const toggleNavLinks = () => {
    navLinks.classList.toggle('nav__links--open');
  };

  logo.addEventListener('click', toggleNavLinks);

  window.addEventListener('resize', function () {
    if (window.innerWidth >= 1000) {
      navLinks.classList.remove('nav__links--open');
    }
  });
});
