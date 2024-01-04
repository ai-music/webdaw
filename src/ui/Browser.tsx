import { Tree, TreeNodeInfo } from '@blueprintjs/core';
import { FunctionComponent, useCallback, useEffect, useReducer, useState } from 'react';
import { PUBLIC_URL } from '../core/Common';
import { LIBRARY_JSON } from './Config';
import { cloneDeep } from 'lodash';

export const Browser: FunctionComponent = () => {
  const INITIAL_STATE: TreeNodeInfo[] = [
    // { id: 'instruments', label: 'Instruments', isExpanded: true, icon: 'folder-close' },
    // { id: 'effects', label: 'Effects', isExpanded: true, icon: 'folder-close' },
    // { id: 'samples', label: 'Samples', isExpanded: true, icon: 'folder-close' },
  ];

  function jsonToTreeNodes(json: any): TreeNodeInfo {
    const node: TreeNodeInfo = {
      id: json.path,
      label: json.name,
      isExpanded: false,
      childNodes: json.children ? [] : undefined,
      icon: json.children ? 'folder-close' : 'music',
    };
    if (json.children) {
      for (const child of json.children) {
        node.childNodes?.push(jsonToTreeNodes(child));
      }
    }
    return node;
  }

  type NodePath = number[];

  type TreeAction =
    | { type: 'SET_IS_EXPANDED'; payload: { path: NodePath; isExpanded: boolean } }
    | { type: 'DESELECT_ALL' }
    | { type: 'SET_IS_SELECTED'; payload: { path: NodePath; isSelected: boolean } }
    | { type: 'RELOAD_TREE_NODES'; payload: { nodes: TreeNodeInfo[] } };

  function forEachNode(nodes: TreeNodeInfo[] | undefined, callback: (node: TreeNodeInfo) => void) {
    if (nodes === undefined) {
      return;
    }

    for (const node of nodes) {
      callback(node);
      forEachNode(node.childNodes, callback);
    }
  }

  function forNodeAtPath(
    nodes: TreeNodeInfo[],
    path: NodePath,
    callback: (node: TreeNodeInfo) => void,
  ) {
    callback(Tree.nodeFromPath(path, nodes));
  }

  function treeExampleReducer(state: TreeNodeInfo[], action: TreeAction) {
    switch (action.type) {
      case 'DESELECT_ALL':
        const newState1 = cloneDeep(state);
        forEachNode(newState1, (node) => (node.isSelected = false));
        return newState1;
      case 'SET_IS_EXPANDED':
        const newState2 = cloneDeep(state);
        forNodeAtPath(
          newState2,
          action.payload.path,
          (node) => (node.isExpanded = action.payload.isExpanded),
        );
        return newState2;
      case 'SET_IS_SELECTED':
        const newState3 = cloneDeep(state);
        forNodeAtPath(
          newState3,
          action.payload.path,
          (node) => (node.isSelected = action.payload.isSelected),
        );
        return newState3;
      case 'RELOAD_TREE_NODES':
        return action.payload.nodes;
      default:
        return state;
    }
  }

  function loadTreeNodes() {
    const urlString = `${PUBLIC_URL.toString()}${LIBRARY_JSON}`;
    console.log(`Loading library inventory from ${urlString}`);
    const url = new URL(urlString);
    fetch(url.toString()).then((response) => {
      if (response.ok) {
        response.json().then((json) => {
          dispatch({ type: 'RELOAD_TREE_NODES', payload: { nodes: [jsonToTreeNodes(json)] } });
        });
      } else {
        console.log(`Failed to load library inventory from ${urlString}`);
      }
    });
  }

  useEffect(() => {
    loadTreeNodes();
  }, []);

  const [nodes, dispatch] = useReducer(treeExampleReducer, INITIAL_STATE);

  const handleNodeClick = useCallback(
    (node: TreeNodeInfo, nodePath: NodePath, e: React.MouseEvent<HTMLElement>) => {
      const originallySelected = node.isSelected;
      if (!e.shiftKey) {
        dispatch({ type: 'DESELECT_ALL' });
      }
      dispatch({
        payload: {
          path: nodePath,
          isSelected: originallySelected == null ? true : !originallySelected,
        },
        type: 'SET_IS_SELECTED',
      });
    },
    [],
  );

  const handleNodeCollapse = useCallback((_node: TreeNodeInfo, nodePath: NodePath) => {
    dispatch({
      payload: { path: nodePath, isExpanded: false },
      type: 'SET_IS_EXPANDED',
    });
  }, []);

  const handleNodeExpand = useCallback((_node: TreeNodeInfo, nodePath: NodePath) => {
    dispatch({
      payload: { path: nodePath, isExpanded: true },
      type: 'SET_IS_EXPANDED',
    });
  }, []);

  // Ther browser also has a search box at the top
  return (
    <Tree
      contents={nodes}
      onNodeClick={handleNodeClick}
      onNodeCollapse={handleNodeCollapse}
      onNodeExpand={handleNodeExpand}
    />
  );
};
