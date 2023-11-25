import Product from '@/lib/modals/product.modal';
import { connectToDb } from '@/lib/mongoose';
import { scrapeAmazonProduct } from '@/lib/scraper';
import {
  getAveragePrice,
  getEmailNotifType,
  getHighestPrice,
  getLowestPrice,
} from '@/lib/utils';

export async function GET() {
  try {
    connectToDb();

    const products = await Product.find({});

    if (!products) {
      throw new Error('no products found');
    }

    //1. scrape latest product details and update the db

    const updateProductData = Promise.all(
      products.map(async (currentProduct) => {
        const scrapedProduct = await scrapeAmazonProduct(currentProduct.url);

        if (!scrapedProduct) {
          throw new Error(`no product found ${currentProduct.title}`);
        }

        const updatedPriceHistory = [
          ...currentProduct.priceHistory,
          {
            price: scrapedProduct.currentPrice,
          },
        ];

        const product = {
          ...scrapedProduct,
          priceHistory: updatedPriceHistory,
          lowestPrice: getLowestPrice(updatedPriceHistory),
          highestPrice: getHighestPrice(updatedPriceHistory),
          averagePrice: getAveragePrice(updatedPriceHistory),
        };

        const updatedProduct = await Product.findOneAndUpdate(
          {
            url: product.url,
          },
          product,
        );

        //2 check each products status and send email accordingly
        const emailNotificationType = getEmailNotifType(
          scrapedProduct,
          currentProduct,
        );
      }),
    );
  } catch (error) {
    throw new Error('failed to load product' + ':' + error);
  }
}
