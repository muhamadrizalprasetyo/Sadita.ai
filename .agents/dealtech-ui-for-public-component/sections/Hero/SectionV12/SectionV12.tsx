import { useEffect, useRef } from 'react';
import { AlertCircle } from 'lucide-react';

import SearchV1 from '../../../elements/Search/SearchV1/SearchV1';
import './section-v12.css';

const metrics = [
    { value: '10K+', label: 'Developer Aktif' },
    { value: '350+', label: 'Komponen Publik' },
    { value: '99.9%', label: 'Tampilan Responsif' },
];

const officeImage = new URL('./assets/office-laptop.png', import.meta.url).href;

export default function SectionV12() {
    const sectionRef = useRef<HTMLElement>(null);

    useEffect(() => {
        const section = sectionRef.current;
        if (!section) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('hero-v12__visible');
                        entry.target.classList.remove('hero-v12__hidden');
                        observer.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.12, rootMargin: '0px 0px -40px 0px' },
        );

        section.querySelectorAll('.hero-v12__reveal').forEach((element) => observer.observe(element));
        return () => observer.disconnect();
    }, []);

    return (
        <section ref={sectionRef} id="home" className="hero-v12">
            <div className="hero-v12__surface">
                <div
                    className="hero-v12__photo hero-v12__reveal hero-v12__hidden"
                    style={{ backgroundImage: `url(${officeImage})` }}
                    role="img"
                    aria-label="Laptop di atas meja putih dalam ruang kantor modern."
                />

                <div className="hero-v12__shell">
                    <div className="hero-v12__content">
                        <a href="https://github.com/Deal-Tech/dealtech-ui-for-public-component/tree/main/sections/Hero/SectionV12" target="_blank" rel="noreferrer" className="hero-v12__eyebrow hero-v12__reveal hero-v12__hidden">
                            <AlertCircle size={16} strokeWidth={2.5} aria-hidden="true" /> Hero/SectionV12
                        </a>

                        <h1 className="hero-v12__title hero-v12__reveal hero-v12__hidden">
                            <span>Sederhanakan Design UI, Pakai</span>{' '}
                            <span className="hero-v12__title-accent">Dealtech UI</span>{' '}
                            <span>For Public Components</span>
                        </h1>

                        <p className="hero-v12__description hero-v12__reveal hero-v12__hidden">
                            Rancang halaman lebih cepat dengan komponen UI siap pakai yang responsif, konsisten, dan
                            mudah disesuaikan untuk berbagai kebutuhan proyek.
                        </p>

                        <div className="hero-v12__search hero-v12__reveal hero-v12__hidden">
                            <SearchV1
                                placeholder="Cari komponen UI"
                                buttonLabel="Cari Sekarang"
                                name="component"
                                onSubmit={(event) => event.preventDefault()}
                            />
                        </div>

                        <div className="hero-v12__metrics hero-v12__reveal hero-v12__hidden">
                            {metrics.map((metric) => (
                                <div className="hero-v12__metric" key={metric.label}>
                                    <strong>{metric.value}</strong>
                                    <span>{metric.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
