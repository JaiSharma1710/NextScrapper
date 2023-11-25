import axios from 'axios';
import * as cheerio from 'cheerio';

import { extractCurrency, extractPrice } from '../utils';

export async function scrapeAmazonProduct(url: string) {
  if (!url) {
    return;
  }

  //Bright data proxy configuration
  const username = String(process.env.BRIGHT_DATA_USERNAME);
  const password = String(process.env.BRIGHT_DATA_PASSWORD);
  const port = 22225;
  const session_id = (1000000 * Math.random()) | 0;
  const options = {
    auth: {
      username: `${username}-session-${session_id}`,
      password,
    },
    host: String(process.env.BRIGHT_DATA_HOST),
    port,
    rejectUnauthorized: false,
  };

  try {
    // fetch the product page
    const response = await axios.get(url, options);
    const $ = cheerio.load(response.data);

    //Extract product data
    const productTitle = $('#productTitle').text().trim();
    const currentPrice = extractPrice(
      $('.priceToPay span.a-price-whole'),
      $('a.size.base.a-color-price'),
      $('.a-button-select .a-color-base'),
    );
    const originalPrice = extractPrice(
      $('#priceblock-ourprice'),
      $('.a-price.a-text-price span.a-offscreen'),
      $('#listPrice'),
      $('#priceblock_dealprice'),
    );

    const isOutOfStock =
      $('#availability span').text().trim().toLocaleLowerCase() ===
      'currently unavailable';

    const images =
      $('#imgBlkFont').attr('data-a-dynamic-image') ||
      $('#landingImage').attr('data-a-dynamic-image') ||
      '{}';

    const imgUrl = Object.keys(JSON.parse(images));

    const currency = extractCurrency($('.a-price-symbol'));

    const discountRate = $('.savingsPercentage').text().replace(/[-%]/g, '');

    //construct data object with scrapped data
    const data = {
      url,
      currency,
      image: imgUrl[0],
      title: productTitle,
      currentPrice: Number(currentPrice) || Number(originalPrice),
      originalPrice: Number(originalPrice) || Number(currentPrice),
      priceHistory: [],
      discountRate: Number(discountRate),
      isOutOfStock,
      lowestPrice: Number(currentPrice) || Number(originalPrice),
      highestPrice: Number(originalPrice) || Number(currentPrice),
      averagePrice: Number(currentPrice) || Number(originalPrice),
    };

    return data;
  } catch (error: any) {
    throw new Error(`failed to scrape product ${error.message}`);
  }
}
