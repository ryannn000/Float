/* Float Keys: touch-friendly "mouse lock".
   Runs inside the page itself (MAIN world), before the page's own scripts.

   Why: when a game locks the mouse (Pointer Lock) the browser stops reporting where a finger is
   (touch events report 0,0 and no movement), so on-screen sticks and buttons can't work.
   On a touch device we therefore answer the game's lock request ourselves: the game believes the
   pointer is locked (pointerLockElement, pointerlockchange) and keeps listening for mouse movement,
   which the Look stick supplies, but the browser never really locks anything.

   Mode comes from <html data-fk-lock="auto|fake|real"> (set by the extension). auto = fake only
   when the last pointer used was touch (or the device is touch-first). */
(() => {
  if (window.__fkLockPatched) return;
  window.__fkLockPatched = true;
  let touchy = false;
  try { touchy = matchMedia('(pointer: coarse)').matches; } catch (e) {}
  addEventListener('pointerdown', (e) => { if (e.isTrusted && e.pointerType) touchy = e.pointerType !== 'mouse'; }, true);

  const root = () => document.documentElement;
  const mode = () => (root() && root().getAttribute('data-fk-lock')) || 'auto';
  const wantFake = () => { const m = mode(); return m === 'fake' || (m === 'auto' && touchy); };

  const docProto = Document.prototype, elProto = Element.prototype;
  const realReq = elProto.requestPointerLock, realExit = docProto.exitPointerLock;
  const desc = Object.getOwnPropertyDescriptor(docProto, 'pointerLockElement');
  if (!realReq || !desc) return;
  let fake = null;

  const changed = () => setTimeout(() => { try { document.dispatchEvent(new Event('pointerlockchange')); } catch (e) {} }, 0);
  function setFake(el) {
    if (fake && fake.removeAttribute) fake.removeAttribute('data-fk-locked');
    fake = el;
    if (el && el.setAttribute) el.setAttribute('data-fk-locked', '1');
  }

  Object.defineProperty(docProto, 'pointerLockElement', { configurable: true, enumerable: desc.enumerable, get() { return fake || desc.get.call(this); } });

  elProto.requestPointerLock = function (...args) {
    if (!wantFake()) return realReq.apply(this, args);
    const was = fake;
    setFake(this);
    if (was !== this) changed();
    return Promise.resolve();
  };
  docProto.exitPointerLock = function () {
    if (fake) { setFake(null); changed(); return; }
    return realExit.apply(this);
  };
  // The browser consumes Esc to leave a real lock; do the same for the pretend one.
  addEventListener('keydown', (e) => { if (fake && e.code === 'Escape') { setFake(null); changed(); } }, true);
})();
