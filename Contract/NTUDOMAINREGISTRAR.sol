// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract NtuDomainRegistrar {
    address private owner;
    constructor() {
        // Set the contract deployer's address as the owner during deployment
        owner = msg.sender;
    }

   address[] public players;
   uint256 public currentBiddersCount; // To keep track of the number of bidders
    enum Phase {None, Commit, Reveal}

    struct Bid {
        bytes32 commitment;  // The hash of (address, value, secret)
        uint256 deposit;     // Amount of Ether deposited
    }

    struct Auction {
        address highestBidder;
        uint256 highestBid;
        bool finalized;
    }
    modifier isOwner() {
   require(msg.sender == owner, 'Only owner can perform task.');
   _;
 }
event LogBid(
    address indexed bidder,
    string domain,
    uint256 value,
    string secret
);
event checksender(address sender);
event checkvalue( uint256 value);
 

    mapping(string => address) public domainOwner;     // Maps domain to owner address
    mapping(address => string[]) public domainsByOwner; // Bonus requirement: reverse lookup

    mapping(string => mapping(address => Bid)) public bids;  // Maps domain to user bids
    mapping(string => Auction) public domainAuctions;
    mapping(string => uint256) public biddersCountByDomain; // Track bidders count for each domain

    Phase public currentPhase = Phase.None;
    uint256 public phaseEndTime;
    uint256 public commitPhaseDuration = 1 minutes;  // Less than 3 minutes as required



   function getOwner() public view returns (address) {
    
    return owner;
}

    // Commit Phase
    function startCommitPhase(string memory domain) external {
        require(currentPhase == Phase.None, "Cannot start commit phase now");
        require(!domainAuctions[domain].finalized, "Domain has already been auctioned off");
        currentPhase = Phase.Commit;
        phaseEndTime = block.timestamp + commitPhaseDuration;
        
    }

    function commitBid(string memory domain, uint256 value, string memory secret) external payable {
        require(currentPhase == Phase.Commit, "Not in commit phase");
        require(!domainAuctions[domain].finalized, "Domain has already been auctioned off"); // Ensure domain hasn't been finalized

        bytes32 commitment = keccak256(abi.encodePacked(msg.sender, value, secret));
        require(bids[domain][msg.sender].commitment == 0, "Bid already made");
        // require(msg.value == value, "Sent value does not match the committed bid value");
        emit checkvalue(msg.value);
         if (!checkPlayerExists(msg.sender)) {
            players.push(msg.sender);
          
        }
        bids[domain][msg.sender] = Bid({
            commitment: commitment,
            deposit: msg.value
            
        });
            currentBiddersCount++; // Increment the bidders count
            // Increment the bidders count for this domain
            biddersCountByDomain[domain]++;
             // Emit the LogBid event
             emit LogBid(msg.sender, domain, value, secret);

            
       
    }

    // Reveal Phase
    function startRevealPhase() external {
        require(block.timestamp > phaseEndTime, "Commit phase not over");
        require(currentPhase == Phase.Commit, "Cannot start reveal phase now");
        currentPhase = Phase.Reveal;
    }

    function revealBid(string memory domain, uint256 value, string memory secret) external {
        require(currentPhase == Phase.Reveal, "Not in reveal phase");
        
        bytes32 commitment = keccak256(abi.encodePacked(msg.sender, value, secret));
        require(bids[domain][msg.sender].commitment == commitment, "Invalid reveal");

        if (value > domainAuctions[domain].highestBid) {
            // Refund the previous highest bidder if this bid is higher
            if (domainAuctions[domain].highestBidder != address(0)) {
                payable(domainAuctions[domain].highestBidder).transfer(domainAuctions[domain].highestBid);
            }

            domainAuctions[domain].highestBidder = msg.sender;
            
            domainAuctions[domain].highestBid = value;
        } 
        // If the value is equal to the highest bid but the bidder is not the current highest bidder
        else if (value == domainAuctions[domain].highestBid && msg.sender != domainAuctions[domain].highestBidder) {
            payable(msg.sender).transfer(value);  // Refund the current bid
        }
        // If the value is less than the highest bid
        else if (value < domainAuctions[domain].highestBid) {
            payable(msg.sender).transfer(value);  // Refund the current bid
        }
        emit checksender(msg.sender);
    }
   

    // Finalizing Auction
    function finalizeAuction(string memory domain) external {
        require(currentPhase == Phase.Reveal, "Not in reveal phase");
        require(!domainAuctions[domain].finalized, "Auction already finalized");

        domainOwner[domain] = domainAuctions[domain].highestBidder;
        domainsByOwner[domainAuctions[domain].highestBidder].push(domain);
        domainAuctions[domain].finalized = true;
        

        currentPhase = Phase.None;
        // Reset the bidders count for this domain
        // biddersCountByDomain[domain] = 0;
         currentBiddersCount=0;

    }
     // Fetching the HighestBidder & HighestBid
    function fetchHighestBid(string memory domain) public view returns (address, uint256) {
    Auction storage auction = domainAuctions[domain];
    return (auction.highestBidder, auction.highestBid);
}

    // Resolving Domains & Addresses
    function resolveDomainToAddress(string memory domain) external view returns (address) {
        return domainOwner[domain];
    }

    function resolveAddressToDomains(address Owner) external view returns (string[] memory) {
        return domainsByOwner[Owner];
    }
    function getBidderCount() public view returns (uint256) {
        return currentBiddersCount;
    }

    function getBiddersCountByDomain(string memory domain) public view returns (uint256 count) {
        return biddersCountByDomain[domain];
    }
     // Function to check if a player is registered
    function checkPlayerExists(address player) public view returns (bool) {
        for (uint256 i = 0; i < players.length; i++) {
            if (players[i] == player) {
                return true;
            }
        }
        return false;
    }
}
