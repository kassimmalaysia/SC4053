import './App.css';
import { useEffect, useState } from 'react';

// import { ethers } from 'ethers';
import { parseEther, formatEther } from '@ethersproject/units';
import Auction from './contracts/Auction.json';
import logoImage from './Capture.png';
const AuctionContractAddress = '0xf47575dbe289ed5d6dd74daa7d122fa370bca231';
// The AuctionContract Address needs to change based on your remix contract everytime you deploy
const emptyAddress = "0x0000000000000000000000000000000000000000";
const ethers = require("ethers")
function App() {
 // Use hooks to manage component state
 const [account, setAccount] = useState('');
 const [domain, setDomain] = useState('');
 const [myBid, setMyBid] = useState('');
 const [isOwner, setIsOwner] = useState(false);
 const [bidderCount, setBidderCount] = useState();
 const [highestBid, setHighestBid] = useState();
 const [highestBidder, setHighestBidder] = useState('');
 const [ownedDomains, setOwnedDomains] = useState([]);
 const [currentPhase, setCurrentPhase] = useState('');
const [commitPhaseEndTime, setCommitPhaseEndTime] = useState(0);
const [bidAmountUnit, setBidAmountUnit] = useState('wei');

const handleBidAmountChange = (event) => {
  setMyBid(event.target.value);
};

const handleBidUnitChange = (event) => {
  setBidAmountUnit(event.target.value);
};

 
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
 const convertBidToWei = () => {
  const bidValue = parseFloat(myBid);

  switch (bidAmountUnit) {
    case 'wei':
      return bidValue;
    case 'gwei':
      return bidValue * 1e9; // 1 Gwei = 1e9 Wei
    case 'ether':
      return bidValue * 1e18; // 1 Ether = 1e18 Wei
    default:
      return 0;
  }
};

//  async function fetchMyBid() {
//    if (typeof window.ethereum !== 'undefined') {
//      const contract = await initializeProvider();
//      try {
//        const myBid = await contract.bids(account);
//        setMyBid(parseFloat(formatEther(myBid.toString())).toPrecision(4));
//      } catch (e) {
//        console.log('error fetching my bid: ', e);
//      }
//    }
//  }

//  async function fetchOwner() {
//    if (typeof window.ethereum !== 'undefined') {
//      const contract = await initializeProvider();
//      try {
//        const owner = await contract.getOwner();
//        setIsOwner(owner.toLowerCase() === account);
//      } catch (e) {
//        console.log('error fetching owner: ', e);
//      }
//    }
//  }

 async function submitBid(event, domain, value, secret) {
  event.preventDefault();
  if (typeof window.ethereum !== 'undefined') {
    const contract = await initializeProvider();
    try {
      console.log(value);
      const ether =  value.toString();
      
      
        // await contract.startCommitPhase(domain);
        // Update the phase to Commit and set the commit phase end time
        setCurrentPhase('Commit');
        // Schedule revealBid to be called after the commit phase ends

      console.log(ether);
      // Replace the next line with the actual function call to commitBid
      await contract.commitBid(domain,ether, "myhash");
    // Fetch the bidderCount when the user submits a bid
      fetchBidderCountForDomain(domain);
      // Wait for the smart contract to emit the LogBid event, then update component state
      contract.on('LogBid', (account, domain, ether, secret) => {
        setTimeout(() => {
          revealPhase(domain, ether, "myhash");
        }, 60000); // 1 minute
        
        console.log(`New bid from ${account} for domain ${domain} with value ${ether} and secret ${secret}`);
      });
    } catch (e) {
      console.log('error making bid: ', e);
    }
  }
}
 
async function revealPhase(domain, value,secret) {
    if (typeof window.ethereum !== 'undefined') {
      const contract = await initializeProvider();
      try {
         // Start RevealPhase
        await contract.startRevealPhase();
        console.log("in Start Reveal Phase",domain, value,secret);
       
        setCurrentPhase('Reveal');
        // Update the phase to None
        
        setTimeout(() => {    
         revealBid(domain, value,secret);  
        }, 30000); // 0.5 minute

      } catch (e) {
        console.log('error starting revealing phase: ', e);
      }
    }
} 
async function revealBid(domain, value,secret) {
    if (typeof window.ethereum !== 'undefined') {
      const contract = await initializeProvider();
      try {
         // Start Reveal Bid
         console.log("in Reveal Bid" ,domain, parseInt(value, 16),secret);
        await contract.revealBid(domain, parseInt(value, 16),"myhash");
        
       
      
        setTimeout(() => {    
        setCurrentPhase('Finalizing');
        checkAndFinalizeAuction(domain); 
          }, 30000); // 0.5 minute
          
        
      } catch (e) {
        console.log('error revealing bids: ', e);
      }
  }
} 
async function checkAndFinalizeAuction(domain) {
    if (typeof window.ethereum !== 'undefined') {
      const contract = await initializeProvider();
      try {
        console.log("in Finalizing Bid");
        // Fetch the highest bid and highest bidder
        await contract.finalizeAuction(domain);
        fetchHighestBid(domain);
        setTimeout(() => {    
          // Update the phase to None
          setCurrentPhase('Finalized');
            }, 60000); // 1 minute
      } catch (e) {
        console.log('error finalizing auction: ', e);
      }
  }
}

async function fetchHighestBid(domain) {
  if (typeof window.ethereum !== 'undefined') {
    const contract = await initializeProvider();
    try {
     const [highestBidder, highestBid] = await contract.fetchHighestBid(domain);
     console.log("in fetchHighestBid");
      
    // Convert bidAmount from Wei to Ether and round value to 4 decimal places
    setTimeout(() => {
      setHighestBid(parseFloat(highestBid.toString()));
      setHighestBidder(highestBidder);
    }, 20000); 
       
        
     
    } catch (e) {
      console.log('error fetching highest bid: ', e);
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
          
    <form onSubmit={(event) => {
          event.preventDefault();

          // Validate bid amount
          const minBidAmount = 1;
          if (isNaN(myBid) || myBid < minBidAmount) {
            alert('Minimum bid is 1 wei. Please enter a higher bid.');
            return;
          }
          const convertedBidValue = convertBidToWei();
          console.log(convertedBidValue);

          // Your existing submitBid logic here
          submitBid(event, domain, convertedBidValue, 'myhash');

          // Reset form fields
          
        }}>
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
      <div className="bid-container">
      <div>
      <label htmlFor="EtherInput">Bid Amount </label>
    <input
        id="weiInput"
      value={myBid}
      onChange={handleBidAmountChange}
      name="Bid Amount"
      type="text"
      placeholder="Enter Bid Amount"
      />
       </div>
       <div>
          <select id="bidUnit" value={bidAmountUnit} onChange={handleBidUnitChange}>
            <option value="wei">Wei</option>
            <option value="gwei">Gwei</option>
            <option value="ether">Ether</option>
          </select>
        </div>
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
         Auction Highest Bidder:{highestBidder}
          
       </p>
        </div>
        
        <div className="big-box right-box">
        <h2 className="box-headerright">Market</h2>
          {/* Content for the right box */}
          <p>Auction Highest Bid Amount: {highestBid}</p>
        </div>
        </div>
      </div>
      <div className="big-box bottom-box">
      <h2 className="box-headerleft">Domains Owned by {account}:</h2>
        {/* Content for the bottom box */}
        <div style={{ marginTop: '20px' }}>
        <p></p>
        <ul >
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