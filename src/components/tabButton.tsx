import Tab from "@/types/tab";

export default function TabButton({
  value,
  activeTab,
  onClick,
  children,
}: Tab) {
  return (
    <button
      onClick={() => onClick(value)}
      className={`flex-1 justify-center rounded-sm px-3 py-1.5 text-sm font-medium ${
        activeTab === value
          ? "bg-background text-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}
