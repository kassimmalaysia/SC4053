// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract NtuDomainRegistrar {
    address private owner;
    constructor() {
        // Set the contract deployer's address as the owner during deployment
        owner = msg.sender;
        // Call the initialization function for each domain
        for (uint256 i = 0; i < domainsInCommitPhase.length; i++) {
            initializeDomainPhase(domainsInCommitPhase[i]);
        }
    }
    // Array to store domains that have started the commit phase
    string[] public domainsInCommitPhase;

    address[] public players;
    uint256 public currentBiddersCount; // To keep track of the number of bidders
    enum Phase {None, Commit, Reveal,Finalizing}

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

    event BidderCountChanged(uint256 newBidderCount);
    event PhaseChanged(Phase phase);
 
    mapping(string => address) public domainOwner;     // Maps domain to owner address
    mapping(address => string[]) public domainsByOwner; // Bonus requirement: reverse lookup

    mapping(string => mapping(address => Bid)) public bids;  // Maps domain to user bids
    mapping(string => Auction) public domainAuctions;
    mapping(string => uint256) public biddersCountByDomain; // Track bidders count for each domain
    mapping(string => Phase) public currentPhase; // Map domain to its current phase

    uint256 public phaseEndTime;
    uint256 public commitPhaseDuration = 1 minutes;  // Less than 3 minutes as required

    function getOwner() public view returns (address) {
        return owner;
    }

    function initializeDomainPhase(string memory domain) internal {
        currentPhase[domain] = Phase.None;
    }

    function phaseToString(Phase phase) internal pure returns (string memory) {

        if (phase == Phase.None) {
            return "None";
        } else if (phase == Phase.Commit) {
            return "Commit";
        } else if (phase == Phase.Reveal) {
            return "Reveal";
        }else if (phase == Phase.Finalizing) {
            return "Finalizing";
        } 
   
        // Add more cases if necessary
        return "Unknown";     
    }

    function retrieveDomainPhase(string memory domain) public view returns (string memory) {
        Phase phase = currentPhase[domain];
        return phaseToString(phase);
    
    }

    // Commit Phase
    function startCommitPhase(string memory domain) external {
        //require(currentPhase[domain] == Phase.None, "Cannot start commit phase now");
        require(!domainAuctions[domain].finalized, "Domain has already been auctioned off");
        currentPhase[domain] = Phase.Commit;
        phaseEndTime = block.timestamp + commitPhaseDuration;

    }

    function commitBid(string memory domain, uint256 value, string memory secret) external payable {
        require(currentPhase[domain] == Phase.Commit, "Not in commit phase");
        require(!domainAuctions[domain].finalized, "Domain has already been auctioned off"); // Ensure domain hasn't been finalized

        bytes32 commitment = keccak256(abi.encodePacked(msg.sender, value, secret));
        require(bids[domain][msg.sender].commitment == 0, "Bid already made");

         if (!isDomainInCommitPhase(domain)) {
            domainsInCommitPhase.push(domain);
        }

        bids[domain][msg.sender] = Bid({
            commitment: commitment,
            deposit: msg.value
            
        });

        // Increment the bidders count for this domain
        biddersCountByDomain[domain]++;
        emit BidderCountChanged(biddersCountByDomain[domain]);
        // Emit the LogBid event
        emit LogBid(msg.sender, domain, value, secret);

    }

    // Reveal Phase
    function startRevealPhase(string memory domain) external {
        require(block.timestamp > phaseEndTime, "Commit phase not over");
        require(currentPhase[domain] == Phase.Commit, "Cannot start reveal phase now");
        currentPhase[domain] = Phase.Reveal;
    }

    function revealBid(string memory domain, uint256 value, string memory secret) external {
        require(currentPhase[domain] == Phase.Reveal, "Not in reveal phase");
        
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

    }

    // Function to remove a domain from the list of domains in commit phase
    function removeDomainFromCommitPhase(string memory domain) internal {
        for (uint256 i = 0; i < domainsInCommitPhase.length; i++) {
            if (keccak256(abi.encodePacked(domainsInCommitPhase[i])) == keccak256(abi.encodePacked(domain))) {
                // Remove the domain from the array
                if (i < domainsInCommitPhase.length - 1) {
                    domainsInCommitPhase[i] = domainsInCommitPhase[domainsInCommitPhase.length - 1];
                }
                domainsInCommitPhase.pop();
                break;
            }
        }
    }
   

    // Finalizing Auction
    function finalizeAuction(string memory domain) external {
        require(currentPhase[domain] == Phase.Reveal, "Not in reveal phase");
        require(!domainAuctions[domain].finalized, "Auction already finalized");

        domainOwner[domain] = domainAuctions[domain].highestBidder;
        domainsByOwner[domainAuctions[domain].highestBidder].push(domain);
        domainAuctions[domain].finalized = true;

        currentPhase[domain] = Phase.Finalizing;
        //Remove the domain from the list of domains in the commit phase
        removeDomainFromCommitPhase(domain);

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

    function isDomainInCommitPhase(string memory domain) internal view returns (bool) {

        for (uint256 i = 0; i < domainsInCommitPhase.length; i++) {
            if (keccak256(abi.encodePacked(domainsInCommitPhase[i])) == keccak256(abi.encodePacked(domain))) {
                return true;
            }
        }
        return false;
    }

    // Function to get the list of domains in commit phase
    function getDomainsInCommitPhase() external view returns (string[] memory) {
        return domainsInCommitPhase;
    }
}
