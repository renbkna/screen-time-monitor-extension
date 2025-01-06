const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

module.exports = {
  mode: 'production',
  entry: {
    popup: './src/popup/popup.js',
    'background/service-worker': './src/background/service-worker.js',
    'content/content-script': './src/content/content-script.js'
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
    clean: true
  },
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          compress: {
            drop_console: true,
            drop_debugger: true
          }
        }
      }),
      new CssMinimizerPlugin()
    ]
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env'],
            plugins: ['@babel/plugin-transform-runtime']
          }
        }
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader', 'postcss-loader']
      },
      {
        test: /\.(png|jpg|jpeg|gif|svg)$/,
        type: 'asset',
        parser: {
          dataUrlCondition: {
            maxSize: 8 * 1024 // 8kb
          }
        }
      }
    ]
  },
  plugins: [
    new CleanWebpackPlugin(),
    new CopyPlugin({
      patterns: [
        { 
          from: 'src/manifest.json',
          transform: (content) => {
            const manifest = JSON.parse(content);
            // Remove development-specific permissions
            const prodPermissions = manifest.permissions.filter(
              perm => !['debugger'].includes(perm)
            );
            manifest.permissions = prodPermissions;
            return JSON.stringify(manifest, null, 2);
          }
        },
        { from: 'src/assets', to: 'assets' },
        { from: 'src/styles', to: 'styles' },
        { 
          from: 'src/**/*.html',
          to: '[name][ext]',
          globOptions: {
            ignore: ['**/tests/**']
          }
        }
      ]
    })
  ],
  resolve: {
    extensions: ['.js'],
    fallback: {
      path: false,
      fs: false
    }
  }
};