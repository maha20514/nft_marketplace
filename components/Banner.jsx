const Banner = ({ parentStyless, childStyless, name }) => (
  <div className={`relative w-full flex items-center z-0 overflow-hidden nft-gradient
  ${parentStyless}`}
  >
    <p className={`font-bold text-white text-5xl font-poppins leading-70 ${childStyless}`}>
      {name}
    </p>
    <div className="absolute w-48 h-48 sm:w-32 sm:h-32 rounded-full white-bg -top-9 -left-16 -z-5" />
    <div className="absolute w-72 h-72 sm:w-65 sm:h-65 rounded-full white-bg -bottom-24 -right-14 -z-5" />

  </div>
);

export default Banner;
