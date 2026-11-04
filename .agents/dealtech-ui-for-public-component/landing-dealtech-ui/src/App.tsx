import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import SimpleFooterV1 from '../../elements/Footer/SimpleFooterV1/SimpleFooterV1';
import SimpleHeaderV1 from '../../elements/Header/SimpleHeaderV1/SimpleHeaderV1';
import AboutV1 from '../../sections/About/AboutV1/AboutV1';
import AboutV2 from '../../sections/About/AboutV2/AboutV2';
import AboutV3 from '../../sections/About/AboutV3/AboutV3';
import AboutV4 from '../../sections/About/AboutV4/AboutV4';
import AboutV5 from '../../sections/About/AboutV5/AboutV5';
import AboutV6 from '../../sections/About/AboutV6/AboutV6';
import SectionCompareV1 from '../../sections/Compare/SectionCompareV1/SectionCompareV1';
import SectionCompareV2 from '../../sections/Compare/SectionCompareV2/SectionCompareV2';
import SectionCompareV3 from '../../sections/Compare/SectionCompareV3/SectionCompareV3';
import ContactV1 from '../../sections/Contact/ContactV1/ContactV1';
import ContactV2 from '../../sections/Contact/ContactV2/ContactV2';
import ContactV3 from '../../sections/Contact/ContactV3/ContactV3';
import ContactV4 from '../../sections/Contact/ContactV4/ContactV4';
import ContactV5 from '../../sections/Contact/ContactV5/ContactV5';
import CTAV1 from '../../sections/CTA/CTAV1/CTAV1';
import CTAV2 from '../../sections/CTA/CTAV2/CTAV2';
import CTAV3 from '../../sections/CTA/CTAV3/CTAV3';
import CTAV4 from '../../sections/CTA/CTAV4/CTAV4';
import CTAV5 from '../../sections/CTA/CTAV5/CTAV5';
import CTAV6 from '../../sections/CTA/CTAV6/CTAV6';
import CardListV1 from '../../sections/Features/CardListV1/CardListV1';
import CardListV2 from '../../sections/Features/CardListV2/CardListV2';
import CardListV3 from '../../sections/Features/CardListV3/CardListV3';
import CardListV4 from '../../sections/Features/CardListV4/CardListV4';
import FAQV1 from '../../sections/FAQ/FAQV1/FAQV1';
import FAQV2 from '../../sections/FAQ/FAQV2/FAQV2';
import FAQV3 from '../../sections/FAQ/FAQV3/FAQV3';
import FAQV4 from '../../sections/FAQ/FAQV4/FAQV4';
import FAQV5 from '../../sections/FAQ/FAQV5/FAQV5';
import SectionV1 from '../../sections/Hero/SectionV1/SectionV1';
import SectionV2 from '../../sections/Hero/SectionV2/SectionV2';
import SectionV3 from '../../sections/Hero/SectionV3/SectionV3';
import SectionV4 from '../../sections/Hero/SectionV4/SectionV4';
import SectionV5 from '../../sections/Hero/SectionV5/SectionV5';
import SectionV6 from '../../sections/Hero/SectionV6/SectionV6';
import SectionV7 from '../../sections/Hero/SectionV7/SectionV7';
import SectionV8 from '../../sections/Hero/SectionV8/SectionV8';
import SectionV9 from '../../sections/Hero/SectionV9/SectionV9';
import SectionV10 from '../../sections/Hero/SectionV10/SectionV10';
import SectionV11 from '../../sections/Hero/SectionV11/SectionV11';
import SectionV12 from '../../sections/Hero/SectionV12/SectionV12';
import SectionV13 from '../../sections/Hero/SectionV13/SectionV13';
import ReviewV1 from '../../sections/Testimonial/ReviewV1/ReviewV1';
import ReviewV2 from '../../sections/Testimonial/ReviewV2/ReviewV2';
import ReviewV3 from '../../sections/Testimonial/ReviewV3/ReviewV3';
import ReviewV4 from '../../sections/Testimonial/ReviewV4/ReviewV4';
import ReviewV5 from '../../sections/Testimonial/ReviewV5/ReviewV5';
import ReviewV6 from '../../sections/Testimonial/ReviewV6/ReviewV6';
import ReviewV7 from '../../sections/Testimonial/ReviewV7/ReviewV7';
import PricelistV1 from '../../sections/PriceList/PricelistV1/PricelistV1';
import PricelistV2 from '../../sections/PriceList/PricelistV2/PricelistV2';
import PricelistV3 from '../../sections/PriceList/PricelistV3/PricelistV3';
import PricelistV4 from '../../sections/PriceList/PricelistV4/PricelistV4';
import PricelistV5 from '../../sections/PriceList/PricelistV5/PricelistV5';
import ServiceV1 from '../../sections/Service/ServiceV1/ServiceV1';
import ServiceV2 from '../../sections/Service/ServiceV2/ServiceV2';
import ServiceV3 from '../../sections/Service/ServiceV3/ServiceV3';

