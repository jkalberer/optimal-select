/**
 * # Optimize
 *
 * 1.) Improve efficiency through shorter selectors by removing redundancy
 * 2.) Improve robustness through selector transformation
 */

import { Options } from './types';

function compareResults(matches: NodeListOf<Element>, elements: HTMLElement[]): boolean {
  return (
    matches.length === elements.length &&
    elements.every((element) => {
      for (let ii = 0; ii < matches.length; ii += 1) {
        if (matches[ii] === element) {
          return true;
        }
      }
      return false;
    })
  );
}

function optimizePart(
  prePartInput: string,
  currentInput: string,
  postPartInput: string,
  elements: HTMLElement[],
): string {
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
    } else {
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
    let names: RegExpMatchArray | string[] | null = current
      .trim()
      .split('.')
      .slice(1)
      .map((name) => `.${name}`)
      .sort((curr, next) => curr.length - next.length);
    while (names.length) {
      const partial = current.replace(names.shift()!, '').trim();
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

export const optimize = (
  selector: string,
  inputElements: HTMLElement | HTMLElement[],
  options: Options = {},
): string | null => {
  // convert single entry and NodeList
  const elements = Array.isArray(inputElements) ? inputElements : [inputElements];

  if (!elements.length || elements.some((element) => element.nodeType !== 1)) {
    throw new Error(
      // eslint-disable-next-line max-len
      `Invalid input - to compare HTMLElements its necessary to provide a reference of the selected node(s)! (missing "elements")`,
    );
  }

  // chunk parts outside of quotes (http://stackoverflow.com/a/25663729)
  let path = selector.replace(/> /g, '>').split(/\s+(?=(?:(?:[^"]*"){2})*[^"]*$)/);

  if (path.length < 2) {
    return optimizePart('', selector, '', elements);
  }

  const shortened = [path.pop()];
  while (path.length > 1) {
    const current = path.pop()!;
    const prePart = path.join(' ');
    const postPart = shortened.join(' ');

    const pattern = `${prePart} ${postPart}`;
    const matches = document.querySelectorAll(pattern);
    if (matches.length !== elements.length) {
      shortened.unshift(optimizePart(prePart, current, postPart, elements));
    }
  }
  shortened.unshift(path[0]);
  path = shortened.filter((item): item is string => item != null);

  // optimize start + end
  path[0] = optimizePart('', path[0], path.slice(1).join(' '), elements);
  path[path.length - 1] = optimizePart(path.slice(0, -1).join(' '), path[path.length - 1], '', elements);

  return path.join(' ').replace(/>/g, '> ').trim();
};
