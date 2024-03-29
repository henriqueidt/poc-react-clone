const isPrimitiveElement = (element) => {
  return typeof element !== "object";
};

const renderPrimitiveValue = (element) => {
  console.log("rendering primitive", element);
  switch (typeof element) {
    case "string":
    case "number":
      return document.createTextNode(element);
    case "undefined":
      return;
    case "boolean":
      return element ? renderPrimitiveToHtml("true") : undefined;
    default:
      throw new Error(`Type ${element} is not a known renderable type.`);
  }
};

const renderHtmlTag = ({ type, props }) => {
  // console.log("rendering object", type, props);
  const el = document.createElement(type);

  Object.keys(props).forEach((prop) => {
    if (prop === "children") {
      if (typeof props[prop] === "string") {
        // if prop is a children string, set the textContent of the element
        el.textContent = props[prop];
      } else {
        // console.log("entreiaqui", props[prop].length);
        if (props[prop].length > 1) {
          // if prop is a children array, it means it is a list of elements,
          // so iterate over the array and append each element to the parent element
          props[prop].forEach((child) => {
            el.appendChild(transformJSXtoHTML(child));
          });
        } else {
          // if prop is a children object, it means it is another element,
          // so recursively call transformJSXtoHTML
          el.appendChild(transformJSXtoHTML(props[prop]));
        }
      }
    } else {
      // if is not children, just add the attribute to the element
      // console.log(prop);
      if (el[prop] !== undefined) {
        // if prop is a property of the element (id, className, etc), set the property
        el[prop] = props[prop];
      } else {
        // if prop is an attribute of the element (aria-label, etc), set the attribute
        el.setAttribute(prop, props[prop]);
      }
    }
  });
  return el;
};

const transformJSXtoHTML = (element) => {
  const renderedElement = isPrimitiveElement(element)
    ? renderPrimitiveValue(element)
    : renderHtmlTag(element);
  return renderedElement;
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
