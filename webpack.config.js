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
        use: 
        { 
          loader: 'babel-loader',
          options: 
            { 
              babelrc: false,
              plugins: [ 'babel-plugin-add-module-exports' ],
              presets: [ 'es2015', 'react' ] 
            } 
          } 
      } 
    ] 
  }      
}
