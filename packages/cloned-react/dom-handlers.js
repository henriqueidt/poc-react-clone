const transformJSXtoHTML = ({ type, props }) => {
  const el = document.createElement(type);
  Object.keys(props).forEach((prop) => {
    if (prop === "children") {
      if (typeof props[prop] === "string") {
        // if prop is a children string, set the textContent of the element
        el.textContent = props[prop];
      } else {
        // if prop is a children object, it means it is another element,
        // so recursively call transformJSXtoHTML
        el.appendChild(transformJSXtoHTML(props[prop]));
      }
    } else {
      // if is not children, just add the attribute to the element
      el.setAttribute(prop, props[prop]);
    }
  });
  return el;
};

const createRoot = (rootElement) => ({
  rootElement,
  // The render method expects to recieve transformed JSX, to render as HTML into the rootElement
  render: (rootChild) => {
    console.log(rootChild);
    const rootChildEl = transformJSXtoHTML(rootChild);
    rootElement.appendChild(rootChildEl);
  },
});

export const DOMHandlers = {
  createRoot,
};
