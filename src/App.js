import './App.css';
import { useEffect, useState } from 'react';

// import { ethers } from 'ethers';
import { parseEther, formatEther } from '@ethersproject/units';
import Auction from './contracts/Auction.json';
import logoImage from './Capture.png';
const AuctionContractAddress = '0x5F8A26d15346686105D8Cd9373eF84A62EF99A7e';
// The AuctionContract Address needs to change based on your remix contract
const emptyAddress = '0x0000000000000000000000000000000000000000';
const ethers = require("ethers")
function App() {
 // Use hooks to manage component state
 const [account, setAccount] = useState('');
 const [domain, setDomain] = useState('');
 const [myBid, setMyBid] = useState(0);
 const [isOwner, setIsOwner] = useState(false);
 const [bidderCount, setBidderCount] = useState(0);
 const [highestBid, setHighestBid] = useState(0);
 const [highestBidder, setHighestBidder] = useState('');
 const [ownedDomains, setOwnedDomains] = useState([]);

 
 // Sets up a new Ethereum provider and returns an interface for interacting with the smart contract
 async function initializeProvider() {
  await window.ethereum.request({ method: 'eth_requestAccounts' });
  if (window.ethereum) {
   const provider = new ethers.providers.Web3Provider(window.ethereum);
   const signer = provider.getSigner();
   return new ethers.Contract(AuctionContractAddress, Auction.abi, signer);
  }
  else {
    console.error('Ethereum provider not found. Please make sure MetaMask or a similar extension is installed and active.');
  }
 }

 // Displays a prompt for the user to select which accounts to connect
 async function requestAccount() {
   const account = await window.ethereum.request({ method: 'eth_requestAccounts' });
   setAccount(account[0]);
 }

 async function fetchHighestBid() {
   if (typeof window.ethereum !== 'undefined') {
     const contract = await initializeProvider();
     try {
       const highestBid = await contract.fetchHighestBid();
       const { bidAmount, bidder } = highestBid;

     // Convert bidAmount from Wei to Ether and round value to 4 decimal places
        setHighestBid(parseFloat(formatEther(bidAmount.toString())).toPrecision(4));
        setHighestBidder(bidder.toLowerCase());
          // Fetch the number of bidders
          const bidderCount = await contract.getBidderCount(); // You need to add this function to your smart contract
          setBidderCount(bidderCount);
      
     } catch (e) {
       console.log('error fetching highest bid: ', e);
     }
   }
 }

 async function fetchMyBid() {
   if (typeof window.ethereum !== 'undefined') {
     const contract = await initializeProvider();
     try {
       const myBid = await contract.bids(account);
       setMyBid(parseFloat(formatEther(myBid.toString())).toPrecision(4));
     } catch (e) {
       console.log('error fetching my bid: ', e);
     }
   }
 }

 async function fetchOwner() {
   if (typeof window.ethereum !== 'undefined') {
     const contract = await initializeProvider();
     try {
       const owner = await contract.owner();
       setIsOwner(owner.toLowerCase() === account);
     } catch (e) {
       console.log('error fetching owner: ', e);
     }
   }
 }

 async function submitBid(event, domain, value, secret) {
  event.preventDefault();
  if (typeof window.ethereum !== 'undefined') {
    const contract = await initializeProvider();
    try {
      // User inputs amount in terms of Ether, convert to Wei before sending to the contract.
      const wei = parseEther(value.toString());
      // Replace the next line with the actual function call to commitBid
      await contract.commitBid(domain, wei, "myhash");
     

      // Wait for the smart contract to emit the LogBid event, then update component state
      contract.on('LogBid', (_, __) => {
        fetchMyBid();
        fetchHighestBid();
      });
    } catch (e) {
      console.log('error making bid: ', e);
    }
  }
}

  // Function to fetch the list of domains owned by the current account
  async function fetchOwnedDomains() {
    if (typeof window.ethereum !== 'undefined') {
      const contract = await initializeProvider();
      try {
        const domains = await contract.resolveAddressToDomains(account);
        setOwnedDomains(domains);
      } catch (e) {
        console.error('Error fetching owned domains: ', e);
      }
    }
  }

//  async function withdraw() {
//    if (typeof window.ethereum !== 'undefined') {
//      const contract = await initializeProvider();
//      // Wait for the smart contract to emit the LogWithdrawal event and update component state
//      contract.on('LogWithdrawal', (_) => {
//        fetchMyBid();
//        fetchHighestBid();
//      });
//      try {
//        await contract.withdraw();
//      } catch (e) {
//        console.log('error withdrawing fund: ', e);
//      }
//    }
//  }



useEffect(() => {
  // Listen for changes in the Ethereum account
  window.ethereum.on('accountsChanged', (newAccounts) => {
    setAccount(newAccounts[0]);
  });

  // Fetch initial data
  requestAccount();
  fetchOwner();
  fetchMyBid();
  fetchHighestBid();
  fetchOwnedDomains();
}, [account]);
 
 useEffect(() => {
  requestAccount();
}, []);


 return (
  
  <div className="background-container">
      {/* Top Bar */}
      <div className="top-bar">
        <div className="logo">
          <img src= {logoImage}
           alt="Logo" 
          />
        </div>
        <div className="title">.NTU Domain Registrar</div>
      </div>
      {/* Big Boxes */}
      <div className="flex-container">
        <div className="big-box left-box">
        <h2 className="box-headerleft">Account</h2>
          {/* Content for the left box */}
          <p>Connected Account: {account}</p>
          <p>My Bid: {myBid}</p>
    <form onSubmit={(event) => submitBid(event, domain, myBid, 'myhash')}>
    <div>
    <label htmlFor="domainInput ">Domain Name </label>
      <input
      id="domainInput"
      value={domain}
      onChange={(event) => setDomain(event.target.value)}
      name="Domain Name"
      type="text"
      placeholder="Enter Domain Name"
      />
      </div>
      <div>
      <label htmlFor="weiInput">Bid Amount(in wei)  </label>
    <input
        id="weiInput"
      value={myBid}
      onChange={(event) => setMyBid(event.target.value)}
      name="Bid Amount"
      type="number"
      placeholder="Enter Bid Amount"
      />
       </div>
           <button type="submit">Submit</button>
         </form>
        </div>
        <div className="box-container" style={{ width: '50%' }}>
        <div className="big-box right-box">
        <h2 className="box-headerright">Bidding for {domain}</h2>
          {/* Content for the right box */}
          <p>Number of bidders: {bidderCount}</p>
          <p>Auction Highest Bid Amount: {highestBid}</p>
       <p>
         Auction Highest Bidder:{' '}
         {highestBidder === emptyAddress
           ? 'null'
           : highestBidder === account
           ? 'Me'
           : highestBidder}
       </p>
        </div>
        
        <div className="big-box right-box">
        <h2 className="box-headerright">Ongoing bids</h2>
          {/* Content for the right box */}
          <p>Auction Highest Bid Amount: {highestBid}</p>
        </div>
        </div>
      </div>
      <div className="big-box left-box">
      <h2 className="box-headerleft">Domains Owned by {account}:</h2>
        {/* Content for the bottom box */}
        <div style={{ marginTop: '20px' }}>
        <p></p>
        <ul>
          {ownedDomains.map((domain, index) => (
            <li key={index}>{domain}</li>
          ))}
        </ul>
        </div>
      </div>
 
   </div>
 );
}

export default App;