import { element, object } from "prop-types";
import * as React from "../../node_modules/react";
import { isPrimitiveElement, isPrimitiveObject } from "./utils";
import { createHooks, useState, useEffect } from "./hooks";
export { DOMHandlers } from "./dom-handlers";
import { getVDOMDiff } from "./VDOMDiff";
export default React;

export { useState, useEffect };

export const { __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED } = React;

const createVDOMElement = (element, path) => {
  let VDOMElement;
  if (isPrimitiveObject(element)) {
    VDOMElement = {
      type: "primitive",
      value: element,
      path,
    };
  } else {
    VDOMElement = {
      type: element.type,
      props: element.props,
      path,
    };
  }
  return {
    element: VDOMElement,
    children: [],
  };
};

// Navigates through the VDOM to find the element at the given path
export const getVDOMElementByPath = (path, VDOMElement) => {
  return path.reduce((targetEl, currentIndex) => {
    if (targetEl) {
      return (targetEl.children || [])[currentIndex];
    }
    return targetEl;
  }, VDOMElement);
};

// Sets the current VDOM element at the given path
const setCurrentVDOMElement = (path, VDOMElement, VDOM) => {
  // If path has no length, it means that the element is the root element
  if (path.length === 0) {
    VDOM.current = VDOMElement;
    return;
  }

  // Finds the parent of the element by sending the path without the last element
  const parentEl = getVDOMElementByPath(path.slice(0, -1), VDOM.current);
  const elIndex = path[path.length - 1];
  // Adds the element to the parent's children array
  parentEl.children[elIndex] = VDOMElement;
};

const renderPrimitiveValue = (element, VDOM, path) => {
  const VDOMElement = createVDOMElement(element, path);
  setCurrentVDOMElement(path, VDOMElement, VDOM);
  return VDOMElement.element;
};

const renderComponent = (element, VDOM, path, hooks) => {
  const {
    props: { children, ...props },
    type,
  } = element;

  // Finds the element in the VDOM
  const previousVDOMElement = (getVDOMElementByPath(path, VDOM.previous) || {})
    .element;

  // If the VDOM element is not found or if type is different (component has changed),
  // treat as first render
  const isFirstRender =
    previousVDOMElement === undefined || previousVDOMElement.type !== type;

  setCurrentVDOMElement(path, createVDOMElement(element, path), VDOM);

  if (typeof type === "function") {
    const FunctionalComponent = type;

    hooks.registerHooks(path, isFirstRender);
    const renderedElement = FunctionalComponent(element.props);
    const renderedDomEl = render(renderedElement, VDOM, [...path, 0], hooks);
    return renderedDomEl;
  }

  if (typeof children !== "undefined") {
    const childrenArray = Array.isArray(children) ? children : [children];
    const renderedChildren = childrenArray.map((child, index) =>
      render(child, VDOM, [...path, index], hooks)
    );

    return {
      ...element,
      props: {
        ...props,
        children: renderedChildren,
      },
      path,
    };
  }

  // console.log(element, "ELEMENTETETEET");

  return {
    ...element,
    path,
  };
};

const render = (element, VDOM, path, hooks) =>
  isPrimitiveObject(element)
    ? renderPrimitiveValue(element, VDOM, path)
    : renderComponent(element, VDOM, path, hooks);

export const subscribeRender = (element, callback) => {
  let VDOM = {
    previous: {},
    current: {},
  };

  // Function to be called after the update triggered by hooks
  let afterUpdateFn;

  const onUpdateCallback = (callback) => {
    afterUpdateFn = callback;
  };

  const update = (hooks) => {
    // render the root element
    const renderableVDOM = render(element, VDOM, [], hooks);

    const VDOMDiff = getVDOMDiff(renderableVDOM, VDOM);

    console.log(VDOMDiff, "VDOMDiff");

    VDOM.previous = VDOM.current;
    VDOM.current = [];

    callback(renderableVDOM, VDOMDiff);
    afterUpdateFn();
  };

  const hooks = createHooks(update, onUpdateCallback);

  update(hooks);
};
