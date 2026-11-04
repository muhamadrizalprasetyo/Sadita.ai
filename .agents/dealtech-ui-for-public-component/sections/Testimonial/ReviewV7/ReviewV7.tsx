import { useEffect, useRef } from 'react';
import { Star } from 'lucide-react';

import './review-v7.css';

const reviews = [
    {
        name: 'A**** M. — Finance Manager',
        text: 'Dulu setiap halaman dimulai dari nol. Sekarang kami memilih komponen yang sesuai lalu menyesuaikan konten dan warnanya.',
    },
    {
        name: 'R**** H. — Customer Support',
        text: 'Komponen yang responsif sejak awal membuat proses review lebih singkat dan mengurangi revisi tampilan mobile.',
    },
    {
        name: 'S**** F. — Operations Lead',
        text: 'Struktur file dan CSS yang konsisten memudahkan tim memindahkan section ke proyek tanpa mengubah design dasarnya.',
    },
    {
        name: 'D**** P. — Product Designer',
        text: 'Komponen yang konsisten membuat proses menyusun halaman jauh lebih cepat. Tim dapat fokus pada pengalaman pengguna tanpa mengulang pola yang sama.',
    },
    {
        name: 'N**** A. — Frontend Developer',
        text: 'Strukturnya mudah dipahami dan responsif sejak awal. Penyesuaian warna serta konten juga tidak membutuhkan perubahan besar.',
    },
    {
        name: 'F**** R. — Project Manager',
        text: 'Waktu pengerjaan antarmuka menjadi lebih terukur. Semua anggota tim memakai pola komponen yang sama dan hasil akhirnya terasa lebih rapi.',
    },
];

function GoogleIcon() {
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <path fill="#4285f4" d="M21.8 10.02h-9.76v3.96h5.62c-.25 1.27-.97 2.35-2.06 3.07v2.56h3.33c1.95-1.79 3.07-4.43 3.07-7.59 0-.72-.06-1.42-.2-2Z" />
            <path fill="#34a853" d="M12.04 22c2.8 0 5.16-.93 6.89-2.52l-3.33-2.56c-.93.63-2.11 1-3.56 1-2.71 0-5.01-1.83-5.83-4.29H2.78v2.65A10.4 10.4 0 0 0 12.04 22Z" />
            <path fill="#fbbc05" d="M6.21 13.63a6.25 6.25 0 0 1 0-4V6.98H2.78a10.04 10.04 0 0 0 0 9.3l3.43-2.65Z" />
            <path fill="#ea4335" d="M12.04 5.34c1.53 0 2.9.53 3.98 1.56l2.96-2.97C17.19 2.26 14.85 1.25 12.04 1.25A10.4 10.4 0 0 0 2.78 6.98l3.43 2.65c.82-2.46 3.12-4.29 5.83-4.29Z" />
        </svg>
    );
}

export default function ReviewV7() {
    const sectionRef = useRef<HTMLElement>(null);

    useEffect(() => {
        const section = sectionRef.current;
        if (!section) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    section.classList.add('review-v7--visible');
                    observer.disconnect();
                }
            },
            { threshold: 0.12, rootMargin: '0px 0px -40px 0px' },
        );

        observer.observe(section);
        return () => observer.disconnect();
    }, []);

    return (
        <section ref={sectionRef} className="review-v7">
            <div className="review-v7__shell">
                <a href="https://github.com/Deal-Tech/dealtech-ui-for-public-component/tree/main/sections/Testimonial/ReviewV7" target="_blank" rel="noreferrer" className="review-v7__eyebrow">Testimonial/ReviewV7</a>
                <h2 className="review-v7__heading">
                    Sudah Dipakai Berbagai Tim untuk{' '}
                    <span>Membangun UI Lebih Cepat</span>
                </h2>

                <p className="review-v7__subtitle">
                    Dibangun bersama developer dan designer untuk kebutuhan produk digital sehari-hari.
                </p>

                <div className="review-v7__masonry">
                    {reviews.map((review) => (
                        <article key={review.name} className="review-v7__card">
                            <div className="review-v7__stars" aria-label="Nilai 5 dari 5">
                                {Array.from({ length: 5 }).map((_, index) => (
                                    <Star key={index} size={14} strokeWidth={0} fill="currentColor" aria-hidden="true" />
                                ))}
                            </div>
                            <p className="review-v7__text">{review.text}</p>
                            <span className="review-v7__name">{review.name}</span>
                        </article>
                    ))}
                </div>

                <a
                    className="review-v7__google"
                    href="https://www.google.com/search?q=Dealtech+UI+review"
                    target="_blank"
                    rel="noreferrer"
                >
                    <GoogleIcon />
                    Lihat di Google Review
                </a>
            </div>
        </section>
    );
}
