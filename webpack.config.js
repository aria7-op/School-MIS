const path = require('path');

module.exports = {
  mode: 'production',
  entry: './app.js',
  target: 'node',
  externals: [
    // Only keep native modules external
    'bcrypt',
    'fluent-ffmpeg',
    'pg-native',
    'canvas',
    'sharp'
  ],
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
    libraryTarget: 'commonjs2'
  },
  optimization: {
    minimize: true
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              ['@babel/preset-env', {
                targets: {
                  node: '24'
                }
              }]
            ]
          }
        }
      }
    ]
  },
  resolve: {
    extensions: ['.js', '.json']
  },
  ignoreWarnings: [
    /Critical dependency/,
    /Module not found/,
    /Can't resolve/
  ]
}; 