import ButtonV1, { ButtonV1Group } from './ButtonV1';

export default function Preview() {
    return (
        <ButtonV1Group>
            <ButtonV1 href="#fitur">Jelajahi Komponen</ButtonV1>
            <ButtonV1 variant="outline" href="#fitur">
                Lihat Dokumentasi
            </ButtonV1>
        </ButtonV1Group>
    );
}
