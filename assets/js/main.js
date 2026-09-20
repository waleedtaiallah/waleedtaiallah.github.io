/**
* Template Name: MyResume - v4.7.0
* Template URL: https://bootstrapmade.com/free-html-bootstrap-template-my-resume/
* Author: BootstrapMade.com
* License: https://bootstrapmade.com/license/
*/

(function () {
  "use strict";

  /**
   * Easy selector helper function
   */
  const select = (el, all = false) => {
    el = el.trim()
    if (all) {
      return [...document.querySelectorAll(el)]
    } else {
      return document.querySelector(el)
    }
  }

  /**
   * Easy event listener function
   */
  const on = (type, el, listener, all = false) => {
    let selectEl = select(el, all)
    if (selectEl) {
      if (all) {
        selectEl.forEach(e => e.addEventListener(type, listener))
      } else {
        selectEl.addEventListener(type, listener)
      }
    }
  }

  /**
   * Easy on scroll event listener 
   */
  const onscroll = (el, listener) => {
    el.addEventListener('scroll', listener)
  }

  /**
   * Navbar links active state on scroll
   */
  let navbarlinks = select('#navbar .scrollto', true)
  const navbarlinksActive = () => {
    let position = window.scrollY + 200
    navbarlinks.forEach(navbarlink => {
      if (!navbarlink.hash) return
      let section = select(navbarlink.hash)
      if (!section) return
      if (position >= section.offsetTop && position <= (section.offsetTop + section.offsetHeight)) {
        navbarlink.classList.add('active')
      } else {
        navbarlink.classList.remove('active')
      }
    })
  }
  window.addEventListener('load', navbarlinksActive)
  onscroll(document, navbarlinksActive)

  /**
   * Scrolls to an element with header offset
   */
  const scrollto = (el) => {
    let elementPos = select(el).offsetTop
    window.scrollTo({
      top: elementPos,
      behavior: 'smooth'
    })
  }

  /**
   * Back to top button
   */
  let backtotop = select('.back-to-top')
  if (backtotop) {
    const toggleBacktotop = () => {
      if (window.scrollY > 100) {
        backtotop.classList.add('active')
      } else {
        backtotop.classList.remove('active')
      }
    }
    window.addEventListener('load', toggleBacktotop)
    onscroll(document, toggleBacktotop)
  }

  /**
   * Mobile nav toggle
   */
  on('click', '.mobile-nav-toggle', function (e) {
    select('body').classList.toggle('mobile-nav-active')
    this.classList.toggle('bi-list')
    this.classList.toggle('bi-x')
  })

  /**
   * Scrool with ofset on links with a class name .scrollto
   */
  on('click', '.scrollto', function (e) {
    if (select(this.hash)) {
      e.preventDefault()

      let body = select('body')
      if (body.classList.contains('mobile-nav-active')) {
        body.classList.remove('mobile-nav-active')
        let navbarToggle = select('.mobile-nav-toggle')
        navbarToggle.classList.toggle('bi-list')
        navbarToggle.classList.toggle('bi-x')
      }
      scrollto(this.hash)
    }
  }, true)

  /**
   * Scroll with ofset on page load with hash links in the url
   */
  window.addEventListener('load', () => {
    if (window.location.hash) {
      if (select(window.location.hash)) {
        scrollto(window.location.hash)
      }
    }
  });

  /**
   * Preloader
   */
  let preloader = select('#preloader');
  if (preloader) {
    window.addEventListener('load', () => {
      preloader.remove()
    });
  }

  /**
   * Hero type effect
   */
  const typed = select('.typed')
  if (typed) {
    let typed_strings = typed.getAttribute('data-typed-items')
    typed_strings = typed_strings.split(',')
    new Typed('.typed', {
      strings: typed_strings,
      loop: true,
      typeSpeed: 100,
      backSpeed: 50,
      backDelay: 2000
    });
  }

  /**
   * Skills animation
   */
  let skilsContent = select('.skills-content');
  if (skilsContent) {
    new Waypoint({
      element: skilsContent,
      offset: '80%',
      handler: function (direction) {
        let progress = select('.progress .progress-bar', true);
        progress.forEach((el) => {
          el.style.width = el.getAttribute('aria-valuenow') + '%'
        });
      }
    })
  }

  /**
   * Porfolio isotope and filter
   */
  window.addEventListener('load', () => {
    let portfolioContainer = select('.portfolio-container');
    if (portfolioContainer) {
      let portfolioIsotope = new Isotope(portfolioContainer, {
        itemSelector: '.portfolio-item'
      });

      let portfolioFilters = select('#portfolio-flters li', true);

      on('click', '#portfolio-flters li', function (e) {
        e.preventDefault();
        portfolioFilters.forEach(function (el) {
          el.classList.remove('filter-active');
        });
        this.classList.add('filter-active');

        portfolioIsotope.arrange({
          filter: this.getAttribute('data-filter')
        });
        portfolioIsotope.on('arrangeComplete', function () {
          AOS.refresh()
        });
      }, true);
    }

  });

  /**
   * Initiate portfolio lightbox 
   */
  const portfolioLightbox = GLightbox({
    selector: '.portfolio-lightbox'
  });

  /**
   * Initiate portfolio details lightbox 
   */
  const portfolioDetailsLightbox = GLightbox({
    selector: '.portfolio-details-lightbox',
    width: '90%',
    height: '90vh'
  });

  /**
   * Portfolio details slider
   */
  new Swiper('.portfolio-details-slider', {
    speed: 400,
    loop: true,
    autoplay: {
      delay: 15000,
      disableOnInteraction: true
    },
    pagination: {
      el: '.swiper-pagination',
      type: 'bullets',
      clickable: true
    }
  });

  /**
   * Testimonials slider
   */
  new Swiper('.testimonials-slider', {
    speed: 600,
    loop: true,
    autoplay: {
      delay: 5000,
      disableOnInteraction: false
    },
    slidesPerView: 'auto',
    pagination: {
      el: '.swiper-pagination',
      type: 'bullets',
      clickable: true
    }
  });

  /**
   * Animation on scroll
   */
  window.addEventListener('load', () => {
    AOS.init({
      duration: 1000,
      easing: 'ease-in-out',
      once: true,
      mirror: false
    })
  });

  /*** Slides ***/
var currentSlide = 0,
totalSlides  = jQuery(".tl-item").length - 1;

// Creates the navigation
jQuery(".timeline").after("<div class='tl-nav-wrapper'><ul class='tl-nav'></ul></div><label class='tl-items-arrow-left'></label><label class='tl-items-arrow-right'></label>");
jQuery( ".tl-copy" ).wrapInner( "<div class='tl-copy-inner'></div>");

// Cicle through items and creates the nav
jQuery(".tl-item").each(function(i) {
var year = jQuery(".tl-item:eq(" + i + ")" ).data("year");
jQuery(".tl-nav").append("<li><div>" + year + "</div></li>");

// Click handlers
jQuery(".tl-nav li:eq(" + i + ")").click(function() {
if(!jQuery(".tl-item:eq(" + i + ")" ).hasClass("tl-active")) {
  // Activates the item
  jQuery(".tl-item").removeClass("tl-active");
  jQuery(".tl-item:eq(" + i + ")" ).addClass("tl-active");
  currentSlide = i;

  // Activates the item nav
  jQuery(".tl-nav li").removeClass("tl-active");
  jQuery(".tl-nav li:eq(" + i + ")" ).addClass("tl-active");
}
});
});

// Activates the first slide
jQuery(".tl-item:first, .tl-nav li:first").addClass("tl-active");

// Slide's arrows click handlers
jQuery(".tl-items-arrow-left").on("click", function(){
if(currentSlide > 0) {
currentSlide--;

// Activates the previous item
jQuery(".tl-item").removeClass("tl-active");
jQuery(".tl-item:eq(" + currentSlide +")").addClass("tl-active");

// Activates the previous item nav
jQuery(".tl-nav li").removeClass("tl-active");
jQuery(".tl-nav li:eq(" + currentSlide + ")" ).addClass("tl-active");
}
});

jQuery(".tl-items-arrow-right").on("click", function(){
if(currentSlide < totalSlides) {
currentSlide++;

// Activates the next item
jQuery(".tl-item").removeClass("tl-active");
jQuery(".tl-item:eq(" + currentSlide +")").addClass("tl-active");

// Activates the next item nav
jQuery(".tl-nav li").removeClass("tl-active");
jQuery(".tl-nav li:eq(" + currentSlide + ")" ).addClass("tl-active");
}
});

/*** Nav ***/
// The nav's width
var navWidth = (jQuery(".tl-nav li").outerWidth(true) * jQuery(".tl-nav li").length) + 36;
jQuery(".tl-nav").width(navWidth);

// The nav's arrows
jQuery(".tl-nav-wrapper").append("<label class='tl-nav-arrow-left'></label><label class='tl-nav-arrow-right'></label>");

/*** The timeline's height ***/
var vpHeight  = jQuery(window).height();
var tlHeight = vpHeight - jQuery(".tl-nav-wrapper").outerHeight(true) - 26;
jQuery(".tl-wrapper").height(vpHeight);
jQuery(".tl-item").css("max-height", tlHeight);
jQuery(".tl-item").height(tlHeight);

/*** Nav's navigation... ***/
var navTranslation = 0;
var navLimit = (navWidth - jQuery(".tl-nav-wrapper").outerWidth(true) + 20) * -1;

// To the left
jQuery(".tl-nav-arrow-left").on("click", function() {
if(navTranslation < 0) {
navTranslation = navTranslation + 86;
jQuery(".tl-nav").css(prefix + "transform", "translateX(" + navTranslation + "px)");
}
});

// To the right
jQuery(".tl-nav-arrow-right").on("click", function() {
if(navTranslation >= navLimit) {
navTranslation = navTranslation - 86;
jQuery(".tl-nav").css(prefix + "transform", "translateX(" + navTranslation + "px)");
}
});

})()

