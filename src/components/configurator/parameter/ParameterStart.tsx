import { useState, useEffect } from "react";
import { Button } from "../../../components/ui/button";
import { NodeTypeSelector } from "./NodeTypeSelector";
import { SelectedNodesList } from "./SelectedNodesList";
import { ColumnManager } from "./ColumnManager";
import { NodeSelection } from "../../../types/parameter";

export default function ParameterStart() {
  const [selectedNodes, setSelectedNodes] = useState<NodeSelection[]>([]);
  const [activeNodeIndex, setActiveNodeIndex] = useState<number | null>(null);
  const [isWorking, setIsWorking] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [logs, setLogs] = useState<string>("");

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

  const pollJobStatus = async (jobId: string) => {
    let finished = false;
    while (!finished) {
      const res = await fetch(`/api/jobs/start-parametered-job?jobId=${jobId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.status === "finished" || data.status === "error") {
          finished = true;
          setIsWorking(false);
          setJobId(null);
        } else {
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }
      } else {
        setIsWorking(false);
        setJobId(null);
        finished = true;
      }
    }
  };

  const handleStartScript = async () => {
    try {
      if (selectedNodes.length === 0) {
        alert("Please select at least one node");
        return;
      }
      if (selectedNodes.some(node => node.columns.length === 0)) {
        alert("Please select at least one column for every selected node");
        return;
      }
      setIsWorking(true);
      const response = await fetch("/api/jobs/start-parametered-job", {
        method: "POST",
        body: JSON.stringify({ selectedNodes }),
      });
      const data = await response.json();
      if (data.jobId) {
        setJobId(data.jobId);
        pollJobStatus(data.jobId);
      } else {
        setIsWorking(false);
      }
    } catch {
      setIsWorking(false);
    } finally {
      setSelectedNodes([]);
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    let stopped = false;
    const checkJob = async () => {
      const res = await fetch("/api/jobs/start-parametered-job");
      if (res.ok) {
        const data = await res.json();
        if (data.status === "working") {
          setIsWorking(true);
        } else {
          setIsWorking(false);
          if (!stopped && interval) {
            clearInterval(interval);
            stopped = true;
          }
        }
      } else {
        setIsWorking(false);
        if (!stopped && interval) {
          clearInterval(interval);
          stopped = true;
        }
      }
    };
    checkJob();
    interval = setInterval(checkJob, 10000); // 10 seconds
    return () => {
      if (interval) clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    let logInterval: NodeJS.Timeout | null = null;
    if (isWorking) {
      const fetchLogs = async () => {
        const res = await fetch("/api/jobs/start-parametered-job/logs");
        if (res.ok) {
          const data = await res.json();
          setLogs(data.logs);
        }
      };
      fetchLogs();
      logInterval = setInterval(fetchLogs, 10000);
    } else {
      setLogs("");
    }
    return () => {
      if (logInterval) clearInterval(logInterval);
    };
  }, [isWorking]);

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
      
      <Button onClick={handleStartScript} disabled={isWorking || jobId !== null}>
        {isWorking || jobId !== null ? "Script working..." : "Start Script"}
      </Button>
      {isWorking && (
        <div className="mt-4 p-2 bg-black text-green-300 rounded font-mono text-xs max-h-64 overflow-y-auto whitespace-pre-wrap">
          {logs
            ? logs.split('\n').reverse().join('\n')
            : "Loglar yükleniyor..."}
        </div>
      )}
    </div>
  );
}
