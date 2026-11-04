import { useEffect, useRef } from 'react';
import { Info } from 'lucide-react';

import './about-v2.css';

const metrics = [
    { value: '10K+', label: 'Developer Aktif' },
    { value: '350+', label: 'Komponen Publik' },
    { value: '99.9%', label: 'Tampilan Responsif' },
];

const dashboardImage = new URL('./assets/demo-dashboard.svg', import.meta.url).href;

export default function AboutV2() {
    const sectionRef = useRef<HTMLElement>(null);

    useEffect(() => {
        const section = sectionRef.current;
        if (!section) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('about-v2__visible');
                        entry.target.classList.remove('about-v2__hidden');
                        observer.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.12, rootMargin: '0px 0px -40px 0px' },
        );

        section.querySelectorAll('.about-v2__reveal').forEach((element) => observer.observe(element));
        return () => observer.disconnect();
    }, []);

    return (
        <section ref={sectionRef} className="about-v2">
            <div className="about-v2__shell">
                <div className="about-v2__content">
                    <a href="https://github.com/Deal-Tech/dealtech-ui-for-public-component/tree/main/sections/About/AboutV2" target="_blank" rel="noreferrer" className="about-v2__eyebrow about-v2__reveal about-v2__hidden">
                        <Info size={16} strokeWidth={2.5} aria-hidden="true" /> About/AboutV2
                    </a>

                    <h2 className="about-v2__title about-v2__reveal about-v2__hidden">
                        Komponen Publik untuk{' '}
                        <span className="about-v2__title-accent">Design Lebih Cepat</span>
                    </h2>

                    <p className="about-v2__description about-v2__reveal about-v2__hidden">
                        Dealtech UI menyediakan komponen React siap pakai yang responsif, konsisten, dan mudah
                        disesuaikan. Developer dapat membangun halaman berkualitas tanpa mengulang design dari awal.
                    </p>

                    <div className="about-v2__metrics about-v2__reveal about-v2__hidden">
                        {metrics.map((metric) => (
                            <div className="about-v2__metric" key={metric.label}>
                                <strong>{metric.value}</strong>
                                <span>{metric.label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="about-v2__visual about-v2__reveal about-v2__hidden">
                    <img
                        src={dashboardImage}
                        alt="Kumpulan komponen antarmuka Dealtech UI."
                        width={1460}
                        height={1078}
                        decoding="async"
                    />
                </div>
            </div>
        </section>
    );
}
