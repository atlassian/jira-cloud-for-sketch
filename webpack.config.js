var path = require('path')

module.exports = {
  module: {
    rules: [
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      },
      {
        test: /\.txt$/,
        use: ['raw-loader']
      },
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            babelrc: true
          }
        }
      },
      {
        /*
        ASP-63: some dependencies use the 'const' keyword, which
        causes Safari to barf in strict mode. This loader transforms
        them to ES5.
        */
        test: /\.jsx?$/,
        include: [
          path.resolve(__dirname, 'node_modules/sketch-module-user-preferences'),
          path.resolve(__dirname, 'node_modules/sketch-polyfill-fetch-babel-safe'),
          path.resolve(__dirname, 'node_modules/cocoascript-class-babel-safe')
        ],
        use: {
          loader: 'babel-loader',
          options: {
            babelrc: false,
            presets: ['es2015']
          }
        }
      },
      {
        /*
        Several sketch modules clear the coscript shouldKeepAround flag, which
        can cause the Mocha context to be prematurely destroyed, which crashes
        Sketch. This loader removes those statements, allowing our plugin to
        explicitly handle its own coscript lifecycle.
        */
        test: /node_modules\/sketch-.*\/.*\.js/,
        loader: 'regexp-replace-loader',
        options: {
          match: {
            pattern: '(coscript\\.setShouldKeepAround\\(false\\)|coscript\\.shouldKeepAround = false)',
            flags: 'ig'
          },
          replaceWith: '/* REMOVED coscript shouldKeepAround false */'
        }
      }
    ]
  },
  node: {
    setImmediate: false
  }
}
