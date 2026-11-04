import { useEffect, useRef, type CSSProperties } from 'react';
import { Check, Sparkles } from 'lucide-react';

import './about-v6.css';

const dashboardImage = new URL('./assets/dashboard-preview.svg', import.meta.url).href;

type AboutV6Benefit = {
    title: string;
    description: string;
};

type AboutV6Props = {
    id?: string;
    badgeLabel?: string;
    badgeHref?: string | null;
    title?: string;
    titleAccent?: string;
    description?: string;
    benefits?: AboutV6Benefit[];
};

const defaultBenefits = [
    {
        title: 'Bangun Lebih Cepat',
        description: 'Gunakan komponen siap pakai agar fokus tetap pada pengalaman dan kebutuhan produk.',
    },
    {
        title: 'Jaga Konsistensi',
        description: 'Pertahankan pola visual yang rapi dan seragam di setiap bagian halaman.',
    },
    {
        title: 'Skalakan dengan Percaya Diri',
        description: 'Sesuaikan warna, konten, dan detail komponen saat kebutuhan proyek berkembang.',
    },
];

export default function AboutV6({
    id,
    badgeLabel = 'About/AboutV6',
    badgeHref = 'https://github.com/Deal-Tech/dealtech-ui-for-public-component/tree/main/sections/About/AboutV6',
    title = 'Dibuat untuk Membantu Kamu',
    titleAccent = 'Berkembang',
    description = 'Dealtech UI memberi fondasi yang kamu butuhkan untuk fokus pada hal penting dan menghasilkan antarmuka berkualitas tanpa memulai semuanya dari awal.',
    benefits = defaultBenefits,
}: AboutV6Props = {}) {
    const sectionRef = useRef<HTMLElement>(null);

    useEffect(() => {
        const section = sectionRef.current;
        if (!section) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('about-v6__visible');
                        entry.target.classList.remove('about-v6__hidden');
                        observer.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.12, rootMargin: '0px 0px -40px 0px' },
        );

        section.querySelectorAll('.about-v6__reveal').forEach((element) => observer.observe(element));
        return () => observer.disconnect();
    }, []);

    return (
        <section ref={sectionRef} id={id} className="about-v6">
            <div className="about-v6__shell">
                <div className="about-v6__visual about-v6__reveal about-v6__hidden">
                    <span className="about-v6__visual-shape" aria-hidden="true" />
                    <div className="about-v6__visual-frame">
                        <img
                            src={dashboardImage}
                            alt="Preview dashboard yang dibangun dengan Dealtech UI."
                            width={960}
                            height={680}
                            decoding="async"
                        />
                    </div>
                </div>

                <div className="about-v6__content">
                    {badgeHref ? (
                        <a href={badgeHref} target="_blank" rel="noreferrer" className="about-v6__eyebrow about-v6__reveal about-v6__hidden">
                            <Sparkles size={16} strokeWidth={2.4} aria-hidden="true" /> {badgeLabel}
                        </a>
                    ) : (
                        <span className="about-v6__eyebrow about-v6__reveal about-v6__hidden">
                            <Sparkles size={16} strokeWidth={2.4} aria-hidden="true" /> {badgeLabel}
                        </span>
                    )}

                    <h2 className="about-v6__title about-v6__reveal about-v6__hidden">
                        {title} <span className="about-v6__title-accent">{titleAccent}</span>
                    </h2>

                    <p className="about-v6__description about-v6__reveal about-v6__hidden">
                        {description}
                    </p>

                    <div className="about-v6__benefits">
                        {benefits.map(({ title, description }, index) => (
                            <div
                                className="about-v6__benefit about-v6__reveal about-v6__hidden"
                                style={{ '--about-v6-delay': `${index * 80}ms` } as CSSProperties}
                                key={title}
                            >
                                <span className="about-v6__benefit-icon">
                                    <Check size={14} strokeWidth={3} aria-hidden="true" />
                                </span>
                                <span className="about-v6__benefit-copy">
                                    <strong>{title}</strong>
                                    <small>{description}</small>
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
