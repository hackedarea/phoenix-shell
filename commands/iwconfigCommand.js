const os = require("os");
const fs = require("fs");
const path = require("path");
const { spawnSync } = require('child_process');

/**
 * Displays wireless interface configuration information
 * Shows SSID, frequency, link quality, signal strength, and encryption details
 */

// Simulated wireless interface database
const wirelessInterfaceDB = {
    wlan0: {
        essid: "MyNetwork",
        mode: "Managed",
        frequency: "2.437 GHz",
        channel: 6,
        accessPoint: "00:1A:2B:3C:4D:5E",
        linkQuality: "70/70",
        signalLevel: "-30 dBm",
        noisyLevel: "-80 dBm",
        encryption: "WPA2",
        bitRate: "150 Mb/s",
        txPower: "20 dBm",
        sensitivity: "-80"
    },
    wlan1: {
        essid: "GuestNetwork",
        mode: "Managed",
        frequency: "5.180 GHz",
        channel: 36,
        accessPoint: "00:1A:2B:3C:4D:5F",
        linkQuality: "60/70",
        signalLevel: "-40 dBm",
        noisyLevel: "-85 dBm",
        encryption: "WPA3",
        bitRate: "300 Mb/s",
        txPower: "17 dBm",
        sensitivity: "-85"
    }
};

// Store for user-configured settings
const configuredSettings = {};

function showAllInterfaces() {
    const interfaces = os.networkInterfaces();
    let found = false;

    Object.keys(interfaces).forEach((ifaceName) => {
        const ifaceList = interfaces[ifaceName];
        if (!ifaceList) return;

        // Show wireless interfaces or simulated ones
        if (wirelessInterfaceDB[ifaceName] || ifaceName.startsWith("wlan") || ifaceName.startsWith("wlp")) {
            showInterfaceInfo(ifaceName);
            found = true;
        }
    });

    // Show simulated interfaces if no real wireless interfaces found
    if (!found) {
        Object.keys(wirelessInterfaceDB).forEach(ifaceName => {
            showInterfaceInfo(ifaceName);
        });
    }
}

function showInterfaceInfo(ifaceName) {
    let data = wirelessInterfaceDB[ifaceName] || {
        essid: "off/any",
        mode: "Managed",
        frequency: "2.412 GHz",
        channel: 1,
        accessPoint: "Not Associated",
        linkQuality: "0/70",
        signalLevel: "-100 dBm",
        noisyLevel: "-100 dBm",
        encryption: "off",
        bitRate: "0 Mb/s",
        txPower: "20 dBm",
        sensitivity: "-80"
    };

    // Apply user configurations if any
    if (configuredSettings[ifaceName]) {
        data = { ...data, ...configuredSettings[ifaceName] };
    }

    console.log(`${ifaceName}    IEEE 802.11  ESSID:"${data.essid}"`);
    console.log(`          Mode:${data.mode}   Frequency:${data.frequency}   Channel:${data.channel}`);
    console.log(`          Access Point: ${data.accessPoint}`);
    console.log(`          Link Quality=${data.linkQuality}   Signal level=${data.signalLevel}`);
    console.log(`          Rx invalid nwid:0   Rx invalid crypt:0   Rx invalid frag:0`);
    console.log(`          Tx excessive retries:0   Invalid misc:0   Missed beacon:0`);
    console.log(`          Bit Rate:${data.bitRate}   Tx-Power:${data.txPower}`);
    console.log(`          Sensitivity:${data.sensitivity}`);
    console.log(`          Encryption key:${data.encryption}`);
    console.log("");
}

