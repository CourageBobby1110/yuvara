const mongoose = require('mongoose');

const uri = 'mongodb://yuvara:iKbC3P0NrXdwNzh5@ac-8nggafi-shard-00-00.pnnmbp1.mongodb.net:27017,ac-8nggafi-shard-00-01.pnnmbp1.mongodb.net:27017,ac-8nggafi-shard-00-02.pnnmbp1.mongodb.net:27017/yuvaras?authSource=admin&replicaSet=atlas-uzmu48-shard-0&appName=yuvaras&ssl=true';

mongoose.connect(uri)
  .then(() => {
    console.log('Connected successfully!');
    process.exit(0);
  })
  .catch(err => {
    console.error('Connection error:', err);
    process.exit(1);
  });
