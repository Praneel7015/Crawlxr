// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract Crawler {
    struct CrawlData {
        string url;
        bytes32 contentHash;
        uint256 timestamp;
        address crawler;
    }

    event CrawlRecorded(string indexed url, bytes32 indexed contentHash, uint256 timestamp, address indexed crawler);
    event NodeRegistered(address indexed node);
    event CrawlTaskClaimed(string indexed url, address indexed crawler);

    mapping(bytes32 => CrawlData) private crawlRecords;
    mapping(bytes32 => bool) private crawled;

    mapping(address => bool) public registeredNodes;
    mapping(bytes32 => bool) public taskClaimed;
    mapping(bytes32 => address) public taskClaimer;

    address public immutable owner;
    bool public requireNodeRegistration;

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    modifier canCrawl() {
        if (requireNodeRegistration) {
            require(registeredNodes[msg.sender] || msg.sender == owner, "Node not registered");
        }
        _;
    }

    constructor(bool _requireNodeRegistration) {
        owner = msg.sender;
        requireNodeRegistration = _requireNodeRegistration;
        registeredNodes[msg.sender] = true;
        emit NodeRegistered(msg.sender);
    }

    function setRequireNodeRegistration(bool enabled) external onlyOwner {
        requireNodeRegistration = enabled;
    }

    function registerNode() external {
        require(!registeredNodes[msg.sender], "Already registered");
        registeredNodes[msg.sender] = true;
        emit NodeRegistered(msg.sender);
    }

    function claimCrawlTask(string calldata url) external canCrawl returns (bool) {
        bytes32 key = _urlKey(url);
        require(bytes(url).length > 0, "URL required");
        require(!crawled[key], "Already crawled");
        require(!taskClaimed[key], "Task already claimed");

        taskClaimed[key] = true;
        taskClaimer[key] = msg.sender;
        emit CrawlTaskClaimed(url, msg.sender);
        return true;
    }

    function addCrawlRecord(string calldata url, bytes32 contentHash) external canCrawl {
        require(bytes(url).length > 0, "URL required");
        require(contentHash != bytes32(0), "Invalid hash");

        bytes32 key = _urlKey(url);
        require(!crawled[key], "URL already crawled");

        if (taskClaimed[key]) {
            require(taskClaimer[key] == msg.sender, "Task claimed by another node");
            delete taskClaimed[key];
            delete taskClaimer[key];
        }

        crawlRecords[key] = CrawlData({
            url: url,
            contentHash: contentHash,
            timestamp: block.timestamp,
            crawler: msg.sender
        });
        crawled[key] = true;

        emit CrawlRecorded(url, contentHash, block.timestamp, msg.sender);
    }

    function hasCrawled(string calldata url) external view returns (bool) {
        return crawled[_urlKey(url)];
    }

    function verifyCrawl(string calldata url)
        external
        view
        returns (bool exists, bytes32 contentHash, uint256 timestamp, address crawler)
    {
        bytes32 key = _urlKey(url);
        if (!crawled[key]) {
            return (false, bytes32(0), 0, address(0));
        }

        CrawlData memory record = crawlRecords[key];
        return (true, record.contentHash, record.timestamp, record.crawler);
    }

    function getCrawlData(string calldata url) external view returns (CrawlData memory) {
        bytes32 key = _urlKey(url);
        require(crawled[key], "No crawl record");
        return crawlRecords[key];
    }

    function _urlKey(string calldata url) private pure returns (bytes32) {
        return keccak256(bytes(url));
    }
}
