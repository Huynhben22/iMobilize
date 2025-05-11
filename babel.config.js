/*converts modern JS into code compatible with older JS engines */
module.exports = function(api) {
    api.cache(true);
    return {
      presets: ['babel-preset-expo'],
    };
  };