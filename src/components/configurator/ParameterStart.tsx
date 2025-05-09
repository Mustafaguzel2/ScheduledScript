import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X } from "lucide-react";

interface ColumnDefinition {
  name: string;
}

interface NodeSelection {
  nodeKind: string;
  columns: ColumnDefinition[];
}

export default function ParameterStart() {
  const [selectedNodes, setSelectedNodes] = useState<NodeSelection[]>([]);
  const [newColumn, setNewColumn] = useState<string>('');
  const [activeNodeIndex, setActiveNodeIndex] = useState<number | null>(null);

  // Hardcoded node kinds
  const nodeKinds = [
    'Table',
    'View',
    'Function',
    'Procedure',
    'Index',
    'Trigger',
    'Sequence',
    'Constraint'
  ];

  const handleNodeSelection = (nodeKind: string) => {
    if (!selectedNodes.some(node => node.nodeKind === nodeKind)) {
      setSelectedNodes([...selectedNodes, { nodeKind, columns: [] }]);
      // Set this newly added node as active
      setActiveNodeIndex(selectedNodes.length);
    }
  };

  const handleRemoveNode = (index: number) => {
    const updatedNodes = [...selectedNodes];
    updatedNodes.splice(index, 1);
    setSelectedNodes(updatedNodes);
    
    // Reset active node if the active one was removed
    if (activeNodeIndex === index) {
      setActiveNodeIndex(null);
    } else if (activeNodeIndex !== null && activeNodeIndex > index) {
      // Adjust the index if a node before the active one was removed
      setActiveNodeIndex(activeNodeIndex - 1);
    }
  };

  const handleAddColumn = (nodeIndex: number) => {
    if (!newColumn.trim()) return;
    
    const updatedNodes = [...selectedNodes];
    updatedNodes[nodeIndex].columns.push({ name: newColumn.trim() });
    setSelectedNodes(updatedNodes);
    setNewColumn('');
  };

  const handleRemoveColumn = (nodeIndex: number, columnIndex: number) => {
    const updatedNodes = [...selectedNodes];
    updatedNodes[nodeIndex].columns.splice(columnIndex, 1);
    setSelectedNodes(updatedNodes);
  };

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Select Node Kinds</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {nodeKinds.map((kind) => (
              <Button
                key={kind}
                onClick={() => handleNodeSelection(kind)}
                variant={selectedNodes.some(node => node.nodeKind === kind) ? "default" : "outline"}
                disabled={selectedNodes.some(node => node.nodeKind === kind)}
                className="shadow-sm"
              >
                {kind}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {selectedNodes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Selected Node Kinds</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-2 mb-4">
              {selectedNodes.map((node, index) => (
                <Button
                  key={node.nodeKind}
                  onClick={() => setActiveNodeIndex(index)}
                  variant={activeNodeIndex === index ? "default" : "secondary"}
                >
                  {node.nodeKind}
                  <X 
                    className="ml-2 h-4 w-4 hover:text-destructive" 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveNode(index);
                    }}
                  />
                </Button>
              ))}
            </div>

            {activeNodeIndex !== null && (
              <Card className="border-2">
                <CardHeader className="bg-muted/30 border-b-2">
                  <CardTitle className="text-lg text-foreground">
                    Columns for {selectedNodes[activeNodeIndex].nodeKind}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="flex items-end gap-2 mb-6">
                    <div className="flex-1 space-y-2">
                      <Label htmlFor="columnName">
                        Column Name
                      </Label>
                      <Input
                        id="columnName"
                        value={newColumn}
                        onChange={(e) => setNewColumn(e.target.value)}
                        placeholder="Enter column name"
                        className="border-2"
                      />
                    </div>
                    <Button
                      onClick={() => handleAddColumn(activeNodeIndex)}
                      disabled={!newColumn.trim()}
                    >
                      Add
                    </Button>
                  </div>

                  {selectedNodes[activeNodeIndex].columns.length > 0 ? (
                    <div className="mt-2">
                      <h4 className="text-sm font-medium mb-2 text-muted-foreground">Defined Columns:</h4>
                      <ul className="space-y-2">
                        {selectedNodes[activeNodeIndex].columns.map((column, columnIndex) => (
                          <li key={columnIndex} className="flex justify-between items-center bg-muted/30 px-4 py-2 rounded-md border">
                            {column.name}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveColumn(activeNodeIndex, columnIndex)}
                              className="text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm">No columns defined yet</p>
                  )}
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
