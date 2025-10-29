import NavBar from "../components/layout/NavBar";
import Footer from "../components/layout/Footer";
import { Link } from "react-router-dom";

export default function Landing(){
  return (
    <div className="bg-white">
      <NavBar />

      {/* Hero */}
 <section className="relative isolate min-h-[650px] flex items-center">
  {/* Background Image */}
  <div className="absolute inset-0 -z-10 overflow-hidden">
    <img
      src="https://images.unsplash.com/photo-1507146426996-ef05306b995a?auto=format&fit=crop&w=2000&q=80"
      alt="Pet adoption hero"
      className="w-full h-full object-cover opacity-95"
    />
    {/* Gradient overlays */}
    <div className="absolute inset-0 bg-gradient-to-r from-[rgba(0,0,0,0.75)] via-[rgba(0,0,0,0.45)] to-transparent"></div>
    <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-transparent"></div>
  </div>

  {/* Content */}
  <div className="max-w-7xl mx-auto w-full px-6 lg:px-10 py-28">
    <div className="max-w-xl">
      <div className="inline-flex items-center bg-white/20 text-white font-medium px-4 py-1.5 rounded-full text-sm mb-6 ring-1 ring-white/30">
        Adopt. Foster. Love.
      </div>

      <h1 className="text-5xl lg:text-6xl font-extrabold leading-tight text-white drop-shadow-xl">
        Find Your Perfect Pet and<br/>Change a Life
      </h1>

      <p className="mt-6 text-lg font-medium text-white/90 max-w-md">
        Trusted, transparent, and humane — built with shelters and responsible
        owners to give pets safe, loving homes.
      </p>

      <div className="mt-10 flex gap-4">
        <Link to="/browse" className="pc-btn pc-btn-primary text-lg">Browse Pets</Link>
        <Link to="/login" className="pc-btn pc-btn-outline text-lg text-white">Login / Sign Up</Link>
      </div>
    </div>
  </div>
</section>

<div className="h-16"></div>

      {/* Value props */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid gap-6 md:grid-cols-3">
          <ValueCard title="Shelter-Grade Safety" text="ID-verified organizations, vaccination tracking, and pre-adoption checks." />
          <ValueCard title="Clear Communication" text="Built-in chat, meeting scheduling, and documented agreements." />
          <ValueCard title="Responsible Foster" text="Set return dates, monitor well-being, and update health notes." />
        </div>
      </section>

      <Footer />
    </div>
  );
}

function ValueCard({title, text}:{title:string; text:string}){
  return (
    <div className="pc-card p-6">
      <h3 className="text-lg font-semibold" style={{color:'var(--pc-deep)'}}>{title}</h3>
      <p className="mt-2 text-sm text-gray-600">{text}</p>
    </div>
  );
}
