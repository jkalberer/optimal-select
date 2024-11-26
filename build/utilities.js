"use strict";
/**
 * # Utilities
 *
 * Convenience helpers.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertNodeList = convertNodeList;
exports.escapeValue = escapeValue;
/**
 * Create an array with the DOM nodes of the list
 *
 * @param  {NodeList}             nodes - [description]
 * @return {Array.<HTMLElement>}        - [description]
 */
function convertNodeList(nodes) {
    const { length } = nodes;
    const arr = new Array(length);
    for (var i = 0; i < length; i++) {
        arr[i] = nodes[i];
    }
    return arr;
}
/**
 * Escape special characters and line breaks as a simplified version of 'CSS.escape()'
 *
 * Description of valid characters: https://mathiasbynens.be/notes/css-escapes
 *
 * @param  {String?} value - [description]
 * @return {String}        - [description]
 */
function escapeValue(value) {
    return value && value.replace(/['"`\\/:\?&!#$%^()[\]{|}*+;,.<=>@~]/g, '\\$&')
        .replace(/\n/g, '\A');
}
//# sourceMappingURL=utilities.js.map