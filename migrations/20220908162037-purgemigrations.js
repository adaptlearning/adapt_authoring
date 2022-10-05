/** 
 * Removes the deprecated migrations database collection
 */
module.exports = {
  async up(db, client) {
    try {
      await db.dropCollection('migrations');
    } catch(e) {}
  },
  async down(db, client) {}
};