set -x

#!/bin/bash

echo "Setting up MongoDB in /opt/render/project/src"

# Set up directories
MONGODB_HOME="/opt/render/project/src/mongodb"
DATA_DIR="$MONGODB_HOME/data"
LOG_DIR="$MONGODB_HOME/log"

mkdir -p $MONGODB_HOME
mkdir -p $DATA_DIR
mkdir -p $LOG_DIR

# Download MongoDB
cd /opt/render/project/src
curl -O https://fastdl.mongodb.org/linux/mongodb-linux-x86_64-debian10-6.0.15.tgz
tar -zxvf mongodb-linux-x86_64-debian10-6.0.15.tgz
mv mongodb-linux-x86_64-debian10-6.0.15/* $MONGODB_HOME
rm -rf mongodb-linux-x86_64-debian10-6.0.15.tgz mongodb-linux-x86_64-debian10-6.0.15

# Set up PATH
echo "export PATH=$MONGODB_HOME/bin:\$PATH" >> $HOME/.bashrc
source $HOME/.bashrc

# Create a MongoDB configuration file
cat > $MONGODB_HOME/mongod.conf <<EOL
storage:
  dbPath: $DATA_DIR
systemLog:
  destination: file
  path: $LOG_DIR/mongod.log
  logAppend: true
net:
  bindIp: 127.0.0.1
  port: 27017
EOL

echo "MongoDB setup complete. You can start MongoDB with:"
echo "$MONGODB_HOME/bin/mongod --config $MONGODB_HOME/mongod.conf --fork"

echo "To use MongoDB in your application, connect to: mongodb://127.0.0.1:27017"

echo "Done"
