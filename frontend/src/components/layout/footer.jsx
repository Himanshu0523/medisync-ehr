import { Link } from 'react-router-dom';
import { 
  FaFacebookF, 
  FaTwitter, 
  FaLinkedinIn, 
  FaInstagram, 
  FaMapMarkerAlt, 
  FaPhoneAlt, 
  FaEnvelope, 
  FaClock 
} from 'react-icons/fa';

const Footer = () => {
  return (
    <footer className="bg-slate-950 text-slate-400 pt-16 pb-8 text-sm font-sans border-t border-slate-900">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-10">
        
        {/* Logo and About Section */}
        <div className="space-y-6">
          <Link to="/" className="flex items-center space-x-3">
            <div className="relative w-8 h-8 flex items-center justify-center">
              <div className="absolute w-2 h-8 bg-blue-600 rounded-sm"></div>
              <div className="absolute w-8 h-2 bg-blue-600 rounded-sm"></div>
              <div className="absolute w-4 h-4 bg-emerald-500 rotate-45 opacity-70"></div>
            </div>
            <div>
              <div className="flex items-center leading-none">
                <span className="text-white text-xl font-bold tracking-wide">medi</span>
                <span className="text-blue-500 text-xl font-bold tracking-wide">Sync</span>
              </div>
              <span className="text-slate-400 text-[9px] tracking-[0.15em] uppercase block font-semibold mt-1">
                Healthcare Center
              </span>
            </div>
          </Link>
          <p className="leading-relaxed text-slate-400 text-xs sm:text-sm">
            Comprehensive healthcare services with compassionate, patient-centered clinical care and real-time electronic health sync.
          </p>
          {/* Social Icons */}
          <div className="flex space-x-3 pt-2">
            {[
              { icon: <FaFacebookF />, href: "#" },
              { icon: <FaTwitter />, href: "#" },
              { icon: <FaLinkedinIn />, href: "#" },
              { icon: <FaInstagram />, href: "#" }
            ].map((social, index) => (
              <a
                key={index}
                href={social.href}
                className="w-9 h-9 border border-slate-800 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:border-slate-600 transition-colors duration-300"
              >
                {social.icon}
              </a>
            ))}
          </div>
        </div>

        {/* Quick Links Section */}
        <div>
          <h4 className="text-white text-base font-semibold tracking-wider uppercase mb-6">Quick Links</h4>
          <ul className="space-y-3">
            {[
              { name: 'Home', path: '/' },
              { name: 'Services', path: '/services' },
              { name: 'Doctors', path: '/doctors' },
              { name: 'About', path: '/about' },
              { name: 'Contact', path: '/contact' },
              { name: 'Book Appointment', path: '/doctors' },
            ].map((item) => (
              <li key={item.name}>
                <Link to={item.path} className="hover:text-white transition-colors duration-200 block text-xs sm:text-sm">
                  {item.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Our Services Section */}
        <div>
          <h4 className="text-white text-base font-semibold tracking-wider uppercase mb-6">Our Services</h4>
          <ul className="space-y-3">
            {['Primary Care', 'Cardiology', 'Pediatrics', 'Orthopedics', 'Dermatology', 'Neurology'].map((service) => (
              <li key={service}>
                <Link to={`/services`} className="hover:text-white transition-colors duration-200 block text-xs sm:text-sm">
                  {service}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact Us Section */}
        <div>
          <h4 className="text-white text-base font-semibold tracking-wider uppercase mb-6">Contact Us</h4>
          <ul className="space-y-4 text-xs sm:text-sm">
            <li className="flex items-start space-x-3.5">
              <FaMapMarkerAlt className="text-blue-500 mt-1 shrink-0" />
              <span className="leading-relaxed">
                742 Evergreen Healthcare Blvd<br />San Francisco, CA 94102
              </span>
            </li>
            <li className="flex items-center space-x-3.5">
              <FaPhoneAlt className="text-blue-500 shrink-0" />
              <a href="tel:5551234567" className="hover:text-white transition-colors">
                (555) 123-4567
              </a>
            </li>
            <li className="flex items-center space-x-3.5">
              <FaEnvelope className="text-blue-500 shrink-0" />
              <a href="mailto:care@medisync.com" className="hover:text-white transition-colors duration-200">
                care@medisync.com
              </a>
            </li>
            <li className="flex items-start space-x-3.5">
              <FaClock className="text-blue-500 mt-1 shrink-0" />
              <div className="leading-relaxed">
                <p>Mon - Fri: 7:00 AM - 9:00 PM</p>
                <p>Sat - Sun: 8:00 AM - 6:00 PM</p>
                <p className="text-red-400 font-bold">24/7 Emergency Care</p>
              </div>
            </li>
          </ul>
        </div>

      </div>

      {/* Bottom Footer bar */}
      <div className="max-w-7xl mx-auto px-6 mt-16 pt-8 border-t border-slate-900 flex flex-col sm:flex-row justify-between items-center text-xs text-slate-500">
        <p>&copy; 2026 mediSync. All rights reserved.</p>
        <div className="flex space-x-6 mt-4 sm:mt-0">
          <Link to="/about" className="hover:text-white transition-colors duration-200">Privacy Policy</Link>
          <Link to="/about" className="hover:text-white transition-colors duration-200">Terms of Service</Link>
          <Link to="/about" className="hover:text-white transition-colors duration-200">HIPAA Notice</Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
