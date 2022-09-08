/** 
 * GENERAL NOTES:
 * 
 * Both functions should return a Promise (and/or use async & await).
 * 
 * You can either access the DB directly via the Node.js MongoDB driver and the db param
 * See https://mongodb.github.io/node-mongodb-native/4.4/
 * 
 * You can also use the Origin APIs using the getApp function:
 * await this.getApp()
 */
 module.exports = {
  async up(db, client) {
    return db.dropCollection('sessions');
  },
  async down(db, client) {}
};