import { useEffect } from 'react';

import './cta-v1.css';

export default function CTAV1() {
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('cta-v1__fade-in');
                        entry.target.classList.remove('cta-v1__opacity-0');
                        observer.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.12, rootMargin: '0px 0px -40px 0px' },
        );

        document.querySelectorAll('.cta-v1 .cta-v1__reveal').forEach((element) => observer.observe(element));
        return () => observer.disconnect();
    }, []);

    return (
        <section className="cta-v1">
            <div className="cta-v1__inner">
                <div className="cta-v1__content">
                    <a href="https://github.com/Deal-Tech/dealtech-ui-for-public-component/tree/main/sections/CTA/CTAV1" target="_blank" rel="noreferrer" className="cta-v1__eyebrow">CTA/CTAV1</a>
                    <h2 className="cta-v1__title cta-v1__reveal cta-v1__opacity-0">
                        <span>Siap Bangun UI Lebih Cepat untuk </span>
                        <span className="cta-v1__title-accent">Proyek Berikutnya?</span>
                    </h2>

                    <p className="cta-v1__description cta-v1__reveal cta-v1__opacity-0">
                        Pilih komponen siap pakai, salin ke proyek, lalu sesuaikan tanpa perlu memulai dari nol.
                    </p>

                    <div className="cta-v1__actions cta-v1__reveal cta-v1__opacity-0">
                        <a className="cta-v1__button" href="#fitur">
                            Jelajahi Komponen
                        </a>
                    </div>
                </div>
            </div>
        </section>
    );
}
