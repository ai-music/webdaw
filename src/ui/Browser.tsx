import { Icon, Tree, TreeNodeInfo } from '@blueprintjs/core';
import { FunctionComponent, useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { PUBLIC_URL } from '../core/Common';
import {
  LIBRARY_JSON,
  REGION_AREA_ID,
  REGION_PLACEHOLDER_ID,
  REGION_SCROLL_VIEW_ID,
} from './Config';
import { cloneDeep } from 'lodash';

import styles from './Browser.module.css';

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

  const BROWSER_DRAG_DIV_ID = 'browser-drag-div';
  const tree = useRef<Tree>(null);
  const dragLabel = useRef<HTMLDivElement>(null);
  const dragLabelText = useRef('');

  const currentTreeNode = useRef<TreeNodeInfo | null>(null);

  const [isDragging, setIsDragging] = useState(false);
  const dragStartX = useRef(0);
  const dragStartY = useRef(0);
  const dragTarget = useRef<Element | null>(null);
  const startDragTimeout = useRef<number | null>(null);

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (
      !isDragging &&
      dragTarget.current === null &&
      currentTreeNode.current !== null &&
      currentTreeNode.current.icon === 'music'
    ) {
      startDragTimeout.current = window.setTimeout(() => {
        onStartDrag(e);
      }, 500);
    }
  }

  function onStartDrag(e: React.PointerEvent<HTMLDivElement>) {
    startDragTimeout.current = null;

    setIsDragging(true);
    e.preventDefault();
    dragStartX.current = e.clientX;
    dragStartY.current = e.clientY;
    dragTarget.current = e.target as Element;

    dragTarget.current.setPointerCapture(e.pointerId);

    dragLabel.current!.style['display'] = 'block';
    dragLabel.current!.style['left'] = `${e.clientX}px`;
    dragLabel.current!.style['top'] = `${e.clientY}px`;
  }

  function onPointerUp(e: React.PointerEvent<HTMLDivElement>) {
    if (startDragTimeout.current !== null) {
      window.clearTimeout(startDragTimeout.current);
      startDragTimeout.current = null;
    }

    if (isDragging && dragTarget.current === e.target) {
      setIsDragging(false);
      dragTarget.current!.releasePointerCapture(e.pointerId);
      const regionPlaceholder = document.getElementById(REGION_PLACEHOLDER_ID);
      regionPlaceholder!.style['display'] = 'none';
      dragLabel.current!.style['display'] = 'none';

      dragTarget.current = null;
    }
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (isDragging && dragTarget.current === e.target) {
      // const deltaX = e.clientX - dragStartX.current;
      // const deltaY = e.clientY - dragStartY.current;

      dragLabel.current!.style['left'] = `${e.clientX}px`;
      dragLabel.current!.style['top'] = `${e.clientY}px`;

      const regionScrollView = document.getElementById(REGION_SCROLL_VIEW_ID);
      // const regionArea = document.getElementById(REGION_AREA_ID);
      const regionPlaceholder = document.getElementById(REGION_PLACEHOLDER_ID);
      const scrollViewRect = regionScrollView!.getBoundingClientRect();

      // test if the pointer is inside the scroll view
      if (
        e.clientX >= scrollViewRect.left &&
        e.clientX <= scrollViewRect.right &&
        e.clientY >= scrollViewRect.top &&
        e.clientY <= scrollViewRect.bottom
      ) {
        regionPlaceholder!.style['display'] = 'block';
        regionPlaceholder!.style['left'] = `${
          e.clientX - scrollViewRect.left + regionScrollView!.scrollLeft - 2
        }px`;
        regionPlaceholder!.style['top'] = `${
          e.clientY - scrollViewRect.top + regionScrollView!.scrollTop - 2
        }px`;
      } else {
        regionPlaceholder!.style['display'] = 'none';
      }
    }
  }

  const handleNodeMouseEnter = (node: TreeNodeInfo, _nodePath: NodePath) => {
    console.log(`Mouse entered ${node.id}`);
    currentTreeNode.current = node;
    dragLabelText.current = node.label as string;
  };

  const handleNodeMouseLeave = (node: TreeNodeInfo, _nodePath: NodePath) => {
    console.log(`Mouse left ${node.id}`);
    currentTreeNode.current = null;
  };

  // Ther browser also has a search box at the top
  return (
    <div
      id={BROWSER_DRAG_DIV_ID}
      className={styles.browser}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      <Tree
        ref={tree}
        contents={nodes}
        onNodeClick={handleNodeClick}
        onNodeCollapse={handleNodeCollapse}
        onNodeExpand={handleNodeExpand}
        onNodeMouseEnter={handleNodeMouseEnter}
        onNodeMouseLeave={handleNodeMouseLeave}
      />
      <div
        ref={dragLabel}
        className={styles.dragLabel}
        style={{ top: 0, left: 0, display: 'none' }}
      >
        <Icon icon="music" /> {dragLabelText.current}
      </div>
    </div>
  );
};
