import { useEffect, useRef } from 'react';
import { AlertCircle } from 'lucide-react';

import './section-v4.css';

const stats = [
    { value: '92%', label: 'Komponen Responsif', className: 'hero-v4__stat--retention' },
    { value: '350+', label: 'Komponen Publik', className: 'hero-v4__stat--teams' },
    { value: '18K+', label: 'Developer Aktif', className: 'hero-v4__stat--users' },
    { value: '99.9%', label: 'Konsistensi UI', className: 'hero-v4__stat--uptime' },
];

export default function SectionV4() {
    const sectionRef = useRef<HTMLElement>(null);

    useEffect(() => {
        const section = sectionRef.current;
        if (!section) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('hero-v4__visible');
                        entry.target.classList.remove('hero-v4__hidden');
                        observer.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.12, rootMargin: '0px 0px -40px 0px' },
        );

        section.querySelectorAll('.hero-v4__reveal').forEach((element) => observer.observe(element));
        return () => observer.disconnect();
    }, []);

    return (
        <section ref={sectionRef} id="home" className="hero-v4">
            <div className="hero-v4__shell">
                <div className="hero-v4__content">
                    <a href="https://github.com/Deal-Tech/dealtech-ui-for-public-component/tree/main/sections/Hero/SectionV4" target="_blank" rel="noreferrer" className="hero-v4__eyebrow hero-v4__reveal hero-v4__hidden">
                        <AlertCircle size={16} strokeWidth={2.5} aria-hidden="true" /> Hero/SectionV4
                    </a>

                    <h1 className="hero-v4__title hero-v4__reveal hero-v4__hidden">
                        <span>Sederhanakan Design UI, Pakai</span>{' '}
                        <span className="hero-v4__title-accent">Dealtech UI</span>{' '}
                        <span>For Public Components</span>
                    </h1>

                    <p className="hero-v4__description hero-v4__reveal hero-v4__hidden">
                        Rancang halaman lebih cepat dengan komponen UI siap pakai yang responsif, konsisten, dan
                        mudah disesuaikan untuk berbagai kebutuhan proyek.
                    </p>

                    <div className="hero-v4__actions hero-v4__reveal hero-v4__hidden">
                        <a className="hero-v4__button" href="#fitur">
                            Jelajahi Komponen
                        </a>
                    </div>
                </div>

                <div className="hero-v4__stats hero-v4__reveal hero-v4__hidden">
                    <div className="hero-v4__stats-copy">
                        <strong>10.000+ Developer</strong>
                        <span>Memakai Dealtech UI</span>
                        <p>Dari proyek pribadi hingga produk digital berskala besar.</p>
                    </div>

                    {stats.map((stat) => (
                        <article className={`hero-v4__stat ${stat.className}`} key={stat.label}>
                            <strong>{stat.value}</strong>
                            <span>{stat.label}</span>
                        </article>
                    ))}
                </div>
            </div>
        </section>
    );
}
