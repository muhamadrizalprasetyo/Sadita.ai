import { useEffect, useRef } from 'react';
import { Star } from 'lucide-react';

import './review-v2.css';

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

export default function ReviewV2() {
    const sectionRef = useRef<HTMLElement>(null);

    useEffect(() => {
        const section = sectionRef.current;
        if (!section) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    section.classList.add('review-v2--visible');
                    observer.disconnect();
                }
            },
            { threshold: 0.12, rootMargin: '0px 0px -40px 0px' },
        );

        observer.observe(section);
        return () => observer.disconnect();
    }, []);

    return (
        <section ref={sectionRef} className="review-v2">
            <div className="review-v2__shell">
                <a href="https://github.com/Deal-Tech/dealtech-ui-for-public-component/tree/main/sections/Testimonial/ReviewV2" target="_blank" rel="noreferrer" className="review-v2__eyebrow">Testimonial/ReviewV2</a>
                <h2 className="review-v2__heading">
                    Sudah Dipakai Berbagai Tim untuk{' '}
                    <span className="review-v2__heading-accent">Membangun UI Lebih Cepat</span>
                </h2>

                <p className="review-v2__subtitle">
                    Dibangun bersama developer dan designer untuk kebutuhan produk digital sehari-hari.
                </p>

                <div className="review-v2__masonry">
                    {reviews.map((review) => (
                        <article key={review.name} className="review-v2__card">
                            <div className="review-v2__stars" aria-label="Nilai 5 dari 5">
                                {Array.from({ length: 5 }).map((_, index) => (
                                    <Star
                                        key={index}
                                        size={14}
                                        strokeWidth={0}
                                        fill="currentColor"
                                        aria-hidden="true"
                                    />
                                ))}
                            </div>
                            <p className="review-v2__text">{review.text}</p>
                            <span className="review-v2__name">{review.name}</span>
                        </article>
                    ))}
                </div>
            </div>
        </section>
    );
}
