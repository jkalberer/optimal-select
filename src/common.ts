/**
 * # Common
 *
 * Process collections for similarities.
 */

import { DEFAULT_IGNORE } from './match';
import { Options } from './types';

type CommonProperties = { classes: string[]; attributes: Record<string, string>; tag: string | null };

export const getCommonAncestor = (elements: HTMLElement[], options: Options = {}): HTMLElement | null => {
  const { root = document } = options;

  const ancestors: HTMLElement[][] = [];

  elements.forEach((element, index) => {
    const parents = [];
    let current = element;
    while (current !== root) {
      if (current.parentNode instanceof HTMLElement) {
        current = current.parentNode;
        parents.unshift(current);
      }
    }
    ancestors[index] = parents;
  });

  ancestors.sort((curr, next) => curr.length - next.length);

  const shallowAncestor = ancestors.shift();

  let ancestor = null;

  for (let ii = 0; shallowAncestor != null && ii < shallowAncestor.length; ii += 1) {
    const parent = shallowAncestor[ii];
    const missing = ancestors.some((otherParents) => {
      return !otherParents.some((otherParent) => otherParent === parent);
    });

    if (missing) {
      // == TODO: find similar sub-parents, not the top root, e.g. sharing a class selector
      break;
    }

    ancestor = parent;
  }

  return ancestor;
};

/**
 * Get a set of common properties of elements
 *
 * @param  {Array.<HTMLElement>} elements - [description]
 * @return {Object}                       - [description]
 */
export function getCommonProperties(elements: HTMLElement[], { ignore }: Options = {}): CommonProperties {
  const commonProperties: CommonProperties = {
    classes: [],
    attributes: {},
    tag: null,
  };

  const elementsToCheck = [...elements];
  let current = elementsToCheck.pop();
  if (current != null) {
    commonProperties.classes = Array.from(current.classList).filter(
      (clazz) => ignore?.class == null || ignore.class(clazz),
    );
    commonProperties.attributes = Object.values(current.attributes)
      .filter(({ name, value }) => {
        return (
          ((ignore == null || ignore.attribute?.(name, value)) ?? true) &&
          (ignore?.shouldRunDefaultAttributeIgnore === false || DEFAULT_IGNORE.attribute(name))
        );
      })
      .reduce((acc, attribute) => ({ ...acc, [attribute.name]: attribute.value }), {});
    commonProperties.tag = current.tagName;
  }

  while (elementsToCheck.length) {
    current = elementsToCheck.pop();
    if (current == null) {
      break;
    }

    const classSet = new Set(Array.from(current.classList));
    commonProperties.classes = commonProperties.classes.filter((clazz) => classSet.has(clazz));

    const attributeMap = new Map(
      Object.values(current.attributes).map((attribute) => [attribute.name, attribute.value]),
    );
    Object.entries(commonProperties.attributes).forEach(([key, value]) => {
      if (attributeMap.has(key) === false || attributeMap.get(key) !== value) {
        delete commonProperties.attributes[key];
      }
    });

    if (commonProperties.tag != null && commonProperties.tag !== current.tagName) {
      commonProperties.tag = null;
    }
  }

  return commonProperties;
}
