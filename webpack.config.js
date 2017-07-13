module.exports = {
  module: {
    rules: [
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
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
