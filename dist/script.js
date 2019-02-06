"use strict";

(function () {
  var viewportHeight = 0;
  var viewportWidth = 0;
  var yOffset = 0;
  var scrollOuterWrapperElement = document.querySelector('#scroll-outer-wrapper');
  var scrollInnerWrapperElement = document.querySelector('#scroll-inner-wrapper');
  var headElement = document.querySelector('#head');
  var scalpElement = document.querySelector('#scalp');
  var scalpDetached = false;
  var scalpDetachmentTreshold = .4;
  var scalpTargetBottom = 0;
  var scalpBottom = 0;
  var scalpBottomElement = document.querySelector('#scalp-bottom');
  var scalpDetachmentTimestamp = null;
  var scalpDetachmentFaceScaleX = null;
  var scalpDetachmentFaceScaleY = null;
  var scalpDetachmentScalpScaleX = null;
  var scalpDetachmentScalpScaleY = null;
  var faceElement = document.querySelector('#face');
  var headBounceDuration = 800;
  var autoScrollToTopTimeoutDuration = 500;
  var autoScrollToTopTimeout = null;
  var eyesElement = document.querySelector('#eyes');
  var eyebrowLeftElement = document.querySelector('#eye-left .eyebrow');
  var eyebrowRightElement = document.querySelector('#eye-right .eyebrow');
  var eyelidLeftElement = document.querySelector('#eye-left .eyelid');
  var eyelidRightElement = document.querySelector('#eye-right .eyelid');
  var contentElement = document.querySelector('#content');
  var contentOffset = 0;
  var contentTargetOffset = 0;
  var contentPartsElements = document.querySelectorAll('#intro, #outro, .project');
  var projectElements = document.querySelectorAll('.project');
  var projectTriggerElements = document.querySelectorAll('.project .image-container > a');
  var floatingTextElements = document.querySelectorAll('.project > .title');
  var maxProjectMovementOffset = 30;
  var minProjectMovementDuration = 2000;
  var maxProjectMovementDuration = 3000;
  var emotionalState = 'bored'; // startled, horrified

  var activeProject = null;
  var previousTimestamp = performance.now();
  var adjustedTimestamp = previousTimestamp;
  var scrollListenerTarget = scrollOuterWrapperElement;
  var scrollElement = scrollOuterWrapperElement;
  var cssPointerEventsSupported = testCssPointerEventsSupport();

  if (!cssPointerEventsSupported) {
    document.documentElement.className += ' no-css-pointer-events-support';
    scrollListenerTarget = window;
    scrollElement = document.documentElement;
  }

  var isSafari = testIfSafari();

  if (isSafari) {
    document.documentElement.className += ' no-displacement-map-support';
  }

  var even = true;
  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = projectElements[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var projectElement = _step.value;
      projectElement._active = false;
      projectElement._transitioning = false;
      projectElement._targetOffsetX = (.3 + Math.random() * .4) * (even ? -1 : 1);
      projectElement._targetOffsetXMultiplier = 1;
      even = !even;
    }
  } catch (err) {
    _didIteratorError = true;
    _iteratorError = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion && _iterator.return != null) {
        _iterator.return();
      }
    } finally {
      if (_didIteratorError) {
        throw _iteratorError;
      }
    }
  }

  var _iteratorNormalCompletion2 = true;
  var _didIteratorError2 = false;
  var _iteratorError2 = undefined;

  try {
    for (var _iterator2 = projectTriggerElements[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
      var projectTriggerElement = _step2.value;
      projectTriggerElement.addEventListener('click', projectClickHandler);
    }
  } catch (err) {
    _didIteratorError2 = true;
    _iteratorError2 = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion2 && _iterator2.return != null) {
        _iterator2.return();
      }
    } finally {
      if (_didIteratorError2) {
        throw _iteratorError2;
      }
    }
  }

  var _iteratorNormalCompletion3 = true;
  var _didIteratorError3 = false;
  var _iteratorError3 = undefined;

  try {
    for (var _iterator3 = floatingTextElements[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
      var floatingTextElement = _step3.value;
      floatingTextElement._originX = -maxProjectMovementOffset + Math.random() * 2 * maxProjectMovementOffset;
      floatingTextElement._originY = -maxProjectMovementOffset + Math.random() * 2 * maxProjectMovementOffset;
      floatingTextElement._targetX = -maxProjectMovementOffset + Math.random() * 2 * maxProjectMovementOffset;
      floatingTextElement._targetY = -maxProjectMovementOffset + Math.random() * 2 * maxProjectMovementOffset;
      floatingTextElement._movementDurationX = minProjectMovementDuration + Math.random() * (maxProjectMovementDuration - minProjectMovementDuration);
      floatingTextElement._movementDurationY = minProjectMovementDuration + Math.random() * (maxProjectMovementDuration - minProjectMovementDuration);
      floatingTextElement._movementStartTimestampX = Math.random() * floatingTextElement._movementDurationX;
      floatingTextElement._movementStartTimestampY = Math.random() * floatingTextElement._movementDurationY;
    }
  } catch (err) {
    _didIteratorError3 = true;
    _iteratorError3 = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion3 && _iterator3.return != null) {
        _iterator3.return();
      }
    } finally {
      if (_didIteratorError3) {
        throw _iteratorError3;
      }
    }
  }

  function resizeHandler(e) {
    viewportWidth = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
    viewportHeight = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
    var vmin = Math.min(viewportWidth, viewportHeight) * .01;
    document.documentElement.style.setProperty('--vmin', vmin + 'px');
    var vh = viewportHeight * .01;
    document.documentElement.style.setProperty('--vh', vh + 'px');
    document.documentElement.style.height = document.body.style.height = scrollOuterWrapperElement.style.height = window.innerHeight + "px";
    scrollInnerWrapperElement.style.height = contentElement.offsetHeight + 'px';
    scrollToActiveProject();
  }

  window.addEventListener('resize', resizeHandler);
  resizeHandler();

  function scrollHandler(e) {
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
        var scalpBoundingClientRect = scalpElement.getBoundingClientRect();
        var faceBoundingClientRect = faceElement.getBoundingClientRect();
        scalpDetachmentScalpScaleX = scalpBoundingClientRect.width / scalpElement.clientWidth;
        scalpDetachmentScalpScaleY = scalpBoundingClientRect.height / scalpElement.clientHeight;
        scalpDetachmentFaceScaleX = faceBoundingClientRect.width / faceElement.clientWidth;
        scalpDetachmentFaceScaleY = faceBoundingClientRect.height / faceElement.clientHeight;
        scalpDetached = true;
        document.body.setAttribute('data-detached', 'true');
      }

      scalpTargetBottom = yOffset;
    }

    contentTargetOffset = yOffset;
  }

  scrollListenerTarget.addEventListener('scroll', scrollHandler);
  scrollHandler();

  function scrollToTop() {
    window.clearTimeout(autoScrollToTopTimeout);
    scrollElement.scrollTop = 0;
  }

  function tickHandler(timestamp) {
    adjustedTimestamp += Math.min(timestamp - previousTimestamp, 50);
    scalpBottom = (scalpBottom * 8 + scalpTargetBottom) / 9;

    if (scalpBottom <= viewportHeight) {
      scalpElement.style.transform = 'translate3d(0px, ' + scalpBottom * -1 + 'px, 0px)';

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
      var scaleY = (faceElement.clientHeight + scalpBottom) / faceElement.clientHeight;
      faceElement.style.transform = 'scale(' + (5 + 1 / scaleY) / 6 + ', ' + scaleY + ')';
      eyesElement.style.transform = 'scaleY(' + Math.pow(1 / scaleY, .4) + ')';
      scalpElement.style.transform += ' scale(' + (5 + 1 / scaleY) / 6 + ', ' + (12 + scaleY) / 13 + ')';
      scalpBottomElement.style.transform = 'translate3d(0px, 50%, 0px) scaleY(0)';
    } else {
      if (adjustedTimestamp - scalpDetachmentTimestamp <= headBounceDuration) {
        var easeFactor = calculateEaseFactor('easeOutElastic', (adjustedTimestamp - scalpDetachmentTimestamp) / headBounceDuration);
        faceElement.style.transform = 'scale(' + (scalpDetachmentFaceScaleX - (scalpDetachmentFaceScaleX - 1) * easeFactor) + ', ' + (scalpDetachmentFaceScaleY - (scalpDetachmentFaceScaleY - 1) * easeFactor) + ')';
        eyesElement.style.transform = 'scaleY(' + Math.pow(1 / (scalpDetachmentFaceScaleY - (scalpDetachmentFaceScaleY - 1) * easeFactor), .4) + ')';
        scalpElement.style.transform += ' scale(' + (scalpDetachmentScalpScaleX - (scalpDetachmentScalpScaleX - 1) * easeFactor) + ', ' + (scalpDetachmentScalpScaleY - (scalpDetachmentScalpScaleY - 1) * easeFactor) + ')';
      }

      scalpBottomElement.style.transform = 'translate3d(0px, 50%, 0px) scaleY(' + Math.min(scalpBottom / viewportHeight, 1) + ')';
    }

    var _iteratorNormalCompletion4 = true;
    var _didIteratorError4 = false;
    var _iteratorError4 = undefined;

    try {
      for (var _iterator4 = floatingTextElements[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
        var floatingTextElement = _step4.value;
        var easeFactorX = calculateEaseFactor('easeInOutQuad', (adjustedTimestamp - floatingTextElement._movementStartTimestampX) / floatingTextElement._movementDurationX);
        var targetX = floatingTextElement._originX - (floatingTextElement._originX - floatingTextElement._targetX) * easeFactorX;

        if (adjustedTimestamp >= floatingTextElement._movementStartTimestampX + floatingTextElement._movementDurationX) {
          floatingTextElement._originX = targetX;
          floatingTextElement._targetX = Math.random() * maxProjectMovementOffset * (floatingTextElement._targetX > 0 ? -1 : 1);
          floatingTextElement._movementDurationX = minProjectMovementDuration + Math.random() * (maxProjectMovementDuration - minProjectMovementDuration);
          floatingTextElement._movementStartTimestampX = adjustedTimestamp;
        }

        var easeFactorY = calculateEaseFactor('easeInOutQuad', (adjustedTimestamp - floatingTextElement._movementStartTimestampY) / floatingTextElement._movementDurationY);
        var targetY = floatingTextElement._originY - (floatingTextElement._originY - floatingTextElement._targetY) * easeFactorY;

        if (adjustedTimestamp >= floatingTextElement._movementStartTimestampY + floatingTextElement._movementDurationY) {
          floatingTextElement._originY = targetY;
          floatingTextElement._targetY = Math.random() * maxProjectMovementOffset * (floatingTextElement._targetY > 0 ? -1 : 1);
          floatingTextElement._movementDurationY = minProjectMovementDuration + Math.random() * (maxProjectMovementDuration - minProjectMovementDuration);
          floatingTextElement._movementStartTimestampY = adjustedTimestamp;
        }

        floatingTextElement.style.transform = 'translate3d(' + targetX + 'px, ' + targetY + 'px, 0px)';
      }
    } catch (err) {
      _didIteratorError4 = true;
      _iteratorError4 = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion4 && _iterator4.return != null) {
          _iterator4.return();
        }
      } finally {
        if (_didIteratorError4) {
          throw _iteratorError4;
        }
      }
    }

    var _iteratorNormalCompletion5 = true;
    var _didIteratorError5 = false;
    var _iteratorError5 = undefined;

    try {
      for (var _iterator5 = projectElements[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
        var projectElement = _step5.value;
        if (projectElement._active && projectElement._targetOffsetXMultiplier > 0.01) projectElement._targetOffsetXMultiplier = projectElement._targetOffsetXMultiplier * .75;
        if (!projectElement._active && !projectElement._transitioning && projectElement._targetOffsetXMultiplier < 0.99) projectElement._targetOffsetXMultiplier = (projectElement._targetOffsetXMultiplier * 3 + 1) / 4;
        var projectBoundingClientRect = projectElement.getBoundingClientRect();
        var verticalPositionRelativeToViewport = Math.max(0, Math.min(viewportHeight, projectBoundingClientRect.bottom + .2 * viewportHeight)) / viewportHeight;
        projectElement.style.transform = 'translate3d(' + projectElement._targetOffsetX * projectElement._targetOffsetXMultiplier * 100 * (1 - verticalPositionRelativeToViewport) * calculateEaseFactor('easeInQuad', 1 - verticalPositionRelativeToViewport) + 'vw, 0px, 0px)';
      }
    } catch (err) {
      _didIteratorError5 = true;
      _iteratorError5 = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion5 && _iterator5.return != null) {
          _iterator5.return();
        }
      } finally {
        if (_didIteratorError5) {
          throw _iteratorError5;
        }
      }
    }

    contentOffset = (contentOffset * 9 + contentTargetOffset) / 10;
    if (contentOffset < 0.1) contentOffset = 0;
    contentElement.style.transform = 'translate3d(0px, ' + contentOffset * -1 + 'px, 0px)';
    var _iteratorNormalCompletion6 = true;
    var _didIteratorError6 = false;
    var _iteratorError6 = undefined;

    try {
      for (var _iterator6 = contentPartsElements[Symbol.iterator](), _step6; !(_iteratorNormalCompletion6 = (_step6 = _iterator6.next()).done); _iteratorNormalCompletion6 = true) {
        var contentPartsElement = _step6.value;
        var inViewport = isInViewport(contentPartsElement, true);

        if (inViewport && (typeof contentPartsElement._inViewport === 'undefined' || !contentPartsElement._inViewport)) {
          contentPartsElement._inViewport = true;
          contentPartsElement.setAttribute('data-in-viewport', 'true');
        } else if (!inViewport && (typeof contentPartsElement._inViewport === 'undefined' || contentPartsElement._inViewport)) {
          contentPartsElement._inViewport = false;
          contentPartsElement.setAttribute('data-in-viewport', 'false');
        }
      }
    } catch (err) {
      _didIteratorError6 = true;
      _iteratorError6 = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion6 && _iterator6.return != null) {
          _iterator6.return();
        }
      } finally {
        if (_didIteratorError6) {
          throw _iteratorError6;
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
    var project = e.target.closest('.project');
    var currentlyActive = project.getAttribute('data-active');

    if (!currentlyActive || currentlyActive == 'false') {
      activateProject(project);
    } else {
      deactivateProject(project);
    }
  }

  function activateProject(project) {
    activeProject = project;
    if (typeof project._transitioningTimeout !== 'undefined' && project._transitioningTimeout) window.clearTimeout(project._transitioningTimeout);
    scrollToActiveProject();
    project._active = true;
    project._transitioning = true;
    project.setAttribute('data-transitioning', 'true');
    project._transitioningTimeout = window.setTimeout(function () {
      project.setAttribute('data-active', 'true');
    }, 20);
    document.body.setAttribute('data-project-active', 'true');
    document.body.setAttribute('data-project-transitioning', 'true');
    project.querySelector('.description__inner').scrollTop = 0;
    document.addEventListener('click', clickWhenProjectActiveHandler);
  }

  function scrollToActiveProject() {
    if (activeProject) scrollElement.scrollTop = activeProject.offsetTop - Math.min(viewportWidth, viewportHeight) * .23;
  }

  function deactivateProject(project) {
    activeProject = null;
    project._active = false;
    project.setAttribute('data-active', 'false');
    project._transitioningTimeout = window.setTimeout(function () {
      project._transitioning = false;
      project.setAttribute('data-transitioning', 'false');
      document.body.setAttribute('data-project-transitioning', 'false');
    }, 400);
    document.body.setAttribute('data-project-active', 'false');
    document.removeEventListener('click', clickWhenProjectActiveHandler);
  }

  function clickWhenProjectActiveHandler(e) {
    if (activeProject && e.target && typeof e.target.id !== 'undefined' && e.target.id == 'scroll-outer-wrapper') {
      deactivateProject(activeProject);
    }
  }

  function calculateEaseFactor(type, progress) {
    switch (type) {
      case 'easeOutElastic':
        var s,
            a = 1.5,
            p = 0.3;
        if (progress === 0) return 0;
        if (progress === 1) return 1;

        if (!a || a < 1) {
          a = 1;
          s = p / 4;
        } else s = p * Math.asin(1 / a) / (2 * Math.PI);

        return a * Math.pow(2, -10 * progress) * Math.sin((progress - s) * (2 * Math.PI) / p) + 1;

      case 'easeInQuad':
        return progress * progress;

      case 'easeOutQuad':
        return progress * (2 - progress);

      case 'easeInOutQuad':
        return progress < .5 ? 2 * progress * progress : -1 + (4 - 2 * progress) * progress;
    }
  }

  function isInViewport(elem, debug) {
    var bounding = elem.getBoundingClientRect();
    return bounding.top <= viewportHeight && bounding.top >= -bounding.height;
  }

  ;
  /**
   * Tests
   */

  function testCssPointerEventsSupport() {
    var style = document.createElement('a').style;
    style.cssText = 'pointer-events:auto';
    return style.pointerEvents === 'auto';
  }

  function testIfSafari() {
    return navigator.userAgent.indexOf('Safari') != -1 && navigator.userAgent.indexOf('Chrome') == -1 && navigator.userAgent.indexOf('Opera') == -1;
  }
  /**
   * Polyfills
   */


  if (!Element.prototype.matches) {
    Element.prototype.matches = Element.prototype.msMatchesSelector || Element.prototype.webkitMatchesSelector;
  }

  if (!Element.prototype.closest) {
    Element.prototype.closest = function (s) {
      var el = this;

      do {
        if (el.matches(s)) return el;
        el = el.parentElement || el.parentNode;
      } while (el !== null && el.nodeType === 1);

      return null;
    };
  }
})();