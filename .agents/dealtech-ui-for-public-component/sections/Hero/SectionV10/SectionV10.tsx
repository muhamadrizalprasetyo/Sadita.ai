import { useEffect, useRef } from 'react';
import { AlertCircle, Code2, LayoutGrid, Palette, Search } from 'lucide-react';

import './section-v10.css';

const metrics = [
    { value: '10K+', label: 'Developer Aktif' },
    { value: '350+', label: 'Komponen Publik' },
    { value: '99.9%', label: 'Tampilan Responsif' },
];

const searchFields = [
    { label: 'Kategori', placeholder: 'Pilih kategori', name: 'category', Icon: LayoutGrid },
    { label: 'Teknologi', placeholder: 'Pilih teknologi', name: 'technology', Icon: Code2 },
    { label: 'Style', placeholder: 'Pilih style', name: 'style', Icon: Palette },
];

export default function SectionV10() {
    const sectionRef = useRef<HTMLElement>(null);

    useEffect(() => {
        const section = sectionRef.current;
        if (!section) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('hero-v10__visible');
                        entry.target.classList.remove('hero-v10__hidden');
                        observer.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.12, rootMargin: '0px 0px -40px 0px' },
        );

        section.querySelectorAll('.hero-v10__reveal').forEach((element) => observer.observe(element));
        return () => observer.disconnect();
    }, []);

    return (
        <section ref={sectionRef} id="home" className="hero-v10">
            <div className="hero-v10__surface">
                <div className="hero-v10__shell">
                    <a href="https://github.com/Deal-Tech/dealtech-ui-for-public-component/tree/main/sections/Hero/SectionV10" target="_blank" rel="noreferrer" className="hero-v10__eyebrow hero-v10__reveal hero-v10__hidden">
                        <AlertCircle size={16} strokeWidth={2.5} aria-hidden="true" /> Hero/SectionV10
                    </a>

                    <h1 className="hero-v10__title hero-v10__reveal hero-v10__hidden">
                        <span>Sederhanakan Design UI, Pakai</span>{' '}
                        <span className="hero-v10__title-accent">Dealtech UI</span>{' '}
                        <span>For Public Components</span>
                    </h1>

                    <p className="hero-v10__description hero-v10__reveal hero-v10__hidden">
                        Rancang halaman lebih cepat dengan komponen UI siap pakai yang responsif, konsisten, dan
                        mudah disesuaikan untuk berbagai kebutuhan proyek.
                    </p>

                    <div className="hero-v10__search hero-v10__reveal hero-v10__hidden">
                        <form className="hero-v10__search-form" role="search" onSubmit={(event) => event.preventDefault()}>
                            <div className="hero-v10__search-fields">
                                {searchFields.map(({ label, placeholder, name, Icon }) => (
                                    <label className="hero-v10__search-field" key={name}>
                                        <Icon className="hero-v10__search-icon" size={20} strokeWidth={2.5} aria-hidden="true" />
                                        <span className="hero-v10__search-copy">
                                            <strong>{label}</strong>
                                            <input type="text" name={name} placeholder={placeholder} />
                                        </span>
                                    </label>
                                ))}
                            </div>
                            <button className="hero-v10__search-button" type="submit">
                                <Search size={16} strokeWidth={2.5} aria-hidden="true" />
                                <span>Cari Komponen</span>
                            </button>
                        </form>
                    </div>

                    <div className="hero-v10__metrics hero-v10__reveal hero-v10__hidden">
                        {metrics.map((metric) => (
                            <div className="hero-v10__metric" key={metric.label}>
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
