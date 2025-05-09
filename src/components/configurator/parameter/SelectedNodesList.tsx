import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

type ColumnDefinition = {
  name: string;
};

type NodeSelection = {
  nodeKind: string;
  columns: ColumnDefinition[];
};

type SelectedNodesListProps = {
  selectedNodes: NodeSelection[];
  activeNodeIndex: number | null;
  onSelectNode: (index: number) => void;
  onRemoveNode: (index: number, e?: React.MouseEvent) => void;
};

export function SelectedNodesList({
  selectedNodes,
  activeNodeIndex,
  onSelectNode,
  onRemoveNode,
}: SelectedNodesListProps) {
  if (selectedNodes.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Selected Node Types</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <ScrollArea className="w-full pr-4">
          <div className="flex flex-wrap gap-2 pb-2">
            {selectedNodes.map((node, index) => (
              <div key={node.nodeKind} className="flex items-center">
                <Button
                  onClick={() => onSelectNode(index)}
                  variant={activeNodeIndex === index ? "default" : "secondary"}
                  size="sm"
                  className="rounded-l-full px-4"
                >
                  {node.nodeKind}
                </Button>
                <Button
                  variant={activeNodeIndex === index ? "default" : "secondary"}
                  size="sm"
                  className="rounded-r-full ml-px p-0 w-8 h-8"
                  onClick={(e) => onRemoveNode(index, e)}
                  aria-label={`Remove ${node.nodeKind}`}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
} 