import { subscribeRender } from ".";
import { diffOrder } from "./VDOMDiff";
import { isChildPath, isPrimitiveElement } from "./utils";

// finds all the children of a given element by its path
const findRenderedChildrenByPath = (renderedElementsMap, path) => {
  console.log("findRenderedChildrenByPath", renderedElementsMap, path);
  return Object.entries(renderedElementsMap).filter(([elPath]) => {
    isChildPath(elPath, path);
  });
};

const findRootVDOMPaths = (paths) => {
  // If there are no paths, return an empty array
  if (paths.length === 0) {
    return paths;
  }
  // The first path is always a root path
  let rootPaths = [paths[0]];
  // Iterates over the rest of the paths
  for (const path of paths.slice(1)) {
    // Finds all the root paths of the current path
    const rootPathsOfCurrent = rootPaths.filter((roothPath) =>
      isChildPath(path, roothPath)
    );
    // If there are no root paths of the current path, it means that it is a root path
    if (rootPathsOfCurrent.length === 0) {
      // Adds the path to the root paths
      const newRootPaths = rootPaths.filter(
        (rootPath) => !isChildPath(rootPath, path)
      );
      rootPaths = [...newRootPaths, path];
    }
  }
  return rootPaths;
};

const operateNodeRemove = ({ renderedElementsMap }, { path }) => {
  console.log("starting to remove");
  const element = renderedElementsMap[path];
  if (element) {
    element.parentNode.removeChild(element);
    findRenderedChildrenByPath(renderedElementsMap, path).forEach(
      ([childPath]) => {
        delete renderedElementsMap[childPath];
      }
    );
  } else {
    console.log(path, "removed");
    const childrens = findRenderedChildrenByPath(renderedElementsMap, path);
    const rootVDOMPaths = findRootVDOMPaths(
      childrens.map(([childPath]) => childPath)
    );
    rootVDOMPaths.forEach((VDOMpath) => {
      operateNodeRemove({ renderedElementsMap }, { path: VDOMpath });
    });
  }
  delete renderedElementsMap[path];
};

const applyDiff = (diff, renderedElementsMap, renderableVDOM) => {
  const sortedDiffs = diff.sort(
    (a, b) => diffOrder.indexOf(a.type) - diffOrder.indexOf(b.type)
  );
  console.log("sortedDiffs", sortedDiffs);
  sortedDiffs.forEach((diff) => {
    switch (diff.type) {
      case "NODE_REMOVED":
        operateNodeRemove({ renderedElementsMap }, diff);
        break;
      case "PROPS_UPDATED":
        break;
      case "PROPS_CHANGE_UPDATED":
        break;
      case "PROPS_CHANGE_REMOVED":
        break;
      case "PRIMITIVE_UPDATED":
        break;
      default:
        break;
    }
  });
};

const renderPrimitiveValue = ({ value }) => {
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

const renderHtmlTag = ({ type, props }, renderedElementsMap) => {
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
            const childEl = transformJSXtoHTML(child, renderedElementsMap);
            if (childEl) {
              el.appendChild(childEl);
            }
          });
        } else {
          // if prop is a children object, it means it is another element,
          // so recursively call transformJSXtoHTML
          el.appendChild(transformJSXtoHTML(props[prop], renderedElementsMap));
        }
      }
    } else if (prop === "onClick") {
      // here we would add all event handlers, but we're adding only click for simplicity
      el.addEventListener("click", props[prop]);
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

const transformJSXtoHTML = (element, renderedElementsMap) => {
  if (element === null) {
    return null;
  }
  if (typeof element.type === "function") {
    const FunctionalComponent = element.type;
    const renderedElement = FunctionalComponent(element.props);
    renderedElementsMap[element.path] = renderedElement;
    return transformJSXtoHTML(renderedElement, renderedElementsMap);
  } else {
    const renderedElement = isPrimitiveElement(element)
      ? renderPrimitiveValue(element)
      : renderHtmlTag(element, renderedElementsMap);
    renderedElementsMap[element.path] = renderedElement;
    return renderedElement;
  }
};

const createRoot = (rootElement) => ({
  rootElement,
  // The render method expects to recieve transformed JSX, to render as HTML into the rootElement
  render: (rootChild) => {
    // let lastChild;
    let renderedElementsMap = {};
    subscribeRender(rootChild, (renderableVDOM, diff) => {
      console.log("callback", diff);
      // if renderedElementsMap is empty, it means it is the first render
      if (Object.keys(renderedElementsMap).length === 0) {
        console.log("FIRST RENDER");
        const rootChildAsHTML = transformJSXtoHTML(
          renderableVDOM,
          renderedElementsMap
        );
        rootElement.appendChild(rootChildAsHTML);
      } else {
        applyDiff(diff, renderedElementsMap, renderableVDOM);
      }
      // let rootChildAsHTML;

      // rootChildAsHTML = transformJSXtoHTML(renderableVDOM);

      // if (!lastChild) {
      //   rootElement.appendChild(rootChildAsHTML);
      // } else {
      //   rootElement.replaceChild(rootChildAsHTML, lastChild);
      // }
      // lastChild = rootChildAsHTML;
    });

    // const rootChildEl = transformJSXtoHTML(rootChild);
    // rootElement.appendChild(rootChildEl);
  },
});

export const DOMHandlers = {
  createRoot,
};
