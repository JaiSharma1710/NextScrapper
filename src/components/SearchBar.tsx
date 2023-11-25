'use client';
import { scrapeAndStoreProduct } from '@/lib/actions';
import { FormEvent, useState } from 'react';
import { toast } from 'react-hot-toast';

const SearchBar = () => {
  const [searchPrompt, setSearchPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const isAmazonLinkValid = (link: string) => {
    try {
      const parsedUrl = new URL(link);
      const hostName = parsedUrl.hostname;
      if (hostName.includes('amazon')) {
        return true;
      }
      return false;
    } catch (err: any) {
      console.log(err);
      return false;
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const isValidAmazonLink = isAmazonLinkValid(searchPrompt);
    if (!isValidAmazonLink) {
      toast.error('Not a valid amazon link');
    }

    try {
      setIsLoading(true);
      const isScrapSuccessful = await scrapeAndStoreProduct(searchPrompt);
      if (isScrapSuccessful) {
        toast.success('scrap successful');
        setSearchPrompt('');
      } else {
        toast.error('scrap successful');
      }
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form className="flex flex-wrap gap-4 mt-12" onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Enter product link"
        className="searchbar-input"
        value={searchPrompt}
        onChange={(e) => setSearchPrompt(e.target.value)}
      />
      <button
        disabled={isLoading || searchPrompt === ''}
        type="submit"
        className="searchbar-btn"
      >
        {isLoading ? 'loading....' : 'search'}
      </button>
    </form>
  );
};

export default SearchBar;
