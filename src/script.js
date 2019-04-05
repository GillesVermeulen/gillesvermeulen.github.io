"use strict";

(function(){

  let viewportHeight = 0;
  let viewportWidth = 0;

  let yOffset = 0;

  const scrollOuterWrapperElement = document.querySelector('#scroll-outer-wrapper');
  const scrollInnerWrapperElement = document.querySelector('#scroll-inner-wrapper');

  const headElement = document.querySelector('#head');

  const scalpElement = document.querySelector('#scalp');
  let scalpDetached = false;
  const scalpDetachmentTreshold = .4;
  let scalpTargetBottom = 0;
  let scalpBottom = 0;

  const scalpBottomElement = document.querySelector('#scalp-bottom');

  let scalpDetachmentTimestamp = null;
  let scalpDetachmentFaceScaleX = null;
  let scalpDetachmentFaceScaleY = null;
  let scalpDetachmentScalpScaleX = null;
  let scalpDetachmentScalpScaleY = null;

  const faceElement = document.querySelector('#face');

  const headBounceDuration = 800;
  const autoScrollToTopTimeoutDuration = 500;
  let autoScrollToTopTimeout = null;

  const eyesElement = document.querySelector('#eyes');

  const contentElement = document.querySelector('#content');
  let contentOffset = 0;
  let contentTargetOffset = 0;

  const contentPartsElements = document.querySelectorAll('#intro, #outro, .project');
  const numberOfContentPartsElements = contentPartsElements.length;
  const projectElements = document.querySelectorAll('.project');
  const numberOfProjectElements = projectElements.length;
  const projectTriggerElements = document.querySelectorAll('.project .image-container > a');
  const numberOfProjectTriggerElements = projectTriggerElements.length;
  const floatingTextElements = document.querySelectorAll('.project > .title');
  const numberOfFloatingTextElements = floatingTextElements.length;
  const maxProjectMovementOffset = 30;
  const minProjectMovementDuration = 2000;
  const maxProjectMovementDuration = 3000;

  let emotionalState = 'bored'; // startled, horrified

  let activeProject = null;

  let previousTimestamp = performance.now();
  let adjustedTimestamp = previousTimestamp;

  let scrollListenerTarget = scrollOuterWrapperElement;
  let scrollElement = scrollOuterWrapperElement;
  let hasScrolled = true;

  let isDraggingProject = false;
  let draggingProjectTresholdExceeded = false;
  let draggingProjectInitialClientY = 0;
  let draggingProjectInitialScrollTop = 0;

  let wheelTimeout = null;
  let wheelTimeoutDuration = 100;

  let displacementMapSupported = true;

  const passiveSupported = testPassiveSupport();
  const wheelEvent = "onwheel" in document.createElement("div") ? "wheel" :
              document.onmousewheel !== undefined ? "mousewheel" :
              "DOMMouseScroll";

  const cssPointerEventsSupported = testCssPointerEventsSupport();
  if (!cssPointerEventsSupported) {
    document.documentElement.className += ' no-css-pointer-events-support';
    scrollListenerTarget = window;
    scrollElement = document.documentElement;
  }

  const isSafari = testIfSafari();
  const isAndroidFirefox = testIfAndroidFirefox();
  if (isSafari || isAndroidFirefox) {
    displacementMapSupported = false;
  }

  if (!displacementMapSupported) {
    document.documentElement.className += ' no-displacement-map-support';
  }

  let even = true;
  for (let i = 0; i < numberOfProjectElements; i++) {
    let projectElement = projectElements[i];
    projectElement._active = false;
    projectElement._transitioning = false;
    projectElement._targetOffsetX = (.3 + (Math.random() * .4)) * (even ? -1 : 1);
    projectElement._targetOffsetXMultiplier = 1;
    even = !even;
  }

  for (let i = 0; i < numberOfProjectTriggerElements; i++) {
    projectTriggerElements[i].addEventListener('click', projectClickHandler);
    projectTriggerElements[i].addEventListener(wheelEvent, projectWheelHandler, (wheelEvent == 'wheel' && passiveSupported) ? { passive: true } : false);
    projectTriggerElements[i].addEventListener('pointerdown', projectPointerDownHandler, passiveSupported ? { passive: true } : false);
  }

  document.addEventListener('pointermove', documentPointerMoveHandler, passiveSupported ? { passive: true } : false);
  document.addEventListener('pointerup', documentPointerUpHandler, passiveSupported ? { passive: true } : false);
  document.addEventListener('pointerleave', documentPointerUpHandler, passiveSupported ? { passive: true } : false);
  
  for (let i = 0; i < numberOfFloatingTextElements; i++) {
    let floatingTextElement = floatingTextElements[i];
    floatingTextElement._originX = -maxProjectMovementOffset + Math.random() * 2 * maxProjectMovementOffset;
    floatingTextElement._originY = -maxProjectMovementOffset + Math.random() * 2 * maxProjectMovementOffset;
    floatingTextElement._targetX = -maxProjectMovementOffset + Math.random() * 2 * maxProjectMovementOffset;
    floatingTextElement._targetY = -maxProjectMovementOffset + Math.random() * 2 * maxProjectMovementOffset;
    floatingTextElement._movementDurationX = minProjectMovementDuration + Math.random() * (maxProjectMovementDuration - minProjectMovementDuration);
    floatingTextElement._movementDurationY = minProjectMovementDuration + Math.random() * (maxProjectMovementDuration - minProjectMovementDuration);
    floatingTextElement._movementStartTimestampX = Math.random() * floatingTextElement._movementDurationX;
    floatingTextElement._movementStartTimestampY = Math.random() * floatingTextElement._movementDurationY;
  }

  const intersectionObserverSupported = testIntersectionObserverSupport();
  if (displacementMapSupported && intersectionObserverSupported) {
    let options = {
      root: null,
      rootMargin: '0px',
      threshold: 0.2
    };

    let observer = new IntersectionObserver(function(changes, observer) {
      let numberOfChanges = changes.length;
      for (let i = 0; i < numberOfChanges; i++) {
        if (changes[i].intersectionRatio > 0) {
          changes[i].target._inViewport = true;
          changes[i].target.setAttribute('data-in-viewport', 'true');
        } else {
          changes[i].target._inViewport = false;
          changes[i].target.setAttribute('data-in-viewport', 'false');
        }
      }
    }, options);

    for (let i = 0; i < numberOfContentPartsElements; i++) {
      observer.observe(contentPartsElements[i]);
    }
  }

  function resizeHandler(e) {
    viewportWidth = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
    viewportHeight = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);

    let vmin = Math.min(viewportWidth, viewportHeight) * .01;
    document.documentElement.style.setProperty('--vmin', vmin +'px');

    let vh = viewportHeight * .01;
    document.documentElement.style.setProperty('--vh', vh +'px');

    document.documentElement.style.height = document.body.style.height = scrollOuterWrapperElement.style.height = (viewportHeight - 1) + "px";
    scrollInnerWrapperElement.style.height = contentElement.offsetHeight + 'px';

    scrollToActiveProject();
  }
  window.addEventListener('resize', resizeHandler);
  resizeHandler();

  function scrollHandler(e) {
    hasScrolled = true;
  }
  scrollListenerTarget.addEventListener('scroll', scrollHandler);
  scrollHandler();

  function scrollToTop() {
    window.clearTimeout(autoScrollToTopTimeout);
    scrollElement.scrollTop = 0;
  }

  function tickHandler(timestamp) {
    adjustedTimestamp += Math.min(timestamp - previousTimestamp, 50);

    if (hasScrolled) {
      hasScrolled = false;

      yOffset = scrollElement.scrollTop;

      if (!scalpDetached && yOffset < scalpDetachmentTreshold * viewportHeight) {
        scalpTargetBottom = yOffset * (scalpDetachmentTreshold * viewportHeight - yOffset * .5) / (scalpDetachmentTreshold * viewportHeight);
        if (yOffset != 0) {
          switchToEmotionalState('startled');

          window.clearTimeout(autoScrollToTopTimeout);
          autoScrollToTopTimeout = window.setTimeout(scrollToTop, autoScrollToTopTimeoutDuration);
        } else {
          switchToEmotionalState('bored');
        }
      } else {
        if (!scalpDetached) {
          switchToEmotionalState('horrified');

          window.clearTimeout(autoScrollToTopTimeout);
          scalpDetachmentTimestamp = adjustedTimestamp;
          let scalpBoundingClientRect = scalpElement.getBoundingClientRect();
          let faceBoundingClientRect  = faceElement.getBoundingClientRect();
          scalpDetachmentScalpScaleX  = scalpBoundingClientRect.width  / scalpElement.clientWidth;
          scalpDetachmentScalpScaleY  = scalpBoundingClientRect.height / scalpElement.clientHeight;
          scalpDetachmentFaceScaleX   = faceBoundingClientRect.width   / faceElement.clientWidth;
          scalpDetachmentFaceScaleY   = faceBoundingClientRect.height  / faceElement.clientHeight;
          scalpDetached = true;
          document.body.setAttribute('data-detached', 'true');
        }
        scalpTargetBottom = yOffset;
      }

      contentTargetOffset = yOffset;
    }

    scalpBottom = ((scalpBottom * 6 + scalpTargetBottom) / 7);
    
    if (scalpBottom <= viewportHeight) {    
      scalpElement.style.transform = 'translate3d(0px, '+ (scalpBottom * -1) +'px, 0px)';

      if (scalpElement.style.display != 'block') {
        scalpElement.style.display = 'block';
      }
    } else if (scalpElement.style.display != 'none') {
      scalpElement.style.display = 'none';
    }

    if (scalpBottom <= 1 && scalpDetached) {
      switchToEmotionalState('bored');
      document.body.setAttribute('data-detached', 'false');
      scalpDetached = false;
    }
    
    if (!scalpDetached) {
      let scaleY = (faceElement.clientHeight + scalpBottom) / faceElement.clientHeight;
      faceElement.style.transform = 'scale('+ ((5 + (1 / scaleY)) / 6) +', '+ scaleY +')';
      eyesElement.style.transform = 'scaleY('+ Math.pow(1 / scaleY, .4) +')';
      scalpElement.style.transform += ' scale('+ ((5 + (1 / scaleY)) / 6) +', '+ ((12 + scaleY) / 13) +')';
      scalpBottomElement.style.transform = 'translate3d(0px, 50%, 0px) scaleY(0)';
    } else {
      if (adjustedTimestamp - scalpDetachmentTimestamp <= headBounceDuration) {
        let easeFactor = calculateEaseFactor('easeOutElastic', (adjustedTimestamp - scalpDetachmentTimestamp) / headBounceDuration);
        
        faceElement.style.transform = 'scale('+ (scalpDetachmentFaceScaleX - ((scalpDetachmentFaceScaleX - 1) * easeFactor)) +', '+ (scalpDetachmentFaceScaleY - ((scalpDetachmentFaceScaleY - 1) * easeFactor)) +')';
        eyesElement.style.transform = 'scaleY('+ Math.pow(1 / (scalpDetachmentFaceScaleY - ((scalpDetachmentFaceScaleY - 1) * easeFactor)), .4) +')';
        scalpElement.style.transform += ' scale('+ (scalpDetachmentScalpScaleX - ((scalpDetachmentScalpScaleX - 1) * easeFactor)) +', '+ (scalpDetachmentScalpScaleY - ((scalpDetachmentScalpScaleY - 1) * easeFactor)) +')';
      }

      scalpBottomElement.style.transform = 'translate3d(0px, 50%, 0px) scaleY('+ Math.min(scalpBottom / viewportHeight, 1) +')';
    }

    for (let i = 0; i < numberOfFloatingTextElements; i++) {
      let floatingTextElement = floatingTextElements[i];
      let easeFactorX = calculateEaseFactor('easeInOutQuad', (adjustedTimestamp - floatingTextElement._movementStartTimestampX) / floatingTextElement._movementDurationX);
      let targetX = floatingTextElement._originX - ((floatingTextElement._originX - floatingTextElement._targetX) * easeFactorX);
      if (adjustedTimestamp >= floatingTextElement._movementStartTimestampX + floatingTextElement._movementDurationX) {
        floatingTextElement._originX = targetX;
        floatingTextElement._targetX = Math.random() * maxProjectMovementOffset * (floatingTextElement._targetX > 0 ? -1 : 1);
        floatingTextElement._movementDurationX = minProjectMovementDuration + Math.random() * (maxProjectMovementDuration - minProjectMovementDuration);
        floatingTextElement._movementStartTimestampX = adjustedTimestamp;
      }

      let easeFactorY = calculateEaseFactor('easeInOutQuad', (adjustedTimestamp - floatingTextElement._movementStartTimestampY) / floatingTextElement._movementDurationY);
      let targetY = floatingTextElement._originY - ((floatingTextElement._originY - floatingTextElement._targetY) * easeFactorY);
      if (adjustedTimestamp >= floatingTextElement._movementStartTimestampY + floatingTextElement._movementDurationY) {
        floatingTextElement._originY = targetY;
        floatingTextElement._targetY = Math.random() * maxProjectMovementOffset * (floatingTextElement._targetY > 0 ? -1 : 1);
        floatingTextElement._movementDurationY = minProjectMovementDuration + Math.random() * (maxProjectMovementDuration - minProjectMovementDuration);
        floatingTextElement._movementStartTimestampY = adjustedTimestamp;
      }

      floatingTextElement.style.transform = 'translate3d('+ targetX +'px, '+ targetY +'px, 0px)';
    }

    for (let i = 0; i < numberOfProjectElements; i++) {
      let projectElement = projectElements[i];
      if (typeof projectElement._inViewport === 'undefined' || projectElement._inViewport) {
        if (projectElement._active && projectElement._targetOffsetXMultiplier > 0.01) projectElement._targetOffsetXMultiplier = projectElement._targetOffsetXMultiplier * .75; 
        if (!projectElement._active && !projectElement._transitioning && projectElement._targetOffsetXMultiplier < 0.99) projectElement._targetOffsetXMultiplier = (projectElement._targetOffsetXMultiplier * 3 + 1) / 4;
        let projectBoundingClientRect = projectElement.getBoundingClientRect();
        let verticalPositionRelativeToViewport = Math.max(0, Math.min(viewportHeight, projectBoundingClientRect.bottom + .2 * viewportHeight)) / viewportHeight;
        projectElement.style.transform = 'translate3d('+ (projectElement._targetOffsetX * projectElement._targetOffsetXMultiplier * 100 * (1 - verticalPositionRelativeToViewport) * calculateEaseFactor('easeInQuad', (1 - verticalPositionRelativeToViewport))) +'vw, 0px, 0px)';
      }
    }

    contentOffset = (contentOffset * 6 + contentTargetOffset) / 7;
    if (contentOffset < 0.1) contentOffset = 0;
    contentElement.style.transform = 'translate3d(0px, '+ (contentOffset * -1) +'px, 0px)';

    if (displacementMapSupported && !intersectionObserverSupported) {
      for (let i = 0; i < numberOfContentPartsElements; i++) {
        let contentPartsElement = contentPartsElements[i];
        let inViewport = isInViewport(contentPartsElement, true);
        if (inViewport && (typeof contentPartsElement._inViewport === 'undefined' || !contentPartsElement._inViewport)) {
          contentPartsElement._inViewport = true;
          contentPartsElement.setAttribute('data-in-viewport', 'true');
        } else if (!inViewport && (typeof contentPartsElement._inViewport === 'undefined' || contentPartsElement._inViewport)) {
          contentPartsElement._inViewport = false;
          contentPartsElement.setAttribute('data-in-viewport', 'false');
        }
      }
    }

    previousTimestamp = timestamp;

    window.requestAnimationFrame(tickHandler);
  }
  window.requestAnimationFrame(tickHandler);

  function switchToEmotionalState(state, force) {
    if (state != emotionalState || force) {
      headElement.setAttribute('data-emotional-state', state);

      emotionalState = state;
    }
  }

  function projectClickHandler(e) {
    e.preventDefault();

    if (draggingProjectTresholdExceeded) return false;

    let project = e.target.closest('.project');
    let currentlyActive = project.getAttribute('data-active');

    if (!currentlyActive || currentlyActive == 'false') {
      activateProject(project);
    } else {
      deactivateProject(project);
    }
  }

  function projectWheelHandler(e) {
    if (wheelTimeout !== null) {
      return false;
    }

    let delta = e.detail ? e.detail * (-120) : (
      e.wheelDelta ? e.wheelDelta : (
      e.deltaY ? (e.deltaY * 1) * (-120) : 0
    ));

    scrollElement.scrollTop -= (delta >= 0 ? 1 : -1) * viewportHeight * .2;
    wheelTimeout = setTimeout(function(){ wheelTimeout = null; }, wheelTimeoutDuration);
    return false;
  }

  function projectPointerDownHandler(e) {
    if (!activeProject) {
      isDraggingProject = true;
      draggingProjectTresholdExceeded = false;
      draggingProjectInitialClientY = e.clientY;
      draggingProjectInitialScrollTop = scrollElement.scrollTop;
    }
  }

  function documentPointerMoveHandler(e) {
    if (isDraggingProject) {
      scrollElement.scrollTop = draggingProjectInitialScrollTop + (draggingProjectInitialClientY - e.clientY);

      if (!draggingProjectTresholdExceeded && Math.abs(draggingProjectInitialClientY - e.clientY) > 10) {
        draggingProjectTresholdExceeded = true;
        document.body.setAttribute('data-project-dragging', 'true');
      }
    }
  }

  function documentPointerUpHandler(e) {
    isDraggingProject = false;
    document.body.setAttribute('data-project-dragging', 'false');
  }

  function activateProject(project) {
    activeProject = project;

    if (typeof project._transitioningTimeout !== 'undefined' && project._transitioningTimeout) window.clearTimeout(project._transitioningTimeout);

    scrollToActiveProject();

    project._active = true;
    project._transitioning = true;
    project.setAttribute('data-transitioning', 'true');
    project._transitioningTimeout = window.setTimeout(function() {
      project.setAttribute('data-active', 'true');
    }, 20);  
    document.body.setAttribute('data-project-active', 'true');
    document.body.setAttribute('data-project-transitioning', 'true');

    project.querySelector('.description__inner').scrollTop = 0;

    scrollOuterWrapperElement.addEventListener('click', clickWhenProjectActiveHandler);
  }

  function scrollToActiveProject() {
    if (activeProject) scrollElement.scrollTop = activeProject.offsetTop - Math.min(viewportWidth, viewportHeight) * .23;
  }

  function deactivateProject(project) {
    activeProject = null;

    project._active = false;
    project.setAttribute('data-active', 'false');
    project._transitioningTimeout = window.setTimeout(function() {
      project._transitioning = false;
      project.setAttribute('data-transitioning', 'false');
      document.body.setAttribute('data-project-transitioning', 'false');
    }, 400);
    document.body.setAttribute('data-project-active', 'false');

    scrollOuterWrapperElement.removeEventListener('click', clickWhenProjectActiveHandler);
  }

  function clickWhenProjectActiveHandler(e) {
    if (activeProject && e.target && typeof e.target.id !== 'undefined' && e.target.id == 'scroll-outer-wrapper') {
      deactivateProject(activeProject);
    }
  }

  function calculateEaseFactor(type, progress) {
    switch (type) {
      case 'easeOutElastic':
        let s, a = 1.5, p = 0.3;
        if ( progress === 0 ) return 0;
        if ( progress === 1 ) return 1;
        if ( !a || a < 1 ) { a = 1; s = p / 4; }
        else s = p * Math.asin( 1 / a ) / ( 2 * Math.PI );
        return ( a * Math.pow( 2, - 10 * progress) * Math.sin( ( progress - s ) * ( 2 * Math.PI ) / p ) + 1 );
      case 'easeInQuad':
        return progress * progress;
      case 'easeOutQuad':
        return progress * (2 - progress);
      case 'easeInOutQuad':
        return progress < .5 ? (2 * progress * progress) : (-1 + (4 - (2 * progress)) * progress);
    } 
  }

  function isInViewport(elem, debug) {
    let bounding = elem.getBoundingClientRect();
    return (bounding.top <= viewportHeight && bounding.top >= -bounding.height);
  };


  /**
   * Tests
   */

  function testCssPointerEventsSupport() {
    let style = document.createElement('a').style;
    style.cssText = 'pointer-events:auto';
    return style.pointerEvents === 'auto';
  }

  function testIntersectionObserverSupport() {
    return ('IntersectionObserver' in window);
  }

  function testPassiveSupport() {
    let passiveSupported = false;
    try {
      let opts = Object.defineProperty({}, 'passive', {
        get: function() {
          passiveSupported = true;
        }
      });
      window.addEventListener("testPassive", null, opts);
      window.removeEventListener("testPassive", null, opts);
    } catch (e) {}

    return passiveSupported;
  }

  function testIfSafari() {
    return (navigator.userAgent.indexOf('Safari') != -1 && navigator.userAgent.indexOf('Chrome') == -1 && navigator.userAgent.indexOf('Opera') == -1);
  }

  function testIfAndroidFirefox() {
    let agent = navigator.userAgent.toLowerCase();
    return (agent.indexOf('firefox') >= 0 && agent.indexOf("android") >= 0);
  }

  /**
   * Polyfills
   */

  if (!Element.prototype.matches) {
    Element.prototype.matches = Element.prototype.msMatchesSelector || 
                                Element.prototype.webkitMatchesSelector;
  }

  if (!Element.prototype.closest) {
    Element.prototype.closest = function(s) {
      var el = this;

      do {
        if (el.matches(s)) return el;
        el = el.parentElement || el.parentNode;
      } while (el !== null && el.nodeType === 1);
      return null;
    };
  }

}());