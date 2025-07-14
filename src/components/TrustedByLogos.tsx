import Image from 'next/image';

const TrustedByLogos = () => {
  return (
    <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
      {/* Airbnb Logo */}
      <div className="opacity-70 hover:opacity-100 transition-all duration-300 hover:scale-150">
        <Image
          src="/public/airbnb-logo.png" // Replace with the actual path to your Airbnb logo
          alt="Airbnb Logo"
          width={100}
          height={100}
        />
      </div>

      {/* Booking.com Logo */}
      <div className="opacity-70 hover:opacity-100 transition-all duration-300 hover:scale-105">
        <Image
          src="/public/booking-logo.png" // Replace with the actual path to your Booking.com logo
          alt="Booking.com Logo"
          width={100}
          height={100}
        />
      </div>
    </div>
  );
};

export default TrustedByLogos;
