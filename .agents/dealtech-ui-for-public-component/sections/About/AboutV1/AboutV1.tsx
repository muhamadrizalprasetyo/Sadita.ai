import { useEffect, useRef } from 'react';
import { Info } from 'lucide-react';

import './about-v1.css';

const dashboardImage = new URL('./assets/demo-dashboard.svg', import.meta.url).href;

export default function AboutV1() {
    const sectionRef = useRef<HTMLElement>(null);

    useEffect(() => {
        const section = sectionRef.current;
        if (!section) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('about-v1__visible');
                        entry.target.classList.remove('about-v1__hidden');
                        observer.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.12, rootMargin: '0px 0px -40px 0px' },
        );

        section.querySelectorAll('.about-v1__reveal').forEach((element) => observer.observe(element));
        return () => observer.disconnect();
    }, []);

    return (
        <section ref={sectionRef} className="about-v1">
            <div className="about-v1__shell">
                <div className="about-v1__content">
                    <a href="https://github.com/Deal-Tech/dealtech-ui-for-public-component/tree/main/sections/About/AboutV1" target="_blank" rel="noreferrer" className="about-v1__eyebrow about-v1__reveal about-v1__hidden">
                        <Info size={16} strokeWidth={2.5} aria-hidden="true" /> About/AboutV1
                    </a>

                    <h2 className="about-v1__title about-v1__reveal about-v1__hidden">
                        Komponen Publik untuk{' '}
                        <span className="about-v1__title-accent">Design Lebih Cepat</span>
                    </h2>

                    <p className="about-v1__description about-v1__reveal about-v1__hidden">
                        Dealtech UI menyediakan komponen React siap pakai yang responsif, konsisten, dan mudah
                        disesuaikan. Developer dapat membangun halaman berkualitas tanpa mengulang design dari awal.
                    </p>

                    <div className="about-v1__action about-v1__reveal about-v1__hidden">
                        <a className="about-v1__button" href="#tentang">
                            Lihat Tentang Kami
                        </a>
                    </div>
                </div>

                <div className="about-v1__visual about-v1__reveal about-v1__hidden">
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
