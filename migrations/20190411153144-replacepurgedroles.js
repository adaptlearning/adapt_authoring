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
    const roles = db.collection('roles');
    const users = db.collection('users');
    const replacements = [
      ['Product Manager', 'Course Creator'], 
      ['Tenant Admin', 'Super Admin']
    ];
    await Promise.all(replacements.map(async ([oldName, newName]) => {
      const [oldRole, newRole] = await Promise.all([ roles.find({ name: oldName }), roles.find({ name: newName }) ]);
      if(!oldRole) {
        return;
      }
      if(!newRole) {
        throw new Error(`Db must define the ${newRole} to replace ${oldRole}`);
      }
      await users.updateMany({ roles: { $in: [oldRole._id] } }, { $set: { roles: [newRole._id] } });
      await roles.deleteOne({ name: oldName });
    }));
  },

  async down(db, client) {}
};