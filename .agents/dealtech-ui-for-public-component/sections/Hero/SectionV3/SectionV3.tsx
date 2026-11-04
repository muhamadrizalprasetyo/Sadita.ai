import { useEffect, useRef } from 'react';
import { AlertCircle } from 'lucide-react';

import './section-v3.css';

const eyebrow = 'Hero/SectionV3';
const title = 'Sederhanakan Design UI, Pakai';
const titleAccent = 'Dealtech UI';
const titleSuffix = 'For Public Components';
const description =
    'Rancang halaman lebih cepat dengan komponen UI siap pakai yang responsif, konsisten, dan mudah disesuaikan untuk berbagai kebutuhan proyek.';

const primaryCta = { label: 'Jelajahi Komponen', href: '#fitur' };
const secondaryCta = { label: 'Lihat Dokumentasi', href: '#tentang' };
const dashboardImage = new URL('./assets/demo-dashboard.svg', import.meta.url).href;
const portalImage = new URL('./assets/demo-portal.svg', import.meta.url).href;

export default function SectionV3() {
    const sectionRef = useRef<HTMLElement>(null);

    useEffect(() => {
        const section = sectionRef.current;
        if (!section) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('hero-v3__visible');
                        entry.target.classList.remove('hero-v3__hidden');
                        observer.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.12, rootMargin: '0px 0px -40px 0px' },
        );

        section.querySelectorAll('.hero-v3__reveal').forEach((element) => observer.observe(element));
        return () => observer.disconnect();
    }, []);

    return (
        <section ref={sectionRef} id="home" className="hero-v3">
            <div className="hero-v3__shell">
                <div className="hero-v3__content">
                    <a href="https://github.com/Deal-Tech/dealtech-ui-for-public-component/tree/main/sections/Hero/SectionV3" target="_blank" rel="noreferrer" className="hero-v3__eyebrow hero-v3__reveal hero-v3__hidden">
                        <AlertCircle size={16} strokeWidth={2.5} aria-hidden="true" /> {eyebrow}
                    </a>

                    <h1 className="hero-v3__title hero-v3__reveal hero-v3__hidden">
                        <span>{title}</span> <span className="hero-v3__title-accent">{titleAccent}</span>{' '}
                        <span>{titleSuffix}</span>
                    </h1>

                    <p className="hero-v3__description hero-v3__reveal hero-v3__hidden">{description}</p>

                    <div className="hero-v3__actions hero-v3__reveal hero-v3__hidden">
                        <a className="hero-v3__button hero-v3__button--primary" href={primaryCta.href}>
                            <span>{primaryCta.label}</span>
                        </a>
                        <a className="hero-v3__button hero-v3__button--secondary" href={secondaryCta.href}>
                            <span>{secondaryCta.label}</span>
                        </a>
                    </div>
                </div>

                <div className="hero-v3__visual hero-v3__reveal hero-v3__hidden">
                    <div className="hero-v3__media hero-v3__media--large">
                        <img src={dashboardImage} alt="Preview komponen dashboard Dealtech UI." />
                    </div>
                    <div className="hero-v3__media">
                        <img src={portalImage} alt="Preview komponen portal Dealtech UI." />
                    </div>
                    <div className="hero-v3__media">
                        <img src={dashboardImage} alt="Variasi preview komponen Dealtech UI." />
                    </div>
                </div>
            </div>
        </section>
    );
}
