/**
 * # Select
 *
 * Construct a unique CSS query selector to access the selected DOM element(s).
 * For longevity it applies different matching and optimization strategies.
 */

import { getCommonAncestor, getCommonProperties } from './common';
import { match } from './match';
import { optimize } from './optimize';
import { Options } from './types';

/**
 * Get a selector for the provided element
 *
 * @param  {HTMLElement} element - [description]
 * @param  {Object}      options - [description]
 * @return {string}              - [description]
 */
export const getSingleSelector = (inputElement: HTMLElement, options: Options = {}): string | null => {
  let element = inputElement;
  if (element.nodeType === 3) {
    if (element.parentNode == null || !(element.parentNode instanceof HTMLElement)) {
      return null;
    }
    element = element.parentNode;
  }

  if (element.nodeType !== 1) {
    throw new Error(
      `Invalid input - only HTMLElements or representations of them are supported! (not "${typeof element}")`,
    );
  }

  const selector = match(element, options);
  const optimized = optimize(selector, element, options);

  // debug
  // console.log(`
  //   selector:  ${selector}
  //   optimized: ${optimized}
  // `)

  return optimized;
};

function getCommonSelectors(elements: HTMLElement[], options: Options = {}): [string] {
  const { classes, attributes, tag } = getCommonProperties(elements, options);

  const selectorPath = [];

  if (tag != null) {
    selectorPath.push(tag);
  }

  if (classes != null) {
    const classSelector = classes.map((name) => `.${name}`).join('');
    selectorPath.push(classSelector);
  }

  if (attributes != null) {
    const attributeSelector = Object.keys(attributes)
      .reduce((parts, name) => {
        parts.push(`[${name}="${attributes[name]}"]`);
        return parts;
      }, [] as string[])
      .join('');
    selectorPath.push(attributeSelector);
  }

  if (selectorPath.length) {
    // -- TODO: check for parent-child relation
  }

  return [selectorPath.join('')];
}

export const getMultiSelector = (inputElements: HTMLElement[] | NodeList, options: Options = {}): string | null => {
  const elements = Array.isArray(inputElements) ? inputElements : (Array.from(inputElements) as HTMLElement[]);

  if (elements.some((element) => element.nodeType !== 1)) {
    throw new Error(`Invalid input - only an Array of HTMLElements or representations of them is supported!`);
  }

  const ancestor = getCommonAncestor(elements, options);
  const ancestorSelector = getSingleSelector(ancestor!, options);

  const commonSelectors = getCommonSelectors(elements);
  const descendantSelector = commonSelectors[0];

  const selector = optimize(`${ancestorSelector} ${descendantSelector}`, elements, options);
  const selectorMatches = Array.from(document.querySelectorAll(selector!));

  if (!elements.every((element) => selectorMatches.some((entry) => entry === element))) {
    // Cluster matches to split into similar groups for sub selections
    console.warn(
      // eslint-disable-next-line max-len
      "\nThe selected elements can't be efficiently mapped.\nIt's probably best to use multiple single selectors instead!\n",
      elements,
    );
    return null;
  }

  return selector;
};

/**
 * Choose action depending on the input (multiple/single)
 *
 * NOTE: extended detection is used for special cases like the <select> element with <options>
 *
 * @param  {HTMLElement|NodeList|Array.<HTMLElement>} input   - [description]
 * @param  {Object}                                   options - [description]
 * @return {string}                                           - [description]
 */
export const getQuerySelector = (
  input: HTMLElement | NodeList | HTMLElement[],
  options: Options = {},
): string | null => {
  if (input instanceof HTMLElement) {
    return getSingleSelector(input, options);
  }
  return getMultiSelector(input, options);
};
