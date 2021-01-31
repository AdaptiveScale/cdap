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
import IconButton from '@material-ui/core/IconButton';
import { makeStyles, withStyles } from '@material-ui/core/styles';
import Box from '@material-ui/core/Box';
import { Checkbox, ListItemText, MenuItem, Select } from '@material-ui/core';
import DeleteIcon from '@material-ui/icons/Delete';
import KeyboardArrowDownIcon from '@material-ui/icons/KeyboardArrowDown';
import KeyboardArrowRightIcon from '@material-ui/icons/KeyboardArrowRight';

import { IStageSchema } from 'components/AbstractWidget';
import HierarchyPopoverButton from './HierarchyPopoverButton';
import HierarchyTree from './HierarchyTree';
import { objectQuery } from 'services/helpers';
import uuidV4 from 'uuid/v4';

interface IField {
  name: string;
  type: any;
}

const RowInputContainer = withStyles(() => {
  return {
    root: {
      display: 'grid',
      gridTemplateColumns: '4fr 2fr 0fr',
      padding: '2px 10px 2px 0px',
      position: 'relative',
      alignItems: 'center',
      marginTop: '0.5px',
      marginLeft: '6px',
      boxShadow:
        '0px 3px 1px -2px rgba(0,0,0,0.2), 0px 2px 2px 0px rgba(0,0,0,0.14), 0px 1px 5px 0px rgba(0,0,0,0.12)',
      borderRadius: '3px',
      '& [disabled]': {
        cursor: 'not-allowed',
      },
    },
  };
})(Box);

const MultiSelectWrapper = withStyles(() => {
  return {
    root: {
      position: 'relative',
      display: 'grid',
      gridTemplateColumns: '1fr',
      alignItems: 'center',
      marginLeft: '6px',
      width: '70%',
      '& [disabled]': {
        cursor: 'not-allowed',
      },
    },
  };
})(Box);

const RowButtonsWraper = withStyles(() => {
  return {
    root: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      justifyItems: 'end',
      '& [disabled]': {
        cursor: 'not-allowed',
      },
    },
  };
})(Box);

const InputFieldWrapper = withStyles(() => {
  return {
    root: {
      display: 'grid',
      gridTemplateColumns: '0fr 1fr',
      alignItems: 'center',
      '& [disabled]': {
        cursor: 'not-allowed',
      },
    },
  };
})(Box);

const ButtonIcon = withStyles(() => {
  return {
    root: {
      padding: '6.5px',
      '& [disabled]': {
        cursor: 'not-allowed',
      },
    },
  };
})(IconButton);

const HiddenBtn = withStyles(() => {
  return {
    root: {
      padding: '6.5px',
      visibility: 'hidden',
    },
  };
})(IconButton);

const useStyles = makeStyles(() => {
  return {
    input: {
      marginLeft: '5px',
      padding: '4px 0px 4px 4px',
      border: 0,
      width: '80%',
      '& [disabled]': {
        cursor: 'not-allowed',
      },
    },
    hierarchyIcon: {
      width: '10px',
      height: '36px',
      position: 'absolute',
      borderLeft: '2px solid rgba(0, 0, 0, 0.2)',
    },
    innerMostSiblingConnector: {
      top: '17px',
      left: '2px',
      width: '4px',
      height: '2px',
      content: '""',
      position: 'absolute',
      borderTop: '2px solid rgba(0, 0, 0, 0.2)',
    },
    relative: {
      position: 'relative',
    },
  };
});

function getFields(schemas: IStageSchema[], allowedTypes: string[]) {
  let fields = [];
  if (!schemas || schemas.length === 0) {
    return fields;
  }
  const stage = schemas[0];

  try {
    const unparsedFields = JSON.parse(stage.schema).fields;

    if (unparsedFields.length > 0) {
      fields = unparsedFields
        .filter((field: IField) => containsType(field.type, allowedTypes))
        .map((field: IField) => {
          if (Array.isArray(field.type)) {
            return { name: field.name, type: field.type[0] };
          }
          if (typeof field.type === 'object') {
            return { name: field.name, type: field.type.type, children: field.type.fields };
          }
          return { name: field.name, type: field.type };
        });
    }
  } catch {
    // tslint:disable-next-line: no-console
    console.log('Error: Invalid JSON schema');
  }
  return fields;
}

function containsType(types: string[], allowedTypes: string[]) {
  if (allowedTypes.length === 0) {
    return true;
  }

  return allowedTypes.includes(extractType(types));
}

