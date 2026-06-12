import { Header } from "./lib/components/Header";
import { Hero } from "./lib/components/Hero";
import { TrustedBy } from "./lib/components/TrustedBy";
import { Testimonial } from "./lib/components/Testimonial";
import { GetUpdates } from "./lib/components/GetUpdates";
import { Footer } from "./lib/components/Footer";

export default function HomePage() {
  return (
    <div className="flex min-h-full flex-col">
      <Header />
      <main className="flex-1">
        <Hero />
        <TrustedBy />
        <Testimonial />
        <GetUpdates />
      </main>
      <Footer />
    </div>
  );
}
