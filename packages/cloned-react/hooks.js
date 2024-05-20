let globalHooks = {};

export const useState = (...args) => {
  return globalHooks.useState(...args);
};

export const useEffect = (...args) => {
  return globalHooks.useEffect(...args);
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

const areDependenciesNotMutated = (a, b) => {
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.every((item, index) => item === b[index]);
  }
  return false;
};

/**
 * createUseEffect is a factory function that returns
 * a function that will be used to create the useEffect hook
 * */
const createUseEffect = (onUpdateCallback, hooksMap) => {
  const callbackRefs = { current: () => {} };

  onUpdateCallback(() => {
    callbackRefs.current();
    callbackRefs.current = () => {};
  });

  // This function will be used to register the effect after the DOM update
  // It will be used in the components to register the effect, like staking them into
  // the pile of effects to be executed after the DOM update
  const registerEffectAfterDOMUpdate = (callback) => {
    const { current } = callbackRefs;
    callbackRefs.current = () => {
      current();
      callback();
    };
  };

  return (path, isFirstRender) => {
    let effectIndexRef = { current: 0 };
    const currentHook = hooksMap[path];
    if (isFirstRender) {
      currentHook.effect = [];
    }

    // The function returned here, is actually the useEffect hook
    // that will be used in the component
    return (effectCallback, dependencies) => {
      const effectIndex = effectIndexRef.current;
      const prevEffect = currentHook.effect[effectIndex] || {};

      // get the cleanup function from the previous effect or default to a noop function
      const { cleanup = () => {} } = prevEffect;

      effectIndexRef.current++;

      // if the dependencies are the same, we don't need to register the effect again
      if (areDependenciesNotMutated(prevEffect.dependencies, dependencies)) {
        return;
      }
      // call the cleanup function from the previous effect before registering next effect
      cleanup();
      currentHook.effect[effectIndex] = {
        dependencies: [...dependencies],
        // reset cleanup from previous effect
        cleanup: () => {},
      };
      registerEffectAfterDOMUpdate(() => {
        // here we are executing the effect callback
        // and also storing its return value, which is the cleanup function
        currentHook.effect[effectIndex].cleanup =
          effectCallback() || (() => {});
      });
    };
  };
};

// This function will be used to set the hooks registry
// in the globalHooks object
// This is necessary to be able to access the useState hook
// in the components
const setHooksRegistry =
  (hooksMap, useStateRegistry, useEffectRegistry) => (path, isFirstRender) => {
    // If it's the first render, we need to create a new entry in the hooksMap
    if (isFirstRender) {
      hooksMap[path] = {};
    }

    // We create the useState hook for the component
    // const useState = useStateRegistry(path, isFirstRender);
    globalHooks.useState = useStateRegistry(path, isFirstRender);
    globalHooks.useEffect = useEffectRegistry(path, isFirstRender);
  };

export const createHooks = (update, onUpdateCallback) => {
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
  const useEffect = createUseEffect(onUpdateCallback, hooksMap);
  const registerHooks = setHooksRegistry(hooksMap, useState, useEffect);
  hooks.current = { registerHooks };
  return hooks.current;
};
