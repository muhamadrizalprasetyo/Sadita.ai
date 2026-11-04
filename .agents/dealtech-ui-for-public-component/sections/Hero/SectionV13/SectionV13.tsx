import { useEffect, useRef } from 'react';
import { AlertCircle } from 'lucide-react';

import './section-v13.css';

const stats = [
    { value: '92%', label: 'Kepuasan Developer', className: 'hero-v13__stat--retention' },
    { value: '350+', label: 'Komponen Aktif', className: 'hero-v13__stat--components' },
    { value: '18K+', label: 'Developer Aktif', className: 'hero-v13__stat--users' },
    { value: '99.9%', label: 'Tampilan Responsif', className: 'hero-v13__stat--uptime' },
];

const officeImage = new URL('./assets/office-laptop.png', import.meta.url).href;

export default function SectionV13() {
    const sectionRef = useRef<HTMLElement>(null);

    useEffect(() => {
        const section = sectionRef.current;
        if (!section) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('hero-v13__visible');
                        entry.target.classList.remove('hero-v13__hidden');
                        observer.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.12, rootMargin: '0px 0px -40px 0px' },
        );

        section.querySelectorAll('.hero-v13__reveal').forEach((element) => observer.observe(element));
        return () => observer.disconnect();
    }, []);

    return (
        <section ref={sectionRef} id="home" className="hero-v13">
            <div className="hero-v13__surface">
                <div
                    className="hero-v13__photo hero-v13__reveal hero-v13__hidden"
                    style={{ backgroundImage: `url(${officeImage})` }}
                >
                    <div className="hero-v13__stats">
                        {stats.map((stat) => (
                            <article className={`hero-v13__stat ${stat.className}`} key={stat.label}>
                                <strong>{stat.value}</strong>
                                <span>{stat.label}</span>
                            </article>
                        ))}
                    </div>
                </div>

                <div className="hero-v13__shell">
                    <div className="hero-v13__content">
                        <a href="https://github.com/Deal-Tech/dealtech-ui-for-public-component/tree/main/sections/Hero/SectionV13" target="_blank" rel="noreferrer" className="hero-v13__eyebrow hero-v13__reveal hero-v13__hidden">
                            <AlertCircle size={16} strokeWidth={2.5} aria-hidden="true" /> Hero/SectionV13
                        </a>

                        <h1 className="hero-v13__title hero-v13__reveal hero-v13__hidden">
                            <span>Sederhanakan Design UI, Pakai</span>{' '}
                            <span className="hero-v13__title-accent">Dealtech UI</span>{' '}
                            <span>For Public Components</span>
                        </h1>

                        <p className="hero-v13__description hero-v13__reveal hero-v13__hidden">
                            Rancang halaman lebih cepat dengan komponen UI siap pakai yang responsif, konsisten, dan
                            mudah disesuaikan untuk berbagai kebutuhan proyek.
                        </p>

                        <div className="hero-v13__actions hero-v13__reveal hero-v13__hidden">
                            <a className="hero-v13__button hero-v13__button--primary" href="#fitur">
                                Jelajahi Komponen
                            </a>
                            <a className="hero-v13__button hero-v13__button--secondary" href="#fitur">
                                Lihat Komponen
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