function setEssid(ifaceName, essid) {
    if (!configuredSettings[ifaceName]) {
        configuredSettings[ifaceName] = {};
    }
    configuredSettings[ifaceName].essid = essid.replace(/^['"]|['"]$/g, '');
    console.log(`Set ESSID to "${configuredSettings[ifaceName].essid}" on ${ifaceName}`);
}

function setMode(ifaceName, mode) {
    const validModes = ["Managed", "Ad-Hoc", "Monitor", "Master"];
    if (!validModes.includes(mode)) {
        console.log(`iwconfig: Invalid mode "${mode}". Valid modes: ${validModes.join(", ")}`);
        return;
    }
    if (!configuredSettings[ifaceName]) {
        configuredSettings[ifaceName] = {};
    }
    configuredSettings[ifaceName].mode = mode;
    console.log(`Set mode to ${mode} on ${ifaceName}`);
}

function setChannel(ifaceName, channel) {
    const ch = parseInt(channel);
    if (isNaN(ch) || ch < 1 || ch > 165) {
        console.log(`iwconfig: Invalid channel "${channel}". Valid range: 1-165`);
        return;
    }
    if (!configuredSettings[ifaceName]) {
        configuredSettings[ifaceName] = {};
    }
    configuredSettings[ifaceName].channel = ch;
    // Update frequency based on channel (simplified 2.4GHz calculation)
    const freq = (2.407 + (ch * 0.005)).toFixed(3);
    configuredSettings[ifaceName].frequency = `${freq} GHz`;
    console.log(`Set channel to ${ch} on ${ifaceName}`);
}

function setFrequency(ifaceName, freq) {
    // Validate frequency format (e.g., "2.437G" or "5.180G")
    if (!freq.match(/^\d+\.\d+G$/)) {
        console.log(`iwconfig: Invalid frequency format. Use format like "2.437G" or "5.180G"`);
        return;
    }
    if (!configuredSettings[ifaceName]) {
        configuredSettings[ifaceName] = {};
    }
    configuredSettings[ifaceName].frequency = freq.replace("G", " GHz");
    console.log(`Set frequency to ${freq} on ${ifaceName}`);
}

function setEncryption(ifaceName, key) {
    if (key === "off" || key === "s:") {
        if (!configuredSettings[ifaceName]) {
            configuredSettings[ifaceName] = {};
        }
        configuredSettings[ifaceName].encryption = "off";
        console.log(`Encryption disabled on ${ifaceName}`);
        return;
    }

    if (key.startsWith("s:")) {
        // WEP with ASCII password
        const password = key.substring(2);
        if (password.length < 5) {
            console.log(`iwconfig: WEP key too short. Minimum 5 characters`);
            return;
        }
        if (!configuredSettings[ifaceName]) {
            configuredSettings[ifaceName] = {};
        }
        configuredSettings[ifaceName].encryption = "WEP";
        console.log(`Set WEP encryption with password on ${ifaceName} (Warning: WEP is deprecated)`);
        return;
    }

    console.log(`iwconfig: Invalid encryption key format`);
}

function setSensitivity(ifaceName, sens) {
    const sensitivity = parseInt(sens);
    if (isNaN(sensitivity) || sensitivity < -100 || sensitivity > 0) {
        console.log(`iwconfig: Invalid sensitivity value. Valid range: -100 to 0`);
        return;
    }
    if (!configuredSettings[ifaceName]) {
        configuredSettings[ifaceName] = {};
    }
    configuredSettings[ifaceName].sensitivity = sensitivity.toString();
    console.log(`Set sensitivity to ${sensitivity} on ${ifaceName}`);
}

function showHelp() {
    const helpPath = path.join(__dirname, "..", "help", "iwconfig.txt");
    try {
        if (fs.existsSync(helpPath)) {
            const content = fs.readFileSync(helpPath, "utf8");
            console.log(content);
        } else {
            console.log(`iwconfig: help file not found: ${helpPath}`);
        }
    } catch (err) {
        console.log(`iwconfig: failed to read help file: ${err.message}`);
    }
}

function iwconfigCommand(args) {
    args = Array.isArray(args) ? args : [];

    // If not running on Linux, show the simulated data and a clear notice.
    if (process.platform !== 'linux') {
        console.log("iwconfig: NOTE: displayed data is manually added sample output. 'iwconfig' works only on Linux.");
        showAllInterfaces();
        return;
    }

    // Try to run system iwconfig when available. If it exists, forward its output.
    const trySystemIwconfig = (argsArray) => {
        try {
            const res = spawnSync('iwconfig', argsArray, { encoding: 'utf8' });
            if (res.error && res.error.code === 'ENOENT') {
                return false; // iwconfig not installed
            }
            if (res.stdout) process.stdout.write(res.stdout);
            if (res.stderr) process.stderr.write(res.stderr);
            return true;
        } catch (e) {
            return false;
        }
    };

    if (trySystemIwconfig(args)) {
        return;
    }

    // If we reach here, either iwconfig is not installed or executing it failed.
    // Fall back to simulated behavior but notify the user.
    console.log('iwconfig: system iwconfig not found or failed — using simulated output');

    // Handle help
    if (args.length === 0 || args[0] === "--help" || args[0] === "-h") {
        if (args.length === 0) {
            showAllInterfaces();
        } else {
            showHelp();
        }
        return;
    }

    // Single interface query
    if (args.length === 1) {
        const ifaceName = args[0];
        if (wirelessInterfaceDB[ifaceName] || ifaceName.startsWith("wlan") || ifaceName.startsWith("wlp")) {
            showInterfaceInfo(ifaceName);
        } else {
            console.log(`iwconfig: Unknown interface "${ifaceName}"`);
        }
        return;
    }

    // Configuration: iwconfig interface parameter value
    if (args.length >= 3) {
        const ifaceName = args[0];
        const parameter = args[1];
        const value = args.slice(2).join(" ");

        switch (parameter.toLowerCase()) {
            case "essid":
                setEssid(ifaceName, value);
                break;
            case "mode":
                setMode(ifaceName, value);
                break;
            case "channel":
                setChannel(ifaceName, value);
                break;
            case "freq":
            case "frequency":
                setFrequency(ifaceName, value);
                break;
            case "key":
            case "enc":
            case "encryption":
                setEncryption(ifaceName, value);
                break;
            case "sens":
            case "sensitivity":
                setSensitivity(ifaceName, value);
                break;
            default:
                console.log(`iwconfig: Unknown parameter "${parameter}"`);
        }
        return;
    }

    // Invalid arguments
    console.log("iwconfig: insufficient arguments");
    console.log("Use 'iwconfig --help' for more information");
}

module.exports = iwconfigCommand;
