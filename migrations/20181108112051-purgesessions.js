/** 
 * Removes all old sessions from the database
 */
 module.exports = {
  async up(db, client) {
    try {
      await db.dropCollection('sessions');
    } catch(e) {}
  },
  async down(db, client) {}
};