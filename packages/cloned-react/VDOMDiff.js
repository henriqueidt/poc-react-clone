import { getVDOMElementByPath } from "./index";
import { isPrimitiveElement } from "./utils";

const changeTypes = {
  NODE_ADDED: "NODE_ADDED",
  NODE_REMOVED: "NODE_REMOVED",
  NODE_REPLACED: "NODE_REPLACED",
  PRIMITIVE_UPDATED: "PRIMITIVE_UPDATED",
  PROPS: "PROPS",
};

const propsChangeTypes = {
  UPDATED: "UPDATED",
  REMOVED: "REMOVED",
};

/**
 * for NODE_ADDED change type
 * we need to pass what is the node to add
 * and the path to the parent where we need to attach the node to
 **/
const createNodeAdded = (VDOMElement, parentPointer) => {
  return {
    path: VDOMElement.path,
    type: changeTypes.NODE_ADDED,
    payload: {
      node: VDOMElement,
      parentPointer,
    },
  };
};

/**
 * for NODE_REMOVED change type
 * we need to pass only the path to the node to remove
 **/
const createNodeRemoved = (VDOMElement) => {
  return {
    path: VDOMElement.path,
    type: changeTypes.NODE_REMOVED,
    payload: {},
  };
};

/**
 * for NODE_REPLACED change type
 * we need to pass the new node and the path to the parent
 * so we can remove the old one and add this new one
 **/
const createNodeReplaced = (VDOMElement, parentPointer) => {
  return {
    path: VDOMElement.path,
    type: changeTypes.NODE_REPLACED,
    payload: {
      newNode: VDOMElement,
      parentPointer,
    },
  };
};

/**
 * for PRIMITIVE_UPDATED change type
 * we need to pass the new value and the path to the node, so we can update its content
 **/
const createPrimitiveUpdated = (VDOMElement, newElement) => {
  return {
    path: VDOMElement.path,
    type: changeTypes.PRIMITIVE_UPDATED,
    payload: {
      newElement,
    },
  };
};

/**
 * for PROPS change type
 * we need to pass the new props and the path to the node, so we can update its props
 **/
const createPropsChangeRemoved = (oldValue) => {
  return [
    propsChangeTypes.REMOVED,
    {
      oldValue,
    },
  ];
};

const createPropsChangeUpdated = (oldValue, newValue) => {
  return [
    propsChangeTypes.UPDATED,
    {
      oldValue,
      newValue,
    },
  ];
};

const createPropsUpdated = (VDOMElement, changedProps) => {
  return {
    path: VDOMElement.path,
    type: changeTypes.PROPS,
    payload: {
      changedProps,
    },
  };
};

export const getVDOMDiff = (VDOMElement, VDOM, parentPointer) => {
  const previousVDOMElement = getVDOMElementByPath(
    VDOMElement.path,
    VDOM.previous
  );

  // 1. if there is no previous element in the position, it means is a new element (ADDED)
  if (!previousVDOMElement) {
    return [createNodeAdded(VDOMElement, parentPointer)];
  }

  // 2. if the types are different, it means the element was replaced
  const previousElement = previousVDOMElement.element;
  const currentElement = VDOMElement;
  if (previousElement.type !== currentElement.type) {
    return [createNodeReplaced(VDOMElement, parentPointer)];
  }

  // 3. if the two elements are primitives, we need to check if their values are different
  if (
    isPrimitiveElement(previousElement) &&
    isPrimitiveElement(currentElement)
  ) {
    if (previousElement.value !== currentElement.value) {
      return [createPrimitiveUpdated(VDOMElement, currentElement)];
    }

    return [];
  }

  const changedProps = {};

  // get all the prop names of previous and current element
  const propsKeys = Array.from(
    new Set([
      ...Object.keys(previousElement.props),
      ...Object.keys(currentElement.props),
    ])
  );

  for (const key of propsKeys) {
    // ignore children prop
    if (key === "children") {
      continue;
    }

    const currentPropValue = currentElement.props[key];
    const previousPropValue = previousElement.props[key];

    // if the new prop has no value, it means it was removed
    if (typeof currentPropValue === "undefined") {
      changedProps[key] = createPropsChangeRemoved(previousPropValue);
      continue;
    }

    // if the previous and current prop values are different, it means it was updated
    if (previousPropValue !== currentPropValue) {
      changedProps[key] = createPropsChangeUpdated(
        previousPropValue,
        currentPropValue
      );
    }
  }

  let diff = [];

  // if there are any changed props, we need to add a PROPS change type into the diff array
  if (Object.keys(changedProps).length > 0) {
    diff.push(createPropsUpdated(VDOMElement, changedProps));
  }

  const previousChildren = previousVDOMElement.children || [];
  const currentChildren = VDOMElement.props.children || [];
  const maxLength = Math.max(previousChildren.length, currentChildren.length);
  for (let i = 0; i < maxLength; i++) {
    // const previousChild = previousChildren[i];
    const currentChild = currentChildren[i];

    // if there is no children in the current index, it means the previous one was removed
    if (!currentChild) {
      diff.push(createNodeRemoved(previousChildren[i].element.path));
      continue;
    }

    const subTreeDiff = getVDOMDiff(currentChild, VDOM, VDOMElement.path);
    diff = [...diff, ...subTreeDiff];
  }

  return diff;
};
