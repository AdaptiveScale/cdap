/*
 * Copyright © 2020 Cask Data, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */

import * as React from 'react';

import AbstractMultiRowWidget, {
  IMultiRowProps,
  IMultiRowWidgetProps,
} from 'components/AbstractWidget/AbstractMultiRowWidget';
import { IStageSchema } from 'components/AbstractWidget';
import KeyValueDropdownRow, {
  IDropdownOption,
  OrderingEnum,
} from 'components/AbstractWidget/KeyValueDropdownWidget/KeyValueDropdownRow';

import ThemeWrapper from 'components/ThemeWrapper';
import { WIDGET_PROPTYPES } from 'components/AbstractWidget/constants';
import { objectQuery } from 'services/helpers';

interface IInputKeyValueDropdownWidgetProps extends IMultiRowWidgetProps {
  'key-placeholder'?: string;
  'kv-delimiter'?: string;
  dropdownOptions: IDropdownOption[];
  delimiter?: string;
  showDelimiter?: boolean;
  extraConfig?: any;
}

interface IInputKeyValueDropdownProps extends IMultiRowProps<IInputKeyValueDropdownWidgetProps> {}

interface IField {
  name: string;
  type: string[];
}

class InputFieldDropdownKeyValue extends AbstractMultiRowWidget<IInputKeyValueDropdownProps> {
  public getFields(schemas: IStageSchema[], allowedTypes: string[]) {
    let fields = [];
    if (!schemas || schemas.length === 0) {
      return fields;
    }
    const stage = schemas[0];

    try {
      const unparsedFields = JSON.parse(stage.schema).fields;

      if (unparsedFields.length > 0) {
        fields = unparsedFields
          .filter((field: IField) => this.containsType(field.type, allowedTypes))
          .map((field: IField) => field.name);
      }
    } catch {
      // tslint:disable-next-line: no-console
      console.log('Error: Invalid JSON schema');
    }
    return fields;
  }

  /*   Function that checks if types contains a type that is in allowedTypes
  This is meant to handle nullable fields since a nullable string type is
  presented as ['string','null']. */
  public containsType(types: string[], allowedTypes: string[]) {
    if (allowedTypes.length === 0) {
      return true;
    }

    return allowedTypes.includes(this.extractType(types));
  }

  public extractType(types) {
    let value = types;
    if (types instanceof Array) {
      if (types.length === 1) {
        value = types[0];
      } else if (types.length === 2 && types.includes('null')) {
        value = types.indexOf('null') === 0 ? types[1] : types[0];
      }
    }

    if (typeof value === 'object') {
      value = value.logicalType || value;
    }
    return value;
  }

  public renderRow = (id, index) => {
    const keyPlaceholder = objectQuery(this.props, 'widgetProps', 'key-placeholder');
    const kvDelimiter = objectQuery(this.props, 'widgetProps', 'kv-delimiter');
    const dropdownOptions = objectQuery(this.props.extraConfig, 'inputSchema');
    const fieldValues = this.getFields(dropdownOptions, []);

    return (
      <KeyValueDropdownRow
        key={id}
        value={this.values[id].value}
        id={id}
        index={index}
        onChange={this.editRow}
        addRow={this.addRow.bind(this, index)}
        removeRow={this.removeRow.bind(this, index)}
        autofocus={this.state.autofocus === id}
        changeFocus={this.changeFocus}
        disabled={this.props.disabled}
        keyPlaceholder={keyPlaceholder}
        kvDelimiter={kvDelimiter}
        forwardedRef={this.values[id].ref}
        errors={this.props.errors}
        dropdownOptions={fieldValues}
        ordering={OrderingEnum.VALUESFIRST}
      />
    );
  };
}

export default function KeyValueDropdownWidget(props) {
  return (
    <ThemeWrapper>
      <InputFieldDropdownKeyValue {...props} />
    </ThemeWrapper>
  );
}

(KeyValueDropdownWidget as any).propTypes = WIDGET_PROPTYPES;
(KeyValueDropdownWidget as any).getWidgetAttributes = () => {
  return {
    'key-placeholder': { type: 'string', required: false },
    'kv-delimiter': { type: 'string', required: false },
    delimiter: { type: 'string', required: false },
    dropdownOptions: { type: 'IDropdownOption[]', required: true },
    showDelimiter: { type: 'boolean', required: false },
    extraConfig: { type: 'any', required: false },
  };
};
