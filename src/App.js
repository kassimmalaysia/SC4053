import './App.css';
import { useEffect, useState } from 'react';

// import { ethers } from 'ethers';
import { parseEther, formatEther } from '@ethersproject/units';
import Auction from './contracts/Auction.json';
import logoImage from './Capture.png';
const AuctionContractAddress = '0x16D175B4277028D84B3983E9f22bA4fef71F3182';
// The AuctionContract Address needs to change based on your remix contract everytime you deploy
const emptyAddress = "0x0000000000000000000000000000000000000000";
const ethers = require("ethers")
function App() {
 // Use hooks to manage component state
 const [account, setAccount] = useState('');
 const [domain, setDomain] = useState('');
 const [myBid, setMyBid] = useState();
 const [isOwner, setIsOwner] = useState(false);
 const [bidderCount, setBidderCount] = useState();
 const [highestBid, setHighestBid] = useState();
 const [highestBidder, setHighestBidder] = useState('');
 const [ownedDomains, setOwnedDomains] = useState([]);
 const [currentPhase, setCurrentPhase] = useState('');
const [commitPhaseEndTime, setCommitPhaseEndTime] = useState(0);

 
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
      const [highestBidder, highestBid] = await contract.fetchHighestBid();
       
     // Convert bidAmount from Wei to Ether and round value to 4 decimal places
        setHighestBid(parseFloat(formatEther(highestBid.toString())).toPrecision(4));
        setHighestBidder(highestBidder);
         
      
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
       const owner = await contract.getOwner();
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
      if (currentPhase === '' && Date.now() >= commitPhaseEndTime) {
        // await contract.startCommitPhase(domain);

        // Update the phase to Commit and set the commit phase end time
        setCurrentPhase('Commit');
        setCommitPhaseEndTime(Date.now() + 60000); // 1 minute
      }
      // Replace the next line with the actual function call to commitBid
      await contract.commitBid(domain, wei, "myhash");
    

    // Fetch the bidderCount when the user submits a bid
      fetchBidderCountForDomain(domain);
     

      // Wait for the smart contract to emit the LogBid event, then update component state
      contract.on('LogBid', (_, __) => {
        fetchHighestBid();
      });
    } catch (e) {
      console.log('error making bid: ', e);
    }
  }
}
 async function fetchBidderCountForDomain(domain) {
  if (typeof window.ethereum !== 'undefined') {
    const contract = await initializeProvider();
    try {
      // Simulate a delay (e.g., 1 seconds) before fetching the bidder count
      setTimeout(async () => {
        console.log(domain);
        const updatedBidderCount = await contract.getBiddersCountByDomain(domain);
        console.log('bidderCount:', updatedBidderCount.toNumber());
        setBidderCount(updatedBidderCount.toNumber());
      }, 20000); // Adjust the delay time as needed
     
    } catch (e) {
      console.log(`Error fetching bidder count for domain ${domain}:`, e);
    }
  }
}


  // Function to fetch the list of domains owned by the current account
  async function fetchOwnedDomains(account) {
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
  async function checkAndFinalizeAuction() {
    if (currentPhase === 'Commit' && Date.now() >= commitPhaseEndTime) {
      if (typeof window.ethereum !== 'undefined') {
        const contract = await initializeProvider();
        try {
         
          // Fetch the highest bid and highest bidder
          fetchHighestBid();
          // Update the phase to None
          setCurrentPhase('-');
        } catch (e) {
          console.log('error finalizing auction: ', e);
        }
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
  fetchOwnedDomains(account);

   // Periodically check and finalize the auction
   const checkAndFinalizeInterval = setInterval(checkAndFinalizeAuction, 1000);
   return () => clearInterval(checkAndFinalizeInterval);
  
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
          <p>Current Phase: { currentPhase}</p>
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