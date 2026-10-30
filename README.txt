Float Keys 2.4 - draggable, customizable floating buttons

INSTALL / UPDATE
- Do NOT remove the old version first if you want to keep your layout (removing deletes saved data).
  Update in place (Reload / replace) if your browser allows it. Your old layout is converted
  automatically into a profile called "My layout".

USE
- Toolbar icon = show/hide. The on-screen toolbar is draggable by the grip.
- + Button / + Stick (WASD-style keys) / + Look (camera stick).
- Edit: drag buttons to move, tap one to edit it. Done locks positions.
- Key box: type a name (w, space, shift, ctrl, alt, tab, esc, enter, up/down/left/right,
  f1-f12, 1-9, lmb, rmb, mmb), or use Pick, or the keyboard icon to capture.
- Modes: Hold, Toggle, Turbo.

PROFILES (the toolbar button showing the profile name)
- Every change auto-saves into the ACTIVE profile.
- "Save current as new profile" copies the current layout into a new profile and switches to it.
- Tap a name to switch. "..." = Rename / Duplicate / Delete (tap Delete twice).
- Templates add a copy you can edit: Default, GTA V (with look stick), My layout (from screenshot).
- Backup & tools: Export (copy text), Import (paste text), Log (on-screen touch diagnostics).

LOOK STICK
- Mouse movement mode: sends mouse-move (movementX/Y) to the game; set Speed, Deadzone, Invert Y.
- Arrow keys mode: presses the four keys you choose.
- Works only if the site reads synthetic mouse movement / keys.

FULLSCREEN
- The fullscreen button on the toolbar fullscreens the whole page, so the buttons stay.
- If another extension/site fullscreens a video/canvas/iframe (which cannot contain buttons),
  Float Keys stretches that element to fill the window and moves fullscreen to the page.
  Press Esc or the fullscreen button to restore the page.

NOTES
- Works on the top page only. A desktop game (GTA V app) cannot be controlled from a browser;
  this only works on web pages that accept synthetic key/mouse events.

2.4: sticks and the look stick keep working while the game has the mouse locked (pointer lock).
     Previously a lock dropped the held stick and froze its direction until the pause menu.
     Profiles -> Log now also shows pointer type and lock state for each touch.

2.5: TOUCH + MOUSE LOCK FIX
- Real browser mouse lock makes touch fingers report position 0,0, so sticks froze. On touch, Float Keys
  now answers the game's lock request itself ("pretend lock"): the game thinks the mouse is locked and
  listens for mouse movement (the Look stick feeds it), but your fingers keep working normally.
- The Esc button releases the pretend lock like the browser would.
- Profiles menu -> "Mouse lock": Auto (pretend on touch) / Always pretend / Real browser lock.
- Edit mode releases any lock and moving buttons no longer fails while the game has the mouse locked.
- Needs a Chromium that supports MAIN-world content scripts (Chrome 111+).

2.6: HIDE THE MENU
- The "..." button next to the fullscreen button hides the whole menu; only your game buttons stay.
- A small "..." dot appears (top right by default). Tap it to bring the menu back, drag it to move it.
- Hidden/shown state and the dot position are remembered (all profiles, after reload).

2.7: LOOK AREA (swipe to look, like mobile games)
- Profiles menu -> "Look area": swipe anywhere on the right half of the screen to move the camera.
  It sends the same camera movement the Look stick does, so it works wherever the Look stick works (GTA V in the browser).
- Options: Side (Right/Left), Width (30-70%), Speed (0.5x-6x), Invert Y, Show area tint.
- Your buttons and sticks sit on top of the area and keep working; a finger on them never turns the camera.
- Saved per profile. Existing profiles get it switched on (Right, 50%, 1.5x). Turn it off in the same menu.
- In Edit mode the area is shown as a tint and ignores touches so you can still move buttons.

2.8: camera output now sends pointermove + mousemove (like a real mouse). Profiles -> Log shows "look area: touch" and
     "look dx,dy -> target lock:pretend/real/none" while you swipe, to help find why a game ignores the camera.

2.9: Browser ports of GTA (Emscripten/SDL, e.g. DOS.Zone style) only request mouse lock from inside a click/key event
     they receive. Float Keys blocks touches on its buttons and the look area, so the game never got that chance and
     ignored camera movement. The Look stick and Look area now send the game a harmless "mouse released" first
     (only while no lock is active), so it can request the lock. Log shows "wake: ..." when this happens.

2.9.1: Fixed "Look area: ON/OFF" (and Side / Width / Speed / Invert / tint) doing nothing: the menu was changing
       an outdated copy of the setting. Now the area can be turned off (and stays off after reload).

3.0: TYPING (number pad + Android keyboard)
- Menu -> "+ Pad" adds a number pad: 0-9 . : - plus Backspace (hold to keep deleting), Enter and a keyboard button.
  The whole pad moves together in Edit mode ("Delete whole pad" in its editor removes it).
- Pad keys use the new button mode "Type (character)": it sends key down + keypress (the typed character) + key up,
  which browser games need for text boxes, and it also types into a normal web text field if one is focused.
- Button mode "Android keyboard" shows/hides your phone's keyboard (Normal or Numbers). What you type is forwarded
  the same way; a small bar at the top shows the last characters. The buttons do not move while the keyboard is open.
- Tip: tap the game's text box first (so it is focused), then use the pad or keyboard.
