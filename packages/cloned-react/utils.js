export const isPrimitiveElement = (element) => element.type === "primitive";

export const isPrimitiveObject = (element) => {
  return typeof element !== "object";
};

// returns if an element is a child of another by their paths
export const isChildPath = (path, parentPath) => {
  // If the parentPath is empty, it means that the element is a root element
  // and therefore is a child of the parent
  if (parentPath.length === 0) {
    return true;
  }
  // Checks if the path starts with the parentPath
  // and has a comma followed by a number
  // to indicate that it is a child of the parent
  return new RegExp(`^${parentPath},(\\d+,?)+`).test(path);
};
