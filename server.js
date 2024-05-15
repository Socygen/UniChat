if(process.env.NODE_ENV !== "production"){
  require("dotenv").config();
}
const { Server } = require("socket.io");
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const port = 10000;
const http = require('http')
const server = http.createServer(app)
const chatSocket = require('./src/socekts/chatSocket');
const cron = require('node-cron');
const Message = require('./src/models/message');
const mongoose = require('mongoose');

const io = new Server(server, {
  cors: {
    origin: "*"
  }
})

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

require('./src/config/database');
const my_routes = require('./src/routes');

app.get('/', (req, res) => {
  res.send('API IS RUNNING ...');
});

app.use('/', my_routes);
chatSocket(io);

mongoose.connect(process.env.DB, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('Bot Connected To Database ...'))
.catch(err => console.error('MongoDB connection error:', err));

async function deleteMessages() {
  try {
    const messagesToDelete = await Message.find({
      $and: [
        { receiverone: { $exists: true, $ne: '' } },
        { receivertwo: { $exists: true, $ne: '' } }
      ]
    });

    if (messagesToDelete.length > 0) {
      await Message.deleteMany({
        _id: { $in: messagesToDelete.map(msg => msg._id) }
      });
      console.log(`${messagesToDelete.length} Messages Deleted ...`);
    } else {
      console.log('No Messages Found To Delete ...');
    }
  } catch (error) {
    console.error('Error Deleting Messages:', error);
  }
}

cron.schedule('*/1 * * * *', deleteMessages);

console.log('Auto Delete Bot Started ...');

server.listen(port, () => {
  console.log(`Server Is Listening At Port : ${port}`);
});
