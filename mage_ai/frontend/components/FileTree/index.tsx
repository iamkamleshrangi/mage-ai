import React, { useContext } from 'react';

import FlexContainer from '@oracle/components/FlexContainer';
import Link from '@oracle/elements/Link';
import Spacing from '@oracle/elements/Spacing';
import Text from '@oracle/elements/Text';
import dark from '@oracle/styles/themes/dark';
import styled, { ThemeContext } from 'styled-components';
import { ArrowDown, ArrowRight, FileFill, Folder } from '@oracle/icons';
import { FileNodeType, getFileNodeColor, ReservedFolderEnum } from './constants';
import { UNIT } from '@oracle/styles/units/spacing';
import { useState } from 'react';
import { equals } from '@utils/array';

export type FileTreeProps = {
  tree: FileNodeType[];
};

type FileNodeStyleProps = {
  highlighted?: boolean;
};

const FileNodeStyle = styled.div<FileNodeStyleProps>`
  align-items: center;
  display: flex;

  ${props => props.highlighted && `
    background-color: ${(props.theme.interactive || dark.interactive).hoverBackground};
  `}

  ${props => `
    &:hover {
      background-color: ${(props.theme.interactive || dark.interactive).hoverBackground};
    }
  `}
`;

function FileTree({
  tree: initialTree,
}: FileTreeProps) {
  const themeContext = useContext(ThemeContext);

  enum TreeOperationEnum {
    CUSTOM_VAL,
    FALSE,
    TRUE,
    TOGGLE,
  }

  type TreeOperationType = {
    key: string,
    type: TreeOperationEnum,
    value?: any;
  };

  const [tree, setTree] = useState(initialTree);
  const [selectedPath, setSelectedPath] = useState([]);

  const setTreeState = (path: string[], payload: TreeOperationType) => {
    const searchPath: string[] = [];
    const { key, type, value } = payload;
    
    const updateTree = (subtree: FileNodeType) => {
      if (equals(path, searchPath)) {
        const updateMap = {
          [TreeOperationEnum.TRUE]: true,
          [TreeOperationEnum.FALSE]: false,
          [TreeOperationEnum.TOGGLE]: !subtree[key],
          [TreeOperationEnum.CUSTOM_VAL]: value,
        };
        subtree[key] = updateMap[type];
        return;
      }

      subtree.children?.forEach(childTree => {
        searchPath.push(childTree.name);
        updateTree(childTree);
        searchPath.pop();
      });
    };

    // 'root' name here is arbitrary, needed to match type definition
    const treeCopy = { children: JSON.parse(JSON.stringify(tree)), name: 'root' };
    updateTree(treeCopy);
    setTree(treeCopy.children);
  };

  const toggleFolder = (path: string[]) => {
    setTreeState([...path], {
      key: 'collapsed',
      type: TreeOperationEnum.TOGGLE,
    });
    setSelectedPath([...path]);
  };
  
  const selectFile = (path: string[]) => setSelectedPath([...path]);

  const fileTreeHandler = (path, isFolder) => (e) => {
    e.preventDefault();
    return isFolder ? toggleFolder(path) : selectFile(path);
  };

  let depth = 0;
  const path: string[] = [];
  const buildTreeEl = (tree: FileNodeType[]) => {
    depth++;
    const el = tree.map(({ name, children, collapsed }: {
      name: ReservedFolderEnum,
      children: FileNodeType[],
      collapsed: boolean,
    }) => {
      path.push(name);
      const {
        iconColor = (themeContext.content || dark.content).active,
        iconType: FileTreeIcon = children ? Folder : FileFill,
        textColor,
      } = getFileNodeColor(path, themeContext) || {};

      const fileNodeEl = (
        <>
          <FileNodeStyle highlighted={equals(path, selectedPath)}>
            <Spacing mr={children ? `${depth * 2 * UNIT - 12}px` : `${depth * 2 * UNIT}px`} />
            <Link
              fullWidth
              noColor
              noHoverUnderline
              noOutline
              onClick={fileTreeHandler([...path], !!children)}
            >
              <Spacing py={`${0.75 * UNIT}px`}>
                <FlexContainer alignItems="center">
                  {children && (
                    collapsed ? <ArrowRight /> : <ArrowDown />
                  )}
                  &nbsp;
                  <FileTreeIcon fill={iconColor} />
                  &nbsp;
                  <Text
                    color={textColor}
                    monospace
                    muted={!equals(path, selectedPath)}
                  >
                    {name}
                  </Text>
                </FlexContainer>
              </Spacing>
            </Link>
          </FileNodeStyle>
          {children && !collapsed && buildTreeEl(children)}
        </>
      );

      path.pop();
      return fileNodeEl;
    });

    depth--;
    return el;
  };

  return (
    <FlexContainer flexDirection="column">
      {buildTreeEl(tree)}
    </FlexContainer>
  );
}

export default FileTree;