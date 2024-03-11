'use client'

import React, { useState, useEffect, useCallback } from 'react';
import cheerio from 'cheerio';
import { Table, Button, Input, Typography } from 'antd';

interface IPrice {
  amount: number;
  formatted: string;
}

const { TextArea } = Input;
const { Title } = Typography;

const Home = () => {
  const [htmlInput, setHtmlInput] = useState('');
  const [listings, setListings] = useState([] as any[]);

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




  const parseHtml = useCallback(() => {
    const $ = cheerio.load(htmlInput);

    const listings: { sellerName: string; listingTitle: string; price: IPrice; timeAgo: string; imageUrl: string | undefined; id: number; }[] = [];

    const parseCurrency = (item: string): IPrice => {
      const parsedPrice = item.match(/^([^\d]*)([^\D]*\d.*)$/);
      const options = {
        style: 'currency',
        currency: getCurrency(parsedPrice ? parsedPrice[1] : '').code
      };
      const numeralFormat = new Intl.NumberFormat(
        getCurrency(parsedPrice ? parsedPrice[1] : '').locale,
        options
      );

      return {
        amount: parsedPrice ? sanitizeCurrency(parsedPrice[2]) : 0,
        formatted: parsedPrice ? numeralFormat.format(sanitizeCurrency(parsedPrice[2])) : ''
      }
    };

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
        id: index
      });
    });

    setListings(listings);
  }, [htmlInput]);

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

  const columns = [
    {
      title: 'Seller',
      dataIndex: 'sellerName',
      key: 'sellerName',
    },
    {
      title: 'Title',
      dataIndex: 'listingTitle',
      key: 'listingTitle',
      filters: [
        {
          text: '64GB',
          value: '64',
        },
        {
          text: '128GB',
          value: '128',
        },
        {
          text: '256GB',
          value: '256',
        },
        {
          text: '512GB',
          value: '512',
        },
        {
          text: '1TB',
          value: '1TB',
        },
      ],
      onFilter: (value: any, record: any) => record.listingTitle.indexOf(value) !== -1
    },
    {
      title: 'Price',
      dataIndex: ["price", "amount"],
      key: 'price',
      sorter: (a: { price: { amount: number; }; }, b: { price: { amount: number; }; }) => a.price.amount - b.price.amount,
    },
    {
      title: 'Posted',
      dataIndex: 'timeAgo',
      key: 'timeAgo',
    },
  ];

  useEffect(() => {
    if (htmlInput) parseHtml();
  }, [htmlInput, parseHtml]);

  return (
    <div style={
      {
        padding: '1rem 5rem'
      }
    }>
      <Title>Listing parser</Title>
      <TextArea
        rows={10}
        cols={50}
        placeholder="Paste HTML here"
        value={htmlInput}
        onChange={handleHtmlInputChange}
      ></TextArea>
      <br />
      <Button onClick={parseHtml}>Parse HTML</Button>
      <br />
      <Title level={2}>Listings (Median Price: {calculateLowestPercentiileMedianPrice(listings)})</Title>
      <Table dataSource={listings} columns={columns} rowKey="id" />
    </div>
  );
};

export default Home;
