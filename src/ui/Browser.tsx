import { Icon, Tree, TreeNodeInfo } from '@blueprintjs/core';
import {
  FunctionComponent,
  useCallback,
  useContext,
  useEffect,
  useReducer,
  useRef,
  useState,
} from 'react';
import { PUBLIC_URL } from '../core/Common';
import { LIBRARY_JSON, REGION_PLACEHOLDER_ID, REGION_SCROLL_VIEW_ID } from './Config';
import { clone, cloneDeep } from 'lodash';

import styles from './Browser.module.css';
import { DownloadControl, DownloadControlStatus } from './DownloadControl';
import { AudioFile } from '../core/AudioFile';
import { AudioContextContext } from './Context';

export type NodePath = number[];
export type CompactNodePath = Uint32Array;

// TODO: Can we simplify the status information to not include the heavy-weight AudioFile object?
// Instead, the audio file itself could be owner in the AudioFileManager, with only the URL (id) and
// download status information in the tree node.
type DownloadStatus = {
  downloadStatus: DownloadControlStatus;
  path: CompactNodePath;
  audioFile?: AudioFile;
};

type NodeData = DownloadStatus | null;

export const Browser: FunctionComponent = () => {
  const audioContext = useContext(AudioContextContext)!;

  const INITIAL_STATE: TreeNodeInfo<NodeData>[] = [];

  // A path to a node in the tree is an array of indices, one for each level of the tree.

  // A tree action is a message that can be sent to the tree reducer
  type TreeAction =
    | { type: 'SET_IS_EXPANDED'; payload: { path: NodePath; isExpanded: boolean } }
    | { type: 'DESELECT_ALL' }
    | { type: 'SET_IS_SELECTED'; payload: { path: NodePath; isSelected: boolean } }
    | { type: 'RELOAD_TREE_NODES'; payload: { nodes: TreeNodeInfo<NodeData>[] } }
    | { type: 'SET_DOWNLOAD_STATUS'; payload: { path: NodePath; status: DownloadControlStatus } };

  // Recursively call a callback function for each node in the tree
  function forEachNode(
    nodes: TreeNodeInfo<NodeData>[] | undefined,
    callback: (node: TreeNodeInfo<NodeData>) => void,
  ) {
    if (nodes === undefined) {
      return;
    }

    for (const node of nodes) {
      callback(node);
      forEachNode(node.childNodes, callback);
    }
  }

  // Return the node at the specified path
  function forNodeAtPath(
    nodes: TreeNodeInfo<NodeData>[],
    path: NodePath,
    callback: (node: TreeNodeInfo<NodeData>) => void,
  ) {
    callback(Tree.nodeFromPath(path, nodes));
  }

  function cloneAtPath(state: TreeNodeInfo<NodeData>[], path: NodePath): TreeNodeInfo<NodeData>[] {
    // We need to create a clone of each array in the path, and the node the we are walking down
    // along the path.
    const newState = clone(state);
    var nodeArray = newState;

    for (var index = 0; index < path.length; index++) {
      const clonedNode = clone(nodeArray[path[index]]);
      nodeArray[path[index]] = clonedNode;

      if (index === path.length - 1) {
        break;
      }

      if (clonedNode.childNodes === undefined) {
        // TODO: This should never happen
        break;
      }

      var clonedArray = clone(clonedNode.childNodes);
      clonedNode.childNodes = clonedArray;
      nodeArray = clonedArray;
    }

    return newState;
  }

  // The tree reducer handles all tree actions
  function treeReducer(state: TreeNodeInfo<NodeData>[], action: TreeAction) {
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

      case 'SET_DOWNLOAD_STATUS':
        // just enough state change to trigger a re-render
        const newState4 = clone(state);
        forNodeAtPath(newState4, action.payload.path, (node) => {
          const nodeData = node.nodeData as DownloadStatus;
          nodeData.downloadStatus = action.payload.status;

          if (action.payload.status === DownloadControlStatus.Downloading) {
            nodeData.audioFile = AudioFile.create(new URL(node.id as string));

            nodeData.audioFile.load(
              audioContext,
              (audioFile) => {
                downloadDispatch(action.payload.path, DownloadControlStatus.Local);
              },
              (audioFile, error) => {
                console.log(`Failed to load ${audioFile.url}: ${error}`);
                downloadDispatch(action.payload.path, DownloadControlStatus.Error);
              },
            );
          }

          node.className =
            action.payload.status === DownloadControlStatus.Local ? '' : styles.notDownloaded;
          node.secondaryLabel = createSecondaryLabel(node);

          if (action.payload.status === DownloadControlStatus.Local) {
            node.icon = 'music';
          }
        });
        return cloneAtPath(newState4, action.payload.path);

      default:
        return state;
    }
  }

  // The tree state is managed by a reducer
  const [nodes, dispatch] = useReducer(treeReducer, INITIAL_STATE);

  function downloadDispatch(path: NodePath, status: DownloadControlStatus) {
    // What is necessary to actually download the file?
    dispatch({
      type: 'SET_DOWNLOAD_STATUS',
      payload: { path, status },
    });
  }

  function createSecondaryLabel(nodeInfo: TreeNodeInfo<NodeData>) {
    return (
      <DownloadControl
        state={nodeInfo.nodeData!.downloadStatus}
        setState={(state) => {
          downloadDispatch(Array.from(nodeInfo.nodeData!.path), state);
        }}
      />
    );
  }

  // Convert a folder hierarchy in JSON format as generated by https://www.npmjs.com/package/directory-tree
  // to a tree of TreeNodeInfo objects
  function jsonToTreeNodes(json: any, nodePath: NodePath = [0]): TreeNodeInfo<NodeData> {
    if (json.children) {
      // create a folder node
      const node: TreeNodeInfo<NodeData> = {
        id: json.path,
        label: json.name,
        isExpanded: false,
        childNodes: json.children ? [] : undefined,
        icon: 'folder-close',
        nodeData: null,
      };

      const jsonChildren = json.children as any[];
      jsonChildren.forEach((child, index) => {
        node.childNodes?.push(jsonToTreeNodes(child, [...nodePath, index]));
      });

      return node;
    } else {
      // create an audio file node
      const nodeId = `${PUBLIC_URL.toString()}${json.path}`;
      const nodeData = {
        downloadStatus: DownloadControlStatus.RemoteOnly,
        path: Uint32Array.from(nodePath),
      };
      const nodeInfo: TreeNodeInfo<NodeData> = {
        id: nodeId,
        label: json.name,
        isExpanded: false,
        childNodes: undefined,
        icon: <Icon icon="music" className="bp5-icon-standard bp5-tree-node-icon" color="#ccc" />,
        className: styles.notDownloaded,
        nodeData,
      };

      nodeInfo.secondaryLabel = createSecondaryLabel(nodeInfo);
      return nodeInfo;
    }
  }

  // Load the tree nodes from the library inventory JSON file
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

  // Load the tree nodes when the component is first mounted
  useEffect(() => {
    loadTreeNodes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Callbacks for tree events
  const handleNodeClick = useCallback(
    (node: TreeNodeInfo<NodeData>, nodePath: NodePath, e: React.MouseEvent<HTMLElement>) => {
      const originallySelected = node.isSelected;
      if (!e.shiftKey) {
        dispatch({ type: 'DESELECT_ALL' });
      }
      dispatch({
        payload: {
          path: Array.from(nodePath),
          isSelected: originallySelected == null ? true : !originallySelected,
        },
        type: 'SET_IS_SELECTED',
      });
    },
    [],
  );

  const handleNodeCollapse = useCallback((_node: TreeNodeInfo<NodeData>, nodePath: NodePath) => {
    dispatch({
      payload: { path: nodePath, isExpanded: false },
      type: 'SET_IS_EXPANDED',
    });
  }, []);

  const handleNodeExpand = useCallback((_node: TreeNodeInfo<NodeData>, nodePath: NodePath) => {
    dispatch({
      payload: { path: nodePath, isExpanded: true },
      type: 'SET_IS_EXPANDED',
    });
  }, []);

  const BROWSER_DRAG_DIV_ID = 'browser-drag-div';
  const tree = useRef<Tree<NodeData>>(null);
  const dragLabel = useRef<HTMLDivElement>(null);
  const dragLabelText = useRef('');

  const currentTreeNode = useRef<TreeNodeInfo<NodeData> | null>(null);

  const [isDragging, setIsDragging] = useState(false);
  const dragStartX = useRef(0);
  const dragStartY = useRef(0);
  const dragTarget = useRef<Element | null>(null);
  const startDragTimeout = useRef<number | null>(null);

  // Instead of directly launching into drag mode, we wait a bit to see if the user
  // is just clicking on the node to select it.
  // We are using a timeout, which allows us to cancel the drag if the user
  // releases the pointer before the timeout expires.
  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (
      !isDragging &&
      dragTarget.current === null &&
      currentTreeNode.current !== null &&
      //currentTreeNode.current.icon === 'music'
      currentTreeNode.current.childNodes === undefined &&
      currentTreeNode.current.nodeData !== null &&
      currentTreeNode.current.nodeData!.downloadStatus === DownloadControlStatus.Local
    ) {
      startDragTimeout.current = window.setTimeout(() => {
        onStartDrag(e);
      }, 500);
    }
  }

  // This is called when the user has held the pointer down long enough to start a drag.
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

  // This is called when the user releases the pointer.
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

      // TODO: Add the region to the arrangement, if the last position was inside the scroll view
      // Distinguish between addition of the region to an existing track, and creation of a new track
    }
  }

  // This is called when the user moves the pointer.
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

  // This is called when the user moves the pointer over a node.
  //
  // We capture the node in a ref, so that we can use it later when the user starts dragging.
  const handleNodeMouseEnter = (node: TreeNodeInfo<NodeData>, _nodePath: NodePath) => {
    console.log(`Mouse entered ${node.id}`);
    currentTreeNode.current = node;
    dragLabelText.current = node.label as string;
  };

  // This is called when the user moves the pointer off a node.
  //
  // We clear the ref, so that we don't use the node when the user starts dragging.
  const handleNodeMouseLeave = (node: TreeNodeInfo<NodeData>, _nodePath: NodePath) => {
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
        onNodeClick={(n, p, e) => {
          e.preventDefault();
        }}
        onNodeCollapse={handleNodeCollapse}
        onNodeExpand={handleNodeExpand}
        onNodeMouseEnter={handleNodeMouseEnter}
        onNodeMouseLeave={handleNodeMouseLeave}
      />
      <div
        ref={dragLabel}
        className={`${styles.dragLabel} ${styles.noselect}`}
        style={{ top: 0, left: 0, display: 'none' }}
      >
        <Icon icon="music" /> {dragLabelText.current}
      </div>
    </div>
  );
};
