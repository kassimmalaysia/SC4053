import './App.css';
import { useEffect, useState } from 'react';
import LoadingScreen from './LoadingPage';

// import { ethers } from 'ethers';
import { parseEther, formatEther } from '@ethersproject/units';
import Auction from './contracts/Auction.json';
import logoImage from './images/NTU_Logo.png';
import listImage from './images/list_logo.png';
import { hexValue } from 'ethers/lib/utils';
const AuctionContractAddress = '0x9505010bf63f0dd3bb09b6738b13b0f82aff0123';
// The AuctionContract Address needs to change based on your remix contract everytime you deploy
const emptyAddress = "0x0000000000000000000000000000000000000000";
const ethers = require("ethers")
function App() {
  // Use hooks to manage component state
  const [account, setAccount] = useState('');
  const [domain, setDomain] = useState('');
  const [myBid, setMyBid] = useState('');
  const [bidderCount, setBidderCount] = useState();
  const [highestBid, setHighestBid] = useState();
  const [highestBidder, setHighestBidder] = useState('');
  const [ownedDomains, setOwnedDomains] = useState([]);
  const [commitedDomain, setCommitedDomain] = useState([]);
  const [currentPhase, setCurrentPhase] = useState('');
  const [bidAmountUnit, setBidAmountUnit] = useState('wei');
  const [etherAmountUnit, setEtherAmountUnit] = useState('wei');
  const [isCommitPhase, setIsCommitPhase] = useState(true);
  const [isAuctionPhase, setIsAuctionPhase] = useState(true);
  const [isSubmit1, setIsSubmit1] = useState(true);
  const [etherToSend, setEtherToSend] = useState('');
  const [etherToSendOwner, setEtherToSendOwner] = useState('');
  const [addresstoDomain, setAddresstoDomain] = useState('');
  const [domaintoAddress, setDomaintoAddress] = useState('');
  const [addresstoDomain1, setAddresstoDomain1] = useState('');
  const [domaintoAddress1, setDomaintoAddress1] = useState([]);
  
  const [loading, setLoading] = useState(false);


  const handleBidAmountChange = (event) => {
    setMyBid(event.target.value);
  };
  const handleEtherAmountChange = (event) => {
    setEtherToSend(event.target.value);
  };

  const handleBidUnitChange = (event) => {
    setBidAmountUnit(event.target.value);
  };
  const handleEtherUnitChange = (event) => {
    setEtherAmountUnit(event.target.value);
  };
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
  const convertEtherToWei = () => {
    const bidValue = parseFloat(etherToSend);

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

  const handleCommit = (event) => {
    event.preventDefault();

    // Your logic for handling the commit action
    startCommit(event, domain);
    setIsCommitPhase(false);
    setIsAuctionPhase(false);
    setIsSubmit1(false);

    // Reset form fields if needed
  };
  const handleAuction = (event) => {
    event.preventDefault();

    // Your logic for handling the commit action
    setIsAuctionPhase(false);
    setIsCommitPhase(false);
    setIsSubmit1(true);
   

    // Reset form fields if needed
  };

  const handleSubmit = (event) => {
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

  
  };
  const handleSubmitForExistingBid = (event) => {
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
    submitBidForExisitingDomain(event, domain, convertedBidValue, 'myhash');
  };


  const handleDomaintoAddress = (event) => {
    event.preventDefault();


    DomaintoAddress(event, domaintoAddress);


  };
  const handleAddresstoDomain = (event) => {
    event.preventDefault();


    AddresstoDomain(event, addresstoDomain);


  };
  const handleEtherToSendChange = (event) => {
    event.preventDefault();
    // Validate  amount to send
    const minBidAmount = 1;
    if (isNaN(etherToSend) || etherToSend < minBidAmount) {
      alert('Minimum amount to send is 1 wei. Please enter a higher amount.');
      return;
    }
    const convertedBidValue = convertEtherToWei();
    console.log(convertedBidValue);


    sendEtherToOwner(event, etherToSendOwner, convertedBidValue);
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
  async function retrieveDomainPhase(domain) {
    if (typeof window.ethereum !== 'undefined') {
      const contract = await initializeProvider();
      try {

        const phase = await contract.retrieveDomainPhase(domain);
        console.log(`Current Phase for ${domain}:`, phase);
        setCurrentPhase(phase);
      } catch (error) {
        console.error('Error retrieving current phase:', error);
      }
    }
  }

  async function startCommit(event, domain) {
    event.preventDefault();
    if (typeof window.ethereum !== 'undefined') {
      const contract = await initializeProvider();
      try {
        console.log("in Start commit");
        await contract.startCommitPhase(domain);
        // Update the phase to Commit and set the commit phase end time

       
        setCurrentPhase('Start');
        // Schedule revealBid to be called after the commit phase ends
        setIsCommitPhase(false);
        setIsAuctionPhase(false);

      } catch (e) {
        console.log('error in starting the bidding: ', e);
      }
    }
  }
  async function submitBid(event, domain, value, secret) {
    event.preventDefault();
    if (typeof window.ethereum !== 'undefined') {
      const contract = await initializeProvider();
      try {
        console.log(value);
        const ether = value.toString();
        console.log("in commit");
        console.log(ether);
        setTimeout(async () => {
            const phase = await contract.retrieveDomainPhase(domain);
            console.log(`Current Phase for ${domain}:`, phase);
          
        if (phase === 'Commit') {
          console.log("Committing");
          setCurrentPhase(phase);
          await contract.commitBid(domain, ether, "myhash");
          fetchBidderCountForDomain(domain);
        }
      }, 25000);
    
        let hasRevealed = false;

        // Wait for the smart contract to emit the LogBid event, then update component state
        contract.on('LogBid', (account, domain, ether, secret) => {
          setTimeout(async () => {
            if (!hasRevealed) {
            console.log("Revealing");
            const phase = await contract.retrieveDomainPhase(domain);
            console.log(`Current Phase for ${domain}:`, phase);
            setCurrentPhase(phase);
            revealPhase(domain, ether, "myhash");
            hasRevealed = true; // Set the flag to true after revealing once
          }
          }, 60000);//Commit Phase 1 minute
          console.log(`New bid from ${account} for domain ${domain} with value ${ether} and secret ${secret}`);
        });
       
      
        
        
      } catch (e) {
        console.log('error making bid: ', e);
      }
    }
  }
  async function submitBidForExisitingDomain(event, domain, value, secret) {
    event.preventDefault();
    if (typeof window.ethereum !== 'undefined') {
      const contract = await initializeProvider();
      try {
        console.log("submitBidForExisitingDomain");
        console.log(value);
        const ether = value.toString();

        console.log(ether);
            const phase = await contract.retrieveDomainPhase(domain);
            console.log(`Current Phase for ${domain}:`, phase);
            setCurrentPhase(phase);
        if (phase === 'Commit') {
          
          console.log("Committing");
          await contract.commitBid(domain, ether, "myhash");
          fetchBidderCountForDomain(domain);
        }
        setTimeout(async () => {
          const phase = await contract.retrieveDomainPhase(domain);
          console.log(`Current Phase for ${domain}:`, phase);
          setCurrentPhase(phase);
       
        if (phase === 'Reveal') {
          console.log("Revealing");
          
          revealBidForExisitingDomain(domain, ether, "myhash");         
        }
      
    }, 85000);//Commit Phase 1 minute
       

        

          console.log(`New bid from ${account} for domain ${domain} with value ${ether} and secret ${secret}`);
     
      } catch (e) {
        console.log('error making bid: ', e);
      }
    }
  }

  async function revealPhase(domain, value, secret) {
    if (typeof window.ethereum !== 'undefined') {
      const contract = await initializeProvider();
      try {
        // Start RevealPhase
        const phase1 = await contract.retrieveDomainPhase(domain);
        console.log(`Error :Current Phase for ${domain}:`, phase1);
        
        await contract.startRevealPhase(domain);
        
        console.log("in Start Reveal Phase", domain, value, secret);

        const phase = await contract.retrieveDomainPhase(domain);
            console.log(`Current Phase for ${domain}:`, phase);
            setTimeout(async () => {
              const phase1 = await contract.retrieveDomainPhase(domain);
              console.log(`Current Phase for ${domain}:`, phase1);
                console.log("Revealing Phase");
                setCurrentPhase(phase1);
                revealBid(domain, value, "myhash");         
      
            }, 25000);
        

      } catch (e) {
        console.log('error starting revealing phase: ', e);
      }
    }
  }
  async function revealBid(domain, value, secret) {
    if (typeof window.ethereum !== 'undefined') {
      const contract = await initializeProvider();
      try {
        // Start Reveal Bid
        console.log("in Reveal Bid", domain, parseInt(hexValue(value), 16), secret);
        await contract.revealBid(domain, parseInt(hexValue(value), 16), "myhash");

        setTimeout(async () => {
            checkAndFinalizeAuction(domain);
  
        }, 25000);

      } catch (e) {
        console.log('error revealing bids: ', e);
      }
    }
  }
  async function revealBidForExisitingDomain(domain, value, secret) {
    if (typeof window.ethereum !== 'undefined') {
      const contract = await initializeProvider();
      try {
        console.log(value);
        // Start Reveal Bid
        console.log("in Reveal Bid", domain, value, secret);
        await contract.revealBid(domain, value, "myhash");

        const phase = await contract.retrieveDomainPhase(domain);
        console.log(`Current Phase for ${domain}:`, phase);
        if(phase === 'Reveal'){
            setCurrentPhase(phase);
            checkAndFinalizeAuction(domain);
        }

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
        setTimeout(async () => {
          
            
            const phase = await contract.retrieveDomainPhase(domain);
            console.log(`Current Phase for ${domain}:`, phase);
            setCurrentPhase(phase);
            fetchHighestBid(domain);
            
          
  
        }, 25000);

       
        setTimeout(() => {
          // Update the phase to None
          setCurrentPhase('Finalized');
        }, 30000); // 20 secs
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

        setHighestBid(parseFloat(highestBid.toString()));
        setHighestBidder(highestBidder);

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
  async function fetchDomainsInCommitPhase() {
    if (typeof window.ethereum !== 'undefined') {
      const contract = await initializeProvider();
      try {
        const domainsInCommitPhase = await contract.getDomainsInCommitPhase();
        setCommitedDomain(domainsInCommitPhase);
        console.log('Domains in Commit Phase:', domainsInCommitPhase);
        // Update state or perform other actions with the list of domains in commit phase
      } catch (e) {
        console.error('Error fetching domains in commit phase:', e);
      }
    }
  }
  async function AddresstoDomain(event, address) {
    event.preventDefault();
    if (typeof window.ethereum !== 'undefined') {
      const contract = await initializeProvider();
      try {
        const result = await contract.resolveAddressToDomains(address);
        let res = result;
        if (res.length === 0) {
          res = 'NA';
        }
        setAddresstoDomain1(res);
        console.log('Domain:', result);
        // Update state or perform other actions with the list of domains in commit phase
      } catch (e) {
        console.error('Error fetching Address from domain:', e);
      }
    }
  }
  async function DomaintoAddress(event, domain) {
    event.preventDefault();
    if (typeof window.ethereum !== 'undefined') {
      const contract = await initializeProvider();
      try {
        const result = await contract.resolveDomainToAddress(domain);
        let res = result;
        if (res === emptyAddress) {
          res = 'No Owner';
        }
        setDomaintoAddress1(res);
        console.log('Address:', res);
        // Update state or perform other actions with the list of domains in commit phase
      } catch (e) {
        console.error('Error fetching domain from Address:', e);
      }
    }
  }

  async function fetchBidderCountForDomain(domain) {
    if (typeof window.ethereum !== 'undefined') {
      const contract = await initializeProvider();
      // Listen for the BidderCountChanged event
      contract.on('BidderCountChanged', (newBidderCount) => {
        console.log('Bidder count changed:', newBidderCount.toNumber());
        setBidderCount(newBidderCount.toNumber());
      });
      try {

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

  async function sendEtherToOwner(event, domain, etherToSend) {
    event.preventDefault();
    if (typeof window.ethereum !== 'undefined') {
      const contract = await initializeProvider();
      let value = 0;
      console.log(domain, etherToSend);

      try {
        // Get the owner of the specified domain
        const owner = await contract.resolveDomainToAddress(domain);

        if (owner !== emptyAddress) {
          const weiToSend = parseInt(hexValue(etherToSend), 16);
          console.log(weiToSend);
          console.log(owner);

          // Call the function to send Ether to the domain owner
          // Send Ether directly to the owner
          await window.ethereum.request({
            method: 'eth_sendTransaction',
            params: [
              {
                from: account,
                to: owner,
                value: `0x${weiToSend.toString(16)}`, // Convert Wei to hexadecimal string
              },
            ],
          });
          console.log(bidAmountUnit);
          if (bidAmountUnit === 'gwei') {
            value = weiToSend / 1e9;
          }
          else if (bidAmountUnit === 'ether') {
            value = weiToSend / 1e18;
          }
          else
            value = weiToSend;


          // Display a success message
          alert(`Successfully sent ${value} ${bidAmountUnit} to the owner of ${domain}.`);
        } else {
          alert(`Domain ${domain} is not registered.`);
        }


        // Check if the owner is not the empty address (meaning the domain is registered)

      } catch (e) {
        console.error('Error sending Ether to owner:', e);
      }
    }
  };
 

  useEffect(() => {
    // Listen for changes in the Ethereum account
    window.ethereum.on('accountsChanged', (newAccounts) => {
      setAccount(newAccounts[0]);

    });

    // Fetch initial data
    requestAccount();
    fetchDomainsInCommitPhase();
    fetchOwnedDomains(account);

    //Periodically check
    const checkDomainsinAuction = setInterval(fetchDomainsInCommitPhase, 5000);
   
    return () => {
      clearInterval(checkDomainsinAuction);
      
    };


  }, [account]);



  useEffect(() => {
    requestAccount();
  }, []);


  return (

    <div className="background-container">
      {/* Top Bar */}
      <div className="top-bar">
        <div className="logo">
          <img src={logoImage}
            alt="Logo"
          />
        </div>
        <div className="title">.ntu Auction House</div>
      </div>
      {/* Big Boxes */}
      <div className="flex-container">
        <div className="box-container" style={{ width: '50%' }}>
          <div className="big-box left-box" style={{ height: "250px" }}>
            <h2 className="box-headerleft">My Account</h2>
            {/* Content for the left box */}
            <p>Connected Account: {account}</p>
            <p>My Bid: {myBid}</p>

            <form>
              <div className="bid-container"></div>

              <label htmlFor="domainInput ">Domain Name: </label>
              <input
                style={{ width: "60%" }}
                id="domainInput"
                value={domain}
                onChange={(event) => setDomain(event.target.value)}
                name="Domain Name"
                type="text"
                placeholder="For new Domain"
              />


              {/* {loading && <LoadingScreen />} */}
              {isCommitPhase ? (
                <>

                  <button type='button' className='button1' onClick={handleCommit}>Commit</button>
                </>
              ) : (

                <div >
                  <div>

                    <label htmlFor="EtherInput">Bid Amount: </label>
                    <input
                      id="weiInput"
                      style={{ width: "60%", margin: "5px" }}
                      value={myBid}
                      onChange={handleBidAmountChange}
                      name="Bid Amount"
                      type="text"
                      placeholder="Enter Bid Amount"
                    />
                    <select id="bidUnit" value={bidAmountUnit} onChange={handleBidUnitChange}>
                      <option value="wei">Wei</option>
                      <option value="gwei">Gwei</option>
                      <option value="ether">Ether</option>
                    </select>
                  </div>


                  <p></p>
                  <button type='button' className='button' onClick={isSubmit1 ? handleSubmitForExistingBid: handleSubmit }>Submit</button>
                </div>

              )}

            </form>
            <p></p>
            <form>
            <div >
                 
                </div>
              {isAuctionPhase ? (
                <>
                  <label htmlFor="domainInput ">For Domains in Auction: </label>
                  <button type='button' className='button1' onClick={handleAuction}>Start Auction</button>
        
                </>
              ) : (

                <div >

                </div>

              )}

            </form>


          </div>
          <div className='big-box left-box'>
            <h2 className='box-headerleft'>Search Owner by Domain</h2>
            <p></p>
            <label htmlFor='searchOwner'>Owner of Domain: </label>
            <input
              style={{ width: "60%", margin: "5px" }}
              id='searchOwner'
              value={domaintoAddress}
              onChange={(event) => setDomaintoAddress(event.target.value)}
              name='Search Owner'
              type='text'
              placeholder='Enter Valid Domain' />
            <p></p>
            <p>Search Result: {domaintoAddress1}</p>
            <button type='button' className='button' onClick={handleDomaintoAddress}>Search</button>
          </div>
        </div>
        <div className="box-container" style={{ width: '50%' }} >
          <div className="big-box right-box" style={{ height: "250px" }}>
            <h2 className="box-headerright">Bidding for {domain}</h2>
            {/* Content for the right box */}

            <p>Number of bidders: {bidderCount}</p>
            <p>Current Phase: {currentPhase}</p>
            <p>Auction Highest Bid Amount: {highestBid}</p>
            <p>
              Auction Highest Bidder:{highestBidder}

            </p>
          </div>

          <div className="big-box bottomright-box">
            <h2 className="box-headerright">Domains for Auction</h2>
            {/* Content for the right box */}
            <div >
              <p></p>
              <ul >
                {commitedDomain.map((domain, index) => (
                  <li key={index}>{domain}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
      <div className='flex-container'>
        <div className='big-box left-box'>
          <h2 className='box-headerleft'>Search Domain by Owner</h2>
          <p></p>
          <label htmlFor='searchDomain'>Domain of Owner: </label>
          <input
            style={{ width: "60%", margin: "5px" }}
            id='searchDomain'
            value={addresstoDomain}
            onChange={(event) => setAddresstoDomain(event.target.value)}
            name='Search Domain'
            type='text'
            placeholder='Enter Valid Public Address' />
          <p>Search Result: {addresstoDomain1}</p>
          <button type='button' className='button' onClick={handleAddresstoDomain}>Search</button>
        </div>


        <div className='big-box right-box'>
          <h2 className='box-headerleft'>Send ETH to Domain</h2>
          <p></p>
          <label htmlFor='transferDomain'>Send to Domain: </label>
          <input
            style={{ width: "60%", margin: "5px" }}
            id='transferDomain'
            value={etherToSendOwner}
            onChange={(event) => setEtherToSendOwner(event.target.value)}

            name='Transfer Domain'
            type='text'
            placeholder='Enter Valid Domain' />
          <p></p>
          <label htmlFor='transferAmt' style={{ marginRight: "13px" }}>Amount : </label>
          <input
            style={{ width: "60%", margin: "5px" }}
            id='transferAmt'
            value={etherToSend}
            onChange={handleEtherAmountChange}
            name='Transfer Amount'
            type='text'
            placeholder='Enter  Amount to Send' />

          <select id="bidUnit" value={etherAmountUnit} onChange={handleEtherUnitChange}>
            <option value="wei">Wei</option>
            <option value="gwei">Gwei</option>
            <option value="ether">Ether</option>
          </select>


          <p></p>

          <button type='button' className='button' onClick={handleEtherToSendChange}>Transfer</button>
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