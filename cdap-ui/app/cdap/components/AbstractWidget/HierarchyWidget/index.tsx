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
import { withStyles } from '@material-ui/core/styles';
import AddIcon from '@material-ui/icons/Add';
import HierarchyTree from './HierarchyTree';
import uuidV4 from 'uuid/v4';

export const IconWrapper = withStyles(() => {
  return {
    root: {
      borderRadius: 10,
      padding: '5px',
      marginTop: '5px',
      '&:focus': {
        outline: 'none',
      },
    },
  };
})(IconButton);

const HierarchyWidget = ({ widgetProps, extraConfig }) => {
  const [records, setRecords] = React.useState([]);
  const [schema, setSchema] = React.useState([]);

  React.useEffect(() => {
    arrayToTree(records);
  }, [records]);

  const arrayToTree = (items) => {
    /**
     * @type {*[]}
     */
    const rootItems = [];
    const lookup = {};

    for (const item of items) {
      const itemId = item.id;
      const parentId = item.parentId;

      if (!lookup[itemId]) {
        lookup[itemId] = { ['children']: [] };
      }
      lookup[itemId] = { ...item, ['children']: lookup[itemId].children };

      const TreeItem = lookup[itemId];

      if (parentId === null || parentId === undefined || parentId === '') {
        rootItems.push(TreeItem);
      } else {
        if (!lookup[parentId]) {
          lookup[parentId] = { ['children']: [] };
        }

        lookup[parentId].children.push(TreeItem);
      }
    }
    setSchema(rootItems);
  };

  return (
    <div>
      <h6>Organize field under new or existing records</h6>
      <h6>{records.length} records</h6>
      <HierarchyTree
        records={records}
        data={schema}
        setRecords={setRecords}
        widgetProps={widgetProps}
        extraConfig={extraConfig}
      />
      <IconWrapper
        onClick={() =>
          setRecords((prevState) =>
            prevState.concat({
              id: uuidV4(),
              parentId: null,
              type: 'record',
              children: [],
              name: '',
            })
          )
        }
      >
        <AddIcon />
        <h6>ADD RECORD</h6>
      </IconWrapper>
    </div>
  );
};

export default HierarchyWidget;
