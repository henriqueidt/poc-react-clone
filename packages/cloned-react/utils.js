export const isPrimitiveElement = (element) => element.type === "primitive";

export const isPrimitiveObject = (element) => {
  return typeof element !== "object";
};
