/**
 * The following roles have been removed: Product Manager, Course Creator
 * Any existing users with these roles will be mapped to Tenant Admin and Super Admin respectively.
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