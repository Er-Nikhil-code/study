const text = "• Step 1: Convert ABCD16 to decimal. • Step 2: Convert 101011102 to decimal. • Answer: 43997.";
let result = text.replace(/•\s/g, '\n• ');
const lines = result.split("\n");
let inList = false;
const processedLines = [];

for (const line of lines) {
  const trimmed = line.trim();
  const isBullet = /^[•\-\*]\s/.test(trimmed);

  if (isBullet) {
    if (!inList) {
      processedLines.push('<ul class="math-list">');
      inList = true;
    }
    processedLines.push(`<li>${trimmed.replace(/^[•\-\*]\s/, "")}</li>`);
  } else {
    if (inList) {
      processedLines.push("</ul>");
      inList = false;
    }
    if (trimmed) {
      processedLines.push(`<p>${trimmed}</p>`);
    }
  }
}
if (inList) processedLines.push("</ul>");

console.log(processedLines.join("\n"));
