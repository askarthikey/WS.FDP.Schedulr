import React from 'react'

function Footer() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
    <div className="flex flex-col items-center justify-center">
      <p className="text-gray-600 text-sm">
        &copy; {new Date().getFullYear()} Schedulr - Workshop Management System
      </p>
      <p className="text-gray-500 text-xs mt-2">
        A modern solution for academic and professional workshop management
      </p>
    </div>
  </div>
  )
}

export default Footer
