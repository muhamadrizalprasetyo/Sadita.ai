import { useEffect, useRef } from 'react';
import { ChevronDown, Info } from 'lucide-react';

import './about-v4.css';

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

export default function AboutV4() {
    const sectionRef = useRef<HTMLElement>(null);

    useEffect(() => {
        const section = sectionRef.current;
        if (!section) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('about-v4__visible');
                        entry.target.classList.remove('about-v4__hidden');
                        observer.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.12, rootMargin: '0px 0px -40px 0px' },
        );

        section.querySelectorAll('.about-v4__reveal').forEach((element) => observer.observe(element));
        return () => observer.disconnect();
    }, []);

    return (
        <section ref={sectionRef} className="about-v4">
            <div className="about-v4__shell">
                <div className="about-v4__content">
                    <a href="https://github.com/Deal-Tech/dealtech-ui-for-public-component/tree/main/sections/About/AboutV4" target="_blank" rel="noreferrer" className="about-v4__eyebrow about-v4__reveal about-v4__hidden">
                        <Info size={16} strokeWidth={2.5} aria-hidden="true" /> About/AboutV4
                    </a>

                    <h2 className="about-v4__title about-v4__reveal about-v4__hidden">
                        Komponen Publik untuk{' '}
                        <span className="about-v4__title-accent">Design Lebih Cepat</span>
                    </h2>

                    <p className="about-v4__description about-v4__reveal about-v4__hidden">
                        Dealtech UI menyediakan komponen React siap pakai yang responsif, konsisten, dan mudah
                        disesuaikan. Developer dapat membangun halaman berkualitas tanpa mengulang design dari awal.
                    </p>

                    <div className="about-v4__action about-v4__reveal about-v4__hidden">
                        <a className="about-v4__button" href="#tentang">
                            Lihat Tentang Kami
                        </a>
                    </div>
                </div>

                <div className="about-v4__panel about-v4__reveal about-v4__hidden">
                    <span className="about-v4__panel-label">Arah Kami</span>
                    <h3>Visi dan Misi</h3>

                    <div className="about-v4__accordion">
                        {accordionItems.map(({ title, content }, index) => (
                            <details className="about-v4__accordion-item" key={title} open={index === 0}>
                                <summary>
                                    <strong>{title}</strong>
                                    <ChevronDown size={18} strokeWidth={2.2} aria-hidden="true" />
                                </summary>
                                <p>{content}</p>
                            </details>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
