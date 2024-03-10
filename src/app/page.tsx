'use client'

import React, { useState } from 'react';
import cheerio from 'cheerio';

interface IPrice {
  amount: number;
  formatted: string;
}

const Home = () => {
  const [htmlInput, setHtmlInput] = useState('');
  const [listings, setListings] = useState([]);

  const handleHtmlInputChange = (e: { target: { value: React.SetStateAction<string>; }; }) => {
    setHtmlInput(e.target.value);
  };

  const getCurrency = (abbr: string) => {
    const enumerable: { [key: string]: { locale: string; code: string } } = {
      '$': {
        locale: 'en-SG',
        code: 'SGD'
      },
      rm: {
        locale: 'ms-MY',
        code: 'MYR'
      }
    }
    try {
      return enumerable[abbr.toLowerCase()]
    } catch {
      throw new Error('Invalid currency')
    }
  }

  const sanitizeCurrency = (value: string) => {
    const sanitized = value.replace(',', '');
    const matches = sanitized.match(/\d+/g);
    if (matches) {
      return Number(matches.join('.'));
    }
    return 0;
  }


  const parseCurrency = (item: string): IPrice => {
    console.log({ item })
    const parsedPrice = item.match(/^([^\d]*)([^\D]*\d.*)$/);
    const options = {
      style: 'currency',
      currency: getCurrency(parsedPrice ? parsedPrice[1] : '').code
    };
    console.log({ parsedPrice })
    const numeralFormat = new Intl.NumberFormat(
      getCurrency(parsedPrice ? parsedPrice[1] : '').locale,
      options
    );

    return {
      amount: parsedPrice ? sanitizeCurrency(parsedPrice[2]) : 0,
      formatted: parsedPrice ? numeralFormat.format(sanitizeCurrency(parsedPrice[2])) : ''
    }
  };

  const parseHtml = () => {
    const $ = cheerio.load(htmlInput);

    const listings: ((prevState: never[]) => never[]) | { sellerName: string; listingTitle: string; price: IPrice; timeAgo: string; imageUrl: string | undefined; }[] = [];

    $('.D_vj.D_pt').each((index, element) => {
      const sellerName = $(element).find('p[data-testid="listing-card-text-seller-name"]').text().trim();
      const listingTitle = $(element).find('.D_mH.D_mI.D_mM.D_mP.D_mS.D_mU.D_mQ.D_nm').text().trim();
      const price = parseCurrency($(element).find('.D_pX').text().trim());
      const timeAgo = $(element).find('.D_nn').text().trim();
      const imageUrl = $(element).find('.D_QS.D_QT img').attr('src');

      listings.push({
        sellerName,
        listingTitle,
        price,
        timeAgo,
        imageUrl,
      });
    });

    console.log({ listings })

    setListings(listings as never[]);
  };

  function calculateLowestPercentiileMedianPrice(listings: any[], percentile = 30) {
    // Extract prices from the listings
    const prices = listings.map(listing => listing.price.amount);

    // Sort the prices in ascending order
    prices.sort((a, b) => a - b);

    // Calculate the index for the lower percentile
    const lowerPercentileIndex = Math.floor((percentile / 100) * prices.length);

    // Extract prices within the lower percentile
    const lowerPercentilePrices = prices.slice(0, lowerPercentileIndex);

    // Calculate the median of the lower percentile prices
    const lowerPercentileLength = lowerPercentilePrices.length;
    const lowerPercentileMiddle = Math.floor(lowerPercentileLength / 2);

    if (lowerPercentileLength % 2 === 0) {
      // If the length is even, calculate the average of the two middle values
      return (lowerPercentilePrices[lowerPercentileMiddle - 1] + lowerPercentilePrices[lowerPercentileMiddle]) / 2;
    } else {
      // If the length is odd, return the middle value
      return lowerPercentilePrices[lowerPercentileMiddle];
    }
  }

  return (
    <div>
      <h1>Price Parser</h1>
      <textarea
        rows={10}
        cols={50}
        placeholder="Paste HTML here"
        value={htmlInput}
        onChange={handleHtmlInputChange}
      ></textarea>
      <br />
      <button onClick={parseHtml}>Parse HTML</button>
      <hr />
      <h2>Listings (Median Price: {calculateLowestPercentiileMedianPrice(listings)})</h2>
      <table>
        <thead>
          <tr>
            <th>Seller</th>
            <th>Title</th>
            <th>Price</th>
            <th>Posted</th>
          </tr>
        </thead>
        <tbody>
          {(listings as { sellerName: string; listingTitle: string; price: IPrice; timeAgo: string; imageUrl: string | undefined; }[]).map((listing, index) => (
            <tr key={index}>
              <td>{listing.sellerName}</td>
              <td>{listing.listingTitle}</td>
              <td>{listing.price.formatted}</td>
              <td>{listing.timeAgo}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Home;
