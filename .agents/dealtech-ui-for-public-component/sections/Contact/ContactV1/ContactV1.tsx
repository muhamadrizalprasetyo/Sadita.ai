import { useEffect, useRef } from 'react';
import { Mail, MapPin, MessageCircle, Phone, Send } from 'lucide-react';

import './contact-v1.css';

const services = [
    'Desain website',
    'Pembuatan komponen',
    'Landing page',
    'Konsultasi UI',
    'Dashboard',
    'Lainnya',
];

export default function ContactV1() {
    const sectionRef = useRef<HTMLElement>(null);

    useEffect(() => {
        const section = sectionRef.current;
        if (!section) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('contact-v1__visible');
                        entry.target.classList.remove('contact-v1__hidden');
                        observer.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.12, rootMargin: '0px 0px -40px 0px' },
        );

        section.querySelectorAll('.contact-v1__reveal').forEach((element) => observer.observe(element));
        return () => observer.disconnect();
    }, []);

    return (
        <section ref={sectionRef} className="contact-v1">
            <div className="contact-v1__shell">
                <header className="contact-v1__header contact-v1__reveal contact-v1__hidden">
                    <a href="https://github.com/Deal-Tech/dealtech-ui-for-public-component/tree/main/sections/Contact/ContactV1" target="_blank" rel="noreferrer" className="contact-v1__eyebrow">
                        <MessageCircle size={15} strokeWidth={2.4} aria-hidden="true" />
                        Contact/ContactV1
                    </a>
                    <h2 className="contact-v1__heading">
                        Hubungi <span>Tim Kami</span>
                    </h2>
                    <p className="contact-v1__description">
                        Punya pertanyaan atau ingin berdiskusi? Ceritakan kebutuhanmu dan tim kami akan segera membantu.
                    </p>
                </header>

                <div className="contact-v1__panel contact-v1__reveal contact-v1__hidden">
                    <form className="contact-v1__form" onSubmit={(event) => event.preventDefault()}>
                        <div className="contact-v1__field-row">
                            <label className="contact-v1__field">
                                <span>Nama depan</span>
                                <input type="text" name="firstName" placeholder="Nama depan" autoComplete="given-name" />
                            </label>
                            <label className="contact-v1__field">
                                <span>Nama belakang</span>
                                <input type="text" name="lastName" placeholder="Nama belakang" autoComplete="family-name" />
                            </label>
                        </div>

                        <label className="contact-v1__field">
                            <span>Email</span>
                            <input type="email" name="email" placeholder="nama@perusahaan.com" autoComplete="email" />
                        </label>

                        <label className="contact-v1__field">
                            <span>Nomor telepon</span>
                            <input type="tel" name="phone" placeholder="+62 812 3456 7890" autoComplete="tel" />
                        </label>

                        <label className="contact-v1__field">
                            <span>Pesan</span>
                            <textarea name="message" placeholder="Ceritakan kebutuhanmu..." rows={5} />
                        </label>

                        <fieldset className="contact-v1__services">
                            <legend>Layanan yang dibutuhkan</legend>
                            <div className="contact-v1__options">
                                {services.map((service) => (
                                    <label key={service}>
                                        <input type="checkbox" name="services" value={service} />
                                        <span>{service}</span>
                                    </label>
                                ))}
                            </div>
                        </fieldset>

                        <button className="contact-v1__submit" type="submit">
                            Kirim Pesan
                            <Send size={17} strokeWidth={2.2} aria-hidden="true" />
                        </button>
                    </form>

                    <aside className="contact-v1__details">
                        <div className="contact-v1__detail">
                            <span className="contact-v1__icon">
                                <Mail size={20} strokeWidth={2} aria-hidden="true" />
                            </span>
                            <div>
                                <h3>Kirim email</h3>
                                <p>Sampaikan pertanyaanmu melalui email dan tim kami akan segera membalas.</p>
                                <a href="mailto:hello@dealtech.com">hello@dealtech.com</a>
                            </div>
                        </div>

                        <div className="contact-v1__detail">
                            <span className="contact-v1__icon">
                                <Phone size={20} strokeWidth={2} aria-hidden="true" />
                            </span>
                            <div>
                                <h3>Hubungi kami</h3>
                                <p>Tersedia Senin sampai Jumat pukul 09.00–17.00 WIB.</p>
                                <a href="tel:+6281234567890">+62 812 3456 7890</a>
                            </div>
                        </div>

                        <div className="contact-v1__detail">
                            <span className="contact-v1__icon">
                                <MapPin size={20} strokeWidth={2} aria-hidden="true" />
                            </span>
                            <div>
                                <h3>Kunjungi kami</h3>
                                <p>Temui tim kami untuk berdiskusi langsung tentang kebutuhan proyekmu.</p>
                                <span>Jakarta, Indonesia</span>
                            </div>
                        </div>
                    </aside>
                </div>
            </div>
        </section>
    );
}
