class CreateElement extends HTMLElement {
  static observedAttributes = ["src"];

  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: "open" });
  }

  async connectedCallback() {
    const src = this.getAttribute("src");
    const element = await this.createElementFromSource(src);
    this.replaceChildren(this.shadow, element);
  }

  async attributeChangedCallback(name, oldValue, newValue) {
    if (name === "src") {
      const element = await this.createElementFromSource(newValue);
      this.replaceChildren(this.shadow, element);
    }
  }

  /**
   * Fetches a JSON object and create an element from it.
   * @param {string} src 
   * @returns {Promise<HTMLElement>}
   */
  async createElementFromSource(src) {
    const response = await fetch(src, {cache: "no-store"});
    const elementContent = await response.json();
    const element = this.createElement(elementContent);
    return element;
  }

  /**
   * Replaces a node's children with new children.
   * @param {Node} node
   * @param {Node} children
   * @returns {Node}
   */
  replaceChildren(node, children) {
    this.removeChildren(node);
    node.appendChild(children);
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
