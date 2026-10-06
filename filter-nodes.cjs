const fs = require('fs');

const data = fs.readFileSync('glb_report.txt', 'utf8');
const lines = data.split('\n');
const nodeMap = {
  wheels: [],
  tyres: [],
  brakes: [],
  calipers: [],
  suspension: [],
  engine: [],
  doors: [],
  lights: [],
  body: [],
  interior: []
};

for (const line of lines) {
  if (line.includes('[Mesh:')) {
    const match = line.match(/- (.+?) \[Mesh:/);
    if (match) {
      const name = match[1].toLowerCase();
      
      if (name.includes('rim') || name.includes('wheel')) nodeMap.wheels.push(name);
      if (name.includes('tire') || name.includes('tyre')) nodeMap.tyres.push(name);
      if (name.includes('disc') || name.includes('brake')) nodeMap.brakes.push(name);
      if (name.includes('caliper')) nodeMap.calipers.push(name);
      if (name.includes('suspension') || name.includes('spring') || name.includes('strut')) nodeMap.suspension.push(name);
      if (name.includes('engine') || name.includes('motor') || name.includes('powertrain')) nodeMap.engine.push(name);
      if (name.includes('door')) nodeMap.doors.push(name);
      if (name.includes('light')) nodeMap.lights.push(name);
      if (name.includes('body') || name.includes('bumper') || name.includes('hood') || name.includes('tailgate')) nodeMap.body.push(name);
      if (name.includes('interior') || name.includes('dash') || name.includes('seat') || name.includes('steer')) nodeMap.interior.push(name);
    }
  }
}

for (const [category, arr] of Object.entries(nodeMap)) {
  console.log(`\n--- ${category.toUpperCase()} ---`);
  if (arr.length === 0) console.log("None");
  else console.log([...new Set(arr)].join('\n'));
}