function extractType(types) {
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

const HierarchyTreeNode = ({ node, setRecords, records, widgetProps, extraConfig }) => {
  const [multiSelectOptions, setMultiSelectOptions] = React.useState([]);
  const [childVisible, setChildVisiblity] = React.useState(false);
  const [showMultiSelect, setShowMultiSelect] = React.useState(false);
  const hasChild = node.children.length !== 0 ? true : false;

  const classes = useStyles();
  const inputSchema = objectQuery(extraConfig, 'inputSchema') || [];
  const allowedTypes: string[] = widgetProps.allowedTypes || [];
  const fieldValues = getFields(inputSchema, allowedTypes);

  let mrgL = 0;
  if (hasChild && childVisible) {
    mrgL += 6;
  }

  const fillMultiSelectOptions = (e) => {
    setMultiSelectOptions(e.target.value);
  };

  const handleMultiSelectClose = () => {
    const selectionsToBeAdded = [];
    multiSelectOptions.map((item) => {
      const elFound = fieldValues.find((element) => element.name === item);
      if (typeof elFound !== 'undefined') {
        selectionsToBeAdded.push(elFound);
      }
    });
    const childrenOfSelected = [];
    selectionsToBeAdded.forEach((item) => {
      const uniqueId = uuidV4();

      if (item.children) {
        item.children.forEach((child) => {
          const childId = uuidV4();
          childrenOfSelected.push({
            id: childId,
            parentId: uniqueId,
            name: child.name,
            type: child.type,
            children: [],
          });
        });
      }
      const childToBeAdded = {
        id: uniqueId,
        parentId: node.id,
        name: item.name,
        children: [],
        type: item.type,
      };
      setShowMultiSelect(false);
      setChildVisiblity(true);
      setRecords((prevState) => prevState.concat(childToBeAdded));
    });
    if (childrenOfSelected) {
      childrenOfSelected.forEach((child) => {
        setRecords((prevState) => prevState.concat(child));
      });
    }
    setMultiSelectOptions([]);
  };

  const nameChangeHandler = (e) => {
    const newRecords = [...records];
    newRecords.forEach((record) => {
      if (record.id === node.id) {
        record.name = e.target.value;
      }
    });
    setRecords(newRecords);
  };

  const handleAddNewRecordToParent = () => {
    setRecords((prevState) =>
      prevState.concat({
        id: uuidV4(),
        parentId: node.id,
        type: 'record',
        children: [],
        name: '',
      })
    );
    setChildVisiblity(true);
  };

  const recur = (...values) => ({ recur, values });

  const loop = (f) => {
    let a = f();
    while (a && a.recur === recur) {
      a = f(...a.values);
    }
    return a;
  };

  const removeFamily = (id = 0, nodes = []) =>
    loop(([node, ...more] = nodes, s = new Set([id]), r = []) =>
      node === undefined
        ? r
        : s.has(node.id) || s.has(node.parentId)
        ? recur([...r, ...more], s.add(node.id), [])
        : recur(more, s, [...r, node])
    );

  const handleDeleteElement = () => {
    const newRecords = [...records];
    const elements = removeFamily(node.id, newRecords);
    setRecords(elements);
  };

  const ArrowIcon = (
    <ButtonIcon
      onClick={() => {
        setChildVisiblity((value) => !value);
        setShowMultiSelect(false);
      }}
    >
      {childVisible ? <KeyboardArrowDownIcon /> : <KeyboardArrowRightIcon />}
    </ButtonIcon>
  );

  return (
    <React.Fragment>
      {node.parentId !== null && (
        <div className={classes.relative}>
          <div className={classes.hierarchyIcon} />
          <div className={classes.innerMostSiblingConnector} />
        </div>
      )}
      <RowInputContainer>
        <InputFieldWrapper>
          {node.type === 'record' ? (
            ArrowIcon
          ) : (
            <HiddenBtn>
              <KeyboardArrowRightIcon />
            </HiddenBtn>
          )}
          <input
            type="text"
            onChange={(e) => nameChangeHandler(e)}
            className={classes.input}
            value={node.name}
            placeholder="Field Name"
          />
        </InputFieldWrapper>
        <span>{node.type}</span>
        <RowButtonsWraper>
          <ButtonIcon>
            <HierarchyPopoverButton
              setShowMultiSelect={() => {
                setChildVisiblity(true);
                setShowMultiSelect(true);
              }}
              addNewRecordToParent={() => handleAddNewRecordToParent()}
            />
          </ButtonIcon>
          <ButtonIcon onClick={() => handleDeleteElement()}>
            <DeleteIcon />
          </ButtonIcon>
        </RowButtonsWraper>
      </RowInputContainer>
      {childVisible && (
        <div style={{ marginLeft: `${mrgL}px` }}>
          <HierarchyTree
            records={records}
            data={node.children}
            setRecords={setRecords}
            widgetProps={widgetProps}
            extraConfig={extraConfig}
          />
        </div>
      )}
      {showMultiSelect && (
        <div style={{ marginLeft: `${mrgL === 0 ? 6 : mrgL}px` }}>
          <div className={classes.relative}>
            <div className={classes.hierarchyIcon} />
            <div className={classes.innerMostSiblingConnector} />
          </div>
          <RowInputContainer>
            <MultiSelectWrapper>
              <Select
                id="demo-mutiple-checkbox"
                multiple
                disableUnderline
                value={multiSelectOptions}
                onChange={fillMultiSelectOptions}
                onClose={() => handleMultiSelectClose()}
                renderValue={(selected) => selected[0]}
              >
                {fieldValues.map((item) => {
                  return (
                    <MenuItem key={item.name} value={item.name}>
                      <Checkbox checked={multiSelectOptions.indexOf(item.name) > -1} />
                      <ListItemText primary={item.name} />
                      <span>{item.type}</span>
                    </MenuItem>
                  );
                })}
              </Select>
            </MultiSelectWrapper>
          </RowInputContainer>
        </div>
      )}
    </React.Fragment>
  );
};

export default HierarchyTreeNode;
