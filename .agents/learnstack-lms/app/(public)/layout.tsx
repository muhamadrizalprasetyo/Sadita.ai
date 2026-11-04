import { ReactNode } from "react";
import Header from "./_components/header";
import Footer from "./_components/footer";

function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Header />
      <main className="container mx-auto mb-32 px-4 md:px-6 lg:px-8">
        {children}
      </main>
      <Footer />
    </>
  );
}

export default PublicLayout;
