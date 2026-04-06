const hre = require("hardhat");

async function main() {
  const requireNodeRegistration = process.env.REQUIRE_NODE_REGISTRATION === "true";
  const crawler = await hre.ethers.deployContract("Crawler", [requireNodeRegistration]);

  await crawler.waitForDeployment();
  const contractAddress = await crawler.getAddress();

  console.log("Crawler deployed to:", contractAddress);
  console.log("requireNodeRegistration:", requireNodeRegistration);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
