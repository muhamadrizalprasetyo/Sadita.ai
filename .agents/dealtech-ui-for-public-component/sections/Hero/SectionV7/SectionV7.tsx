import { useEffect, useRef } from 'react';
import { AlertCircle } from 'lucide-react';

import SearchV1 from '../../../elements/Search/SearchV1/SearchV1';
import './section-v7.css';

const metrics = [
    { value: '10K+', label: 'Developer Aktif' },
    { value: '350+', label: 'Komponen Publik' },
    { value: '99.9%', label: 'Tampilan Responsif' },
];

const dashboardImage = new URL('./assets/demo-dashboard.svg', import.meta.url).href;

export default function SectionV7() {
    const sectionRef = useRef<HTMLElement>(null);

    useEffect(() => {
        const section = sectionRef.current;
        if (!section) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('hero-v7__visible');
                        entry.target.classList.remove('hero-v7__hidden');
                        observer.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.12, rootMargin: '0px 0px -40px 0px' },
        );

        section.querySelectorAll('.hero-v7__reveal').forEach((element) => observer.observe(element));
        return () => observer.disconnect();
    }, []);

    return (
        <section ref={sectionRef} id="home" className="hero-v7">
            <div className="hero-v7__surface">
                <div className="hero-v7__shell">
                    <div className="hero-v7__content">
                        <a href="https://github.com/Deal-Tech/dealtech-ui-for-public-component/tree/main/sections/Hero/SectionV7" target="_blank" rel="noreferrer" className="hero-v7__eyebrow hero-v7__reveal hero-v7__hidden">
                            <AlertCircle size={16} strokeWidth={2.5} aria-hidden="true" /> Hero/SectionV7
                        </a>

                        <h1 className="hero-v7__title hero-v7__reveal hero-v7__hidden">
                            <span>Sederhanakan Design UI, Pakai</span>{' '}
                            <span className="hero-v7__title-accent">Dealtech UI</span>{' '}
                            <span>For Public Components</span>
                        </h1>

                        <p className="hero-v7__description hero-v7__reveal hero-v7__hidden">
                            Rancang halaman lebih cepat dengan komponen UI siap pakai yang responsif, konsisten, dan
                            mudah disesuaikan untuk berbagai kebutuhan proyek.
                        </p>

                        <div className="hero-v7__search hero-v7__reveal hero-v7__hidden">
                            <SearchV1
                                placeholder="Cari komponen UI"
                                buttonLabel="Cari Sekarang"
                                name="component"
                                onSubmit={(event) => event.preventDefault()}
                            />
                        </div>

                        <div className="hero-v7__metrics hero-v7__reveal hero-v7__hidden">
                            {metrics.map((metric) => (
                                <div className="hero-v7__metric" key={metric.label}>
                                    <strong>{metric.value}</strong>
                                    <span>{metric.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="hero-v7__visual hero-v7__reveal hero-v7__hidden">
                        <img
                            src={dashboardImage}
                            alt="Preview komponen dashboard Dealtech UI."
                            width={1460}
                            height={1078}
                            decoding="async"
                        />
                    </div>
                </div>
            </div>
        </section>
    );
}
