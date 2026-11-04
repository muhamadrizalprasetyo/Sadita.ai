import { useEffect, useRef } from 'react';
import { AlertCircle, Search } from 'lucide-react';

import './section-v9.css';

const filters = [
    { label: 'Kategori', options: ['Semua', 'Hero', 'Features', 'About', 'Review'] },
    { label: 'Teknologi', options: ['Semua', 'React', 'TypeScript', 'CSS'] },
    { label: 'Tampilan', options: ['Semua', 'Light', 'Dark', 'Responsif'] },
];

export default function SectionV9() {
    const sectionRef = useRef<HTMLElement>(null);

    useEffect(() => {
        const section = sectionRef.current;
        if (!section) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('hero-v9__visible');
                        entry.target.classList.remove('hero-v9__hidden');
                        observer.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.12, rootMargin: '0px 0px -40px 0px' },
        );

        section.querySelectorAll('.hero-v9__reveal').forEach((element) => observer.observe(element));
        return () => observer.disconnect();
    }, []);

    return (
        <section ref={sectionRef} id="home" className="hero-v9">
            <div className="hero-v9__shell">
                <div className="hero-v9__content">
                    <a href="https://github.com/Deal-Tech/dealtech-ui-for-public-component/tree/main/sections/Hero/SectionV9" target="_blank" rel="noreferrer" className="hero-v9__eyebrow hero-v9__reveal hero-v9__hidden">
                        <AlertCircle size={16} strokeWidth={2.5} aria-hidden="true" /> Hero/SectionV9
                    </a>

                    <h1 className="hero-v9__title hero-v9__reveal hero-v9__hidden">
                        <span>Sederhanakan Design UI, Pakai</span>{' '}
                        <span className="hero-v9__title-accent">Dealtech UI</span>{' '}
                        <span>For Public Components</span>
                    </h1>

                    <p className="hero-v9__description hero-v9__reveal hero-v9__hidden">
                        Rancang halaman lebih cepat dengan komponen UI siap pakai yang responsif, konsisten, dan
                        mudah disesuaikan untuk berbagai kebutuhan proyek.
                    </p>
                </div>

                <div className="hero-v9__visual hero-v9__reveal hero-v9__hidden">
                    <form className="hero-v9__finder" onSubmit={(event) => event.preventDefault()}>
                        <h2>Cari Komponen</h2>

                        <label className="hero-v9__query">
                            <Search size={17} strokeWidth={2} aria-hidden="true" />
                            <input type="search" placeholder="Nama komponen, kategori, atau kata kunci..." />
                        </label>

                        <div className="hero-v9__filters">
                            {filters.map((filter) => (
                                <label className="hero-v9__filter" key={filter.label}>
                                    <span>{filter.label}</span>
                                    <select defaultValue="Semua">
                                        {filter.options.map((option) => (
                                            <option key={option}>{option}</option>
                                        ))}
                                    </select>
                                </label>
                            ))}
                        </div>

                        <button type="submit">
                            Cari Komponen <Search size={15} strokeWidth={2.5} aria-hidden="true" />
                        </button>
                    </form>
                </div>
            </div>
        </section>
    );
}
