/** 
 * GENERAL NOTES:
 * 
 * Both functions should return a Promise (and/or use async & await).
 * 
 * You can either access the DB directly via the Node.js MongoDB driver and the db param
 * See https://mongodb.github.io/node-mongodb-native/4.4/
 */
module.exports = {
  async up(db, client) {
    // Code to migrate old data goes here
  },
  async down(db, client) {
    // Code to rollback your migration goes here (if possible)
  }
};