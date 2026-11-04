import { useEffect, useRef } from 'react';
import { Facebook, Github, Instagram, Linkedin, Mail, MapPin, Phone, Send } from 'lucide-react';

import './contact-v2.css';

const socialLinks = [
    { label: 'Instagram', href: '#', icon: Instagram },
    { label: 'LinkedIn', href: '#', icon: Linkedin },
    { label: 'Facebook', href: '#', icon: Facebook },
    { label: 'GitHub', href: '#', icon: Github },
];

export default function ContactV2() {
    const sectionRef = useRef<HTMLElement>(null);

    useEffect(() => {
        const section = sectionRef.current;
        if (!section) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('contact-v2__visible');
                        entry.target.classList.remove('contact-v2__hidden');
                        observer.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.12, rootMargin: '0px 0px -40px 0px' },
        );

        section.querySelectorAll('.contact-v2__reveal').forEach((element) => observer.observe(element));
        return () => observer.disconnect();
    }, []);

    return (
        <section ref={sectionRef} className="contact-v2">
            <div className="contact-v2__shell contact-v2__reveal contact-v2__hidden">
                <div className="contact-v2__info">
                    <div>
                        <a href="https://github.com/Deal-Tech/dealtech-ui-for-public-component/tree/main/sections/Contact/ContactV2" target="_blank" rel="noreferrer" className="contact-v2__eyebrow">Contact/ContactV2</a>
                        <h2>Mari Terhubung</h2>
                        <p>Ceritakan kebutuhan proyekmu. Tim kami siap membantu menemukan solusi yang tepat.</p>
                    </div>

                    <div className="contact-v2__details">
                        <div className="contact-v2__detail">
                            <span className="contact-v2__icon">
                                <MapPin size={19} strokeWidth={2} aria-hidden="true" />
                            </span>
                            <div>
                                <h3>Lokasi</h3>
                                <p>Jakarta, Indonesia</p>
                            </div>
                        </div>

                        <div className="contact-v2__detail">
                            <span className="contact-v2__icon">
                                <Mail size={19} strokeWidth={2} aria-hidden="true" />
                            </span>
                            <div>
                                <h3>Email</h3>
                                <a href="mailto:hello@dealtech.com">hello@dealtech.com</a>
                            </div>
                        </div>

                        <div className="contact-v2__detail">
                            <span className="contact-v2__icon">
                                <Phone size={19} strokeWidth={2} aria-hidden="true" />
                            </span>
                            <div>
                                <h3>Telepon</h3>
                                <a href="tel:+6281234567890">+62 812 3456 7890</a>
                            </div>
                        </div>
                    </div>

                    <div className="contact-v2__socials">
                        <h3>Ikuti media sosial kami</h3>
                        <div>
                            {socialLinks.map(({ label, href, icon: Icon }) => (
                                <a href={href} aria-label={label} key={label}>
                                    <Icon size={17} strokeWidth={2} aria-hidden="true" />
                                </a>
                            ))}
                        </div>
                    </div>
                </div>

                <form className="contact-v2__form" onSubmit={(event) => event.preventDefault()}>
                    <div className="contact-v2__field-row">
                        <label className="contact-v2__field">
                            <span>Nama</span>
                            <input type="text" name="name" placeholder="Nama lengkap" autoComplete="name" />
                        </label>
                        <label className="contact-v2__field">
                            <span>Perusahaan</span>
                            <input type="text" name="company" placeholder="Nama perusahaan" autoComplete="organization" />
                        </label>
                    </div>

                    <div className="contact-v2__field-row">
                        <label className="contact-v2__field">
                            <span>Telepon</span>
                            <input type="tel" name="phone" placeholder="+62 812 3456 7890" autoComplete="tel" />
                        </label>
                        <label className="contact-v2__field">
                            <span>Email</span>
                            <input type="email" name="email" placeholder="nama@perusahaan.com" autoComplete="email" />
                        </label>
                    </div>

                    <label className="contact-v2__field">
                        <span>Topik</span>
                        <input type="text" name="subject" placeholder="Apa yang ingin didiskusikan?" />
                    </label>

                    <label className="contact-v2__field">
                        <span>Pesan</span>
                        <textarea name="message" placeholder="Tulis pesanmu..." rows={5} />
                    </label>

                    <button className="contact-v2__submit" type="submit">
                        Kirim Pesan
                        <Send size={17} strokeWidth={2.2} aria-hidden="true" />
                    </button>
                </form>
            </div>
        </section>
    );
}
