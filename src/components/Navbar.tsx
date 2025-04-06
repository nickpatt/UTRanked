import React from 'react';
import { Link } from 'react-router-dom';
import { Car, User, LogOut } from 'lucide-react';
import { supabase } from '../lib/supabase';

function Navbar() {
  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <nav className="bg-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center space-x-2">
            <Car className="h-8 w-8 text-blue-600" />
            <span className="text-xl font-bold text-gray-900">CampusRides</span>
          </Link>
          
          <div className="flex items-center space-x-4">
            <Link to="/rides" className="text-gray-700 hover:text-blue-600">Find Rides</Link>
            <Link to="/create-ride" className="text-gray-700 hover:text-blue-600">Offer Ride</Link>
            <Link to="/profile" className="text-gray-700 hover:text-blue-600">
              <User className="h-6 w-6" />
            </Link>
            <button
              onClick={handleSignOut}
              className="text-gray-700 hover:text-blue-600"
            >
              <LogOut className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar