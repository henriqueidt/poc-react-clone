import { subscribeRender } from ".";
import { isPrimitiveElement } from "./utils";

const renderPrimitiveValue = ({ value }) => {
  console.log("renderPrimitiveValue", value);
  switch (typeof value) {
    case "string":
    case "number":
      return document.createTextNode(value);
    case "undefined":
      return;
    case "boolean":
      return value ? renderPrimitiveValue("true") : undefined;
    default:
      throw new Error(`Type ${value} is not a known renderable type.`);
  }
};

const renderHtmlTag = ({ type, props }) => {
  const el = document.createElement(type);

  Object.keys(props).forEach((prop) => {
    if (prop === "children") {
      if (typeof props[prop] === "string") {
        // if prop is a children string, set the textContent of the element
        el.textContent = props[prop];
      } else {
        if (Array.isArray(props[prop])) {
          // if prop is a children array, it means it is a list of elements,
          // so iterate over the array and append each element to the parent element
          props[prop].forEach((child) => {
            const childEl = transformJSXtoHTML(child);
            if (childEl) {
              el.appendChild(childEl);
            }
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
  if (element === null) {
    return null;
  }
  if (typeof element.type === "function") {
    const FunctionalComponent = element.type;
    const renderedElement = FunctionalComponent(element.props);
    return transformJSXtoHTML(renderedElement);
  } else {
    const renderedElement = isPrimitiveElement(element)
      ? renderPrimitiveValue(element)
      : renderHtmlTag(element);
    return renderedElement;
  }
};

const createRoot = (rootElement) => ({
  rootElement,
  // The render method expects to recieve transformed JSX, to render as HTML into the rootElement
  render: (rootChild) => {
    let lastChild;
    subscribeRender(rootChild, (renderableVDOM) => {
      let rootChildAsHTML;
      console.log("callback", renderableVDOM);

      rootChildAsHTML = transformJSXtoHTML(renderableVDOM);

      if (!lastChild) {
        rootElement.appendChild(rootChildAsHTML);
      } else {
        rootElement.replaceChild(rootChildAsHTML, lastChild);
      }
      lastChild = rootChildAsHTML;
    });

    // const rootChildEl = transformJSXtoHTML(rootChild);
    // rootElement.appendChild(rootChildEl);
  },
});

export const DOMHandlers = {
  createRoot,
};
