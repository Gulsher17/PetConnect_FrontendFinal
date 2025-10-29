export default function Footer() {
  return (
    <footer className="bg-[var(--pc-deep)] text-white mt-24">
      <div className="max-w-7xl mx-auto px-6 py-16 grid gap-10 md:grid-cols-3">
        
        {/* Brand Mission */}
        <div className="space-y-3">
          <h4 className="text-lg font-semibold">PetConnect</h4>
          <p className="text-sm text-gray-200 leading-relaxed">
            Our mission is to connect pets with safe, loving homes through trusted shelters and responsible owners.
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h5 className="text-md font-semibold mb-3">Explore</h5>
          <ul className="space-y-2 text-sm">
            <li><a className="hover:underline" href="#">Adoption Guidelines</a></li>
            <li><a className="hover:underline" href="#">Foster Handbook</a></li>
            <li><a className="hover:underline" href="#">Health & Vaccination</a></li>
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h5 className="text-md font-semibold mb-3">Contact</h5>
          <p className="text-sm text-gray-200">hello@petconnect.example</p>
          <p className="text-sm text-gray-200">Mon–Fri: 9:00–17:00</p>
        </div>
      </div>

      <div className="pc-divider opacity-30"></div>

      <div className="text-center text-sm text-gray-400 py-5">
        © {new Date().getFullYear()} PetConnect · All rights reserved
      </div>
    </footer>
  );
}
