const dns = require('dns');

const regions = [
  'ap-southeast-1', // Singapore
  'ap-southeast-2', // Sydney
  'ap-northeast-1', // Tokyo
  'ap-northeast-2', // Seoul
  'ap-south-1',     // Mumbai
  'us-east-1',      // N. Virginia
  'us-east-2',      // Ohio
  'us-west-1',      // N. California
  'us-west-2',      // Oregon
  'eu-west-1',      // Ireland
  'eu-west-2',      // London
  'eu-west-3',      // Paris
  'eu-central-1',   // Frankfurt
  'sa-east-1',      // Sao Paulo
];

console.log('Resolving pooler hosts for regions...');

regions.forEach(region => {
  const host = `aws-0-${region}.pooler.supabase.com`;
  dns.lookup(host, (err, address) => {
    if (!err) {
      console.log(`Region ${region} resolves to: ${address} (${host})`);
    }
  });
});
