import { useEffect, useRef } from 'react';
import { ChevronRight, Component, Info, Layers3, LayoutTemplate } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import './about-v5.css';

const repositoryUrl = 'https://github.com/Deal-Tech/dealtech-ui-for-public-component';

interface FeatureItem {
    title: string;
    description: string;
    href: string;
    icon: LucideIcon;
}

const featureItems: FeatureItem[] = [
    {
        title: 'Elements',
        description: 'Elemen UI dasar yang siap disalin dan disesuaikan untuk kebutuhan proyek.',
        href: `${repositoryUrl}/tree/main/elements`,
        icon: Component,
    },
    {
        title: 'Sections',
        description: 'Blok halaman responsif yang mandiri, konsisten, dan mudah dirangkai.',
        href: `${repositoryUrl}/tree/main/sections`,
        icon: Layers3,
    },
    {
        title: 'Pages',
        description: 'Contoh halaman lengkap sebagai titik awal untuk membangun lebih cepat.',
        href: `${repositoryUrl}/tree/main/pages`,
        icon: LayoutTemplate,
    },
];

export default function AboutV5() {
    const sectionRef = useRef<HTMLElement>(null);

    useEffect(() => {
        const section = sectionRef.current;
        if (!section) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('about-v5__visible');
                        entry.target.classList.remove('about-v5__hidden');
                        observer.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.12, rootMargin: '0px 0px -40px 0px' },
        );

        section.querySelectorAll('.about-v5__reveal').forEach((element) => observer.observe(element));
        return () => observer.disconnect();
    }, []);

    return (
        <section ref={sectionRef} className="about-v5">
            <div className="about-v5__shell">
                <div className="about-v5__content">
                    <a href="https://github.com/Deal-Tech/dealtech-ui-for-public-component/tree/main/sections/About/AboutV5" target="_blank" rel="noreferrer" className="about-v5__eyebrow about-v5__reveal about-v5__hidden">
                        <Info size={16} strokeWidth={2.5} aria-hidden="true" /> About/AboutV5
                    </a>

                    <h2 className="about-v5__title about-v5__reveal about-v5__hidden">
                        Komponen Publik untuk{' '}
                        <span className="about-v5__title-accent">Design Lebih Cepat</span>
                    </h2>

                    <p className="about-v5__description about-v5__reveal about-v5__hidden">
                        Dealtech UI menyediakan komponen React siap pakai yang responsif, konsisten, dan mudah
                        disesuaikan. Developer dapat membangun halaman berkualitas tanpa mengulang design dari awal.
                    </p>

                    <div className="about-v5__action about-v5__reveal about-v5__hidden">
                        <a className="about-v5__button" href="#tentang">
                            Lihat Tentang Kami
                        </a>
                    </div>
                </div>

                <div className="about-v5__features about-v5__reveal about-v5__hidden">
                    {featureItems.map(({ title, description, href, icon: Icon }, index) => (
                        <a
                            className={`about-v5__feature${index === 0 ? ' about-v5__feature--highlighted' : ''}`}
                            href={href}
                            target="_blank"
                            rel="noreferrer"
                            key={title}
                        >
                            <span className="about-v5__feature-icon">
                                <Icon size={26} strokeWidth={1.9} aria-hidden="true" />
                            </span>
                            <span className="about-v5__feature-copy">
                                <strong>{title}</strong>
                                <small>{description}</small>
                            </span>
                            <ChevronRight className="about-v5__feature-arrow" size={22} strokeWidth={2.25} aria-hidden="true" />
                        </a>
                    ))}
                </div>
            </div>
        </section>
    );
}
