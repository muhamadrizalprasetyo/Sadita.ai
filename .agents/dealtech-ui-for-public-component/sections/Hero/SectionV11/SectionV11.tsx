import { useEffect, useRef } from 'react';
import { AlertCircle, ArrowRight, BarChart3, Database, Users, Workflow } from 'lucide-react';

import './section-v11.css';

const services = [
    { title: 'Komponen React', description: 'Elemen dan section siap pakai', Icon: Database },
    { title: 'Variasi Layout', description: 'Pilihan design untuk setiap halaman', Icon: Workflow },
    { title: 'Design Responsif', description: 'Rapi di desktop hingga mobile', Icon: BarChart3 },
    { title: 'Dokumentasi & Preview', description: 'Mudah dipelajari dan dicoba', Icon: Users },
];

export default function SectionV11() {
    const sectionRef = useRef<HTMLElement>(null);

    useEffect(() => {
        const section = sectionRef.current;
        if (!section) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('hero-v11__visible');
                        entry.target.classList.remove('hero-v11__hidden');
                        observer.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.12, rootMargin: '0px 0px -40px 0px' },
        );

        section.querySelectorAll('.hero-v11__reveal').forEach((element) => observer.observe(element));
        return () => observer.disconnect();
    }, []);

    return (
        <section ref={sectionRef} id="home" className="hero-v11">
            <div className="hero-v11__shell">
                <div className="hero-v11__content">
                    <a href="https://github.com/Deal-Tech/dealtech-ui-for-public-component/tree/main/sections/Hero/SectionV11" target="_blank" rel="noreferrer" className="hero-v11__eyebrow hero-v11__reveal hero-v11__hidden">
                        <AlertCircle size={16} strokeWidth={2.5} aria-hidden="true" /> Hero/SectionV11
                    </a>

                    <h1 className="hero-v11__title hero-v11__reveal hero-v11__hidden">
                        <span>Sederhanakan Design UI, Pakai</span>{' '}
                        <span className="hero-v11__title-accent">Dealtech UI</span>{' '}
                        <span>For Public Components</span>
                    </h1>

                    <p className="hero-v11__description hero-v11__reveal hero-v11__hidden">
                        Rancang halaman lebih cepat dengan komponen UI siap pakai yang responsif, konsisten, dan
                        mudah disesuaikan untuk berbagai kebutuhan proyek.
                    </p>

                    <div className="hero-v11__actions hero-v11__reveal hero-v11__hidden">
                        <a className="hero-v11__button hero-v11__button--primary" href="#fitur">
                            Jelajahi Komponen
                        </a>
                        <a className="hero-v11__button hero-v11__button--secondary" href="#fitur">
                            Lihat Dokumentasi
                        </a>
                    </div>
                </div>

                <div className="hero-v11__visual hero-v11__reveal hero-v11__hidden">
                    <div className="hero-v11__orb hero-v11__orb--large" />
                    <div className="hero-v11__orb hero-v11__orb--small" />

                    <div className="hero-v11__service-card">
                        <h2>Koleksi Kami</h2>
                        <div className="hero-v11__service-list">
                            {services.map(({ title, description, Icon }) => (
                                <a href="#fitur" className="hero-v11__service" key={title}>
                                    <span className="hero-v11__service-icon">
                                        <Icon size={19} strokeWidth={2} aria-hidden="true" />
                                    </span>
                                    <span className="hero-v11__service-copy">
                                        <strong>{title}</strong>
                                        <small>{description}</small>
                                    </span>
                                    <ArrowRight size={17} strokeWidth={2.2} aria-hidden="true" />
                                </a>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
            <svg
                className="hero-v11__shape"
                viewBox="0 0 1440 100"
                preserveAspectRatio="none"
                aria-hidden="true"
            >
                <path
                    className="hero-v11__shape-shadow"
                    d="M0 3H530C620 3 625 65 720 65C815 65 820 3 910 3H1440V100H0Z"
                />
                <path d="M0 12H530C620 12 625 74 720 74C815 74 820 12 910 12H1440V100H0Z" />
            </svg>
        </section>
    );
}
