type Tab = {
    value: string;
    activeTab: string;
    onClick: (tab: string) => void;
    children: React.ReactNode;
}

export default Tab;