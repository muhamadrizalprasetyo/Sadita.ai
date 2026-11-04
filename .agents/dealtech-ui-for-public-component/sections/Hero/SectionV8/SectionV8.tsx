import { useEffect, useRef } from 'react';
import { AlertCircle } from 'lucide-react';

import SearchV1 from '../../../elements/Search/SearchV1/SearchV1';
import './section-v8.css';

const metrics = [
    { value: '10K+', label: 'Developer Aktif' },
    { value: '350+', label: 'Komponen Publik' },
    { value: '99.9%', label: 'Tampilan Responsif' },
];

export default function SectionV8() {
    const sectionRef = useRef<HTMLElement>(null);

    useEffect(() => {
        const section = sectionRef.current;
        if (!section) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('hero-v8__visible');
                        entry.target.classList.remove('hero-v8__hidden');
                        observer.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.12, rootMargin: '0px 0px -40px 0px' },
        );

        section.querySelectorAll('.hero-v8__reveal').forEach((element) => observer.observe(element));
        return () => observer.disconnect();
    }, []);

    return (
        <section ref={sectionRef} id="home" className="hero-v8">
            <div className="hero-v8__surface">
                <div className="hero-v8__shell">
                    <a href="https://github.com/Deal-Tech/dealtech-ui-for-public-component/tree/main/sections/Hero/SectionV8" target="_blank" rel="noreferrer" className="hero-v8__eyebrow hero-v8__reveal hero-v8__hidden">
                        <AlertCircle size={16} strokeWidth={2.5} aria-hidden="true" /> Hero/SectionV8
                    </a>

                    <h1 className="hero-v8__title hero-v8__reveal hero-v8__hidden">
                        <span>Sederhanakan Design UI, Pakai</span>{' '}
                        <span className="hero-v8__title-accent">Dealtech UI</span>{' '}
                        <span>For Public Components</span>
                    </h1>

                    <p className="hero-v8__description hero-v8__reveal hero-v8__hidden">
                        Rancang halaman lebih cepat dengan komponen UI siap pakai yang responsif, konsisten, dan
                        mudah disesuaikan untuk berbagai kebutuhan proyek.
                    </p>

                    <div className="hero-v8__search hero-v8__reveal hero-v8__hidden">
                        <SearchV1
                            placeholder="Cari komponen UI"
                            buttonLabel="Cari Sekarang"
                            name="component"
                            onSubmit={(event) => event.preventDefault()}
                        />
                    </div>

                    <div className="hero-v8__metrics hero-v8__reveal hero-v8__hidden">
                        {metrics.map((metric) => (
                            <div className="hero-v8__metric" key={metric.label}>
                                <strong>{metric.value}</strong>
                                <span>{metric.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
