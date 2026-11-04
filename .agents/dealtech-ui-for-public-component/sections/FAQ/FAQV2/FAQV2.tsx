import { useEffect, useRef, useState } from 'react';
import { BadgeHelp, ChevronDown } from 'lucide-react';

import './faq-v2.css';

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

export default function FAQV2() {
    const sectionRef = useRef<HTMLElement>(null);
    const [activeIndex, setActiveIndex] = useState<number | null>(0);

    useEffect(() => {
        const section = sectionRef.current;
        if (!section) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('faq-v2__visible');
                        entry.target.classList.remove('faq-v2__hidden');
                        observer.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.12, rootMargin: '0px 0px -40px 0px' },
        );

        section.querySelectorAll('.faq-v2__reveal').forEach((element) => observer.observe(element));
        return () => observer.disconnect();
    }, []);

    return (
        <section ref={sectionRef} className="faq-v2">
            <div className="faq-v2__shell">
                <header className="faq-v2__header faq-v2__reveal faq-v2__hidden">
                    <a href="https://github.com/Deal-Tech/dealtech-ui-for-public-component/tree/main/sections/FAQ/FAQV2" target="_blank" rel="noreferrer" className="faq-v2__eyebrow">
                        <BadgeHelp size={15} strokeWidth={2.4} aria-hidden="true" />
                        FAQ/FAQV2
                    </a>
                    <h2 className="faq-v2__heading">
                        Pertanyaan yang <span>Sering Diajukan</span>
                    </h2>
                    <p className="faq-v2__description">
                        Temukan jawaban singkat seputar penggunaan komponen publik Dealtech UI.
                    </p>
                </header>

                <div className="faq-v2__list">
                    {faqs.map((faq, index) => {
                        const isOpen = activeIndex === index;
                        const answerId = `faq-v2-answer-${index}`;

                        return (
                            <article
                                className={`faq-v2__item${isOpen ? ' faq-v2__item--open' : ''}`}
                                key={faq.question}
                            >
                                <button
                                    type="button"
                                    aria-expanded={isOpen}
                                    aria-controls={answerId}
                                    onClick={() => setActiveIndex(isOpen ? null : index)}
                                >
                                    <span>{faq.question}</span>
                                    <ChevronDown size={20} strokeWidth={2.2} aria-hidden="true" />
                                </button>
                                <div className="faq-v2__answer" id={answerId}>
                                    <div>
                                        <p>{faq.answer}</p>
                                    </div>
                                </div>
                            </article>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
