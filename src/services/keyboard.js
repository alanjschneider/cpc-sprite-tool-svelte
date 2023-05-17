const binds = {};

export function bindKey(key, callback) {
  if (binds[key]) return;

  binds[key] = {
    pressed: false,
    callback,
  };
}

function handleKeyUp(event) {
  const { key } = event;

  if (!binds[key]) return;

  binds[key].pressed = false;
}

function handleKeyDown(event) {
  const { key } = event;

  if (!binds[key] || binds[key].pressed) return;

  binds[key].pressed = true;
  binds[key].callback.call();
}

window.addEventListener("keydown", handleKeyDown, false);
window.addEventListener("keyup", handleKeyUp, false);
