/** @ponchia/ui — typed class-name contract. */

export type ClassValue = string | false | null | undefined | ClassValue[];

/** The flat registry of every class @ponchia/ui defines. */
export declare const cls: Readonly<Record<string, string>>;

/** classnames-style joiner: skips falsy, flattens arrays. */
export declare function cx(...parts: ClassValue[]): string;

export interface ButtonOpts {
  variant?: 'ghost' | 'subtle' | 'danger';
  icon?: boolean;
}
export interface CardOpts {
  accent?: boolean;
  interactive?: boolean;
}
export interface BadgeOpts {
  tone?: 'accent' | 'success' | 'warning' | 'danger';
}
export interface ChipOpts {
  accent?: boolean;
}
export interface LinkOpts {
  arrow?: boolean;
}
export interface DotOpts {
  tone?: 'accent' | 'success' | 'warning' | 'danger';
  live?: boolean;
}
export interface DotgridOpts {
  accent?: boolean;
  dense?: boolean;
}
export interface TableOpts {
  density?: 'dense' | 'comfortable';
  lined?: boolean;
}
export interface EyebrowOpts {
  muted?: boolean;
}
export interface HintOpts {
  error?: boolean;
}
export interface ClusterOpts {
  between?: boolean;
}
export interface StaggerOpts {
  auto?: boolean;
}

export interface Ui {
  button(opts?: ButtonOpts): string;
  card(opts?: CardOpts): string;
  badge(opts?: BadgeOpts): string;
  chip(opts?: ChipOpts): string;
  link(opts?: LinkOpts): string;
  dot(opts?: DotOpts): string;
  dotgrid(opts?: DotgridOpts): string;
  table(opts?: TableOpts): string;
  eyebrow(opts?: EyebrowOpts): string;
  hint(opts?: HintOpts): string;
  cluster(opts?: ClusterOpts): string;
  stagger(opts?: StaggerOpts): string;
}

export declare const ui: Ui;
export default ui;
