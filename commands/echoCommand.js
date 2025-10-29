function echoCommand(rawInput) {
  if (Array.isArray(rawInput)) {
    const args = rawInput;
    console.log(args.join(" "));
    return;
  }

  const line = String(rawInput || "");
  const out = line.length > 5 ? line.substring(5) : "";
  console.log(out);
}

module.exports = echoCommand;
