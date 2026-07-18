const dns = require('dns');

dns.resolve6('db.xydlmavqlhfbtvsrlrtv.supabase.co', (err, addresses) => {
  if (err) {
    dns.resolve4('db.xydlmavqlhfbtvsrlrtv.supabase.co', (err4, addresses4) => {
      if (err4) {
        console.error('DNS resolve failed:', err4);
      } else {
        console.log('IPv4 addresses:', addresses4);
      }
    });
  } else {
    console.log('IPv6 addresses:', addresses);
  }
});

dns.resolveCname('db.xydlmavqlhfbtvsrlrtv.supabase.co', (err, addresses) => {
  if (err) {
    console.log('No CNAME records');
  } else {
    console.log('CNAME records:', addresses);
  }
});
