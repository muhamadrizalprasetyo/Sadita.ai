import { useEffect, useRef } from 'react';
import { BadgeCheck, ChartNoAxesCombined, MessageCircle, Quote, Star, Trophy, UsersRound } from 'lucide-react';

import './review-v4.css';

const stats = [
    { icon: Star, value: '4.9/5', label: 'Rata-rata penilaian' },
    { icon: MessageCircle, value: '500+', label: 'Developer terbantu' },
    { icon: Trophy, value: '98%', label: 'Merekomendasikan' },
    { icon: ChartNoAxesCombined, value: '2.8M+', label: 'Komponen ditampilkan' },
];

const reviews = [
    {
        name: 'A**** M.',
        role: 'Frontend Developer',
        initials: 'AM',
        text: 'Dealtech UI membantu kami menyusun landing page lebih cepat. Struktur komponen rapi dan mudah disesuaikan dengan identitas produk.',
    },
    {
        name: 'R**** H.',
        role: 'Product Designer',
        initials: 'RH',
        text: 'Setiap variasi memberi titik awal yang jelas. Kolaborasi design dan development menjadi lebih singkat tanpa kehilangan fleksibilitas.',
    },
    {
        name: 'S**** F.',
        role: 'UI Engineer',
        initials: 'SF',
        text: 'Integrasinya terasa ringan dan konsisten. Kami dapat mengambil section yang dibutuhkan tanpa membawa struktur yang rumit.',
    },
    {
        name: 'D**** P.',
        role: 'Creative Lead',
        initials: 'DP',
        text: 'Waktu revisi tampilan berkurang karena semua komponen sudah responsif dan mempunyai pola visual yang mudah dipahami tim.',
    },
    {
        name: 'N**** A.',
        role: 'Web Developer',
        initials: 'NA',
        text: 'Dokumentasi dan susunan filenya jelas. Penyesuaian konten, warna, serta detail interaksi dapat dilakukan dengan cepat.',
    },
    {
        name: 'F**** R.',
        role: 'Project Manager',
        initials: 'FR',
        text: 'Fondasi UI yang stabil membuat estimasi proyek lebih terukur. Tim fokus pada kebutuhan produk, bukan mengulang komponen dasar.',
    },
];

const technologies = ['React', 'TypeScript', 'Vite', 'Tailwind CSS', 'Laravel', 'GitHub'];

export default function ReviewV4() {
    const sectionRef = useRef<HTMLElement>(null);

    useEffect(() => {
        const section = sectionRef.current;
        if (!section) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    section.classList.add('review-v4--visible');
                    observer.disconnect();
                }
            },
            { threshold: 0.1, rootMargin: '0px 0px -40px 0px' },
        );

        observer.observe(section);
        return () => observer.disconnect();
    }, []);

    return (
        <section ref={sectionRef} className="review-v4">
            <div className="review-v4__shell">
                <header className="review-v4__header">
                    <a href="https://github.com/Deal-Tech/dealtech-ui-for-public-component/tree/main/sections/Testimonial/ReviewV4" target="_blank" rel="noreferrer" className="review-v4__badge">
                        <UsersRound size={13} aria-hidden="true" />
                        Testimonial/ReviewV4
                    </a>
                    <h2 className="review-v4__heading">
                        Disukai tim, <span>terbukti lewat hasil</span>
                    </h2>
                    <p>Bangun antarmuka lebih cepat, jaga konsistensi, dan hadirkan pengalaman terbaik di setiap layar.</p>
                </header>

                <div className="review-v4__stats">
                    {stats.map(({ icon: Icon, value, label }) => (
                        <article className="review-v4__stat" key={value}>
                            <span className="review-v4__stat-icon">
                                <Icon size={18} aria-hidden="true" />
                            </span>
                            <span>
                                <strong>{value}</strong>
                                <small>{label}</small>
                            </span>
                        </article>
                    ))}
                </div>

                <div className="review-v4__grid">
                    {reviews.map((review, index) => (
                        <article className="review-v4__card" key={review.name}>
                            <div className="review-v4__card-top">
                                <Quote size={20} strokeWidth={0} fill="currentColor" aria-hidden="true" />
                                <div className="review-v4__stars" aria-label="Nilai 5 dari 5">
                                    {Array.from({ length: 5 }).map((_, starIndex) => (
                                        <Star
                                            key={starIndex}
                                            size={12}
                                            strokeWidth={0}
                                            fill="currentColor"
                                            aria-hidden="true"
                                        />
                                    ))}
                                </div>
                            </div>
                            <p>{review.text}</p>
                            <footer className="review-v4__author">
                                <span className={`review-v4__avatar review-v4__avatar--${(index % 3) + 1}`}>
                                    {review.initials}
                                </span>
                                <span>
                                    <strong>{review.name}</strong>
                                    <small>{review.role}</small>
                                </span>
                                <BadgeCheck size={16} aria-label="Terverifikasi" />
                            </footer>
                        </article>
                    ))}
                </div>

                <footer className="review-v4__trusted">
                    <small>TEKNOLOGI YANG KAMI DUKUNG</small>
                    <div>
                        {technologies.map((technology) => (
                            <span key={technology}>{technology}</span>
                        ))}
                    </div>
                </footer>
            </div>
        </section>
    );
}
