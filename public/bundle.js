
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        if (node.parentNode) {
            node.parentNode.removeChild(node);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function init_binding_group(group) {
        let _inputs;
        return {
            /* push */ p(...inputs) {
                _inputs = inputs;
                _inputs.forEach(input => group.push(input));
            },
            /* remove */ r() {
                _inputs.forEach(input => group.splice(group.indexOf(input), 1));
            }
        };
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail, { bubbles = false, cancelable = false } = {}) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, cancelable, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    /**
     * The `onMount` function schedules a callback to run as soon as the component has been mounted to the DOM.
     * It must be called during the component's initialisation (but doesn't need to live *inside* the component;
     * it can be called from an external module).
     *
     * `onMount` does not run inside a [server-side component](/docs#run-time-server-side-component-api).
     *
     * https://svelte.dev/docs#run-time-svelte-onmount
     */
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    /**
     * Creates an event dispatcher that can be used to dispatch [component events](/docs#template-syntax-component-directives-on-eventname).
     * Event dispatchers are functions that can take two arguments: `name` and `detail`.
     *
     * Component events created with `createEventDispatcher` create a
     * [CustomEvent](https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent).
     * These events do not [bubble](https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Building_blocks/Events#Event_bubbling_and_capture).
     * The `detail` argument corresponds to the [CustomEvent.detail](https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent/detail)
     * property and can contain any type of data.
     *
     * https://svelte.dev/docs#run-time-svelte-createeventdispatcher
     */
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail, { cancelable = false } = {}) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail, { cancelable });
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
                return !event.defaultPrevented;
            }
            return true;
        };
    }

    const dirty_components = [];
    const binding_callbacks = [];
    let render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = /* @__PURE__ */ Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        // Do not reenter flush while dirty components are updated, as this can
        // result in an infinite loop. Instead, let the inner flush handle it.
        // Reentrancy is ok afterwards for bindings etc.
        if (flushidx !== 0) {
            return;
        }
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            try {
                while (flushidx < dirty_components.length) {
                    const component = dirty_components[flushidx];
                    flushidx++;
                    set_current_component(component);
                    update(component.$$);
                }
            }
            catch (e) {
                // reset dirty state to not end up in a deadlocked state and then rethrow
                dirty_components.length = 0;
                flushidx = 0;
                throw e;
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        seen_callbacks.clear();
        set_current_component(saved_component);
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    /**
     * Useful for example to execute remaining `afterUpdate` callbacks before executing `destroy`.
     */
    function flush_render_callbacks(fns) {
        const filtered = [];
        const targets = [];
        render_callbacks.forEach((c) => fns.indexOf(c) === -1 ? filtered.push(c) : targets.push(c));
        targets.forEach((c) => c());
        render_callbacks = filtered;
    }
    const outroing = new Set();
    let outros;
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
        else if (callback) {
            callback();
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = component.$$.on_mount.map(run).filter(is_function);
                // if the component was destroyed immediately
                // it will update the `$$.on_destroy` reference to `null`.
                // the destructured on_destroy may still reference to the old array
                if (component.$$.on_destroy) {
                    component.$$.on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            flush_render_callbacks($$.after_update);
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: [],
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            if (!is_function(callback)) {
                return noop;
            }
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.59.1' }, detail), { bubbles: true }));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation, has_stop_immediate_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        if (has_stop_immediate_propagation)
            modifiers.push('stopImmediatePropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev('SvelteDOMSetProperty', { node, property, value });
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src/components/Output.svelte generated by Svelte v3.59.1 */

    const file$3 = "src/components/Output.svelte";

    function create_fragment$3(ctx) {
    	let textarea;

    	const block = {
    		c: function create() {
    			textarea = element("textarea");
    			attr_dev(textarea, "cols", "32");
    			attr_dev(textarea, "rows", "16");
    			textarea.value = /*value*/ ctx[0];
    			attr_dev(textarea, "class", "svelte-1rjcr1r");
    			add_location(textarea, file$3, 4, 0, 40);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, textarea, anchor);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*value*/ 1) {
    				prop_dev(textarea, "value", /*value*/ ctx[0]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(textarea);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Output', slots, []);
    	let { value } = $$props;

    	$$self.$$.on_mount.push(function () {
    		if (value === undefined && !('value' in $$props || $$self.$$.bound[$$self.$$.props['value']])) {
    			console.warn("<Output> was created without expected prop 'value'");
    		}
    	});

    	const writable_props = ['value'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Output> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('value' in $$props) $$invalidate(0, value = $$props.value);
    	};

    	$$self.$capture_state = () => ({ value });

    	$$self.$inject_state = $$props => {
    		if ('value' in $$props) $$invalidate(0, value = $$props.value);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [value];
    }

    class Output extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { value: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Output",
    			options,
    			id: create_fragment$3.name
    		});
    	}

    	get value() {
    		throw new Error("<Output>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set value(value) {
    		throw new Error("<Output>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    const FORMAT_8X8 = `name:
    db #n, #n
    db #n, #n
    db #n, #n
    db #n, #n
    db #n, #n
    db #n, #n
    db #n, #n
    db #n, #n
`;

    const LEFT_CLICK = 0;

    const binds$1 = {};

    function bindClick(button, callback) {
      if (binds$1[button]) {
        return binds$1[button].callbacks.push(callback);
      }

      binds$1[button] = {
        pressed: false,
        callbacks: [callback],
      };
    }

    function handleClickDown(e) {
      const { button } = e;

      if (!binds$1[button]) return;

      binds$1[button].pressed = false;
    }

    function handleClickUp(e) {
      const { button } = e;

      if (!binds$1[button] || binds$1[button].pressed) return;

      const point = { x: e.offsetX, y: e.offsetY };

      binds$1[button].callbacks.forEach((callback) =>
        callback.call(null, point, e.target)
      );
      binds$1[button].pressed = true;
    }

    window.addEventListener("mouseup", handleClickDown, false);
    window.addEventListener("mousedown", handleClickUp, false);

    function toHex(number) {
      const hexNumber = number.toString(16).toUpperCase();
      return hexNumber.length > 1 ? hexNumber : "0".concat(hexNumber);
    }

    const COLORS = {
      BLUE: { code: "#000080", bitmask: 0b00000000 },
      YELLOW: { code: "#FFFF00", bitmask: 0b00010000 },
      CYAN: { code: "#00FFFF", bitmask: 0b00000001 },
      RED: { code: "#FF0000", bitmask: 0b00010001 },
    };

    function Pixel(x, y, size, color, padding = 0) {
      this.x = x;
      this.y = y;
      this.size = size;
      this.color = color;
      this.padding = padding;
    }

    Pixel.prototype.render = function (ctx) {
      ctx.fillStyle = this.color.code;
      const x = this.x + this.padding;
      const y = this.y + this.padding;
      const size = this.size - this.padding * 2;
      ctx.fillRect(x, y, size, size);
    };

    Pixel.prototype.intersectsWithPoint = function (point) {
      if (point.x > this.x + this.size || point.x < this.x) return false;
      if (point.y > this.y + this.size || point.y < this.y) return false;
      return true;
    };

    /* src/components/Canvas.svelte generated by Svelte v3.59.1 */
    const file$2 = "src/components/Canvas.svelte";

    function create_fragment$2(ctx) {
    	let canvas_1;

    	const block = {
    		c: function create() {
    			canvas_1 = element("canvas");
    			add_location(canvas_1, file$2, 119, 0, 2852);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, canvas_1, anchor);
    			/*canvas_1_binding*/ ctx[4](canvas_1);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(canvas_1);
    			/*canvas_1_binding*/ ctx[4](null);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const CANVAS_SIZE = 600;
    const PIXEL_GAP = 1;
    const SPRITE_SIZE_PX = 8;

    function renderSprite(ctx, sprite) {
    	for (let i = 0; i < sprite.length; i++) {
    		const pixel = sprite[i];
    		pixel.render(ctx);
    	}
    }

    function getPixelByPoint(point, sprite) {
    	for (let i = 0; i < sprite.length; i++) {
    		const pixel = sprite[i];
    		if (pixel.intersectsWithPoint(point)) return pixel;
    	}

    	return null;
    }

    function colorCodesToAssembly(colorCodes, spriteName, format) {
    	let assembly = format.replace("name", spriteName);

    	for (let i = 0; i < colorCodes.length; i++) {
    		assembly = assembly.replace("n", colorCodes[i]);
    	}

    	return assembly;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Canvas', slots, []);
    	const PIXEL_SIZE = CANVAS_SIZE / SPRITE_SIZE_PX;
    	let { actualColor = COLORS.BLUE } = $$props;
    	let canvas;
    	let ctx;
    	let sprite;
    	onMount(main);

    	function main() {
    		bindClick(LEFT_CLICK, (point, target) => {
    			if (target !== canvas) return;
    			const pixel = getPixelByPoint(point, sprite);
    			if (pixel === null) return;
    			pixel.color = actualColor;
    			clearContext(ctx);
    			renderSprite(ctx, sprite);
    		});

    		$$invalidate(0, canvas.width = CANVAS_SIZE, canvas);
    		$$invalidate(0, canvas.height = CANVAS_SIZE, canvas);
    		ctx = canvas.getContext("2d");
    		sprite = createEmptySprite();
    		clearContext(ctx);
    		renderSprite(ctx, sprite);
    	}

    	function clearCanvas() {
    		sprite = createEmptySprite();
    		clearContext(ctx);
    		renderSprite(ctx, sprite);
    	}

    	function getAssemblySprite() {
    		const colorCodes = getColorCodes(sprite);
    		return colorCodesToAssembly(colorCodes, "sprite", FORMAT_8X8);
    	}

    	function clearContext(ctx) {
    		ctx.fillStyle = "#000";
    		ctx.fillRect(0, 0, canvas.width, canvas.height);
    	}

    	function createEmptySprite() {
    		const sprite = [];
    		const PIXEL_COUNT = SPRITE_SIZE_PX * SPRITE_SIZE_PX;

    		for (let i = 0; i < PIXEL_COUNT; i++) {
    			let x = i % SPRITE_SIZE_PX * PIXEL_SIZE;
    			let y = ~~(i / SPRITE_SIZE_PX) * PIXEL_SIZE;
    			const pixel = new Pixel(x, y, PIXEL_SIZE, COLORS.BLUE, PIXEL_GAP);
    			sprite.push(pixel);
    		}

    		return sprite;
    	}

    	function getColorCodes(sprite) {
    		const colorCodes = [];

    		for (let i = 0; i < sprite.length; i += 4) {
    			let colorCode = 0;
    			colorCode += sprite[i].color.bitmask << 3;
    			colorCode += sprite[i + 1].color.bitmask << 2;
    			colorCode += sprite[i + 2].color.bitmask << 1;
    			colorCode += sprite[i + 3].color.bitmask;
    			colorCodes.push(toHex(colorCode));
    		}

    		return colorCodes;
    	}

    	const writable_props = ['actualColor'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Canvas> was created with unknown prop '${key}'`);
    	});

    	function canvas_1_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			canvas = $$value;
    			$$invalidate(0, canvas);
    		});
    	}

    	$$self.$$set = $$props => {
    		if ('actualColor' in $$props) $$invalidate(1, actualColor = $$props.actualColor);
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		FORMAT_8X8,
    		bindClick,
    		LEFT_CLICK,
    		toHex,
    		COLORS,
    		Pixel,
    		CANVAS_SIZE,
    		PIXEL_GAP,
    		SPRITE_SIZE_PX,
    		PIXEL_SIZE,
    		actualColor,
    		canvas,
    		ctx,
    		sprite,
    		main,
    		clearCanvas,
    		getAssemblySprite,
    		clearContext,
    		renderSprite,
    		createEmptySprite,
    		getPixelByPoint,
    		getColorCodes,
    		colorCodesToAssembly
    	});

    	$$self.$inject_state = $$props => {
    		if ('actualColor' in $$props) $$invalidate(1, actualColor = $$props.actualColor);
    		if ('canvas' in $$props) $$invalidate(0, canvas = $$props.canvas);
    		if ('ctx' in $$props) ctx = $$props.ctx;
    		if ('sprite' in $$props) sprite = $$props.sprite;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [canvas, actualColor, clearCanvas, getAssemblySprite, canvas_1_binding];
    }

    class Canvas extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {
    			actualColor: 1,
    			clearCanvas: 2,
    			getAssemblySprite: 3
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Canvas",
    			options,
    			id: create_fragment$2.name
    		});
    	}

    	get actualColor() {
    		throw new Error("<Canvas>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set actualColor(value) {
    		throw new Error("<Canvas>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get clearCanvas() {
    		return this.$$.ctx[2];
    	}

    	set clearCanvas(value) {
    		throw new Error("<Canvas>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get getAssemblySprite() {
    		return this.$$.ctx[3];
    	}

    	set getAssemblySprite(value) {
    		throw new Error("<Canvas>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    const binds = {};

    function bindKey(key, callback) {
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

    /* src/components/Palette.svelte generated by Svelte v3.59.1 */
    const file$1 = "src/components/Palette.svelte";

    function create_fragment$1(ctx) {
    	let div;
    	let label0;
    	let input0;
    	let t0;
    	let label1;
    	let input1;
    	let t1;
    	let label2;
    	let input2;
    	let t2;
    	let label3;
    	let input3;
    	let binding_group;
    	let mounted;
    	let dispose;
    	binding_group = init_binding_group(/*$$binding_groups*/ ctx[3][0]);

    	const block = {
    		c: function create() {
    			div = element("div");
    			label0 = element("label");
    			input0 = element("input");
    			t0 = space();
    			label1 = element("label");
    			input1 = element("input");
    			t1 = space();
    			label2 = element("label");
    			input2 = element("input");
    			t2 = space();
    			label3 = element("label");
    			input3 = element("input");
    			attr_dev(input0, "type", "radio");
    			attr_dev(input0, "name", "selectedValue");
    			input0.__value = 0;
    			input0.value = input0.__value;
    			attr_dev(input0, "class", "svelte-1qsk4dc");
    			add_location(input0, file$1, 44, 4, 1068);
    			attr_dev(label0, "id", "blue");
    			attr_dev(label0, "class", "svelte-1qsk4dc");
    			toggle_class(label0, "selected", /*selected*/ ctx[0] === 0);
    			add_location(label0, file$1, 43, 2, 1014);
    			attr_dev(input1, "type", "radio");
    			attr_dev(input1, "name", "selectedValue");
    			input1.__value = 1;
    			input1.value = input1.__value;
    			attr_dev(input1, "class", "svelte-1qsk4dc");
    			add_location(input1, file$1, 53, 4, 1276);
    			attr_dev(label1, "id", "yellow");
    			attr_dev(label1, "class", "svelte-1qsk4dc");
    			toggle_class(label1, "selected", /*selected*/ ctx[0] === 1);
    			add_location(label1, file$1, 52, 2, 1220);
    			attr_dev(input2, "type", "radio");
    			attr_dev(input2, "name", "selectedValue");
    			input2.__value = 2;
    			input2.value = input2.__value;
    			attr_dev(input2, "class", "svelte-1qsk4dc");
    			add_location(input2, file$1, 62, 4, 1482);
    			attr_dev(label2, "id", "cyan");
    			attr_dev(label2, "class", "svelte-1qsk4dc");
    			toggle_class(label2, "selected", /*selected*/ ctx[0] === 2);
    			add_location(label2, file$1, 61, 2, 1428);
    			attr_dev(input3, "type", "radio");
    			attr_dev(input3, "name", "selectedValue");
    			input3.__value = 3;
    			input3.value = input3.__value;
    			attr_dev(input3, "class", "svelte-1qsk4dc");
    			add_location(input3, file$1, 71, 4, 1687);
    			attr_dev(label3, "id", "red");
    			attr_dev(label3, "class", "svelte-1qsk4dc");
    			toggle_class(label3, "selected", /*selected*/ ctx[0] === 3);
    			add_location(label3, file$1, 70, 2, 1634);
    			attr_dev(div, "class", "svelte-1qsk4dc");
    			add_location(div, file$1, 42, 0, 1006);
    			binding_group.p(input0, input1, input2, input3);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, label0);
    			append_dev(label0, input0);
    			input0.checked = input0.__value === /*selected*/ ctx[0];
    			append_dev(div, t0);
    			append_dev(div, label1);
    			append_dev(label1, input1);
    			input1.checked = input1.__value === /*selected*/ ctx[0];
    			append_dev(div, t1);
    			append_dev(div, label2);
    			append_dev(label2, input2);
    			input2.checked = input2.__value === /*selected*/ ctx[0];
    			append_dev(div, t2);
    			append_dev(div, label3);
    			append_dev(label3, input3);
    			input3.checked = input3.__value === /*selected*/ ctx[0];

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "click", /*handleColorChange*/ ctx[1], false, false, false, false),
    					listen_dev(input0, "change", /*input0_change_handler*/ ctx[2]),
    					listen_dev(input1, "click", /*handleColorChange*/ ctx[1], false, false, false, false),
    					listen_dev(input1, "change", /*input1_change_handler*/ ctx[4]),
    					listen_dev(input2, "change", /*input2_change_handler*/ ctx[5]),
    					listen_dev(input2, "click", /*handleColorChange*/ ctx[1], false, false, false, false),
    					listen_dev(input3, "click", /*handleColorChange*/ ctx[1], false, false, false, false),
    					listen_dev(input3, "change", /*input3_change_handler*/ ctx[6])
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*selected*/ 1) {
    				input0.checked = input0.__value === /*selected*/ ctx[0];
    			}

    			if (dirty & /*selected*/ 1) {
    				toggle_class(label0, "selected", /*selected*/ ctx[0] === 0);
    			}

    			if (dirty & /*selected*/ 1) {
    				input1.checked = input1.__value === /*selected*/ ctx[0];
    			}

    			if (dirty & /*selected*/ 1) {
    				toggle_class(label1, "selected", /*selected*/ ctx[0] === 1);
    			}

    			if (dirty & /*selected*/ 1) {
    				input2.checked = input2.__value === /*selected*/ ctx[0];
    			}

    			if (dirty & /*selected*/ 1) {
    				toggle_class(label2, "selected", /*selected*/ ctx[0] === 2);
    			}

    			if (dirty & /*selected*/ 1) {
    				input3.checked = input3.__value === /*selected*/ ctx[0];
    			}

    			if (dirty & /*selected*/ 1) {
    				toggle_class(label3, "selected", /*selected*/ ctx[0] === 3);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			binding_group.r();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Palette', slots, []);
    	const dispatch = createEventDispatcher();
    	let selected = 0; // BLUE

    	// Sends to listeners a default value
    	dispatch("colorChange", { color: COLORS.BLUE });

    	function handleColorChange() {
    		const color = getColorByValue(this.value);
    		dispatch("colorChange", { color });
    	}

    	// Color selection shortcuts
    	bindKey("1", () => {
    		$$invalidate(0, selected = 0);
    		dispatch("colorChange", { color: COLORS.BLUE });
    	});

    	bindKey("2", () => {
    		$$invalidate(0, selected = 1);
    		dispatch("colorChange", { color: COLORS.YELLOW });
    	});

    	bindKey("3", () => {
    		$$invalidate(0, selected = 2);
    		dispatch("colorChange", { color: COLORS.CYAN });
    	});

    	bindKey("4", () => {
    		$$invalidate(0, selected = 3);
    		dispatch("colorChange", { color: COLORS.RED });
    	});

    	function getColorByValue(number) {
    		return [COLORS.BLUE, COLORS.YELLOW, COLORS.CYAN, COLORS.RED][number];
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Palette> was created with unknown prop '${key}'`);
    	});

    	const $$binding_groups = [[]];

    	function input0_change_handler() {
    		selected = this.__value;
    		$$invalidate(0, selected);
    	}

    	function input1_change_handler() {
    		selected = this.__value;
    		$$invalidate(0, selected);
    	}

    	function input2_change_handler() {
    		selected = this.__value;
    		$$invalidate(0, selected);
    	}

    	function input3_change_handler() {
    		selected = this.__value;
    		$$invalidate(0, selected);
    	}

    	$$self.$capture_state = () => ({
    		COLORS,
    		bindKey,
    		createEventDispatcher,
    		dispatch,
    		selected,
    		handleColorChange,
    		getColorByValue
    	});

    	$$self.$inject_state = $$props => {
    		if ('selected' in $$props) $$invalidate(0, selected = $$props.selected);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		selected,
    		handleColorChange,
    		input0_change_handler,
    		$$binding_groups,
    		input1_change_handler,
    		input2_change_handler,
    		input3_change_handler
    	];
    }

    class Palette extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Palette",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src/App.svelte generated by Svelte v3.59.1 */
    const file = "src/App.svelte";

    function create_fragment(ctx) {
    	let div1;
    	let canvas_1;
    	let t0;
    	let div0;
    	let palette;
    	let t1;
    	let button0;
    	let t3;
    	let button1;
    	let t5;
    	let output;
    	let current;
    	let mounted;
    	let dispose;
    	let canvas_1_props = { actualColor: /*actualColor*/ ctx[2] };
    	canvas_1 = new Canvas({ props: canvas_1_props, $$inline: true });
    	/*canvas_1_binding*/ ctx[6](canvas_1);
    	palette = new Palette({ $$inline: true });
    	palette.$on("colorChange", /*handleColorChange*/ ctx[3]);

    	output = new Output({
    			props: { value: /*value*/ ctx[1] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			create_component(canvas_1.$$.fragment);
    			t0 = space();
    			div0 = element("div");
    			create_component(palette.$$.fragment);
    			t1 = space();
    			button0 = element("button");
    			button0.textContent = "Clear sprite";
    			t3 = space();
    			button1 = element("button");
    			button1.textContent = "Generate code";
    			t5 = space();
    			create_component(output.$$.fragment);
    			add_location(button0, file, 28, 4, 648);
    			add_location(button1, file, 29, 4, 705);
    			attr_dev(div0, "id", "right");
    			attr_dev(div0, "class", "svelte-1yje0f0");
    			add_location(div0, file, 26, 2, 576);
    			attr_dev(div1, "id", "main");
    			attr_dev(div1, "class", "svelte-1yje0f0");
    			add_location(div1, file, 24, 0, 512);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			mount_component(canvas_1, div1, null);
    			append_dev(div1, t0);
    			append_dev(div1, div0);
    			mount_component(palette, div0, null);
    			append_dev(div0, t1);
    			append_dev(div0, button0);
    			append_dev(div0, t3);
    			append_dev(div0, button1);
    			append_dev(div0, t5);
    			mount_component(output, div0, null);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*clearSprite*/ ctx[5], false, false, false, false),
    					listen_dev(button1, "click", /*generateCode*/ ctx[4], false, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			const canvas_1_changes = {};
    			if (dirty & /*actualColor*/ 4) canvas_1_changes.actualColor = /*actualColor*/ ctx[2];
    			canvas_1.$set(canvas_1_changes);
    			const output_changes = {};
    			if (dirty & /*value*/ 2) output_changes.value = /*value*/ ctx[1];
    			output.$set(output_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(canvas_1.$$.fragment, local);
    			transition_in(palette.$$.fragment, local);
    			transition_in(output.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(canvas_1.$$.fragment, local);
    			transition_out(palette.$$.fragment, local);
    			transition_out(output.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			/*canvas_1_binding*/ ctx[6](null);
    			destroy_component(canvas_1);
    			destroy_component(palette);
    			destroy_component(output);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	let canvas = null;
    	let value = "";
    	let actualColor;

    	function handleColorChange(event) {
    		$$invalidate(2, actualColor = event.detail.color);
    	}

    	function generateCode() {
    		if (canvas === null) return;
    		$$invalidate(1, value = canvas.getAssemblySprite());
    	}

    	function clearSprite() {
    		if (canvas === null) return;
    		canvas.clearCanvas();
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	function canvas_1_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			canvas = $$value;
    			$$invalidate(0, canvas);
    		});
    	}

    	$$self.$capture_state = () => ({
    		Output,
    		Canvas,
    		Palette,
    		canvas,
    		value,
    		actualColor,
    		handleColorChange,
    		generateCode,
    		clearSprite
    	});

    	$$self.$inject_state = $$props => {
    		if ('canvas' in $$props) $$invalidate(0, canvas = $$props.canvas);
    		if ('value' in $$props) $$invalidate(1, value = $$props.value);
    		if ('actualColor' in $$props) $$invalidate(2, actualColor = $$props.actualColor);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		canvas,
    		value,
    		actualColor,
    		handleColorChange,
    		generateCode,
    		clearSprite,
    		canvas_1_binding
    	];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
      target: document.body,
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
