const fs = require("fs");
const content = fs.readFileSync("lint_plain.txt", "utf16le");
console.log(content.slice(0, 2000)); // Print first 2000 chars
