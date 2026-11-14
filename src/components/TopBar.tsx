import React from 'react';

export type WorkspaceView = 'wave-lab' | 'measure' | 'bayesian' | 'cases' | 'investigator';

interface TopBarProps {
  activeView: WorkspaceView;
  onSelectView: (view: WorkspaceView) => void;
  onOpenInvestigator: () => void;
}

const NAV_ITEMS: Array<{ id: WorkspaceView; label: string; mobileLabel: string }> = [
  { id: 'wave-lab', label: 'Wave Lab', mobileLabel: 'Wave Lab' },
  { id: 'measure', label: 'How to Measure', mobileLabel: 'Measure' },
  { id: 'bayesian', label: 'Bayesian Math', mobileLabel: 'Math' },
  { id: 'cases', label: 'Global Cases', mobileLabel: 'Cases' },
  { id: 'investigator', label: 'AGI Investigator', mobileLabel: 'Ask AI' },
];

export const TopBar: React.FC<TopBarProps> = ({
  activeView,
  onSelectView,
  onOpenInvestigator,
}) => {
  return (
    <header className="border-b border-slate-800 bg-[#07090E] px-4 sm:px-6 lg:px-8">
      <div className="mx-auto flex h-14 max-w-[1600px] items-center justify-between gap-4 sm:gap-8">
        <a
          href="#wave-lab"
          onClick={(e) => {
            e.preventDefault();
            onSelectView('wave-lab');
          }}
          className="whitespace-nowrap shrink-0 text-base sm:text-lg font-semibold tracking-tight text-slate-100 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-400"
        >
          NullHypothesis Lab
        </a>

        <nav aria-label="Primary sections" className="hidden md:flex items-center gap-6">
          {NAV_ITEMS.map((item) => {
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectView(item.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`whitespace-nowrap shrink-0 py-1 text-sm font-medium border-b-2 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-400 ${
                  isActive
                    ? 'border-cyan-400 text-slate-100'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="shrink-0">
          <button
            type="button"
            onClick={onOpenInvestigator}
            className="whitespace-nowrap shrink-0 rounded bg-cyan-500 px-3.5 py-1.5 text-xs sm:text-sm font-semibold text-slate-950 transition-colors hover:bg-cyan-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300"
          >
            Ask Gemini 4
          </button>
        </div>
      </div>

      <nav
        aria-label="Mobile sections"
        className="flex md:hidden items-center justify-between gap-2 border-t border-slate-800/80 py-2"
      >
        {NAV_ITEMS.map((item) => {
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectView(item.id)}
              aria-current={isActive ? 'page' : undefined}
              className={`whitespace-nowrap shrink-0 px-1 py-1 text-xs font-medium transition-colors border-b-2 ${
                isActive
                  ? 'border-cyan-400 text-slate-100'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              {item.mobileLabel}
            </button>
          );
        })}
      </nav>
    </header>
  );
};
