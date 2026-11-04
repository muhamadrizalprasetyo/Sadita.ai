import { useEffect, useRef } from 'react';
import { BadgeHelp } from 'lucide-react';

import './faq-v4.css';

const faqs = [
    {
        question: 'Apakah semua komponen gratis?',
        answer: 'Ya. Seluruh komponen publik dapat disalin, diubah, dan digunakan tanpa biaya.',
    },
    {
        question: 'Bagaimana cara memakai komponennya?',
        answer: 'Pilih komponen, salin file TSX dan CSS, lalu sesuaikan konten dengan kebutuhan proyek.',
    },
    {
        question: 'Bisa dipakai untuk proyek komersial?',
        answer: 'Bisa. Komponen boleh digunakan untuk proyek pribadi maupun komersial.',
    },
    {
        question: 'Apakah perlu proses instalasi?',
        answer: 'Tidak ada instalasi khusus. Ambil file yang dibutuhkan dan pindahkan langsung ke proyek.',
    },
    {
        question: 'Teknologi apa yang digunakan?',
        answer: 'Komponen ditulis dengan React TSX, CSS mandiri, dan ikon dari Lucide React.',
    },
    {
        question: 'Apakah tampilannya responsif?',
        answer: 'Ya. Setiap komponen dirancang agar tetap nyaman pada layar desktop dan mobile.',
    },
    {
        question: 'Bolehkah desainnya diubah?',
        answer: 'Tentu. Warna, teks, spacing, dan struktur visual bebas disesuaikan.',
    },
    {
        question: 'Apakah aset sudah tersedia?',
        answer: 'Komponen yang membutuhkan aset menyertakannya di dalam folder komponennya.',
    },
];

export default function FAQV4() {
    const sectionRef = useRef<HTMLElement>(null);

    useEffect(() => {
        const section = sectionRef.current;
        if (!section) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('faq-v4__visible');
                        entry.target.classList.remove('faq-v4__hidden');
                        observer.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.12, rootMargin: '0px 0px -40px 0px' },
        );

        section.querySelectorAll('.faq-v4__reveal').forEach((element) => observer.observe(element));
        return () => observer.disconnect();
    }, []);

    return (
        <section ref={sectionRef} className="faq-v4">
            <div className="faq-v4__shell">
                <header className="faq-v4__header faq-v4__reveal faq-v4__hidden">
                    <a href="https://github.com/Deal-Tech/dealtech-ui-for-public-component/tree/main/sections/FAQ/FAQV4" target="_blank" rel="noreferrer" className="faq-v4__eyebrow">
                        <BadgeHelp size={15} strokeWidth={2.4} aria-hidden="true" />
                        FAQ/FAQV4
                    </a>
                    <h2 className="faq-v4__heading">
                        Pertanyaan yang <span>Sering Diajukan</span>
                    </h2>
                    <p className="faq-v4__description">
                        Temukan jawaban singkat seputar penggunaan komponen publik Dealtech UI.
                    </p>
                </header>

                <div className="faq-v4__list">
                    {faqs.map((faq) => (
                        <article className="faq-v4__item" key={faq.question}>
                            <h3>{faq.question}</h3>
                            <p>{faq.answer}</p>
                        </article>
                    ))}
                </div>
            </div>
        </section>
    );
}
