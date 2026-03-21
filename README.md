# Shadow Realm

A lightweight, reactive DOM framework built around a Signal-based reactivity system and a directive pipeline. Bind HTML attributes to JavaScript state — the DOM updates automatically whenever state changes. No virtual DOM, no build step required. Inspired by [Alpine.js](https://github.com/alpinejs/alpine).

## Installation

```bash
npm install shadow_realm
```

```js
import Realm, { Shadow } from "shadow_realm";
```

## Quick Start

```html
<div s-state="{ count: 0 }">
  <span s-text="count"></span>
  <button on:click="count++">Increment</button>
</div>

<script type="module">
  import Realm from "shadow_realm";
  new Realm(document.getElementById("app")).initialize();
</script>
```

---

## Table of Contents

1. [Realm](#realm)
2. [Shadow Registry](#shadow-registry)
3. [Declaring State](#declaring-state)
4. [Directives](#directives)
5. [Event Listeners](#event-listeners)
6. [Helpers in Scope](#helpers-in-scope)
7. [Stores](#stores)
8. [Refs](#refs)
9. [Plugins](#plugins)

---

## Realm

The main reactive controller for a DOM subtree.

```js
new Realm(root?, context?)
```

| Parameter | Type             | Default         | Description                                  |
| --------- | ---------------- | --------------- | -------------------------------------------- |
| `root`    | `HTMLElement`    | `document.body` | Root element to make reactive                |
| `context` | `Object \| null` | `null`          | Parent context to inherit from another Realm |

### Methods

#### `realm.initialize()` → `Realm`

Activates all bindings, attaches event listeners, and runs effects. Safe to call multiple times — subsequent calls are no-ops.

```js
const realm = new Realm(document.querySelector("#app"));
realm.initialize();
```

#### `realm.destroy()`

Tears down the Realm: removes event listeners, unsubscribes all signal bindings, and runs effect cleanup functions. Call this before removing the element from the DOM.

```js
realm.destroy();
```

### Properties

| Property        | Type             | Description                            |
| --------------- | ---------------- | -------------------------------------- |
| `realm.root`    | `HTMLElement`    | The root DOM element                   |
| `realm.context` | `Object \| null` | The injected parent context            |
| `realm.ready`   | `boolean`        | Whether `initialize()` has been called |

---

## Shadow Registry

The `Shadow` export is the global registry for directives, plugins, and stores. It is shared across all `Realm` instances.

```js
import { Shadow } from "shadow_realm";
```

### `Shadow.directive(name, handler)`

Registers a custom reactive directive. The name must start with `"s-"`.

```js
Shadow.directive("s-tooltip", ({ el, expression, execute }) => {
  el.title = execute(expression);
});
```

**Handler arguments:**

| Property        | Description                                              |
| --------------- | -------------------------------------------------------- |
| `el`            | The DOM element the directive is on                      |
| `expression`    | The raw attribute value string                           |
| `value`         | The updated signal value (when a reactive token changed) |
| `context`       | The element's raw state context                          |
| `execute(expr)` | Evaluates an expression string in the element's scope    |

### `Shadow.use(pluginFn)` → `Shadow`

Registers a plugin. Chainable.

```js
Shadow.use(MyPlugin).use(AnotherPlugin);
```

### `Shadow.store(name, callback)`

Registers a global reactive store. See [Stores](#stores).

### `Shadow.state(name, callback)`

Registers a named, reusable state factory.

```js
Shadow.state("counter", (start = 0) => ({ count: start }));
```

---

## Declaring State

Use the `s-state` attribute to declare a reactive scope on any element. The value is a plain JavaScript object expression.

```html
<div s-state="{ name: 'Alice', count: 0 }">
  <span s-text="name"></span>
</div>
```

### Nested State

Child elements can declare their own `s-state`. They automatically inherit access to all ancestor state.

```html
<div s-state="{ user: 'Alice' }">
  <div s-state="{ role: 'admin' }">
    <!-- Both `user` and `role` are accessible here -->
    <span s-text="user + ' — ' + role"></span>
  </div>
</div>
```

---

## Directives

All directive attributes are removed from the DOM after processing.

### `s-text`

Sets the `textContent` of an element.

```html
<span s-text="name"></span> <span s-text="count + ' items'"></span>
```

### `s-value`

Sets the `value` property of a form element.

```html
<input s-value="searchQuery" />
```

### `s-show`

Toggles visibility. Preserves the element's original `display` value and keeps `aria-hidden` in sync.

```html
<div s-show="isLoggedIn">Welcome!</div>
```

### `s-class`

Dynamically adds/removes CSS classes. Accepts an **object** (class → boolean) or a **string**.

```html
<!-- Object syntax -->
<div s-class="{ active: isActive, disabled: !isEnabled }"></div>

<!-- String syntax -->
<div s-class="currentTheme"></div>
```

### `s-style`

Applies inline styles. Accepts an **object** (camelCase props) or a **CSS string**.

```html
<!-- Object syntax -->
<div s-style="{ color: textColor, fontSize: '14px' }"></div>

<!-- String syntax -->
<div s-style="'color: red; font-weight: bold'"></div>
```

### `s-if`

Conditionally mounts and unmounts a `<template>` element's content. The cloned content is initialized as a child Realm.

```html
<template s-if="showModal">
  <div class="modal">...</div>
</template>
```

> Must be used on a `<template>` element.

### `s-for`

Renders a list from a `<template>`, using an LCS diff to minimize DOM operations on updates.

```html
<template s-for="item in items">
  <li s-text="item.name"></li>
</template>
```

> Must be used on a `<template>` element.

### `s-effect`

Runs an expression once as a side effect when the Realm mounts. The expression may return a cleanup function.

```html
<div s-effect="initChart()"></div>
```

Custom effect directives can be registered using the `s-effect-*` naming pattern.

### `s-src`

Safely sets the `src` attribute. Blocks `javascript:` protocol injection and supports Promises.

```html
<img s-src="avatarUrl" />
```

### `s-disabled`

Sets the `disabled` boolean attribute.

```html
<button s-disabled="isLoading">Submit</button>
```

### `s-ref`

Registers the element in the global `$refs` map.

```html
<canvas s-ref="myCanvas"></canvas>
```

### `s-id`

Sets the element's `id` attribute dynamically.

```html
<section s-id="'section-' + index"></section>
```

### `s-key`

Sets a `key` attribute on an element, used as a stable identity hint inside `s-for` lists.

```html
<template s-for="item in items">
  <div s-key="item.id" s-text="item.name"></div>
</template>
```

### `s-scroll-text`

Animates text changes with a vertical slide transition.

```html
<span s-scroll-text="currentLabel"></span>
```

### `s-markdown`

Renders a Markdown string as HTML. Requires [marked](https://github.com/markedjs/marked) to be loaded on the page.

```html
<div s-markdown="markdownContent"></div>
```

### Directive Quick Reference

| Attribute       | Value             | Reactive | Description                       |
| --------------- | ----------------- | -------- | --------------------------------- |
| `s-state`       | JS object literal | —        | Declares reactive state scope     |
| `s-text`        | Expression        | ✅       | Sets `textContent`                |
| `s-value`       | Expression        | ✅       | Sets `.value`                     |
| `s-show`        | Expression        | ✅       | Toggles visibility                |
| `s-class`       | Object or string  | ✅       | Adds/removes classes              |
| `s-style`       | Object or string  | ✅       | Applies inline styles             |
| `s-if`          | Expression        | ✅       | Conditional render (`<template>`) |
| `s-for`         | `item in list`    | ✅       | List render (`<template>`)        |
| `s-effect`      | Expression        | —        | On-mount side effect              |
| `s-src`         | Expression        | ✅       | Sets `src` safely                 |
| `s-disabled`    | Expression        | ✅       | Sets `disabled`                   |
| `s-ref`         | Identifier        | —        | Registers in `$refs`              |
| `s-id`          | Expression        | ✅       | Sets `id`                         |
| `s-key`         | Expression        | ✅       | Sets `key`                        |
| `s-scroll-text` | Expression        | ✅       | Animated text swap                |
| `s-markdown`    | Expression        | ✅       | Renders Markdown                  |
| `on:[event]`    | Expression        | —        | DOM event listener                |

---

## Event Listeners

Attach DOM event listeners with `on:[eventName]`.

```html
<button on:click="count++">Click</button>
<input on:input="query = $event.target.value" />
<form on:submit="handleSubmit()"></form>
```

**Special variables available in event expressions:**

| Variable  | Description                   |
| --------- | ----------------------------- |
| `$event`  | The raw DOM `Event` object    |
| `$target` | Shorthand for `$event.target` |

---

## Helpers in Scope

These are available inside any directive expression or event handler.

| Helper                     | Description                                |
| -------------------------- | ------------------------------------------ |
| `$uniid(prefix?, length?)` | Generates a unique ID                      |
| `$debounce(fn, delay?)`    | Returns a debounced version of a function  |
| `$throttle(fn, delay?)`    | Returns a throttled version of a function  |
| `$store`                   | Access registered global stores            |
| `$refs`                    | Access registered element refs             |
| `$event`                   | Current DOM event (event handlers only)    |
| `$target`                  | Current event target (event handlers only) |
| `$index`                   | Current loop index (inside `s-for` only)   |

Standard globals `console`, `Math`, `Date`, `JSON`, and `parseInt` are also available.

---

## Stores

Stores provide shared reactive state accessible from any Realm on the page.

```js
Shadow.store("cart", () => ({
  items: [],
  total: 0,
}));
```

## State declarations
States provide a way to declare state outside of the template

```js
Shadow.state("cart", () => ({
  items: [],
  total: 0,
}));
```

use it like so
```html
<div s-state="cart"></div>
```


Access in templates with `$store.storeName.property`:

```html
<span s-text="$store.cart.total"></span>
<div s-show="$store.cart.items.length > 0">...</div>
```

Mutate from event handlers:

```html
<button on:click="$store.cart.total = 0">Clear</button>
```

---

## Refs

Refs provide direct access to DOM elements from within expressions.

```html
<input s-ref="emailInput" />
<button on:click="$refs.emailInput.focus()">Focus Email</button>
```

Programmatic registration:

```js
Shadow.$refs("emailInput", document.querySelector("#email"));
```

---

## Plugins

A plugin is a function that receives the `Shadow` class and registers one or more directives.

```js
function TooltipPlugin(Shadow) {
  Shadow.directive("s-tooltip", ({ el, expression, execute }) => {
    el.title = execute(expression);
  });
}

Shadow.use(TooltipPlugin);
```

Effect directives follow the `s-effect-*` naming convention and run during the effects phase (on mount):

```js
function UpperCaseEffect(Shadow) {
  Shadow.directive("s-effect-upper", ({ el }) => {
    el.textContent = el.textContent.toUpperCase();
  });
}
```

```html
<p s-effect-upper>hello world</p>
<!-- renders: HELLO WORLD -->
```

### Contributing

---

Found a bug or have a feature suggestion? Feel free to open an issue or submit a pull request! feel free to fork this repo.

### License

---

MIT © 2025 Dads Guifendjy Paul
