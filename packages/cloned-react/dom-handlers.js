const createRoot = (rootElement) => ({
  rootElement,
  // The render method expects to recieve transformed JSX, to render as HTML into the rootElement
  render: (rootChild) => {
    console.log(rootChild);
    return rootElement.append(rootChild);
    // START HERE
    // How can we create an element from the rootChild JSX
    // and render it to the rootElement
  },
});

export const DOMHandlers = {
  createRoot,
};
