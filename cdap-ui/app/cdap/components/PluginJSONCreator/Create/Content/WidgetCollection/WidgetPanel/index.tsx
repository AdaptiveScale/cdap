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

import Button from '@material-ui/core/Button';
import withStyles, { StyleRules } from '@material-ui/core/styles/withStyles';
import WidgetActionButtons from 'components/PluginJSONCreator/Create/Content/WidgetCollection/WidgetActionButtons';
import WidgetAttributesCollection from 'components/PluginJSONCreator/Create/Content/WidgetCollection/WidgetAttributesCollection';
import WidgetInfoInput from 'components/PluginJSONCreator/Create/Content/WidgetCollection/WidgetInfoInput';
import * as React from 'react';

const styles = (): StyleRules => {
  return {
    eachWidget: {
      display: 'grid',
      gridTemplateColumns: '5fr 1fr',
      marginLeft: 'auto',
      marginRight: 'auto',
    },
  };
};

export const WidgetPanelView = ({
  classes,
  widgetID,
  widgetIndex,
  openWidgetIndex,
  setOpenWidgetIndex,
  addWidgetToGroup,
  deleteWidgetFromGroup,
}) => {
  function openWidgetAttributes(index: number) {
    return () => {
      setOpenWidgetIndex(index);
    };
  }

  function closeWidgetAttributes() {
    setOpenWidgetIndex(null);
  }

  return (
    <div className={classes.eachWidget}>
      <WidgetInfoInput widgetID={widgetID} />
      <WidgetActionButtons
        onAddWidgetToGroup={addWidgetToGroup}
        onDeleteWidgetFromGroup={deleteWidgetFromGroup}
      />
      <WidgetAttributesCollection
        widgetID={widgetID}
        widgetAttributesOpen={openWidgetIndex === widgetIndex}
        closeWidgetAttributes={closeWidgetAttributes}
      />
      <Button
        variant="contained"
        color="primary"
        component="span"
        onClick={openWidgetAttributes(widgetIndex)}
      >
        Attributes
      </Button>
    </div>
  );
};

const WidgetPanel = withStyles(styles)(WidgetPanelView);
export default WidgetPanel;