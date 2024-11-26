"use strict";
/**
 * # Select
 *
 * Construct a unique CSS query selector to access the selected DOM element(s).
 * For longevity it applies different matching and optimization strategies.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getQuerySelector = exports.getMultiSelector = exports.getSingleSelector = void 0;
const common_1 = require("./common");
const match_1 = require("./match");
const optimize_1 = require("./optimize");
/**
 * Get a selector for the provided element
 *
 * @param  {HTMLElement} element - [description]
 * @param  {Object}      options - [description]
 * @return {string}              - [description]
 */
const getSingleSelector = (inputElement, options = {}) => {
    let element = inputElement;
    if (element.nodeType === 3) {
        if (element.parentNode == null || !(element.parentNode instanceof HTMLElement)) {
            return null;
        }
        element = element.parentNode;
    }
    if (element.nodeType !== 1) {
        throw new Error(`Invalid input - only HTMLElements or representations of them are supported! (not "${typeof element}")`);
    }
    const selector = (0, match_1.match)(element, options);
    const optimized = (0, optimize_1.optimize)(selector, element, options);
    // debug
    // console.log(`
    //   selector:  ${selector}
    //   optimized: ${optimized}
    // `)
    return optimized;
};
exports.getSingleSelector = getSingleSelector;
function getCommonSelectors(elements) {
    const { classes, attributes, tag } = (0, common_1.getCommonProperties)(elements);
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
        }, [])
            .join('');
        selectorPath.push(attributeSelector);
    }
    if (selectorPath.length) {
        // -- TODO: check for parent-child relation
    }
    return [selectorPath.join('')];
}
const getMultiSelector = (inputElements, options = {}) => {
    const elements = Array.isArray(inputElements) ? inputElements : Array.from(inputElements);
    if (elements.some((element) => element.nodeType !== 1)) {
        throw new Error(`Invalid input - only an Array of HTMLElements or representations of them is supported!`);
    }
    const ancestor = (0, common_1.getCommonAncestor)(elements, options);
    const ancestorSelector = (0, exports.getSingleSelector)(ancestor, options);
    const commonSelectors = getCommonSelectors(elements);
    const descendantSelector = commonSelectors[0];
    const selector = (0, optimize_1.optimize)(`${ancestorSelector} ${descendantSelector}`, elements, options);
    const selectorMatches = Array.from(document.querySelectorAll(selector));
    if (!elements.every((element) => selectorMatches.some((entry) => entry === element))) {
        // Cluster matches to split into similar groups for sub selections
        console.warn(
        // eslint-disable-next-line max-len
        "\nThe selected elements can't be efficiently mapped.\nIt's probably best to use multiple single selectors instead!\n", elements);
        return null;
    }
    return selector;
};
exports.getMultiSelector = getMultiSelector;
/**
 * Choose action depending on the input (multiple/single)
 *
 * NOTE: extended detection is used for special cases like the <select> element with <options>
 *
 * @param  {HTMLElement|NodeList|Array.<HTMLElement>} input   - [description]
 * @param  {Object}                                   options - [description]
 * @return {string}                                           - [description]
 */
const getQuerySelector = (input, options = {}) => {
    if (input instanceof HTMLElement) {
        return (0, exports.getSingleSelector)(input, options);
    }
    return (0, exports.getMultiSelector)(input, options);
};
exports.getQuerySelector = getQuerySelector;
//# sourceMappingURL=select.js.map