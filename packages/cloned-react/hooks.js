let globalHooks = {};

export const useState = (...args) => {
  return globalHooks.useState(...args);
};

const areStatesDifferent = (previousState, newState) => {
  if (typeof newState === "object") {
    return JSON.stringify(previousState) !== JSON.stringify(newState);
  }
  return previousState !== newState;
};

/**
 * createUseState is a factory function that returns
 * a function that will be used to create the useState hook
 *
 * */

const createUseState = (onUpdate, hooksMap) => (path, isFirstRender) => {
  // stateIndexRef will keep track of the current state index in the given component
  // For example, if a component has 2 useState hooks, the first one will have index 0
  // and the second one will have index 1, so currentHook will look like:
  // {
  //   state: [
  //     [initialState1, setState1],
  //     [initialState2, setState2],
  //   ]
  // }
  let stateIndexRef = 0;
  let currentHook = hooksMap[path];

  if (isFirstRender) {
    currentHook.state = [];
  }

  // The function returned here, is actually the useState hook
  // that will be used in the component
  return (initialState) => {
    const stateIndex = stateIndexRef;
    stateIndexRef++;

    if (isFirstRender) {
      // since initialState can be a function, we need to call it to get the value in that case
      const initialStateValue =
        typeof initialState === "function" ? initialState() : initialState;

      const setState = (newState) => {
        // same thing as above here, newState can be a function, so we need to call to get the value
        const newStateFn =
          typeof newState === "function" ? newState : () => newState;
        const ownState = currentHook.state[stateIndex];
        const previousState = ownState[0];
        const newStateExecuted = newStateFn(previousState);
        const shouldUpdateState = areStatesDifferent(previousState, newState);

        if (shouldUpdateState) {
          ownState[0] = newStateExecuted;
          onUpdate();
        }
      };
      currentHook.state[stateIndex] = [initialStateValue, setState];
    }

    return currentHook.state[stateIndex];
  };
};

// This function will be used to set the hooks registry
// in the globalHooks object
// This is necessary to be able to access the useState hook
// in the components
const setHooksRegistry =
  (hooksMap, useStateRegistry) => (path, isFirstRender) => {
    // If it's the first render, we need to create a new entry in the hooksMap
    if (isFirstRender) {
      hooksMap[path] = {};
    }

    // We create the useState hook for the component
    // const useState = useStateRegistry(path, isFirstRender);
    globalHooks.useState = useStateRegistry(path, isFirstRender);
  };

export const createHooks = (update) => {
  /*
   * hooksMap will store the hooks for each component
   * each entry will have the structure:
   * {
   *   state: [],
   *   effect: [],
   * }
   */
  const hooksMap = {};

  const hooks = {
    current: null,
  };

  const onUpdate = () => update(hooks.current);
  const useState = createUseState(onUpdate, hooksMap);
  const registerHooks = setHooksRegistry(hooksMap, useState);
  hooks.current = { registerHooks };
  return hooks.current;
};
