/**
 * # Select
 *
 * Construct a unique CSS query selector to access the selected DOM element(s).
 * For longevity it applies different matching and optimization strategies.
 */
import { Options } from './types';
/**
 * Get a selector for the provided element
 *
 * @param  {HTMLElement} element - [description]
 * @param  {Object}      options - [description]
 * @return {string}              - [description]
 */
export declare const getSingleSelector: (inputElement: HTMLElement, options?: Options) => string | null;
export declare const getMultiSelector: (inputElements: HTMLElement[] | NodeList, options?: Options) => string | null;
/**
 * Choose action depending on the input (multiple/single)
 *
 * NOTE: extended detection is used for special cases like the <select> element with <options>
 *
 * @param  {HTMLElement|NodeList|Array.<HTMLElement>} input   - [description]
 * @param  {Object}                                   options - [description]
 * @return {string}                                           - [description]
 */
export declare const getQuerySelector: (input: HTMLElement | NodeList | HTMLElement[], options?: Options) => string | null;
//# sourceMappingURL=select.d.ts.map