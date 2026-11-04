import { useEffect, useRef } from 'react';
import { AlertCircle } from 'lucide-react';

import './section-v6.css';

const dashboardImage = new URL('./assets/demo-dashboard.svg', import.meta.url).href;

export default function SectionV6() {
    const sectionRef = useRef<HTMLElement>(null);

    useEffect(() => {
        const section = sectionRef.current;
        if (!section) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('hero-v6__visible');
                        entry.target.classList.remove('hero-v6__hidden');
                        observer.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.12, rootMargin: '0px 0px -40px 0px' },
        );

        section.querySelectorAll('.hero-v6__reveal').forEach((element) => observer.observe(element));
        return () => observer.disconnect();
    }, []);

    return (
        <section ref={sectionRef} id="home" className="hero-v6">
            <div className="hero-v6__surface">
                <div className="hero-v6__shell">
                    <div className="hero-v6__content">
                        <a href="https://github.com/Deal-Tech/dealtech-ui-for-public-component/tree/main/sections/Hero/SectionV6" target="_blank" rel="noreferrer" className="hero-v6__eyebrow hero-v6__reveal hero-v6__hidden">
                            <AlertCircle size={16} strokeWidth={2.5} aria-hidden="true" /> Hero/SectionV6
                        </a>

                        <h1 className="hero-v6__title hero-v6__reveal hero-v6__hidden">
                            <span>Sederhanakan Design UI, Pakai</span>{' '}
                            <span className="hero-v6__title-accent">Dealtech UI</span>{' '}
                            <span>For Public Components</span>
                        </h1>

                        <p className="hero-v6__description hero-v6__reveal hero-v6__hidden">
                            Rancang halaman lebih cepat dengan komponen UI siap pakai yang responsif, konsisten, dan
                            mudah disesuaikan untuk berbagai kebutuhan proyek.
                        </p>

                        <div className="hero-v6__actions hero-v6__reveal hero-v6__hidden">
                            <a className="hero-v6__button hero-v6__button--primary" href="#fitur">
                                Jelajahi Komponen
                            </a>
                            <a className="hero-v6__button hero-v6__button--secondary" href="#fitur">
                                Lihat Dokumentasi
                            </a>
                        </div>
                    </div>

                    <div className="hero-v6__visual hero-v6__reveal hero-v6__hidden">
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
