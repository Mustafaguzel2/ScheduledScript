import { useState } from "react";
import { Button } from "@/components/ui/button";
import { NodeTypeSelector } from "./NodeTypeSelector";
import { SelectedNodesList } from "./SelectedNodesList";
import { ColumnManager } from "./ColumnManager";
import { NodeSelection } from "@/types/parameter";

export default function ParameterStart() {
  const [selectedNodes, setSelectedNodes] = useState<NodeSelection[]>([]);
  const [activeNodeIndex, setActiveNodeIndex] = useState<number | null>(null);

  const handleNodeSelection = (nodeKind: string) => {
    if (!selectedNodes.some((node) => node.nodeKind === nodeKind)) {
      setSelectedNodes([...selectedNodes, { nodeKind, columns: [] }]);
      setActiveNodeIndex(selectedNodes.length);
    }
  };

  const handleRemoveNode = (index: number, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }

    const updatedNodes = [...selectedNodes];
    updatedNodes.splice(index, 1);
    setSelectedNodes(updatedNodes);

    if (activeNodeIndex === index) {
      setActiveNodeIndex(index - 1);
    } else if (activeNodeIndex !== null && activeNodeIndex > index) {
      setActiveNodeIndex(activeNodeIndex - 1);
    }
  };

  const handleAddColumn = (columnName: string) => {
    if (activeNodeIndex === null) return;
    
    const updatedNodes = [...selectedNodes];
    updatedNodes[activeNodeIndex].columns.push({ name: columnName });
    setSelectedNodes(updatedNodes);
  };

  const handleRemoveColumn = (columnIndex: number) => {
    if (activeNodeIndex === null) return;
    
    const updatedNodes = [...selectedNodes];
    updatedNodes[activeNodeIndex].columns.splice(columnIndex, 1);
    setSelectedNodes(updatedNodes);
  };

  const handleStartScript = () => {
    try {
      const script = selectedNodes.map((node) => {
        return {
          nodeKind: node.nodeKind,
          columns: node.columns,
        };
      });
      console.log(script);
    } catch (error) {
      console.error(error);
    } finally {
      setSelectedNodes([]);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      <NodeTypeSelector
        onSelectNode={handleNodeSelection}
        selectedNodes={selectedNodes}
      />
      
      {selectedNodes.length > 0 && (
        <>
          <SelectedNodesList
            selectedNodes={selectedNodes}
            activeNodeIndex={activeNodeIndex}
            onSelectNode={setActiveNodeIndex}
            onRemoveNode={handleRemoveNode}
          />
          
          {activeNodeIndex !== null && (
            <ColumnManager
              nodeKind={selectedNodes[activeNodeIndex].nodeKind}
              columns={selectedNodes[activeNodeIndex].columns}
              onAddColumn={handleAddColumn}
              onRemoveColumn={handleRemoveColumn}
            />
          )}
        </>
      )}
      
      <Button onClick={handleStartScript}>Start Script</Button>
    </div>
  );
}
