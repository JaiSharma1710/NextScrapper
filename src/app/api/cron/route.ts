import Product from '@/lib/modals/product.modal';
import { connectToDb } from '@/lib/mongoose';
import { generateEmailBody, sendEmail } from '@/lib/nodemailer';
import { scrapeAmazonProduct } from '@/lib/scraper';
import {
  getAveragePrice,
  getEmailNotificationType,
  getHighestPrice,
  getLowestPrice,
} from '@/lib/utils';
import { NextResponse } from 'next/server';

export const maxDuration = 5;
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    connectToDb();

    const products = await Product.find({});

    if (!products) {
      throw new Error('no products found');
    }

    //1. scrape latest product details and update the db

    const updateProductData = await Promise.all(
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
        const emailNotificationType = getEmailNotificationType(
          scrapedProduct,
          currentProduct,
        );

        if (emailNotificationType && updatedProduct.users.length > 0) {
          const productInfo = {
            title: updatedProduct.title,
            url: updatedProduct.url,
          };
          // Construct emailContent
          const emailContent = await generateEmailBody(
            productInfo,
            emailNotificationType,
          );
          // Get array of user emails
          const userEmails = updatedProduct.users.map(
            (user: any) => user.email,
          );
          // Send email notification
          await sendEmail(emailContent, userEmails);
        }

        return updatedProduct;
      }),
    );

    return NextResponse.json({
      message: 'Ok',
      data: updateProductData,
    });
  } catch (error) {
    throw new Error('failed to load product' + ':' + error);
  }
}
