interface Tab<T extends string = string> {
  id: T;
  label: string;
  icon: string;
}

interface TabNavigationProps<T extends string = string> {
  tabs: Tab<T>[];
  activeTab: T;
  onTabChange: (tabId: T) => void;
}

export default function TabNavigation<T extends string>({
  tabs,
  activeTab,
  onTabChange,
}: TabNavigationProps<T>) {
  return (
    <nav className="bg-dark-200/50 border-b border-slate-700">
      <div className="flex">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`
              flex items-center gap-2 px-6 py-3 text-sm font-medium transition-all duration-200
              border-b-2 hover:bg-slate-800/50
              ${activeTab === tab.id 
                ? 'text-primary-400 border-primary-500 bg-slate-800/30' 
                : 'text-slate-400 border-transparent hover:text-white'
              }
            `}
          >
            <span>{tab.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
