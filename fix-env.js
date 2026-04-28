const fs = require('fs');
const path = '.env.local';
if (fs.existsSync(path)) {
  const buf = fs.readFileSync(path);
  if (buf.includes(0)) {
    console.log('Null bytes found in .env.local, fixing...');
    const fixed = buf.filter(b => b !== 0);
    fs.writeFileSync(path, fixed);
    console.log('Fixed .env.local');
  } else {
    console.log('.env.local is clean');
  }
}
const path2 = '.env';
if (fs.existsSync(path2)) {
  const buf = fs.readFileSync(path2);
  if (buf.includes(0)) {
    console.log('Null bytes found in .env, fixing...');
    const fixed = buf.filter(b => b !== 0);
    fs.writeFileSync(path2, fixed);
    console.log('Fixed .env');
  } else {
    console.log('.env is clean');
  }
}
