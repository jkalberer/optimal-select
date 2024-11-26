/**
 * # Common
 *
 * Process collections for similarities.
 */

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
export function getCommonProperties(elements: HTMLElement[]): CommonProperties {
  const commonProperties: CommonProperties = {
    classes: [],
    attributes: {},
    tag: null,
  };

  elements.forEach((element) => {
    let { classes: commonClasses, attributes: commonAttributes } = commonProperties;
    const commonTag = commonProperties.tag;

    // ~ classes
    if (commonClasses !== undefined) {
      const classValue = element.getAttribute('class');
      if (classValue != null) {
        const classes = classValue.trim().split(' ');
        if (!commonClasses.length) {
          commonProperties.classes = classes;
        } else {
          commonClasses = commonClasses.filter((entry) => classes.some((name) => name === entry));
          if (commonClasses.length) {
            commonProperties.classes = commonClasses;
          } else {
            commonProperties.classes = [];
          }
        }
      } else {
        commonProperties.classes = [];
      }
    }

    // ~ attributes
    if (commonAttributes !== undefined) {
      const elementAttributes = element.attributes;
      const attributes: Record<string, string> = {};
      for (let ii = 0; ii < elementAttributes.length; ii += 1) {
        const attribute = elementAttributes[ii];
        const attributeName = attribute.name;
        // NOTE: workaround detection for non-standard phantomjs NamedNodeMap behaviour
        // (issue: https://github.com/ariya/phantomjs/issues/14634)
        if (attribute != null && attributeName !== 'class') {
          attributes[attributeName] = attribute.value;
        }
      }

      const attributesNames = Object.keys(attributes);
      const commonAttributesNames = Object.keys(commonAttributes);

      if (attributesNames.length) {
        if (!commonAttributesNames.length) {
          commonProperties.attributes = attributes;
        } else {
          commonAttributes = commonAttributesNames.reduce(
            (nextCommonAttributes, name) => {
              const value = commonAttributes[name];
              if (value === attributes[name]) {
                nextCommonAttributes[name] = value;
              }
              return nextCommonAttributes;
            },
            {} as Record<string, string>,
          );
          if (Object.keys(commonAttributes).length) {
            commonProperties.attributes = commonAttributes;
          } else {
            commonProperties.attributes = {};
          }
        }
      } else {
        commonProperties.attributes = {};
      }
    }

    // ~ tag
    if (commonTag != null) {
      const tag = element.tagName.toLowerCase();
      if (commonTag == null) {
        commonProperties.tag = tag;
      } else if (tag !== commonTag) {
        commonProperties.tag = null;
      }
    }
  });

  return commonProperties;
}
