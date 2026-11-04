import './simple-footer-v1.css';

export interface SimpleFooterV1Props {
    year?: number;
    brand?: string;
    brandHref?: string;
    description?: string;
    rightsText?: string;
}

export default function SimpleFooterV1({
    year = new Date().getFullYear(),
    brand = 'Dealtech UI',
    brandHref,
    description = 'For Public Components',
    rightsText = 'All Rights Reserved',
}: SimpleFooterV1Props) {
    const brandName = brandHref ? <a href={brandHref}>{brand}</a> : brand;

    return (
        <footer className="simple-footer-v1">
            <p>
                Copyright &copy; {year} {brandName} &ndash; {description} &ndash; {rightsText}
            </p>
        </footer>
    );
}
