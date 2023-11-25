'use server';

import { revalidatePath } from 'next/cache';
import Product from '../modals/product.modal';
import { connectToDb } from '../mongoose';
import { scrapeAmazonProduct } from '../scraper';
import { getAveragePrice, getHighestPrice, getLowestPrice } from '../utils';
import { User } from '@/types';
import { generateEmailBody, sendEmail } from '../nodemailer';

export async function scrapeAndStoreProduct(url: string) {
  if (!url) return;
  try {
    connectToDb();
    const scrapedProduct = await scrapeAmazonProduct(url);
    if (!scrapedProduct) return false;

    let product = scrapedProduct;

    const existingProduct = await Product.findOne({
      url: scrapedProduct.url,
    });

    if (existingProduct) {
      const updatedPriceHistory: any = [
        ...existingProduct.priceHistory,
        {
          price: scrapedProduct.currentPrice,
        },
      ];

      product = {
        ...scrapedProduct,
        priceHistory: updatedPriceHistory,
        lowestPrice: getLowestPrice(updatedPriceHistory),
        highestPrice: getHighestPrice(updatedPriceHistory),
        averagePrice: getAveragePrice(updatedPriceHistory),
      };
    }

    const newProduct = await Product.findOneAndUpdate(
      { url: scrapedProduct.url },
      product,
      {
        upsert: true,
        new: true,
      },
    );

    revalidatePath(`/products/${newProduct._id}`);
    return true;
  } catch (error: any) {
    throw new Error(`failed to create product ${error.message}`);
  }
}

export async function getProductById(ProductId: string) {
  try {
    connectToDb();
    const product = await Product.findOne({ _id: ProductId });

    if (!product) return null;
    return product;
  } catch (error) {
    console.log(error);
  }
}

export async function getAllProducts() {
  try {
    connectToDb();
    const products = await Product.find({});
    return products;
  } catch (error) {
    console.log(error);
  }
}
export async function getSimilarProducts(ProductId: string) {
  try {
    connectToDb();
    const currentProduct = Product.findById(ProductId);

    if (!currentProduct) return null;

    const similarProducts = Product.find({ _id: { $ne: ProductId } }).limit(3);

    return similarProducts;
  } catch (error) {
    console.log(error);
  }
}

export async function addUserEmailToProduct(
  productId: string,
  email: string,
): Promise<{ message: string; isError: boolean }> {
  try {
    //send email
    connectToDb();
    const product = await Product.findById(productId);
    if (!product) return { message: 'No product found', isError: true };

    const userExists: boolean = await product.users.some(
      (user: User) => user.email === email,
    );

    if (!userExists) {
      product.users.push({ email });
      await product.save();

      const emailContent = await generateEmailBody(product, 'WELCOME');

      await sendEmail(emailContent, [email]);

      return { message: 'mail sent', isError: false };
    } else {
      return { message: 'user already present', isError: false };
    }
  } catch (error) {
    console.log(error);
    return { message: 'something went wrong', isError: true };
  }
}
