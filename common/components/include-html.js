/**
 * Includes a snippet of html from a remote source.
 */
class IncludeHtml extends HTMLElement {
  static observedAttributes = ["src"];

  /**
   * Creates a shadow root and attaches it to the element.
   */
  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: "open" });
  }

  /**
   * Updates the element when an attribute changes.
   */
  attributeChangedCallback() {
    this.refresh();
  }

  /**
   * Refreshes the element's content. Does not support remote script execution.
   */
  async refresh() {
    const sourceUrl = this.getAttribute("src");
    const response = await fetch(sourceUrl, { cache: "no-store" });
    // Disable scripts by setting innerHTML directly (as opposed to appendChild)
    this.shadow.innerHTML = response.ok ? await response.text() : ""; 
  }
}

customElements.define("include-html", IncludeHtml);
