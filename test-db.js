const { execSync } = require('child_process');
try {
  const output = execSync('npx wrangler d1 execute pet-id-db --remote --command="SELECT * FROM shop_products LIMIT 1" --json').toString();
  console.log('Query successful');
  const data = JSON.parse(output);
  console.log('Sample data:', data[0].results[0]);
} catch (e) {
  console.error('Query failed:', e.message);
}
