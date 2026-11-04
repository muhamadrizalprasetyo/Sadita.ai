import { useEffect, useRef } from 'react';
import { ExternalLink, Facebook, Github, Instagram, Linkedin, Mail, MapPin, Phone, Send } from 'lucide-react';

import './contact-v4.css';

const mapUrl = 'https://www.google.com/maps/place/Deal+Tech+-+Developer+Website+dan+Aplikasi/data=!4m2!3m1!1s0x0:0x5a41f4b639d5f371?sa=X&ved=1t:2428&ictx=111';
const mapEmbedUrl = 'https://www.google.com/maps?q=Deal%20Tech%20Developer%20Website%20dan%20Aplikasi&output=embed';

const socialLinks = [
    { label: 'Instagram', href: '#', icon: Instagram },
    { label: 'LinkedIn', href: '#', icon: Linkedin },
    { label: 'Facebook', href: '#', icon: Facebook },
    { label: 'GitHub', href: '#', icon: Github },
];

export default function ContactV4() {
    const sectionRef = useRef<HTMLElement>(null);

    useEffect(() => {
        const section = sectionRef.current;
        if (!section) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('contact-v4__visible');
                        entry.target.classList.remove('contact-v4__hidden');
                        observer.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.12, rootMargin: '0px 0px -40px 0px' },
        );

        section.querySelectorAll('.contact-v4__reveal').forEach((element) => observer.observe(element));
        return () => observer.disconnect();
    }, []);

    return (
        <section ref={sectionRef} className="contact-v4">
            <div className="contact-v4__shell contact-v4__reveal contact-v4__hidden">
                <div className="contact-v4__content">
                    <div className="contact-v4__info">
                        <div>
                            <a href="https://github.com/Deal-Tech/dealtech-ui-for-public-component/tree/main/sections/Contact/ContactV4" target="_blank" rel="noreferrer" className="contact-v4__eyebrow">Contact/ContactV4</a>
                            <h2>Mari Terhubung</h2>
                            <p>Ceritakan kebutuhan proyekmu. Tim kami siap membantu menemukan solusi yang tepat.</p>
                        </div>

                        <div className="contact-v4__details">
                            <div className="contact-v4__detail">
                                <span className="contact-v4__icon">
                                    <MapPin size={19} strokeWidth={2} aria-hidden="true" />
                                </span>
                                <div>
                                    <h3>Lokasi</h3>
                                    <p>Deal Tech, Indonesia</p>
                                </div>
                            </div>

                            <div className="contact-v4__detail">
                                <span className="contact-v4__icon">
                                    <Mail size={19} strokeWidth={2} aria-hidden="true" />
                                </span>
                                <div>
                                    <h3>Email</h3>
                                    <a href="mailto:hello@dealtech.com">hello@dealtech.com</a>
                                </div>
                            </div>

                            <div className="contact-v4__detail">
                                <span className="contact-v4__icon">
                                    <Phone size={19} strokeWidth={2} aria-hidden="true" />
                                </span>
                                <div>
                                    <h3>Telepon</h3>
                                    <a href="tel:+6281234567890">+62 812 3456 7890</a>
                                </div>
                            </div>
                        </div>

                        <div className="contact-v4__socials">
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

                    <form className="contact-v4__form" onSubmit={(event) => event.preventDefault()}>
                        <div className="contact-v4__field-row">
                            <label className="contact-v4__field">
                                <span>Nama</span>
                                <input type="text" name="name" placeholder="Nama lengkap" autoComplete="name" />
                            </label>
                            <label className="contact-v4__field">
                                <span>Perusahaan</span>
                                <input type="text" name="company" placeholder="Nama perusahaan" autoComplete="organization" />
                            </label>
                        </div>

                        <div className="contact-v4__field-row">
                            <label className="contact-v4__field">
                                <span>Telepon</span>
                                <input type="tel" name="phone" placeholder="+62 812 3456 7890" autoComplete="tel" />
                            </label>
                            <label className="contact-v4__field">
                                <span>Email</span>
                                <input type="email" name="email" placeholder="nama@perusahaan.com" autoComplete="email" />
                            </label>
                        </div>

                        <label className="contact-v4__field">
                            <span>Topik</span>
                            <input type="text" name="subject" placeholder="Apa yang ingin didiskusikan?" />
                        </label>

                        <label className="contact-v4__field">
                            <span>Pesan</span>
                            <textarea name="message" placeholder="Tulis pesanmu..." rows={5} />
                        </label>

                        <button className="contact-v4__submit" type="submit">
                            Kirim Pesan
                            <Send size={17} strokeWidth={2.2} aria-hidden="true" />
                        </button>
                    </form>
                </div>

                <div className="contact-v4__map">
                    <iframe
                        src={mapEmbedUrl}
                        title="Lokasi Deal Tech"
                        loading="lazy"
                        allowFullScreen
                        referrerPolicy="no-referrer-when-downgrade"
                    />
                    <a href={mapUrl} target="_blank" rel="noreferrer">
                        Buka di Google Maps
                        <ExternalLink size={16} strokeWidth={2.2} aria-hidden="true" />
                    </a>
                </div>
            </div>
        </section>
    );
}
