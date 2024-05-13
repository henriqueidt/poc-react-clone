import { subscribeRender } from ".";
import { diffOrder, propsChangeTypes } from "./VDOMDiff";
import {
  eventHandlers,
  isChildPath,
  isEventHandler,
  isPrimitiveElement,
} from "./utils";

const removeEventHandler = (element, { key, value }) => {
  element.removeEventListener(eventHandlers[key], value);
};

const addEventHandler = (element, { key, value }) => {
  element.addEventListener(eventHandlers[key], value);
};

const findRenderableByPath = (renderableVDOM, path) => {
  if (!renderableVDOM) {
    return;
  }
  if (renderableVDOM.path === path) {
    return renderableVDOM;
  }
  if (renderableVDOM.type === "primitive" || !renderableVDOM.props.children) {
    return;
  }
  return renderableVDOM.props.children.reduce(
    (foundEl, child) => (foundEl ? foundEl : findRenderableByPath(child, path)),
    null
  );
};

// finds all the children of a given element by its path
const findRenderedChildrenByPath = (renderedElementsMap, path) => {
  console.log("findRenderedChildrenByPath", renderedElementsMap, path);
  return Object.entries(renderedElementsMap).filter(([elPath]) => {
    isChildPath(elPath, path);
  });
};

const findNextSiblingByPath = (
  { renderedElementsMap, renderableVDOM },
  path,
  parentPointer
) => {
  const parentElFromVDOM = findRenderableByPath(renderableVDOM, parentPointer);
  const parentChildren = parentElFromVDOM.props.children;
  const childrenVDOMIndex = parentChildren.findIndex(
    (child) => child.path === path
  );
  let nextSiblingVDOMIndex = childrenVDOMIndex + 1;
  let nextSibling;

  // nextSibling can be a variable that doesn't render (false)
  // or a sibling that is not rendered yet (it is being added in this cycle)
  while (
    nextSiblingVDOMIndex < parentChildren.length &&
    nextSibling === undefined
  ) {
    const nextSiblingFromVDOM =
      parentElFromVDOM.props.children[nextSiblingVDOMIndex];
    if (nextSiblingFromVDOM) {
      nextSibling = renderedElementsMap[nextSiblingFromVDOM.path];
    }
    nextSiblingVDOMIndex += 1;
  }
  return nextSibling;
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

const applyProps = ({ key, value }, element) => {
  if (isEventHandler(key)) {
    addEventHandler(element, { key, value });
    return;
  }
  if (element[key] !== undefined) {
    element[key] = value;
    return;
  }
  element.setAttribute(key, value);
};

const removeProp = ({ key, oldValue }, element) => {
  if (isEventHandler(key)) {
    removeEventHandler(element, { key, value: oldValue });
    return;
  }
  element.removeAttribute(key);
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

const operateNodeAdd = (
  { renderedElementsMap, renderableVDOM },
  { path, payload: { node, parentPointer } }
) => {
  console.log("NODE BEING ADDED");
  const parentElement = renderedElementsMap[parentPointer];
  const nextSibling = findNextSiblingByPath(
    { renderedElementsMap, renderableVDOM },
    path,
    parentPointer
  );

  const addedEl = transformJSXtoHTML(node, renderedElementsMap);
  // if addedEl is false, it means that the element is not rendered
  // so we don't need to append it to the parent
  if (!addedEl) {
    renderedElementsMap[path] = addedEl;
    return;
  }

  // Adds the element to the parent, right before nextSibling
  // If nextSibling is undefined, it means that the element is the last child,
  // so insertBefore will add it at the end of the parent
  parentElement.insertBefore(addedEl, nextSibling);
  renderedElementsMap[path] = addedEl;
};

const operateNodeReplace = (
  { renderedElementsMap, renderableVDOM },
  { path, payload: { newNode, parentPointer } }
) => {
  operateNodeRemove({ renderedElementsMap }, { path });
  operateNodeAdd(
    { renderedElementsMap, renderableVDOM },
    { path, payload: { node: newNode, parentPointer } }
  );
};

const operatePrimitiveUpdate = (
  { renderedElementsMap },
  { path, payload: { newElement } }
) => {
  renderedElementsMap[path].nodeValue = newElement.value;
};

const operatePropsUpdate = (
  { renderedElementsMap },
  { path, payload: { changedProps } }
) => {
  Object.entries(changedProps).forEach(
    ([key, [propChangeType, { oldValue, newValue }]]) => {
      if (propChangeType === propsChangeTypes.UPDATED) {
        // if the prop is an event handler, remove the old event handler before applying the new one
        if (isEventHandler(key)) {
          removeEventHandler(renderedElementsMap[path], {
            key,
            value: oldValue,
          });
        }
        applyProps(
          {
            key,
            value: newValue,
          },
          renderedElementsMap[path]
        );
      } else if (propChangeType === propsChangeTypes.REMOVED) {
        removeProp({ key, oldValue }, renderedElementsMap[path]);
      }
    }
  );
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
      case "NODE_ADDED":
        operateNodeAdd(({ renderedElementsMap, renderableVDOM }, diff));
        break;
      case "NODE_REPLACED":
        operateNodeReplace({ renderedElementsMap, renderableVDOM }, diff);
        break;
      case "PRIMITIVE_UPDATED":
        operatePrimitiveUpdate({ renderedElementsMap }, diff);
        break;
      case "PROPS":
        operatePropsUpdate({ renderedElementsMap }, diff);
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
  console.log(element);
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
