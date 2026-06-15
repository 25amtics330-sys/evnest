const http = require('http');

const tests = [
  'find CCS charger in junagadh',
  'fast charger in saputara',
  'nexon ev charger in gandhinagar',
  'charger in somewhere unknown',
  'Type2 rapid charger near Bhuj under 15',
];

async function testQuery(msg) {
  return new Promise((resolve) => {
    const d = JSON.stringify({ message: msg });
    const req = http.request(
      { hostname: 'localhost', port: 5000, path: '/api/ai/search', method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(d) } },
      (res) => {
        let b = '';
        res.on('data', (c) => { b += c; });
        res.on('end', () => {
          try {
            const j = JSON.parse(b);
            console.log(`MSG: "${msg}"`);
            console.log(`  => loc=${j.query?.location}, conn=${j.query?.connectorType}, max=₹${j.query?.maxPrice}, count=${j.chargers?.length}`);
            console.log(`  => ${j.suggestion}`);
            console.log('');
          } catch (e) {
            console.log('PARSE ERR:', b.substring(0, 200));
          }
          resolve();
        });
      }
    );
    req.write(d);
    req.end();
  });
}

(async () => {
  for (const t of tests) {
    await testQuery(t);
  }
})();
