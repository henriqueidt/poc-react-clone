const createRoot = (rootElement) => ({
  rootElement,
  // The render method expects to recieve transformed JSX, to render as HTML into the rootElement
  render: (rootChild) => {
    console.log(rootChild);
    const rootChildEl = document.createElement(rootChild.type);
    rootElement.appendChild(rootChildEl);
  },
});

export const DOMHandlers = {
  createRoot,
};
