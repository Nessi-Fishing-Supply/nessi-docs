export interface ConfigValue {
  value: string;
  label: string;
  description?: string;
}

export interface ConfigEnum {
  slug: string;
  name: string;
  description: string;
  source: string;
  values: ConfigValue[];
}
