import { useState } from 'react';

import './tab-buttons-v1.css';

export interface TabButtonItem {
    id: string;
    label: string;
    badge?: string;
}

export interface TabButtonsV1Props {
    tabs?: TabButtonItem[];
    activeId?: string;
    defaultActiveId?: string;
    ariaLabel?: string;
    onChange?: (id: string) => void;
}

const defaultTabs: TabButtonItem[] = [
    { id: 'overview', label: 'Ringkasan' },
    { id: 'details', label: 'Detail', badge: 'Baru' },
];

export default function TabButtonsV1({
    tabs = defaultTabs,
    activeId,
    defaultActiveId,
    ariaLabel = 'Pilihan tab',
    onChange,
}: TabButtonsV1Props) {
    const [internalId, setInternalId] = useState(defaultActiveId ?? tabs[0]?.id ?? '');
    const selectedId = activeId ?? internalId;

    const selectTab = (id: string) => {
        if (activeId === undefined) {
            setInternalId(id);
        }

        onChange?.(id);
    };

    return (
        <div className="tab-buttons-v1" role="tablist" aria-label={ariaLabel}>
            {tabs.map((tab) => {
                const isActive = tab.id === selectedId;

                return (
                    <button
                        key={tab.id}
                        type="button"
                        role="tab"
                        aria-selected={isActive}
                        className={isActive ? 'tab-buttons-v1__button tab-buttons-v1__button--active' : 'tab-buttons-v1__button'}
                        onClick={() => selectTab(tab.id)}
                    >
                        {tab.label}
                        {tab.badge && <span>{tab.badge}</span>}
                    </button>
                );
            })}
        </div>
    );
}
