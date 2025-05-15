import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search } from "lucide-react";
// import { fetchDiscoveryNodeTypes } from "@/lib/nodeTypes"; // No longer needed in frontend
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";

// Optionally, you can add a token prop if needed

type NodeTypeSelectorProps = {
  onSelectNode: (nodeKind: string) => void;
  selectedNodes: { nodeKind: string }[];
};

export function NodeTypeSelector({ onSelectNode, selectedNodes }: NodeTypeSelectorProps) {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [nodeTypes, setNodeTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    fetch("/api/taxonomy/nodekinds")
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to fetch node types");
        const data = await res.json();
        if (isMounted) {
          setNodeTypes(Array.isArray(data.nodeKinds) ? data.nodeKinds : []);
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setError("Failed to load node types");
          setLoading(false);
        }
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const filteredNodeTypes = nodeTypes.filter((type) =>
    type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const availableNodeTypes = filteredNodeTypes.filter(
    (type) => !selectedNodes.some((node) => node.nodeKind === type)
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Select Node Types</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="text-muted-foreground">Loading node types...</div>
        ) : error ? (
          <div className="text-red-500">{error}</div>
        ) : (
          <>
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search node types..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select onValueChange={onSelectNode}>
                <SelectTrigger className="w-[220px]">
                  <SelectValue placeholder="Select node type" />
                </SelectTrigger>
                <SelectContent>
                  <ScrollArea className="h-[400px]">
                    {availableNodeTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </ScrollArea>
                </SelectContent>
              </Select>
            </div>

            <div className="bg-muted/30 rounded-md p-3">
              <h4 className="text-sm font-medium mb-2 text-muted-foreground">
                Recently selected:
              </h4>
              <div className="flex flex-wrap gap-2">
                {filteredNodeTypes
                  .slice(0, 10)
                  .filter((type) => !selectedNodes.some((node) => node.nodeKind === type))
                  .map((type) => (
                    <Button
                      key={type}
                      onClick={() => onSelectNode(type)}
                      variant="outline"
                      size="sm"
                      className="shadow-sm"
                    >
                      {type}
                    </Button>
                  ))}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
} 