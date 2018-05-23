define(function (require) {

  let Job = require('core/job');
  let {Backbone: {View, Model}, _} = require('lib');

  /**
   * This App provides a class for creating different kinds of analysis tools
   * Do not use this class directly, extend it instead.
   */
  return View.extend({

    initialize(config) {
      this.model = new Model(_.extend({
        'e': '#root',
        'baseUrl': '',
        'title': 'Mapper'
      }, config));

      this.willMount();
      this.setElement(_.guard(this.model.get('root'), '#root'));
      this.didMount();
    },

    willMount() {
    },

    didMount() {
    },

    /**
     * Call this method to generate the url for your app.
     * Don't hard code URL.
     *
     * @param path
     * @returns {string}
     */
    url(path) {
      return [this.model.get('baseURL'), 'app', path].join('/');
    },

    render() {
      // abstract method
    },

    createJob(name, params) {
      return new Job(this, name, params)
    }
  });
});
