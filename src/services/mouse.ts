export enum MOUSE_BUTTONS {
  LEFT,
  MIDDLE,
  RIGHT
};

export interface Point {
  x: number,
  y: number
};

const binds = {};

export function bindClick(button: MOUSE_BUTTONS, callback: Function): void {
  if (binds[button]) {
    return binds[button].callbacks.push(callback);
  }

  binds[button] = {
    pressed: false,
    callbacks: [callback],
  };
}

function handleClickDown(e: MouseEvent) {
  const { button } = e;

  if (!binds[button]) return;

  binds[button].pressed = false;
}

function handleClickUp(e: MouseEvent): void {
  const { button } = e;

  if (!binds[button] || binds[button].pressed) return;

  const point = { x: e.offsetX, y: e.offsetY };

  binds[button].callbacks.forEach((callback: Function) =>
    callback.call(null, point, e.target)
  );
  binds[button].pressed = true;
}

window.addEventListener("mouseup", handleClickDown, false);
window.addEventListener("mousedown", handleClickUp, false);
