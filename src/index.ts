import { getQuerySelector } from './select';

export * as common from './common';
export { optimize } from './optimize';
export { getMultiSelector, getSingleSelector } from './select';
export const select = getQuerySelector;

// eslint-disable-next-line import/no-default-export
export default getQuerySelector;
