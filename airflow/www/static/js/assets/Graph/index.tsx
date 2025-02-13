/*!
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import React, { useCallback, useEffect } from "react";
import ReactFlow, {
  ReactFlowProvider,
  Controls,
  Background,
  MiniMap,
  Node as ReactFlowNode,
  useReactFlow,
  ControlButton,
  Panel,
  useNodesInitialized,
} from "reactflow";
import { Box, Tooltip, useTheme } from "@chakra-ui/react";
import { RiFocus3Line } from "react-icons/ri";

import Edge from "src/components/Graph/Edge";
import { useContainerRef } from "src/context/containerRef";
import { useAssetGraphs } from "src/api/useAssetDependencies";

import Node, { CustomNodeProps } from "./Node";
import Legend from "./Legend";
import type { OnSelectProps } from "../types";

interface Props {
  selectedNodeId?: string;
  onSelect?: (props: OnSelectProps) => void;
}

const nodeTypes = { custom: Node };
const edgeTypes = { custom: Edge };

const Graph = ({ selectedNodeId, onSelect }: Props) => {
  const { colors } = useTheme();
  const { setCenter } = useReactFlow();
  const containerRef = useContainerRef();

  const { data: graph } = useAssetGraphs();

  const nodeColor = ({
    data: { isSelected },
  }: ReactFlowNode<CustomNodeProps>) =>
    isSelected ? colors.blue["300"] : colors.gray["300"];

  const edges =
    graph?.edges?.map((e) => ({
      id: e.id,
      source: e.sources[0],
      target: e.targets[0],
      type: "custom",
      data: {
        rest: {
          ...e,
          isSelected:
            selectedNodeId &&
            (e.id.includes(`asset:${selectedNodeId}`) ||
              e.id.includes(`dag:${selectedNodeId}`)),
        },
      },
    })) || [];

  const nodes: ReactFlowNode<CustomNodeProps>[] =
    graph?.children?.map((c) => ({
      id: c.id,
      data: {
        label: c.value.label,
        type: c.value.class,
        width: c.width,
        height: c.height,
        onSelect: () => {
          if (onSelect) {
            if (c.value.class === "asset") onSelect({ uri: c.value.label });
            else if (c.value.class === "dag")
              onSelect({ dagId: c.value.label });
          }
        },
        isSelected: selectedNodeId === c.value.label,
        isHighlighted: edges.some(
          (e) => e.data.rest.isSelected && e.id.includes(c.id)
        ),
      },
      type: "custom",
      position: {
        x: c.x || 0,
        y: c.y || 0,
      },
    })) || [];

  const node = nodes.find((n) => n.data.label === selectedNodeId);

  const focusNode = useCallback(() => {
    if (node && node.position) {
      const { x, y } = node.position;
      setCenter(
        x + (node.data.width || 0) / 2,
        y + (node.data.height || 0) / 2,
        {
          duration: 1000,
        }
      );
    }
  }, [setCenter, node]);

  const nodesInitialized = useNodesInitialized();

  useEffect(() => {
    if (nodesInitialized) focusNode();
  }, [selectedNodeId, nodesInitialized, focusNode]);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      nodesDraggable={false}
      minZoom={0.25}
      maxZoom={1}
      onlyRenderVisibleElements
      defaultEdgeOptions={{ zIndex: 1 }}
    >
      <Background />
      <Controls showInteractive={false}>
        <ControlButton onClick={focusNode} disabled={!selectedNodeId}>
          <Tooltip
            portalProps={{ containerRef }}
            label="Center selected asset"
            placement="right"
          >
            <Box>
              <RiFocus3Line
                size={16}
                style={{
                  // override react-flow css
                  maxWidth: "16px",
                  maxHeight: "16px",
                  color: colors.gray[800],
                }}
                aria-label="Center selected asset"
              />
            </Box>
          </Tooltip>
        </ControlButton>
      </Controls>
      <Panel position="top-right">
        <Legend />
      </Panel>
      <MiniMap nodeStrokeWidth={15} nodeColor={nodeColor} zoomable pannable />
    </ReactFlow>
  );
};

const GraphWrapper = (props: Props) => (
  <ReactFlowProvider>
    <Graph {...props} />
  </ReactFlowProvider>
);

export default GraphWrapper;
