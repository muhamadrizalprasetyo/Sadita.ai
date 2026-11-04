import { useEffect, useRef } from 'react';
import { ChevronDown, Info } from 'lucide-react';

import './about-v3.css';

const accordionItems = [
    {
        title: 'Visi',
        content:
            'Menjadi referensi komponen UI publik yang membantu developer membangun produk digital dengan lebih cepat dan konsisten.',
    },
    {
        title: 'Misi',
        content:
            'Menyediakan komponen yang responsif, mudah disesuaikan, terdokumentasi dengan jelas, dan siap digunakan untuk berbagai kebutuhan proyek.',
    },
];

const dashboardImage = new URL('./assets/demo-dashboard.svg', import.meta.url).href;

export default function AboutV3() {
    const sectionRef = useRef<HTMLElement>(null);

    useEffect(() => {
        const section = sectionRef.current;
        if (!section) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('about-v3__visible');
                        entry.target.classList.remove('about-v3__hidden');
                        observer.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.12, rootMargin: '0px 0px -40px 0px' },
        );

        section.querySelectorAll('.about-v3__reveal').forEach((element) => observer.observe(element));
        return () => observer.disconnect();
    }, []);

    return (
        <section ref={sectionRef} className="about-v3">
            <div className="about-v3__shell">
                <div className="about-v3__content">
                    <a href="https://github.com/Deal-Tech/dealtech-ui-for-public-component/tree/main/sections/About/AboutV3" target="_blank" rel="noreferrer" className="about-v3__eyebrow about-v3__reveal about-v3__hidden">
                        <Info size={16} strokeWidth={2.5} aria-hidden="true" /> About/AboutV3
                    </a>

                    <h2 className="about-v3__title about-v3__reveal about-v3__hidden">
                        Komponen Publik untuk{' '}
                        <span className="about-v3__title-accent">Design Lebih Cepat</span>
                    </h2>

                    <p className="about-v3__description about-v3__reveal about-v3__hidden">
                        Dealtech UI menyediakan komponen React siap pakai yang responsif, konsisten, dan mudah
                        disesuaikan. Developer dapat membangun halaman berkualitas tanpa mengulang design dari awal.
                    </p>

                    <div className="about-v3__accordion about-v3__reveal about-v3__hidden">
                        {accordionItems.map((item, index) => (
                            <details className="about-v3__accordion-item" key={item.title} open={index === 0}>
                                <summary>
                                    <span>{item.title}</span>
                                    <ChevronDown size={18} strokeWidth={2.2} aria-hidden="true" />
                                </summary>
                                <p>{item.content}</p>
                            </details>
                        ))}
                    </div>
                </div>

                <div className="about-v3__visual about-v3__reveal about-v3__hidden">
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
