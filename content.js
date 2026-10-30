(() => {
  if (window.__floatKeysLoaded) return;
  window.__floatKeysLoaded = true;
  if (window.top !== window) return; // top frame only

  /* ---------- Key helpers ---------- */
  const KEYCODES = {
    Backspace: 8, Tab: 9, Enter: 13, ShiftLeft: 16, ShiftRight: 16, ControlLeft: 17, ControlRight: 17,
    AltLeft: 18, AltRight: 18, Escape: 27, Space: 32, PageUp: 33, PageDown: 34, End: 35, Home: 36,
    ArrowLeft: 37, ArrowUp: 38, ArrowRight: 39, ArrowDown: 40, Insert: 45, Delete: 46,
    Semicolon: 186, Equal: 187, Comma: 188, Minus: 189, Period: 190, Slash: 191, Backquote: 192,
    BracketLeft: 219, Backslash: 220, BracketRight: 221, Quote: 222
  };
  KEYCODES.CapsLock = 20; KEYCODES.MetaLeft = 91;
  function legacyCode(code) {
    if (KEYCODES[code]) return KEYCODES[code];
    let m;
    if ((m = /^Key([A-Z])$/.exec(code))) return m[1].charCodeAt(0);
    if ((m = /^Digit(\d)$/.exec(code))) return 48 + +m[1];
    if ((m = /^Numpad(\d)$/.exec(code))) return 96 + +m[1];
    if ((m = /^F(\d{1,2})$/.exec(code))) return 111 + +m[1];
    return 0;
  }
  const PUNCT = { Semicolon: ';', Equal: '=', Comma: ',', Minus: '-', Period: '.', Slash: '/', Backquote: '`', BracketLeft: '[', BracketRight: ']', Backslash: '\\', Quote: "'" };
  function keyFor(code) {
    let m;
    if ((m = /^Key([A-Z])$/.exec(code))) return m[1].toLowerCase();
    if ((m = /^Digit(\d)$/.exec(code))) return m[1];
    if (code === 'Space') return ' ';
    if (/^Shift/.test(code)) return 'Shift';
    if (/^Control/.test(code)) return 'Control';
    if (/^Alt/.test(code)) return 'Alt';
    if (/^Meta/.test(code)) return 'Meta';
    if (PUNCT[code]) return PUNCT[code];
    return code; // Enter, Tab, Escape, ArrowUp, F5, CapsLock ...
  }
  function makeKey(code, key) {
    return { code, key: key || keyFor(code), keyCode: legacyCode(code) };
  }
  const MOUSE_NAMES = { 0: 'LMB', 1: 'MMB', 2: 'RMB' };
  function keyLabel(k) {
    if (!k) return '—';
    if (k.mouse !== undefined) return MOUSE_NAMES[k.mouse] || 'Mouse';
    const c = k.code;
    if (/^Key[A-Z]$/.test(c)) return c.slice(3);
    if (/^Digit\d$/.test(c)) return c.slice(5);
    if (c.startsWith('Arrow')) return { ArrowUp: '↑', ArrowDown: '↓', ArrowLeft: '←', ArrowRight: '→' }[c];
    return { Space: 'Space', ShiftLeft: 'Shift', ShiftRight: 'RShift', ControlLeft: 'Ctrl', ControlRight: 'RCtrl',
      AltLeft: 'Alt', AltRight: 'RAlt', Escape: 'Esc', CapsLock: 'Caps', Backspace: 'Bksp' }[c] || c;
  }
  // Turn text typed by the user ("w", "space", "shift", "f5", "lmb"...) into a key object.
  const ALIASES = {
    space: 'Space', spacebar: 'Space', shift: 'ShiftLeft', lshift: 'ShiftLeft', leftshift: 'ShiftLeft', rshift: 'ShiftRight', rightshift: 'ShiftRight',
    ctrl: 'ControlLeft', control: 'ControlLeft', lctrl: 'ControlLeft', leftctrl: 'ControlLeft', rctrl: 'ControlRight',
    alt: 'AltLeft', lalt: 'AltLeft', leftalt: 'AltLeft', ralt: 'AltRight', tab: 'Tab', esc: 'Escape', escape: 'Escape',
    enter: 'Enter', return: 'Enter', backspace: 'Backspace', caps: 'CapsLock', capslock: 'CapsLock',
    up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight',
    arrowup: 'ArrowUp', arrowdown: 'ArrowDown', arrowleft: 'ArrowLeft', arrowright: 'ArrowRight',
    delete: 'Delete', del: 'Delete', insert: 'Insert', home: 'Home', end: 'End', pageup: 'PageUp', pagedown: 'PageDown',
    ';': 'Semicolon', '=': 'Equal', ',': 'Comma', '-': 'Minus', '.': 'Period', '/': 'Slash', '`': 'Backquote',
    '[': 'BracketLeft', ']': 'BracketRight', '\\': 'Backslash', "'": 'Quote'
  };
  const MOUSE_ALIASES = { lmb: 0, leftclick: 0, leftmouse: 0, mouse1: 0, click: 0, mmb: 1, middleclick: 1, mouse3: 1, rmb: 2, rightclick: 2, rightmouse: 2, mouse2: 2 };
  function parseKey(text) {
    const t = String(text || '').trim().toLowerCase().replace(/[\s_-]+/g, '');
    if (!t && String(text).trim() !== '-') return null;
    if (t in MOUSE_ALIASES) return { mouse: MOUSE_ALIASES[t] };
    const raw = String(text).trim().toLowerCase();
    if (ALIASES[t]) return makeKey(ALIASES[t]);
    if (ALIASES[raw]) return makeKey(ALIASES[raw]);
    if (/^[a-z]$/.test(t)) return makeKey('Key' + t.toUpperCase());
    if (/^\d$/.test(t)) return makeKey('Digit' + t);
    if (/^f([1-9]|1[0-2])$/.test(t)) return makeKey(t.toUpperCase());
    if (/^key[a-z]$/.test(t)) return makeKey('Key' + t[3].toUpperCase());
    if (/^digit\d$/.test(t)) return makeKey('Digit' + t[5]);
    return null;
  }
  function pageTargetAt(x, y) {
    const list = document.elementsFromPoint(x, y);
    return list.find((n) => n !== host) || document.body || document.documentElement;
  }
  // Camera movement: a mousemove with movementX/Y, sent to the locked element (or the page centre).
  /* Browser ports (Emscripten/SDL) only ask for mouse lock from inside a click/key event they receive.
     We swallow touches on our buttons and the look area, so the game would never get that chance. Send it a
     harmless "mouse released" + "unused key released" so it can make its (pretend) lock request, then look works. */
  let wakeAt = 0;
  function wakeGame() {
    if (document.pointerLockElement || document.querySelector('[data-fk-locked]')) return;
    if (Date.now() - wakeAt < 400) return;
    wakeAt = Date.now();
    const x = innerWidth / 2, y = innerHeight / 2, t = pageTargetAt(x, y);
    const mi = { bubbles: true, cancelable: true, composed: true, view: window, clientX: x, clientY: y, button: 0, buttons: 0 };
    try { t.dispatchEvent(new PointerEvent('pointerup', { ...mi, pointerType: 'mouse', isPrimary: true })); } catch (e) {}
    t.dispatchEvent(new MouseEvent('mouseup', mi));
    try { (document.activeElement && document.activeElement !== document.body ? document.activeElement : t).dispatchEvent(new KeyboardEvent('keyup', { code: 'F24', key: 'F24', keyCode: 135, bubbles: true, cancelable: true, composed: true, view: window })); } catch (e) {}
    dlog('wake: sent mouseup so the game can request mouse lock');
  }
  let lookLogged = 0;
  function fireLook(dx, dy) {
    const x = innerWidth / 2, y = innerHeight / 2;
    const t = document.pointerLockElement || document.querySelector('[data-fk-locked]') || pageTargetAt(x, y);
    const init = {
      bubbles: true, cancelable: true, composed: true, view: window,
      clientX: x, clientY: y, screenX: x, screenY: y, movementX: dx, movementY: dy, buttons: 0
    };
    // A real mouse sends pointermove and then mousemove; games listen to one or the other, so send both in that order.
    try { t.dispatchEvent(new PointerEvent('pointermove', { ...init, pointerType: 'mouse', pointerId: 1, isPrimary: true })); } catch (e) {}
    t.dispatchEvent(new MouseEvent('mousemove', init));
    if (dbgOn && Date.now() - lookLogged > 700) {
      lookLogged = Date.now();
      dlog(`look ${dx},${dy} -> ${describe(t)} lock:${document.pointerLockElement ? 'real' : (document.querySelector('[data-fk-locked]') ? 'pretend' : 'none')}`);
    }
  }
  function fireMouse(down, k) {
    const x = innerWidth / 2, y = innerHeight / 2;
    const t = pageTargetAt(x, y);
    const bit = k.mouse === 2 ? 2 : k.mouse === 1 ? 4 : 1;
    const init = { bubbles: true, cancelable: true, composed: true, view: window, clientX: x, clientY: y, button: k.mouse, buttons: down ? bit : 0 };
    const n = down ? 'down' : 'up';
    t.dispatchEvent(new PointerEvent('pointer' + n, { ...init, pointerType: 'mouse', isPrimary: true }));
    t.dispatchEvent(new MouseEvent('mouse' + n, init));
    if (!down && k.mouse === 0) t.dispatchEvent(new MouseEvent('click', init));
  }
  /* ---------- Typing: number pad + Android keyboard ----------
     Fake key events never type into a web text box, and many browser games only read text from a "keypress" event.
     typeKey() sends keydown + keypress (with the character) + keyup, and also inserts the text itself when the
     page has a real text field focused. */
  const NBSP = ' ', SENT = NBSP.repeat(10);
  const PUNCT_KEYS = { '.': ['Period', 190], ',': ['Comma', 188], '-': ['Minus', 189], '_': ['Minus', 189, 1], '/': ['Slash', 191], '?': ['Slash', 191, 1],
    ':': ['Semicolon', 186, 1], ';': ['Semicolon', 186], '=': ['Equal', 187], '+': ['Equal', 187, 1], ' ': ['Space', 32], '~': ['Backquote', 192, 1],
    '`': ['Backquote', 192], "'": ['Quote', 222], '"': ['Quote', 222, 1], '@': ['Digit2', 50, 1], '!': ['Digit1', 49, 1], '\\': ['Backslash', 220],
    '[': ['BracketLeft', 219], ']': ['BracketRight', 221] };
  function charKey(c) {
    if (/[0-9]/.test(c)) return { code: 'Digit' + c, key: c, keyCode: 48 + +c };
    if (/[a-z]/i.test(c)) { const u = c.toUpperCase(); return { code: 'Key' + u, key: c, keyCode: u.charCodeAt(0), shift: c !== c.toLowerCase() }; }
    const p = PUNCT_KEYS[c];
    if (p) return { code: p[0], key: c, keyCode: p[1], shift: !!p[2] };
    return { code: '', key: c, keyCode: c.charCodeAt(0) };
  }
  const KEY_BACKSPACE = { code: 'Backspace', key: 'Backspace', keyCode: 8 };
  const KEY_ENTER = { code: 'Enter', key: 'Enter', keyCode: 13 };
  function isEditableEl(el) {
    if (!el || el === host || el === document.body || el === document.documentElement) return false;
    if (el.isContentEditable) return true;
    if (el.tagName === 'TEXTAREA') return !el.readOnly && !el.disabled;
    if (el.tagName === 'INPUT') {
      const ty = (el.type || 'text').toLowerCase();
      return ['text', 'search', 'url', 'tel', 'password', 'email', 'number', ''].includes(ty) && !el.readOnly && !el.disabled;
    }
    return false;
  }
  let kbdOpen = false, kbdPrev = null;
  function typeFocus() {
    const a = kbdOpen ? kbdPrev : document.activeElement;
    return a && a !== host ? a : null;
  }
  function setNativeValue(el, v) {
    const proto = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    const d = Object.getOwnPropertyDescriptor(proto, 'value');
    if (d && d.set) d.set.call(el, v); else el.value = v;
  }
  function editInto(el, k, ch) {
    if (el.isContentEditable) {
      try {
        if (ch) document.execCommand('insertText', false, ch);
        else if (k.code === 'Backspace') document.execCommand('delete');
        else if (k.code === 'Enter') document.execCommand('insertParagraph');
      } catch (e) {}
      return;
    }
    if (k.code === 'Enter') {
      if (el.tagName === 'TEXTAREA') ch = '\n';
      else { if (el.form) { try { el.form.requestSubmit(); } catch (e) {} } return; }
    }
    const v = el.value; let s = null, e2 = null;
    try { s = el.selectionStart; e2 = el.selectionEnd; } catch (err) {}
    if (s == null || e2 == null) { s = e2 = v.length; }
    let nv, pos, type, data = null;
    if (k.code === 'Backspace') {
      if (s === e2) { if (s === 0) return; s -= 1; }
      nv = v.slice(0, s) + v.slice(e2); pos = s; type = 'deleteContentBackward';
    } else if (ch) {
      if (el.maxLength > 0 && v.length - (e2 - s) + ch.length > el.maxLength) return;
      nv = v.slice(0, s) + ch + v.slice(e2); pos = s + ch.length; type = 'insertText'; data = ch;
    } else return;
    setNativeValue(el, nv);
    try { el.setSelectionRange(pos, pos); } catch (err) {}
    try { el.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: type, data })); } catch (err) { el.dispatchEvent(new Event('input', { bubbles: true })); }
  }
  function typeKey(k) {
    if (!k) return;
    const a = typeFocus();
    const web = isEditableEl(a) ? a : null;
    const target = (a && a.tagName !== 'IFRAME' && a.tagName !== 'FRAME') ? a : (document.body || document.documentElement);
    const ch = k.key && k.key.length === 1 ? k.key : null;
    const base = { code: k.code || '', key: k.key, keyCode: k.keyCode || 0, which: k.keyCode || 0, shiftKey: !!k.shift, bubbles: true, cancelable: true, composed: true, view: window };
    const kd = target.dispatchEvent(new KeyboardEvent('keydown', base));
    let kp = true;
    if (ch || k.code === 'Enter') {
      const c = ch ? ch.charCodeAt(0) : 13;
      kp = target.dispatchEvent(new KeyboardEvent('keypress', { ...base, keyCode: c, which: c, charCode: c }));
    }
    if (web && kd && kp) editInto(web, k, ch);
    target.dispatchEvent(new KeyboardEvent('keyup', base));
  }
  // A hidden text field + a small preview bar: tapping the keyboard button focuses it so Android shows its keyboard,
  // and whatever you type is forwarded with typeKey().
  let kbdInput = null, kbdBar = null, kbdLast = SENT, kbdComposing = false, kbdEcho = '';
  function kbdEchoSet(t) { kbdEcho = t.slice(-40); if (kbdBar) kbdBar.textContent = kbdEcho ? '⌨ ' + kbdEcho : '⌨ …'; }
  function kbdSync() {
    const v = kbdInput.value, l = kbdLast;
    let i = 0; const n = Math.min(v.length, l.length);
    while (i < n && v[i] === l[i]) i++;
    for (let j = l.length - 1; j >= i; j--) { typeKey(KEY_BACKSPACE); kbdEchoSet(kbdEcho.slice(0, -1)); }
    for (let j = i; j < v.length; j++) { if (v[j] === NBSP) continue; typeKey(charKey(v[j])); kbdEchoSet(kbdEcho + v[j]); }
    kbdLast = v;
    if (!kbdComposing && (v.length < 5 || v.length > 60)) {
      kbdInput.value = SENT; kbdLast = SENT;
      try { kbdInput.setSelectionRange(SENT.length, SENT.length); } catch (e) {}
    }
  }
  function kbdBuild() {
    kbdInput = document.createElement('input');
    kbdInput.className = 'kbdin'; kbdInput.type = 'text'; kbdInput.value = SENT;
    for (const [k, v] of [['autocomplete', 'off'], ['autocorrect', 'off'], ['autocapitalize', 'off'], ['spellcheck', 'false'], ['enterkeyhint', 'done'], ['aria-label', 'Float Keys keyboard']]) kbdInput.setAttribute(k, v);
    kbdInput.addEventListener('compositionstart', () => { kbdComposing = true; });
    kbdInput.addEventListener('compositionend', () => { kbdComposing = false; kbdSync(); });
    kbdInput.addEventListener('input', (e) => { e.stopPropagation(); kbdSync(); });
    kbdInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); typeKey(KEY_ENTER); kbdEchoSet(''); }
      else if (e.key === 'Backspace' && kbdInput.value.length <= 0) { typeKey(KEY_BACKSPACE); }
    });
    kbdInput.addEventListener('blur', () => { if (kbdOpen) setTimeout(() => { if (kbdOpen && root.activeElement !== kbdInput) kbdClose(true); }, 120); });
    layer.appendChild(kbdInput);
    kbdBar = document.createElement('div'); kbdBar.className = 'kbar'; kbdBar.textContent = '⌨ …';
    layer.appendChild(kbdBar);
  }
  function kbdOpenNow(type) {
    if (!kbdInput) kbdBuild();
    const a = document.activeElement;
    kbdPrev = a && a !== host ? a : null;
    kbdInput.setAttribute('inputmode', type === 'numeric' ? 'numeric' : 'text');
    kbdInput.value = SENT; kbdLast = SENT; kbdEchoSet('');
    kbdOpen = true; kbdBar.classList.add('show');
    try { kbdInput.focus({ preventScroll: true }); } catch (e) { kbdInput.focus(); }
    try { kbdInput.setSelectionRange(SENT.length, SENT.length); } catch (e) {}
  }
  function kbdClose(fromBlur) {
    if (!kbdOpen) return;
    kbdOpen = false;
    if (kbdBar) kbdBar.classList.remove('show');
    try { kbdInput.blur(); } catch (e) {}
    const p = kbdPrev; kbdPrev = null;
    if (p && p.focus && document.contains(p)) { try { p.focus({ preventScroll: true }); } catch (e) {} }
    setTimeout(layoutAll, 150);
  }
  function kbdToggle(type) { if (kbdOpen) kbdClose(); else kbdOpenNow(type); }

  function fire(type, k, repeat) {
    if (!k) return;
    if (k.mouse !== undefined) return fireMouse(type === 'keydown', k);
    const ev = new KeyboardEvent(type, {
      code: k.code, key: k.key, keyCode: k.keyCode, which: k.keyCode, charCode: 0, bubbles: true, cancelable: true, composed: true, repeat: !!repeat, view: window
    });
    let t = document.activeElement;
    if (!t || t.tagName === 'IFRAME' || t.tagName === 'FRAME') t = document.body || document;
    t.dispatchEvent(ev);
  }

  /* ---------- Config ---------- */
  const uid = () => Math.random().toString(36).slice(2, 9);
  const DEFAULT_COLOR = '#00f2ff';
  function defaults() {
    return {
      buttons: [
        { id: uid(), type: 'stick', label: '', keys: { up: makeKey('KeyW'), left: makeKey('KeyA'), down: makeKey('KeyS'), right: makeKey('KeyD') }, size: 150, color: DEFAULT_COLOR, opacity: 0.9, x: 0.14, y: 0.74 },
        { id: uid(), type: 'button', label: 'Z', key: makeKey('KeyZ'), mode: 'hold', size: 68, color: '#ff0055', shape: 'circle', opacity: 0.9, x: 0.80, y: 0.80 },
        { id: uid(), type: 'button', label: 'X', key: makeKey('KeyX'), mode: 'hold', size: 68, color: '#ffd400', shape: 'circle', opacity: 0.9, x: 0.88, y: 0.70 },
        { id: uid(), type: 'button', label: 'C', key: makeKey('KeyC'), mode: 'hold', size: 68, color: DEFAULT_COLOR, shape: 'circle', opacity: 0.9, x: 0.88, y: 0.86 }
      ],
      dock: { x: 0.5, y: 0.04 }
    };
  }
  function B(label, key, x, y, size, color, mode) {
    return { id: uid(), type: 'button', label, key, mode: mode || 'hold', size, color, shape: 'circle', opacity: 0.9, x, y };
  }
  function L(x, y, size) {
    const k = makeKey;
    return { id: uid(), type: 'look', label: '', mode: 'mouse', sens: 12, deadzone: 0.15, invertY: false,
      keys: { up: k('ArrowUp'), left: k('ArrowLeft'), down: k('ArrowDown'), right: k('ArrowRight') },
      size, color: '#ff7a00', opacity: 0.9, x, y };
  }
  function gtaPreset() {
    const k = makeKey, m = (n) => ({ mouse: n });
    return {
      buttons: [
        { id: uid(), type: 'stick', label: '', keys: { up: k('KeyW'), left: k('KeyA'), down: k('KeyS'), right: k('KeyD') }, size: 150, color: '#00f2ff', opacity: 0.9, x: 0.12, y: 0.72 },
        L(0.87, 0.66, 150),
        B('Fire', m(0), 0.70, 0.46, 76, '#ff0055'),
        B('Aim', m(2), 0.59, 0.60, 62, '#ff7a00'),
        B('Jump', k('Space'), 0.71, 0.84, 64, '#7cff6b'),
        B('Run', k('ShiftLeft'), 0.59, 0.82, 58, '#ffd400'),
        B('Enter', k('KeyF'), 0.48, 0.82, 54, '#00f2ff'),
        B('Rld', k('KeyR'), 0.48, 0.64, 52, '#c28bff'),
        B('Cover', k('KeyQ'), 0.48, 0.46, 52, '#c28bff'),
        B('Wheel', k('Tab'), 0.95, 0.33, 52, '#ffffff'),
        B('Horn', k('KeyE'), 0.60, 0.14, 46, '#9aa4ff'),
        B('Lights', k('KeyH'), 0.67, 0.14, 46, '#9aa4ff'),
        B('Char', k('AltLeft'), 0.74, 0.14, 46, '#9aa4ff'),
        B('Cam', k('KeyV'), 0.81, 0.14, 46, '#9aa4ff'),
        B('Phone', k('ArrowUp'), 0.88, 0.14, 46, '#9aa4ff'),
        B('Esc', k('Escape'), 0.95, 0.14, 46, '#9aa4ff')
      ],
      dock: { x: 0.34, y: 0.05 },
      zone: { on: true, side: 'right', width: 0.5, sens: 1.5, invertY: false, show: true }
    };
  }
  // Rebuilt from the screenshot of the user's own layout (positions/colors approximate; check keys in Edit).
  function screenshotPreset() {
    const k = makeKey, m = (n) => ({ mouse: n }), G = '#58c850';
    const bt = (key, x, y, size, color, shape) => ({ id: uid(), type: 'button', label: '', key, mode: 'hold', size, color, shape: shape || 'circle', opacity: 0.75, x, y });
    return {
      buttons: [
        { id: uid(), type: 'stick', label: '', keys: { up: k('KeyW'), left: k('KeyA'), down: k('KeyS'), right: k('KeyD') }, size: 150, color: '#00f2ff', opacity: 0.9, x: 0.879, y: 0.247 },
        bt(k('Escape'), 0.075, 0.134, 36, G), bt(k('Tab'), 0.133, 0.286, 44, G),
        bt(k('KeyW'), 0.169, 0.537, 49, G, 'rounded'), bt(k('KeyA'), 0.089, 0.732, 49, G, 'rounded'),
        bt(k('KeyS'), 0.166, 0.733, 49, G, 'rounded'), bt(k('KeyD'), 0.250, 0.725, 49, G, 'rounded'),
        bt(k('ShiftLeft'), 0.327, 0.884, 47, G), bt(k('Space'), 0.668, 0.885, 41, G),
        bt(k('KeyF'), 0.740, 0.735, 36, '#ffd400'), bt(k('KeyC'), 0.673, 0.678, 36, '#00f2ff'),
        bt(k('KeyZ'), 0.734, 0.568, 36, '#ff0055'),
        bt(m(2), 0.597, 0.369, 60, G), bt(m(0), 0.688, 0.228, 65, G)
      ],
      dock: { x: 0.55, y: 0.07 }
    };
  }
  const TEMPLATES = [['Default (stick + Z X C)', defaults], ['GTA V (with look stick)', gtaPreset], ['My layout (from screenshot)', screenshotPreset]];
  let cfg = defaults();   // = the active profile (reference into store.profiles)
  let store = null;       // { activeId, profiles: [{ id, name, buttons, dock }] }
  let visible = false;
  let editMode = false;
  // How the page's "lock the mouse" request is handled (see lock-main.js): auto | fake | real
  let lockMode = 'auto';
  const LOCK_LABEL = { auto: 'Auto (pretend on touch)', fake: 'Always pretend', real: 'Real browser lock' };
  function applyLockMode() { try { document.documentElement.setAttribute('data-fk-lock', lockMode); } catch (e) {} }

  /* ---------- Look area (swipe anywhere on one side of the screen, like mobile games) ---------- */
  const ZONE_DEFAULT = { on: true, side: 'right', width: 0.5, sens: 1.5, invertY: false, show: true };
  const ZONE_WIDTHS = [0.3, 0.4, 0.5, 0.6, 0.7];
  const ZONE_SENS = [0.5, 0.75, 1, 1.5, 2, 3, 4, 6];
  function zoneCfg() {   // keep ONE object per profile (the menu buttons hold on to it), only fill in missing settings
    if (!cfg.zone || typeof cfg.zone !== 'object') cfg.zone = {};
    for (const k of Object.keys(ZONE_DEFAULT)) if (cfg.zone[k] === undefined) cfg.zone[k] = ZONE_DEFAULT[k];
    return cfg.zone;
  }
  let zoneEl = null;
  function applyZone() {
    if (!zoneEl) return;
    const z = zoneCfg();
    zoneEl.className = 'zone ' + z.side + (z.on ? ' on' : '') + (z.show ? '' : ' hide');
    zoneEl.style.width = Math.round(z.width * 100) + '%';
  }
  function hitZone(e) {
    if (!root || !visible || editMode || !zoneEl || !zoneCfg().on) return false;
    const p = posOf(e);
    const h = root.elementsFromPoint(p.x, p.y)[0];
    return h === zoneEl;
  }
  const zoneRoutes = new Map(); // pointerId -> { x, y, ax, ay }
  function zoneDown(e) { wakeGame(); dlog('look area: touch ' + Math.round(e.clientX) + ',' + Math.round(e.clientY)); zoneRoutes.set(e.pointerId, { x: e.clientX, y: e.clientY, ax: 0, ay: 0 }); }
  function zoneMove(e) {
    const st = zoneRoutes.get(e.pointerId); if (!st) return;
    const z = zoneCfg();
    st.ax += (e.clientX - st.x) * z.sens;
    st.ay += (e.clientY - st.y) * z.sens * (z.invertY ? -1 : 1);
    st.x = e.clientX; st.y = e.clientY;
    const sx = Math.trunc(st.ax), sy = Math.trunc(st.ay);
    if (sx || sy) { st.ax -= sx; st.ay -= sy; fireLook(sx, sy); }
  }

  /* ---------- DOM ---------- */
  let menuHidden = false, dotPos = { x: 0.96, y: 0.07 }, dot, hideMenuBtn;
  let host, root, layer, dock, editor, editBtn, menu, presetBtn, sheet, dbgEl;
  let menuOpenId = null, menuMode = null, dbgOn = false;
  const els = new Map(); // id -> element
  const held = new Map(); // id -> cleanup/release fn (for held keys)

  const CSS = `
    * { box-sizing: border-box; font-family: system-ui, -apple-system, 'Segoe UI', sans-serif; -webkit-tap-highlight-color: transparent; }
    .layer { position: fixed; inset: 0; pointer-events: none; z-index: 2147483647; user-select: none; -webkit-user-select: none; }
    .layer.off { display: none; }
    .fb { position: absolute; pointer-events: auto; touch-action: none; display: flex; align-items: center; justify-content: center;
      color: #fff; font-weight: 800; cursor: pointer; border: 2px solid var(--c); background: color-mix(in srgb, var(--c) 22%, rgba(12,12,18,.75));
      box-shadow: 0 4px 14px rgba(0,0,0,.45), 0 0 14px color-mix(in srgb, var(--c) 45%, transparent);
      backdrop-filter: blur(6px); transition: transform .06s, background .06s; }
    .kbdin { position: absolute; left: 0; top: 0; width: 1px; height: 1px; padding: 0; border: 0; margin: 0; opacity: .01; font-size: 16px; pointer-events: none; }
    .kbar { position: absolute; top: 56px; left: 50%; transform: translateX(-50%); max-width: 90vw; padding: 6px 12px; border-radius: 10px; display: none;
      background: rgba(15,15,22,.9); border: 1px solid rgba(0,242,255,.6); color: #fff; font: 600 15px/1.2 system-ui, sans-serif; pointer-events: none; z-index: 12; white-space: nowrap; overflow: hidden; }
    .kbar.show { display: block; }
    .fb.circle { border-radius: 50%; } .fb.rounded { border-radius: 22%; } .fb.square { border-radius: 4px; }
    .fb.down { transform: scale(.92); background: color-mix(in srgb, var(--c) 65%, rgba(12,12,18,.6)); }
    .editing .fb { outline: 2px dashed rgba(255,255,255,.7); outline-offset: 4px; cursor: move; }
    .fb.selected { outline-color: #fff; outline-style: solid; }
    .fb { z-index: 1; }
    .zone { position: absolute; z-index: 0; pointer-events: auto; touch-action: none; display: none; top: 0; bottom: 0;
      background: rgba(255,122,0,.05); }
    .zone.on { display: block; }
    .zone.right { right: 0; border-left: 1px dashed rgba(255,122,0,.35); }
    .zone.left { left: 0; border-right: 1px dashed rgba(255,122,0,.35); }
    .zone.hide { background: transparent; border-color: transparent; }
    .zone::after { content: 'LOOK AREA — swipe'; position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%);
      color: rgba(255,255,255,.22); font-size: 12px; font-weight: 700; letter-spacing: .08em; pointer-events: none; }
    .zone.hide::after { content: ''; }
    .editing .zone { pointer-events: none; background: rgba(255,122,0,.10); }
    .editing .zone.hide { background: rgba(255,122,0,.06); border-color: rgba(255,122,0,.35); }
    .editing .zone.hide::after { content: 'LOOK AREA'; }
    .stick { border-radius: 50%; }
    .knob { position: absolute; left: 50%; top: 50%; width: 40%; height: 40%; margin: -20% 0 0 -20%; border-radius: 50%;
      background: var(--c); box-shadow: 0 0 14px var(--c); pointer-events: none; }
    .ind { position: absolute; font-size: 11px; color: rgba(255,255,255,.55); pointer-events: none; }
    .ind.u { top: 5px; left: 50%; transform: translateX(-50%); } .ind.d { bottom: 5px; left: 50%; transform: translateX(-50%); }
    .ind.l { left: 8px; top: 50%; transform: translateY(-50%); } .ind.r { right: 8px; top: 50%; transform: translateY(-50%); }
    .dock { z-index: 11; position: absolute; pointer-events: auto; display: flex; gap: 4px; align-items: center; padding: 5px 6px;
      background: rgba(15,15,22,.88); border: 1px solid rgba(255,255,255,.18); border-radius: 14px; backdrop-filter: blur(10px);
      box-shadow: 0 6px 20px rgba(0,0,0,.5); touch-action: none; }
    .grip { width: 18px; align-self: stretch; cursor: grab; display:flex; align-items:center; justify-content:center; color: rgba(255,255,255,.4); font-size: 14px; letter-spacing: -2px; }
    .dock button { all: unset; cursor: pointer; color: #fff; font-size: 13px; font-weight: 600; padding: 7px 9px; border-radius: 9px; background: rgba(255,255,255,.08); }
    .dock button:hover { background: rgba(255,255,255,.18); }
    .dock button.on { background: #00f2ff; color: #001418; }
    .dock.gone { display: none; }
    .dot { z-index: 11; position: absolute; pointer-events: auto; display: none; width: 34px; height: 34px; align-items: center; justify-content: center;
      color: #fff; font-size: 18px; font-weight: 700; line-height: 1; border-radius: 50%; cursor: pointer; touch-action: none;
      background: rgba(15,15,22,.55); border: 1px solid rgba(255,255,255,.3); box-shadow: 0 2px 8px rgba(0,0,0,.4); }
    .dot.show { display: flex; }
    .editor { z-index: 10; position: absolute; pointer-events: auto; width: 300px; padding: 12px; color: #eee; font-size: 12px;
      background: rgba(18,18,26,.96); border: 1px solid rgba(255,255,255,.2); border-radius: 14px; box-shadow: 0 10px 30px rgba(0,0,0,.6); display: none; }
    .editor.open { display: block; }
    .editor h4 { margin: 0 0 8px; font-size: 13px; color: #00f2ff; display:flex; justify-content: space-between; align-items:center; }
    .row { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin: 7px 0; }
    .row label { color: #aaa; flex: 0 0 52px; }
    .row input[type=text], .row select { flex: 1; min-width: 0; background: #0d0d14; color: #fff; border: 1px solid #333; border-radius: 7px; padding: 5px 7px; font-size: 12px; }
    .row input[type=range] { flex: 1; min-width: 0; }
    .row input[type=color] { width: 40px; height: 26px; border: 0; background: none; padding: 0; }
    .keyrow { display: flex; gap: 4px; flex: 1; min-width: 0; }
    .keyrow input { flex: 1; min-width: 0; }
    .keyrow input.bad { border-color: #ff0055 !important; }
    .keyrow select { flex: 0 0 62px !important; }
    .keyrow .cap { flex: 0 0 30px; border: 1px solid #333; border-radius: 7px; background: #0d0d14; color: #fff; cursor: pointer; padding: 0; }
    .keyrow .cap.listening { border-color: #ff0055; }
    .menu { z-index: 11; position: absolute; pointer-events: auto; display: none; flex-direction: column; gap: 4px; padding: 8px; min-width: 190px; background: rgba(18,18,26,.97); border: 1px solid rgba(255,255,255,.2); border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,.6); }
    .menu.open { display: flex; }
    .menu button { all: unset; cursor: pointer; color: #fff; font-size: 13px; padding: 8px 10px; border-radius: 8px; background: rgba(255,255,255,.08); }
    .menu button:hover { background: rgba(255,255,255,.2); }
    .menu small { color: #888; font-size: 11px; padding: 2px 4px; }
    .menu { width: 270px; max-width: 92vw; overflow-y: auto; }
    .menu .prow { display: flex; gap: 4px; }
    .menu .pname { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .menu .pmore { flex: 0 0 38px; text-align: center; }
    .menu .pact { display: flex; gap: 4px; padding-left: 8px; }
    .menu .pact button { flex: 1; text-align: center; font-size: 12px; padding: 6px 4px; background: rgba(255,255,255,.14); }
    .menu .pact .danger { background: rgba(255,0,85,.45); }
    .menu .on { background: #00f2ff !important; color: #001418 !important; }
    .menu .nrow { display: flex; gap: 4px; }
    .menu .nrow input { flex: 1; min-width: 0; background: #0d0d14; color: #fff; border: 1px solid #00f2ff; border-radius: 8px; padding: 7px 8px; font-size: 13px; }
    .menu .nrow button { flex: 0 0 auto; padding: 7px 10px; text-align: center; }
    .menu .sec { margin-top: 4px; }
    .sheet { z-index: 12; position: absolute; pointer-events: auto; left: 50%; top: 50%; transform: translate(-50%, -50%); width: min(440px, 94vw);
      display: none; flex-direction: column; gap: 8px; padding: 12px; color: #eee; font-size: 12px;
      background: rgba(18,18,26,.98); border: 1px solid rgba(255,255,255,.22); border-radius: 14px; box-shadow: 0 10px 30px rgba(0,0,0,.6); }
    .sheet.open { display: flex; }
    .sheet textarea { width: 100%; height: 120px; resize: none; background: #0d0d14; color: #cfe; border: 1px solid #333; border-radius: 8px; padding: 7px; font: 11px monospace; }
    .sheet .bar { display: flex; gap: 6px; }
    .sheet button { all: unset; cursor: pointer; flex: 1; text-align: center; padding: 8px; border-radius: 8px; background: rgba(255,255,255,.14); color: #fff; font-size: 13px; }
    .sheet h4 { margin: 0; color: #00f2ff; font-size: 13px; }
    .sheet .msg { color: #9f9; min-height: 14px; }
    .dbg { display: none; position: absolute; left: 6px; top: 6px; max-width: 75vw; padding: 4px 6px; background: rgba(0,0,0,.75); color: #7cff6b; font: 10px/1.3 monospace; border-radius: 6px; pointer-events: none; z-index: 20; white-space: pre-wrap; }
    .dbg.on { display: block; }
    .keybtn { flex: 1; background: #0d0d14; color: #fff; border: 1px solid #333; border-radius: 7px; padding: 5px 7px; font-size: 12px; cursor: pointer; text-align: center; }
    .keybtn.listening { border-color: #ff0055; color: #ff7aa2; }
    .actions { display: flex; gap: 6px; margin-top: 10px; }
    .actions button, .x { cursor: pointer; border: 0; border-radius: 8px; padding: 7px; font-size: 12px; color: #fff; flex: 1; background: rgba(255,255,255,.12); }
    .actions .del { background: rgba(255,0,85,.35); }
    .x { flex: 0 0 auto; padding: 2px 8px; font-size: 16px; background: none; color: #999; }
    .hint { color: #888; font-size: 11px; margin-top: 6px; }
  `;

  // A real Esc press restores a window-filling element if real fullscreen was refused.
  window.addEventListener('keydown', (e) => { if (e.isTrusted && e.key === 'Escape' && pseudo && !document.fullscreenElement) leavePseudo(); }, true);

  /* ---------- Keep the UI attached and on top ---------- */
  function desiredParent() {
    const fs = document.fullscreenElement;
    if (fs && !/^(VIDEO|CANVAS|IMG|IFRAME|EMBED|OBJECT)$/.test(fs.tagName)) return fs;
    return document.documentElement;
  }
  function popoverOpen() {
    try { return !host.showPopover || host.matches(':popover-open'); } catch (e) { return true; }
  }
  function needsMount() {
    return !host || !host.isConnected || host.parentNode !== desiredParent() || !popoverOpen();
  }
  function mount(restack) {
    if (!host) return;
    const parent = desiredParent();
    if (host.parentNode !== parent) parent.appendChild(host);
    if (typeof host.showPopover === 'function') {
      try {
        if (restack && host.matches(':popover-open')) host.hidePopover();
        if (!host.matches(':popover-open')) host.showPopover();   // top layer: above any page z-index
      } catch (e) {}
    }
  }
  /* Fullscreen safety net.
     A canvas / video / iframe can't contain our buttons, so if another extension or the site fullscreens
     one of those and the browser doesn't keep our layer on top, the buttons vanish. We detect that and
     (1) stretch that element to fill the window and (2) move real fullscreen up to the whole page. */
  const UNHOSTABLE = /^(VIDEO|CANVAS|IMG|IFRAME|EMBED|OBJECT)$/;
  let pseudo = null; // { el, style, exiting }
  function uiShown() {
    if (!visible || !root || !dock || layer.classList.contains('off')) return true;
    const ui = menuHidden ? dot : dock;
    const r = ui.getBoundingClientRect();
    try { return root.elementsFromPoint(r.left + r.width / 2, r.top + r.height / 2).includes(ui); } catch (e) { return true; }
  }
  function enterPseudo(el) {
    if (pseudo) return;
    pseudo = { el, style: el.getAttribute('style'), exiting: false };
    el.style.cssText += ';position:fixed!important;left:0!important;top:0!important;width:100vw!important;height:100vh!important;max-width:none!important;max-height:none!important;margin:0!important;z-index:2147483000!important;object-fit:contain;background:#000;';
    const fallback = () => { if (pseudo) { pseudo.exiting = true; try { document.exitFullscreen().catch(() => {}); } catch (e) {} } };
    try { document.documentElement.requestFullscreen().catch(fallback); } catch (e) { fallback(); }
  }
  function leavePseudo() {
    if (!pseudo) return;
    const { el, style } = pseudo; pseudo = null;
    if (style == null) el.removeAttribute('style'); else el.setAttribute('style', style);
  }
  function ensureVisible() {
    if (!host || !visible) return;
    mount();
    const shown = uiShown();
    dlog(`fullscreen:${document.fullscreenElement ? document.fullscreenElement.tagName : 'none'} ui:${shown ? 'visible' : 'HIDDEN'}`);
    if (shown) return;
    const fs = document.fullscreenElement;
    if (fs && UNHOSTABLE.test(fs.tagName)) enterPseudo(fs);
  }
  function toggleFullscreen() {
    if (pseudo) { const had = !!document.fullscreenElement; leavePseudo(); if (!had) return; }   // first tap just restores the page
    try {
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
      else document.documentElement.requestFullscreen().catch(() => {});
    } catch (e) {}
  }

  // Release every held key and forget active touches (called when focus / fullscreen / pointer-lock changes).
  function resetInput() { routes.clear(); touchRoutes.clear(); zoneRoutes.clear(); releaseAll(); }

  /* ---------- Catch presses before the page can swallow them ---------- */
  // Pages (games, cloud-gaming sites) often add window-level capture handlers that stop events.
  // We register first (run_at document_start), hit-test our own buttons by coordinates, and
  // hand the event straight to the button inside our shadow tree.
  const routes = new Map(); // pointerId -> button element
  // While the game has the mouse locked (pointer lock) the browser freezes clientX/clientY and only
  // reports movementX/movementY. So we keep our own cursor position and move it by those deltas.
  let curX = innerWidth / 2, curY = innerHeight / 2;
  const clampN = (v, lo, hi) => Math.min(Math.max(v, lo), hi);
  function trackCursor(e) {
    if (e.pointerType && e.pointerType !== 'mouse') return;   // touch/pen always report real coordinates
    if (document.pointerLockElement) {
      curX = clampN(curX + (e.movementX || 0), 0, innerWidth);
      curY = clampN(curY + (e.movementY || 0), 0, innerHeight);
    } else { curX = e.clientX; curY = e.clientY; }
  }
  function posOf(e) {
    if (document.pointerLockElement && e.pointerType === 'mouse') return { x: curX, y: curY };
    return { x: e.clientX, y: e.clientY };
  }
  function hitButton(e) {
    if (!root || !visible) return null;
    const p = posOf(e);
    // elementsFromPoint lists everything under the point (even beneath a page overlay);
    // the first one in our own tree is our topmost piece of UI at that spot.
    const h = root.elementsFromPoint(p.x, p.y)[0];
    return h && h.classList && h.classList.contains('fb') ? h : null;
  }
  function block(e) { e.stopImmediatePropagation(); if (e.cancelable) e.preventDefault(); }
  function forward(el, e) {
    const p = posOf(e);
    try {
      el.dispatchEvent(new PointerEvent(e.type, {
        pointerId: e.pointerId, pointerType: e.pointerType, isPrimary: e.isPrimary,
        clientX: p.x, clientY: p.y, screenX: e.screenX, screenY: e.screenY,
        button: e.button, buttons: e.buttons, pressure: e.pressure, width: e.width, height: e.height,
        bubbles: false, composed: false, cancelable: true
      }));
    } catch (err) {}
  }
  function describe(n) {
    if (!n) return 'none';
    return (n.tagName || '?').toLowerCase() + (n.id ? '#' + n.id : '') + (typeof n.className === 'string' && n.className ? '.' + n.className.trim().split(/\s+/)[0].slice(0, 18) : '');
  }
  function dlog(msg) {
    if (!dbgOn || !dbgEl) return;
    const lines = (dbgEl.textContent ? dbgEl.textContent.split('\n') : []).concat(msg).slice(-7);
    dbgEl.textContent = lines.join('\n');
  }
  function onPointer(e) {
    if (!e.isTrusted) return;
    if (e.type === 'pointermove' || e.type === 'pointerdown') trackCursor(e);
    if (e.type === 'pointerdown') {
      const el = hitButton(e);
      if (dbgOn) { const q = posOf(e); dlog(`down ${Math.round(q.x)},${Math.round(q.y)} ${e.pointerType || '?'} lock:${document.pointerLockElement ? 'yes' : 'no'} page:${describe(pageTargetAt(q.x, q.y))} ours:${el ? 'BUTTON' : 'no'} active:${routes.size}`); }
      if (!el) {
        if (hitZone(e)) { zoneDown(e); block(e); }
        return;
      }
      routes.set(e.pointerId, el);
      block(e); forward(el, e);
    } else if (zoneRoutes.has(e.pointerId)) {
      block(e);
      if (e.type === 'pointermove') zoneMove(e);
      else if (e.type === 'pointerup' || e.type === 'pointercancel') zoneRoutes.delete(e.pointerId);
    } else if (routes.has(e.pointerId)) {
      const el = routes.get(e.pointerId);
      block(e); forward(el, e);
      if (e.type === 'pointerup' || e.type === 'pointercancel') routes.delete(e.pointerId);
    }
  }
  for (const t of ['pointerdown', 'pointermove', 'pointerup', 'pointercancel']) window.addEventListener(t, onPointer, true);
  for (const t of ['mousedown', 'mouseup', 'click', 'dblclick', 'auxclick', 'contextmenu']) {
    window.addEventListener(t, (e) => { if (e.isTrusted && (hitButton(e) || hitZone(e))) block(e); }, true);
  }
  // Touches that start on a button must not reach the game (it would also treat them as camera drags).
  const touchRoutes = new Set();
  function onTouch(e) {
    if (!e.isTrusted) return;
    let mine = false;
    for (const t of e.changedTouches) {
      if (e.type === 'touchstart') { if (hitButton(t) || hitZone(t)) { touchRoutes.add(t.identifier); mine = true; } }
      else if (touchRoutes.has(t.identifier)) { mine = true; if (e.type === 'touchend' || e.type === 'touchcancel') touchRoutes.delete(t.identifier); }
    }
    if (mine) block(e);
  }
  for (const t of ['touchstart', 'touchmove', 'touchend', 'touchcancel']) window.addEventListener(t, onTouch, { capture: true, passive: false });
  // Typing inside our own text boxes must not be seen (or blocked) by the page.
  for (const t of ['keydown', 'keyup', 'keypress']) {
    window.addEventListener(t, (e) => {
      if (!(e.isTrusted && host && e.target === host)) return;
      e.stopImmediatePropagation();   // hide it from the page (typing itself still happens)
      const a = root && root.activeElement;
      if (a) { try { a.dispatchEvent(new KeyboardEvent(e.type, { key: e.key, code: e.code, keyCode: e.keyCode, which: e.which, bubbles: false, composed: false, cancelable: true })); } catch (err) {} }
    }, true);
  }

  function build() {
    host = document.createElement('div');
    host.id = 'float-keys-host';
    root = host.attachShadow({ mode: 'closed' });
    const style = document.createElement('style');
    style.textContent = CSS;
    layer = document.createElement('div');
    layer.className = 'layer off';
    root.append(style, layer);
    zoneEl = document.createElement('div');
    layer.appendChild(zoneEl);
    host.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;margin:0;padding:0;border:0;background:transparent;overflow:visible;pointer-events:none;display:block;z-index:2147483647;';
    try { host.setAttribute('popover', 'manual'); } catch (e) {}
    mount();

    // Dock
    dock = document.createElement('div');
    dock.className = 'dock';
    const grip = document.createElement('div'); grip.className = 'grip'; grip.textContent = '⋮⋮'; grip.title = 'Drag toolbar';
    const addBtn = mkBtn('＋ Button', () => addButton('button'));
    const addStick = mkBtn('＋ Stick', () => addButton('stick'));
    const addLook = mkBtn('＋ Look', () => addButton('look'));
    const addPadBtn = mkBtn('＋ Pad', () => addPad());
    addPadBtn.title = 'Number pad (0-9 . : - ⌫ ⏎) + Android keyboard button';
    editBtn = mkBtn('✎ Edit', () => setEdit(!editMode));
    presetBtn = mkBtn('☰ Profiles', () => { sheet.classList.remove('open'); menu.classList.toggle('open'); if (menu.classList.contains('open')) { menuOpenId = null; menuMode = null; renderMenu(); } });
    const fsBtn = mkBtn('⛶', toggleFullscreen); fsBtn.title = 'Fullscreen the whole page (buttons stay visible)';
    const hideBtn = mkBtn('✕', () => setVisible(false, true));
    hideBtn.title = 'Hide (click the toolbar icon to bring back)';
    hideMenuBtn = mkBtn('⋯', () => setMenuHidden(true));
    hideMenuBtn.title = 'Hide this menu (a small ⋯ button stays to bring it back)';
    dock.append(grip, addBtn, addStick, addLook, addPadBtn, editBtn, presetBtn, fsBtn, hideMenuBtn, hideBtn);
    layer.appendChild(dock);
    makeDraggable(grip, () => ({ el: dock, set: (x, y) => { cfg.dock = { x, y }; } }), false);

    // Small ⋯ button shown while the menu is hidden: tap = bring the menu back, drag = move it.
    dot = document.createElement('div');
    dot.className = 'dot'; dot.style.width = dot.style.height = '34px'; dot.textContent = '⋯'; dot.title = 'Show menu (drag to move)';
    layer.appendChild(dot);
    makeDraggable(dot, () => ({ el: dot, set: (x, y) => { dotPos = { x, y }; try { chrome.storage.local.set({ fkDot: dotPos }); } catch (e) {} } }), false, () => setMenuHidden(false));

    editor = document.createElement('div');
    editor.className = 'editor';
    layer.appendChild(editor);

    menu = document.createElement('div');
    menu.className = 'menu';
    layer.appendChild(menu);
    sheet = document.createElement('div');
    sheet.className = 'sheet';
    layer.appendChild(sheet);
    dbgEl = document.createElement('div');
    dbgEl.className = 'dbg';
    layer.appendChild(dbgEl);

    window.addEventListener('resize', () => { if (!kbdOpen) layoutAll(); });   // the on-screen keyboard shrinks the page; keep the buttons where they are
    window.addEventListener('blur', resetInput);
    document.addEventListener('visibilitychange', () => document.hidden && resetInput());
    document.addEventListener('pointerlockchange', () => dlog('pointer lock: ' + (document.pointerLockElement ? 'ON' : 'off')));
    document.addEventListener('fullscreenchange', () => {
      resetInput(); mount(true);
      if (pseudo && ((!document.fullscreenElement && !pseudo.exiting) || (document.fullscreenElement && pseudo.exiting))) leavePseudo();   // user left fullscreen, or started a new one
      setTimeout(ensureVisible, 400); setTimeout(ensureVisible, 1500);
    });
    setInterval(() => {   // self-heal if the page removes/covers us
      if (needsMount()) mount();
      else if (document.fullscreenElement && !uiShown()) ensureVisible();
    }, 1500);
  }

  function positionMenu() {
    const r = dock.getBoundingClientRect();
    menu.style.left = Math.min(Math.max(r.left, 8), Math.max(8, innerWidth - 210)) + 'px';
    menu.style.top = (r.bottom + 6) + 'px';
    menu.style.maxHeight = Math.max(120, innerHeight - r.bottom - 16) + 'px';
  }
  function mkBtn(text, fn) {
    const b = document.createElement('button');
    b.textContent = text;
    b.addEventListener('click', fn);
    b.addEventListener('mousedown', (e) => e.preventDefault()); // keep focus on the game
    return b;
  }

  /* ---------- Layout ---------- */
  function place(el, x, y) {
    // offsetWidth is 0 while the layer is hidden, so fall back to the size we set ourselves.
    const w = el.offsetWidth || parseFloat(el.style.width) || 0, h = el.offsetHeight || parseFloat(el.style.height) || 0;
    const L = Math.min(Math.max(x * innerWidth - w / 2, 0), Math.max(0, innerWidth - w));
    const T = Math.min(Math.max(y * innerHeight - h / 2, 0), Math.max(0, innerHeight - h));
    el.style.left = L + 'px';
    el.style.top = T + 'px';
  }
  function layoutAll() {
    cfg.buttons.forEach(b => { const el = els.get(b.id); if (el) place(el, b.x, b.y); });
    place(dock, cfg.dock.x, cfg.dock.y);
    place(dot, dotPos.x, dotPos.y);
    if (menu.classList.contains('open')) positionMenu();
    if (selectedId) positionEditor();
  }

  /* ---------- Rendering ---------- */
  function renderAll() {
    releaseAll();
    for (const el of els.values()) el.remove();
    els.clear();
    cfg.buttons.forEach(renderButton);
    applyZone();
    layer.classList.toggle('editing', editMode);
    layoutAll();
  }

  function renderButton(b) {
    const el = document.createElement('div');
    el.className = 'fb ' + (b.type === 'stick' || b.type === 'look' ? 'stick' : (b.shape || 'circle'));
    el.style.setProperty('--c', b.color || DEFAULT_COLOR);
    el.style.width = el.style.height = b.size + 'px';
    el.style.opacity = b.opacity;
    el.style.fontSize = Math.max(12, b.size * 0.34) + 'px';
    if (b.type === 'stick') {
      for (const [cls, dir] of [['u', 'up'], ['d', 'down'], ['l', 'left'], ['r', 'right']]) {
        const s = document.createElement('span'); s.className = 'ind ' + cls; s.textContent = keyLabel(b.keys[dir]); el.appendChild(s);
      }
      const knob = document.createElement('div'); knob.className = 'knob'; el.appendChild(knob);
      attachStick(el, b, knob);
    } else if (b.type === 'look') {
      const s2 = document.createElement('span'); s2.className = 'ind u'; s2.textContent = 'LOOK'; el.appendChild(s2);
      const knob = document.createElement('div'); knob.className = 'knob'; el.appendChild(knob);
      attachLook(el, b, knob);
    } else {
      const txt = b.label || keyLabel(b.key);
      el.textContent = txt;
      el.style.fontSize = Math.max(10, b.size * (txt.length <= 1 ? 0.38 : txt.length <= 2 ? 0.3 : 0.9 / txt.length + 0.05)) + 'px';
      el.style.overflow = 'hidden';
      attachButton(el, b);
    }
    layer.appendChild(el);
    els.set(b.id, el);
    if (b.id === selectedId) el.classList.add('selected');
  }

  /* ---------- Button behaviour ---------- */
  function attachButton(el, b) {
    let turbo = null, isDown = false, toggled = false;
    let rep = null, rep2 = null;
    const down = () => {
      if (b.mode === 'kbd') { el.classList.add('down'); held.set(b.id, () => el.classList.remove('down')); return; }   // the keyboard opens when you lift your finger
      if (b.mode === 'type') {
        if (isDown) up();
        isDown = true; el.classList.add('down'); typeKey(b.key);
        if (b.key && b.key.code === 'Backspace') { rep = setTimeout(() => { rep2 = setInterval(() => typeKey(b.key), 70); }, 420); }   // hold to keep deleting
        held.set(b.id, up);
        return;
      }
      if (b.mode === 'toggle') {
        toggled = !toggled;
        fire(toggled ? 'keydown' : 'keyup', b.key);
        el.classList.toggle('down', toggled);
        held.set(b.id, () => { if (toggled) { fire('keyup', b.key); toggled = false; el.classList.remove('down'); } });
        return;
      }
      if (isDown) up();   // a release got lost earlier: reset instead of staying stuck
      isDown = true;
      el.classList.add('down');
      fire('keydown', b.key);
      if (b.mode === 'turbo') {
        let on = true;
        turbo = setInterval(() => { fire(on ? 'keyup' : 'keydown', b.key); on = !on; }, 60);
      }
      held.set(b.id, up);
    };
    const up = () => {
      if (b.mode === 'kbd') { const was = el.classList.contains('down'); el.classList.remove('down'); held.delete(b.id); if (was && !editMode) kbdToggle(b.kbdMode); return; }
      if (b.mode === 'type') { clearTimeout(rep); clearInterval(rep2); rep = rep2 = null; isDown = false; el.classList.remove('down'); held.delete(b.id); return; }
      if (b.mode === 'toggle' || !isDown) return;
      isDown = false;
      clearInterval(turbo); turbo = null;
      el.classList.remove('down');
      fire('keyup', b.key);
      held.delete(b.id);
    };
    el.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      if (editMode) return;
      down();
    });
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', () => { if (b.mode === 'kbd') { el.classList.remove('down'); held.delete(b.id); } else up(); });
    el.addEventListener('contextmenu', (e) => e.preventDefault());
    setupEditInteraction(el, b);
  }

  function attachStick(el, b, knob) {
    let active = new Set(), dragging = false;
    const dirs = { up: 'u', down: 'd', left: 'l', right: 'r' };
    const apply = (next) => {
      for (const d of next) if (!active.has(d)) fire('keydown', b.keys[d]);
      for (const d of active) if (!next.has(d)) fire('keyup', b.keys[d]);
      active = next;
    };
    const release = () => { apply(new Set()); knob.style.transform = ''; dragging = false; held.delete(b.id); };
    const move = (e) => {
      const r = el.getBoundingClientRect();
      let dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
      const max = r.width / 2 - r.width * 0.2, dist = Math.hypot(dx, dy);
      if (dist > max) { dx *= max / dist; dy *= max / dist; }
      knob.style.transform = `translate(${dx}px,${dy}px)`;
      const nx = dx / max, ny = dy / max, t = 0.35, next = new Set();
      if (ny < -t) next.add('up'); if (ny > t) next.add('down');
      if (nx < -t) next.add('left'); if (nx > t) next.add('right');
      apply(next);
    };
    el.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      if (editMode) return;
      if (dragging) release();
      dragging = true; held.set(b.id, release); move(e);
    });
    el.addEventListener('pointermove', (e) => dragging && move(e));
    el.addEventListener('pointerup', release);
    el.addEventListener('pointercancel', release);
    setupEditInteraction(el, b);
  }

  function attachLook(el, b, knob) {
    let dragging = false, vx = 0, vy = 0, accX = 0, accY = 0, timer = null, active = new Set();
    const applyKeys = (next) => {
      for (const d of next) if (!active.has(d)) fire('keydown', b.keys[d]);
      for (const d of active) if (!next.has(d)) fire('keyup', b.keys[d]);
      active = next;
    };
    const tick = () => {
      accX += vx; accY += vy;
      const sx = Math.trunc(accX), sy = Math.trunc(accY);
      if (sx || sy) { accX -= sx; accY -= sy; fireLook(sx, sy); }
    };
    const release = () => {
      clearInterval(timer); timer = null; vx = vy = accX = accY = 0;
      if (active.size) applyKeys(new Set());
      knob.style.transform = ''; dragging = false; held.delete(b.id);
    };
    const move = (e) => {
      const r = el.getBoundingClientRect();
      let dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
      const max = r.width / 2 - r.width * 0.2, dist = Math.hypot(dx, dy);
      if (dist > max) { dx *= max / dist; dy *= max / dist; }
      knob.style.transform = `translate(${dx}px,${dy}px)`;
      const nx = dx / max, ny = dy / max;
      if (b.mode === 'keys') {
        const t = 0.35, next = new Set();
        if (ny < -t) next.add('up'); if (ny > t) next.add('down');
        if (nx < -t) next.add('left'); if (nx > t) next.add('right');
        applyKeys(next);
      } else {
        const dz = b.deadzone == null ? 0.15 : b.deadzone;
        const f = (n) => { const a = Math.abs(n); return a < dz ? 0 : Math.sign(n) * (a - dz) / (1 - dz); };
        vx = f(nx) * (b.sens || 12);
        vy = f(ny) * (b.sens || 12) * (b.invertY ? -1 : 1);
      }
    };
    el.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      if (editMode) return;
      if (dragging) release();
      dragging = true; held.set(b.id, release); wakeGame();
      if (b.mode !== 'keys') timer = setInterval(tick, 16);
      move(e);
    });
    el.addEventListener('pointermove', (e) => dragging && move(e));
    el.addEventListener('pointerup', release);
    el.addEventListener('pointercancel', release);
    setupEditInteraction(el, b);
  }

  function releaseAll() {
    for (const fn of [...held.values()]) fn();
    held.clear();
  }

  /* ---------- Dragging (edit mode) ---------- */
  function makeDraggable(handle, getTarget, needEdit, onTap) {
    handle.addEventListener('pointerdown', (e) => {
      if (needEdit && !editMode) return;
      e.preventDefault();
      const { el, set } = getTarget();
      const r = el.getBoundingClientRect();
      const ox = e.clientX - r.left, oy = e.clientY - r.top;
      const sx = e.clientX, sy = e.clientY;
      let moved = false;
      try { handle.setPointerCapture(e.pointerId); } catch (err) {}   // can throw while the page holds a real pointer lock
      const mv = (ev) => {
        if (!moved && Math.hypot(ev.clientX - sx, ev.clientY - sy) < 5) return;
        moved = true;
        const w = el.offsetWidth, h = el.offsetHeight;
        const L = Math.min(Math.max(ev.clientX - ox, 0), innerWidth - w);
        const T = Math.min(Math.max(ev.clientY - oy, 0), innerHeight - h);
        el.style.left = L + 'px'; el.style.top = T + 'px';
        set((L + w / 2) / innerWidth, (T + h / 2) / innerHeight);
        if (selectedId) positionEditor();
      };
      const end = () => {
        handle.removeEventListener('pointermove', mv);
        handle.removeEventListener('pointerup', end);
        handle.removeEventListener('pointercancel', end);
        if (moved) save(); else if (onTap) onTap();
      };
      handle.addEventListener('pointermove', mv);
      handle.addEventListener('pointerup', end);
      handle.addEventListener('pointercancel', end);
    });
  }
  function setupEditInteraction(el, b) {
    makeDraggable(el, () => ({ el, set: (x, y) => {
      const dx = x - b.x, dy = y - b.y; b.x = x; b.y = y;
      if (b.gid) for (const o of cfg.buttons) {   // buttons of one pad move together
        if (o === b || o.gid !== b.gid) continue;
        o.x = Math.min(Math.max(o.x + dx, 0.01), 0.99); o.y = Math.min(Math.max(o.y + dy, 0.01), 0.99);
        const oe = els.get(o.id); if (oe) place(oe, o.x, o.y);
      }
    } }), true, () => select(b.id));
  }

  /* ---------- Editor ---------- */
  let selectedId = null;
  function select(id) {
    selectedId = id;
    els.forEach((el, k) => el.classList.toggle('selected', k === id));
    renderEditor();
  }
  function positionEditor() {
    const el = els.get(selectedId);
    if (!el) return;
    const r = el.getBoundingClientRect();
    const eh = editor.offsetHeight || 300, ew = 300;
    let L = r.right + 12; if (L + ew > innerWidth) L = r.left - ew - 12;
    L = Math.min(Math.max(L, 8), innerWidth - ew - 8);
    let T = Math.min(Math.max(r.top, 8), Math.max(8, innerHeight - eh - 8));
    editor.style.left = L + 'px'; editor.style.top = T + 'px';
  }
  function closeEditor() {
    selectedId = null;
    editor.classList.remove('open');
    els.forEach(el => el.classList.remove('selected'));
  }

  function renderEditor() {
    const b = cfg.buttons.find(x => x.id === selectedId);
    if (!b) return closeEditor();
    editor.replaceChildren();
    const title = document.createElement('h4');
    title.append(b.type === 'stick' ? 'Joystick' : b.type === 'look' ? 'Look stick' : 'Button');
    const x = document.createElement('button'); x.className = 'x'; x.textContent = '×'; x.onclick = closeEditor;
    title.appendChild(x);
    editor.appendChild(title);

    const refresh = () => { renderButtonAgain(b); };
    if (b.type === 'button') {
      editor.appendChild(row('Label', textInput(b.label, v => { b.label = v; refresh(); }, 'blank = key name')));
      if (b.mode !== 'kbd') editor.appendChild(row('Key', keyCapture(b.key, k => { b.key = k; refresh(); })));
      editor.appendChild(row('Mode', dropdown([['hold', 'Hold'], ['toggle', 'Toggle'], ['turbo', 'Turbo (auto-repeat)'], ['type', 'Type (character)'], ['kbd', 'Android keyboard']], b.mode, v => { b.mode = v; if (v === 'kbd' && !b.label) b.label = '⌨'; refresh(); renderEditor(); })));
      if (b.mode === 'kbd') editor.appendChild(row('Keyboard', dropdown([['text', 'Normal'], ['numeric', 'Numbers']], b.kbdMode || 'text', v => { b.kbdMode = v; refresh(); })));
      editor.appendChild(row('Shape', dropdown([['circle', 'Circle'], ['rounded', 'Rounded'], ['square', 'Square']], b.shape, v => { b.shape = v; refresh(); })));
    } else {
      const keyRows = () => {
        for (const [dir, name] of [['up', 'Up'], ['left', 'Left'], ['down', 'Down'], ['right', 'Right']]) {
          editor.appendChild(row(name, keyCapture(b.keys[dir], k => { b.keys[dir] = k; refresh(); })));
        }
      };
      if (b.type === 'look') {
        editor.appendChild(row('Mode', dropdown([['mouse', 'Mouse movement'], ['keys', 'Arrow keys']], b.mode, v => { b.mode = v; refresh(); renderEditor(); })));
        if (b.mode === 'keys') keyRows();
        else {
          editor.appendChild(row('Speed', range(1, 40, b.sens || 12, v => { b.sens = v; refresh(); })));
          editor.appendChild(row('Deadzone', range(0, 0.6, b.deadzone == null ? 0.15 : b.deadzone, v => { b.deadzone = v; refresh(); }, 0.05)));
          editor.appendChild(row('Invert Y', dropdown([['no', 'No'], ['yes', 'Yes']], b.invertY ? 'yes' : 'no', v => { b.invertY = v === 'yes'; refresh(); })));
        }
      } else keyRows();
    }
    editor.appendChild(row('Size', range(b.type === 'button' ? 36 : 90, b.type === 'button' ? 200 : 280, b.size, v => { b.size = v; refresh(); })));
    editor.appendChild(row('Opacity', range(0.2, 1, b.opacity, v => { b.opacity = v; refresh(); }, 0.05)));
    editor.appendChild(row('Color', colorInput(b.color, v => { b.color = v; refresh(); })));

    const actions = document.createElement('div'); actions.className = 'actions';
    const dup = document.createElement('button'); dup.textContent = 'Duplicate';
    dup.onclick = () => { const c = JSON.parse(JSON.stringify(b)); c.id = uid(); delete c.gid; c.x = Math.min(0.95, b.x + 0.06); c.y = Math.min(0.95, b.y + 0.06); cfg.buttons.push(c); save(); renderAll(); select(c.id); };
    const del = document.createElement('button'); del.className = 'del'; del.textContent = 'Delete';
    del.onclick = () => { cfg.buttons = cfg.buttons.filter(z => z.id !== b.id); closeEditor(); save(); renderAll(); };
    actions.append(dup, del);
    if (b.gid) {
      const delPad = document.createElement('button'); delPad.className = 'del'; delPad.textContent = 'Delete whole pad';
      delPad.onclick = () => { const g = b.gid; cfg.buttons = cfg.buttons.filter(z => z.gid !== g); closeEditor(); save(); renderAll(); };
      actions.append(delPad);
    }
    editor.appendChild(actions);
    const hint = document.createElement('div'); hint.className = 'hint'; hint.textContent = 'Drag the button to move it.';
    editor.appendChild(hint);
    editor.classList.add('open');
    positionEditor();
  }
  function renderButtonAgain(b) {
    const old = els.get(b.id);
    if (old) old.remove();
    renderButton(b);
    place(els.get(b.id), b.x, b.y);
    positionEditor();
    save();
  }

  function row(label, input) {
    const r = document.createElement('div'); r.className = 'row';
    const l = document.createElement('label'); l.textContent = label;
    r.append(l, input); return r;
  }
  function textInput(val, on, ph) {
    const i = document.createElement('input'); i.type = 'text'; i.value = val || ''; i.maxLength = 6; i.placeholder = ph || '';
    i.addEventListener('input', () => on(i.value));
    i.addEventListener('keydown', (e) => e.stopPropagation());
    i.addEventListener('keyup', (e) => e.stopPropagation());
    return i;
  }
  function dropdown(opts, val, on) {
    const s = document.createElement('select');
    for (const [v, t] of opts) { const o = document.createElement('option'); o.value = v; o.textContent = t; if (v === val) o.selected = true; s.appendChild(o); }
    s.addEventListener('change', () => on(s.value)); return s;
  }
  function range(min, max, val, on, step) {
    const i = document.createElement('input'); i.type = 'range'; i.min = min; i.max = max; i.step = step || 1; i.value = val;
    i.addEventListener('input', () => on(+i.value)); return i;
  }
  function colorInput(val, on) {
    const i = document.createElement('input'); i.type = 'color'; i.value = val || DEFAULT_COLOR;
    i.addEventListener('input', () => on(i.value)); return i;
  }
  const COMMON = ['W','A','S','D','Space','Shift','Ctrl','Alt','Tab','Esc','Enter','Up','Down','Left','Right','Q','E','R','F','C','V','X','Z','H','1','2','3','4','LMB','RMB'];
  function keyCapture(current, on) {
    const wrap = document.createElement('div'); wrap.className = 'keyrow';
    const inp = document.createElement('input'); inp.type = 'text'; inp.maxLength = 20;
    inp.value = keyLabel(current); inp.placeholder = 'W, space, shift, f5, lmb…';
    const commit = (k) => { if (!k) { inp.classList.add('bad'); return; } inp.classList.remove('bad'); current = k; inp.value = keyLabel(k); on(k); };
    inp.addEventListener('change', () => commit(parseKey(inp.value)));
    inp.addEventListener('focus', () => inp.select());
    inp.addEventListener('keydown', (e) => { e.stopPropagation(); if (e.key === 'Enter') { commit(parseKey(inp.value)); inp.blur(); } });
    inp.addEventListener('keyup', (e) => e.stopPropagation());
    const sel = document.createElement('select'); sel.title = 'Pick a common key';
    const ph = document.createElement('option'); ph.value = ''; ph.textContent = 'Pick'; sel.appendChild(ph);
    for (const n of COMMON) { const o = document.createElement('option'); o.value = n; o.textContent = n; sel.appendChild(o); }
    sel.addEventListener('change', () => { if (sel.value) commit(parseKey(sel.value)); sel.value = ''; });
    const cap = document.createElement('button'); cap.className = 'cap'; cap.textContent = '⌨'; cap.title = 'Press a key on your keyboard to capture it';
    cap.onclick = () => {
      try { if (root.activeElement) root.activeElement.blur(); } catch (e) {}
      inp.value = 'press a key…'; cap.classList.add('listening');
      const handler = (e) => {
        e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
        window.removeEventListener('keydown', handler, true);
        cap.classList.remove('listening');
        if (e.code === 'Escape') { inp.value = keyLabel(current); return; }
        commit({ code: e.code, key: e.key, keyCode: e.keyCode || legacyCode(e.code) });
      };
      window.addEventListener('keydown', handler, true);
    };
    wrap.append(inp, sel, cap);
    return wrap;
  }

  /* ---------- Actions ---------- */
  function addPad() {
    const gid = uid(), size = Math.round(Math.min(54, Math.max(40, Math.min(innerWidth, innerHeight) * 0.12))), pitch = size + 6;
    const rows = [['7', '8', '9', '⌫'], ['4', '5', '6', '⏎'], ['1', '2', '3', '.'], ['0', ':', '-', '⌨']];
    const x0 = Math.min(0.9 - 3 * pitch / innerWidth, 0.5 - 1.5 * pitch / innerWidth), y0 = 0.5 - 1.5 * pitch / innerHeight;
    const made = [];
    rows.forEach((row, r) => row.forEach((c, i) => {
      const key = c === '⌫' ? KEY_BACKSPACE : c === '⏎' ? KEY_ENTER : charKey(c);
      const b = { id: uid(), gid, type: 'button', label: c, key: c === '⌨' ? makeKey('Space') : key, mode: c === '⌨' ? 'kbd' : 'type', kbdMode: 'text',
        size, color: c === '⌨' ? '#7c4dff' : (c === '⌫' ? '#ff5252' : c === '⏎' ? '#76ff03' : '#00f2ff'), shape: 'rounded', opacity: 0.9,
        x: x0 + i * pitch / innerWidth, y: y0 + r * pitch / innerHeight };
      made.push(b);
    }));
    cfg.buttons.push(...made);
    setEdit(true, true);
    save(); renderAll();
  }
  function addButton(type) {
    const b = type === 'look' ? L(0.5, 0.5, 150) : type === 'stick'
      ? { id: uid(), type: 'stick', label: '', keys: { up: makeKey('ArrowUp'), left: makeKey('ArrowLeft'), down: makeKey('ArrowDown'), right: makeKey('ArrowRight') }, size: 150, color: DEFAULT_COLOR, opacity: 0.9, x: 0.5, y: 0.5 }
      : { id: uid(), type: 'button', label: '', key: makeKey('Space'), mode: 'hold', size: 68, color: '#7cff6b', shape: 'circle', opacity: 0.9, x: 0.5, y: 0.5 };
    cfg.buttons.push(b);
    setEdit(true, true);
    save(); renderAll(); select(b.id);
  }
  function setEdit(on, silent) {
    editMode = on;
    if (on) { try { document.exitPointerLock(); } catch (e) {} }   // editing needs real touch positions
    releaseAll(); zoneRoutes.clear();
    editBtn.classList.toggle('on', on);
    editBtn.textContent = on ? '✓ Done' : '✎ Edit';
    layer.classList.toggle('editing', on);
    if (!on) closeEditor();
  }
  function setMenuHidden(h, noSave) {
    menuHidden = h;
    if (h) { try { menu.classList.remove('open'); sheet.classList.remove('open'); } catch (e) {} setEdit(false); }
    dock.classList.toggle('gone', h);
    dot.classList.toggle('show', h);
    if (!h) { menu.classList.remove('open'); }
    layoutAll();
    if (!noSave) { try { chrome.storage.local.set({ fkMenuHidden: h }); } catch (e) {} }
  }
  function setVisible(v, persist) {
    visible = v;
    if (!host) build();
    layer.classList.toggle('off', !v);
    if (v) { mount(true); layoutAll(); }
    if (!v) { releaseAll(); setEdit(false); }
    if (persist) { try { chrome.storage.local.set({ isVisible: v }); } catch (e) {} }
  }

  /* ---------- Profiles & storage ---------- */
  let saveTimer = null, lastWriteAt = 0;
  const clone = (o) => JSON.parse(JSON.stringify(o));
  function save() {
    clearTimeout(saveTimer);
    lastWriteAt = Date.now();
    saveTimer = setTimeout(() => {
      lastWriteAt = Date.now();
      try { chrome.storage.local.set({ fkStore: store }); } catch (e) {}
    }, 150);
  }
  function validate(c) {
    return c && Array.isArray(c.buttons) && c.dock && typeof c.dock.x === 'number' && typeof c.dock.y === 'number';
  }
  function validStore(st) {
    return st && Array.isArray(st.profiles) && st.profiles.length > 0 && st.profiles.every(validate);
  }
  function cleanButtons(list) {
    return list.filter((b) => b && typeof b.x === 'number' && typeof b.y === 'number' && typeof b.size === 'number' && ['button', 'stick', 'look'].includes(b.type))
      .map((b) => Object.assign(clone(b), { id: uid() }));
  }
  function uniqueName(name, exceptId) {
    const taken = new Set(store.profiles.filter((p) => p.id !== exceptId).map((p) => p.name));
    if (!taken.has(name)) return name;
    let i = 2; while (taken.has(name + ' ' + i)) i++;
    return name + ' ' + i;
  }
  function activeProfile() { return store.profiles.find((p) => p.id === store.activeId) || store.profiles[0]; }
  function updateProfileLabel() {
    if (!presetBtn) return;
    const n = activeProfile().name;
    presetBtn.textContent = '☰ ' + (n.length > 11 ? n.slice(0, 10) + '…' : n);
  }
  function setActive(id) {
    store.activeId = id; cfg = activeProfile();
    closeEditor(); renderAll(); updateProfileLabel(); save();
  }
  function addProfile(name, data, activate) {
    const p = { id: uid(), name: uniqueName(name), buttons: cleanButtons(data.buttons), dock: clone(data.dock), zone: Object.assign({}, ZONE_DEFAULT, data.zone ? clone(data.zone) : {}) };
    store.profiles.push(p);
    if (activate) setActive(p.id); else save();
    return p;
  }

  /* ---------- Profile menu ---------- */
  function mkMenuBtn(text, fn, cls) {
    const b = document.createElement('button'); b.textContent = text; if (cls) b.className = cls;
    b.addEventListener('click', fn);
    b.addEventListener('mousedown', (e) => e.preventDefault());
    return b;
  }
  function small(text, cls) { const e = document.createElement('small'); e.textContent = text; if (cls) e.className = cls; return e; }
  function nameRow(initial, okText, onOk, onCancel) {
    const r = document.createElement('div'); r.className = 'nrow';
    const i = document.createElement('input'); i.type = 'text'; i.maxLength = 24; i.value = initial; i.placeholder = 'Profile name';
    const go = () => { const v = i.value.trim(); if (v) onOk(v); };
    i.addEventListener('keydown', (e) => { e.stopPropagation(); if (e.key === 'Enter') go(); else if (e.key === 'Escape') onCancel(); });
    i.addEventListener('keyup', (e) => e.stopPropagation());
    r.append(i, mkMenuBtn(okText, go), mkMenuBtn('✕', onCancel));
    setTimeout(() => { try { i.focus(); i.select(); } catch (e) {} }, 0);
    return r;
  }
  function renderMenu() {
    menu.replaceChildren();
    menu.appendChild(small('My profiles — changes save automatically'));
    for (const p of store.profiles) {
      if (menuMode && menuMode.rename === p.id) {
        menu.appendChild(nameRow(p.name, 'OK', (v) => { p.name = uniqueName(v, p.id); menuMode = null; save(); updateProfileLabel(); renderMenu(); }, () => { menuMode = null; renderMenu(); }));
        continue;
      }
      const row = document.createElement('div'); row.className = 'prow';
      row.append(
        mkMenuBtn((p.id === store.activeId ? '✓ ' : '') + p.name, () => { if (p.id !== store.activeId) setActive(p.id); menu.classList.remove('open'); }, 'pname' + (p.id === store.activeId ? ' on' : '')),
        mkMenuBtn('⋯', () => { menuOpenId = menuOpenId === p.id ? null : p.id; menuMode = null; renderMenu(); }, 'pmore')
      );
      menu.appendChild(row);
      if (menuOpenId === p.id) {
        const act = document.createElement('div'); act.className = 'pact';
        const confirmDel = menuMode && menuMode.del === p.id;
        act.append(
          mkMenuBtn('Rename', () => { menuMode = { rename: p.id }; renderMenu(); }),
          mkMenuBtn('Duplicate', () => { menuOpenId = null; addProfile(p.name + ' copy', p, true); renderMenu(); }),
          mkMenuBtn(store.profiles.length <= 1 ? 'Last one' : confirmDel ? 'Tap again!' : 'Delete', () => {
            if (store.profiles.length <= 1) return;
            if (!confirmDel) { menuMode = { del: p.id }; renderMenu(); return; }
            store.profiles = store.profiles.filter((q) => q.id !== p.id);
            menuOpenId = null; menuMode = null;
            if (store.activeId === p.id) setActive(store.profiles[0].id); else save();
            renderMenu();
          }, 'danger')
        );
        menu.appendChild(act);
      }
    }
    if (menuMode === 'new') {
      menu.appendChild(nameRow(uniqueName(activeProfile().name + ' copy'), 'Save', (v) => { menuMode = null; addProfile(v, cfg, true); menu.classList.remove('open'); }, () => { menuMode = null; renderMenu(); }));
    } else {
      menu.appendChild(mkMenuBtn('＋ Save current as new profile', () => { menuMode = 'new'; menuOpenId = null; renderMenu(); }));
    }
    menu.appendChild(small('Templates (adds a copy you can edit)', 'sec'));
    for (const [name, make] of TEMPLATES) menu.appendChild(mkMenuBtn(name, () => { menu.classList.remove('open'); addProfile(name, make(), true); }));
    const z = zoneCfg();
    menu.appendChild(small('Look area — swipe on one side of the screen to look around', 'sec'));
    menu.appendChild(mkMenuBtn('Look area: ' + (z.on ? 'ON' : 'OFF'), () => { z.on = !z.on; zoneRoutes.clear(); applyZone(); save(); renderMenu(); }, z.on ? 'on' : ''));
    if (z.on) {
      const r1 = document.createElement('div'); r1.className = 'prow';
      r1.append(
        mkMenuBtn('Side: ' + (z.side === 'right' ? 'Right' : 'Left'), () => { z.side = z.side === 'right' ? 'left' : 'right'; applyZone(); save(); renderMenu(); }, 'pname'),
        mkMenuBtn('Width: ' + Math.round(z.width * 100) + '%', () => { const i = ZONE_WIDTHS.indexOf(z.width); z.width = ZONE_WIDTHS[(i + 1) % ZONE_WIDTHS.length]; applyZone(); save(); renderMenu(); }, 'pname')
      );
      menu.appendChild(r1);
      const r2 = document.createElement('div'); r2.className = 'prow';
      r2.append(
        mkMenuBtn('Speed: ' + z.sens + 'x', () => { const i = ZONE_SENS.indexOf(z.sens); z.sens = ZONE_SENS[(i + 1) % ZONE_SENS.length]; save(); renderMenu(); }, 'pname'),
        mkMenuBtn('Invert Y: ' + (z.invertY ? 'on' : 'off'), () => { z.invertY = !z.invertY; save(); renderMenu(); }, 'pname')
      );
      menu.appendChild(r2);
      menu.appendChild(mkMenuBtn('Show area tint: ' + (z.show ? 'on' : 'off'), () => { z.show = !z.show; applyZone(); save(); renderMenu(); }));
      menu.appendChild(small('Buttons and sticks on top of the area still work normally.'));
    }
    menu.appendChild(small('Backup & tools', 'sec'));
    const tools = document.createElement('div'); tools.className = 'prow';
    tools.append(
      mkMenuBtn('Export', () => openSheet('export'), 'pname'),
      mkMenuBtn('Import', () => openSheet('import'), 'pname'),
      mkMenuBtn(dbgOn ? 'Log: on' : 'Log: off', () => { dbgOn = !dbgOn; dbgEl.classList.toggle('on', dbgOn); dbgEl.textContent = ''; renderMenu(); }, 'pname' + (dbgOn ? ' on' : ''))
    );
    menu.appendChild(tools);
    menu.appendChild(mkMenuBtn('Mouse lock: ' + LOCK_LABEL[lockMode], () => {
      lockMode = lockMode === 'auto' ? 'fake' : lockMode === 'fake' ? 'real' : 'auto';
      applyLockMode(); try { chrome.storage.local.set({ fkLock: lockMode }); } catch (e) {}
      renderMenu();
    }));
    menu.appendChild(small('Pretend = the game thinks the mouse is locked, but touches keep working.', 'sec'));
    positionMenu();
  }

  function openSheet(kind) {
    menu.classList.remove('open');
    sheet.replaceChildren();
    const h = document.createElement('h4'); h.textContent = kind === 'export' ? 'Export all profiles (copy this text)' : 'Import profiles (paste text, then Import)';
    const ta = document.createElement('textarea'); ta.spellcheck = false;
    const msg = document.createElement('div'); msg.className = 'msg';
    ta.addEventListener('keydown', (e) => e.stopPropagation()); ta.addEventListener('keyup', (e) => e.stopPropagation());
    const bar = document.createElement('div'); bar.className = 'bar';
    const close = document.createElement('button'); close.textContent = 'Close'; close.onclick = () => sheet.classList.remove('open');
    if (kind === 'export') {
      ta.readOnly = true; ta.value = JSON.stringify({ fk: 1, profiles: store.profiles });
      const copy = document.createElement('button'); copy.textContent = 'Copy';
      copy.onclick = async () => {
        try { await navigator.clipboard.writeText(ta.value); msg.textContent = 'Copied.'; }
        catch (e) { ta.focus(); ta.select(); try { document.execCommand('copy'); msg.textContent = 'Copied.'; } catch (e2) { msg.textContent = 'Select the text and copy it manually.'; } }
      };
      bar.append(copy, close);
    } else {
      ta.placeholder = 'Paste exported text here';
      const imp = document.createElement('button'); imp.textContent = 'Import';
      imp.onclick = () => {
        let data;
        try { data = JSON.parse(ta.value); } catch (e) { msg.style.color = '#f88'; msg.textContent = 'That is not valid exported text.'; return; }
        const list = Array.isArray(data && data.profiles) ? data.profiles : (data && Array.isArray(data.buttons) ? [{ name: 'Imported', buttons: data.buttons, dock: data.dock || { x: 0.5, y: 0.05 } }] : []);
        const ok = list.filter((q) => q && Array.isArray(q.buttons) && cleanButtons(q.buttons).length);
        if (!ok.length) { msg.style.color = '#f88'; msg.textContent = 'No usable layout found.'; return; }
        let first = null;
        for (const q of ok) {
          const dock = q.dock && typeof q.dock.x === 'number' && typeof q.dock.y === 'number' ? q.dock : { x: 0.5, y: 0.05 };
          const np = addProfile(String(q.name || 'Imported').slice(0, 24), { buttons: q.buttons, dock, zone: q.zone }, false);
          first = first || np;
        }
        setActive(first.id);
        msg.style.color = '#9f9'; msg.textContent = 'Imported ' + ok.length + ' profile(s).';
      };
      bar.append(imp, close);
    }
    sheet.append(h, ta, msg, bar);
    sheet.classList.add('open');
  }

  async function init() {
    let data = {};
    try { data = await chrome.storage.local.get(['fkStore', 'floatCfg', 'isVisible', 'fkLock', 'fkMenuHidden', 'fkDot']); } catch (e) {}
    if (['auto', 'fake', 'real'].includes(data.fkLock)) lockMode = data.fkLock;
    applyLockMode();
    if (validStore(data.fkStore)) store = data.fkStore;
    else if (validate(data.floatCfg)) {
      // Upgrade from version 2.x: your existing layout becomes the first profile.
      const p = { id: uid(), name: 'My layout', buttons: data.floatCfg.buttons, dock: data.floatCfg.dock };
      store = { activeId: p.id, profiles: [p] };
    } else {
      const d = defaults();
      const p = { id: uid(), name: 'Default', buttons: d.buttons, dock: d.dock };
      store = { activeId: p.id, profiles: [p] };
    }
    cfg = activeProfile();
    build();
    updateProfileLabel();
    renderAll();
    if (data.fkDot && typeof data.fkDot.x === 'number' && typeof data.fkDot.y === 'number') dotPos = data.fkDot;
    setMenuHidden(!!data.fkMenuHidden, true);
    setVisible(!!data.isVisible, false);
    if (!validStore(data.fkStore)) save();
  }

  chrome.storage.onChanged.addListener((ch, area) => {
    if (area !== 'local' || !host) return;
    if (ch.isVisible && ch.isVisible.newValue !== visible) setVisible(!!ch.isVisible.newValue, false);
    if (ch.fkMenuHidden && !!ch.fkMenuHidden.newValue !== menuHidden) setMenuHidden(!!ch.fkMenuHidden.newValue, true);
    if (ch.fkDot && ch.fkDot.newValue && typeof ch.fkDot.newValue.x === 'number') { dotPos = ch.fkDot.newValue; layoutAll(); }
    if (ch.fkLock && ['auto', 'fake', 'real'].includes(ch.fkLock.newValue)) { lockMode = ch.fkLock.newValue; applyLockMode(); }
    // Layout changed from another tab: adopt it, but never while we are editing, touching, or just saved ourselves.
    if (ch.fkStore && validStore(ch.fkStore.newValue) && !editMode && !routes.size && !held.size &&
        Date.now() - lastWriteAt > 1500 && JSON.stringify(ch.fkStore.newValue) !== JSON.stringify(store)) {
      store = ch.fkStore.newValue; cfg = activeProfile();
      renderAll(); updateProfileLabel();
      if (menu.classList.contains('open')) renderMenu();
    }
  });
  chrome.runtime.onMessage.addListener((m) => {
    if (m && m.action === 'toggle') setVisible(!!m.isVisible, false);
  });

  init();
})();
