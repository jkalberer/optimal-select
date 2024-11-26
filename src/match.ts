/**
 * # Match
 *
 * Retrieve selector for a node.
 */

import { CheckFn, Options } from './types';

const defaultIgnore = {
  attribute(attributeName: string): boolean {
    return ['style', 'data-reactid', 'data-react-checksum'].includes(attributeName);
  },
};

function checkIgnore(
  predicate: CheckFn | undefined,
  name: string,
  value: string,
  defaultPredicate?: CheckFn | undefined,
): boolean {
  if (value == null) {
    return true;
  }
  const check = predicate ?? defaultPredicate;
  if (!check) {
    return false;
  }
  return check(name, value) && (defaultPredicate == null || defaultPredicate(name, value));
}

function findAttributesPattern(
  priority: Exclude<Options['priority'], undefined>,
  element: Element,
  ignore: Exclude<Options['ignore'], undefined>,
): string | null {
  const { attributes } = element;

  const sortedKeys = Object.keys(attributes).sort((curr: string, next: string) => {
    const currPos = (priority as string[]).indexOf(attributes[curr as unknown as number]!.name);
    const nextPos = (priority as string[]).indexOf(attributes[next as unknown as number]!.name);
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
function checkAttributes(
  priority: Exclude<Options['priority'], undefined>,
  element: HTMLElement,
  ignore: Exclude<Options['ignore'], undefined>,
  path: string[],
  parent = element.parentNode,
): boolean {
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

function findTagPattern(element: Element, ignore: Exclude<Options['ignore'], undefined>): string | null {
  const tagName = element.tagName.toLowerCase();
  if (
    checkIgnore(
      (_, value) => {
        if (ignore.tag instanceof RegExp) {
          return ignore.tag.test(value);
        }

        return value === ignore.tag;
      },
      'tagName',
      tagName,
    )
  ) {
    return null;
  }
  return tagName;
}

function checkTag(
  element: HTMLElement,
  ignore: Exclude<Options['ignore'], undefined>,
  path: string[],
  parent = element.parentNode,
): boolean {
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

function findPattern(
  priority: Exclude<Options['priority'], undefined>,
  element: Element,
  ignore: Exclude<Options['ignore'], undefined>,
): string | null {
  let pattern = findAttributesPattern(priority, element, ignore);
  if (pattern == null) {
    pattern = findTagPattern(element, ignore);
  }
  return pattern;
}

function checkChilds(
  priority: Exclude<Options['priority'], undefined>,
  element: HTMLElement,
  ignore: Exclude<Options['ignore'], undefined>,
  path: string[],
): boolean {
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

export const match = (node: HTMLElement, options?: Options): string => {
  const { root = document, skip = null, priority = ['id', 'class', 'href', 'src'], ignore } = options ?? {};

  const path: string[] = [];
  let element = node;

  const skipCompare =
    skip != null
      ? (Array.isArray(skip) ? skip : [skip]).map((entry) => {
          if (typeof entry !== 'function') {
            return (item: HTMLElement): boolean => item === entry;
          }
          return entry;
        })
      : [];

  const skipChecks = (item: HTMLElement): boolean => {
    return skip != null && skipCompare.some((compare) => compare(item));
  };

  const ignoreClass = ignore?.class != null;

  if (ignoreClass) {
    const ignoreAttribute = ignore.attribute;
    ignore.attribute = (name, value): boolean => {
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

    element = element.parentNode as HTMLElement;
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
