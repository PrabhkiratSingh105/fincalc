const MOBILE_RANGE_HOLD_MS = 2000;
const THUMB_HIT_RADIUS_PX = 22;
const attached = new WeakSet();

export function isMobileRangeContext() {
  return window.matchMedia('(pointer: coarse)').matches || window.innerWidth <= 900;
}

function getNumeric(input, attr, fallback) {
  const value = parseFloat(input[attr]);
  return Number.isFinite(value) ? value : fallback;
}

function getBounds(input) {
  return input.getBoundingClientRect();
}

function valueFromClientX(input, clientX) {
  const rect = getBounds(input);
  const min = getNumeric(input, 'min', 0);
  const max = getNumeric(input, 'max', 100);
  const step = getNumeric(input, 'step', 1);
  const pct = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
  let raw = min + pct * (max - min);

  if (step > 0) {
    raw = Math.round(raw / step) * step;
  }

  return Math.min(max, Math.max(min, raw));
}

function thumbClientX(input) {
  const rect = getBounds(input);
  const min = getNumeric(input, 'min', 0);
  const max = getNumeric(input, 'max', 100);
  const val = getNumeric(input, 'value', min);
  const pct = max > min ? (val - min) / (max - min) : 0;
  return rect.left + pct * rect.width;
}

function isNearThumb(input, clientX) {
  return Math.abs(clientX - thumbClientX(input)) <= THUMB_HIT_RADIUS_PX;
}

function commitValue(input, value) {
  const next = String(value);
  if (input.value === next) return;
  input.value = next;
  input.dispatchEvent(new Event('input', { bubbles: true }));
}

export function attachMobileRangeBehavior(input) {
  if (!(input instanceof HTMLInputElement) || input.type !== 'range') return;
  if (attached.has(input)) return;
  if (!isMobileRangeContext()) return;

  attached.add(input);

  let holdTimer = null;
  let holdCompleted = false;
  let isThumbDrag = false;
  let lockedValue = null;
  let activePointerId = null;
  let pendingClientX = null;

  const clearHold = () => {
    if (!holdTimer) return;
    clearTimeout(holdTimer);
    holdTimer = null;
  };

  const resetInteraction = () => {
    clearHold();
    holdCompleted = false;
    isThumbDrag = false;
    lockedValue = null;
    activePointerId = null;
    pendingClientX = null;
  };

  const onPointerDown = (event) => {
    if (input.disabled || !isMobileRangeContext()) return;

    if (isNearThumb(input, event.clientX)) {
      isThumbDrag = true;
      activePointerId = event.pointerId;
      return;
    }

    event.preventDefault();
    input.setPointerCapture?.(event.pointerId);

    activePointerId = event.pointerId;
    lockedValue = getNumeric(input, 'value', 0);
    holdCompleted = false;
    pendingClientX = event.clientX;

    holdTimer = setTimeout(() => {
      holdTimer = null;
      holdCompleted = true;
      isThumbDrag = true;
      lockedValue = null;
      commitValue(input, valueFromClientX(input, pendingClientX ?? event.clientX));
    }, MOBILE_RANGE_HOLD_MS);
  };

  const onPointerMove = (event) => {
    if (event.pointerId !== activePointerId) return;

    if (holdTimer) {
      pendingClientX = event.clientX;
      return;
    }

    if (holdCompleted && isThumbDrag) {
      commitValue(input, valueFromClientX(input, event.clientX));
    }
  };

  const onPointerUp = (event) => {
    if (event.pointerId !== activePointerId) return;

    if (holdTimer && lockedValue !== null) {
      commitValue(input, lockedValue);
    }

    input.releasePointerCapture?.(event.pointerId);
    resetInteraction();
  };

  const onInput = () => {
    if (lockedValue !== null && !holdCompleted && !isThumbDrag) {
      input.value = String(lockedValue);
    }
  };

  input.addEventListener('pointerdown', onPointerDown, { passive: false });
  input.addEventListener('pointermove', onPointerMove);
  input.addEventListener('pointerup', onPointerUp);
  input.addEventListener('pointercancel', onPointerUp);
  input.addEventListener('input', onInput);
}
