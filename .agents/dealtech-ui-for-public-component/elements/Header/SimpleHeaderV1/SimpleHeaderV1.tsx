import { Github } from 'lucide-react';

import './simple-header-v1.css';

export interface SimpleHeaderV1Props {
    highlight?: string;
    description?: string;
    ctaLabel?: string;
    ctaHref?: string;
}

export default function SimpleHeaderV1({
    highlight = 'Ini adalah Playground',
    description = 'dari Dealtech UI For Public Components.',
    ctaLabel = 'Coba Gratis',
    ctaHref = 'https://github.com/Deal-Tech/dealtech-ui-for-public-component',
}: SimpleHeaderV1Props) {
    return (
        <header className="simple-header-v1">
            <div className="simple-header-v1__content">
                <div className="simple-header-v1__text">
                    <strong className="simple-header-v1__highlight">{highlight}</strong> {description}
                    <a className="simple-header-v1__cta" href={ctaHref}>
                        <Github size={15} strokeWidth={2.2} aria-hidden="true" />
                        {ctaLabel}
                    </a>
                </div>
            </div>
        </header>
    );
}
