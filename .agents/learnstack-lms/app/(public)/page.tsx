import Hero from "./_sections/hero";
import Features from "./_sections/features";
import LatestCourses from "./_sections/latest-courses";
import PopularCategories from "./_sections/popular-categories";
import Testimonials from "./_sections/testimonials";
import FAQ from "./_sections/faq";
async function HomePage() {
  return (
    <div>
      <Hero />
      <Features />
      <LatestCourses />
      <PopularCategories />
      <Testimonials />
      <FAQ />
    </div>
  );
}

export default HomePage;

// Structure
/**
 * ************* Public Route ***********************
 * <public>
 *   <header></header> => client //--header fetches auth data on client side
 *   <main> => server
 *      <section></section> => client
 *   </main>
 *   <Footer></Footer> => client
 * </public>
 *
 * ************* Admin Route **************************
 *
 * <admin>
 *   <sidebarprovider>
 *     <sidebar></sidebar>
 *     <sidebarinset>
 *        {children}
 *     </sidebarinset>
 *   </sidebarprovider>
 * </admin>
 */
