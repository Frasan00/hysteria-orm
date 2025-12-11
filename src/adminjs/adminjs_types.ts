/**
 * @description AdminJS plugin types - All AdminJS imports are done at runtime via dynamic import()
 * @description This ensures the plugin is completely optional
 */

import type { Model } from "../sql/models/model";
import type express from "express";

/**
 * @description Configuration options for AdminJS integration
 */
export type AdminJsOptions = {
  /**
   * @description Whether to enable AdminJS admin panel
   * @default false
   */
  enabled?: boolean;

  /**
   * @description The root path for the AdminJS panel
   * @default '/admin'
   */
  rootPath?: string;

  /**
   * @description Custom branding options for AdminJS
   */
  branding?: AdminJsBranding;

  /**
   * @description Models to expose in the AdminJS panel
   * @description If not provided, all models registered in the SqlDataSource will be used
   */
  resources?: (typeof Model)[];

  /**
   * @description Custom resource options for specific models
   */
  resourceOptions?: Record<string, AdminJsResourceOptions>;

  /**
   * @description Locale settings for AdminJS
   */
  locale?: AdminJsLocale;

  /**
   * @description Assets configuration
   */
  assets?: AdminJsAssets;

  /**
   * @description Settings configuration
   */
  settings?: AdminJsSettings;

  /**
   * @description Custom pages to add to AdminJS
   */
  pages?: Record<string, AdminJsPage>;
};

export type AdminJsBranding = {
  /**
   * @description Company name displayed in the admin panel
   */
  companyName?: string;

  /**
   * @description URL to the company logo
   */
  logo?: string;

  /**
   * @description URL to the favicon
   */
  favicon?: string;

  /**
   * @description Whether to display the "Made with AdminJS" notice
   * @default true
   */
  withMadeWithLove?: boolean;

  /**
   * @description Theme settings
   */
  theme?: Record<string, unknown>;

  /**
   * @description Software brothers branding override
   */
  softwareBrothers?: boolean;
};

export type AdminJsResourceOptions = {
  /**
   * @description Navigation settings for this resource
   */
  navigation?: {
    name?: string;
    icon?: string;
  } | null;

  /**
   * @description Custom name for the resource
   */
  name?: string;

  /**
   * @description Properties configuration
   */
  properties?: Record<string, AdminJsPropertyOptions>;

  /**
   * @description Actions configuration
   */
  actions?: Record<string, AdminJsActionOptions>;

  /**
   * @description Sort configuration
   */
  sort?: {
    sortBy?: string;
    direction?: "asc" | "desc";
  };

  /**
   * @description List of properties to display in list view
   */
  listProperties?: string[];

  /**
   * @description List of properties to display in show view
   */
  showProperties?: string[];

  /**
   * @description List of properties to display in edit view
   */
  editProperties?: string[];

  /**
   * @description List of properties to display in filter view
   */
  filterProperties?: string[];

  /**
   * @description Parent resource for navigation grouping
   */
  parent?: {
    name?: string;
    icon?: string;
  } | null;
};

export type AdminJsPropertyOptions = {
  /**
   * @description Whether the property is visible in the list view
   */
  isVisible?:
    | boolean
    | {
        list?: boolean;
        edit?: boolean;
        filter?: boolean;
        show?: boolean;
      };

  /**
   * @description Position of the property in forms
   */
  position?: number;

  /**
   * @description Whether the property is required
   */
  isRequired?: boolean;

  /**
   * @description Whether the property is an ID
   */
  isId?: boolean;

  /**
   * @description Whether the property is a title
   */
  isTitle?: boolean;

  /**
   * @description Whether the property is disabled in edit forms
   */
  isDisabled?: boolean;

  /**
   * @description Whether the property is an array
   */
  isArray?: boolean;

  /**
   * @description Whether the property is sortable
   */
  isSortable?: boolean;

  /**
   * @description Property type override
   */
  type?: string;

  /**
   * @description Available values for select/enum properties
   */
  availableValues?: Array<{
    value: string | number;
    label: string;
  }>;

  /**
   * @description Custom components for rendering
   */
  components?: {
    list?: string;
    show?: string;
    edit?: string;
    filter?: string;
  };

  /**
   * @description Custom props to pass to components
   */
  props?: Record<string, unknown>;

  /**
   * @description Description shown in the UI
   */
  description?: string;
};

export type AdminJsActionOptions = {
  /**
   * @description Action type
   */
  actionType?: "record" | "resource" | "bulk";

  /**
   * @description Whether the action is visible
   */
  isVisible?: boolean;

  /**
   * @description Whether the action is accessible
   */
  isAccessible?: boolean;

  /**
   * @description Icon for the action
   */
  icon?: string;

  /**
   * @description Label for the action
   */
  label?: string;

  /**
   * @description Guard message shown before action execution
   */
  guard?: string;

  /**
   * @description Whether to show the action in the drawer
   */
  showInDrawer?: boolean;

  /**
   * @description Whether to hide the action button
   */
  hideActionHeader?: boolean;

  /**
   * @description Custom component for the action
   */
  component?: string | false;

  /**
   * @description Container width for the action
   */
  containerWidth?: number | string;

  /**
   * @description Layout configuration
   */
  layout?: unknown[];
};

export type AdminJsLocale = {
  /**
   * @description Language code
   */
  language?: string;

  /**
   * @description Available languages
   */
  availableLanguages?: string[];

  /**
   * @description Custom translations
   */
  translations?: Record<string, Record<string, unknown>>;

  /**
   * @description Whether to show the language selector
   */
  withBackend?: boolean;
};

export type AdminJsAssets = {
  /**
   * @description Custom styles to include
   */
  styles?: string[];

  /**
   * @description Custom scripts to include
   */
  scripts?: string[];
};

export type AdminJsSettings = {
  /**
   * @description Default number of items per page
   */
  defaultPerPage?: number;
};

export type AdminJsPage = {
  /**
   * @description Page component path
   */
  component?: string;

  /**
   * @description Page icon
   */
  icon?: string;

  /**
   * @description Handler for the page
   */
  handler?: (
    request: unknown,
    response: unknown,
    context: unknown,
  ) => Promise<unknown>;
};

export type AdminJsAdminInstance = {
  options: { rootPath: string; [key: string]: unknown };
  watch: () => Promise<void>;
  initialize: () => Promise<void>;
  resources: unknown[];
  findResource: (resourceId: string) => unknown;
};

/**
 * @description Return type for getAdminJs method
 */
export type AdminJsInstance = {
  /**
   * @description The AdminJS instance
   */
  admin: AdminJsAdminInstance;

  /**
   * @description Express router for AdminJS (if using express adapter)
   */
  router?: ReturnType<typeof express.Router>;
};

/**
 * @description Property type mapping from Hysteria ORM to AdminJS
 */
export const HYSTERIA_TO_ADMINJS_TYPE_MAP: Record<string, string> = {
  string: "string",
  varchar: "string",
  char: "string",
  text: "textarea",
  longtext: "textarea",
  mediumtext: "textarea",
  tinytext: "textarea",
  integer: "number",
  int: "number",
  smallint: "number",
  bigint: "number",
  tinyint: "number",
  mediumint: "number",
  float: "float",
  double: "float",
  decimal: "float",
  numeric: "float",
  real: "float",
  boolean: "boolean",
  bool: "boolean",
  date: "date",
  datetime: "datetime",
  timestamp: "datetime",
  time: "string",
  year: "number",
  json: "mixed",
  jsonb: "mixed",
  uuid: "string",
  ulid: "string",
  binary: "string",
  blob: "string",
  enum: "string",
};
