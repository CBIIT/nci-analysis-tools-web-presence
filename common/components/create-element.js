/**
 * Creates an HTML element from a JSON object.
 * @example
 * <create-element id="myElement" src="https://example.com/element.json"></create-element>
 * 
 * @example
 * // Refresh content every five minutes
 * const intervalId = setInterval(() => await myElement.refresh(), 1000 * 60 * 5);
 * 
 * @example
 * // Update source url
 * myElement.setAttribute("src", "https://example.com/element2.json");
 */
class CreateElement extends HTMLElement {
  static observedAttributes = ["src"];

  /**
   * Creates a shadow root and attaches it to the element.
   */
  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: "open" });
  }

  /**
   * Creates the element when it is added to the DOM.
   */
  async connectedCallback() {
    this.refresh();
  }

  /**
   * Updates the element when an attribute changes.
   * @param {string} name
   * @param {string} oldValue
   * @param {string} newValue
   */
  async attributeChangedCallback(name, oldValue, newValue) {
    if (name === "src") {
      this.refresh();
    }
  }

  /**
   * Refreshes the element's content.
   * @param {string} src 
   */
  async refresh() {
    const sourceUrl = this.getAttribute("src");
    const element = await this.createElementFromSource(sourceUrl);
    this.replaceChild(this.shadow, element);
  }

  /**
   * Fetches a JSON object and create an element from it.
   * @param {string} src 
   * @returns {Promise<HTMLElement>}
   */
  async createElementFromSource(src) {
    const response = await fetch(src, {cache: "no-store"});
    if (response.ok) {
      const elementContent = await response.json();
      const element = this.createElement(elementContent);
      return element;
    } else {
      return null;
    }
  }

  /**
   * Replaces a node's child with another node.
   * @param {Node} node
   * @param {Node} children
   * @returns {Node}
   */
  replaceChild(node, child) {
    this.removeChildren(node);
    if (child)
      node.appendChild(child);
    return node;
  }

  /**
   * Removes all children from a node.
   * @param {Node} node
   * @returns {Node}
   */
  removeChildren(node) {
    while (node.firstChild) {
      node.removeChild(node.firstChild);
    }
    return node;
  }

  /**
   * Creates an element from a JSON object.
   * @param {object} config
   * @param {string} config.tag
   * @param {object} config.props
   * @param {Array} config.children
   * @returns {HTMLElement}
   * @example
   * createElement({
   *   tag: "div",
   *   props: { id: "my-div" },
   *   children: [
   *     "Hello World",
   *     { tag: "p", props: { className: "paragraph" }, children: ["Lorem ipsum"] },
   *     { tag: "script", props: { innerHTML: "console.log('Hello World')" } }
   *   ]
   * });
   * // <div id="my-div">Hello World<p class="paragraph">Lorem ipsum</p></div>
   */
  createElement({ tag = "div", props = {}, children = [] } = {}) {
    const el = document.createElement(tag);

    for (const prop in props) {
      el[prop] = props[prop];
    }

    if (children) {
      if (!Array.isArray(children)) children = [children];

      for (const child of children) {
        if (typeof child === "string" || typeof child === "number") {
          el.appendChild(document.createTextNode(child));
        } else {
          el.appendChild(this.createElement(child));
        }
      };
    }
    return el;
  }
}

customElements.define("create-element", CreateElement);
