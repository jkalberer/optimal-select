require=(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";
/**
 * # Common
 *
 * Process collections for similarities.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCommonAncestor = void 0;
exports.getCommonProperties = getCommonProperties;
const getCommonAncestor = (elements, options = {}) => {
    const { root = document } = options;
    const ancestors = [];
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
exports.getCommonAncestor = getCommonAncestor;
/**
 * Get a set of common properties of elements
 *
 * @param  {Array.<HTMLElement>} elements - [description]
 * @return {Object}                       - [description]
 */
function getCommonProperties(elements) {
    const commonProperties = {
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
                }
                else {
                    commonClasses = commonClasses.filter((entry) => classes.some((name) => name === entry));
                    if (commonClasses.length) {
                        commonProperties.classes = commonClasses;
                    }
                    else {
                        commonProperties.classes = [];
                    }
                }
            }
            else {
                commonProperties.classes = [];
            }
        }
        // ~ attributes
        if (commonAttributes !== undefined) {
            const elementAttributes = element.attributes;
            const attributes = {};
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
                }
                else {
                    commonAttributes = commonAttributesNames.reduce((nextCommonAttributes, name) => {
                        const value = commonAttributes[name];
                        if (value === attributes[name]) {
                            nextCommonAttributes[name] = value;
                        }
                        return nextCommonAttributes;
                    }, {});
                    if (Object.keys(commonAttributes).length) {
                        commonProperties.attributes = commonAttributes;
                    }
                    else {
                        commonProperties.attributes = {};
                    }
                }
            }
            else {
                commonProperties.attributes = {};
            }
        }
        // ~ tag
        if (commonTag != null) {
            const tag = element.tagName.toLowerCase();
            if (commonTag == null) {
                commonProperties.tag = tag;
            }
            else if (tag !== commonTag) {
                commonProperties.tag = null;
            }
        }
    });
    return commonProperties;
}

},{}],2:[function(require,module,exports){
"use strict";
/**
 * # Match
 *
 * Retrieve selector for a node.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.match = void 0;
const defaultIgnore = {
    attribute(attributeName) {
        return ['style', 'data-reactid', 'data-react-checksum'].includes(attributeName);
    },
};
function checkIgnore(predicate, name, value, defaultPredicate) {
    if (value == null) {
        return true;
    }
    const check = predicate ?? defaultPredicate;
    if (!check) {
        return false;
    }
    return check(name, value) && (defaultPredicate == null || defaultPredicate(name, value));
}
function findAttributesPattern(priority, element, ignore) {
    const { attributes } = element;
    const sortedKeys = Object.keys(attributes).sort((curr, next) => {
        const currPos = priority.indexOf(attributes[curr].name);
        const nextPos = priority.indexOf(attributes[next].name);
        if (nextPos === -1) {
            if (currPos === -1) {
                return 0;
            }
            return -1;
        }
        return currPos - nextPos;
    });
    for (let ii = 0; ii < sortedKeys.length; ii += 1) {
        const attribute = attributes[ii];
        const attributeName = attribute.name;
        const attributeValue = attribute.value;
        let currentIgnore = ignore.attribute;
        if (attributeName === 'class') {
            currentIgnore = ignore.class ?? ignore.attribute;
        }
        const currentDefaultIgnore = defaultIgnore.attribute;
        if (checkIgnore(currentIgnore, attributeName, attributeValue, currentDefaultIgnore)) {
            // eslint-disable-next-line no-continue
            continue;
        }
        let pattern = `[${attributeName}="${attributeValue}"]`;
        if (/\b\d/.test(attributeValue) === false) {
            if (attributeName === 'id') {
                pattern = `#${attributeValue}`;
            }
            if (attributeName === 'class') {
                const className = attributeValue.trim().replace(/\s+/g, '.');
                if (attributeValue !== '') {
                    pattern = `.${className}`;
                }
            }
        }
        return pattern;
    }
    return null;
}
/**
 * Extend path with attribute identifier
 *
 * @param  {Array.<string>} priority - [description]
 * @param  {HTMLElement}    element  - [description]
 * @param  {Object}         ignore   - [description]
 * @param  {Array.<string>} path     - [description]
 * @param  {HTMLElement}    parent   - [description]
 * @return {boolean}                 - [description]
 */
function checkAttributes(priority, element, ignore, path, parent = element.parentNode) {
    const pattern = findAttributesPattern(priority, element, ignore);
    if (pattern != null) {
        const matches = parent?.querySelectorAll(pattern);
        if (matches?.length === 1) {
            path.unshift(pattern);
            return true;
        }
    }
    return false;
}
function findTagPattern(element, ignore) {
    const tagName = element.tagName.toLowerCase();
    if (checkIgnore((_, value) => {
        if (ignore.tag instanceof RegExp) {
            return ignore.tag.test(value);
        }
        return value === ignore.tag;
    }, 'tagName', tagName)) {
        return null;
    }
    return tagName;
}
function checkTag(element, ignore, path, parent = element.parentNode) {
    const pattern = findTagPattern(element, ignore);
    if (pattern != null && parent instanceof HTMLElement) {
        const matches = parent.getElementsByTagName(pattern);
        if (matches.length === 1) {
            path.unshift(pattern);
            return true;
        }
    }
    return false;
}
function findPattern(priority, element, ignore) {
    let pattern = findAttributesPattern(priority, element, ignore);
    if (pattern == null) {
        pattern = findTagPattern(element, ignore);
    }
    return pattern;
}
function checkChilds(priority, element, ignore, path) {
    const parent = element.parentNode;
    if (!(parent instanceof HTMLElement)) {
        return false;
    }
    const { children } = parent;
    for (let ii = 0; ii < children.length; ii += 1) {
        const child = children[ii];
        if (child === element) {
            const childPattern = findPattern(priority, child, ignore);
            if (childPattern == null) {
                console.warn("\nElement couldn't be matched through strict ignore pattern!\n", child, ignore, childPattern);
                return false;
            }
            const pattern = `> ${childPattern}:nth-child(${ii + 1})`;
            path.unshift(pattern);
            return true;
        }
    }
    return false;
}
const match = (node, options) => {
    const { root = document, skip = null, priority = ['id', 'class', 'href', 'src'], ignore } = options ?? {};
    const path = [];
    let element = node;
    const skipCompare = skip != null
        ? (Array.isArray(skip) ? skip : [skip]).map((entry) => {
            if (typeof entry !== 'function') {
                return (item) => item === entry;
            }
            return entry;
        })
        : [];
    const skipChecks = (item) => {
        return skip != null && skipCompare.some((compare) => compare(item));
    };
    const ignoreClass = ignore?.class != null;
    if (ignoreClass) {
        const ignoreAttribute = ignore.attribute;
        ignore.attribute = (name, value) => {
            return (typeof value === 'string' && ignore.class?.(value) === true) || ignoreAttribute?.(name, value) === true;
        };
    }
    let length = 0;
    while (element !== root) {
        if (skipChecks(element) !== true) {
            // ~ global
            if (checkAttributes(priority, element, ignore ?? {}, path, root)) {
                break;
            }
            if (checkTag(element, ignore ?? {}, path, root)) {
                break;
            }
            // ~ local
            checkAttributes(priority, element, ignore ?? {}, path);
            if (path.length === length) {
                checkTag(element, ignore ?? {}, path);
            }
            // define only one part each iteration
            if (path.length === length) {
                checkChilds(priority, element, ignore ?? {}, path);
            }
        }
        element = element.parentNode;
        length = path.length;
    }
    if (element === root) {
        const pattern = findPattern(priority, element, ignore ?? {});
        if (pattern != null) {
            path.unshift(pattern);
        }
    }
    return path.join(' ');
};
exports.match = match;

},{}],3:[function(require,module,exports){
"use strict";
/**
 * # Optimize
 *
 * 1.) Improve efficiency through shorter selectors by removing redundancy
 * 2.) Improve robustness through selector transformation
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.optimize = void 0;
function compareResults(matches, elements) {
    return (matches.length === elements.length &&
        elements.every((element) => {
            for (let ii = 0; ii < matches.length; ii += 1) {
                if (matches[ii] === element) {
                    return true;
                }
            }
            return false;
        }));
}
function optimizePart(prePartInput, currentInput, postPartInput, elements) {
    let prePart = prePartInput;
    let current = currentInput;
    let postPart = postPartInput;
    if (prePart.length) {
        prePart = `${prePart} `;
    }
    if (postPart.length) {
        postPart = ` ${postPart}`;
    }
    // robustness: attribute without value (generalization)
    if (/\[*\]/.test(current)) {
        const key = current.replace(/=.*$/, ']');
        let pattern = `${prePart}${key}${postPart}`;
        let matches = document.querySelectorAll(pattern);
        if (compareResults(matches, elements)) {
            current = key;
        }
        else {
            // robustness: replace specific key-value with base tag (heuristic)
            const references = document.querySelectorAll(`${prePart}${key}`);
            for (let ii = 0; ii < references.length; ii += 1) {
                const reference = references[ii];
                if (elements.some((element) => reference.contains(element))) {
                    const description = reference.tagName.toLowerCase();
                    pattern = `${prePart}${description}${postPart}`;
                    matches = document.querySelectorAll(pattern);
                    if (compareResults(matches, elements)) {
                        current = description;
                    }
                    break;
                }
            }
        }
    }
    // robustness: descendant instead child (heuristic)
    if (/>/.test(current)) {
        const descendant = current.replace(/>/, '');
        const pattern = `${prePart}${descendant}${postPart}`;
        const matches = document.querySelectorAll(pattern);
        if (compareResults(matches, elements)) {
            current = descendant;
        }
    }
    // robustness: 'nth-of-type' instead 'nth-child' (heuristic)
    if (/:nth-child/.test(current)) {
        // -- TODO: consider complete coverage of 'nth-of-type' replacement
        const type = current.replace(/nth-child/g, 'nth-of-type');
        const pattern = `${prePart}${type}${postPart}`;
        const matches = document.querySelectorAll(pattern);
        if (compareResults(matches, elements)) {
            current = type;
        }
    }
    // efficiency: combinations of classname (partial permutations)
    if (/\.\S+\.\S+/.test(current)) {
        let names = current
            .trim()
            .split('.')
            .slice(1)
            .map((name) => `.${name}`)
            .sort((curr, next) => curr.length - next.length);
        while (names.length) {
            const partial = current.replace(names.shift(), '').trim();
            const pattern = `${prePart}${partial}${postPart}`.trim();
            if (!pattern.length || pattern.charAt(0) === '>' || pattern.charAt(pattern.length - 1) === '>') {
                break;
            }
            const matches = document.querySelectorAll(pattern);
            if (compareResults(matches, elements)) {
                current = partial;
            }
        }
        // robustness: degrade complex classname (heuristic)
        names = current !== '' ? current.match(/\./g) : null;
        if (names != null && names.length > 2) {
            const references = document.querySelectorAll(`${prePart}${current}`);
            for (let ii = 0; ii < references.length; ii += 1) {
                const reference = references[ii];
                if (elements.some((element) => reference.contains(element))) {
                    // -- TODO:
                    // - check using attributes + regard excludes
                    const description = reference.tagName.toLowerCase();
                    const pattern = `${prePart}${description}${postPart}`;
                    const matches = document.querySelectorAll(pattern);
                    if (compareResults(matches, elements)) {
                        current = description;
                    }
                    break;
                }
            }
        }
    }
    return current;
}
const optimize = (selector, inputElements, options = {}) => {
    // convert single entry and NodeList
    const elements = Array.isArray(inputElements) ? inputElements : [inputElements];
    if (!elements.length || elements.some((element) => element.nodeType !== 1)) {
        throw new Error(
        // eslint-disable-next-line max-len
        `Invalid input - to compare HTMLElements its necessary to provide a reference of the selected node(s)! (missing "elements")`);
    }
    // chunk parts outside of quotes (http://stackoverflow.com/a/25663729)
    let path = selector.replace(/> /g, '>').split(/\s+(?=(?:(?:[^"]*"){2})*[^"]*$)/);
    if (path.length < 2) {
        return optimizePart('', selector, '', elements);
    }
    const shortened = [path.pop()];
    while (path.length > 1) {
        const current = path.pop();
        const prePart = path.join(' ');
        const postPart = shortened.join(' ');
        const pattern = `${prePart} ${postPart}`;
        const matches = document.querySelectorAll(pattern);
        if (matches.length !== elements.length) {
            shortened.unshift(optimizePart(prePart, current, postPart, elements));
        }
    }
    shortened.unshift(path[0]);
    path = shortened.filter((item) => item != null);
    // optimize start + end
    path[0] = optimizePart('', path[0], path.slice(1).join(' '), elements);
    path[path.length - 1] = optimizePart(path.slice(0, -1).join(' '), path[path.length - 1], '', elements);
    return path.join(' ').replace(/>/g, '> ').trim();
};
exports.optimize = optimize;

},{}],4:[function(require,module,exports){
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

},{"./common":1,"./match":2,"./optimize":3}],"optimal-select":[function(require,module,exports){
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.select = exports.getSingleSelector = exports.getMultiSelector = exports.optimize = exports.common = void 0;
const select_1 = require("./select");
exports.common = __importStar(require("./common"));
var optimize_1 = require("./optimize");
Object.defineProperty(exports, "optimize", { enumerable: true, get: function () { return optimize_1.optimize; } });
var select_2 = require("./select");
Object.defineProperty(exports, "getMultiSelector", { enumerable: true, get: function () { return select_2.getMultiSelector; } });
Object.defineProperty(exports, "getSingleSelector", { enumerable: true, get: function () { return select_2.getSingleSelector; } });
exports.select = select_1.getQuerySelector;
// eslint-disable-next-line import/no-default-export
exports.default = select_1.getQuerySelector;

},{"./common":1,"./optimize":3,"./select":4}]},{},[]);
