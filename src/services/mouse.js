export const LEFT_CLICK = 0;
export const MIDDLE_CLICK = 0;
export const RIGHT_CLICK = 0;

const binds = {};

export function bindClick(button, callback) {
  if (binds[button]) {
    return binds[button].callbacks.push(callback);
  }

  binds[button] = {
    pressed: false,
    callbacks: [callback],
  };
}

function handleClickDown(e) {
  const { button } = e;

  if (!binds[button]) return;

  binds[button].pressed = false;
}

function handleClickUp(e) {
  const { button } = e;

  if (!binds[button] || binds[button].pressed) return;

  const point = { x: e.offsetX, y: e.offsetY };

  binds[button].callbacks.forEach((callback) =>
    callback.call(null, point, e.target)
  );
  binds[button].pressed = true;
}

window.addEventListener("mouseup", handleClickDown, false);
window.addEventListener("mousedown", handleClickUp, false);
