
import React, { useState, useEffect } from 'react';
import Web3Modal from 'web3modal';
import { ethers } from 'ethers';
import axios from 'axios';
import { MarketAddressABI, marketAddress } from './constants';

const PINATA_API_KEY = '9ff8eba8126dc75fcdee';
const PINATA_API_SECRET = '186b2dc80f18db554d5167645cf27dd916ce3883f15d39ac5fce7c0c2240fb54';

const fetchContract = (signerOrProvider) => new ethers.Contract(marketAddress, MarketAddressABI, signerOrProvider);
export const NFTContext = React.createContext();

export const NFTProvider = ({ children }) => {
  const [currentAccount, setCurrentAccount] = useState('');
  const nftCurrency = 'ETH';

  const checkIfWalletIsConnected = async () => {
    if (!window.ethereum) return alert('Please install MetaMask');

    const accounts = await window.ethereum.request({ method: 'eth_accounts' });

    if (accounts.length) {
      setCurrentAccount(accounts[0]);
    } else {
      console.log('No accounts found.');
    }
  };

  useEffect(() => {
    checkIfWalletIsConnected();
  }, []);

  const connectWallet = async () => {
    if (!window.ethereum) return alert('Please install MetaMask');
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });

    setCurrentAccount(accounts[0]);

    window.location.reload();
  };

  const uploadToIPFS = async (file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const metadata = JSON.stringify({
        name: 'NFT Metadata',
        keyvalues: {
          exampleKey: 'exampleValue',
        },
      });

      formData.append('pinataMetadata', metadata);

      const options = JSON.stringify({
        cidVersion: 0,
      });

      formData.append('pinataOptions', options);

      const response = await axios.post('https://api.pinata.cloud/pinning/pinFileToIPFS', formData, {
        maxContentLength: 'Infinity',
        headers: {
          // eslint-disable-next-line no-underscore-dangle
          'Content-Type': `multipart/form-data; boundary=${formData._boundary}`,
          pinata_api_key: PINATA_API_KEY,
          pinata_secret_api_key: PINATA_API_SECRET,
        },
      });

      const ipfsUrl = `https://gateway.pinata.cloud/ipfs/${response.data.IpfsHash}`;
      console.log(ipfsUrl);
      return ipfsUrl;
    } catch (error) {
      console.log('Error uploading file to IPFS.', error.message);
    }
  };

  const createNFT = async (formInput, fileUrl, router) => {
    const { name, description, price } = formInput;

    if (!name || !description || !price || !fileUrl) {
      console.error('All fields are required.');
      return;
    }

    /*   const metadata = {
      name,
      description,
      image: fileUrl,
    }; */
    const data = JSON.stringify({ name,
      description,
      image: fileUrl });

    try {
      const response = await axios.post('https://api.pinata.cloud/pinning/pinJSONToIPFS', data, {
        headers: {
          'Content-Type': 'application/json',
          pinata_api_key: PINATA_API_KEY,
          pinata_secret_api_key: PINATA_API_SECRET,
        },
      });

      const metadataUrl = `https://gateway.pinata.cloud/ipfs/${response.data.IpfsHash}`;
      console.log('Metadata URL:', metadataUrl);

      // eslint-disable-next-line no-use-before-define
      await createSale(metadataUrl, price);
      router.push('/');
    } catch (error) {
      console.error('Error uploading metadata to Pinata:', error.response?.data || error.message);
    }
  };

  const createSale = async (url, formInputPrice, isReselling, id) => {
    const web3modal = new Web3Modal();
    const connection = await web3modal.connect();
    const provider = new ethers.providers.Web3Provider(connection);
    const signer = provider.getSigner();

    const price = ethers.utils.parseUnits(formInputPrice, 'ether');
    const contract = fetchContract(signer);
    const listingPrice = await contract.getListingPrice();

    const transaction = !isReselling
      ? await contract.createToken(url, price, { value: listingPrice.toString() })
      : await contract.resellToken(id, price, { value: listingPrice.toString() });

    await transaction.wait();
  };

  const fetchNFTs = async () => {
    const provider = new ethers.providers.JsonRpcProvider();
    const contract = fetchContract(provider);

    try {
      const data = await contract.fetchMarketItems();
      console.log('Fetched Market Items:', data);

      const items = await Promise.all(data.map(async ({ tokenId, seller, owner, price: unformattedPrice }) => {
        try {
          const tokenURI = await contract.tokenURI(tokenId);
          console.log(`Token URI for ${tokenId}:`, tokenURI);

          const { data: { image, name, description } } = await axios.get(tokenURI);
          const price = ethers.utils.formatUnits(unformattedPrice.toString(), 'ether');

          return {
            price,
            tokenId: tokenId.toNumber(),
            seller,
            owner,
            image,
            name,
            description,
            tokenURI,
          };
        } catch (error) {
          console.error(`Failed to fetch metadata for Token ID ${tokenId}:`, error.message);
          return null;
        }
      }));

      return items; // Remove null entries
    } catch (error) {
      console.error('Failed to fetch NFTs:', error.message);
      return [];
    }
  };

  const fetchMyNFTsOrListedNFTs = async (type) => {
    const web3modal = new Web3Modal();
    const connection = await web3modal.connect();
    const provider = new ethers.providers.Web3Provider(connection);
    const signer = provider.getSigner();

    const contract = fetchContract(signer);

    const data = type === 'fetchItemsListed'
      ? await contract.fetchItemsListed()
      : await contract.fetchMyNFTs();
    const items = await Promise.all(data.map(async ({ tokenId, seller, owner, price: unformattedPrice }) => {
      try {
        const tokenURI = await contract.tokenURI(tokenId);
        console.log(`Token URI for ${tokenId}:`, tokenURI);

        const { data: { image, name, description } } = await axios.get(tokenURI);
        const price = ethers.utils.formatUnits(unformattedPrice.toString(), 'ether');

        return {
          price,
          tokenId: tokenId.toNumber(),
          seller,
          owner,
          image,
          name,
          description,
          tokenURI,
        };
      } catch (error) {
        console.error(`Failed to fetch metadata for Token ID ${tokenId}:`, error.message);
        return null;
      }
    }));

    return items; // Remove null entries
  };

  const buyNFT = async (nft) => {
    const web3modal = new Web3Modal();
    const connection = await web3modal.connect();
    const provider = new ethers.providers.Web3Provider(connection);
    const signer = provider.getSigner();

    const contract = fetchContract(signer);

    const price = ethers.utils.parseUnits(nft.price.toString(), 'ether');

    const transaction = await contract.createMarketSale(nft.tokenId, { value: price });
    await transaction.wait();
  };

  return (
    <NFTContext.Provider value={{ nftCurrency,
      connectWallet,
      currentAccount,
      uploadToIPFS,
      createNFT,
      fetchNFTs,
      fetchMyNFTsOrListedNFTs,
      buyNFT,
      createSale }}
    >
      {children}

    </NFTContext.Provider>
  );
};