const heroSections = [
    SectionV1,
    SectionV2,
    SectionV3,
    SectionV4,
    SectionV5,
    SectionV6,
    SectionV7,
    SectionV8,
    SectionV9,
    SectionV10,
    SectionV11,
    SectionV12,
    SectionV13,
];
const featureSections = [CardListV1, CardListV2, CardListV3, CardListV4];
const aboutSections = [AboutV1, AboutV2, AboutV3, AboutV4, AboutV5, AboutV6];
const compareSections = [SectionCompareV1, SectionCompareV2, SectionCompareV3];
const reviewSections = [ReviewV1, ReviewV2, ReviewV3, ReviewV4, ReviewV5, ReviewV6, ReviewV7];
const pricelistSections = [PricelistV1, PricelistV2, PricelistV3, PricelistV4, PricelistV5];
const serviceSections = [ServiceV1, ServiceV2, ServiceV3];
const ctaSections = [CTAV1, CTAV2, CTAV3, CTAV4, CTAV5, CTAV6];
const faqSections = [FAQV1, FAQV2, FAQV3, FAQV4, FAQV5];
const contactSections = [ContactV1, ContactV2, ContactV3, ContactV4, ContactV5];

export default function App() {
    const [heroIndex, setHeroIndex] = useState(0);
    const [featureIndex, setFeatureIndex] = useState(0);
    const [aboutIndex, setAboutIndex] = useState(0);
    const [compareIndex, setCompareIndex] = useState(0);
    const [reviewIndex, setReviewIndex] = useState(0);
    const [pricelistIndex, setPricelistIndex] = useState(0);
    const [serviceIndex, setServiceIndex] = useState(0);
    const [ctaIndex, setCtaIndex] = useState(0);
    const [faqIndex, setFaqIndex] = useState(0);
    const [contactIndex, setContactIndex] = useState(0);
    const ActiveHero = heroSections[heroIndex];
    const ActiveFeature = featureSections[featureIndex];
    const ActiveAbout = aboutSections[aboutIndex];
    const ActiveCompare = compareSections[compareIndex];
    const ActiveReview = reviewSections[reviewIndex];
    const ActivePricelist = pricelistSections[pricelistIndex];
    const ActiveService = serviceSections[serviceIndex];
    const ActiveCTA = ctaSections[ctaIndex];
    const ActiveFAQ = faqSections[faqIndex];
    const ActiveContact = contactSections[contactIndex];

    const showPreviousHero = () => {
        setHeroIndex((current) => (current - 1 + heroSections.length) % heroSections.length);
    };

    const showNextHero = () => {
        setHeroIndex((current) => (current + 1) % heroSections.length);
    };

    const showPreviousFeature = () => {
        setFeatureIndex((current) => (current - 1 + featureSections.length) % featureSections.length);
    };

    const showNextFeature = () => {
        setFeatureIndex((current) => (current + 1) % featureSections.length);
    };

    const showPreviousAbout = () => {
        setAboutIndex((current) => (current - 1 + aboutSections.length) % aboutSections.length);
    };

    const showNextAbout = () => {
        setAboutIndex((current) => (current + 1) % aboutSections.length);
    };

    const showPreviousService = () => {
        setServiceIndex((current) => (current - 1 + serviceSections.length) % serviceSections.length);
    };

    const showNextService = () => {
        setServiceIndex((current) => (current + 1) % serviceSections.length);
    };

    const showPreviousCompare = () => {
        setCompareIndex((current) => (current - 1 + compareSections.length) % compareSections.length);
    };

    const showNextCompare = () => {
        setCompareIndex((current) => (current + 1) % compareSections.length);
    };

    const showPreviousReview = () => {
        setReviewIndex((current) => (current - 1 + reviewSections.length) % reviewSections.length);
    };

    const showNextReview = () => {
        setReviewIndex((current) => (current + 1) % reviewSections.length);
    };

    const showPreviousPricelist = () => {
        setPricelistIndex((current) => (current - 1 + pricelistSections.length) % pricelistSections.length);
    };

    const showNextPricelist = () => {
        setPricelistIndex((current) => (current + 1) % pricelistSections.length);
    };

    const showPreviousCTA = () => {
        setCtaIndex((current) => (current - 1 + ctaSections.length) % ctaSections.length);
    };

    const showNextCTA = () => {
        setCtaIndex((current) => (current + 1) % ctaSections.length);
    };

    const showPreviousFAQ = () => {
        setFaqIndex((current) => (current - 1 + faqSections.length) % faqSections.length);
    };

    const showNextFAQ = () => {
        setFaqIndex((current) => (current + 1) % faqSections.length);
    };

    const showPreviousContact = () => {
        setContactIndex((current) => (current - 1 + contactSections.length) % contactSections.length);
    };

    const showNextContact = () => {
        setContactIndex((current) => (current + 1) % contactSections.length);
    };

    return (
        <div className="dealtech-landing">
            <SimpleHeaderV1 />
            <main>
                <div className="dealtech-hero-slider">
                    <ActiveHero key={heroIndex} />
                    <button
                        className="dealtech-hero-slider__arrow dealtech-hero-slider__arrow--left"
                        type="button"
                        aria-label="Hero sebelumnya"
                        onClick={showPreviousHero}
                    >
                        <ChevronLeft size={22} />
                    </button>
                    <button
                        className="dealtech-hero-slider__arrow dealtech-hero-slider__arrow--right"
                        type="button"
                        aria-label="Hero berikutnya"
                        onClick={showNextHero}
                    >
                        <ChevronRight size={22} />
                    </button>
                </div>
                <div id="fitur">
                    <div className="dealtech-feature-slider">
                        <ActiveFeature key={featureIndex} />
                        <button
                            className="dealtech-feature-slider__arrow dealtech-feature-slider__arrow--left"
                            type="button"
                            aria-label="Features sebelumnya"
                            onClick={showPreviousFeature}
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <button
                            className="dealtech-feature-slider__arrow dealtech-feature-slider__arrow--right"
                            type="button"
                            aria-label="Features berikutnya"
                            onClick={showNextFeature}
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>
                </div>
                <div id="tentang">
                    <div className="dealtech-about-slider">
                        <ActiveAbout key={aboutIndex} />
                        <button
                            className="dealtech-about-slider__arrow dealtech-about-slider__arrow--left"
                            type="button"
                            aria-label="About sebelumnya"
                            onClick={showPreviousAbout}
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <button
                            className="dealtech-about-slider__arrow dealtech-about-slider__arrow--right"
                            type="button"
                            aria-label="About berikutnya"
                            onClick={showNextAbout}
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>
                </div>
                <div id="layanan">
                    <div className="dealtech-service-slider">
                        <ActiveService key={serviceIndex} />
                        <button
                            className="dealtech-service-slider__arrow dealtech-service-slider__arrow--left"
                            type="button"
                            aria-label="Service sebelumnya"
                            onClick={showPreviousService}
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <button
                            className="dealtech-service-slider__arrow dealtech-service-slider__arrow--right"
                            type="button"
                            aria-label="Service berikutnya"
                            onClick={showNextService}
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>
                </div>
                <div id="perbandingan">
                    <div className="dealtech-compare-slider">
                        <ActiveCompare key={compareIndex} />
                        <button
                            className="dealtech-compare-slider__arrow dealtech-compare-slider__arrow--left"
                            type="button"
                            aria-label="Compare sebelumnya"
                            onClick={showPreviousCompare}
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <button
                            className="dealtech-compare-slider__arrow dealtech-compare-slider__arrow--right"
                            type="button"
                            aria-label="Compare berikutnya"
                            onClick={showNextCompare}
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>
                </div>
                <div id="testimoni">
                    <div className="dealtech-review-slider">
                        <ActiveReview key={reviewIndex} />
                        <button
                            className="dealtech-review-slider__arrow dealtech-review-slider__arrow--left"
                            type="button"
                            aria-label="Review sebelumnya"
                            onClick={showPreviousReview}
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <button
                            className="dealtech-review-slider__arrow dealtech-review-slider__arrow--right"
                            type="button"
                            aria-label="Review berikutnya"
                            onClick={showNextReview}
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>
                </div>
                <div className="dealtech-pricelist-slider">
                    <ActivePricelist key={pricelistIndex} />
                    <button
                        className="dealtech-pricelist-slider__arrow dealtech-pricelist-slider__arrow--left"
                        type="button"
                        aria-label="Pricelist sebelumnya"
                        onClick={showPreviousPricelist}
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <button
                        className="dealtech-pricelist-slider__arrow dealtech-pricelist-slider__arrow--right"
                        type="button"
                        aria-label="Pricelist berikutnya"
                        onClick={showNextPricelist}
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>
                <div className="dealtech-cta-slider">
                    <ActiveCTA key={ctaIndex} />
                    <button
                        className="dealtech-cta-slider__arrow dealtech-cta-slider__arrow--left"
                        type="button"
                        aria-label="CTA sebelumnya"
                        onClick={showPreviousCTA}
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <button
                        className="dealtech-cta-slider__arrow dealtech-cta-slider__arrow--right"
                        type="button"
                        aria-label="CTA berikutnya"
                        onClick={showNextCTA}
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>
                <div className="dealtech-faq-slider">
                    <ActiveFAQ key={faqIndex} />
                    <button
                        className="dealtech-faq-slider__arrow dealtech-faq-slider__arrow--left"
                        type="button"
                        aria-label="FAQ sebelumnya"
                        onClick={showPreviousFAQ}
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <button
                        className="dealtech-faq-slider__arrow dealtech-faq-slider__arrow--right"
                        type="button"
                        aria-label="FAQ berikutnya"
                        onClick={showNextFAQ}
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>
            </main>
            <div id="kontak">
                <div className="dealtech-contact-slider">
                    <ActiveContact key={contactIndex} />
                    <button
                        className="dealtech-contact-slider__arrow dealtech-contact-slider__arrow--left"
                        type="button"
                        aria-label="Contact sebelumnya"
                        onClick={showPreviousContact}
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <button
                        className="dealtech-contact-slider__arrow dealtech-contact-slider__arrow--right"
                        type="button"
                        aria-label="Contact berikutnya"
                        onClick={showNextContact}
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>
                <SimpleFooterV1 brand="Dealtech UI" description="For Public Components" />
            </div>
        </div>
    );
}
