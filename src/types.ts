export type CheckFn = (name: string, value: string) => boolean;

type IgnoreType = {
  class?: (className: string) => boolean;
  attribute?: CheckFn;
  tag?: string | number | RegExp;
  shouldRunDefaultAttributeIgnore?: boolean;
};

export type Options = {
  root?: ParentNode;
  skip?: null | ((element: HTMLElement) => boolean) | ((element: HTMLElement) => boolean)[];
  priority?: ('id' | 'class' | 'href' | 'src')[];
  ignore?: IgnoreType;
};
