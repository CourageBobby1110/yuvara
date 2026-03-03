const fs = require('fs');
const dns = require('dns');

dns.setServers(['8.8.8.8']);

Promise.all([
  new Promise((res) => dns.resolveSrv('_mongodb._tcp.yuvaras.pnnmbp1.mongodb.net', (e, a) => res(a))),
  new Promise((res) => dns.resolveTxt('yuvaras.pnnmbp1.mongodb.net', (e, a) => res(a)))
]).then(([srv, txt]) => {
  fs.writeFileSync('out.json', JSON.stringify({srv, txt}, null, 2));
});
