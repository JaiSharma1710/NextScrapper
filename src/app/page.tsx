import Image from 'next/image';

import SearchBar from '@/components/SearchBar';
import HeroCarousal from '@/components/HeroCarousal';

const Home = () => {
  return (
    <>
      <section className="px-6 md:px-20 py-24">
        <div className="flex max-xl:flex-col gap-16">
          <div className="flex flex-col justify-center">
            <p className="small-text">
              Smart Shopping Starts Here
              <Image
                alt="arrow-right"
                src="/assets/icons/arrow-right.svg"
                width={16}
                height={16}
              />
            </p>
            <h1 className="head-text">
              Unlaesh the power of{' '}
              <span className="text-primary">NextScrapper</span>
            </h1>
            <p className="mt-6">
              Powerful, self-serve product and growth analytics to help you
              convert, engage, and retain more.
            </p>
            <SearchBar />
          </div>
          <HeroCarousal />
        </div>
      </section>

      <section className="trending-section">
        <h2 className="section-text">Trending</h2>
        <div className="flex flex-wrap gap-x-8 gap-y-16">
          {['Apple iphone', 'Book', 'Boots'].map((product, index) => (
            <div key={index}>{product}</div>
          ))}
        </div>
      </section>
    </>
  );
};

export default Home;
