import { useEffect, useRef } from 'react';
import { Mail, MapPin, MessageCircle, Phone, Send } from 'lucide-react';

import './contact-v5.css';

export default function ContactV5() {
    const sectionRef = useRef<HTMLElement>(null);

    useEffect(() => {
        const section = sectionRef.current;
        if (!section) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('contact-v5__visible');
                        entry.target.classList.remove('contact-v5__hidden');
                        observer.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.12, rootMargin: '0px 0px -40px 0px' },
        );

        section.querySelectorAll('.contact-v5__reveal').forEach((element) => observer.observe(element));
        return () => observer.disconnect();
    }, []);

    return (
        <section ref={sectionRef} className="contact-v5">
            <div className="contact-v5__shell contact-v5__reveal contact-v5__hidden">
                <aside className="contact-v5__info">
                    <a href="https://github.com/Deal-Tech/dealtech-ui-for-public-component/tree/main/sections/Contact/ContactV5" target="_blank" rel="noreferrer" className="contact-v5__info-badge">Contact/ContactV5</a>
                    <h2>Butuh Informasi Lebih Lanjut?</h2>
                    <p>
                        Ceritakan kebutuhanmu dan temukan solusi terbaik bersama tim kami.
                    </p>

                    <div className="contact-v5__details">
                        <div className="contact-v5__detail">
                            <Phone size={18} strokeWidth={2} aria-hidden="true" />
                            <div>
                                <h3>Nomor Telepon</h3>
                                <a href="tel:+6281234567890">+62 812 3456 7890</a>
                            </div>
                        </div>

                        <div className="contact-v5__detail">
                            <Mail size={18} strokeWidth={2} aria-hidden="true" />
                            <div>
                                <h3>Email</h3>
                                <a href="mailto:hello@dealtech.com">hello@dealtech.com</a>
                            </div>
                        </div>

                        <div className="contact-v5__detail">
                            <MapPin size={18} strokeWidth={2} aria-hidden="true" />
                            <div>
                                <h3>Lokasi Kantor</h3>
                                <p>Deal Tech, Indonesia</p>
                            </div>
                        </div>
                    </div>
                </aside>

                <form className="contact-v5__form" onSubmit={(event) => event.preventDefault()}>
                    <header className="contact-v5__form-header">
                        <span>
                            <MessageCircle size={13} strokeWidth={2.2} aria-hidden="true" />
                            Hubungi Kami
                        </span>
                        <h2>Kirim Pesan</h2>
                        <p>Isi formulir berikut dan tim kami akan segera menghubungimu.</p>
                    </header>

                    <div className="contact-v5__field-row">
                        <label className="contact-v5__field">
                            <span>Nama depan</span>
                            <input type="text" name="firstName" placeholder="Nama depan" autoComplete="given-name" />
                        </label>
                        <label className="contact-v5__field">
                            <span>Nama belakang</span>
                            <input type="text" name="lastName" placeholder="Nama belakang" autoComplete="family-name" />
                        </label>
                    </div>

                    <div className="contact-v5__field-row">
                        <label className="contact-v5__field">
                            <span>Email</span>
                            <input type="email" name="email" placeholder="nama@perusahaan.com" autoComplete="email" />
                        </label>
                        <label className="contact-v5__field">
                            <span>Telepon</span>
                            <input type="tel" name="phone" placeholder="+62 812 3456 7890" autoComplete="tel" />
                        </label>
                    </div>

                    <label className="contact-v5__field">
                        <span>Pesan</span>
                        <textarea name="message" placeholder="Tulis pesanmu..." rows={6} />
                    </label>

                    <button className="contact-v5__submit" type="submit">
                        Kirim Pesan
                        <Send size={16} strokeWidth={2.2} aria-hidden="true" />
                    </button>
                </form>
            </div>
        </section>
    );
}
