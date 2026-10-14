const fs = require('fs');

const requiredKeywords = [
  "Car Mechanic",
  "24 Hrs car mechanic near me",
  "Car mechanic near shamshabad Hyderabad",
  "Car mechanic near me open now",
  "Car mechanic near Madhapur Hyderabad",
  "Car mechanic near me",
  "Doorstep car mechanic near me",
  "Mobile car mechanic near me",
  "Who is the best car mechanic near me in Hyderabad",
  "nearby car mechanic",
  "car mechanic",
  "nearby car mechanic shop",
  "best car mechanic near me",
  "online car mechanic near me",
  "online car mechanic",
  "car mechanic attapur",
  "car mechanic and electrician near me",
  "Jump start Service near me",
  "Jump Start",
  "a good car mechanic near me",
  "car mechanic battery jump start near me",
  "car mechanic book online",
  "auto repair shop",
  "mechanic near me",
  "brake repair",
  "oil change",
  "engine repair",
  "transmission repair",
  "tire replacement Hyderabad",
  "battery replacement Hyderabad",
  "check engine light Hyderabad",
  "auto mechanic Hyderabad",
  "car maintenance Hyderabad",
  "24/7 mechanic Hyderabad",
  "mobile mechanic Hyderabad",
  "car AC repair Hyderabad",
  "alternator replacement Hyderabad",
  "auto service center Hyderabad",
  "emergency car repair Hyderabad",
  "cheap car repair Hyderabad"
];

function checkContent(text) {
  // Strip HTML tags for clean word counting
  const plainText = text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  const words = plainText.split(' ').filter(w => w.length > 0);
  const wordCount = words.length;

  console.log(`\n========================================`);
  console.log(`Total Word Count: ${wordCount} words (Target: 700 - 1200 words)`);
  if (wordCount >= 700 && wordCount <= 1200) {
    console.log(`✅ Word count requirement satisfied!`);
  } else {
    console.log(`❌ Word count out of range! (${wordCount} words)`);
  }
  console.log(`========================================\n`);

  let missing = [];
  const lowerText = text.toLowerCase();

  requiredKeywords.forEach(kw => {
    const lowerKw = kw.toLowerCase();
    const count = (lowerText.match(new RegExp(lowerKw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
    if (count === 0) {
      missing.push(kw);
    } else {
      console.log(`✅ [${count}x] "${kw}"`);
    }
  });

  if (missing.length === 0) {
    console.log(`\n🎉 All ${requiredKeywords.length} keywords successfully verified in the text!`);
  } else {
    console.log(`\n❌ Missing keywords (${missing.length}):`, missing);
  }
}

module.exports = { checkContent, requiredKeywords };
