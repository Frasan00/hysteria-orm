export type OpenApiModelType = {
  type: "object";
  properties: Record<string, OpenApiModelPropertyType>;
  required?: string[];
};

export type OpenApiModelPropertyType = {
  type: "string" | "number" | "boolean" | "array" | "object" | "null";
  items?: OpenApiModelType;
  enum?: string[];
  format?: string;
  description?: string;
  example?: any;
  default?: any;
  nullable?: boolean;
};
