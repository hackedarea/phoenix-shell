const os = require("os");
const fs = require("fs");
const path = require("path");
const { clear } = require("console");

function ifconfigCommand(args) {
  if (args.includes("--help")) {
    try {
      const helpText = fs.readFileSync(path.resolve("./help/ifconfig.txt"), "utf-8");
      console.log(helpText);
    } catch {
      console.log("ifconfig: help file not found.");
    }
    return;
  }

  const showAll = args.includes("-a");
  const interfaces = os.networkInterfaces();

  Object.keys(interfaces).forEach((ifaceName) => {
    const ifaceList = interfaces[ifaceName];
    if (!ifaceList) return;

    // Filter out internal interfaces unless -a
    const visibleAddrs = showAll ? ifaceList : ifaceList.filter((i) => !i.internal);
    if (visibleAddrs.length === 0) return;

    console.log(`${ifaceName}: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>`);

    visibleAddrs.forEach((addr) => {
      const family = addr.family === "IPv4" ? "inet" : "inet6";
      console.log(
        `        ${family} ${addr.address}  netmask ${addr.netmask || "255.255.255.0"}`
      );
      if (addr.mac) console.log(`        ether ${addr.mac}`);
    });

    console.log("");
  });
}

module.exports = ifconfigCommand;