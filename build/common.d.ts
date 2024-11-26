/**
 * # Common
 *
 * Process collections for similarities.
 */
import { Options } from './types';
type CommonProperties = {
    classes: string[];
    attributes: Record<string, string>;
    tag: string | null;
};
export declare const getCommonAncestor: (elements: HTMLElement[], options?: Options) => HTMLElement | null;
/**
 * Get a set of common properties of elements
 *
 * @param  {Array.<HTMLElement>} elements - [description]
 * @return {Object}                       - [description]
 */
export declare function getCommonProperties(elements: HTMLElement[]): CommonProperties;
export {};
//# sourceMappingURL=common.d.ts.map