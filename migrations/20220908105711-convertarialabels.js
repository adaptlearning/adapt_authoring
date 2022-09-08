const origin = require('../lib/application');
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
    const collection = db.collection('configs');
    const oldDefaults = {
      _menu: 1,
      _menuGroup: 2,
      _menuItem: 2,
      _page: 1,
      _article: 2,
      _block: 3,
      _component: 4,
      _componentItem: 5,
      _notify: 1,
    };
    const props = origin().db.getModel('config')?.schema?.tree?._accessibility?._ariaLevels?.properties;
    if(!props) {
      throw new Error(`Couldn't parse ARIA level defaults`);
    }
    const newDefaults = Object.entries(props).reduce((m, [k, v]) => Object.assign(m, { [k]: v.default }), {});
    const configs = await (collection.find().toArray());

    await Promise.all(configs.map(async c => {
      if(!c?._accessibility?._ariaLevels) {
        return;
      }
      const levels = c._accessibility._ariaLevels;
      Object.entries(levels).forEach(([k, v]) => levels[k] = (v === oldDefaults[k]) ? newDefaults[k] : v.toString());
      return collection.updateOne({ _id: c._id }, c);
    }));
    throw new Error();
  },

  async down(db, client) {}
};